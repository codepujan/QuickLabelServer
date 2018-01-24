# express-history-spa-fallback
A tiny, accurate, fast Express middleware for single page apps with client side routing.

If you're able to send a static HTML file, use [express-history-api-fallback](https://www.npmjs.com/package/express-history-api-fallback) instead. This middleware is for cases where it's generating static files is impractical (React server side rendering for instance).

[![Build Status](https://travis-ci.org/stipsan/express-history-spa-fallback.svg?branch=master)](https://travis-ci.org/stipsan/express-history-spa-fallback)
[![Coverage Status](https://coveralls.io/repos/github/stipsan/express-history-spa-fallback/badge.svg?branch=master)](https://coveralls.io/github/stipsan/express-history-spa-fallback?branch=master)

[![NPM](https://nodei.co/npm/express-history-spa-fallback.png)](https://www.npmjs.com/package/express-history-spa-fallback)

Works as a middleware for Express v4.8.0 or later. Can be used as either an application middleware or a router middleware.

```js
import fallback from 'express-history-spa-fallback'
import express from 'express'
const app = express()
app.use(express.static(`${__dirname}/public`))
app.use(fallback((req, res, next) => res.send(`<!doctype html>
<html>
  <head>
    <title>Hello World!</title>
  </head>
  <body>
    ...
  </body>
</html>`)))
```

## fallback(callback)
Returns a middleware for use by Express applications and routers.

The `callback` argument is executed when it's a HTML request and the HTTP method equals `GET`.
The callback have the same arguments that express is passing in middleware, that is `req`, `res` and `next`.

This function will be called for every request. You'll have to evaluate wether or not to memoize the callback depending on your business logic.

## But doesn't this already exist?
Yes, but this implementation is much better.

- **Only for GET requests**: The fallback should not serve your `index.html` for `POST` or other requests.
- **Only for HTML requests**: Never serve mistakenly for JS or CSS or image or other static file requests. Less debugging headaches.
- **Only when needed**: Serve the fallback only when the file is missing.
- **Minimal code**: Just a few lines. No magic. No complexity.

See the blog post ["Single Page App Routing with Express & Node.js"](https://ninja.sg/spa-router-fallback/) for an overview of the problems with alternative middlewares.
