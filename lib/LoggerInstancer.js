const moment = require('moment')
const { pino } = require('./config')
const utils = require('./utils')
const asValue = require('awilix').asValue
const fs = require('fs')
const json = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const uuidv4 = require('uuid/v4')
const clone = require('rfdc')() // Returns the deep copy function

const elapsedTime = require('elapsed-time')

// Para loguear al final de todo el output
// Simula console.log
let memoryLogDev = []

// Almaceno todos los logs por cada request
function Memory() {
  // Guardo request para agregar en el segunfo y final envio a logger.
  // Este envio final puede ser response si todo va bien, o un log
  // de error o fatal.
  let requestBuffer = null
  let requestPayload = null
  let logId = null
  let store = null

  return {
    push(vars) {
      // No interesa loguear level
      // store.push({ level: level, data: Object.values(vars) })
      if (!Array.isArray(store)) {
        store = []
      }
      const x = Object.values(vars)
      x.forEach((v) => {
        store.push(v)
      })
    },
    init: function () {
      logId = uuidv4()
      store = null
    },
    flush: function () {
      return store
    },
    setRequest: function (buffer) {
      requestBuffer = buffer
    },
    flushRequest: function () {
      return requestBuffer
    },
    setPayload: function (buffer) {
      requestPayload = buffer
    },
    flushPayload: function () {
      return requestPayload
    },
    flushLogId: function () {
      return logId
    }
  }
}

class LoggerInstancer {
  constructor() {
    // Espacio de memoria scoped
    this.memory = new Memory()

    this.logType = 'api'
    this.tracers = {}
    this.et = null
  }

  // Alimenta buffer temporal para ser usado en un
  // unico envio a sistema logger
  // Se puede usar immediatamente despues de logger.init
  // FIX: objetos pasados tiene valor final, no el de la linea
  info() {
    this.memory.push(clone(arguments), 10)
  }

  error() {
    this.memory.push(clone(arguments), 10)
  }

  log() {
    let x = clone(arguments)
    x = Object.values(x) || 'nada'
    memoryLogDev.push(x)
  }

  setTracers(ctx = null, tracersFromQueue = null) {
    let sessionId
    let requestId
    let userId
    let systems = ''
    let gatewayId = ''

    if (ctx) {
      sessionId = ctx.request.header['x-tracer-session-id'] || uuidv4()
      requestId = utils.positiveOrNull(
        ctx.request.header['x-tracer-request-id']
      )
      userId = utils.positiveOrNull(ctx.request.header['x-tracer-user-id'])
      systems = ctx.request.header['x-tracer-systems'] || ''
      gatewayId = ctx.request.header['x-tracer-gateway-id'] || ''
    } else {
      sessionId = tracersFromQueue['x-tracer-session-id'] || uuidv4()
      requestId = utils.positiveOrNull(tracersFromQueue['x-tracer-request-id'])
      userId = utils.positiveOrNull(tracersFromQueue['x-tracer-user-id'])
      systems = tracersFromQueue['x-tracer-systems'] || ''
    }

    // if (tracersFromQueue === null) {
    this.tracers = { sessionId, requestId, userId, systems, gatewayId }
    // } else {
    //   this.tracers = tracersFromQueue

    //   console.log({
    //     'LOGGING tracersFromQueue----//*/*/*/*': tracersFromQueue
    //   })
    // }

    // Incluir actual sistema
    const appName = utils.appName(json.name)
    if (this.tracers.systems) {
      systems = `${this.tracers.systems}|${appName}`
    } else {
      systems = appName
    }

    this.tracers.systems = systems

    // Hacer disponible para el container scoped
    if (ctx) {
      ctx.state.container.register({
        tracers: asValue(this.tracers)
      })

      this.setCustomerSupportId(ctx)
    }

    return this.tracers
  }

  // Identificador de error para customer support, usar en errorHandler
  // Tambien lo usamos para correlacionar ambos stages: started y finished
  setCustomerSupportId(ctx) {
    // Se usa en errorHandler para devolverlo a pwa
    ctx.state.customerSupportId = this.memory.flushLogId()
  }

  // Profiling, solo toma en cuenta los middlewares posteriores a este
  startProfiling() {
    this.et = elapsedTime.new().start()
  }

  endProfiling() {
    if (this.et) {
      return this.et.getValue({
        formatter: (value) => {
          // Milisegundos
          return +(value / 1e6).toFixed(3)
        }
      })
    }
    return null
  }

  buildMessage(logs, input) {
    let message = ''
    if (input) {
      let body = input.body
      if (body && Array.isArray(Object.keys(body)) && body.length) {
        body = body.join(',')
        body = `, BODY: ${body}`
      } else {
        body = ''
      }
      message = `${input.method} ${input.href}${body}`
    }
    message = message + ' | ' + logs.join(', ') || ''
    message = message.substr(0, 256)
    return message
  }

  logRequest(ctx) {
    this.memory.setRequest({
      href: ctx.href,
      method: ctx.method,
      query: ctx.query,
      body: ctx.request.body
    })
    // Es muy costoso y nunca ha servido
    // pino.info({
    //   logId: this.memory.flushLogId(),
    //   stage: 'started',
    //   logType: this.logType,
    //   log: {
    //     input: this.memory.flushRequest(),
    //     tracers: this.tracers
    //   }
    // })
  }

  // Log response y logs internos de todo el request
  logResponse(ctx) {
    let bodyInfo = null
    if (
      typeof ctx.body === 'object' &&
      ctx.body !== null &&
      ctx.body.constructor === Array
    ) {
      bodyInfo = {
        isArray: true,
        content: {
          // Solo loguear primer valor. Solo es para tener una muestra.
          firstElement: ctx.body[0],
          length: ctx.body.length
        }
      }
    } else if (ctx.body) {
      bodyInfo = {
        isArray: false,
        content: ctx.body
      }
    } else {
      bodyInfo = null
    }

    const input = this.memory.flushRequest()
    const logs = this.memory.flush() || []
    const message = this.buildMessage(logs, input)

    let cabezalId = null
    if ((ctx.method || '').toUpperCase() === 'POST') {
      if (
        ctx.request.body &&
        typeof ctx.request.body.cabezalId !== 'undefined'
      ) {
        cabezalId = +ctx.request.body.cabezalId
      }
    } else {
      if (typeof ctx.query.cabezalId !== 'undefined') {
        cabezalId = +ctx.query.cabezalId
      }
    }

    const obj = {
      stage: 'finished',
      message: message,
      logId: this.memory.flushLogId(),
      logType: this.logType,
      elapsedTime: this.endProfiling(),
      cabezalId: cabezalId,
      log: {
        logs: logs,
        input: input,
        output: {
          status: ctx.status
        },
        tracers: this.tracers
      }
    }

    if (bodyInfo) {
      obj.log.output.bodyInfo = bodyInfo
    }

    pino.info(obj)

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  // Para ser usado en vez de logRequest cuando no se corre
  // loggerMiddleware el cual es mas usado en apis y en cuyo caso
  // queremos enviar de immediato datos a sistema logger
  // No es obligatorio usarlo. Pero no se logueará el stage started
  logBegin(payload) {
    if (payload) {
      this.memory.setPayload(payload)
    }
    // Es muy costoso y nunca ha servido
    // pino.info({
    //   stage: 'started',
    //   logId: this.memory.flushLogId(),
    //   logType: this.logType,
    //   log: {
    //     input: this.memory.flushPayload(),
    //     tracers: this.tracers
    //   }
    // })
  }

  logEnd() {
    const input = this.memory.flushRequest()
    const logs = this.memory.flush() || []
    const message = this.buildMessage(logs, input)

    pino.info({
      message: message,
      stage: 'finished',
      logId: this.memory.flushLogId(),
      logType: this.logType,
      elapsedTime: this.endProfiling(),
      log: {
        logs: logs,
        input: input,
        tracers: this.tracers
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  errorHandler() {
    // Ingresa ultimo arguments si existe
    this.memory.push(clone(arguments), 60)
    const logs = this.memory.flush() || []
    const logId = this.memory.flushLogId()
    const t = moment().format('YYYY-MM-DDTHH:mm:ss.SSS')

    const input = this.memory.flushRequest()
    const message = this.buildMessage(logs, input)

    // A console (pm2 logs)
    console.warn(`ERROR_HANDLER: ${t}`, logs)
    pino.error({
      message: message,
      stage: 'error',
      logId: logId,
      logType: this.logType,
      elapsedTime: this.endProfiling(),
      log: {
        input: input,
        logs: logs,
        tracers: this.tracers
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  rejectionHandler() {
    // Ingresa ultimo arguments si existe
    this.memory.push(clone(arguments), 60)
    const logs = this.memory.flush() || []
    const logId = this.memory.flushLogId()
    const t = moment().format('YYYY-MM-DDTHH:mm:ss.SSS')

    const input = this.memory.flushRequest()
    const message = this.buildMessage(logs, input)

    // A console (pm2 logs)
    console.warn(`REJECTION_HANDLER: ${t}`, logs)
    pino.fatal({
      message: message,
      stage: 'fatal',
      logId: logId,
      logType: this.logType,
      elapsedTime: this.endProfiling(),
      log: {
        input: input,
        logs: logs,
        tracers: this.tracers
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  /**
   * Para usar con loggerRoot, el cual es singleton, ed, no existe
   * un scope. Luego no tien sentido acceder this.memory.flush (logs)
   * Se envia de immediato
   */
  warn() {
    const store = []
    const x = Object.values(clone(arguments))
    x.forEach((v) => {
      store.push(v)
    })
    const logId = uuidv4()

    const input = this.memory.flushRequest()
    const logs = store || []
    const message = this.buildMessage(logs, input)

    // A console (pm2 logs)
    const t = moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
    console.warn(`WARN: ${t}`, logs)
    pino.warn({
      message: message,
      logId: logId,
      logType: 'root',
      log: {
        logs: logs
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  /**
   * Para usar con loggerRoot, el cual es singleton, ed, no existe
   * un scope. Luego no tien sentido acceder this.memory.flush (logs)
   * Se envia de immediato
   */
  debug() {
    const store = []
    const x = Object.values(clone(arguments))
    x.forEach((v) => {
      store.push(v)
    })
    const logId = uuidv4()

    const input = this.memory.flushRequest()
    const logs = store || []
    const message = this.buildMessage(logs, input)

    // A console (pm2 logs)
    const t = moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
    console.warn(`DEBUG: ${t}`, logs)
    pino.debug({
      message: message,
      logId: logId,
      logType: 'root',
      log: {
        logs: logs
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  /**
   * Para usar con loggerRoot, el cual es singleton, ed, no existe
   * un scope. Luego no tien sentido acceder this.memory.flush (logs)
   * Se envia de immediato
   *
   * ULTIMA LINEA DE DEFENSA
   * En vars pasar toda la info posible para determinar fallo
   * Se crea un logId unico para busqueda
   * y se deja registro en logs locales
   */
  fatal() {
    const store = []
    const x = Object.values(clone(arguments))
    x.forEach((v) => {
      store.push(v)
    })
    const logId = uuidv4()
    const t = moment().format('YYYY-MM-DDTHH:mm:ss.SSS')

    const input = this.memory.flushRequest()
    const logs = store || []
    const message = this.buildMessage(logs, input)

    // A console (pm2 logs)
    console.warn(`FATAL: ${t}`, logs)
    pino.fatal({
      message: message,
      logId: logId,
      logType: 'root',
      log: {
        logs: logs
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  /**
   * Para usar con loggerRoot, el cual es singleton, ed, no existe
   * un scope. Luego no tien sentido acceder this.memory.flush (logs)
   * Se envia de immediato
   */
  e(e, logger) {
    let logs = []
    let input = []
    if (logger) {
      input = logger.memory.flushRequest()
      logs = logger.memory.flush() || []
    }
    const message = this.buildMessage(logs, input)
    const t = moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
    // A console (pm2 logs)
    console.warn(`ERROR PARCIAL ${t}`, logs)
    pino.error({
      message: `ERROR PARCIAL ${t}: ${message}`,
      logType: 'root-error-parcial',
      log: {
        error: {
          message: e.message,
          stack: e.stack
        },
        logs: logs
      }
    })

    if (memoryLogDev.length) {
      console.warn(
        memoryLogDev.map((item) => {
          return item['0']
        })
      )
      memoryLogDev = []
    }
  }

  init(logType = 'api') {
    this.logType = logType
    this.memory.init()
  }
}

module.exports = LoggerInstancer
