import Environment from "./Environment";
import { Assign, Binary, Expr, Grouping, Literal, Logical, Unary, Variable, Visitor as ExprVisitor } from "./Expr";
import Lox from "./Lox";
import RuntimeError from "./RuntimeError";
import { Block, Expression, If, Print, Stmt, Var, Visitor as StmtVisitor, While } from "./Stmt";
import Token from "./Token";
import { TokenType } from "./TokenType";

export default class Interpreter implements 
  ExprVisitor<any>,
  StmtVisitor<void>
{
  private environment: Environment = new Environment(null)

  public interpret(statements: Array<Stmt>):void {
    try {
      for (let statement of statements) {
        this.execute(statement)
      }
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

  visitLogicalExpr(expr: Logical): any {
    let left: any = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left
    } else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
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

  public visitVariableExpr(expr: Variable): any {
    return this.environment.get(expr.name)
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

  private execute(stmt: Stmt): void {
    stmt.accept(this)
  }

  private executeBlock(statements: Array<Stmt>, environment: Environment): void {
    let previous = this.environment
    try {
      this.environment = environment

      for (let statement of statements) {
        this.execute(statement)
      }
    } catch { }
    finally {
      this.environment = previous
    }
  }

  visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment)) 
    return
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression)
  }

  visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch)
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch)
    }
  }

  public visitPrintStmt(stmt: Print): void {
    const value: any = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
  }

  public visitVarStmt(stmt: Var): void {
    let value: any = null;

    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
  }

  visitWhileStmt(stmt: While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
  }

  visitAssignExpr(expr: Assign): any {
    const value: any = this.evaluate(expr.value)
    this.environment.assign(expr.name, value)
    return value
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