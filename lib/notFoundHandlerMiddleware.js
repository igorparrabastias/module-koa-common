module.exports = function notFoundHandlerMiddleware (ctx) {
  const msg = `${ctx.request.method} ${ctx.request.path}`
  ctx.status = 404
  ctx.body = `No endpoint matched your request: ${msg}`
}
