"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Environment_1 = __importDefault(require("./Environment"));
const ReturnError_1 = __importDefault(require("./ReturnError"));
class LoxFunction {
    constructor(declaration) {
        this.declaration = declaration;
    }
    call(interpreter, args) {
        let environment = new Environment_1.default(interpreter.globals);
        for (let i = 0; i < this.declaration.params.length; ++i) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        }
        catch (returnValue) {
            if (returnValue instanceof ReturnError_1.default) {
                return returnValue.value;
            }
        }
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
