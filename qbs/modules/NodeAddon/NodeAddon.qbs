import qbs

Module {
    property bool installAddon
    property string node
    property string npm
    property path devdir
    property string version

    Depends { name: "Node"; submodules: ["Addon", "Headers", "Nan"] }
    Node.Addon.installAddon: typeof installAddon !== "undefined" ? installAddon : original
    Node.Headers.node: typeof node !== "undefined" ? node : original
    Node.Nan.node: typeof node !== "undefined" ? node : original
    Node.Headers.npm: typeof npm !== "undefined" ? npm : original
    Node.Headers.devdir: typeof devdir !== "undefined" ? devdir : original
    Node.Headers.version: typeof version !== "undefined" ? version : original

    setupBuildEnvironment: {
      console.warning("Module is deprecated. Will be deleted in the next version. Use 'Node.Addon' module.");
    }
}
