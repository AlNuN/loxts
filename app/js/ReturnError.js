"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ReturnError extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}
exports.default = ReturnError;
