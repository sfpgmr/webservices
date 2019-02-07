'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var createError = _interopDefault(require('http-errors'));
var dbg = _interopDefault(require('debug'));
var depd = _interopDefault(require('depd'));
var destroy = _interopDefault(require('destroy'));
var encodeUrl = _interopDefault(require('encodeurl'));
var escapeHtml = _interopDefault(require('escape-html'));
var etag = _interopDefault(require('etag'));
var fresh = _interopDefault(require('fresh'));
var fs = _interopDefault(require('fs'));
var mime = _interopDefault(require('mime'));
var ms = _interopDefault(require('ms'));
var onFinished = _interopDefault(require('on-finished'));
var parseRange = _interopDefault(require('range-parser'));
var path = require('path');
var path__default = _interopDefault(path);
var statuses = _interopDefault(require('statuses'));
var Stream = _interopDefault(require('stream'));
var util = _interopDefault(require('util'));
var parseUrl = _interopDefault(require('parseurl'));
var url = _interopDefault(require('url'));
var os = _interopDefault(require('os'));
var http = _interopDefault(require('http'));
var express = _interopDefault(require('express'));
var zlib = _interopDefault(require('zlib'));
var child_process = require('child_process');
var queue = _interopDefault(require('async/queue'));
require('body-parser');
var cookieParser = _interopDefault(require('cookie-parser'));
var logger = _interopDefault(require('morgan'));
var xhub = _interopDefault(require('express-x-hub'));
var socket_io = _interopDefault(require('socket.io'));
var http2 = _interopDefault(require('spdy'));

/*!
 * send
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */
const debug = dbg('send');
const deprecate = depd('send');

/**
 * Path function references.
 * @private
 */

var extname = path__default.extname;
var join = path__default.join;
var normalize = path__default.normalize;
var resolve = path__default.resolve;
var sep = path__default.sep;

/**
 * Regular expression for identifying a bytes Range header.
 * @private
 */

var BYTES_RANGE_REGEXP = /^ *bytes=/;

/**
 * Maximum value allowed for the max age.
 * @private
 */

var MAX_MAXAGE = 60 * 60 * 24 * 365 * 1000; // 1 year

/**
 * Regular expression to match a path with a directory up component.
 * @private
 */

var UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

/**
 * Module exports.
 * @public
 */


/**
 * Return a `SendStream` for `req` and `path`.
 *
 * @param {object} req
 * @param {string} path
 * @param {object} [options]
 * @return {SendStream}
 * @public
 */

function send (req, path$$1, options) {
  return new SendStream(req, path$$1, options)
}

/**
 * Initialize a `SendStream` with the given `path`.
 *
 * @param {Request} req
 * @param {String} path
 * @param {object} [options]
 * @private
 */

function SendStream (req, path$$1, options) {
  Stream.call(this);

  var opts = options || {};

  this.options = opts;
  this.path = path$$1;
  this.req = req;

  this._acceptRanges = opts.acceptRanges !== undefined
    ? Boolean(opts.acceptRanges)
    : true;

  this._cacheControl = opts.cacheControl !== undefined
    ? Boolean(opts.cacheControl)
    : true;

  this._etag = opts.etag !== undefined
    ? Boolean(opts.etag)
    : true;

  this._dotfiles = opts.dotfiles !== undefined
    ? opts.dotfiles
    : 'ignore';

  if (this._dotfiles !== 'ignore' && this._dotfiles !== 'allow' && this._dotfiles !== 'deny') {
    throw new TypeError('dotfiles option must be "allow", "deny", or "ignore"')
  }

  this._hidden = Boolean(opts.hidden);

  if (opts.hidden !== undefined) {
    deprecate('hidden: use dotfiles: \'' + (this._hidden ? 'allow' : 'ignore') + '\' instead');
  }

  // legacy support
  if (opts.dotfiles === undefined) {
    this._dotfiles = undefined;
  }

  this._extensions = opts.extensions !== undefined
    ? normalizeList(opts.extensions, 'extensions option')
    : [];

  this._immutable = opts.immutable !== undefined
    ? Boolean(opts.immutable)
    : false;

  this._index = opts.index !== undefined
    ? normalizeList(opts.index, 'index option')
    : ['index.html'];

  this._lastModified = opts.lastModified !== undefined
    ? Boolean(opts.lastModified)
    : true;

  this._maxage = opts.maxAge || opts.maxage;
  this._maxage = typeof this._maxage === 'string'
    ? ms(this._maxage)
    : Number(this._maxage);
  this._maxage = !isNaN(this._maxage)
    ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
    : 0;

  this._root = opts.root
    ? resolve(opts.root)
    : null;

  if (!this._root && opts.from) {
    this.from(opts.from);
  }
}

/**
 * Inherits from `Stream`.
 */

util.inherits(SendStream, Stream);

/**
 * Enable or disable etag generation.
 *
 * @param {Boolean} val
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.etag = deprecate.function(function etag$$1 (val) {
  this._etag = Boolean(val);
  debug('etag %s', this._etag);
  return this
}, 'send.etag: pass etag as option');

/**
 * Enable or disable "hidden" (dot) files.
 *
 * @param {Boolean} path
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.hidden = deprecate.function(function hidden (val) {
  this._hidden = Boolean(val);
  this._dotfiles = undefined;
  debug('hidden %s', this._hidden);
  return this
}, 'send.hidden: use dotfiles option');

/**
 * Set index `paths`, set to a falsy
 * value to disable index support.
 *
 * @param {String|Boolean|Array} paths
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.index = deprecate.function(function index (paths) {
  var index = !paths ? [] : normalizeList(paths, 'paths argument');
  debug('index %o', paths);
  this._index = index;
  return this
}, 'send.index: pass index as option');

/**
 * Set root `path`.
 *
 * @param {String} path
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.root = function root (path$$1) {
  this._root = resolve(String(path$$1));
  debug('root %s', this._root);
  return this
};

SendStream.prototype.from = deprecate.function(SendStream.prototype.root,
  'send.from: pass root as option');

SendStream.prototype.root = deprecate.function(SendStream.prototype.root,
  'send.root: pass root as option');

/**
 * Set max-age to `maxAge`.
 *
 * @param {Number} maxAge
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.maxage = deprecate.function(function maxage (maxAge) {
  this._maxage = typeof maxAge === 'string'
    ? ms(maxAge)
    : Number(maxAge);
  this._maxage = !isNaN(this._maxage)
    ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
    : 0;
  debug('max-age %d', this._maxage);
  return this
}, 'send.maxage: pass maxAge as option');

/**
 * Emit error with `status`.
 *
 * @param {number} status
 * @param {Error} [err]
 * @private
 */

SendStream.prototype.error = function error (status, err) {
  // emit if listeners instead of responding
  if (hasListeners(this, 'error')) {
    return this.emit('error', createError(status, err, {
      expose: false
    }))
  }

  var res = this.res;
  var msg = statuses[status] || String(status);
  var doc = createHtmlDocument('Error', escapeHtml(msg));

  // clear existing headers
  clearHeaders(res);

  // add error headers
  if (err && err.headers) {
    setHeaders(res, err.headers);
  }

  // send basic response
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Content-Length', Buffer.byteLength(doc));
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(doc);
};

/**
 * Check if the pathname ends with "/".
 *
 * @return {boolean}
 * @private
 */

SendStream.prototype.hasTrailingSlash = function hasTrailingSlash () {
  return this.path[this.path.length - 1] === '/'
};

/**
 * Check if this is a conditional GET request.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isConditionalGET = function isConditionalGET () {
  return this.req.headers['if-match'] ||
    this.req.headers['if-unmodified-since'] ||
    this.req.headers['if-none-match'] ||
    this.req.headers['if-modified-since']
};

/**
 * Check if the request preconditions failed.
 *
 * @return {boolean}
 * @private
 */

SendStream.prototype.isPreconditionFailure = function isPreconditionFailure () {
  var req = this.req;
  var res = this.res;

  // if-match
  var match = req.headers['if-match'];
  if (match) {
    var etag$$1 = res.getHeader('ETag');
    return !etag$$1 || (match !== '*' && parseTokenList(match).every(function (match) {
      return match !== etag$$1 && match !== 'W/' + etag$$1 && 'W/' + match !== etag$$1
    }))
  }

  // if-unmodified-since
  var unmodifiedSince = parseHttpDate(req.headers['if-unmodified-since']);
  if (!isNaN(unmodifiedSince)) {
    var lastModified = parseHttpDate(res.getHeader('Last-Modified'));
    return isNaN(lastModified) || lastModified > unmodifiedSince
  }

  return false
};

/**
 * Strip content-* header fields.
 *
 * @private
 */

SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields () {
  var res = this.res;
  var headers = getHeaderNames(res);

  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (header.substr(0, 8) === 'content-' && header !== 'content-location') {
      res.removeHeader(header);
    }
  }
};

/**
 * Respond with 304 not modified.
 *
 * @api private
 */

SendStream.prototype.notModified = function notModified () {
  var res = this.res;
  debug('not modified');
  this.removeContentHeaderFields();
  res.statusCode = 304;
  res.end();
};

/**
 * Raise error that headers already sent.
 *
 * @api private
 */

SendStream.prototype.headersAlreadySent = function headersAlreadySent () {
  var err = new Error('Can\'t set headers after they are sent.');
  debug('headers already sent');
  this.error(500, err);
};

/**
 * Check if the request is cacheable, aka
 * responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isCachable = function isCachable () {
  var statusCode = this.res.statusCode;
  return (statusCode >= 200 && statusCode < 300) ||
    statusCode === 304
};

/**
 * Handle stat() error.
 *
 * @param {Error} error
 * @private
 */

SendStream.prototype.onStatError = function onStatError (error) {
  switch (error.code) {
    case 'ENAMETOOLONG':
    case 'ENOENT':
    case 'ENOTDIR':
      this.error(404, error);
      break
    default:
      this.error(500, error);
      break
  }
};

/**
 * Check if the cache is fresh.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isFresh = function isFresh () {
  return fresh(this.req.headers, {
    'etag': this.res.getHeader('ETag'),
    'last-modified': this.res.getHeader('Last-Modified')
  })
};

/**
 * Check if the range is fresh.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isRangeFresh = function isRangeFresh () {
  var ifRange = this.req.headers['if-range'];

  if (!ifRange) {
    return true
  }

  // if-range as etag
  if (ifRange.indexOf('"') !== -1) {
    var etag$$1 = this.res.getHeader('ETag');
    return Boolean(etag$$1 && ifRange.indexOf(etag$$1) !== -1)
  }

  // if-range as modified date
  var lastModified = this.res.getHeader('Last-Modified');
  return parseHttpDate(lastModified) <= parseHttpDate(ifRange)
};

/**
 * Redirect to path.
 *
 * @param {string} path
 * @private
 */

SendStream.prototype.redirect = function redirect (path$$1) {
  var res = this.res;

  if (hasListeners(this, 'directory')) {
    this.emit('directory', res, path$$1);
    return
  }

  if (this.hasTrailingSlash()) {
    this.error(403);
    return
  }

  var loc = encodeUrl(collapseLeadingSlashes(this.path + '/'));
  var doc = createHtmlDocument('Redirecting', 'Redirecting to <a href="' + escapeHtml(loc) + '">' +
    escapeHtml(loc) + '</a>');

  // redirect
  res.statusCode = 301;
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Content-Length', Buffer.byteLength(doc));
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Location', loc);
  res.end(doc);
};

/**
 * Pipe to `res.
 *
 * @param {Stream} res
 * @return {Stream} res
 * @api public
 */

SendStream.prototype.pipe = function pipe (res) {
  // root path
  var root = this._root;

  // references
  this.res = res;

  // decode the path
  var path$$1 = this.path;//decode(this.path)
  if (path$$1 === -1) {
    this.error(400);
    return res
  }

  // null byte(s)
  if (~path$$1.indexOf('\0')) {
    this.error(400);
    return res
  }

  var parts;
  if (root !== null) {
    // normalize
    if (path$$1) {
      path$$1 = normalize('.' + sep + path$$1);
    }

    // malicious path
    if (UP_PATH_REGEXP.test(path$$1)) {
      debug('malicious path "%s"', path$$1);
      this.error(403);
      return res
    }

    // explode path parts
    parts = path$$1.split(sep);

    // join / normalize from optional root dir
    path$$1 = normalize(join(root, path$$1));
    root = normalize(root + sep);
  } else {
    // ".." is malicious without "root"
    if (UP_PATH_REGEXP.test(path$$1)) {
      debug('malicious path "%s"', path$$1);
      this.error(403);
      return res
    }

    // explode path parts
    parts = normalize(path$$1).split(sep);

    // resolve the path
    path$$1 = resolve(path$$1);
  }

  // dotfile handling
  if (containsDotFile(parts)) {
    var access = this._dotfiles;

    // legacy support
    if (access === undefined) {
      access = parts[parts.length - 1][0] === '.'
        ? (this._hidden ? 'allow' : 'ignore')
        : 'allow';
    }

    debug('%s dotfile "%s"', access, path$$1);
    switch (access) {
      case 'allow':
        break
      case 'deny':
        this.error(403);
        return res
      case 'ignore':
      default:
        this.error(404);
        return res
    }
  }

  // index file support
  if (this._index.length && this.hasTrailingSlash()) {
    this.sendIndex(path$$1);
    return res
  }

  this.sendFile(path$$1);
  return res
};

/**
 * Transfer `path`.
 *
 * @param {String} path
 * @api public
 */

SendStream.prototype.send = function send (path$$1, stat) {
  var len = stat.size;
  var options = this.options;
  var opts = {};
  var res = this.res;
  var req = this.req;
  var ranges = req.headers.range;
  var offset = options.start || 0;

  if (headersSent(res)) {
    // impossible to send now
    this.headersAlreadySent();
    return
  }

  debug('pipe "%s"', path$$1);

  // set header fields
  this.setHeader(path$$1, stat);

  // set content-type
  this.type(path$$1);

  // conditional GET support
  if (this.isConditionalGET()) {
    if (this.isPreconditionFailure()) {
      this.error(412);
      return
    }

    if (this.isCachable() && this.isFresh()) {
      this.notModified();
      return
    }
  }

  // adjust len to start/end options
  len = Math.max(0, len - offset);
  if (options.end !== undefined) {
    var bytes = options.end - offset + 1;
    if (len > bytes) len = bytes;
  }

  // Range support
  if (this._acceptRanges && BYTES_RANGE_REGEXP.test(ranges)) {
    // parse
    ranges = parseRange(len, ranges, {
      combine: true
    });

    // If-Range support
    if (!this.isRangeFresh()) {
      debug('range stale');
      ranges = -2;
    }

    // unsatisfiable
    if (ranges === -1) {
      debug('range unsatisfiable');

      // Content-Range
      res.setHeader('Content-Range', contentRange('bytes', len));

      // 416 Requested Range Not Satisfiable
      return this.error(416, {
        headers: {'Content-Range': res.getHeader('Content-Range')}
      })
    }

    // valid (syntactically invalid/multiple ranges are treated as a regular response)
    if (ranges !== -2 && ranges.length === 1) {
      debug('range %j', ranges);

      // Content-Range
      res.statusCode = 206;
      res.setHeader('Content-Range', contentRange('bytes', len, ranges[0]));

      // adjust for requested range
      offset += ranges[0].start;
      len = ranges[0].end - ranges[0].start + 1;
    }
  }

  // clone options
  for (var prop in options) {
    opts[prop] = options[prop];
  }

  // set read options
  opts.start = offset;
  opts.end = Math.max(offset, offset + len - 1);

  // content-length
  res.setHeader('Content-Length', len);

  // HEAD support
  if (req.method === 'HEAD') {
    res.end();
    return
  }

  this.stream(path$$1, opts);
};

/**
 * Transfer file for `path`.
 *
 * @param {String} path
 * @api private
 */
SendStream.prototype.sendFile = function sendFile (path$$1) {
  var i = 0;
  var self = this;

  debug('stat "%s"', path$$1);
  fs.stat(path$$1, function onstat (err, stat) {
    if (err && err.code === 'ENOENT' && !extname(path$$1) && path$$1[path$$1.length - 1] !== sep) {
      // not found, check extensions
      return next(err)
    }
    if (err) return self.onStatError(err)
    if (stat.isDirectory()) return self.redirect(path$$1)
    self.emit('file', path$$1, stat);
    self.send(path$$1, stat);
  });

  function next (err) {
    if (self._extensions.length <= i) {
      return err
        ? self.onStatError(err)
        : self.error(404)
    }

    var p = path$$1 + '.' + self._extensions[i++];

    debug('stat "%s"', p);
    fs.stat(p, function (err, stat) {
      if (err) return next(err)
      if (stat.isDirectory()) return next()
      self.emit('file', p, stat);
      self.send(p, stat);
    });
  }
};

/**
 * Transfer index for `path`.
 *
 * @param {String} path
 * @api private
 */
SendStream.prototype.sendIndex = function sendIndex (path$$1) {
  var i = -1;
  var self = this;

  function next (err) {
    if (++i >= self._index.length) {
      if (err) return self.onStatError(err)
      return self.error(404)
    }

    var p = join(path$$1, self._index[i]);

    debug('stat "%s"', p);
    fs.stat(p, function (err, stat) {
      if (err) return next(err)
      if (stat.isDirectory()) return next()
      self.emit('file', p, stat);
      self.send(p, stat);
    });
  }

  next();
};

/**
 * Stream `path` to the response.
 *
 * @param {String} path
 * @param {Object} options
 * @api private
 */

SendStream.prototype.stream = function stream (path$$1, options) {
  // TODO: this is all lame, refactor meeee
  var finished = false;
  var self = this;
  var res = this.res;

  // pipe
  var stream = fs.createReadStream(path$$1, options);
  this.emit('stream', stream);
  stream.pipe(res);

  // response finished, done with the fd
  onFinished(res, function onfinished () {
    finished = true;
    destroy(stream);
  });

  // error handling code-smell
  stream.on('error', function onerror (err) {
    // request already finished
    if (finished) return

    // clean up stream
    finished = true;
    destroy(stream);

    // error
    self.onStatError(err);
  });

  // end
  stream.on('end', function onend () {
    self.emit('end');
  });
};

/**
 * Set content-type based on `path`
 * if it hasn't been explicitly set.
 *
 * @param {String} path
 * @api private
 */

SendStream.prototype.type = function type (path$$1) {
  var res = this.res;

  if (res.getHeader('Content-Type')) return

  var type = mime.lookup(path$$1);

  if (!type) {
    debug('no content-type');
    return
  }

  var charset = mime.charsets.lookup(type);

  debug('content-type %s', type);
  res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
};

/**
 * Set response header fields, most
 * fields may be pre-defined.
 *
 * @param {String} path
 * @param {Object} stat
 * @api private
 */

SendStream.prototype.setHeader = function setHeader (path$$1, stat) {
  var res = this.res;

  this.emit('headers', res, path$$1, stat);

  if (this._acceptRanges && !res.getHeader('Accept-Ranges')) {
    debug('accept ranges');
    res.setHeader('Accept-Ranges', 'bytes');
  }

  if (this._cacheControl && !res.getHeader('Cache-Control')) {
    var cacheControl = 'public, max-age=' + Math.floor(this._maxage / 1000);

    if (this._immutable) {
      cacheControl += ', immutable';
    }

    debug('cache-control %s', cacheControl);
    res.setHeader('Cache-Control', cacheControl);
  }

  if (this._lastModified && !res.getHeader('Last-Modified')) {
    var modified = stat.mtime.toUTCString();
    debug('modified %s', modified);
    res.setHeader('Last-Modified', modified);
  }

  if (this._etag && !res.getHeader('ETag')) {
    var val = etag(stat);
    debug('etag %s', val);
    res.setHeader('ETag', val);
  }
};

/**
 * Clear all headers from a response.
 *
 * @param {object} res
 * @private
 */

function clearHeaders (res) {
  var headers = getHeaderNames(res);

  for (var i = 0; i < headers.length; i++) {
    res.removeHeader(headers[i]);
  }
}

/**
 * Collapse all leading slashes into a single slash
 *
 * @param {string} str
 * @private
 */
function collapseLeadingSlashes (str) {
  for (var i = 0; i < str.length; i++) {
    if (str[i] !== '/') {
      break
    }
  }

  return i > 1
    ? '/' + str.substr(i)
    : str
}

/**
 * Determine if path parts contain a dotfile.
 *
 * @api private
 */

function containsDotFile (parts) {
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part.length > 1 && part[0] === '.') {
      return true
    }
  }

  return false
}

/**
 * Create a Content-Range header.
 *
 * @param {string} type
 * @param {number} size
 * @param {array} [range]
 */

function contentRange (type, size, range) {
  return type + ' ' + (range ? range.start + '-' + range.end : '*') + '/' + size
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */

function createHtmlDocument (title, body) {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n'
}

/**
 * Get the header names on a respnse.
 *
 * @param {object} res
 * @returns {array[string]}
 * @private
 */

function getHeaderNames (res) {
  return typeof res.getHeaderNames !== 'function'
    ? Object.keys(res._headers || {})
    : res.getHeaderNames()
}

/**
 * Determine if emitter has listeners of a given type.
 *
 * The way to do this check is done three different ways in Node.js >= 0.8
 * so this consolidates them into a minimal set using instance methods.
 *
 * @param {EventEmitter} emitter
 * @param {string} type
 * @returns {boolean}
 * @private
 */

function hasListeners (emitter, type) {
  var count = typeof emitter.listenerCount !== 'function'
    ? emitter.listeners(type).length
    : emitter.listenerCount(type);

  return count > 0
}

/**
 * Determine if the response headers have been sent.
 *
 * @param {object} res
 * @returns {boolean}
 * @private
 */

function headersSent (res) {
  return typeof res.headersSent !== 'boolean'
    ? Boolean(res._header)
    : res.headersSent
}

/**
 * Normalize the index option into an array.
 *
 * @param {boolean|string|array} val
 * @param {string} name
 * @private
 */

function normalizeList (val, name) {
  var list = [].concat(val || []);

  for (var i = 0; i < list.length; i++) {
    if (typeof list[i] !== 'string') {
      throw new TypeError(name + ' must be array of strings or false')
    }
  }

  return list
}

/**
 * Parse an HTTP Date into a number.
 *
 * @param {string} date
 * @private
 */

function parseHttpDate (date) {
  var timestamp = date && Date.parse(date);

  return typeof timestamp === 'number'
    ? timestamp
    : NaN
}

/**
 * Parse a HTTP token list.
 *
 * @param {string} str
 * @private
 */

function parseTokenList (str) {
  var end = 0;
  var list = [];
  var start = 0;

  // gather tokens
  for (var i = 0, len = str.length; i < len; i++) {
    switch (str.charCodeAt(i)) {
      case 0x20: /*   */
        if (start === end) {
          start = end = i + 1;
        }
        break
      case 0x2c: /* , */
        list.push(str.substring(start, end));
        start = end = i + 1;
        break
      default:
        end = i + 1;
        break
    }
  }

  // final token
  list.push(str.substring(start, end));

  return list
}

/**
 * Set an object of headers on a response.
 *
 * @param {object} res
 * @param {object} headers
 * @private
 */

function setHeaders (res, headers) {
  var keys = Object.keys(headers);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    res.setHeader(key, headers[key]);
  }
}

/*!
 * serve-static
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */


/**
 * Module exports.
 * @public
 */

/**
 * @param {string} root
 * @param {object} [options]
 * @return {function}
 * @public
 */

function serveStatic(root, options = {}) {
  if (!root) {
    throw new TypeError('root path required');
  }

  if (typeof root !== 'string') {
    throw new TypeError('root path must be a string');
  }

  // copy options object
  const opts = Object.assign(Object.create(options), options);

  // fall-though
  const fallthrough = opts.fallthrough !== false;

  // default redirect
  const redirect = opts.redirect !== false;

  // headers listener
  const setHeaders = opts.setHeaders;

  if (setHeaders && typeof setHeaders !== 'function') {
    throw new TypeError('option setHeaders must be function')
  }

  // setup options for send
  opts.maxage = opts.maxage || opts.maxAge || 0;
  opts.root = path.resolve(root);

  // construct directory listener
  const onDirectory = redirect
    ? createRedirectDirectoryListener()
    : createNotFoundDirectoryListener();

  return function serveStatic(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (fallthrough) {
        return next();
      }

      // method not allowed
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    let forwardError = !fallthrough;
    const originalUrl = parseUrl.original(req);
    let path$$1 = parseUrl(req).pathname;

    // make sure redirect occurs at mount
    if (path$$1 === '/' && originalUrl.pathname.substr(-1) !== '/') {
      path$$1 = '';
    }

    // create send stream
    const stream = send(req, path$$1, opts);

    // add directory handler
    stream.on('directory', onDirectory);

    // add headers listener
    if (setHeaders) {
      stream.on('headers', setHeaders);
    }

    // add file listener for fallthrough
    if (fallthrough) {
      stream.on('file', function onFile() {
        // once file is determined, always forward error
        forwardError = true;
      });
    }

    // forward errors
    stream.on('error', function error(err) {
      if (forwardError || !(err.statusCode < 500)) {
        next(err);
        return;
      }

      next();
    });

    // pipe
    stream.pipe(res);
  }
}

/**
 * Collapse all leading slashes into a single slash
 * @private
 */
function collapseLeadingSlashes$1(str) {
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) !== 0x2f /* / */) {
      break;
    }
  }

  return i > 1
    ? '/' + str.substr(i)
    : str;
}

/**
* Create a minimal HTML document.
*
* @param {string} title
* @param {string} body
* @private
*/

function createHtmlDocument$1(title, body) {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n';
}

/**
 * Create a directory listener that just 404s.
 * @private
 */

function createNotFoundDirectoryListener() {
  return function notFound() {
    this.error(404);
  }
}

/**
 * Create a directory listener that performs a redirect.
 * @private
 */

function createRedirectDirectoryListener() {
  return function redirect(res) {
    if (this.hasTrailingSlash()) {
      this.error(404);
      return;
    }

    // get original URL
    const originalUrl = parseUrl.original(this.req);

    // append trailing slash
    originalUrl.path = null;
    originalUrl.pathname = collapseLeadingSlashes$1(originalUrl.pathname + '/');

    // reformat the URL
    const loc = encodeUrl(url.format(originalUrl));
    const doc = createHtmlDocument$1('Redirecting', 'Redirecting to <a href="' + escapeHtml(loc) + '">' +
      escapeHtml(loc) + '</a>');

    // send redirect response
    res.statusCode = 301;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Length', Buffer.byteLength(doc));
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Location', loc);
    res.end(doc);
  }
}

/**
 * Generates a middleware function to serve static files. It is build on top of the express.static middleware.
 * It extends the express.static middleware with the capability to serve (previously) gziped files. For this
 * it asumes, the gziped files are next to the original files.
 * @param {string} rootFolder: folder to staticly serve files from
 * @param {{enableBrotli:boolean, customCompressions:[{encodingName:string,fileExtension:string}], indexFromEmptyFile:boolean}} options: options to change module behaviour  
 * @returns express middleware function
 */
function expressStaticGzip(rootFolder,options = {indexFromEmptyFile:true}) {

    //create a express.static middleware to handle serving files 
    const defaultStatic = serveStatic(rootFolder, options);


    return function middleware(req, res, next) {

      (async ()=>{

        changeUrlFromEmptyToIndexHtml(req);

        //get browser's' supported encodings
        const acceptEncoding = req.header("accept-encoding");

        //test if any compression is available 
        try {
          await fs.promises.stat(rootFolder + req.path + '.gz');
          convertToCompressedRequest(req,res);
        } catch (e) {
        }

        //allways call the default static file provider
        defaultStatic(req, res, next);

      })();

    };

    /**
     * Changes the url and adds required headers to serve a compressed file.
     * @param {Object} req
     * @param {Object} res
     */
    function convertToCompressedRequest(req, res) {
        const type = mime.lookup(req.path);
        const charset = mime.charsets.lookup(type);
        let search = req.url.split('?').splice(1).join('?');

        if (search !== "") {
            search = "?" + search;
        }

        req.url = req.path + '.gz' + search;
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
    }

    /**
     * In case it's enabled in the options and the requested url does not request a specific file, "index.html" will be appended.
     * @param {Object} req
     */
    function changeUrlFromEmptyToIndexHtml(req) {
        if (options.indexFromEmptyFile && req.url.endsWith("/")) {
            req.url += "index.html";
        }
    }
}

function resolveHome(filepath) {
    if (filepath[0] === '~') {
        return path__default.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

const  api_key = fs.readFileSync(resolveHome('~/www/node/keys/nodeweb1/api_key.json')).api_key;

function getPosts(params, func, errFunc)
{
    var api_path = '/v2/blog/';

    if (!params.base_hostname || typeof(params.base_hostname) != 'string' || params.base_hostname =='')
    {
        api_path += 'sfpgmr.tumblr.com';
    } else
    {
        api_path += params.base_hostname;
    }

    api_path += '/posts';

    if (typeof (params.type) == 'string')
    {
        //       if(params.type == 'text' || )
        api_path += '/' + patams.type;

    }

    api_path += '?api_key=' + api_key;

    if (params.id)
    {
        api_path += '&id=' & encodeURIComponent(params.id);
    }

    if (params.tag)
    {
        api_path += '&tag=' & encodeURIComponent(params.tag);
    }
    var limit = parseInt(params.limit);
    if (!isNaN(limit))
    {
        if (limit > 20) limit = 20;
        api_path += '&limit=' + limit;
    }

    var offset = parseInt(params.offset);
    if (!isNaN(offset))
    {
        api_path += '&offset=' + offset;
    }

    if (typeof (params.reblog_info) == 'boolean')
    {
        api_path += '&reblog_info' + params.reblog_info;
    }

    if (typeof (params.notes_info) == 'boolean')
    {
        api_path += '&notes_info' + params.notes_info;
    }

    if (typeof (params.format) == 'string')
    {
        if (params.format == 'html' || params.format == 'text')
        {
            api_path += '&format=' + params.format;
        }
    }


    http.get({
        host: 'api.tumblr.com',
        path: api_path
    },
     function (clres)
     {

         var content = "";

         clres.on('data', function (chunk)
         {
             content += chunk; // 部分データを積み上げる
         }).on('end', function ()
         {
//             console.log(content);
             func(content);
         });
     }).on('error', function (e)
     {
//         console.log(e);
         errFunc(e);
     });
}
function getInfo (base_hostsname, func, errFunc)
{
  var api_path = 'http://api.tumblr.com/v2/blog/';
  if (!params || !params.base_hostname)
  {
    api_path += 'sfpgmr.tumblr.com/';
  } else
  {
    api_path += params.base_hostname + '/';
  }
  http.get({
    host: 'api.tumblr.com',
    path: api_path + '?api_key=' + api_key
  },
    function (clres)
    {

      var content = '';

      clres.on('data', function (chunk)
      {
        content += chunk; // 部分データを積み上げる
      }).on('end', function ()
      {
        //             console.log(content);
        func(content);
      });
    }).on('error', function (e)
    {
      //         console.log(e);
      errFunc(e);
    });
}

const router = express.Router();
//import api_key from '../../keys/nodeweb1/api_key';

router.get('/getTumblrPosts',function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  //    console.log(req.query);
  // req.query.base_hostname = 'shi3z.tumblr.com';
  getPosts(req.query, function (data)
  {
    res.send(data);
  }, function (e) { });
});

router.get('/getTumblrInfo',function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  getInfo(req.query, function (data)
  {
    res.send(data);
  }, function (e) { });

});



/* exports.getTumblrAPIKey = function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  res.send(JSON.stringify({'key':api_key.get()}));
};
*/

/* GET home page. */

router.get('/', function(req, res, next) {
  res.render('tumblr', {  title: 'Tumblr Posts Beta' });
});

router.get('/index.html', function(req, res, next) {
  res.render('tumblr', {  title: 'Tumblr Posts Beta' });
});

const router$1 = express.Router();

const exec = util.promisify(child_process.exec);
const homeDir = resolveHome('~/www/blog/');
const repoDir = resolveHome('~/www/blog');
const opt = { cwd: resolveHome('~/www/blog'), maxBuffer: 1000 * 1024};


// コンテンツを更新する処理
const q = queue(
async function (payload) {
  try {
    //process.setuid(process.env['GIT_UID']);
    let res = await exec(`/usr/bin/git -C ${repoDir} fetch --depth 1`, opt);
    console.log(res.stdout,res.stderr);
    res = await exec(`/usr/bin/git -C ${repoDir} reset --hard origin/master`, opt);
    console.log(res.stdout,res.stderr);
    // 変更のあったファイルをgzip圧縮する
    let commits = payload.commits;
    console.log('****commits****',commits.length);
    if (commits.length > 0) {

      for (const commit of commits) {
        let files = [];
        (commit.added && commit.added.length > 0) && (files.push(...commit.added));
        (commit.modified && commit.modified.length > 0) && (files.push(...commit.modified));
        console.log(commit,files);
        // 追加更新ファイル
        for (const path$$1 of files) {
          await compressGzip(homeDir + path$$1);
        }        // 削除ファイル
        if (commit.removed && commit.removed.length > 0) {
          for (const path$$1 of commit.removed) {
            await fs.promises.unlink(homeDir + path$$1 + '.gz');
          }        }
      }
    }  } catch (e) {
    console.log(e.stack);
  }
  //process.setuid(process.env['WWW_UID']);
});

q.drain = ()=>{
  console.log('update content done');
};

function handler(req, res) {

  function hasError(msg) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: msg }));
  }

  if (!req.isXHub) {
    return hasError('No X-Hub Signature.');
  }

  /*if (!req.isXHubValid()) {
     return hasError('X-Hub-Signature is not valid.');
  }*/

  
  const payload = req.body,
    sig = req.headers['x-hub-signature']
    , event = req.headers['x-github-event']
    , id = req.headers['x-github-delivery'];

  console.log('** sig **:', sig, event, id);
  if (event == 'push' && payload.repository.name === 'blog') {
    console.log('プッシュイベントを受信:%s to %s',
      payload.repository.name,
      payload.ref);

    q.push(payload);

    // githubに応答を返す
    res.header({ 'content-type': 'application/json' });
    res.json({ ok: true });
    //await res.end();
    console.log('webhook process is end.');
  }
}

// 
function compressGzip(path$$1) {
  // gzipファイルを作成する
  return new Promise((resolve, reject) => {
    let out = fs.createWriteStream(path$$1 + '.gz');
    out.on('finish', resolve.bind(null));

    fs.createReadStream(path$$1)
      .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
      .pipe(out);
    out = void (0);
  });
}

// router.post('/index.html', bodyParser.json({limit:'50mb'}),(req, res,next) => {
//   try {
//     handler(req, res);
//   } catch(e) {
//     console.log(e);
//     next();
//   }
// });

//router.post('/', bodyParser.json({limit:'50mb'}),(req, res,next) => {
router$1.post('/',(req, res,next) => {
  try {
    handler(req, res);
  } catch(e) {
    console.log(e);
    next();
  }
});

//import bodyParser from 'body-parser';
//import http2 from 'http2';
//import expressHTTP2Workaround from 'express-http2-workaround';
const app = express();
app.use(xhub({ limit:'10mb',algorithm: 'sha1', secret: fs.readFileSync(resolveHome('~/www/node/keys/webhook/secret'),'utf-8').trim() }));
app.use(express.json({limit:'10mb'}));
//app.use(bodyParser.json({limit:'50mb'}));
//app.use(expressHTTP2Workaround({express:express,http2:http2 }));
const staticOpts = {
  extensions:['html','htm'],
  indexFromEmptyFile:true
};
//app.use(bodyParser.json());
// view engine setup
app.set('views', ['./views']);
app.set('view engine', 'ejs');
app.enable('strict routing');

app.use(logger('combined'));



//app.use(bodyParser.json({limit:'50mb',type: 'application/*+json'}));
//app.use(bodyParser.urlencoded({ extended: true,limit:'50mb',parameterLimit:10000 }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  //req.url = encodeURIComponent(req.url);
  if (req.hostname == 'blog.sfpgmr.net') {
    res.redirect(301,'https://www.sfpgmr.net/blog' + req.url);
  } else {
    next();
  }
});
app.use('/metrop/',expressStaticGzip(resolveHome('../metrop/html/'),staticOpts));
app.use('/images/',expressStaticGzip(resolveHome('~/www/images/'),staticOpts));
app.use('/blog/',expressStaticGzip(resolveHome('~/www/blog/contents/'),staticOpts));
app.use('/content/',expressStaticGzip(resolveHome('~/www/images/content'),staticOpts));

app.use('/javascripts/',expressStaticGzip(resolveHome('~/www/node/webserver/public/javascripts/'),staticOpts));
app.use('/stylesheets/',expressStaticGzip(resolveHome('~/www/node/webserver/public/stylesheets/'),staticOpts));


//app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use('/tumblr/',router);
//app.use('/tumblr',tumblerRouter);
//app.use(bodyParser.json({limit:'100mb',parameterLimit:50000}));
//app.use(bodyParser.urlencoded({ extended: true,limit:'100mb',parameterLimit:50000 }));
app.use('/webhook',router$1);
//app.use('/webhook/',bodyParser.json({limit:'50mb',type: 'application/*+json'}),webhookRouter);

app.use('/',expressStaticGzip(resolveHome('~/www/html/contents/')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('./error',{message:'error',error:err});
});

class ScoreEntry {
  constructor(name, score){
    this.name = name;
    this.score = score;
  }
}

class ScoreServer {
  constructor(server,process){
    this.io = socket_io(server);
//    this.io.set('log level',1);
    this.io.path('/socket.io');

    this.server = server;
    this.process = process;
    this.highScores = [];
    this.connectionCount = 0;
    this.init();
  }

  async init(){
    await this.readFile();
    this.io.of('/test').on('connection',(socket)=>{
      if (this.connectionCount >= 50) {
        socket.emit('errorConnectionMax',0);
        socket.disconnect();
        return;
      }
      this.connectionCount++;
      console.log(this.connectionCount);

      socket.emit('sendHighScores', this.highScores);
      
      socket.on('getHighScores',  ()=> {
        socket.emit('sendHighScores', this.highScores);
      });

      socket.on('sendScore', (score)=> {
        if (!score.score || !score.name || isNaN(score.score)) {
          return;
        }
    
        if (this.highScores[0].score < score.score) {
          socket.broadcast.emit('sendHighScore', score);
          console.log('broadcast high score',score,this.highScores);
        }
        let i = 0;
        for (let end = this.highScores.length; i < end; ++i) {
          if (score.score > this.highScores[i].score) {
            for (var j = end - 1 ,je = i; j > je; --j) {
              this.highScores[j] = this.highScores[j - 1];
            }
            this.highScores[i] = score;
            socket.emit('sendRank', {rank:i,highScores:this.highScores});
            break;
          }
        }
    
        if (i >= this.highScores.length) {
          socket.emit('sendRank', {rank:-1,highScores:this.highScores});
        }
        this.highScores.length = 10;
      }
      );

      socket.on('disconnect', function () {
        this.connectionCount--;
        console.log(this.connectionCount);
      });

    });

    this.process.on('exit', ()=> {
      console.log('exit');
      this.writeFile();
    });
    
    this.process.on('SIGINT', ()=>{
      console.log('SIGINT');
      this.process.exit(0);
    });

    
    this.process.on('SIGTERM', ()=> {
      console.log('SIGTERM');
      this.process.exit(0);
    });
    
    this.process.on('SIGHUP', ()=> {
      console.log('SIGHUPT');
      this.process.exit(0);
    });

    
  }

  async readFile() {
    try{
      this.highScores = JSON.parse(await fs.promises.readFile(resolveHome('~/www/node/webserver/score.json'), 'utf-8'));
    } catch (e) {
      console.log(e);
      this.highScores = [];
      for (var i = 0; i < 10; ++i) {
        this.highScores.push(new ScoreEntry('',0));
      }
    }
  }
  
  writeFile() {
    console.log('writeFile');
    fs.writeFileSync(resolveHome('~/www/node/webserver/score.json'), JSON.stringify(this.highScores), 'utf-8');
  }  
}



// var highScores = [];
// readFile();

// var connectionCount = 0;
//server.listen(/*process.env.PORT || */ 8081);

//app.get('/', function (req, res) {
//  res.sendfile(__dirname + '/index.html');
//});

/*
var test = io.of('/test').on('connection', function (socket) {
  if (connectionCount >= 50) {
    socket.emit('errorConnectionMax',0);
    socket.disconnect();
    return;
  }
  connectionCount++;
  console.log(connectionCount);
  socket.emit('sendHighScores', highScores);
  socket.on('getHighScores', function () {
    socket.emit('sendHighScores', highScores);
    console.log(data);
  });
  socket.on('sendScore', function (score) {
    if (!score.score || !score.name || isNaN(score.score)) {
      return;
    }

    if (highScores[0].score < score.score) {
      socket.broadcast.emit('sendHighScore', score);
      console.log('broadcast high score');
    }
    var i = 0;
    for (var end = highScores.length; i < end; ++i) {
      if (score.score > highScores[i].score) {
        for (var j = end - 1 ,je = i; j > je; --j) {
          highScores[j] = highScores[j - 1];
        }
        highScores[i] = score;
        socket.emit('sendRank', {rank:i,highScores:highScores});
        break;
      }
    }

    if (i >= highScores.length) {
      socket.emit('sendRank', {rank:-1,highScores:highScores});
    }

    highScores.length = 10;
  }
  );
  socket.on('disconnect', function () {
    connectionCount--;
    console.log(connectionCount);
  });
});

process.on('exit', function () {
  writeFile();
});

process.on('SIGINT', function () {
  process.exit(0);
});

process.on('SIGTERM', function () {
  process.exit(0);
});

process.on('SIGHUP', function () {
  process.exit(0);
});
*/

/**
 * Module dependencies.
 */

const keys = JSON.parse(fs.readFileSync(resolveHome('~/www/node/keys/webserver/keys.json')));


/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '443');
app.set('port', port);
const httpPort = normalizePort(process.env.HTTP_PORT || '80');

/**
 * Create HTTP server.
 */

const options = {
  key:fs.readFileSync(resolveHome(keys.key)),
  cert:fs.readFileSync(resolveHome(keys.cert))
};

keys.passphrase && (options.passphrase = keys.passphrase);

const server = http2.createServer(options,app);
const scoreSever = new ScoreServer(server,process);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() 
{
  console.log(process.env['WWW_UID']);
  process.setuid && process.setuid(process.env['WWW_UID']);
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
}

// Redirect from http port 80 to https
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(httpPort);
