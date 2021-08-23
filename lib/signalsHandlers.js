const https = require('https')

async function warmit(loggerRoot = console, env) {
  if (!env.cloudRunUrl) {
    throw new Error('env.cloudRunUrl missing, Abort warming')
  }
  const pingUrl = `${env.cloudRunUrl}/ping`
  let tries = 5
  while (tries > 0) {
    await (() => {
      return new Promise((resolve, reject) => {
        loggerRoot.debug(`Trying warm: ${pingUrl} (${tries})`)
        https
          .get(pingUrl, (res) => {
            res.on('data', (d) => {
              tries = -1
              loggerRoot.debug(`Warming OK.`)
              resolve()
            })
          })
          .on('error', (err) => {
            loggerRoot.debug(`Warming error: ${err.message}`)
          })
        tries--
      })
    })()
  }
  if (tries === 0) {
    throw new Error('Warming total failure!')
  }
}

async function stopit(loggerRoot = console, server, coreDb) {
  server.close(function () {
    loggerRoot.debug('Server stopped.')
    if (coreDb) {
      coreDb.destroy(function (err) {
        loggerRoot.debug('DB destroyed.')
        if (err) {
          loggerRoot.debug('Error while starting up server', err)
        }
        process.exit(err ? 1 : 0)
      })
    } else {
      process.exit()
    }
  })
}

module.exports = { warmit, stopit }
