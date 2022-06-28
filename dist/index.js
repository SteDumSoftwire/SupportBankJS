"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const log4js = require('log4js');
log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug' }
    }
});
const logger = log4js.getLogger();
logger.level = util_1.debug;
let personList = [];
let accountList = [];
let transactionList = [];
const readlineSync = require('readline-sync');
const moment = require('moment');
const csv = require('csv-parser');
const fs = require('fs');
class Transaction {
    constructor(date, from, to, narative, amount) {
        this.from = from;
        this.to = to;
        this.narative = narative;
        this.amount = amount;
        this.date = date;
    }
    toString() {
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
    constructor(name) {
        this.name = name;
    }
}
class Account {
    constructor(owner) {
        this.owner = owner;
        this.balance = 0;
    }
    changeBalance(amount) {
        this.balance += amount;
    }
    toString() {
        let out = '';
        out += "Owner: " + this.owner.name;
        out += "; Balance: " + this.balance;
        return out;
    }
}
function getPerson(personList, name) {
    for (let pers of personList) {
        if (pers.name == name) {
            return pers;
        }
    }
    return null;
}
function getAccount(accountList, name) {
    for (let account of accountList) {
        if (account.owner.name == name) {
            return account;
        }
    }
    return null;
}
function listenInput() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.trace('Enter listenInput function');
        while (1) {
            let inputString = readlineSync.question('Enter Command: ');
            if (inputString == 'List All') {
                for (let account of accountList) {
                    console.log(account.toString());
                }
            }
            else if (inputString.includes('List')) {
                let accountName = inputString.split('[')[1].split(']')[0];
                let filteredTransactions = transactionList.filter(function (transaction) {
                    return transaction.from.owner.name == accountName || transaction.to.owner.name == accountName;
                });
                for (let transaction of filteredTransactions) {
                    console.log(transaction.toString());
                }
            }
            else if (inputString == 'Quit') {
                return;
            }
            else if (inputString.includes('Import File')) {
                let filename = inputString.split(' ')[2];
                let tmp = filename;
                let ext = tmp.split('.').pop();
                if (ext == 'json') {
                    parseJSON(filename);
                }
                else if (ext == 'csv') {
                    yield parseCSV(filename);
                }
            }
            else {
                console.log('Wrong input!');
            }
        }
    });
}
function parseCSV(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let reader = fs.createReadStream(filePath)
            .pipe(csv());
        let lineIndex = 1;
        return new Promise((resolve, reject) => {
            reader.on('data', (data) => {
                extractData(data, lineIndex);
                lineIndex++;
            });
            reader.on('end', () => resolve());
        });
    });
}
function parseJSON(filename) {
    let data = JSON.parse(fs.readFileSync(filename));
    let objIdx = 1;
    for (let el of data) {
        extractData(el, objIdx);
        objIdx++;
    }
}
function extractData(data, lineIndex) {
    let fromPerson = getPerson(personList, data["From"]);
    let toPerson = getPerson(personList, data["To"]);
    let date = moment(data["Date"], "DD/MM/YYYY");
    if (!date.isValid()) {
        logger.debug(lineIndex + ": " + date.toDate());
        return;
    }
    if (isNaN(Number(data["Amount"]))) {
        logger.debug(lineIndex + ": " + "NaN");
        return;
    }
    if (fromPerson == null) {
        personList.push(new Person(data["From"]));
        accountList.push(new Account(getPerson(personList, data["From"])));
    }
    if (toPerson == null) {
        personList.push(new Person(data["To"]));
        accountList.push(new Account(getPerson(personList, data["To"])));
    }
    getAccount(accountList, data["From"]).changeBalance(Number(data["Amount"]) * -1);
    getAccount(accountList, data["To"]).changeBalance(Number(data["Amount"]));
    transactionList.push(new Transaction(date.toDate(), getAccount(accountList, data["From"]), getAccount(accountList, data["To"]), data["Narrative"], data["Amount"]));
}
logger.trace('Entering program');
listenInput();
//# sourceMappingURL=index.js.map