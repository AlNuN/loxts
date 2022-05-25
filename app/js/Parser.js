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
    statement() {
        if (this.match(TokenType_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(TokenType_1.TokenType.LEFT_BRACE))
            return new Stmt_1.Block(this.block());
        return this.expressionStatement();
    }
    printStatement() {
        let value = this.expression();
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after value.');
        return new Stmt_1.Print(value);
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
    expressionStatement() {
        let expr = this.expression();
        this.consume(TokenType_1.TokenType.SEMICOLON, 'Expect ";" after value.');
        return new Stmt_1.Expression(expr);
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
        let expr = this.equality();
        if (this.match(TokenType_1.TokenType.EQUAL)) {
            let equals = this.previous();
            let value = this.assignment();
            if (expr instanceof Expr_1.Variable) {
                let name = expr.name;
                return new Expr_1.Assign(name, value);
            }
            this.error(equals, 'Invalid assignment target.');
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
        return this.primary();
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
