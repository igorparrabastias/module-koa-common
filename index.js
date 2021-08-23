const LoggerInstancer = require('./lib/LoggerInstancer')
const loggerMiddleware = require('./lib/loggerMiddleware')
const errorHandlerMiddleware = require('./lib/errorHandlerMiddleware')
const unhandledRejectionHandler = require('./lib/unhandledRejectionHandler')
const notFoundHandlerMiddleware = require('./lib/notFoundHandlerMiddleware')
const authMiddleware = require('./lib/authMiddleware')
const registerContext = require('./lib/registerContext')
const registerContextSimple = require('./lib/registerContextSimple')
const ValidationError = require('./lib/ValidationError')
const { Assert, Assertion } = require('./lib/Assert')
const NotFoundError = require('./lib/NotFoundError')
const UnauthorizedError = require('./lib/UnauthorizedError')
const ForbiddenError = require('./lib/ForbiddenError')
const FullError = require('./lib/FullError')
const VerboseError = require('./lib/VerboseError')
const LoggerClass = require('./lib/LoggerClass')
const signalsHandlers = require('./lib/signalsHandlers')
const ignoreFaviconMiddleware = require('./lib/ignoreFaviconMiddleware')

module.exports = {
  LoggerInstancer,
  loggerMiddleware,
  errorHandlerMiddleware,
  unhandledRejectionHandler,
  notFoundHandlerMiddleware,
  authMiddleware,
  registerContext,
  registerContextSimple,
  ValidationError,
  Assert,
  Assertion,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  FullError,
  VerboseError,
  LoggerClass,
  signalsHandlers,
  ignoreFaviconMiddleware
}
