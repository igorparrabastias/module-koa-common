class FullError extends Error {

  constructor (e) {
    super(`Full Error: ${e.message}`)
    this.e = e
  }
}

module.exports = FullError
