#!/usr/bin/env node
const Logger = require('debug-logger')('nqbs');
const child = require('child_process');
const yargs = require('yargs');
const which = require('which');
const path = require('path');
const fs = require('fs');

const addonBuildRoot = 'addon-build';

// Main usage strings
let argparse = yargs
  .usage('$0 <command> [arguments] -- [qbs-args]');

// Commands
argparse = argparse
  .command('help', 'Show general or command-specific help.')
  .command('init [project-name]', 'Initialize project to use node-qbs.')
  .command('qbs', 'Does not specify command by this script. Command must be specified in [qbs-args].')
// === Node-Gyp compatibility commands ===
// == Build commands ==
  .command('build', 'Build native addon.')
  .command('clean', 'Remove the files generated during a build.')
  .command('rebuild', 'Runs clean and build in a row.')
// == Prepare commands ==
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
  .option('profile', {
    alias: 'p',
    describe: 'Qbs profile.',
    string: true })
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
  .demandCommand(1, 1)
  .showHelpOnFail(false, 'Run helpargv.nodeTarget command');

function qbsConfiguration(argv) {
  return argv.debug ? 'debug' : 'release';
}

function npmPrefix() {
  child.spawnSync(argv.qbs, [ 'prefix' ]).stdout
  let prefix = child.spawnSync(argv.npm, [ 'prefix' ]).stdout;
  prefix = Buffer.isBuffer(prefix) ? prefix.toString() : prefix;
  return prefix.trim();
}

function qbsSearchPath() {
  let nqbsPath = path.join(npmPrefix(), 'node_modules', 'node-qbs', 'qbs');
  return nqbsPath;
}

function argsFromOptions(argv) {
  Logger.log(JSON.stringify(argv));
  var args = [];
  args.push('project.nodeQbsSearchPath:' + qbsSearchPath());
  if (typeof argv.jobs !== 'undefined') { args = args.concat(['-j', argv.jobs]); }
  if (typeof argv.nodeTarget !== 'undefined') { args = args.concat(['modules.Node.Headers.version:' + argv.nodeTarget]); }
  if (typeof argv.arch !== 'undefined') { args = args.concat(['modules.cpp.architecture:' + argv.arch]); }
  if (typeof argv.devdir !== 'undefined') { args = args.concat(['modules.Node.Headers.devdir:' + argv.devdir]); }
  if (typeof argv.profile !== 'undefined') { args = args.concat(['profile:' + argv.profile]); }
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

  const promise = new Promise(function(resolve, reject) {
    Logger.log('Spawn', cmd, 'in', options.spawn.cwd, 'with', args);
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
  return promise;
}

// Finalize command line arguments

process.argv = process.argv.slice(2);
const argv = (() => {
  let qbsArgs = [];
  for (let i in process.argv) {
    let arg = process.argv[i];
    if (arg === '--') {
      qbsArgs = process.argv.splice(i).splice(1);
      Logger.log('Found inner arguments, probably for qbs command:', qbsArgs);
      break;
    }
  }
  const argv = argparse.parse(process.argv);
  argv.qbsArgs = qbsArgs;
  return argv;
})();

function whichIfNot(binary) {
  if (typeof argv[binary] !== 'undefined') {
    return;
  }
  try {
    argv[binary] = which.sync(binary);
  } catch (e) {
    console.error('Binary could not be found \'' + binary + '\'. Please verify your PATH.');
    process.exit(127);
  }
}
whichIfNot('qbs');
whichIfNot('npm');

if (typeof argv.nodeTarget === 'undefined' || argv.nodeTarget === 'env') {
  argv.nodeTarget = process.version;
}
argv.nodeTarget = argv.nodeTarget.match(/^v?([0-9.]+)/)[1];

if (typeof argv.devdir === 'undefined') {
  argv.devdir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
  argv.devdir = path.join(argv.devdir, '.node-gyp');
}

const commands = {
  async qbs(argv) {
    var args = argv.qbsArgs;
    args = args.concat(argsFromOptions(argv));
    await child.spawnPromise(argv.qbs, args);
  },
  async init(argv) {
    let projectDir = npmPrefix();
    let package; try {
      package = require(path.join(projectDir, 'package.json'));
    } catch (e) {
      Logger.log('Can\'t find package.json. Init module with `npm init` first.');
    }
    let projectName = argv.projectName !== undefined ? argv.projectName : package.name;
    let project = fs.createWriteStream(path.join(projectDir, projectName+'.qbs'));
    project.write('import qbs\n\n');
    project.write('Project {\n');
    project.write('    property string nodeQbsSearchPath\n');
    project.write('    qbsSearchPaths: [ nodeQbsSearchPath ]\n');
    project.write('}\n');
    project.end('\n');
  },
  async build(argv) {
    var args = [
      'install',
      '--build-directory', addonBuildRoot
    ];
    args = args.concat(argv.qbsArgs);
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
    try {
      await commands.clean(argv);
    } catch (e) { }
    await commands.build(argv);
  },
  async install(argv) {
    // TODO: Implement with my bare hands
    var nodegyp = child.spawnSync(argv.npm, ['bin']).stdout;
    nodegyp = path.join(nodegyp.toString().trim(), 'node-gyp');
    await child.spawnPromise(nodegyp, ['install', '--devdir', argv.devdir, argv.nodeTarget]);
  },
  async list(argv) {
    // TODO: Implement with my bare hands
    var nodegyp = child.spawnSync(argv.npm, ['bin']).stdout;
    nodegyp = path.join(nodegyp.toString().trim(), 'node-gyp');
    await child.spawnPromise(nodegyp, ['list', '--devdir', argv.devdir]);
  },
  async remove(argv) {
    // TODO: Implement with my bare hands
    var nodegyp = child.spawnSync(argv.npm, ['bin']).stdout;
    nodegyp = path.join(nodegyp.toString().trim(), 'node-gyp');
    await child.spawnPromise(nodegyp, ['remove', '--devdir', argv.devdir, argv.nodeTarget]);
  }
};

// Parse the first plain-argument as the command to execute
const cmd  = argv._[0].toLowerCase();
Logger.log('Command', cmd);

// commandFunction
const func = commands[cmd];
async function start() {
  try {
    await func(argv);
  } catch (err) {
    console.error(err.message);
    process.exit(err.code || 2);
  }
}
start();
