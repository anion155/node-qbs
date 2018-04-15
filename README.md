Node Qbs
==========
[![NPM](https://nodei.co/npm/node-qbs.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/node-qbs/)

A Qbs-based build system for Node.js native modules

## Usage

To use this package, add the module `node-qbs` to your package.json as a development dependency:

    npm install --save-dev node-qbs

Then do `./node_modules/.bin/nqbs init` in your package directory.

Use `NodeAddon` module like so:

    Product {
      Depends { name: 'Node.Addon' }
    }

Or `Node.AddonProduct`:

    import Node

    Node.AddonProduct {
    }

Add to your package.json:

    ...
    "scripts": {
        "install": "nqbs rebuild"
    },
    ...

To require your addon use `require('node-qbs')('Addon')`.

## CLI command `nqbs`

Usage: `nqbs <command> [options] -- [qbs-args]`

### Commands:

| Command                | Since | Description                                                                 |
| ---------------------- | ----- | --------------------------------------------------------------------------- |
| help                   | 0.0.1 | Show general or command-specific help.                                      |
| init                   | 0.0.9 | Initialize project for node-qbs.                                            |
| qbs                    | 0.0.1 | Translate to qbs.                                                           |
| build                  | 0.0.1 | Build native addon.                                                         |
| clean                  | 0.0.1 | Remove the files generated during a build.                                  |
| rebuild                | 0.0.1 | Runs clean and build in a row.                                              |
| install [node-version] | 0.0.4 | Translate to node-gyp with `--ensure` option.                               |
|                        |       | Installs node header files for the given version.                           |
| list                   | 0.0.4 | Translate to node-gyp. Lists the currently installed node header versions.  |
| remove <node-version>  | 0.0.4 | Translate to node-gyp. Removes the node header files for the given version. |

### Options:

| Option                     | Type    | Since | Description                               |
| ---------------------------- | ------- | ----- | ----------------------------------------- |
| --help                       | boolean | 0.0.1 | Show help                                 |
| --qbs                        | string  | 0.0.1 | Path to qbs executable.                   |
| --profile                    | string  | 0.0.6 | Qbs profile.                              |
| --npm                        | string  | 0.0.1 | Path to npm executable.                   |
| --debug, -d                  | boolean | 0.0.1 | Debug build variant.                      |
| --jobs, -j <n>               | number  | 0.0.1 | Use <n> concurrent build jobs.            |
|                              |         |       | <n> must be an integer greater than zero. |
|                              |         |       | The default is the number of cores.       |
| --pwd, --directory, -C       | string  | 0.0.1 | Run command in different directory.       |
| --arch                       | string  | 0.0.1 | Set target architecture.                  |
| --node-version, --target, -t | string  | 0.0.1 | Node version to build for.   []           |
| --devdir                     | string  | 0.0.1 | SDK download directory.                   |
| --version                    | boolean | 0.0.1 | Show version number                       |

## `Node` module

It is devided in to submodules:
* `Headers` (for node and v8 headers),
* `Nan` (for Native Abstractions for Node.js headers)
* and `Addon` (for both).

Has Probes: `HeadersProbe` and `NanProbe`.

And `AddonProduct`, which has all you need for node addon.

## `Node.Headers` module

Wraps `Node.HeadersProbe`, and has same properties.

| Property | Type   | Since | Default          | Description                |
| -------- | ------ | ----- | ---------------- | -------------------------- |
| node     | string | 0.0.1 | "node"           | Path to node executable.   |
| npm      | string | 0.0.4 | "npm"            | Path to npm executable.    |
| devdir   | string | 0.0.1 | "~/.node-gyp"    | SDK download directory.    |
| version  | string | 0.0.1 | `node --version` | Node version to build for. |

## `Node.Nan` module

Wraps `Node.NanProbe`, and has same properties.

| Property | Type   | Since | Default | Description              |
| -------- | ------ | ----- | ------- | ------------------------ |
| node     | string | 0.0.1 | "node"  | Path to node executable. |
| npm      | string | 0.0.4 | "npm"   | Path to npm executable.  |

## `Node.Addon` module

Depends on `Headers` and `Nan`. Wraps their properties.

| Property     | Type | Since | Default | Description                          |
| ------------ | ---- | ----- | ------- | ------------------------------------ |
| installAddon | bool | 0.0.2 | true    | Install or not `node.addon` product. |
| nan          | bool | 0.0.1 | true    | Use Nan module                       |

Provide file tags:

| Tag          | Since | Description                         |
| ------------ | ----- | ----------------------------------- |
| "node.addon" | 0.0.1 | This tag is attached to node addons |
