'use strict'
const test = require('tape')
const proxy = require('../')
const createProxyServer = require('../server')
const http = require('http')

function createOrigin () {
  return http.createServer((req, res) => {
    var cnt = 0
    var payload = ''
    req.on('data', (chunk) => { payload += chunk })
    req.on('end', send)
    function send () {
      if (cnt === 10) {
        res.end()
      } else {
        cnt++
        res.write(cnt + payload)
        setTimeout(send, 10)
      }
    }
  }).listen(9090)
}

test('proxy request GET', (t) => {
  t.plan(2)
  const server = createOrigin()
  const proxyServer = createProxyServer(8888)
  const req = proxy({
    hostname: 'localhost',
    port: 9090,
    method: 'GET',
    proxy: {
      hostname: 'localhost',
      port: 8888,
      method: 'GET'
    }
  }, (res) => {
    var data = ''
    var cnt = 0
    res.on('data', (chunk) => {
      data += chunk
      cnt++
    })
    res.on('end', () => {
      t.equal(cnt, 10, 'received in 10 chunks')
      t.equal(data, '12345678910', 'correct final response')
      server.close()
      proxyServer.close()
    })
  })
  req.end()
})

test('proxy request POST', (t) => {
  t.plan(2)
  const server = createOrigin()
  const proxyServer = createProxyServer(8888)
  const req = proxy({
    hostname: 'localhost',
    port: 9090,
    method: 'POST',
    proxy: {
      hostname: 'localhost',
      port: 8888,
      method: 'POST'
    }
  }, (res) => {
    var data = ''
    var cnt = 0
    res.on('data', (c) => {
      data += c
      cnt++
    })
    res.on('end', () => {
      t.equal(cnt, 10, 'received in 10 chunks')
      t.equal(data, '1!2!3!4!5!6!7!8!9!10!', 'correct final response, recieves payload')
      server.close()
      proxyServer.close()
    })
  })
  req.write('!')
  req.end()
})

test('proxy request error forwarding', (t) => {
  t.plan(3)
  const server = createOrigin()
  const proxyServer = createProxyServer(8888)
  const errorReq = proxy({
    hostname: 'weirdurl.weirdness',
    port: 9090,
    method: 'POST',
    proxy: {
      hostname: 'localhost',
      port: 8888,
      method: 'POST'
    }
  }, (res) => {
    var data = ''
    res.on('data', (c) => {
      data += c
    })
    res.on('end', () => {
      t.equal(res.statusCode, 500, '500 statuscode')
      t.same(
        JSON.parse(res.statusMessage),
        {
          error: 'getaddrinfo ENOTFOUND weirdurl.weirdness weirdurl.weirdness:9090',
          options: {
            hostname: 'weirdurl.weirdness',
            port: 9090,
            method: 'POST'
          }
        },
        'correct errorMessage'
      )
      t.equal(data, '', 'empty response on error')
      server.close()
      proxyServer.close()
    })
  })
  errorReq.end()
})
