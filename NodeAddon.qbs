import qbs
import qbs.File
import qbs.FileInfo
import qbs.Enviroment

Module {
    id: naModule
    additionalProductTypes: ["nodeAddon"]

    function home() {
      return Enviroment.getEnv((qbs.hostOS == 'windows') ? 'USERPROFILE' : 'HOME')
    }

    property string devdir: FileInfo.joinPaths(home(), ".node-gyp")
    property string node: "node"
    property string nodeVerion: ""
    property bool nan: true
    // property bool napi: false

    Probe {
      id: nodeVersionProbe
      condition: !naModule.nodeVerion
      configure: {
        var p = new Process();
        p.exec(node, ["--version"]);
        if (p.exitCode() != 0) {
          console.warning("Node executable not found");
          throw "Node executable not found";
        }
        naModule.nodeVerion = p.readStdOut();
      }
    }

    Probe {
      id: nanProbe
      condition: naModule.nan
      property stringList includes: []
      configure: {
        var p = new Process();
        p.exec(node, ["-p", "require('nan')"]);
        if (p.exitCode() != 0) {
          console.warning("Nan doen't found");
          throw "Nan doen't found";
        }
        includes = [ p.readStdOut() ];
        found = true;
      }
    }

    Depends { name: "cpp" }
    cpp.cxxLanguageVersion: "c++11"
    cpp.includePaths: [
        FileInfo.joinPaths(devdir, nodeVerion, "include/node")
    ]
    Properties {
      condition: nan && nanProbe.found
      cpp.includePaths: outer.concat(nanProbe.includes)
    }
    // Properties {
    //   condition: napi
    //   cpp.includePaths: outer.concat(napiProbe.includes)
    // }

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
}
