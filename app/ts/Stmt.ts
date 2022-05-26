
      // This is a generated file from GenerateAst.ts
      import { Expr } from "./Expr"; import Token from "./Token"

      export interface Visitor<R> {
        visitBlockStmt(stmt: Block): R
      
        visitExpressionStmt(stmt: Expression): R
      
        visitIfStmt(stmt: If): R
      
        visitPrintStmt(stmt: Print): R
      
        visitVarStmt(stmt: Var): R
      
        visitWhileStmt(stmt: While): R
      }

      export abstract class Stmt {
        abstract accept<R>(visitor: Visitor<R>): R
      }

      
    export class Block extends Stmt {
      public statements: Array<Stmt>
      constructor(statements: Array<Stmt>) { 
        super() 
        this.statements = statements
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBlockStmt(this)
      }
    }
    
    export class Expression extends Stmt {
      public expression: Expr
      constructor(expression: Expr) { 
        super() 
        this.expression = expression
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitExpressionStmt(this)
      }
    }
    
    export class If extends Stmt {
      public condition: Expr; public thenBranch: Stmt; public elseBranch: Stmt|null
      constructor(condition: Expr,thenBranch: Stmt,elseBranch: Stmt|null) { 
        super() 
        this.condition = condition; this.thenBranch = thenBranch; this.elseBranch = elseBranch
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitIfStmt(this)
      }
    }
    
    export class Print extends Stmt {
      public expression: Expr
      constructor(expression: Expr) { 
        super() 
        this.expression = expression
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitPrintStmt(this)
      }
    }
    
    export class Var extends Stmt {
      public name: Token; public initializer: Expr|null
      constructor(name: Token,initializer: Expr|null) { 
        super() 
        this.name = name; this.initializer = initializer
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitVarStmt(this)
      }
    }
    
    export class While extends Stmt {
      public condition: Expr; public body: Stmt
      constructor(condition: Expr,body: Stmt) { 
        super() 
        this.condition = condition; this.body = body
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitWhileStmt(this)
      }
    }
    
    