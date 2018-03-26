Node Qbs
==========
[![NPM](https://nodei.co/npm/node-qbs.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/node-qbs/)

A Qbs-based build system for Node.js native modules

## Usage

To use this package, add the module `node-qbs` to your package.json as a development dependency:

    npm install --save-dev node-qbs

Then add `node_modules/node-qbs/qbs/` to your [`qbsSearchPaths`](http://doc.qt.io/qbs/custom-modules.html) project/product property.

Use `NodeAddon` module like so:

    Product {
      Depends { name: 'Node.Addon' }
    }

Or `Node.AddonProduct`:

    import Node

    Node.AddonProduct {
    }

To require your addon use `require('node-qbs')('Addon')`.

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

| Property | Type   | Since | Default          | Description                |
| -------- | ------ | ----- | ---------------- | -------------------------- |
| node     | string | 0.0.1 | "node"           | Path to node executable.   |
| npm      | string | 0.0.4 | "npm"            | Path to npm executable.    |

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
