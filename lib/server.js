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

  const defaultIndexPath = path.join(dir, 'default', 'index.html')
  var defaultIndex = 'no index!'

  statP(defaultIndexPath)
    .then(stats => {
      if (stats && stats.isFile()) {
        defaultIndex = fs.readFileSync(defaultIndexPath)
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

    const file = path.join(dir, device, uri)
    const index = path.join(dir, device, uri, 'index.html')
    const defaultFile = path.join(dir, 'default', uri)

    console.log(`${request.url} - ${device}`)

    statP(file)
      .then(stats => {
        if (stats) {
          if (stats.isFile()) {
            console.log(`${uri} - ${file}`)
            return fs.createReadStream(file).pipe(response)
          }

          if (stats.isDirectory()) {
            return statP(index)
              .then(stats => {
                if (stats && stats.isFile()) {
                  console.log(`${uri} - ${index}`)
                  return fs.createReadStream(index).pipe(response)
                }

                console.log(`${uri} - not found`)
                response.end(defaultIndex)
              })
          }
        }

        statP(defaultFile)
          .then(stats => {
            if (stats && stats.isFile()) {
              console.log(`${uri} - ${defaultFile}`)
              return fs.createReadStream(defaultFile).pipe(response)
            }

            console.log(`${uri} - not found`)
            response.end(defaultIndex)
          })
      })
  }).listen(port)
}

function statP (path) {
  return new Promise(resolve => {
    fs.stat(path, (error, stats) => {
      if (error) {
        return resolve(false)
      }

      resolve(stats)
    })
  })
}
