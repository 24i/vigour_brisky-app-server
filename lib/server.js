'use strict'

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')
const mime = require('mime-types')

var rootDir
var manifests = {}

const defaultManifest = ['CACHE MANIFEST', '#' + (new Date()).toISOString(), '/', '/index.html'].join('\n')

module.exports = (port, dir, middleWare) => {
  if (!port) {
    port = 80
  }

  rootDir = dir

  fs.readdirSync(rootDir)
    .filter(item => fs.statSync(path.join(rootDir, item)))
    .forEach(device => {
      const cmFile = path.join(rootDir, device, 'app.appcache')
      fs.stat(cmFile, (error, stats) => {
        manifests[device] = (!error && stats.isFile()) ? fs.readFileSync(cmFile) : defaultManifest
      })
    })

  return http.createServer((request, response) => {
    const uaData = ua(request.headers['user-agent'])
    const device = (uaData && uaData.device) || 'default'
    const pathname = url.parse(request.url).pathname
    const uri = (pathname && pathname.replace(/\.+/g, '.')) || ''

    response.writeHead(200, {
      'Content-Type': mime.contentType(path.basename(uri)) || 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
    })

    if (!middleWare || !middleWare(request, response, uaData)) {
      tryFile(device, uri, response)
    }
  }).listen(port)
}

function tryFile (device, uri, response, fallback) {
  const file = path.join(rootDir, fallback ? 'default' : device, uri)

  if (uri.substr(uri.length - 12) === 'app.appcache') {
    return response.end(manifests[device] || defaultManifest)
  }

  fs.stat(file, (error, stats) => {
    if (!error && stats.isFile()) {
      return fs.createReadStream(file).pipe(response)
    }

    if (!fallback) {
      return tryFile(device, uri, response, true)
    }

    if (uri !== 'index.html') {
      addToManifest(device, uri)
      return tryFile(device, 'index.html', response)
    }

    console.log('no index!')
    response.end('no index!')
  })
}

function addToManifest (device, uri) {
  if (!manifests[device]) {
    manifests[device] = defaultManifest
  }

  if (manifests[device].split('\n').indexOf(uri) === -1) {
    manifests[device] += '\n' + uri
  }
}
