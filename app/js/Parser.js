"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const Expr_1 = require("./Expr");
const Lox_1 = __importDefault(require("./Lox"));
const Stmt_1 = require("./Stmt");
const TokenType_1 = require("./TokenType");
class ParseError extends Error {
}
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.tokens = tokens;
    }
    parse() {
        let statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }
        return statements;
    }
    expression() {
        return this.assignment();
    }
    declaration() {
        try {
            if (this.match(TokenType_1.TokenType.CLASS))
                return this.classDeclaration();
            if (this.match(TokenType_1.TokenType.FUN))
                return this.func('function');
            if (this.match(TokenType_1.TokenType.VAR))
                return this.varDeclaration();
            return this.statement();
        }
        catch (error) {
            if (error instanceof ParseError) {
                this.synchronize();
            }
            console.error('Parse error on declaration.');
            (0, process_1.exit)();
        }
    }
    classDeclaration() {
        let name = this.consume(TokenType_1.TokenType.IDENTIFIER, 'Expect class name.');
        this.consume(TokenType_1.TokenType.LEFT_BRACE, 'Expect "{" before class body.');
        let methods = [];
        while (!this.check(TokenType_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            methods.push(this.func('method'));
        }
        this.consume(TokenType_1.TokenType.RIGHT_BRACE, 'Expect "}" after class body.');
        return new Stmt_1.Class(name, methods);
    }
    statement() {
        if (this.match(TokenType_1.TokenType.FOR))
            return this.forStatement();
        if (this.match(TokenType_1.TokenType.IF))
            return this.ifStatement();
        if (this.match(TokenType_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(TokenType_1.TokenType.RETURN))
            return this.returnStatement();
        if (this.match(TokenType_1.TokenType.WHILE))
            return this.whileStatement();
        if (this.match(TokenType_1.TokenType.LEFT_BRACE))
            return new Stmt_1.Block(this.block());
        return this.expressionStatement();
    }
    forStatement() {
        this.consume(TokenType_1.TokenType.LEFT_PAREN, 'Expect "(" after "for".');
        let initializer;
        if (this.match(TokenType_1.TokenType.SEMICOLON)) {
            initializer = null;
        }
        else if (this.match(TokenType_1.TokenType.VAR)) {
            initializer = this.varDeclaration();
        }
        else {
            initializer = this.expressionStatement();
        }
        let condition = null;
        if (!this.check(TokenType_1.TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after loop condition.');
        let increment = null;
        if (!this.check(TokenType_1.TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType_1.TokenType.RIGHT_PAREN, 'Expect ")" after for clauses.');
        let body = this.statement();
        if (increment !== null) {
            body = new Stmt_1.Block([body, new Stmt_1.Expression(increment)]);
        }
        if (condition === null)
            condition = new Expr_1.Literal(true);
        body = new Stmt_1.While(condition, body);
        if (initializer !== null) {
            body = new Stmt_1.Block([initializer, body]);
        }
        return body;
    }
    ifStatement() {
        this.consume(TokenType_1.TokenType.LEFT_PAREN, 'Expect "(" after "if".');
        let condition = this.expression();
        this.consume(TokenType_1.TokenType.RIGHT_PAREN, 'Expect "(" after "if" condition.');
        let thenBranch = this.statement();
        let elseBranch = null;
        if (this.match(TokenType_1.TokenType.ELSE)) {
            elseBranch = this.statement();
        }
        return new Stmt_1.If(condition, thenBranch, elseBranch);
    }
    printStatement() {
        let value = this.expression();
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after value.');
        return new Stmt_1.Print(value);
    }
    returnStatement() {
        let keyword = this.previous();
        let value = null;
        if (!this.check(TokenType_1.TokenType.SEMICOLON)) {
            value = this.expression();
        }
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after return value.');
        return new Stmt_1.Return(keyword, value);
    }
    varDeclaration() {
        let name = this.consume(TokenType_1.TokenType.IDENTIFIER, 'Expect variable name.');
        let initializer = null;
        if (this.match(TokenType_1.TokenType.EQUAL)) {
            initializer = this.expression();
        }
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after variable declaration.');
        return new Stmt_1.Var(name, initializer);
    }
    whileStatement() {
        this.consume(TokenType_1.TokenType.LEFT_PAREN, 'Expect "(" after "while".');
        const condition = this.expression();
        this.consume(TokenType_1.TokenType.RIGHT_PAREN, 'Expect "(" after "while".');
        const body = this.statement();
        return new Stmt_1.While(condition, body);
    }
    expressionStatement() {
        let expr = this.expression();
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after value.');
        return new Stmt_1.Expression(expr);
    }
    func(kind) {
        const name = this.consume(TokenType_1.TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(TokenType_1.TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
        let params = [];
        if (!this.check(TokenType_1.TokenType.RIGHT_PAREN)) {
            do {
                if (params.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }
                params.push(this.consume(TokenType_1.TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(TokenType_1.TokenType.COMMA));
        }
        this.consume(TokenType_1.TokenType.RIGHT_PAREN, 'Expect ")" after parameters.');
        this.consume(TokenType_1.TokenType.LEFT_BRACE, `Expect "{" before ${kind} body.`);
        const body = this.block();
        return new Stmt_1.Func(name, params, body);
    }
    block() {
        const statements = [];
        while (!this.check(TokenType_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType_1.TokenType.RIGHT_BRACE, 'Expect "}" after block.');
        return statements;
    }
    assignment() {
        let expr = this.or();
        if (this.match(TokenType_1.TokenType.EQUAL)) {
            let equals = this.previous();
            let value = this.assignment();
            if (expr instanceof Expr_1.Variable) {
                let name = expr.name;
                return new Expr_1.Assign(name, value);
            }
            else if (expr instanceof Expr_1.Get) {
                let get = expr;
                return new Expr_1.Sett(get.object, get.name, value);
            }
            this.error(equals, 'Invalid assignment target.');
        }
        return expr;
    }
    or() {
        let expr = this.and();
        while (this.match(TokenType_1.TokenType.OR)) {
            let operator = this.previous();
            let right = this.and();
            expr = new Expr_1.Logical(expr, operator, right);
        }
        return expr;
    }
    and() {
        let expr = this.equality();
        while (this.match(TokenType_1.TokenType.AND)) {
            let operator = this.previous();
            let right = this.equality();
            expr = new Expr_1.Logical(expr, operator, right);
        }
        return expr;
    }
    equality() {
        let expr = this.comparison();
        while (this.match(TokenType_1.TokenType.BANG_EQUAL, TokenType_1.TokenType.EQUAL_EQUAL)) {
            let operator = this.previous();
            let right = this.comparison();
            expr = new Expr_1.Binary(expr, operator, right);
        }
        return expr;
    }
    comparison() {
        let expr = this.term();
        while (this.match(TokenType_1.TokenType.GREATER, TokenType_1.TokenType.GREATER_EQUAL, TokenType_1.TokenType.LESS, TokenType_1.TokenType.LESS_EQUAL)) {
            let operator = this.previous();
            let right = this.term();
            expr = new Expr_1.Binary(expr, operator, right);
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match(TokenType_1.TokenType.MINUS, TokenType_1.TokenType.PLUS)) {
            let operator = this.previous();
            let right = this.factor();
            expr = new Expr_1.Binary(expr, operator, right);
        }
        return expr;
    }
    factor() {
        let expr = this.unary();
        while (this.match(TokenType_1.TokenType.SLASH, TokenType_1.TokenType.STAR)) {
            let operator = this.previous();
            let right = this.unary();
            expr = new Expr_1.Binary(expr, operator, right);
        }
        return expr;
    }
    unary() {
        if (this.match(TokenType_1.TokenType.BANG, TokenType_1.TokenType.MINUS)) {
            let operator = this.previous();
            let right = this.unary();
            return new Expr_1.Unary(operator, right);
        }
        return this.call();
    }
    finishCall(callee) {
        let args = [];
        if (!this.check(TokenType_1.TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(TokenType_1.TokenType.COMMA));
        }
        let paren = this.consume(TokenType_1.TokenType.RIGHT_PAREN, 'Expect ")" after arguments.');
        return new Expr_1.Call(callee, paren, args);
    }
    call() {
        let expr = this.primary();
        while (true) {
            if (this.match(TokenType_1.TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            }
            else if (this.match(TokenType_1.TokenType.DOT)) {
                let name = this.consume(TokenType_1.TokenType.IDENTIFIER, 'Expect property name after ".".');
                expr = new Expr_1.Get(expr, name);
            }
            else {
                break;
            }
        }
        return expr;
    }
    primary() {
        if (this.match(TokenType_1.TokenType.FALSE))
            return new Expr_1.Literal(false);
        if (this.match(TokenType_1.TokenType.TRUE))
            return new Expr_1.Literal(true);
        if (this.match(TokenType_1.TokenType.NIL))
            return new Expr_1.Literal(null);
        if (this.match(TokenType_1.TokenType.NUMBER, TokenType_1.TokenType.STRING)) {
            return new Expr_1.Literal(this.previous().literal);
        }
        if (this.match(TokenType_1.TokenType.THIS))
            return new Expr_1.This(this.previous());
        if (this.match(TokenType_1.TokenType.IDENTIFIER)) {
            return new Expr_1.Variable(this.previous());
        }
        if (this.match(TokenType_1.TokenType.LEFT_PAREN)) {
            let expr = this.expression();
            this.consume(TokenType_1.TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new Expr_1.Grouping(expr);
        }
        throw this.error(this.peek(), 'Expect expression.');
    }
    match(...types) {
        for (let type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        throw this.error(this.peek(), message);
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            ++this.current;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === TokenType_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    error(token, message) {
        Lox_1.default.errorT(token, message);
        return new ParseError();
    }
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType_1.TokenType.SEMICOLON)
                return;
            switch (this.peek().type) {
                case TokenType_1.TokenType.CLASS:
                case TokenType_1.TokenType.FUN:
                case TokenType_1.TokenType.VAR:
                case TokenType_1.TokenType.FOR:
                case TokenType_1.TokenType.IF:
                case TokenType_1.TokenType.WHILE:
                case TokenType_1.TokenType.PRINT:
                case TokenType_1.TokenType.RETURN:
                    return;
            }
            this.advance();
        }
    }
}
exports.default = Parser;
