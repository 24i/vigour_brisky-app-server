'use strict'
// the server build getter can become more abstract of course
const http = require('http')
const travis = process.env.TRAVIS
const slack = process.env.SLACK
const allowVersions = process.env.ALLOW_VERSION
const target = process.env.TARGET
const builder = process.env.BUILDER || 'bender-service.vigour.io'
const render = require('brisky/render')
const parseElement = require('parse-element')
const appEnv = process.env.APP_ENV
const s = require('vigour-state/s')

// all env variables will go to the build process as well
// need to loop trough env and put them in the build
// do more prepping with buildign
// allways do cache manidfest

const settings = {
  appEnv,
  builder,
  travis,
  slack,
  allowVersions
}

const cache = {}

 // 'http://bender-service.vigour.io/build?version=master&repo=adm-app&NODE_ENV=develop'

// pass in a server as option
function BriskyServer (app, state) {
  // app can be a url as well
  if (!app) {
    app = {
      text: 'birsky-server',
      count: {
        text: { $: 'cnt' }
      },
      env: {
        $: 'env.$any',
        child: {
          text: { $: true, $prepend: (val, state) => state.key + ': ' }
        }
      }
    }
  }

  const server = http.createServer((req, res) => {
    if (!state) {
      state = s({
        env: settings,
        cnt: 1
      })
    }

    getBuild(res, 'master', target)

    var cnt = 0
    function writeStatus () {
      cnt++
      state.cnt.set(++state.cnt.val)
      console.log('?', state.cnt.val)
      res.write(parseElement(
        render(app, state))
      )
      if (cnt > 3) {
        res.end('ok now i should get it or something...')
      } else {
        setTimeout(writeStatus, 1000)
      }
    }

    writeStatus()
  })
  return server
}

module.exports = BriskyServer

function getBuild (briskyRes, version, target) {
  console.log(builder.match(/(https?:\/\/)(.*?)+\/(.+)$/))
  const req = http.request({
    host: builder,
    path: `/build?version=${version}&repo=${target}`
  }, (res) => {
    console.log('yoyoyo', res)
    var str = ''
    res.on('data', (data) => {
      str += data
    })
    res.on('end', () => {
      console.log(str)
    })
  })
  req.end()
}

// 'http://bender-service.vigour.io/build?version=master&repo=adm-app&NODE_ENV=develop'
