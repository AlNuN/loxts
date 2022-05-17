
      // This is a generated file from GenerateAst.ts
      import { Expr } from "./Expr"

      export interface Visitor<R> {
        visitExpressionStmt(stmt: Expression): R
      
        visitPrintStmt(stmt: Print): R
      }

      export abstract class Stmt {
        abstract accept<R>(visitor: Visitor<R>): R
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
    
    