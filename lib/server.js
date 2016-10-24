'use strict'
const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')
const mime = require('mime-types')
const cache = require('./cache')
const zlib = require('zlib')
const version = require('./version')
var rootDir
var pkg

// var manifests = {}
// const defaultManifest = ['CACHE MANIFEST', '#' + (new Date()).toISOString(), '/', '/index.html'].join('\n')
module.exports = (port, dir, fn) => {
  if (!port) { port = 80 }
  rootDir = dir
  pkg = fs.readFileSync(rootDir + '/package.json')
  if (pkg) { pkg = JSON.parse(pkg) }
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
    const device = (uaData && uaData.webview === 'cordova' && 'cordova') || (uaData && uaData.device) || 'main'
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

function zipHeader (req, res) {
  var acceptEncoding = req.headers['accept-encoding']
  if (!acceptEncoding) {
    acceptEncoding = ''
  }
  if (acceptEncoding.match(/\bgzip\b/)) {
    res.setHeader('Content-Encoding', 'gzip')
    return 'gzip'
  } else if (acceptEncoding.match(/\bdeflate\b/)) {
    res.setHeader('Content-Encoding', 'deflate')
    return 'deflate'
  } else {
    return 'raw'
  }
}

function zipStream (raw, req, res) {
  const type = zipHeader(req, res)
  if (type !== 'raw') {
    return raw.pipe(
      (type === 'deflate'
        ? zlib.createDeflate()
        : zlib.createGzip()
      )
    ).pipe(res)
  } else {
    raw.pipe(res)
  }
}

function handleFile (device, uri, req, res, fallback) {
  const file = path.join(rootDir, fallback ? 'main' : device, uri)
  const cachefile = cache[file]
  if (cachefile) {
    const type = zipHeader(req, res)
    res.setHeader('Content-Length', Buffer.byteLength(cachefile[type]))
    res.end(cachefile[type])
  } else {
    fs.stat(file, (error, stats) => {
      if (!error && stats.isFile()) {
        const cached = []
        const fileStream = fs.createReadStream(file)
        if (pkg && uri === 'index.html') {
          const transform = version(pkg)
          transform.on('data', chunk => cached.push(chunk))
          fileStream.pipe(transform)
          zipStream(transform, req, res)
        } else {
          fileStream.on('data', chunk => cached.push(chunk))
          zipStream(fileStream, req, res)
        }
        fileStream.on('end', () => {
          const raw = Buffer.concat(cached)
          const obj = { raw }
          var cnt = 0
          zlib.deflate(raw, (err, data) => {
            obj.deflate = err ? raw : data
            if (++cnt === 2) { cache[file] = obj }
          })
          zlib.gzip(raw, (err, data) => {
            obj.gzip = err ? raw : data
            if (++cnt === 2) { cache[file] = obj }
          })
        })
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
