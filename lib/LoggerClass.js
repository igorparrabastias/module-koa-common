const clone = require('rfdc')() // Returns the deep copy function

function Memory() {
  let store = {}
  store.info = []
  store.error = []

  return {
    push(vars, level) {
      if (!Array.isArray(store[level])) {
        store[level] = []
      }
      const x = Object.values(vars)
      x.forEach((v) => {
        store[level].push(v)
      })
    },
    flush: function () {
      return store
    },
    clean: function () {
      store = {}
      store.info = []
      store.error = []
    }
  }
}

/**
 * Pemite loguear como si fuera una instancia de
 * LoggerInstancer, pero almacena en un buffer propio.
 * Es decir tiene los mismos metodos: info, debug, etc
 *
 * Al llamar attach, usa loggerMethod para adjuntar
 * los logs almacenados al logger principal (scoped
 * o singleton)
 *
 * Su principal uso es en singletons como:
 * HardwareListener
 * MqttService
 */
class LoggerClass {
  constructor(loggerMethod) {
    this.memory = new Memory()
    this.loggerMethod = loggerMethod
  }

  info() {
    this.memory.push(clone(arguments), 'info')
  }

  log() {
    this.memory.push(clone(arguments), 'info')
  }

  error() {
    this.memory.push(clone(arguments), 'error')
  }

  debug() {
    this.memory.push(clone(arguments), 'info')
  }

  fatal() {
    this.memory.push(clone(arguments), 'error')
  }

  // const logger = new LoggerClass((x) => {
  //   // this.loggerRoot.debug(x)
  //   loggerTrail.info(x)
  // })
  attach() {
    const x = this.memory.flush()
    if (x.info.length) {
      this.loggerMethod.info(x.info)
    }
    if (x.error.length) {
      this.loggerMethod.error(x.error)
    }
    this.memory.clean()
  }
}

module.exports = LoggerClass
