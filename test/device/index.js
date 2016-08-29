'use strict'
const server = require('../../lib/server')
const path = require('path')
const http = require('http')
const test = require('tape')
const fs = require('fs')

test('app server - get device index', t => {
  t.plan(5)
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
    t.equal(res.statusCode, 200, 'should always return 200')
    var data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      t.equal(data, fs.readFileSync(path.join(__dirname, 'tv/index.html')).toString(), 'loads index.html for tv')
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`)
  })

  http.get({
    host,
    port: 9090
  }, (res) => {
    t.equal(res.statusCode, 200, 'should always return 200')
    var data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      t.equal(data, fs.readFileSync(path.join(__dirname, 'default/index.html')).toString(), 'loads index.html for default')
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

  test.onFinish(() => {
    appServer.close()
  })
})
