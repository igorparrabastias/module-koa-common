const moment = require('moment')
const fs = require('fs')
const json = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const utils = require('./utils')
const env = process.env.NODE_ENV
const appName = utils.appName(json.name)

/**
 * No logueamos line:number por performance
 * ref: https://stackoverflow.com/questions/11386492/accessing-line-number
 * -in-v8-javascript-chrome-node-js
 */
const pino = require('pino')({
  level: process.env.LOG_LEVEL || 'trace',
  base: { appName, env },
  timestamp: () => {
    const x = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
    return ', "time":"' + x + '"'
  }
})

// Overwrite console.log para enviar a logger, pero no para guardar en DB,
// si no que para loguear en un solo lugar centralizado, usando pino.trace()
// Usar console.warn para depurar localmente y no ser enviado a logger
// console.log = function () {
//   pino.trace({ 'console.log': Array.from(arguments).map((v) => v) })
// }

module.exports = {
  pino
}
