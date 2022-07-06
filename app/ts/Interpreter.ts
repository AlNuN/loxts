import Environment from "./Environment";
import { Assign, Binary, Call, Expr, Get, Grouping, Literal, Logical, Sett, Super, This, Unary, Variable, Visitor as ExprVisitor } from "./Expr";
import Lox from "./Lox";
import LoxCallable from "./LoxCallable";
import LoxClass from "./LoxClass";
import LoxFunction from "./LoxFunction";
import LoxInstance from "./LoxInstance";
import ReturnError from "./ReturnError";
import RuntimeError from "./RuntimeError";
import { Block, Class, Expression, Func, If, Print, Return, Stmt, Var, Visitor as StmtVisitor, While } from "./Stmt";
import Token from "./Token";
import { TokenType } from "./TokenType";

export default class Interpreter implements 
  ExprVisitor<any>,
  StmtVisitor<void>
{
  public globals: Environment = new Environment(null)
  private environment: Environment = this.globals
  private locals: Map<Expr, number> = new Map()

  constructor() {
    this.globals.define('clock', <LoxCallable> {
      arity: () => { return 0 },
      call: (interpreter: Interpreter, args: Array<any>) => {
        return Date.now() / 1000
      },
      toString: () => { '<native fn>' }
    })
  }

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

  visitSettExpr(expr: Sett) {
    let object: any = this.evaluate(expr.object)

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name,
        'Only instances have fields.')
    }

    let value: any = this.evaluate(expr.value)
    object.set(expr.name, value)
    return value
  }

  visitSuperExpr(expr: Super) {
    let distance: number|undefined = this.locals.get(expr)

    if (!distance) {
      throw new RuntimeError(expr.method, `Undefined property "${expr.method.lexeme}".`)
    }

    let superclass: LoxClass = this.environment.getAt(distance, 'super')
    let object: LoxInstance = this.environment.getAt(distance -1, 'this')
    let method: LoxFunction|null = superclass.findMethod(expr.method.lexeme)

    if (!method) { 
      throw new RuntimeError(expr.method, `Undefined property "${expr.method.lexeme}".`) 
    }

    return method.bind(object)
  }

  visitThisExpr(expr: This) {
    return this.lookUpVariable(expr.keyword, expr)
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
    return this.lookUpVariable(expr.name, expr)
  }

  private lookUpVariable(name: Token, expr: Expr): any {
    let distance: number|undefined = this.locals.get(expr)
    if (distance != null) {
      return this.environment.getAt(distance, name.lexeme)
    } else {
      return this.globals.get(name)
    }
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

  public resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth)
  }

  public executeBlock(statements: Array<Stmt>, environment: Environment): void {
    let previous = this.environment
    try {
      this.environment = environment

      for (let statement of statements) {
        this.execute(statement)
      }
    }
    finally {
      this.environment = previous
    }
  }

  visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment)) 
    return
  }

  visitClassStmt(stmt: Class): void {
    let superclass: any = null
    if (stmt.superclass) {
      superclass = this.evaluate(stmt.superclass)
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(stmt.superclass.name,
          'Superclass must be a class.')
      }
    }

    this.environment.define(stmt.name.lexeme, null)

    if (stmt.superclass) {
      this.environment = new Environment(this.environment)
      this.environment.define('super', superclass)
    }

    let methods: Map<string, LoxFunction> = new Map()
    for (let method of stmt.methods) {
      let func: LoxFunction = new LoxFunction(method, this.environment, method.name.lexeme == 'init')
      methods.set(method.name.lexeme, func)
    }

    const klass: LoxClass = new LoxClass(stmt.name.lexeme, superclass, methods)

    if (superclass && this.environment.enclosing) {
      this.environment = this.environment.enclosing
    }

    this.environment.assign(stmt.name, klass)
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression)
  }

  visitFuncStmt(stmt: Func): void {
    let func: LoxFunction = new LoxFunction(stmt, this.environment, false)
    this.environment.define(stmt.name.lexeme, func)
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

  visitReturnStmt(stmt: Return): void {
    let value: any = null
    if (stmt.value != null) value = this.evaluate(stmt.value)

    throw new ReturnError(value)
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

    let distance: number|undefined = this.locals.get(expr)
    if (distance != null) {
      this.environment.assignAt(distance, expr.name, value)
    } else {
      this.globals.assign(expr.name, value)
    }

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

  visitCallExpr(expr: Call): any {
    let callee: any = this.evaluate(expr.callee)

    let args: Array<any> = []
    for(let arg of expr.args) {
      args.push(this.evaluate(arg))
    }

    if (
      !((callee as LoxCallable).call)
      || !((callee as LoxCallable).arity)
      || !((callee as LoxCallable).toString)
    ) {
      throw new RuntimeError(expr.paren,
        'Can only call functions and classes.')
    }

    let func: LoxCallable = callee;
    if (args.length != func.arity()) {
      throw new RuntimeError(expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`)
    }

    return func.call(this, args)
  }

  visitGetExpr(expr: Get) {
    let object: any = this.evaluate(expr.object)
    if (object instanceof LoxInstance) {
      return object.get(expr.name)
    }

    throw new RuntimeError(expr.name,
      'Only instances have properties')
  }

}