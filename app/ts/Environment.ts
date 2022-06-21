import RuntimeError from "./RuntimeError"
import Token from "./Token"

export default class Environment {
  public enclosing: Environment|null
  private values: Map<string, any> = new Map()

  constructor(enclosing: Environment|null) {
    this.enclosing = enclosing
  }

  define(name: string, value: any): void {
    this.values.set(name, value)
  }

  ancestor(distance: number): Environment|null {
    let env: Environment|null = this
    for (let i = 0; i < distance; i++) {
      if(env != null) env = env.enclosing
    }
    return env
  }

  getAt(distance: number, name: string): any {
    return this.ancestor(distance)?.values.get(name)
  }

  assignAt(distance: number, name: Token, value: any): void {
    this.ancestor(distance)?.values.set(name.lexeme, value)
  }

  get(name: Token): any {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)
    }

    if (this.enclosing !== null) return this.enclosing.get(name)

    throw new RuntimeError(name, 
      `Undefined variable "${name.lexeme}".`)
  }

  assign(name: Token, value: any): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)
      return
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return
    }

    throw new RuntimeError(name,
      `Undfined variable "${name.lexeme}".`)
  }
}
