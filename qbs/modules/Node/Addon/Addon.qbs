import qbs
import qbs.File
import qbs.FileInfo
import qbs.Environment
import qbs.Process

Module {
    id: addonModule
    additionalProductTypes: ["node.addon"]

    property bool installAddon: true
        
    Depends { name: "Node"; submodules: ["Headers", "Nan"] }

    Rule {
        inputs: "dynamiclibrary"
        Artifact {
            fileTags: ["node.addon"]
            filePath: FileInfo.joinPaths(input.baseDir, product.targetName + ".node")
        }
        prepare: {
            var cmd = new JavaScriptCommand();
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
