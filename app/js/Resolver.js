"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = void 0;
const Lox_1 = __importDefault(require("./Lox"));
const Stack_1 = require("./Stack");
var FunctionType;
(function (FunctionType) {
    FunctionType[FunctionType["NONE"] = 0] = "NONE";
    FunctionType[FunctionType["FUNC"] = 1] = "FUNC";
})(FunctionType || (FunctionType = {}));
class Resolver {
    constructor(interpreter) {
        this.scopes = new Stack_1.Stack();
        this.currentFunction = FunctionType.NONE;
        this.interpreter = interpreter;
    }
    resolve(statements) {
        for (let statement of statements) {
            this.resolveStmt(statement);
        }
    }
    resolveStmt(stmt) {
        stmt.accept(this);
    }
    resolveExpr(expr) {
        expr.accept(this);
    }
    resolveFunction(func, type) {
        let enclosingFunction = this.currentFunction;
        this.currentFunction = type;
        this.beginScope();
        for (let param of func.params) {
            this.declare(param);
            this.define(param);
        }
        this.resolve(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }
    beginScope() {
        this.scopes.push(new Map());
    }
    endScope() {
        this.scopes.pop();
    }
    declare(name) {
        if (this.scopes.isEmpty())
            return;
        let scope = this.scopes.peek();
        if (scope?.has(name.lexeme)) {
            Lox_1.default.errorT(name, 'Already a variable with this name in this scope');
        }
        scope?.set(name.lexeme, false);
    }
    define(name) {
        if (this.scopes.isEmpty())
            return;
        this.scopes.peek()?.set(name.lexeme, true);
    }
    resolveLocal(expr, name) {
        for (let i = this.scopes.size() - 1; i >= 0; i--) {
            if (this.scopes.get(i).has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.size() - 1 - i);
                return;
            }
        }
    }
    visitBlockStmt(stmt) {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    }
    visitExpressionStmt(stmt) {
        this.resolveExpr(stmt.expression);
    }
    visitFuncStmt(stmt) {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, FunctionType.FUNC);
    }
    visitIfStmt(stmt) {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch != null)
            this.resolveStmt(stmt.elseBranch);
    }
    visitPrintStmt(stmt) {
        this.resolveExpr(stmt.expression);
    }
    visitReturnStmt(stmt) {
        if (this.currentFunction === FunctionType.NONE) {
            Lox_1.default.errorT(stmt.keyword, "Can't return from top-level.");
        }
        if (stmt.value != null) {
            this.resolveExpr(stmt.value);
        }
    }
    visitVarStmt(stmt) {
        this.declare(stmt.name);
        if (stmt.initializer != null) {
            this.resolveExpr(stmt.initializer);
        }
        this.define(stmt.name);
    }
    visitWhileStmt(stmt) {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.body);
    }
    visitAssignExpr(expr) {
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name);
    }
    visitBinaryExpr(expr) {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitCallExpr(expr) {
        this.resolveExpr(expr.callee);
        for (let argument of expr.args) {
            this.resolveExpr(argument);
        }
    }
    visitGroupingExpr(expr) {
        this.resolveExpr(expr.expression);
    }
    visitLiteralExpr(expr) {
        return;
    }
    visitLogicalExpr(expr) {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitUnaryExpr(expr) {
        this.resolveExpr(expr.right);
    }
    visitVariableExpr(expr) {
        if (!this.scopes.isEmpty()
            && this.scopes.peek()?.get(expr.name.lexeme) === false) {
            Lox_1.default.errorT(expr.name, "Can't read local variable in its own initializer.");
        }
        this.resolveLocal(expr, expr.name);
    }
}
exports.Resolver = Resolver;
