'use strict'
var http = require('http')

module.exports = function proxy (options, cb, proxyRes) {
  if (options.proxy) {
    const proxyOptions = options.proxy
    delete options.proxy
    return http.request({
      hostname: proxyOptions.hostname,
      port: proxyOptions.port,
      method: proxyOptions.method || 'GET',
      headers: {
        proxy: JSON.stringify(options)
      }
    }, cb)
  } else {
    return http.request(options, (res) => {
      proxyRes.setHeader('Access-Control-Allow-Origin', '*')
      res.pipe(proxyRes)
    })
  }
}
