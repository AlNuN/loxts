import { Assign, Binary, Call, Expr, Get, Grouping, Literal, Logical, Sett, This, Unary, Variable, Visitor as ExprVisitor } from "./Expr";
import Interpreter from "./Interpreter";
import Lox from "./Lox";
import { Stack } from "./Stack";
import { Block, Class, Expression, Func, If, Print, Return, Stmt, Var, Visitor as StmtVisitor, While } from "./Stmt";
import Token from "./Token";

enum FunctionType {
  NONE,
  FUNC,
  INITIALIZER,
  METHOD
}

enum ClassType {
  NONE,
  CLASS
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter
  private scopes: Stack<Map<string, boolean>> = new Stack()
  private currentFunction: FunctionType = FunctionType.NONE
  private currentClass: ClassType = ClassType.NONE

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
  }

  resolve(statements: Stmt[]):void {
    for (let statement of statements) {
      this.resolveStmt(statement)
    }
  }

  private resolveStmt(stmt: Stmt): void {
    stmt.accept(this)
  }

  private resolveExpr(expr: Expr): void {
    expr.accept(this)
  }

  private resolveFunction(func: Func, type: FunctionType): void {
    let enclosingFunction = this.currentFunction
    this.currentFunction = type
    this.beginScope()
    for (let param of func.params) {
      this.declare(param)
      this.define(param)
    } 
    this.resolve(func.body)
    this.endScope()
    this.currentFunction = enclosingFunction
  }

  private beginScope():void {
    this.scopes.push(new Map<string, boolean>())
  }

  private endScope():void {
    this.scopes.pop()
  }

  private declare(name: Token): void {
    if (this.scopes.isEmpty()) return
    let scope = this.scopes.peek()
    if (scope?.has(name.lexeme)) {
      Lox.errorT(name, 
        'Already a variable with this name in this scope')
    }
    scope?.set(name.lexeme, false)
  }

  private define(name: Token): void {
    if (this.scopes.isEmpty()) return
    this.scopes.peek()?.set(name.lexeme, true)
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.size() - 1; i >= 0; i--) {
      if (this.scopes.get(i).has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.size() - 1 - i)
        return
      }
    }
  }

  visitBlockStmt(stmt: Block): void {
    this.beginScope()
    this.resolve(stmt.statements)
    this.endScope()
  }

  visitClassStmt(stmt: Class): void {
    let enclosingClass = this.currentClass
    this.currentClass = ClassType.CLASS
    this.declare(stmt.name)
    this.define(stmt.name)

    this.beginScope()
    this.scopes.peek()?.set('this', true)

    for (let method of stmt.methods) {
      let declaration: FunctionType = FunctionType.METHOD
      if (method.name.lexeme == 'init') {
        declaration = FunctionType.INITIALIZER
      }
      this.resolveFunction(method, declaration)
    }

    this.endScope()
    this.currentClass = enclosingClass
  }

  visitExpressionStmt(stmt: Expression): void {
    this.resolveExpr(stmt.expression)
  }

  visitFuncStmt(stmt: Func): void {
    this.declare(stmt.name)
    this.define(stmt.name)

    this.resolveFunction(stmt, FunctionType.FUNC)
  }

  visitIfStmt(stmt: If): void {
    this.resolveExpr(stmt.condition)
    this.resolveStmt(stmt.thenBranch)
    if (stmt.elseBranch != null) this.resolveStmt(stmt.elseBranch)
  }

  visitPrintStmt(stmt: Print): void {
    this.resolveExpr(stmt.expression)
  }

  visitReturnStmt(stmt: Return): void {
    if (this.currentFunction === FunctionType.NONE) {
      Lox.errorT(stmt.keyword, "Can't return from top-level.")
    }
    if (stmt.value != null) {
      if (this.currentFunction == FunctionType.INITIALIZER) {
        Lox.errorT(stmt.keyword,
          "Can't return a value from an initializer.")
      }
      this.resolveExpr(stmt.value)
    }
  }

  visitVarStmt(stmt: Var): void {
    this.declare(stmt.name)
    if (stmt.initializer != null) {
      this.resolveExpr(stmt.initializer)
    }
    this.define(stmt.name)
  }

  visitWhileStmt(stmt: While): void {
    this.resolveExpr(stmt.condition)
    this.resolveStmt(stmt.body)
  }

  visitAssignExpr(expr: Assign): void {
    this.resolveExpr(expr.value)
    this.resolveLocal(expr, expr.name)
  }

  visitBinaryExpr(expr: Binary): void {
    this.resolveExpr(expr.left)
    this.resolveExpr(expr.right)
  }

  visitCallExpr(expr: Call): void {
    this.resolveExpr(expr.callee)

    for (let argument of expr.args) {
      this.resolveExpr(argument)
    }
  }

  visitGetExpr(expr: Get): void {
    this.resolveExpr(expr.object)
  }

  visitGroupingExpr(expr: Grouping): void {
    this.resolveExpr(expr.expression)
  }

  visitLiteralExpr(expr: Literal): void {
    return
  }

  visitLogicalExpr(expr: Logical): void {
    this.resolveExpr(expr.left)
    this.resolveExpr(expr.right)
  }

  visitSettExpr(expr: Sett): void {
    this.resolveExpr(expr.value)
    this.resolveExpr(expr.object)
  }

  visitThisExpr(expr: This): void {
    if (this.currentClass == ClassType.NONE) {
      Lox.errorT(expr.keyword,
        `Can't use "this" outside of a class.`)
    }
    this.resolveLocal(expr, expr.keyword)
  }

  visitUnaryExpr(expr: Unary): void {
    this.resolveExpr(expr.right)
  }

  visitVariableExpr(expr: Variable): void {
    if (
      !this.scopes.isEmpty()
      && this.scopes.peek()?.get(expr.name.lexeme) === false
    ) {
      Lox.errorT(expr.name,
        "Can't read local variable in its own initializer.")
    }
    this.resolveLocal(expr, expr.name)
  }
}