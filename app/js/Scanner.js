"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Lox_1 = __importDefault(require("./Lox"));
const Token_1 = __importDefault(require("./Token"));
const TokenType_1 = require("./TokenType");
class Scanner {
    constructor(source) {
        this.tokens = [];
        this.keywords = new Map([
            ["and", TokenType_1.TokenType.AND],
            ["class", TokenType_1.TokenType.CLASS],
            ["else", TokenType_1.TokenType.ELSE],
            ["false", TokenType_1.TokenType.FALSE],
            ["for", TokenType_1.TokenType.FOR],
            ["fun", TokenType_1.TokenType.FUN],
            ["if", TokenType_1.TokenType.IF],
            ["nil", TokenType_1.TokenType.NIL],
            ["or", TokenType_1.TokenType.OR],
            ["print", TokenType_1.TokenType.PRINT],
            ["return", TokenType_1.TokenType.RETURN],
            ["super", TokenType_1.TokenType.SUPER],
            ["this", TokenType_1.TokenType.THIS],
            ["true", TokenType_1.TokenType.TRUE],
            ["var", TokenType_1.TokenType.VAR],
            ["while", TokenType_1.TokenType.WHILE],
        ]);
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.source = source;
    }
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token_1.default(TokenType_1.TokenType.EOF, "", null, this.line));
        return this.tokens;
    }
    scanToken() {
        const c = this.advance();
        switch (c) {
            case '(':
                this.addToken(TokenType_1.TokenType.LEFT_PAREN);
                break;
            case ')':
                this.addToken(TokenType_1.TokenType.RIGHT_PAREN);
                break;
            case '{':
                this.addToken(TokenType_1.TokenType.LEFT_BRACE);
                break;
            case '}':
                this.addToken(TokenType_1.TokenType.RIGHT_BRACE);
                break;
            case ',':
                this.addToken(TokenType_1.TokenType.COMMA);
                break;
            case '.':
                this.addToken(TokenType_1.TokenType.DOT);
                break;
            case '-':
                this.addToken(TokenType_1.TokenType.MINUS);
                break;
            case '+':
                this.addToken(TokenType_1.TokenType.PLUS);
                break;
            case ';':
                this.addToken(TokenType_1.TokenType.SEMICOLON);
                break;
            case '*':
                this.addToken(TokenType_1.TokenType.STAR);
                break;
            case '!':
                this.addToken(this.match('=') ? TokenType_1.TokenType.BANG_EQUAL : TokenType_1.TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType_1.TokenType.EQUAL_EQUAL : TokenType_1.TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType_1.TokenType.LESS_EQUAL : TokenType_1.TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType_1.TokenType.GREATER_EQUAL : TokenType_1.TokenType.GREATER);
                break;
            case '/':
                if (this.match('/')) {
                    while (this.peek() != '\n' && !this.isAtEnd())
                        this.advance();
                }
                else {
                    this.addToken(TokenType_1.TokenType.SLASH);
                }
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this.line++;
                break;
            case '"':
                this.string();
                break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                }
                else if (this.isAlpha(c)) {
                    this.identifier();
                }
                else {
                    Lox_1.default.error(this.line, "Unexpected character");
                }
                break;
        }
    }
    identifier() {
        while (this.isAlphaNumeric(this.peek()))
            this.advance();
        const text = this.source.substring(this.start, this.current);
        let type = this.keywords.get(text);
        if (type == null)
            type = TokenType_1.TokenType.IDENTIFIER;
        this.addToken(type);
    }
    number() {
        while (this.isDigit(this.peek()))
            this.advance();
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek()))
                this.advance();
        }
        this.addToken(TokenType_1.TokenType.NUMBER, Number.parseFloat(this.source.substring(this.start, this.current)));
    }
    string() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n')
                this.line++;
            this.advance();
        }
        if (this.isAtEnd()) {
            Lox_1.default.error(this.line, "Unterminated string.");
        }
        this.advance();
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType_1.TokenType.STRING, value);
    }
    match(expected) {
        if (this.isAtEnd())
            return false;
        if (this.source.charAt(this.current) != expected)
            return false;
        this.current++;
        return true;
    }
    peek() {
        if (this.isAtEnd())
            return '\0';
        return this.source.charAt(this.current);
    }
    peekNext() {
        if (this.current + 1 > this.source.length)
            return '\0';
        return this.source.charAt(this.current + 1);
    }
    isAlpha(c) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c == '_';
    }
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    isAtEnd() {
        return this.current >= this.source.length;
    }
    advance() {
        return this.source.charAt(this.current++);
    }
    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token_1.default(type, text, literal, this.line));
    }
}
exports.default = Scanner;
