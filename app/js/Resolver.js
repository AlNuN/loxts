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
    FunctionType[FunctionType["INITIALIZER"] = 2] = "INITIALIZER";
    FunctionType[FunctionType["METHOD"] = 3] = "METHOD";
})(FunctionType || (FunctionType = {}));
var ClassType;
(function (ClassType) {
    ClassType[ClassType["NONE"] = 0] = "NONE";
    ClassType[ClassType["CLASS"] = 1] = "CLASS";
    ClassType[ClassType["SUBCLASS"] = 2] = "SUBCLASS";
})(ClassType || (ClassType = {}));
class Resolver {
    constructor(interpreter) {
        this.scopes = new Stack_1.Stack();
        this.currentFunction = FunctionType.NONE;
        this.currentClass = ClassType.NONE;
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
    visitClassStmt(stmt) {
        let enclosingClass = this.currentClass;
        this.currentClass = ClassType.CLASS;
        this.declare(stmt.name);
        this.define(stmt.name);
        if (stmt.superclass &&
            stmt.name.lexeme == stmt.superclass.name.lexeme) {
            Lox_1.default.errorT(stmt.superclass.name, "A class can't inherit from itself.");
        }
        if (stmt.superclass) {
            this.currentClass = ClassType.SUBCLASS;
            this.resolveExpr(stmt.superclass);
        }
        if (stmt.superclass) {
            this.beginScope();
            this.scopes.peek()?.set('super', true);
        }
        this.beginScope();
        this.scopes.peek()?.set('this', true);
        for (let method of stmt.methods) {
            let declaration = FunctionType.METHOD;
            if (method.name.lexeme == 'init') {
                declaration = FunctionType.INITIALIZER;
            }
            this.resolveFunction(method, declaration);
        }
        this.endScope();
        if (stmt.superclass)
            this.endScope();
        this.currentClass = enclosingClass;
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
            if (this.currentFunction == FunctionType.INITIALIZER) {
                Lox_1.default.errorT(stmt.keyword, "Can't return a value from an initializer.");
            }
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
    visitGetExpr(expr) {
        this.resolveExpr(expr.object);
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
    visitSettExpr(expr) {
        this.resolveExpr(expr.value);
        this.resolveExpr(expr.object);
    }
    visitSuperExpr(expr) {
        if (this.currentClass === ClassType.NONE) {
            Lox_1.default.errorT(expr.keyword, `Can't use "super" outside of a class`);
        }
        else if (this.currentClass !== ClassType.SUBCLASS) {
            Lox_1.default.errorT(expr.keyword, `Can't use "super" in a class with no superclass`);
        }
        this.resolveLocal(expr, expr.keyword);
    }
    visitThisExpr(expr) {
        if (this.currentClass == ClassType.NONE) {
            Lox_1.default.errorT(expr.keyword, `Can't use "this" outside of a class.`);
        }
        this.resolveLocal(expr, expr.keyword);
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
