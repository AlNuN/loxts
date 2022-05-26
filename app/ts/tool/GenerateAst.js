"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var process_1 = require("process");
var GenerateAst = /** @class */ (function () {
    function GenerateAst() {
    }
    GenerateAst.defineAst = function (outputDir, baseName, types, imports) {
        var path = "".concat(outputDir, "/").concat(baseName, ".ts");
        var classes = '';
        types.forEach(function (v) {
            classes += GenerateAst.defineType(baseName, v.className, v.fields);
        });
        var visitor = this.defineVisitor(baseName, types);
        var data = "\n      // This is a generated file from GenerateAst.ts\n      ".concat(imports, "\n\n      ").concat(visitor, "\n\n      export abstract class ").concat(baseName, " {\n        abstract accept<R>(visitor: Visitor<R>): R\n      }\n\n      ").concat(classes, "\n    ");
        (0, fs_1.writeFileSync)(path, data, { encoding: "utf-8" });
    };
    GenerateAst.defineType = function (baseName, className, fields) {
        return "\n    export class ".concat(className, " extends ").concat(baseName, " {\n      ").concat(fields.map(function (f) { return "public ".concat(f); }).join('; '), "\n      constructor(").concat(fields.join(','), ") { \n        super() \n        ").concat(fields.map(function (f) { return "this.".concat(f.split(':')[0], " = ").concat(f.split(':')[0]); }).join('; '), "\n      }\n      accept<R>(visitor: Visitor<R>): R {\n        return visitor.visit").concat(className).concat(baseName, "(this)\n      }\n    }\n    ");
    };
    GenerateAst.defineVisitor = function (baseName, types) {
        var inter = 'export interface Visitor<R> {';
        types.forEach(function (t) {
            inter += "\n        visit".concat(t.className).concat(baseName, "(").concat(baseName.toLowerCase(), ": ").concat(t.className, "): R\n      ");
        });
        inter += '}';
        return inter;
    };
    return GenerateAst;
}());
if (process.argv.length != 3) {
    console.error("Usage: npm run generate <output directory>");
    (0, process_1.exit)(65);
}
var outputDir = process.argv[2];
var exprClasses = [
    {
        className: "Assign",
        fields: ['name: Token', 'value: Expr']
    },
    {
        className: "Binary",
        fields: ['left: Expr', 'operator: Token', 'right: Expr']
    },
    {
        className: "Grouping",
        fields: ['expression: Expr']
    },
    {
        className: "Literal",
        fields: ['value: Object|null']
    },
    {
        className: "Logical",
        fields: ['left: Expr', 'operator: Token', 'right: Expr']
    },
    {
        className: "Unary",
        fields: ['operator: Token', 'right: Expr']
    },
    {
        className: "Variable",
        fields: ['name: Token']
    },
];
GenerateAst.defineAst(outputDir, 'Expr', exprClasses, 'import Token from "./Token"');
var stmtClasses = [
    {
        className: "Block",
        fields: ['statements: Array<Stmt>']
    },
    {
        className: "Expression",
        fields: ['expression: Expr']
    },
    {
        className: "If",
        fields: ['condition: Expr', 'thenBranch: Stmt', 'elseBranch: Stmt|null']
    },
    {
        className: "Print",
        fields: ['expression: Expr']
    },
    {
        className: "Var",
        fields: ['name: Token', 'initializer: Expr|null']
    },
    {
        className: "While",
        fields: ['condition: Expr', 'body: Stmt']
    },
];
GenerateAst.defineAst(outputDir, 'Stmt', stmtClasses, 'import { Expr } from "./Expr"; import Token from "./Token"');
