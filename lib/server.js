'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')

module.exports = (port, dir) => {
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
    const uri = url.parse(request.url).pathname



    const file = path.join(dir, device, uri)

    console.log(`${request.url} - ${device}`)
    console.log(`${uri} - ${file}`)

    response.end()
  }).listen(port)
}
