"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.balance -= amount;
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
    while (1) {
        let inputString = readlineSync.question('Enter Command: ');
        if (inputString == 'List All') {
            for (let transaction of transactionList) {
                console.log(transaction.toString());
            }
        }
        else if (inputString.includes('List')) {
            let accountName = inputString.split('[')[1].split(']')[0];
            console.log(accountName);
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
        else {
            console.log('Wrong input!');
        }
    }
}
function parseCSV(filePath) {
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
        let fromPerson = getPerson(personList, data["From"]);
        let toPerson = getPerson(personList, data["To"]);
        if (fromPerson == null) {
            personList.push(new Person(data["From"]));
            accountList.push(new Account(getPerson(personList, data["From"])));
        }
        if (toPerson == null) {
            personList.push(new Person(data["To"]));
            accountList.push(new Account(getPerson(personList, data["To"])));
        }
        getAccount(accountList, data["From"]).changeBalance(data["Amount"] * -1);
        getAccount(accountList, data["To"]).changeBalance(data["Amount"]);
        transactionList.push(new Transaction(moment(data["Date"], "DD/MM/YYYY").toDate(), getAccount(accountList, data["From"]), getAccount(accountList, data["To"]), data["Narrative"], data["Amount"]));
    })
        .on('end', () => {
        console.log('Done parsing');
        listenInput();
    });
}
parseCSV('Transactions2014.csv');
//# sourceMappingURL=index.js.map