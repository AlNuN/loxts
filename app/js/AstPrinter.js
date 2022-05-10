"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstPrinter = void 0;
class AstPrinter {
    print(expr) {
        if (expr === null)
            return;
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
