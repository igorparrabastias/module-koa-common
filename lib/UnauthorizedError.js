class UnauthorizedError extends Error {

  constructor (message) {
    super('Unauthorized')
    this.message = message
  }
}

module.exports = UnauthorizedError
