class ValidationError extends Error {

  constructor (e) {
    super(`Validation Error: ${e.message}`)
    this.message = e
  }
}

module.exports = ValidationError
