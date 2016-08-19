'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')

var rootDir

module.exports = (port, dir) => {
  if (!port) {
    port = 80
  }

  rootDir = dir

  return http.createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
    })

    const uaData = ua(request.headers['user-agent'])
    const device = (uaData && uaData.device) || 'default'
    const pathname = url.parse(request.url).pathname
    const uri = (pathname && pathname.replace(/\.+/g, '.')) || ''

    console.log(path.join(device, uri))

    tryFile(device, uri, response)
  }).listen(port)
}

function tryFile (device, uri, response, fallback) {
  const file = path.join(rootDir, fallback ? 'default' : device, uri)

  fs.stat(file, (error, stats) => {
    if (!error && stats.isFile()) {
      console.log(file)
      return fs.createReadStream(file).pipe(response)
    }

    if (!fallback) {
      return tryFile(device, uri, response, true)
    }

    if (uri !== 'index.html') {
      return tryFile(device, 'index.html', response)
    }

    console.log(`${file} - not found`)
    response.end('no index!')
  })
}
