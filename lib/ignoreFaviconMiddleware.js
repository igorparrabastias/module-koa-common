module.exports = function ignoreFaviconMiddleware(ctx, next) {
  // Ignore favicon
  if (ctx.path === '/favicon.ico') return
  return next()
}
