#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const debug = require('debug')('node-qbs');
const spawn = require('child_process').spawn;
const yargs = require('yargs');
const which = require('which');

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
  .command('build', 'Build native addon. (qbs-build with --no-install)')
  .command('clean', 'Remove the files generated during a build.')
  .command('configure [qbs-search-path]', 'Prepare project.', (argparse) => {
    argparse.positional('qbs-search-path', {
      describe: 'Qbs modules search path.',
      default: 'qbs/'
    })
  })
  .command('rebuild', 'Runs clean and build in a row.')
//== Prepare commands ==
  .command('install <node-version>', 'Translate to node-gyp ' +
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

  .option('node-target', {
    alias: ['target', 't'],
    describe: 'Node version to build for.',
    default: 'env',
    defaultDescription: 'process.version',
    string: true })
  .option('devdir', {
    describe: 'SDK download directory',
    string: true });

argparse = argparse
  .version()
  .strict(false)
  .help(false)
  .demandCommand(1, 1)
  .showHelpOnFail(false, 'Run helpargv.nodeTarget command');

function argsFromOptions(argv) {
  debug(JSON.stringify(argv));
  var args = [];
  if (typeof argv.jobs !== 'undefined') { args = args.concat(['-j', argv.jobs]) }
  if (typeof argv.nodeTarget !== 'undefined') { args = args.concat(['modules.NodeAddon.nodeVerion:'+argv.nodeTarget]) }
  if (typeof argv.arch !== 'undefined') { args = args.concat(['modules.cpp.architecture:'+argv.arch]) }
  if (typeof argv.devdir !== 'undefined') { args = args.concat(['modules.NodeAddon.devdir:'+argv.devdir]) }
  return args;
}

function executeCommand(cmd, args, spawnOptions, handleExit, handleError) {
  handleExit = !!handleExit ? handleExit : (resolve, reject) => { resolve(); };
  handleError = !!handleError ? handleError : (resolve, reject) => { reject(); };
  spawnOptions.cwd = !spawnOptions.cwd ? argv.pwd : spawnOptions.cwd;
  return new Promise(function (resolve, reject) {
      debug('Execute', cmd, 'in', spawnOptions.cwd, args); resolve();
      // const clean = spawn(qbs, args, spawnOptions);
      // clean.on('exit', () => { handleExit(resolve, reject); });
      // clean.on('error', () => { handleError(resolve, reject); });
  });
}

// Finalize command line arguments
const argv = argparse.argv;

if (typeof argv.qbs === 'undefined') {
  try {
    argv.qbs = which.sync('qbs');
  } catch(e) {
    console.error('Qbs binary could not be found. Please verify your PATH.');
    process.exit(127);
  }
}
if (argv.nodeTarget == 'env') {
  argv.nodeTarget = process.version;
}
argv.nodeTarget = argv.nodeTarget.match(/^v?([0-9.]+)/)[1];

const commands = {
  help: function(argv) {
    return new Promise(function (resolve, reject) {
        argparse.showHelp('log');
        resolve();
    });
  },
  qbs: function(argv) {
    var args = argv.qbsArgs;
    args = args.concat(argsFromOptions(argv));
    return executeCommand(argv.qbs, args, {
      stdio: 'inherit'
    }, false, (resolve, reject) => {
      reject(new Error('Couldn\'t run qbs.'));
    });
  },
  build: function(argv) {
    var args = ['build', '--no-install'];
    args = args.concat(argsFromOptions(argv));
    return executeCommand(argv.qbs, args, {
      stdio: 'inherit'
    }, false, (resolve, reject) => {
      reject(new Error('Couldn\'t build qbs addon.'));
    });
  },
  clean: function(argv) {
    var args = ['clean', '-q'];
    return executeCommand(argv.qbs, args, {
      stdio: 'ignore'
    }, false, (resolve, reject) => {
      reject(new Error('Couldn\'t clean addon\'s project.'));
    });
  },
  configure: function(argv) {
    // Copy NodeAddon.qbs to qbs/modules folder
    return new Promise(function (resolve, reject) {
      const source = path.resolve(__dirname, path.join('..', 'NodeAddon.qbs'));
      const output = path.join(path.resolve(argv.qbsSearchPath), 'modules', path.join('NodeAddon.qbs'));
      try {
        fs.accessSync(output, fs.constants.W_OK)
      } catch () {
        fs.mkdirSync(argv.qbsSearchPath);
        fs.mkdirSync(path.join(argv.qbsSearchPath, 'modules'));
      }
      resolve();
      return;

      const rd = fs.createReadStream(source);
      rd.on('error', (rerr) => {
        reject(new Error('Unable to read NodeAddon.qbs'));
      });

      const wr = fs.createWriteStream(output);
      wr.on('error', (rerr) => {
        reject(new Error('Unable to write NodeAddon.qbs'));
      });

      wr.on('close', function (rerr) {
        if (rerr) {
          reject(new Error('Unknown I/O error'));
        }
        resolve();
      });

      rd.pipe(wr);
    });
  },
  rebuild: function(argv) {
  },
  install: function(argv) {
  },
  list: function(argv) {
  },
  remove: function(argv) {
  }
  // rebuild: function (argv, cmake) {
  //   // Per node-gyp, run clean, then build
  //   return commands.clean(argv, cmake)
  //     .then(function () {
  //       return commands.build(argv, cmake);
  //     });
  // },
  // update: function (argv, cmake) {
  //   // return new Promise(function (resolve, reject) {
  //   //   // The CMake script is relative to this utility when installed
  //   //   const source = path.resolve(path.join(__dirname, '..', 'NodeJS.cmake'));
  //   //   const output = path.resolve('NodeJS.cmake');
  //   //   const rd = fs.createReadStream(source);
  //   //   rd.on('error', function (rerr) {
  //   //     const err = new Error('Unable to read NodeJS.cmake');
  //   //     err.code = 9;
  //   //     reject(err);
  //   //   });
  //   //   const wr = fs.createWriteStream(output);
  //   //   wr.on('error', function (rerr) {
  //   //     const err = new Error('Unable to write NodeJS.cmake');
  //   //     err.code = 9;
  //   //     reject(err);
  //   //   });
  //   //   wr.on('close', function (rerr) {
  //   //     if(rerr) {
  //   //       const err = new Error('Unknown I/O error');
  //   //       err.code = 9;
  //   //       reject(err);
  //   //     }
  //   //     resolve();
  //   //   });
  //   //   rd.pipe(wr);
  //   // });
  // },
  // install: function (argv, cmake) {
  //   // Run CMake build to build the project (generator agnostic)
  //   const args = ['install', '--clean-install-root'].concat(argv.run_args);
  //   return new Promise(function (resolve, reject) {
  //     debug('Execute', qbs, args);
  //     const build = spawn(qbs, args, {
  //       stdio: 'inherit'
  //     });
  //     function handleError(code) {
  //       if (code !== 0) {
  //         const err = new Error('Install failed');
  //         err.code = 7;
  //         return reject(err);
  //       }
  //       return resolve();
  //     }
  //     build.on('exit',  handleError);
  //     build.on('error', handleError);
  //   });
  // }
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
