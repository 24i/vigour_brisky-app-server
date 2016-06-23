'use strict'
var http = require('http')
const proxy = require('./')

module.exports = function createProxy (port) {
  console.log('minimal-http-proxy', port)
  return http.createServer((req, res) => {
    var payload = ''
    req.on('data', (data) => { payload += data })
    req.on('end', () => {
      const options = req.headers.proxy ? JSON.parse(req.headers.proxy) : {}
      const realReq = proxy(options, () => {}, res)
      if (payload) { realReq.write(payload) }
      realReq.on('error', (err) => {
        res.statusCode = 500
        res.statusMessage = JSON.stringify({ error: err.message, options: options })
        res.end()
      })
      realReq.end()
    })
  }).listen(port)
}
