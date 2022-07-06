import Interpreter from "./Interpreter"
import LoxCallable from "./LoxCallable"
import LoxFunction from "./LoxFunction"
import LoxInstance from "./LoxInstance"

export default class LoxClass implements LoxCallable {
  readonly name: string
  readonly superclass: LoxClass
  private readonly methods: Map<string, LoxFunction>

  constructor(name: string, superclass: LoxClass, methods: Map<string, LoxFunction>) {
    this.name = name
    this.superclass = superclass
    this.methods = methods
  }

  findMethod(name: string): LoxFunction|null {
    let method = this.methods.get(name)

    if (method) return method

    if (this.superclass) {
      return this.superclass.findMethod(name)
    }

    return null
  }

  call(interpreter: Interpreter, args: any[]) {
    let instance: LoxInstance = new LoxInstance(this)

    let initializer: LoxFunction|null = this.findMethod('init')
    if (initializer) {
      initializer.bind(instance).call(interpreter, args)
    }

    return instance
  }

  arity(): number {
    let initializer = this.findMethod('init')
    if (initializer == null) return 0
    return initializer.arity()
  }

  public toString(){
    return this.name
  }
}