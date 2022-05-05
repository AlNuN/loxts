"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const process_1 = require("process");
class GenerateAst {
    static defineAst(outputDir, baseName, types) {
        const path = `${outputDir}/${baseName}.ts`;
        let classes = '';
        types.forEach(v => {
            classes += GenerateAst.defineType(baseName, v.className, v.fields);
        });
        let visitor = this.defineVisitor(baseName, types);
        const data = `
      // This is a generated file from GenerateAst.ts
      import Token from "./Token"

      ${visitor}

      export abstract class ${baseName} {
        abstract accept<R>(visitor: Visitor<R>): R
      }

      ${classes}
    `;
        (0, fs_1.writeFileSync)(path, data, { encoding: "utf-8" });
        (0, process_1.exit)(0);
    }
    static defineType(baseName, className, fields) {
        return `
    export class ${className} extends ${baseName} {
      ${fields.map(f => `public ${f}`).join('; ')}
      constructor(${fields.join(',')}) { 
        super() 
        ${fields.map(f => `this.${f.split(':')[0]} = ${f.split(':')[0]}`).join('; ')}
      }
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visit${className}${baseName}(this)
      }
    }
    `;
    }
    static defineVisitor(baseName, types) {
        let inter = 'export interface Visitor<R> {';
        types.forEach(t => {
            inter += `
        visit${t.className}${baseName}(${baseName.toLowerCase()}: ${t.className}): R
      `;
        });
        inter += '}';
        return inter;
    }
}
if (process.argv.length != 3) {
    console.error("Usage: npm run generate <output directory>");
    (0, process_1.exit)(65);
}
let outputDir = process.argv[2];
const classes = [
    {
        className: "Binary",
        fields: ['left: Expr', 'operator: Token', 'right: Expr'],
    },
    {
        className: "Grouping",
        fields: ['expression: Expr']
    },
    {
        className: "Literal",
        fields: ['value: Object']
    },
    {
        className: "Unary",
        fields: ['operator: Token', 'right: Expr']
    },
];
GenerateAst.defineAst(outputDir, 'Expr', classes);
