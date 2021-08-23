class NotFoundError extends Error {
  constructor(message) {
    super('Not Found')
    this.message = message
  }
}

module.exports = NotFoundError
