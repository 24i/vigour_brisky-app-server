'use strict'
const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')
const mime = require('mime-types')
const cache = require('./cache')
const zlib = require('zlib')

var rootDir
// var manifests = {}

// const defaultManifest = ['CACHE MANIFEST', '#' + (new Date()).toISOString(), '/', '/index.html'].join('\n')

module.exports = (port, dir, fn) => {
  if (!port) { port = 80 }
  rootDir = dir

  // fs.readdirSync(rootDir)
  //   .filter(item => fs.statSync(path.join(rootDir, item)))
  //   .forEach(device => {
  //     const cmFile = path.join(rootDir, device, 'app.appcache')
  //     fs.stat(cmFile, (error, stats) => {
  //       manifests[device] = (!error && stats.isFile()) ? fs.readFileSync(cmFile) : defaultManifest
  //     })
  //   })

  return http.createServer((req, res) => {
    const uaData = ua(req.headers['user-agent'])
    const device = (uaData && uaData.device) || 'default'
    const pathname = url.parse(req.url).pathname
    const uri = (pathname && pathname.replace(/\.+/g, '.')) || ''
    res.setHeader('Content-Type', mime.contentType(path.basename(uri)) || 'text/html; charset=UTF-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    if (!fn || !fn(req, res, uaData)) {
      handleFile(device, uri, req, res)
    }
  }).listen(port)
}

function gzip (req, res) {
  var acceptEncoding = req.headers['accept-encoding']
  if (!acceptEncoding) {
    acceptEncoding = ''
  }
  if (acceptEncoding.match(/\bdeflate\b/)) {
    res.setHeader('Content-Encoding', 'deflate')
    return zlib.createDeflate()
  } else if (acceptEncoding.match(/\bgzip\b/)) {
    res.setHeader('Content-Encoding', 'gzip')
    return zlib.createGzip()
  }
}

function handleFile (device, uri, req, res, fallback) {
  const file = path.join(rootDir, fallback ? 'default' : device, uri)
  if (cache[file]) {
    const zip = gzip(req, res)
    // res.setHeader('Content-Length', cache[file].size)
    if (zip) {
      zip.pipe(res)
      for (let i in cache[file].val) {
        zip.write(cache[file].val[i])
      }
      zip.end()
    } else {
      for (let i in cache[file].val) {
        res.write(cache[file].val[i])
      }
      res.end()
    }
  } else {
    fs.stat(file, (error, stats) => {
      if (stats) {
        // res.setHeader('Content-Length', stats.size)
      }
      if (!error && stats.isFile()) {
        const cached = { val: [], size: stats.size }
        const fileStream = fs.createReadStream(file)
        fileStream.on('data', (chunk) => {
          cached.val.push(chunk)
        })
        fileStream.on('end', () => {
          cache[file] = cached
        })
        // fileStream.pipe(res)
        const zip = gzip(req, res)
        if (zip) {
          fileStream.pipe(zip).pipe(res)
        } else {
          fileStream.pipe(res)
        }
      } else if (!fallback) {
        handleFile(device, uri, req, res, true)
      } else if (uri !== 'index.html') {
        handleFile(device, 'index.html', req, res)
      } else {
        res.end('no index!')
      }
    })
  }
}

// function addToManifest (device, uri) {
//   if (!manifests[device]) {
//     manifests[device] = defaultManifest
//   }

//   if (manifests[device].split('\n').indexOf(uri) === -1) {
//     manifests[device] += '\n' + uri
//   }
// }
