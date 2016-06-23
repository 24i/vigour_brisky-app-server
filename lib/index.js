'use strict'
const http = require('http')
const travis = process.env.TRAVIS
const slack = process.env.SLACK
const allowVersions = process.env.ALLOW_VERSION
const name = process.env.NAME
const files = process.env.FILES

// pass in a server as option
function BriskyServer (app) {
  // app can be a url as well
  const server = http.createServer((req, res) => {

  })
  return server
}

module.exports = BriskyServer
