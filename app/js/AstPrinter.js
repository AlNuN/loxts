"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstPrinter = void 0;
const Expr_1 = require("./Expr");
const Token_1 = __importDefault(require("./Token"));
const TokenType_1 = require("./TokenType");
class AstPrinter {
    print(expr) {
        return expr.accept(this);
    }
    visitBinaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }
    visitGroupingExpr(expr) {
        return this.parenthesize('group', expr.expression);
    }
    visitLiteralExpr(expr) {
        if (expr.value === null)
            return 'nil';
        return expr.value.toString();
    }
    visitUnaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }
    parenthesize(name, ...exprs) {
        let result = `(${name}`;
        exprs.forEach(e => {
            result += ` ${e.accept(this)}`;
        });
        result += ')';
        return result;
    }
}
exports.AstPrinter = AstPrinter;
const expression = new Expr_1.Binary(new Expr_1.Unary(new Token_1.default(TokenType_1.TokenType.MINUS, '-', null, 1), new Expr_1.Literal(123)), new Token_1.default(TokenType_1.TokenType.STAR, '*', null, 1), new Expr_1.Grouping(new Expr_1.Literal(45.67)));
console.log(new AstPrinter().print(expression));
