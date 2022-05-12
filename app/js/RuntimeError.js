"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RuntimeError extends Error {
    constructor(token, message) {
        super(message);
        this.token = token;
    }
}
exports.default = RuntimeError;
