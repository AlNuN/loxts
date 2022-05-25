"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Var = exports.Print = exports.Expression = exports.Block = exports.Stmt = void 0;
class Stmt {
}
exports.Stmt = Stmt;
class Block extends Stmt {
    constructor(statements) {
        super();
        this.statements = statements;
    }
    accept(visitor) {
        return visitor.visitBlockStmt(this);
    }
}
exports.Block = Block;
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
class Var extends Stmt {
    constructor(name, initializer) {
        super();
        this.name = name;
        this.initializer = initializer;
    }
    accept(visitor) {
        return visitor.visitVarStmt(this);
    }
}
exports.Var = Var;
