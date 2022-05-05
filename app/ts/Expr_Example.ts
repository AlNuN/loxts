import Token from "./Token"

export interface Visitor<R> {
  visitBynaryExpr(expr: Binary): R 
}

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R

    // readonly left: Expr
    // readonly operator: Token
    // readonly right: Expr
}

export class Binary extends Expr {
  constructor(left: Expr, operator: Token, right: Expr) { 
    super() 
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBynaryExpr(this)
  }
}