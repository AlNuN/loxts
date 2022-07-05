"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LoxInstance_1 = __importDefault(require("./LoxInstance"));
class LoxClass {
    constructor(name, methods) {
        this.name = name;
        this.methods = methods;
    }
    findMethod(name) {
        let method = this.methods.get(name);
        if (method)
            return method;
        return null;
    }
    call(interpreter, args) {
        let instance = new LoxInstance_1.default(this);
        let initializer = this.findMethod('init');
        if (initializer) {
            initializer.bind(instance).call(interpreter, args);
        }
        return instance;
    }
    arity() {
        let initializer = this.findMethod('init');
        if (initializer == null)
            return 0;
        return initializer.arity();
    }
    toString() {
        return this.name;
    }
}
exports.default = LoxClass;
