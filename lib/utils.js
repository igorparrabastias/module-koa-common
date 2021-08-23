module.exports = {
  positiveOrNull(value) {
    let value2 = null
    if (value) {
      const testNumber = +value
      if (typeof testNumber === 'number' && testNumber > 0) {
        value2 = testNumber
      }
    }
    return value2
  },
  appName(appName) {
    if (!appName) return ''
    let appName2 = appName.split('/')
    if (appName2.length === 2) {
      // Se supone que nombre es de la forma
      // @autor-namespace/nombre-app
      appName2 = appName2[1]
    } else {
      appName2 = appName
    }
    return appName2
  },
  getAdminStatus(user) {
    if (user && user.roles && Array.isArray(user.roles) && user.roles.length) {
      const roleAdmin = user.roles.find((item) => {
        return item.name === 'admin'
      })
      if (roleAdmin && roleAdmin.allow) return true
    }
    return false
  }
}
