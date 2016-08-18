'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')

var rootDir
var defaultIndex = 'no index!'

module.exports = (port, dir) => {
  if (!port) {
    port = 80
  }

  rootDir = dir
  const defaultIndexPath = path.join(dir, 'default', 'index.html')

  fs.stat(defaultIndexPath, (error, stats) => {
    if (!error && stats.isFile()) {
      defaultIndex = fs.readFileSync(defaultIndexPath)
    } else {
      console.warn('No default index found!')
    }
  })

  return http.createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
    })

    const device = ua(request.headers['user-agent']).device
    const uri = url.parse(request.url).pathname.replace(/\.+/g, '.')

    console.log(path.join(device, uri))

    tryFile(device, uri, response)
  }).listen(port)
}

function tryFile (device, uri, response) {
  const file = path.join(rootDir, device, uri)

  fs.stat(file, (error, stats) => {
    if (!error) {
      if (stats.isFile()) {
        console.log(file)

        return fs.createReadStream(file).pipe(response)
      }

      if (stats.isDirectory()) {
        return tryFile(device, path.join(uri, 'index.html'), response)
      }
    }

    if (device !== 'default') {
      return tryFile('default', uri, response)
    }

    console.log(`${file} - not found`)
    response.end(defaultIndex)
  })
}
