
      // This is a generated file from GenerateAst.ts
      import Token from "./Token"

      export interface Visitor<R> {
        visitBinaryExpr(expr: Binary): R
      
        visitGroupingExpr(expr: Grouping): R
      
        visitLiteralExpr(expr: Literal): R
      
        visitUnaryExpr(expr: Unary): R
      }

      export abstract class Expr {
        abstract accept<R>(visitor: Visitor<R>): R
      }

      
    export class Binary extends Expr {
      public left: Expr; public operator: Token; public right: Expr
      constructor(left: Expr,operator: Token,right: Expr) { 
        super() 
        this.left = left; this.operator = operator; this.right = right
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBinaryExpr(this)
      }
    }
    
    export class Grouping extends Expr {
      public expression: Expr
      constructor(expression: Expr) { 
        super() 
        this.expression = expression
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitGroupingExpr(this)
      }
    }
    
    export class Literal extends Expr {
      public value: Object|null
      constructor(value: Object|null) { 
        super() 
        this.value = value
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteralExpr(this)
      }
    }
    
    export class Unary extends Expr {
      public operator: Token; public right: Expr
      constructor(operator: Token,right: Expr) { 
        super() 
        this.operator = operator; this.right = right
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitUnaryExpr(this)
      }
    }
    
    