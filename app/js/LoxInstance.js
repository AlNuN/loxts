"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RuntimeError_1 = __importDefault(require("./RuntimeError"));
class LoxInstance {
    constructor(klass) {
        this.fields = new Map();
        this.klass = klass;
    }
    get(name) {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme);
        }
        let method = this.klass.findMethod(name.lexeme);
        if (method)
            return method.bind(this);
        throw new RuntimeError_1.default(name, `Undefined property "${name.lexeme}".`);
    }
    set(name, value) {
        this.fields.set(name.lexeme, value);
    }
    toString() {
        return `${this.klass.name} instance`;
    }
}
exports.default = LoxInstance;
