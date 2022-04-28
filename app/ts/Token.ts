import { TokenType } from './TokenType'

export default class Token {
  constructor(
    readonly type: TokenType, 
    readonly lexeme: string, 
    readonly literal: Object | null, 
    readonly line: number
  ) {}

  public toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`
  }
}
