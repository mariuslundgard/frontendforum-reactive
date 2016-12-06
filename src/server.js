/* eslint-disable */

const createWebpackDevMiddleware = require('webpack-dev-middleware')
const createWebpackHotMiddleware = require('webpack-hot-middleware')
const express = require('express')
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('../webpack.config.js')
const cssModulesRequireHook = require('css-modules-require-hook')
const {Observable} = require('rxjs')
const superagent = require('superagent')
const fs = require('fs')

cssModulesRequireHook({
  generateScopedName: 'nrk-[local]',
})

const DEV_MODE = process.env.NODE_ENV !== 'production'
const PORT = process.env.APP_PORT || 8080

const app = express()

// yr api proxy
app.use((req, res, next) => {
  if (req.url.indexOf('/yr-api') === 0) {
    superagent.get(`https://www.yr.no/api${req.url.substr(7)}`)
      .then((r) => {
        // res.set('Content-Type', 'application/json')
        res.send(r.body)
      })
      .catch((err) => res.send(err))
  } else {
    next()
  }
})

// Use Bjartmar
const bjartmarMiddleware = express.static(path.resolve(__dirname, '../node_modules/@nrk/bjartmar/dist'))
app.use(bjartmarMiddleware)

if (DEV_MODE) {
  const compiler = webpack(webpackConfig)
  const webpackDevMiddleware = createWebpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  })
  const webpackHotMiddleware = createWebpackHotMiddleware(compiler)

  // Use webpack middleware
  app.use(webpackDevMiddleware)
  app.use(webpackHotMiddleware)

  // Handle requests
  app.get('*', (req, res) => {
    // eslint-disable-next-line no-sync
    res.write(webpackDevMiddleware.fileSystem.readFileSync(path.resolve(__dirname, '../dist/index.html')))
    res.end()
  })
} else {
  app.use(express.static(path.resolve(__dirname, '../dist')))
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../dist/index.html')))
}

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) console.log(err)
  console.info('==> 🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', PORT, PORT)
})
