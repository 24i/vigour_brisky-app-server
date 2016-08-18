'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const ua = require('vigour-ua')

module.exports = port => {
  if (!port) {
    port = 80
  }

  return http.createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
    })

    const device = ua(request.headers['user-agent']).device
    const pathname = path.parse(url.parse(request.url).pathname)

    console.log(device)
    console.log(pathname)

    response.end()
  }).listen(port)
}
