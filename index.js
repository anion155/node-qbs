'use strict';
var fs = require('fs');
var path = require('path');
var debug = require('debug')('node-qbs');

function requireNativeModule(name, force_conf) {
  // Search relative to the file that included this one
  var base = path.dirname(module.parent.filename);

  // Suffixes to search for (in each mode)
  // Both are used, debug just changes which is tried first
  name = name.replace(/\.node$/, '');
  var search = {
    release: path.join('addon-build', 'release', 'install-root', name + '.node'),
    debug: path.join('addon-build', 'debug', 'install-root', name + '.node'),
    default: path.join('addon-build', 'default', 'install-root', name + '.node')
  };
  if (typeof force_conf != 'undefined') {
    search = { };
    search[force_conf] = path.join('addon-build', force_conf, 'install-root', name + '.node');
  }

  var root = base;
  var location;
  var same = 0;
  var found = false;

  // Walk upward to the root
  while (same < 2 || found) {
    debug('Search module for configuration:', conf);
    for (var conf in search) {
      try {
        location = path.join(root, search[conf]);
        debug('  at', location);
        found = fs.statSync(location);
      } catch(e) { }
      if (found) break;
    }
    if (found) break;
    root = path.dirname(root);
    if (root == path.dirname(root)) same++;
  }

  if (!found) throw new Error('Unable to find native module');
  return require(location);
}

module.exports = requireNativeModule;
