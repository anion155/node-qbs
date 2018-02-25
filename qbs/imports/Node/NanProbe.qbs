import qbs
import qbs.FileInfo
import "probe-process.js" as ProbeProcess

Probe {
    id: nanProbe

    property string node

    property path sourceDirectory
    property pathList includePaths: []

    configure: {
        var node = node || "node";

        var nan_module = ProbeProcess.exec({
          bin: node,
          pwd: sourceDirectory,
          args: ["-e", "require('nan')"],
          err_msg: "Nan module not found"
        }).readStdOut().trim();
        includePaths = [ FileInfo.joinPaths(sourceDirectory, nan_module) ];
        found = true;
    }
}
