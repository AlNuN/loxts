"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Print = exports.Expression = exports.Stmt = void 0;
class Stmt {
}
exports.Stmt = Stmt;
class Expression extends Stmt {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitExpressionStmt(this);
    }
}
exports.Expression = Expression;
class Print extends Stmt {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitPrintStmt(this);
    }
}
exports.Print = Print;
