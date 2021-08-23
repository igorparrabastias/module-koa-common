module.exports = function authMiddleware(ctx, next) {
  const userId = +ctx.request.header['x-tracer-user-id'] || 0

  if (userId > 0) return next()

  const logger = ctx.state.container.resolve('logger')

  const status = 401
  const message = 'Unauthorized'
  const body = 'Unauthorized'

  ctx.status = status
  ctx.message = message
  ctx.body = body

  logger.errorHandler({
    'response-al-cliente': {
      status: status,
      message: message,
      body: body
    }
  })
}
