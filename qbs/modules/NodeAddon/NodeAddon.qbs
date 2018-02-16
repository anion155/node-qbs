import qbs
import qbs.File
import qbs.FileInfo
import qbs.Environment
import qbs.Process

Module {
    id: naModule
    additionalProductTypes: ["node.addon"]

    property string _home: {
        return Environment.getEnv((qbs.hostOS == 'windows') ? 'USERPROFILE' : 'HOME')
    }

    property string devdir: FileInfo.joinPaths(naModule._home, ".node-gyp")
    PropertyOptions {
      name: "devdir"
      description: "SDK download directory."
    }

    property string node: "node"
    PropertyOptions {
      name: "node"
      description: "Path to node executable."
    }

    property string nodeVersion: nodeVersionProbe.found ? nodeVersionProbe.version : "0.0.0"
    PropertyOptions {
      name: "nodeVersion"
      description: "Node version to build for."
    }

    property bool nan: true
    PropertyOptions {
      name: "nan"
      description: "Use Native Abstractions for Node.js module."
    }

    // property bool napi: false
    // PropertyOptions {
    //   name: "nan"
    //   description: "Use Native Abstractions for Node.js module."
    // }

    Probe {
        id: nodeVersionProbe
        property string version: ""
        configure: {
            var p = new Process();
            p.exec(node, ["--version"]);
            if (p.exitCode() != 0) {
                console.error("Node executable not found");
                throw "Node executable not found";
            }
            version = p.readStdOut();
            version = version.replace(/v?([0-9.]+)\n/, '$1')
            found = true;
        }
    }

    Probe {
      id: nanProbe
      condition: naModule.nan
      property string sourceDirectory: project.sourceDirectory
      property stringList includes: []
      configure: {
          var p = new Process();
          p.setWorkingDirectory(sourceDirectory)
          p.exec(node, ["-e", "require('nan')"]);
          if (p.exitCode() != 0) {
              console.error("Nan doen't found");
              throw "Nan doen't found";
          }
          var nan_module = p.readStdOut().trim()
          includes = [ FileInfo.joinPaths(sourceDirectory, nan_module) ];
          found = true;
      }
    }

    Depends { name: "cpp" }
    cpp.cxxLanguageVersion: "c++11"
    cpp.includePaths: [
        FileInfo.joinPaths(devdir, nodeVersion, "include/node")
    ]
    Properties {
      condition: nan && nanProbe.found
      cpp.includePaths: outer.concat(nanProbe.includes)
    }
    // Properties {
    //   condition: napi
    //   cpp.includePaths: outer.concat(napiProbe.includes)
    // }

    Rule {
        inputs: "dynamiclibrary"
        Artifact {
            fileTags: ["node.addon"]
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
