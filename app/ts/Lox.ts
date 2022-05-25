import { exit } from 'process'
import fs from 'fs'
import readline from 'readline'
import Scanner from './Scanner'
import Token from './Token'
import { TokenType } from './TokenType'
import Parser from './Parser'
import RuntimeError from './RuntimeError'
import Interpreter from './Interpreter'
import { Stmt } from './Stmt'

export default class Lox {
  private args : Array<string>
  private static interpreter: Interpreter = new Interpreter();
  static hadError = false
  static hadRuntimeError = false

  constructor(args: Array<string>) {
    this.args = args

    if (this.args.length > 3) {
      console.log('Usage: npm run tsLox [script]')
      exit(65)
    } else if (this.args.length == 3) {
      this.runFile(this.args[2])
    } else {
      this.runPrompt()
    }
  }

  private runFile(path: string): void {
    const bytes = fs.readFileSync(path, { flag: 'r' }).values()
    const string: string = String.fromCharCode(...bytes)
    this.run(string)
  }

  private runPrompt():void {
    const _this:Lox = this

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.setPrompt('>')
    rl.prompt()

    rl.on('line', function(line) {
      if (!line === null) rl.close()
      _this.run(line)
      Lox.hadError = false
      Lox.hadRuntimeError = false
      rl.prompt()
    }).on('close', function () {
      console.log('\nHave a nice day!')
      exit(0)
    })
  }

  private run(source: string): void {
    if (Lox.hadError) exit(65)
    if (Lox.hadRuntimeError) exit(70)

    const scanner = new Scanner(source)
    const tokens: Array<Token> = scanner.scanTokens()

    const parser: Parser = new Parser(tokens)
    const statements: Array<Stmt> = parser.parse()

    if (Lox.hadError) return

    Lox.interpreter.interpret(statements)
  }

  public static error(line :number, message: string): void {
    Lox.report(line, "", message)
  }

  public static report(line :number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`)
    this.hadError = true
  }

  public static errorT(token: Token, message: string): void {
    if (token.type == TokenType.EOF) {
      Lox.report(token.line, " at end", message)
    } else {
      Lox.report(token.line, ` at '${token.lexeme}' `, message)
    }
  }

  public static runtimeError(error: RuntimeError): void {
    console.error(`${error.message}`)
    console.error(`[line ${error.token.line}]`)
    Lox.hadRuntimeError = true
  }
}
