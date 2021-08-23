const asValue = require('awilix').asValue
const utils = require('./utils')
/**
 * Para entender como se esta usando el "scope per requests" ver:
 * - /home/nomikos/dev/_/ia/user-post-service/node_modules/awilix-koa/lib/invokers.js
 * - /home/nomikos/dev/_/protos/experiments/awilix/examples/koa/index.js
 * En simple: Al usar createController en las rutas, se esta dando por hecho
 * que existe ctx.state.container: `var container = ctx.state.container`
 *
 * NOTA: No loguea fuera del middleware
 */
/**
 * [loggerMiddleware description]
 * @param  {[type]}   ctx        [description]
 * @param  {Function} next       [description]
 * @param  {[type]}   [aux=null] Se setea en loggerMiddleware
 * @return {[type]}              [description]
 */
async function loggerMiddleware(ctx, next, aux = null) {
  let logger
  const tracers = aux ? aux.tracers : null
  const payload = aux ? aux.payload : null
  const logType = aux ? aux.logType : 'api'
  const containerScoped = aux ? aux.containerScoped : undefined

  if (ctx) {
    // console.warn('ctx.state.container', ctx.state.container.registrations)
    // console.warn('1')
    logger = ctx.state.container.resolve('logger')
  } else if (aux.logger) {
    // console.warn('1b')
    logger = aux.logger
  }

  if (!logger) {
    return next()
  }

  logger.init(logType)
  logger.startProfiling()

  if (ctx) {
    // console.warn('2')
    // Caso api
    // logger.setTracers(ctx)
    // Envio immediato a sistema logger
    logger.logRequest(ctx)
  } else {
    // console.warn('2b')
    // Caso amqp
    // Set tracers antes que begin para incluirlos
    if (tracers) {
      const tracers2 = logger.setTracers(null, tracers)
      if (containerScoped) {
        const userId = utils.positiveOrNull(tracers2.userId)
        containerScoped.register({ userId: asValue(userId) })
        containerScoped.register({ tracers: asValue(tracers2) })
      }
    }
    // Envio immediato a sistema logger
    logger.logBegin({ payload })
  }

  await next()

  if (ctx) {
    // Caso api
    // Muevo a despues de next para que agarre rewrites en
    // authorizationMiddleware
    logger.setTracers(ctx)
    // No corre en test
    // Envio immediato y final a sistema logger
    logger.logResponse(ctx)
  } else {
    // Caso amqp
    // Envio immediato y final a sistema logger
    logger.logEnd()
  }
}

module.exports = loggerMiddleware
