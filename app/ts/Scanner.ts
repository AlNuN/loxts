import Lox from './Lox'
import Token from './Token'
import { TokenType } from './TokenType'

export default class Scanner {
  private readonly source: string
  private readonly tokens: Array<Token> = []
  private readonly keywords :Map<string, TokenType> = new Map([
    ["and",    TokenType.AND],
    ["class",  TokenType.CLASS],
    ["else",   TokenType.ELSE],
    ["false",  TokenType.FALSE],
    ["for",    TokenType.FOR],
    ["fun",    TokenType.FUN],
    ["if",     TokenType.IF],
    ["nil",    TokenType.NIL],
    ["or",     TokenType.OR],
    ["print",  TokenType.PRINT],
    ["return", TokenType.RETURN],
    ["super",  TokenType.SUPER],
    ["this",   TokenType.THIS],
    ["true",   TokenType.TRUE],
    ["var",    TokenType.VAR],
    ["while",  TokenType.WHILE],
  ])

  private start: number = 0
  private current: number = 0
  private line: number = 1

  constructor(source: string) {
    this.source = source
  }

  public scanTokens(): Array<Token> {
    while (!this.isAtEnd()) {
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line))
    return this.tokens
  }

  private scanToken() {
    const c : string = this.advance()

    switch (c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break
      case ')': this.addToken(TokenType.RIGHT_PAREN); break
      case '{': this.addToken(TokenType.LEFT_BRACE); break
      case '}': this.addToken(TokenType.RIGHT_BRACE); break
      case ',': this.addToken(TokenType.COMMA); break
      case '.': this.addToken(TokenType.DOT); break
      case '-': this.addToken(TokenType.MINUS); break
      case '+': this.addToken(TokenType.PLUS); break
      case ';': this.addToken(TokenType.SEMICOLON); break
      case '*': this.addToken(TokenType.STAR); break
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG)
        break
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL)
        break
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS)
        break
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER)
        break
      case '/':
        if (this.match('/')) {
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance()
        } else {
          this.addToken(TokenType.SLASH)
        }
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break
      case '\n':
        this.line++
        break
      case '"': this.string(); break
      default:
        if (this.isDigit(c)) {
          this.number()
        } else if (this.isAlpha(c)) {
          this.identifier()
        } else {
          Lox.error(this.line, "Unexpected character")
        }
        break
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance()

    const text :string = this.source.substring(this.start, this.current)
    let type :TokenType | undefined = this.keywords.get(text)

    if (type == null) type = TokenType.IDENTIFIER

    this.addToken(type)
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance()

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance()

      while (this.isDigit(this.peek())) this.advance()
    }

    this.addToken(TokenType.NUMBER, Number.parseFloat(this.source.substring(this.start, this.current)))
  }

  private string(): void {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == '\n') this.line++
      this.advance()
    }

    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.")
    }

    this.advance()

    const value: string = this.source.substring(this.start + 1, this.current -1)
    this.addToken(TokenType.STRING, value)
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) != expected) return false
    this.current++
    return true
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0'
    return this.source.charAt(this.current)
  }

  private peekNext() {
    if (this.current + 1 > this.source.length) return '\0'
    return this.source.charAt(this.current + 1)
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      c == '_'
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9'
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c)
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private advance(): string {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal: Object | null = null): void {
    const text: string = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }
}
