'use strict'

const test = require('tape')

// sinon is super dangerous
const sinon = require('sinon')

const http = require('http')
const path = require('path')
const fs = require('fs')
var stat
var statSync
var readdirSync
var readFileSync
var createReadStream
var getUrl
const server = require('../lib/server')

test('app server - no default index', t => {
  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return {listen: () => {}}
  })

  stat = sinon.stub(fs, 'stat')
  statSync = sinon.stub(fs, 'statSync')
  readdirSync = sinon.stub(fs, 'readdirSync')
  readFileSync = sinon.stub(fs, 'readFileSync')
  createReadStream = sinon.stub(fs, 'createReadStream')

  stat.withArgs(path.join('dir', 'phone'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'index.html'))
    .callsArgWith(1, true)

  readdirSync.withArgs(path.join('dir'))
    .returns([])

  server(null, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: ''
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'no index!', 'returns no index!')
      t.end()
    }
  })
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

  readdirSync.withArgs(path.join('dir'))
    .returns([])

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/c.js'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'default index', 'returns default index')
      t.end()
    }
  })
})

test('app server - get phone index', t => {
  stat.withArgs(path.join('dir', 'phone', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'phone', 'index.html'))
    .returns({pipe: response => response.end('phone index')})

  readdirSync.withArgs(path.join('dir'))
    .returns([])

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'phone index', 'returns phone index')
      t.end()
    }
  })
})

test('app server - get phone/a/b.js', t => {
  stat.withArgs(path.join('dir', 'phone', 'a', 'b.js'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'phone', 'a', 'b.js'))
    .returns({pipe: response => response.end('phone/a/b.js')})

  readdirSync.withArgs(path.join('dir'))
    .returns([])

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b.js'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'phone/a/b.js', 'returns phone/a/b.js')
      t.end()
    }
  })
})

test('app server - get default/a/d.js', t => {
  stat.withArgs(path.join('dir', 'phone', 'a', 'd.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'a', 'd.js'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'default', 'a', 'd.js'))
    .returns({pipe: response => response.end('default/a/d.js')})

  readdirSync.withArgs(path.join('dir'))
    .returns([])

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/d.js'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'default/a/d.js', 'returns default/a/d.js')
      t.end()
    }
  })
})

test('app server - get cache manifest', t => {
  readdirSync.withArgs(path.join('dir'))
    .returns(['phone'])

  statSync.withArgs(path.join('dir', 'phone'))
    .returns({isDirectory: () => true})

  stat.withArgs(path.join('dir', 'phone', 'app.appcache'))
    .callsArgWith(1, false, {isFile: () => true})

  readFileSync.withArgs(path.join('dir', 'phone', 'app.appcache'))
    .returns('CACHE MANIFEST')

  stat.withArgs(path.join('dir', 'phone', 'a'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'a'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'default', 'index.html'))
    .callsArgWith(1, true)

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'no index!', 'returns no index!')
    }
  })

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'no index!', 'returns no index!')
    }
  })

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/app.appcache'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'CACHE MANIFEST\n/a\n/a/b', 'returns cache manifest')
    }
  })

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: 'app.appcache'
  }, {
    writeHead: () => {},
    end: data => {
      t.equal(data, 'CACHE MANIFEST\n/a\n/a/b', 'returns cache manifest')
      t.end()
    }
  })
})

test.onFinish(() => {
  http.createServer.restore()
  fs.stat.restore()
  fs.statSync.restore()
  fs.readdirSync.restore()
  fs.readFileSync.restore()
  fs.createReadStream.restore()
})
