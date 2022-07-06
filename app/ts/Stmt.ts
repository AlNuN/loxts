
      // This is a generated file from GenerateAst.ts
      import { Expr, Variable } from "./Expr"; import Token from "./Token"

      export interface Visitor<R> {
        visitBlockStmt(stmt: Block): R
      
        visitClassStmt(stmt: Class): R
      
        visitExpressionStmt(stmt: Expression): R
      
        visitFuncStmt(stmt: Func): R
      
        visitIfStmt(stmt: If): R
      
        visitPrintStmt(stmt: Print): R
      
        visitReturnStmt(stmt: Return): R
      
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
    
    export class Class extends Stmt {
      public name: Token; public superclass: Variable|null; public methods: Array<Func>
      constructor(name: Token,superclass: Variable|null,methods: Array<Func>) { 
        super() 
        this.name = name; this.superclass = superclass; this.methods = methods
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitClassStmt(this)
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
    
    export class Func extends Stmt {
      public name: Token; public params: Array<Token>; public body: Array<Stmt>
      constructor(name: Token,params: Array<Token>,body: Array<Stmt>) { 
        super() 
        this.name = name; this.params = params; this.body = body
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitFuncStmt(this)
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
    
    export class Return extends Stmt {
      public keyword: Token; public value: Expr|null
      constructor(keyword: Token,value: Expr|null) { 
        super() 
        this.keyword = keyword; this.value = value
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitReturnStmt(this)
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
    
    