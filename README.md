# brisky-server
Prerendering server for brisky-apps

```javascript
const BriskyServer = require('brisky-server')
BriskyServer(require('./app')).listen(8081)
```


Spec
- travis integration
- git - where to store key
- slack integration
- archive (where to store apps)
- url for versions of apps 
  - mybriskyapp.com?tag=1.2.3

```javascript
const BriskyServer = require('brisky-server')
BriskyServer(require('./app'), {
  archive: './storage/',
  travis: {
    key: '2312412412XXXX',
    repo: 'brisky-examples',
    version: 'x.x.x' 
    // watches on commit messages, checks for tags additions -- checks if a commit message has a tag
  },
  slack: {
    key: '2312412412XXXX',
    channel: '#brisky'
  }
}).listen(8081)
```
