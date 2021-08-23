/**
 * Evitará crash fatal
 *
 * (node:20650) UnhandledPromiseRejectionWarning: Unhandled promise rejection.
 * This error originated either by throwing inside of an async function without
 * a catch block, or by rejecting a promise which was not handled with .catch().
 * (node:20650) [DEP0018] DeprecationWarning: Unhandled promise rejections are
 * deprecated. In the future, promise rejections that are not handled will
 * terminate the Node.js process with a non-zero exit code.
 */

module.exports = function unhandledRejectionHandler (container = null) {

  if (container) {
    const loggerRoot = container.resolve('loggerRoot')
    process.on('unhandledRejection', function (err) {
      loggerRoot.fatal('UNHANDLED PROMISE REJECTION', {
        message: err.message,
        stack: err.stack
      })
    })
    return
  }

  console.warn('Manejador unhandledRejectionHandler ejecutado')
  process.on('unhandledRejection', function (err) {
    console.warn('UNHANDLED PROMISE REJECTION', {
      message: err.message,
      stack: err.stack
    })
  })
}
