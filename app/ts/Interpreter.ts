import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./Expr";
import Lox from "./Lox";
import RuntimeError from "./RuntimeError";
import Token from "./Token";
import { TokenType } from "./TokenType";

export default class Interpreter implements Visitor<any> {

  public interpret(expression: Expr):void {
    try {
      let value: any = this.evaluate(expression)
      console.log(this.stringify(value))
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error)
        return
      }
      console.error('Uncaught error during runtime')
    }
  }

  public visitLiteralExpr(expr: Literal) : any {
    return expr.value
  }

  public visitUnaryExpr(expr: Unary): any {
    let right: any = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right)
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right)
        return -Number(right)
    }

    return null
  }

  private checkNumberOperand(operator: Token, operand: any): void {
    if (typeof operand === 'number') return
    throw new RuntimeError(operator, 'Operand must be a number.')
  }

  private checkNumberOperands(operator: Token, left: any, right: any): void {
    if (typeof left === 'number' && typeof right === 'number') return
    throw new RuntimeError(operator, 'Operands must be numbers.')
  }

  private isTruthy(object: any): boolean {
    if (object === null) return false
    if (typeof object === 'boolean') return !!object
    return true
  }

  private isEqual(a: any, b: any) {
    if (a === null && b === null) return true
    if (a === null) return false

    return Object.is(a, b)
  }

  private stringify(object: any) {
    if (object === null) return 'nil'

    if (typeof object === 'number') {
      return String(object)
    }

    return '' + object
  }

  public visitGroupingExpr(expr: Grouping): any {
    return this.evaluate(expr.expression)
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this)
  }

  public visitBinaryExpr(expr: Binary): any {
    let left: any = this.evaluate(expr.left)
    let right: any = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) > Number(right)
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) >= Number(right)
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) < Number(right)
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) <= Number(right)
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) - Number(right)
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number')
          return Number(left) + Number(right)
        if (typeof left === 'string' && typeof right === 'string')
          return String(left) + String(right)

        throw new RuntimeError(expr.operator, 
          'Operands must be two numbers or two strings.')
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) / Number(right)
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right)
        return Number(left) * Number(right)
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right)
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right)
    }

    return null
  }

}