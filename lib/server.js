'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')
const mime = require('mime-types')

var rootDir

module.exports = (port, dir, fn) => {
  if (!port) {
    port = 80
  }
  rootDir = dir
  return http.createServer((request, response) => {
    const uaData = ua(request.headers['user-agent'])
    const device = (uaData && uaData.device) || 'default'
    const pathname = url.parse(request.url).pathname
    const uri = (pathname && pathname.replace(/\.+/g, '.')) || ''

    response.writeHead(200, {
      'Content-Type': mime.contentType(path.basename(uri)),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
    })

    if (fn) {
      if(!fn(request, response, uaData)) {
        tryFile(device, uri, response)
      }
    } else {
      tryFile(device, uri, response)
    }

  }).listen(port)
}

function tryFile (device, uri, response, fallback) {
  const file = path.join(rootDir, fallback ? 'default' : device, uri)

  fs.stat(file, (error, stats) => {
    if (!error && stats.isFile()) {
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
