// import { Visitor, Expr, Binary, Grouping, Literal, Unary } from "./Expr";

// export class AstPrinter implements Visitor<string> {
//   public print(expr: Expr|null) {
//     if (expr === null) return
//     return expr.accept(this)
//   }

//   public visitBinaryExpr(expr: Binary): string {
//     return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
//   }

//   public visitGroupingExpr(expr: Grouping): string {
//     return this.parenthesize('group', expr.expression)
//   }

//   public visitLiteralExpr(expr: Literal): string {
//     if (expr.value === null) return 'nil'
//     return expr.value.toString()
//   }

//   public visitUnaryExpr(expr: Unary): string {
//     return this.parenthesize(expr.operator.lexeme, expr.right)
//   }

//   private parenthesize(name: string, ...exprs: Array<Expr>): string {
//     let result = `(${name}`

//     exprs.forEach(e => {
//       result += ` ${e.accept(this)}`
//     })

//     result += ')'

//     return result
//   }
// }

// import Token from "./Token";
// import { TokenType } from "./TokenType";
// const expression : Expr = new Binary(
//   new Unary (
//     new Token(TokenType.MINUS, '-', null, 1),
//     new Literal(123)),
//   new Token(TokenType.STAR, '*', null, 1),
//   new Grouping(new Literal(45.67))
// )

// console.log(new AstPrinter().print(expression))
