import Environment from "./Environment";
import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxInstance from "./LoxInstance";
import ReturnError from "./ReturnError";
import { Func } from "./Stmt";

export default class LoxFunction implements LoxCallable {
  private declaration : Func
  private closure: Environment
  private readonly isInitializer: boolean

  constructor(declaration: Func, closure: Environment, isInitializer: boolean) {
    this.declaration = declaration
    this.closure = closure
    this.isInitializer = isInitializer
  }

  bind (instance: LoxInstance): LoxFunction {
    let environment = new Environment(this.closure)
    environment.define('this', instance)
    return new LoxFunction(this.declaration, environment, this.isInitializer)
  }

  call(interpreter: Interpreter, args: any[]) {
    let environment: Environment = new Environment(this.closure)
    for(let i = 0; i < this.declaration.params.length; ++i) {
      environment.define(this.declaration.params[i].lexeme, args[i])
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (returnValue) {
      if (this.isInitializer) return this.closure.getAt(0, 'this')
      if (returnValue instanceof ReturnError) {
        return returnValue.value
      }
    }

    if (this.isInitializer) return this.closure.getAt(0, 'this')
    return null
  }

  arity(): number {
    return this.declaration.params.length
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}