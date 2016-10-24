'use strict'

const test = require('tape')

const sinon = require('sinon')

const http = require('http')
const path = require('path')
const fs = require('fs')
const server = require('../lib/server')

test('app server - no main index', t => {
  var getUrl

  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return { listen () {} }
  })

  const stat = sinon.stub(fs, 'stat')
  const statSync = sinon.stub(fs, 'statSync')
  const readFileSync = sinon.stub(fs, 'readFileSync')
  const createReadStream = sinon.stub(fs, 'createReadStream')

  stat.withArgs(path.join('dir', 'phone'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'index.html'))
    .callsArgWith(1, true)

  server(null, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: ''
  }, {
    setHeader: () => {},
    end: data => {
      t.equal(data, 'no index!', 'returns no index!')
      t.end()
      http.createServer.restore()
      stat.restore()
      statSync.restore()
      readFileSync.restore()
      createReadStream.restore()
    }
  })
})

test('app server - main index exists', t => {
  var getUrl

  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return { listen () {} }
  })

  const stat = sinon.stub(fs, 'stat')
  const statSync = sinon.stub(fs, 'statSync')
  const readFileSync = sinon.stub(fs, 'readFileSync')
  const createReadStream = sinon.stub(fs, 'createReadStream')

  stat.withArgs(path.join('dir', 'phone', 'a', 'c.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'a', 'c.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'index.html'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'main', 'index.html'))
    .returns({pipe: response => response.end('main index')})

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/c.js'
  }, {
    setHeader: () => {},
    end: data => {
      t.equal(data, 'main index', 'returns main index')
      t.end()
      http.createServer.restore()
      stat.restore()
      statSync.restore()
      readFileSync.restore()
      createReadStream.restore()
    }
  })
})

test('app server - get phone index', t => {
  var getUrl

  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return { listen () {} }
  })

  const stat = sinon.stub(fs, 'stat')
  const statSync = sinon.stub(fs, 'statSync')
  const readFileSync = sinon.stub(fs, 'readFileSync')
  const createReadStream = sinon.stub(fs, 'createReadStream')

  stat.withArgs(path.join('dir', 'phone', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'phone', 'index.html'))
    .returns({pipe: response => response.end('phone index')})

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b'
  }, {
    setHeader: () => {},
    end: data => {
      t.equal(data, 'phone index', 'returns phone index')
      t.end()
      http.createServer.restore()
      stat.restore()
      statSync.restore()
      readFileSync.restore()
      createReadStream.restore()
    }
  })
})

test('app server - get phone/a/b.js', t => {
  var getUrl

  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return { listen () {} }
  })

  const stat = sinon.stub(fs, 'stat')
  const statSync = sinon.stub(fs, 'statSync')
  const readFileSync = sinon.stub(fs, 'readFileSync')
  const createReadStream = sinon.stub(fs, 'createReadStream')

  stat.withArgs(path.join('dir', 'phone', 'a', 'b.js'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'phone', 'a', 'b.js'))
    .returns({pipe: response => response.end('phone/a/b.js')})

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/b.js'
  }, {
    setHeader: () => {},
    end: data => {
      t.equal(data, 'phone/a/b.js', 'returns phone/a/b.js')
      t.end()
      http.createServer.restore()
      stat.restore()
      statSync.restore()
      readFileSync.restore()
      createReadStream.restore()
    }
  })
})

test('app server - get main/a/d.js', t => {
  var getUrl

  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return { listen () {} }
  })

  const stat = sinon.stub(fs, 'stat')
  const statSync = sinon.stub(fs, 'statSync')
  const readFileSync = sinon.stub(fs, 'readFileSync')
  const createReadStream = sinon.stub(fs, 'createReadStream')

  stat.withArgs(path.join('dir', 'phone', 'a', 'd.js'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'a', 'd.js'))
    .callsArgWith(1, false, { isFile: () => true })

  createReadStream.withArgs(path.join('dir', 'main', 'a', 'd.js'))
    .returns({pipe: response => response.end('main/a/d.js')})

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a/d.js'
  }, {
    setHeader: () => {},
    end: data => {
      t.equal(data, 'main/a/d.js', 'returns main/a/d.js')
      t.end()
      http.createServer.restore()
      stat.restore()
      statSync.restore()
      readFileSync.restore()
      createReadStream.restore()
    }
  })
})

test('app server - get cache manifest', t => {
  var getUrl

  sinon.stub(http, 'createServer', fn => {
    getUrl = fn
    return { listen () {} }
  })

  const stat = sinon.stub(fs, 'stat')
  const statSync = sinon.stub(fs, 'statSync')
  const readFileSync = sinon.stub(fs, 'readFileSync')
  const createReadStream = sinon.stub(fs, 'createReadStream')

  statSync.withArgs(path.join('dir', 'phone'))
    .returns({isDirectory: () => true})

  stat.withArgs(path.join('dir', 'phone', 'app.appcache'))
    .callsArgWith(1, false, {isFile: () => true})

  readFileSync.withArgs(path.join('dir', 'phone', 'app.appcache'))
    .returns('CACHE MANIFEST')

  stat.withArgs(path.join('dir', 'phone', 'a'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'a'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'a', 'b'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'phone', 'index.html'))
    .callsArgWith(1, true)

  stat.withArgs(path.join('dir', 'main', 'index.html'))
    .callsArgWith(1, true)

  server(80, 'dir')

  getUrl({
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13B137'
    },
    url: '/a'
  }, {
    setHeader: () => {},
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
    setHeader: () => {},
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
    setHeader: () => {},
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
    setHeader: () => {},
    end: data => {
      t.equal(data, 'CACHE MANIFEST\n/a\n/a/b', 'returns cache manifest')
      t.end()
      http.createServer.restore()
      stat.restore()
      statSync.restore()
      readFileSync.restore()
      createReadStream.restore()
    }
  })
})
