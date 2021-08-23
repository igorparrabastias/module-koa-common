class ForbiddenError extends Error {

  constructor (message) {
    super('Forbidden')
    this.message = message
  }
}

module.exports = ForbiddenError
