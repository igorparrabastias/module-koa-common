const ValidationError = require('./ValidationError')
const NotFoundError = require('./NotFoundError')
const UnauthorizedError = require('./UnauthorizedError')
const ForbiddenError = require('./ForbiddenError')
const FullError = require('./FullError')
const VerboseError = require('./VerboseError')

/**
 * Este middleware se usa en apis. Generalmente antes de
 * loggerMiddleware en el request-response cycle
 * para poder agarrar los rejects de los controllers
 * o workers
 * @param {*} ctx
 * @param {*} next
 */
module.exports = async function errorHandlerMiddleware(ctx, next) {
  try {
    await next()
  } catch (err) {
    const logger = ctx.state.container.resolve('logger')
    console.warn('LOCAL-MESSAGE-ERRORHANDLER', err.message)

    let status = 500
    let message = ctx.state.customerSupportId
    let body = ''

    if (err instanceof VerboseError) {
      status = 400
      message = 'Verbose Error'
      body = err.message

      ctx.status = status
      ctx.message = message
      ctx.body = body // o considera como non-error thrown

      logger.errorHandler({
        'response-al-cliente': {
          status: status,
          message: message,
          body: body
        }
      })
    }
    if (err instanceof UnauthorizedError) {
      status = 401
      message = 'Unauthorized'
      body = err.message

      ctx.status = status
      ctx.message = message
      ctx.body = body // o considera como non-error thrown

      logger.errorHandler({
        'response-al-cliente': {
          status: status,
          message: message,
          body: body
        }
      })
    }
    if (err instanceof ForbiddenError) {
      status = 403
      message = 'Forbidden'
      body = err.message

      ctx.status = status
      ctx.message = message

      logger.errorHandler({
        'response-al-cliente': {
          status: status,
          message: message,
          body: body
        }
      })
      /**
       * Se puede devolver un body pero no vacio o da error
       * de pagina no encontrada, no un json
       *
       * Para incluir un mensaje, hacer:
       * return this.emit(NOT_FOUND, ' Mi mensaje')
       */
    } else if (err instanceof NotFoundError) {
      status = 404
      message = err.message || 'Not Found'
      body = err.message || 'Not Found'

      ctx.status = status
      ctx.message = message
      // ctx.body = body // o considera como non-error thrown
      // ctx.body = body // pero devuel status 204
      ctx.body = body // EJ: El comentario ha sido borrado recientemente.

      logger.errorHandler({
        'response-al-cliente': {
          status: status,
          message: message,
          body: body
        }
      })
    } else if (err instanceof ValidationError) {
      status = 422
      message = 'Validation error'
      body = err.message

      ctx.status = status
      ctx.message = message
      ctx.body = body // o considera como non-error thrown

      logger.errorHandler({
        'response-al-cliente': {
          status: status,
          message: message,
          body: body
        }
      })
    } else if (err instanceof FullError) {
      status = 500
      message = err.message
      body = err.stack

      ctx.status = status
      ctx.message = message
      ctx.body = body // o considera como non-error thrown

      logger.errorHandler({
        'response-al-cliente': {
          status: status,
          message: message,
          body: body
        }
      })
    } else {
      logger.errorHandler({
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack
              }
            : err,
        'response-al-cliente': {
          status: status,
          message: message
        }
      })

      ctx.status = status
      ctx.message = message
    }
  }
}
