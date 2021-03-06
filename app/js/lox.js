"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
class Lox {
    constructor(args) {
        this.hadError = false;
        this.args = args;
        if (this.args.length > 3) {
            console.log('Usage: npm run tsLox [script]');
            (0, process_1.exit)(65);
        }
        else if (this.args.length == 3) {
            this.runFile(this.args[2]);
        }
        else {
            this.runPrompt();
        }
    }
    runFile(path) {
        const bytes = fs_1.default.readFileSync(path, { flag: 'r' }).values();
        const string = String.fromCharCode(...bytes);
        this.run(string);
    }
    runPrompt() {
        const _this = this;
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.setPrompt('>');
        rl.prompt();
        rl.on('line', function (line) {
            if (!line === null)
                rl.close();
            _this.run(line);
            _this.hadError = false;
            rl.prompt();
        }).on('close', function () {
            console.log('\nHave a nice day!');
            (0, process_1.exit)(0);
        });
    }
    run(source) {
        if (this.hadError)
            (0, process_1.exit)(65);
        console.log({ source });
    }
    error(line, message) {
        this.report(line, "", message);
    }
    report(line, where, message) {
        console.error(`[line ${line}] Error${where}: ${message}`);
        this.hadError = true;
    }
}
exports.default = Lox;
