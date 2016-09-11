'use strict'
const server = require('../../lib/server')
const path = require('path')
const http = require('http')
const test = require('tape')
const fs = require('fs')

test('app server - get device index', t => {
  t.plan(8)
  const appServer = server(9090, path.resolve(__dirname))
  const host = 'localhost'

  http.get({
    host,
    port: 9090,
    path: '/slurp',
    headers: {
      'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1'
    }
  }, (res) => {
    t.equal(res.statusCode, 200, 'should return 200')
    var data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      t.equal(data, fs.readFileSync(path.join(__dirname, 'tv/index.html')).toString().replace(
        '<head>', `<head>\n<meta name="app-version" content="@vigour-io/adm-app@1.1.16"">`
      ), 'loads index.html for tv')
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`)
  })

  http.get({
    host,
    port: 9090
  }, (res) => {
    t.equal(res.statusCode, 200, 'should return 200')
    var data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      t.equal(data, fs.readFileSync(path.join(__dirname, 'default/index.html')).toString().replace(
        '<head>', `<head>\n<meta name="app-version" content="@vigour-io/adm-app@1.1.16"">`
      ), 'loads index.html for default')
      setTimeout(nasaimg, 1000)
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`)
  })

  http.get({
    host,
    port: 9090,
    path: '/bundle.css',
    headers: {
      'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1'
    }
  }, (res) => {
    var data = ''
    res.on('data', function (d) {
      data += d
    })
    res.on('end', function () {
      const expected = 'body { background-image: url("http://urbanislandz.com/wp-content/uploads/2016/08/Young-Thug-dress-bonnet.jpg"); }'
      t.equal(expected, data, 'should load tv .css')
      res.resume()
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`)
  })

  http.get({
    host,
    port: 9090,
    path: '/blabla',
    headers: {
      'User-Agent': 'Mozilla/5.0 cordova'
    }
  }, (res) => {
    var data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      t.equal(data, fs.readFileSync(path.join(__dirname, 'cordova/index.html')).toString().replace(
        '<head>', `<head>\n<meta name="app-version" content="@vigour-io/adm-app@1.1.16"">`
      ), 'loads index.html for cordova')
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`)
  })

  function nasaimg () {
    http.get({
      host,
      port: 9090,
      path: '/nasa.jpeg'
    }, (res) => {
      var data = ''
      res.on('data', (chunk) => {
        data += chunk.toString()
      })
      res.on('end', () => {
        t.ok(data.length > 1e4, 'loads nasa image')
        process.nextTick(cached)
      })
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`)
    })

    function cached () {
      http.get({
        host,
        port: 9090,
        path: '/nasa.jpeg'
      }, (res) => {
        var data = ''
        res.on('data', (chunk) => {
          data += chunk.toString()
        })
        res.on('end', () => {
          t.ok(data.length > 1e4, 'loads mem-cached nasa image')
        })
      }).on('error', (e) => {
        console.log(`Got error: ${e.message}`)
      })
    }
  }

  test.onFinish(() => {
    appServer.close()
  })
})
