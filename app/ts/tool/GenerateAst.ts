import { writeFileSync } from "fs"
import { exit } from "process"

interface GeneratedClass {
  className: string,
  fields: Array<string>
}

class GenerateAst {
  public static defineAst(outputDir: string, baseName: string, types: Array<GeneratedClass>, imports: string): void {
    const path:string = `${outputDir}/${baseName}.ts`

    let classes: string = ''
    types.forEach(v => {
      classes += GenerateAst.defineType(baseName, v.className, v.fields)
    })
    let visitor = this.defineVisitor(baseName, types)
    const data:string = `
      // This is a generated file from GenerateAst.ts
      ${imports}

      ${visitor}

      export abstract class ${baseName} {
        abstract accept<R>(visitor: Visitor<R>): R
      }

      ${classes}
    `

    writeFileSync(path, data, { encoding: "utf-8" });
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

const exprClasses: Array<GeneratedClass> = [
  {
    className: "Assign",
    fields: ['name: Token', 'value: Expr'],
  },
  {
    className: "Binary",
    fields: ['left: Expr', 'operator: Token', 'right: Expr'],
  },
  {
    className: "Call",
    fields: ['callee: Expr', 'paren: Token', 'args: Array<Expr>'],
  },
  {
    className: "Get",
    fields: ['object: Expr', 'name: Token'],
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
    className: "Sett",
    fields: ['object: Expr', 'name: Token', 'value: Expr']
  },
  {
    className: "This",
    fields: ['keyword: Token']
  },
  {
    className: "Unary",
    fields: ['operator: Token', 'right: Expr']
  },
  {
    className: "Variable",
    fields: ['name: Token']
  },
]

GenerateAst.defineAst(outputDir, 'Expr', exprClasses, 'import Token from "./Token"')

const stmtClasses: Array<GeneratedClass> = [
  {
    className: "Block",
    fields: ['statements: Array<Stmt>']
  },
  {
    className: "Class",
    fields: ['name: Token', 'methods: Array<Func>']
  },
  {
    className: "Expression",
    fields: ['expression: Expr']
  },
  {
    className: "Func",
    fields: ['name: Token', 'params: Array<Token>', 'body: Array<Stmt>']
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
    className: "Return",
    fields: ['keyword: Token', 'value: Expr|null']
  },
  {
    className: "Var",
    fields: ['name: Token', 'initializer: Expr|null']
  },
  {
    className: "While",
    fields: ['condition: Expr', 'body: Stmt']
  },
]

GenerateAst.defineAst(outputDir, 'Stmt', stmtClasses, 'import { Expr } from "./Expr"; import Token from "./Token"')
