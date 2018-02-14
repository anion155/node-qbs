import qbs
import qbs.File
import qbs.FileInfo

Module {
    id: node
    additionalProductTypes: ["nodeAddon"]

    property string devdir: "~/.node-gyp/"
    property string node: "node"
    property string nodeVerion: ""

    Depends { name: "cpp" }
    cpp.cxxLanguageVersion: "c++11"
    cpp.includePaths: [
        FileInfo.joinPaths(devdir, nodeVerion, "include/node"),
        "node_modules/nan"
    ]

    FileTagger {
        patterns: ["*.node"]
        fileTags: ["nodeAddon"]
    }

    Rule {
        inputs: "dynamiclibrary"
        Artifact {
            fileTags: ["nodeAddon"]
            filePath: FileInfo.joinPaths(input.baseDir, product.targetName + ".node")
        }
        prepare: {
            var cmd = new JavaScriptCommand();
            cmd.silent = true;
            cmd.sourceCode = function() {
                File.copy(input.filePath, output.filePath)
            };
            return [cmd];
        }
    }

    setupBuildEnviroment: {
      if (!nodeVerion) {
        var p = new Process();
        p.exec(node, ["--version"]);
        if (p.exitCode() != 0) {
          console.warning("Node executable not found");
        }
        nodeVerion = p.readStdOut();
      }
    }
}
