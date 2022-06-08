
export default class ReturnError extends Error {
  public value:any

  constructor(value:any) {
    super()
    this.value = value
  }
}