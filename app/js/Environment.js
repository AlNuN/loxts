"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RuntimeError_1 = __importDefault(require("./RuntimeError"));
class Environment {
    constructor(enclosing) {
        this.values = new Map();
        this.enclosing = enclosing;
    }
    define(name, value) {
        this.values.set(name, value);
    }
    ancestor(distance) {
        let env = this;
        for (let i = 0; i < distance; i++) {
            if (env != null)
                env = env.enclosing;
        }
        return env;
    }
    getAt(distance, name) {
        return this.ancestor(distance)?.values.get(name);
    }
    assignAt(distance, name, value) {
        this.ancestor(distance)?.values.set(name.lexeme, value);
    }
    get(name) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }
        if (this.enclosing !== null)
            return this.enclosing.get(name);
        throw new RuntimeError_1.default(name, `Undefined variable "${name.lexeme}".`);
    }
    assign(name, value) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }
        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new RuntimeError_1.default(name, `Undfined variable "${name.lexeme}".`);
    }
}
exports.default = Environment;
