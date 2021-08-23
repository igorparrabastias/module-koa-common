class VerboseError extends Error {

  constructor (e) {
    super('Verbose Error')
    this.message = e
  }
}

module.exports = VerboseError
