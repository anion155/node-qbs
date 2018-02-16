Node Qbs
==========

A Qbs-based build system for Node.js native modules

## Usage

To use this package, add the module `node-qbs` to your package.json as a development dependency:

    npm install --save-dev node-qbs

Then add `node_modules/node-qbs/qbs/` to your [`qbsSearchPaths`](http://doc.qt.io/qbs/custom-modules.html) project/product property.

Use `NodeAddon` module like so:

    Product {
      Depends { name: 'NodeAddon' }
    }

Or `Node.AddonProduct`:

    import Node

    Node.AddonProduct {
    }

## `NodeAddon` properties

| Property    | Type   | Since | Default          | Description                          |
| ----------- | ------ | ----- | ---------------- | ------------------------------------ |
| devdir      | string | 0.0.1 | "~/.node-gyp"    | SDK download directory.              |
| node        | string | 0.0.1 | "node"           | Path to node executable.             |
| nodeVersion | string | 0.0.1 | `node --version` | Node version to build for.           |
| nan         | bool   | 0.0.1 | true             | Use Native Abstractions for Node.js. |
[//]: # (| napi        | bool   |       | true             | Use ABI Stable Node API (N-API).     |)

## Relevant File Tags

| Tag         | Since | Description                         |
| ----------- | ----- | ----------------------------------- |
| "node.addon" | 0.0.1 | This tag is attached to node addons |
