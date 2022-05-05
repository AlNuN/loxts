import { writeFileSync } from "fs"
import { exit } from "process"

interface GeneratedClass {
  className: string,
  fields: Array<string>
}

class GenerateAst {
  public static defineAst(outputDir: string, baseName: string, types: Array<GeneratedClass>): void {
    const path:string = `${outputDir}/${baseName}.ts`

    let classes: string = ''
    types.forEach(v => {
      classes += GenerateAst.defineType(baseName, v.className, v.fields)
    })
    let visitor = this.defineVisitor(baseName, types)
    const data:string = `
      // This is a generated file from GenerateAst.ts
      import Token from "./Token"

      ${visitor}

      export abstract class ${baseName} {
        abstract accept<R>(visitor: Visitor<R>): R
      }

      ${classes}
    `

    writeFileSync(path, data, { encoding: "utf-8" });
    exit(0)
  }

  private static defineType(baseName: string, className: string, fields: Array<string>): string {
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
    `
  }

  private static defineVisitor(baseName: string, types: Array<GeneratedClass>): string {
    let inter:string = 'export interface Visitor<R> {'
    types.forEach(t => {
      inter += `
        visit${t.className}${baseName}(${baseName.toLowerCase()}: ${t.className}): R
      `
    })
    inter += '}'

    return inter
  }
}

if (process.argv.length != 3) {
  console.error("Usage: npm run generate <output directory>")
  exit(65)
}

let outputDir = process.argv[2];

const classes: Array<GeneratedClass> = [
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
]

GenerateAst.defineAst(outputDir, 'Expr', classes)