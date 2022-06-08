import Interpreter from "./Interpreter";

export default interface LoxCallable {
  arity():number
  call(interpreter: Interpreter, args: Array<any>):any
  toString():string
}