'use strict'

const test = require('tape')
const sinon = require('sinon')

const http = require('http')
const path = require('path')
const fs = require('fs')

const server = require('../lib/server')

var getUrl
sinon.stub(http, 'createServer', fn => {
  getUrl = fn
  return {listen: () => {}}
})

const stat = sinon.stub(fs, 'stat')
const createReadStream = sinon.stub(fs, 'createReadStream')

test('app server - no default index', t => {
  stat.withArgs(path.join('dir', 'phone'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'index.html'))
    .callsArgWith(1, true)

  server(null, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: ''
  }, {writeHead: () => {}, end: data => {
    t.equal(data, 'no index!', 'returns no index!')
    t.end()
  }})
})

test('app server - default index exists', t => {
  stat.withArgs(path.join('dir', 'phone', 'a', 'c.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'a', 'c.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'index.html'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'default', 'index.html'))
    .returns({pipe: response => response.end('default index')})

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/c.js'
  }, {writeHead: () => {}, end: data => {
    t.equal(data, 'default index', 'returns default index')
    t.end()
  }})
})

test('app server - get phone index', t => {
  server(80, 'dir')

  stat.withArgs(path.join('dir', 'phone', 'a', 'b'))
    .callsArgWith(1, false, { isFile: () => false })

  stat.withArgs(path.join('dir', 'default', 'a', 'b'))
    .callsArgWith(1, false, { isFile: () => false })

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'phone', 'index.html'))
    .returns({pipe: response => response.end('phone index')})

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b'
  }, {writeHead: () => {}, end: data => {
    t.equal(data, 'phone index', 'returns phone index')
    t.end()
  }})
})

test('app server - get phone/a/b.js', t => {
  server(80, 'dir')

  stat.withArgs(path.join('dir', 'phone', 'a', 'b.js'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'phone', 'a', 'b.js'))
    .returns({pipe: response => response.end('phone/a/b.js')})

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b.js'
  }, {writeHead: () => {}, end: data => {
    t.equal(data, 'phone/a/b.js', 'returns phone/a/b.js')
    t.end()
  }})
})

test('app server - get default/a/d.js', t => {
  server(80, 'dir')

  stat.withArgs(path.join('dir', 'phone', 'a', 'd.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'a', 'd.js'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'default', 'a', 'd.js'))
    .returns({pipe: response => response.end('default/a/d.js')})

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/d.js'
  }, {writeHead: () => {}, end: data => {
    t.equal(data, 'default/a/d.js', 'returns default/a/d.js')
    t.end()
  }})
})

test.onFinish(() => {
  http.createServer.restore()
  fs.stat.restore()
  fs.createReadStream.restore()
})
