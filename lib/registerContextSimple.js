const asValue = require('awilix').asValue

/**
 * Register Context helps to add request-specific data to the scope.
 * Imagine some auth middleware somewhere...
 *
 * Solo para inicializar vars... mas adelante se actualiza
 */
module.exports = function registerContextSimple(ctx, next) {
  const userId = null
  ctx.state.userId = userId
  ctx.state.container.register({
    // Se sobreescribira en authorizationMiddleware (si es que el
    // token tiene un `user:${env.NODE_ENV}:id`),
    userId: asValue(userId),
    // Se sobreescribira en loggerMiddleware, pero debo inicializarlo
    tracers: asValue({})
  })
  return next()
}
