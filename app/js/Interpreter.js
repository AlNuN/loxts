"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Environment_1 = __importDefault(require("./Environment"));
const Lox_1 = __importDefault(require("./Lox"));
const LoxClass_1 = __importDefault(require("./LoxClass"));
const LoxFunction_1 = __importDefault(require("./LoxFunction"));
const LoxInstance_1 = __importDefault(require("./LoxInstance"));
const ReturnError_1 = __importDefault(require("./ReturnError"));
const RuntimeError_1 = __importDefault(require("./RuntimeError"));
const TokenType_1 = require("./TokenType");
class Interpreter {
    constructor() {
        this.globals = new Environment_1.default(null);
        this.environment = this.globals;
        this.locals = new Map();
        this.globals.define('clock', {
            arity: () => { return 0; },
            call: (interpreter, args) => {
                return Date.now() / 1000;
            },
            toString: () => {
                '<native fn>';
            }
        });
    }
    interpret(statements) {
        try {
            for (let statement of statements) {
                this.execute(statement);
            }
        }
        catch (error) {
            if (error instanceof RuntimeError_1.default) {
                Lox_1.default.runtimeError(error);
                return;
            }
            console.error('Uncaught error during runtime');
        }
    }
    visitLiteralExpr(expr) {
        return expr.value;
    }
    visitLogicalExpr(expr) {
        let left = this.evaluate(expr.left);
        if (expr.operator.type === TokenType_1.TokenType.OR) {
            if (this.isTruthy(left))
                return left;
        }
        else {
            if (!this.isTruthy(left))
                return left;
        }
        return this.evaluate(expr.right);
    }
    visitSettExpr(expr) {
        let object = this.evaluate(expr.object);
        if (!(object instanceof LoxInstance_1.default)) {
            throw new RuntimeError_1.default(expr.name, 'Only instances have fields.');
        }
        let value = this.evaluate(expr.value);
        object.set(expr.name, value);
        return value;
    }
    visitSuperExpr(expr) {
        let distance = this.locals.get(expr);
        if (!distance) {
            throw new RuntimeError_1.default(expr.method, `Undefined property "${expr.method.lexeme}".`);
        }
        let superclass = this.environment.getAt(distance, 'super');
        let object = this.environment.getAt(distance - 1, 'this');
        let method = superclass.findMethod(expr.method.lexeme);
        if (!method) {
            throw new RuntimeError_1.default(expr.method, `Undefined property "${expr.method.lexeme}".`);
        }
        return method.bind(object);
    }
    visitThisExpr(expr) {
        return this.lookUpVariable(expr.keyword, expr);
    }
    visitUnaryExpr(expr) {
        let right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType_1.TokenType.BANG:
                return !this.isTruthy(right);
            case TokenType_1.TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -Number(right);
        }
        return null;
    }
    visitVariableExpr(expr) {
        return this.lookUpVariable(expr.name, expr);
    }
    lookUpVariable(name, expr) {
        let distance = this.locals.get(expr);
        if (distance != null) {
            return this.environment.getAt(distance, name.lexeme);
        }
        else {
            return this.globals.get(name);
        }
    }
    checkNumberOperand(operator, operand) {
        if (typeof operand === 'number')
            return;
        throw new RuntimeError_1.default(operator, 'Operand must be a number.');
    }
    checkNumberOperands(operator, left, right) {
        if (typeof left === 'number' && typeof right === 'number')
            return;
        throw new RuntimeError_1.default(operator, 'Operands must be numbers.');
    }
    isTruthy(object) {
        if (object === null)
            return false;
        if (typeof object === 'boolean')
            return !!object;
        return true;
    }
    isEqual(a, b) {
        if (a === null && b === null)
            return true;
        if (a === null)
            return false;
        return Object.is(a, b);
    }
    stringify(object) {
        if (object === null)
            return 'nil';
        if (typeof object === 'number') {
            return String(object);
        }
        return '' + object;
    }
    visitGroupingExpr(expr) {
        return this.evaluate(expr.expression);
    }
    evaluate(expr) {
        return expr.accept(this);
    }
    execute(stmt) {
        stmt.accept(this);
    }
    resolve(expr, depth) {
        this.locals.set(expr, depth);
    }
    executeBlock(statements, environment) {
        let previous = this.environment;
        try {
            this.environment = environment;
            for (let statement of statements) {
                this.execute(statement);
            }
        }
        finally {
            this.environment = previous;
        }
    }
    visitBlockStmt(stmt) {
        this.executeBlock(stmt.statements, new Environment_1.default(this.environment));
        return;
    }
    visitClassStmt(stmt) {
        let superclass = null;
        if (stmt.superclass) {
            superclass = this.evaluate(stmt.superclass);
            if (!(superclass instanceof LoxClass_1.default)) {
                throw new RuntimeError_1.default(stmt.superclass.name, 'Superclass must be a class.');
            }
        }
        this.environment.define(stmt.name.lexeme, null);
        if (stmt.superclass) {
            this.environment = new Environment_1.default(this.environment);
            this.environment.define('super', superclass);
        }
        let methods = new Map();
        for (let method of stmt.methods) {
            let func = new LoxFunction_1.default(method, this.environment, method.name.lexeme == 'init');
            methods.set(method.name.lexeme, func);
        }
        const klass = new LoxClass_1.default(stmt.name.lexeme, superclass, methods);
        if (superclass && this.environment.enclosing) {
            this.environment = this.environment.enclosing;
        }
        this.environment.assign(stmt.name, klass);
    }
    visitExpressionStmt(stmt) {
        this.evaluate(stmt.expression);
    }
    visitFuncStmt(stmt) {
        let func = new LoxFunction_1.default(stmt, this.environment, false);
        this.environment.define(stmt.name.lexeme, func);
    }
    visitIfStmt(stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        }
        else if (stmt.elseBranch != null) {
            this.execute(stmt.elseBranch);
        }
    }
    visitPrintStmt(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }
    visitReturnStmt(stmt) {
        let value = null;
        if (stmt.value != null)
            value = this.evaluate(stmt.value);
        throw new ReturnError_1.default(value);
    }
    visitVarStmt(stmt) {
        let value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }
    visitWhileStmt(stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }
    visitAssignExpr(expr) {
        const value = this.evaluate(expr.value);
        let distance = this.locals.get(expr);
        if (distance != null) {
            this.environment.assignAt(distance, expr.name, value);
        }
        else {
            this.globals.assign(expr.name, value);
        }
        return value;
    }
    visitBinaryExpr(expr) {
        let left = this.evaluate(expr.left);
        let right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType_1.TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType_1.TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType_1.TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType_1.TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case TokenType_1.TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) - Number(right);
            case TokenType_1.TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number')
                    return Number(left) + Number(right);
                if (typeof left === 'string' && typeof right === 'string')
                    return String(left) + String(right);
                throw new RuntimeError_1.default(expr.operator, 'Operands must be two numbers or two strings.');
            case TokenType_1.TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType_1.TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            case TokenType_1.TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case TokenType_1.TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
        }
        return null;
    }
    visitCallExpr(expr) {
        let callee = this.evaluate(expr.callee);
        let args = [];
        for (let arg of expr.args) {
            args.push(this.evaluate(arg));
        }
        if (!(callee.call)
            || !(callee.arity)
            || !(callee.toString)) {
            throw new RuntimeError_1.default(expr.paren, 'Can only call functions and classes.');
        }
        let func = callee;
        if (args.length != func.arity()) {
            throw new RuntimeError_1.default(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`);
        }
        return func.call(this, args);
    }
    visitGetExpr(expr) {
        let object = this.evaluate(expr.object);
        if (object instanceof LoxInstance_1.default) {
            return object.get(expr.name);
        }
        throw new RuntimeError_1.default(expr.name, 'Only instances have properties');
    }
}
exports.default = Interpreter;
