import qbs

Project {
    qbsSearchPaths: [ "node_modules/node-qbs/qbs/" ]
    references: [ "HelloAddon/HelloAddon.qbs" ]
}
