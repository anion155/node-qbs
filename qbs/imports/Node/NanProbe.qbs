import qbs
import qbs.FileInfo
import "probe-process.js" as ProbeProcess

Probe {
    id: nanProbe

    property string node
    property string npm

    property path sourceDirectory
    property pathList includePaths: []

    configure: {
        node = node || "node";
        npm = npm || "npm";

        function nanPath() {
          return ProbeProcess.exec({
            bin: node,
            pwd: sourceDirectory,
            args: ["-e", "require('nan')"],
            err_msg: "Nan module not found"
          }).readStdOut().trim();
        }

        var nan_module;
        try {
          nan_module = nanPath();
        } catch(error) {
          console.log("Installing 'nan' module into '"+sourceDirectory+"'")
          ProbeProcess.exec({
            bin: npm,
            pwd: sourceDirectory,
            args: ["install", "nan"],
            err_msg: "Can not install 'nan' module"
          });
          nan_module = nanPath();
        }

        includePaths = [ FileInfo.joinPaths(sourceDirectory, nan_module) ];
        found = true;
    }
}
