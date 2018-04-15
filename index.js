var fs = require('fs');
var path = require('path');
var Logger = require('debug-logger')('nqbs');

function requireNativeModule(name, forceConf) {
  // Search relative to the file that included this one
  const base = path.dirname(module.parent.filename);

  // Suffixes to search for (in each mode)
  // Both are used, debug just changes which is tried first
  name = name.replace(/\.node$/, '');
  let search = {
    release: path.join('addon-build', 'release', 'install-root', name + '.node'),
    debug: path.join('addon-build', 'debug', 'install-root', name + '.node'),
    default: path.join('addon-build', 'default', 'install-root', name + '.node'),
  };
  if (typeof forceConf !== 'undefined') {
    search = { };
    search[forceConf] = path.join('addon-build', forceConf, 'install-root', name + '.node');
  }

  let root = base;
  let location;
  let same = 0;
  let found = false;

  // Walk upward to the root
  while (same < 2 || found) {
    Logger.log('Search module for configuration:', conf);
    for (var conf in search) {
      try {
        location = path.join(root, search[conf])
        Logger.log('  at', location)
        found = fs.statSync(location)
      } catch (e) { }
      if (found) break
    }
    if (found) break
    root = path.dirname(root)
    if (root === path.dirname(root)) same++
  }

  if (!found) throw new Error('Unable to find native module')
  return require(location)
}

module.exports = requireNativeModule;
