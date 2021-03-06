"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const Scanner_1 = __importDefault(require("./Scanner"));
const TokenType_1 = require("./TokenType");
const Parser_1 = __importDefault(require("./Parser"));
const Interpreter_1 = __importDefault(require("./Interpreter"));
const Resolver_1 = require("./Resolver");
class Lox {
    constructor(args) {
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
            Lox.hadError = false;
            Lox.hadRuntimeError = false;
            rl.prompt();
        }).on('close', function () {
            console.log('\nHave a nice day!');
            (0, process_1.exit)(0);
        });
    }
    run(source) {
        if (Lox.hadError)
            (0, process_1.exit)(65);
        if (Lox.hadRuntimeError)
            (0, process_1.exit)(70);
        const scanner = new Scanner_1.default(source);
        const tokens = scanner.scanTokens();
        const parser = new Parser_1.default(tokens);
        const statements = parser.parse();
        if (Lox.hadError)
            return;
        let resolver = new Resolver_1.Resolver(Lox.interpreter);
        resolver.resolve(statements);
        if (Lox.hadError)
            return;
        Lox.interpreter.interpret(statements);
    }
    static error(line, message) {
        Lox.report(line, "", message);
    }
    static report(line, where, message) {
        console.error(`[line ${line}] Error${where}: ${message}`);
        this.hadError = true;
    }
    static errorT(token, message) {
        if (token.type == TokenType_1.TokenType.EOF) {
            Lox.report(token.line, " at end", message);
        }
        else {
            Lox.report(token.line, ` at '${token.lexeme}' `, message);
        }
    }
    static runtimeError(error) {
        console.error(`${error.message}`);
        console.error(`[line ${error.token.line}]`);
        Lox.hadRuntimeError = true;
    }
}
exports.default = Lox;
Lox.interpreter = new Interpreter_1.default();
Lox.hadError = false;
Lox.hadRuntimeError = false;
