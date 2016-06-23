'use strict'
const http = require('http')

// pass in a server as option
function BriskyServer (app) {
  const server = http.createServer((req, res) => {

  })
  return server
}

BriskyServer.create = function (options) {
  // load it with options but re-use briskyServer
  const app = options.app
  return BriskyServer(app)
}

module.exports = BriskyServer
