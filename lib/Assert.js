const { isEmpty } = require('lodash')

function Assert(data, message) {
  if (!data) {
    throw new Error(message || '')
  }
  return data
}

const Assertion = {
  isPositive: function (value, message, nameVar) {
    Assert(typeof value === 'number' && value > 0, message)
    return value
  },
  isString: function (value, message) {
    Assert(typeof value === 'string' && value.length > 0, message)
    return value
  },
  isArray: function (value, message) {
    Assert(Array.isArray(value) && value.length > 0, message)
    return value
  },
  isObject: function (value, message) {
    Assert(!isEmpty(value), message)
    return value
  },
  isPositiveOrNull: function (value) {
    let value2 = null
    if (value) {
      const testNumber = +value
      if (typeof testNumber === 'number' && testNumber > 0) {
        value2 = testNumber
      }
    }
    return value2
  },
  isNumber: function (value, message, nameVar) {
    Assert(typeof value === 'number', message)
    return value
  },
  isBoolean: function (value, message, nameVar) {
    Assert(typeof value === 'boolean', message)
    return value
  },
  isStringOrEmpty: function (value, message) {
    Assert(typeof value === 'string', message)
    return value
  },
  isStringOrNull: function (value, message) {
    let value2 = null
    if (value) {
      const testNumber = value
      if (typeof testNumber === 'string' && testNumber.length > 0) {
        value2 = testNumber
      }
    }
    return value2
  }
}

module.exports = { Assert, Assertion }
