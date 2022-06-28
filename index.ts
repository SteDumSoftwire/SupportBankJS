import {json} from "stream/consumers";
import {debug} from "util";
import {XMLParser} from "fast-xml-parser";

const xmlOptions = {
    ignoreAttributes: false,
    attributeNamePrefix : "@_"
};

const log4js = require('log4js')
const parser = new XMLParser(xmlOptions)

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});

const logger = log4js.getLogger();
logger.level = debug;

let personList: Array<Person> = [];
let accountList: Array<Account> = [];
let transactionList: Array<Transaction> = [];

const readlineSync = require('readline-sync')
const moment = require('moment')
const csv = require('csv-parser')
const fs = require('fs')

class Transaction {
    from: Account;
    to: Account;
    narative: string;
    amount: number;
    date: Date;
    constructor(date:Date, from: Account, to: Account, narative: string, amount: number) {
        this.from = from;
        this.to = to;
        this.narative = narative;
        this.amount = amount;
        this.date = date;
    }
    toString(): string {
        let out = '';
        out += "From: " + this.from.owner.name + "; ";
        out += "To: " + this.to.owner.name + "; ";
        out += "Amount: " + this.amount + "; ";
        out += "Narative " + this.narative + "; ";
        out += "Date: " + this.date;
        return out;
    }
}

class Person {
    name: string
    constructor(name: string) {
        this.name = name;
    }
}

class Account {
    owner: Person;
    balance: number;
    constructor(owner: Person) {
        this.owner = owner;
        this.balance = 0;
    }

    changeBalance(amount: number): void {
        this.balance += amount;
    }

    toString() : string {
        let out = '';
        out += "Owner: " + this.owner.name;
        out += "; Balance: " + this.balance;
        return out;
    }
}

function getPerson(personList: Array<Person>, name: string): Person | null {
    for (let pers of personList) {
        if (pers.name == name) {
            return pers;
        }
    }
    return null;
}

function getAccount(accountList: Array<Account>, name: string): Account | null {
    for (let account of accountList) {
        if (account.owner.name == name) {
            return account;
        }
    }
    return null;
}

async function listenInput() {
    logger.trace('Enter listenInput function');
    parseXML('Transactions2012.xml');
    while(1) {
        let inputString = readlineSync.question('Enter Command: ');
        if (inputString == 'List All') {
            for (let account of accountList) {
                console.log(account.toString());
            }

        } else if (inputString.includes('List')) {
            let accountName = inputString.split('[')[1].split(']')[0];
            let filteredTransactions = transactionList.filter(function (transaction) {
                return transaction.from.owner.name == accountName || transaction.to.owner.name == accountName;
            });
            for (let transaction of filteredTransactions) {
                console.log(transaction.toString());
            }
        } else if (inputString == 'Quit') {
            return;
        } else if (inputString.includes('Import File')) {
            let filename = inputString.split(' ')[2];
            let tmp = filename;
            let ext = tmp.split('.').pop();
            if (ext == 'json') {
                parseJSON(filename);
            } else if (ext == 'csv') {
                await parseCSV(filename);
            } else if (ext == 'xml') {
                parseXML(filename);
            }

        } else if (inputString.includes('Export File')) {
            let filename = inputString.split(' ')[2];
            exportData(filename);
        } else {
            console.log('Wrong input!');
        }
    }
}

async function parseCSV(filePath: string) {
    let reader = fs.createReadStream(filePath)
        .pipe(csv());
    let lineIndex = 1;
    return new Promise<void>((resolve, reject) => {
        reader.on('data', (data: any) => {
            extractData(data, lineIndex);
            lineIndex++;
        });
        reader.on('end', () => resolve());
    })
}

function parseJSON(filename: string) {
    let data = JSON.parse(fs.readFileSync(filename));
    let objIdx = 1;
    for (let el of data) {
        extractData(el, objIdx);
        objIdx++;
    }
}

function parseXML(filename: string) {
    let parsedXML = parser.parse(fs.readFileSync(filename));
    let jsonArr = parsedXML["TransactionList"]["SupportTransaction"];
    for (let i = 0; i < jsonArr.length; i++) {
        jsonArr[i]["From"] = jsonArr[i]["Parties"]["From"];
        jsonArr[i]["To"] = jsonArr[i]["Parties"]["To"];
        jsonArr[i]["Amount"] = jsonArr[i]["Value"];
        jsonArr[i]["Narrative"] = jsonArr[i]["Description"];
        jsonArr[i]["Date"] = new Date(Number(jsonArr[i]["@_Date"]) * 3600 * 1000);
        delete jsonArr[i]["Parties"];
        delete jsonArr[i]["Value"];
        delete jsonArr[i]["Value"];
        delete jsonArr[i]["Description"];
        delete jsonArr[i]["@_Date"];
        extractData(jsonArr[i], i);
    }
}

function extractData(data: any, lineIndex: number): void {
    let fromPerson = getPerson(personList, data["From"]);
    let toPerson = getPerson(personList, data["To"]);
    let date = moment(data["Date"], "DD/MM/YYYY");
    if (!date.isValid()) {
        logger.debug(lineIndex + ": "+ date.toDate());
        return;
    }
    if (isNaN(Number(data["Amount"]))) {
        logger.debug(lineIndex + ": " + "NaN");
        return;
    }
    if (fromPerson == null) {
        personList.push(new Person(data["From"]));
        accountList.push(new Account(getPerson(personList, data["From"])!));
    }
    if (toPerson == null) {
        personList.push(new Person(data["To"]));
        accountList.push(new Account(getPerson(personList, data["To"])!));
    }
    getAccount(accountList, data["From"])!.changeBalance(Number(data["Amount"]) * -1);
    getAccount(accountList, data["To"])!.changeBalance(Number(data["Amount"]));
    transactionList.push(new Transaction(date.toDate(),
        getAccount(accountList, data["From"])!,
        getAccount(accountList, data["To"])!,
        data["Narrative"],
        data["Amount"]));
}

function exportData(filename: string) {
    for (let transaction of transactionList) {
        let obj = {
            "From": transaction.from.owner.name,
            "To": transaction.to.owner.name,
            "Narrative": transaction.narative,
            "Amount": transaction.amount,
            "Date": transaction.date
        }
        fs.appendFileSync(filename, JSON.stringify(obj) + '\n', 'utf-8');
    }
}

logger.trace('Entering program');
listenInput()
