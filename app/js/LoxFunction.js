"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Environment_1 = __importDefault(require("./Environment"));
const ReturnError_1 = __importDefault(require("./ReturnError"));
class LoxFunction {
    constructor(declaration, closure, isInitializer) {
        this.declaration = declaration;
        this.closure = closure;
        this.isInitializer = isInitializer;
    }
    bind(instance) {
        let environment = new Environment_1.default(this.closure);
        environment.define('this', instance);
        return new LoxFunction(this.declaration, environment, this.isInitializer);
    }
    call(interpreter, args) {
        let environment = new Environment_1.default(this.closure);
        for (let i = 0; i < this.declaration.params.length; ++i) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        }
        catch (returnValue) {
            if (this.isInitializer)
                return this.closure.getAt(0, 'this');
            if (returnValue instanceof ReturnError_1.default) {
                return returnValue.value;
            }
        }
        if (this.isInitializer)
            return this.closure.getAt(0, 'this');
        return null;
    }
    arity() {
        return this.declaration.params.length;
    }
    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}
exports.default = LoxFunction;
