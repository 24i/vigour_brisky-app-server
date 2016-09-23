'use strict'
const Transform = require('stream').Transform
class HtmlTransform extends Transform {
  setVersion (pkg) {
    this.version = `<head>\n<meta name="app-version" content="${pkg.name}@${pkg.version}">`
  }
  _transform (chunk, encoding, cb) {
    var string = chunk.toString()
    if (string.indexOf('<head>')) {
      string = string.replace('<head>', this.version)
      chunk = Buffer.from(string, 'utf-8')
    }
    this.push(chunk)
    cb()
  }
}
module.exports = (pkg) => {
  const transform = new HtmlTransform()
  transform.setVersion(pkg)
  return transform
}
