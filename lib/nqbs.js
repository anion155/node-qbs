#!/usr/bin/env node
const debug = require('debug')('node-qbs');
const child = require('child_process');
const yargs = require('yargs');
const which = require('which');
const path = require('path');
const streamString = require('stream-to-string');

const addonBuildRoot = 'addon-build';

// Main usage strings
let argparse = yargs
  .usage('$0 <command> [arguments]');

// Commands
argparse = argparse
  .command('help', 'Show general or command-specific help.')
  .command('qbs [qbs-args..]', 'Translate to qbs.', (argparse) => {
    argparse.positional('qbs-args', {
      describe: 'Args that will be directly passed to qbs.'
    })
  })
//=== Node-Gyp compatibility commands ===
//== Build commands ==
  .command('build', 'Build native addon.')
  .command('clean', 'Remove the files generated during a build.')
  .command('rebuild', 'Runs clean and build in a row.')
//== Prepare commands ==
  .command('install [node-version]', 'Translate to node-gyp ' +
    'with `--ensure` option. Installs node header files for the given version.')
  .command('list', 'Translate to node-gyp. Lists the currently installed ' +
    'node header versions.')
  .command('remove <node-version>', 'Translate to node-gyp. Removes ' +
    'the node header files for the given version.');

// Options
argparse = argparse
  .option('qbs', {
    describe: 'Path to qbs executable.',
    string: true })
  .option('npm', {
    describe: 'Path to npm executable.',
    string: true })

  .option('debug', {
    alias: 'd',
    describe: 'Debug build variant.',
    boolean: true })
  .option('jobs', {
    alias: 'j',
    describe: 'Use <n> concurrent build jobs. <n> must be an integer '
      + 'greater than zero. The default is the number of cores.',
    number: true })
  .option('pwd', {
    alias: ['directory', 'C'],
    describe: 'Run command in different directory.',
    string: true })
  .option('arch', {
    describe: 'Set target architecture.',
    string: true })

  .option('node-version', {
    alias: ['target', 't'],
    describe: 'Node version to build for.',
    default: 'env',
    defaultDescription: 'process.version',
    string: true })
  .option('devdir', {
    describe: 'SDK download directory.',
    string: true });

argparse = argparse
  .version()
  .strict(false)
  .help(false)
  .demandCommand(1, 1)
  .showHelpOnFail(false, 'Run helpargv.nodeTarget command');

function qbsConfiguration(argv) {
  return argv.debug ? 'debug' : 'release';
}

function argsFromOptions(argv) {
  debug(JSON.stringify(argv));
  var args = [];
  if (typeof argv.jobs !== 'undefined') { args = args.concat(['-j', argv.jobs]) }
  if (typeof argv.nodeTarget !== 'undefined') { args = args.concat(['modules.NodeAddon.nodeVersion:'+argv.nodeTarget]) }
  if (typeof argv.arch !== 'undefined') { args = args.concat(['modules.cpp.architecture:'+argv.arch]) }
  if (typeof argv.devdir !== 'undefined') { args = args.concat(['modules.NodeAddon.devdir:'+argv.devdir]) }
  args.push(qbsConfiguration(argv));
  return args;
}

child.spawnPromise = (cmd, args, options) => {
  options = options || {};
  options.spawn = options.spawn || {};
  options.spawn.stdio = options.spawn.stdio || 'inherit';
  options.spawn.cwd = options.spawn.cwd || argv.pwd;
  options.onExit = options.onExit || ((resolve, reject, proc) => { resolve(proc); });
  options.onError = options.onError || ((resolve, reject, err) => { reject(err); });

  const promise = new Promise(function (resolve, reject) {
    debug('Spawn', cmd, 'in', options.spawn.cwd, 'with', args);
    const proc = child.spawn(cmd, args, options.spawn);
    proc.on('exit', (error) => {
      if (error) {
        options.onError(resolve, reject, error);
      } else {
        options.onExit(resolve, reject, proc);
      }
    });
    proc.on('error', (error) => { options.onError(resolve, reject, error); });
  });
  promise.catch((error) => { throw error; });
  return promise;
}

// Finalize command line arguments
const argv = argparse.argv;

function whichIfNot(binary) {
  if (typeof argv[binary] !== 'undefined') {
    return;
  }
  try {
    argv[binary] = which.sync(binary);
  } catch(e) {
    console.error('Binary could not be found "'+binary+'". Please verify your PATH.');
    process.exit(127);
  }
}
whichIfNot('qbs');
whichIfNot('npm');

if (typeof argv.nodeTarget == 'undefined' || argv.nodeTarget == 'env') {
  argv.nodeTarget = process.version;
}
argv.nodeTarget = argv.nodeTarget.match(/^v?([0-9.]+)/)[1];

if (typeof argv.devdir == 'undefined') {
  argv.devdir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
  argv.devdir = path.join(argv.devdir, '.node-gyp');
}

const commands = {
  async help(argv) {
    argparse.showHelp('log');
  },
  async qbs(argv) {
    var args = argv.qbsArgs;
    args = args.concat(argsFromOptions(argv));
    await child.spawnPromise(argv.qbs, args);
  },
  async build(argv) {
    var args = [
      'install',
      '--build-directory', addonBuildRoot
    ];
    args = args.concat(argsFromOptions(argv));
    await child.spawnPromise(argv.qbs, args);
  },
  async clean(argv) {
    var args = [
      'clean',
      '--build-directory', addonBuildRoot,
      qbsConfiguration(argv)
    ];
    await child.spawnPromise(argv.qbs, args);
  },
  async rebuild(argv) {
      await commands.clean(argv)
      await commands.build(argv)
  },
  async install(argv) {
    // TODO: Implement with my bare hands
    var node_gyp = child.spawnSync(argv.npm, ['bin']).stdout;
    node_gyp = path.join(node_gyp.toString().trim(), 'node-gyp');
    await child.spawnPromise(node_gyp, ['install', '--devdir', argv.devdir, argv.nodeTarget]);
  },
  async list(argv) {
    // TODO: Implement with my bare hands
    var node_gyp = child.spawnSync(argv.npm, ['bin']).stdout;
    node_gyp = path.join(node_gyp.toString().trim(), 'node-gyp');
    await child.spawnPromise(node_gyp, ['list', '--devdir', argv.devdir]);
  },
  async remove(argv) {
    // TODO: Implement with my bare hands
    var node_gyp = child.spawnSync(argv.npm, ['bin']).stdout;
    node_gyp = path.join(node_gyp.toString().trim(), 'node-gyp');
    await child.spawnPromise(node_gyp, ['remove', '--devdir', argv.devdir, argv.nodeTarget]);
  }
};

// Parse the first plain-argument as the command to execute
const cmd  = argv._[0].toLowerCase();
debug('Command', cmd);

// commandFunction
const func = commands[cmd];
((func) ? func(argv) : Promise.reject(
  new Error('Invalid command \'' + cmd + '\'')
)).then(function () {
  process.exit(0);
}).catch(function (err) {
  // if (err instanceof Warning) console.warn(err.message);
  console.error(err.message);
  process.exit(err.code || 2);
});
