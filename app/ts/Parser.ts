import { Binary, Expr, Grouping, Literal, Unary } from "./Expr";
import Lox from "./Lox";
import { Expression, Print, Stmt } from "./Stmt";
import Token from "./Token";
import { TokenType } from "./TokenType";

class ParseError extends Error {}

export default class Parser {
  private tokens: Array<Token>
  private current: number = 0;

  public parse(): Array<Stmt> {
    let statements: Array<Stmt> = []

    while (!this.isAtEnd()) {
      statements.push(this.statement())
    }

    return statements
  }

  constructor(tokens: Array<Token>) {
    this.tokens = tokens
  }

  private expression(): Expr {
    return this.equality();
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement()

    return this.expressionStatement()
  }

  private printStatement(): Stmt {
    let value: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.')
    return new Print(value)
  }

  private expressionStatement(): Stmt {
    let expr: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.')
    return new Expression(expr)
  }

  private equality(): Expr {
    let expr: Expr = this.comparison()

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      let operator: Token = this.previous()
      let right: Expr = this.comparison()
      expr = new Binary(expr, operator, right)
    }

    return expr;
  }

  private comparison(): Expr {
    let expr: Expr = this.term()

    while (this.match(
      TokenType.GREATER,
      TokenType.GREATER_EQUAL,
      TokenType.LESS,
      TokenType.LESS_EQUAL
    )) {
      let operator: Token = this.previous()
      let right: Expr = this.term()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private term(): Expr {
    let expr: Expr = this.factor()

    while (this.match(
      TokenType.MINUS,
      TokenType.PLUS
    )) {
      let operator: Token = this.previous()
      let right: Expr = this.factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private factor(): Expr {
    let expr: Expr = this.unary()

    while (this.match(
      TokenType.SLASH,
      TokenType.STAR
    )) {
      let operator: Token = this.previous()
      let right: Expr = this.unary()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private unary(): Expr {
    if (this.match(
      TokenType.BANG,
      TokenType.MINUS
    )) {
      let operator: Token = this.previous()
      let right: Expr = this.unary()
      return new Unary(operator, right)
    }

    return this.primary()
  }

  private primary(): Expr {
    if(this.match(TokenType.FALSE)) return new Literal(false)
    if(this.match(TokenType.TRUE)) return new Literal(true)
    if(this.match(TokenType.NIL)) return new Literal(null)

    if(this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal)
    }

    if(this.match(TokenType.LEFT_PAREN)) {
      let expr: Expr = this.expression()
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
      return new Grouping(expr)
    }

    throw this.error(this.peek(), 'Expect expression.')
  }

  private match(...types: Array<TokenType>): boolean {
    for (let type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()

    throw this.error(this.peek(), message)
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) ++this.current
    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous(): Token {
    return this.tokens[this.current -1]
  }

  private error(token: Token, message: string): ParseError {
    Lox.errorT(token, message)
    return new ParseError();
  }
  
  private synchronize(): void {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance()
    }
  }
}
