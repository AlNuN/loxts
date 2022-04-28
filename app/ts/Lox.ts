import { exit } from 'process'
import fs from 'fs'
import readline from 'readline'
import Scanner from './Scanner'
import Token from './Token'

export default class Lox {
  private args : Array<string>
  static hadError = false

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
      rl.prompt()
    }).on('close', function () {
      console.log('\nHave a nice day!')
      exit(0)
    })
  }

  private run(source: string): void {
    if (Lox.hadError) exit(65)

    const scanner = new Scanner(source)

    const tokens: Array<Token> = scanner.scanTokens()

    console.log(tokens)
  }

  public static error(line :number, message: string): void {
    Lox.report(line, "", message)
  }

  public static report(line :number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`)
    this.hadError = true
  }
}
