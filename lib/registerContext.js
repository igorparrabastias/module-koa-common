const asValue = require('awilix').asValue
const utils = require('./utils')

/**
 * Register Context helps to add request-specific data to the scope.
 * Imagine some auth middleware somewhere...
 */
module.exports = function registerContext(ctx, next) {
  const userId = utils.positiveOrNull(ctx.request.header['x-tracer-user-id'])
  let user = null

  try {
    user = ctx.request.header['x-auth-user']
    if (user) {
      user = JSON.parse(user)
    }
  } catch (error) {}

  // Parse user.roles si existe
  const isAdmin = utils.getAdminStatus(user)

  ctx.state.isAdmin = isAdmin
  ctx.state.userId = userId
  ctx.state.container.register({
    userId: asValue(userId),
    isAdmin: asValue(isAdmin),
    user: asValue(user || null),
    // Se sobreescribira en loggerMiddleware, pero debo inicializarlo
    tracers: asValue({})
  })
  return next()
}
