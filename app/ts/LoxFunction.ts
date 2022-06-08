import Environment from "./Environment";
import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import ReturnError from "./ReturnError";
import { Func } from "./Stmt";

export default class LoxFunction implements LoxCallable {
  private declaration : Func
  private closure: Environment

  constructor(declaration: Func, closure: Environment) {
    this.declaration = declaration
    this.closure = closure
  }

  call(interpreter: Interpreter, args: any[]) {
    let environment: Environment = new Environment(this.closure)
    for(let i = 0; i < this.declaration.params.length; ++i) {
      environment.define(this.declaration.params[i].lexeme, args[i])
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (returnValue) {
      if (returnValue instanceof ReturnError) {
        return returnValue.value
      }
    }
    return null
  }

  arity(): number {
    return this.declaration.params.length
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}