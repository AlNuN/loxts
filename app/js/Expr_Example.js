"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Binary = exports.Expr = void 0;
class Expr {
}
exports.Expr = Expr;
class Binary extends Expr {
    constructor(left, operator, right) {
        super();
    }
    accept(visitor) {
        return visitor.visitBynaryExpr(this);
    }
}
exports.Binary = Binary;
