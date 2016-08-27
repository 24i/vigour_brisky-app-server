'use strict'
const server = require('../../lib/server')
const path = require('path')
const http = require('http')
const test = require('tape')

test('app server - get phone index', t => {
  t.plan(2)
  var appServer = server(9090, path.resolve(__dirname))

  require('dns').lookup(require('os').hostname(), (err, add, fam) => {
    var options = {
      host: add,
      port: 9090,
      path: '/slurp',
      headers: {
        'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1'
      }
    }
    http.get(options, (res) => {
      t.equal(res.statusCode, 200, 'should always return 200')
      res.resume()
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`)
    })

    options = {
      host: add,
      port: 9090,
      path: '/bundle.css',
      headers: {
        'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1'
      }
    }
    http.get(options, (res) => {
      let body = ''
      res.on('data', function (d) {
        body += d
      })
      res.on('end', function () {
        const expected = 'body { background-image: url("http://urbanislandz.com/wp-content/uploads/2016/08/Young-Thug-dress-bonnet.jpg"); }'
        t.equal(expected, body, 'should load tv .css')
        res.resume()
      })
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`)
    })
    if (err) {}
  })
  test.onFinish(() => {
    appServer.close()
  })
})
