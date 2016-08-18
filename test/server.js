'use strict'

const test = require('tape')
const sinon = require('sinon')

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const ua = require('vigour-ua')

const server = require('../lib/server')

var getUrl
sinon.stub(http, 'createServer', fn => {
  getUrl = fn
  return {listen: () => {}}
})

const stat = sinon.stub(fs, 'stat')
const createReadStream = sinon.stub(fs, 'createReadStream')

stat.withArgs(path.join('dir', 'default', 'index.html'))
  .callsArgWith(1, true)

test('app server - get phone index', t => {
  server(80, 'dir')

  stat.withArgs(path.join('dir', 'phone', '/'))
    .callsArgWith(1, false, {
      isFile: () => false,
      isDirectory: () => true
    })

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, false, {
      isFile: () => true,
      isDirectory: () => false
    })

  createReadStream.withArgs(path.join('dir', 'phone', 'index.html'))
    .returns({pipe: response => response.end('phone index')})

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/'
  }, {writeHead: () => {}, end: data => {
    t.equal(data, 'phone index', 'returns phone index')
    t.end()
  }})
})

test.onFinish(() => {
  http.createServer.restore()
  fs.stat.restore()
  fs.createReadStream.restore()
})
