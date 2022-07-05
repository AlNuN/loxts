import LoxClass from "./LoxClass";
import RuntimeError from "./RuntimeError";
import Token from "./Token";

export default class LoxInstance {
  private klass: LoxClass
  private readonly fields: Map<string, any> = new Map()

  constructor(klass: LoxClass) {
    this.klass = klass
  }

  get(name: Token): any {
    if(this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme)
    }

    let method = this.klass.findMethod(name.lexeme)
    if (method) return method.bind(this)

    throw new RuntimeError(name, 
      `Undefined property "${name.lexeme}".`)
  }

  set(name: Token, value: any): void {
    this.fields.set(name.lexeme, value)
  }

  public toString() {
    return `${this.klass.name} instance`
  }
}