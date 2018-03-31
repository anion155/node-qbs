import qbs
import qbs.File
import qbs.FileInfo
import qbs.Environment
import qbs.Process

Module {
    id: addonModule
    additionalProductTypes: ["node.addon"]

    property bool installAddon: true

    property string node
    property string npm
    property path devdir
    property string version

    property bool nan: true

    Depends { name: "Node.Headers" }
    Node.Headers.node: node
    Node.Headers.npm: npm
    Node.Headers.devdir: devdir
    Node.Headers.version: version

    Depends { name: "Node.Nan"; condition: nan }
    Properties {
      condition: nan
      Node.Nan.node: node
      Node.Nan.npm: npm
    }

    Rule {
        inputs: "dynamiclibrary"
        Artifact {
            fileTags: ["node.addon"]
            filePath: FileInfo.joinPaths(input.baseDir, product.targetName + ".node")
        }
        prepare: {
            var cmd = new JavaScriptCommand();
            cmd.description = 'Copying node.addon';
            cmd.highlight = 'linker';
            cmd.sourceCode = function() {
                File.copy(input.filePath, output.filePath)
            };
            return [cmd];
        }
    }

    Group {
        condition: addonModule.installAddon
        fileTagsFilter: "node.addon"
        qbs.install: true
    }
}
