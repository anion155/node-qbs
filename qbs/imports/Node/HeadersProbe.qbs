import qbs
import qbs.File
import qbs.FileInfo
import qbs.Environment
import "probe-process.js" as ProbeProcess

Probe {
    id: headersProbe

    property path __home: {
        return Environment.getEnv((qbs.hostOS == "windows") ? "USERPROFILE" : "HOME")
    }
    property path sourceDirectory

    property string node
    property string npm

    property path devdir
    property string version

    property pathList includePaths: [ "" ]

    configure: {
        var version_folder_names = {
          "3.0.0": "iojs-3.0.0"
        };

        node = node || "node";
        npm = npm || "npm";
        devdir = devdir || FileInfo.joinPaths(__home, ".node-gyp");
        if (!version || version == "env") {
          version = ProbeProcess.exec({
            bin: node,
            args: ["--version"],
            err_msg: "Node executable not found"
          }).readStdOut().trim();
        }
        version = version.match(/^v?([0-9.]+)$/)[1];
        var ver_folder_name = version_folder_names[version];
        if (!ver_folder_name) { ver_folder_name = version; }

        if (!File.exists(FileInfo.joinPaths(devdir, ver_folder_name))) {
            var npm_bin = ProbeProcess.exec({
              bin: npm,
              pwd: sourceDirectory,
              args: ["bin"],
              err_msg: "Npm executable not found"
            }).readStdOut().trim();
            ProbeProcess.exec({
              bin: FileInfo.joinPaths(npm_bin, "nqbs"),
              args: ["install", version],
              err_msg: "Could not install node headers."
            });
        }

        includePaths = [ FileInfo.joinPaths(devdir, ver_folder_name, "include/node") ];
        found = true;
    }
}
