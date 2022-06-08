import { exit } from "process";
import { Assign, Binary, Call, Expr, Grouping, Literal, Logical, Unary, Variable } from "./Expr";
import Lox from "./Lox";
import { Block, Expression, Func, If, Print, Return, Stmt, Var, While } from "./Stmt";
import Token from "./Token";
import { TokenType } from "./TokenType";

class ParseError extends Error {}

export default class Parser {
  private tokens: Array<Token>
  private current: number = 0;

  public parse(): Array<Stmt> {
    let statements: Array<Stmt> = []

    while (!this.isAtEnd()) {
      statements.push(this.declaration())
    }

    return statements
  }

  constructor(tokens: Array<Token>) {
    this.tokens = tokens
  }

  private expression(): Expr {
    return this.assignment()
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.FUN)) return this.func('function')
      if (this.match(TokenType.VAR)) return this.varDeclaration()
      return this.statement()
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize()
      }
      // return null
      console.error('Parse error on declaration.')
      exit()
    }
  }

  private statement(): Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement()
    if (this.match(TokenType.IF)) return this.ifStatement()
    if (this.match(TokenType.PRINT)) return this.printStatement()
    if (this.match(TokenType.RETURN)) return this.returnStatement()
    if (this.match(TokenType.WHILE)) return this.whileStatement()
    if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block())

    return this.expressionStatement()
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "for".')

    let initializer: Stmt|null;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration()
    } else {
      initializer = this.expressionStatement()
    }

    let condition: Expr|null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression()
    }
    this.consume(TokenType.SEMICOLON, 'Expect ";" after loop condition.')

    let increment: Expr|null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression()
    }
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after for clauses.')

    let body: Stmt = this.statement()

    if (increment !== null) {
      body = new Block(
        [body, new Expression(increment)]
      )
    }

    if (condition === null) condition = new Literal(true)
    body = new While(condition, body)

    if (initializer !== null) {
      body = new Block([initializer, body])
    }

    return body
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "if".')
    let condition: Expr = this.expression()
    this.consume(TokenType.RIGHT_PAREN, 'Expect "(" after "if" condition.')

    let thenBranch: Stmt = this.statement()
    let elseBranch: Stmt|null = null

    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement()
    }

    return new If(condition, thenBranch, elseBranch)
  }

  private printStatement(): Stmt {
    let value: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.')
    return new Print(value)
  }

  private returnStatement(): Stmt {
    let keyword: Token = this.previous()
    let value: Expr|null = null
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression()
    }

    this.consume(TokenType.SEMICOLON,
      'Expect ";" after return value.')
    return new Return(keyword, value)
  }

  private varDeclaration(): Stmt {
    let name: Token = this.consume(TokenType.IDENTIFIER, 'Expect variable name.')

    let initializer: Expr|null = null

    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression()
    }

    this.consume(TokenType.SEMICOLON, 'Expect ";" after variable declaration.')
    return new Var(name, initializer)
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "while".')
    const condition: Expr = this.expression()
    this.consume(TokenType.RIGHT_PAREN, 'Expect "(" after "while".')
    const body: Stmt = this.statement()

    return new While(condition, body)
  }

  private expressionStatement(): Stmt {
    let expr: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.')
    return new Expression(expr)
  }

  private func (kind: string): Func {
    const name = this.consume(TokenType.IDENTIFIER, 
      `Expect ${kind} name.`)
    this.consume(TokenType.LEFT_PAREN,
      `Expect '(' after ${kind} name.`)
    let params: Array<Token> = []
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (params.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.")
        }

        params.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."))
      } while (this.match(TokenType.COMMA))
    }
    this.consume(TokenType.RIGHT_PAREN,
      'Expect ")" after parameters.')
    this.consume(TokenType.LEFT_BRACE,
      `Expect "{" before ${kind} body.`)

    const body: Array<Stmt> = this.block()
    return new Func(name, params, body)
  }

  private block(): Array<Stmt> {
    const statements: Array<Stmt> = []

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expect "}" after block.')
    return statements
  }

  private assignment(): Expr {
    let expr: Expr = this.or()

    if (this.match(TokenType.EQUAL)) {
      let equals: Token = this.previous()
      let value: Expr = this.assignment()

      if (expr instanceof Variable) {
        let name: Token = expr.name
        return new Assign(name, value)
      }

      this.error(equals, 'Invalid assignment target.')
    }

    return expr
  }

  private or(): Expr {
    let expr: Expr = this.and()

    while (this.match(TokenType.OR)) {
      let operator: Token = this.previous()
      let right: Expr = this.and()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  private and(): Expr {
    let expr: Expr = this.equality()

    while (this.match(TokenType.AND)) {
      let operator: Token = this.previous()
      let right: Expr = this.equality()
      expr = new Logical(expr, operator, right)
    }

    return expr
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

    return this.call()
  }

  private finishCall(callee: Expr): Expr {
    let args: Array<Expr> = []

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), 
            "Can't have more than 255 arguments.")
        }
        args.push(this.expression())
      } while (this.match(TokenType.COMMA))
    }

    let paren = this.consume(TokenType.RIGHT_PAREN,
      'Expect ")" after arguments.')

    return new Call(callee, paren, args)
  }

  private call():Expr {
    let expr: Expr = this.primary()

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  private primary(): Expr {
    if(this.match(TokenType.FALSE)) return new Literal(false)
    if(this.match(TokenType.TRUE)) return new Literal(true)
    if(this.match(TokenType.NIL)) return new Literal(null)

    if(this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal)
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous())
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
          return
      }

      this.advance()
    }
  }
}
