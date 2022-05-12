"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Lox_1 = __importDefault(require("./Lox"));
const RuntimeError_1 = __importDefault(require("./RuntimeError"));
const TokenType_1 = require("./TokenType");
class Interpreter {
    interpret(expression) {
        try {
            let value = this.evaluate(expression);
            console.log(this.stringify(value));
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
}
exports.default = Interpreter;
