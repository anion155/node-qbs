var req = require !== undefined ? require : loadExtension;
var Process = req("qbs.Process");

function exec(opts) {
    var p = new Process();
    if (typeof opts.pwd !== "undefined") { p.setWorkingDirectory(opts.pwd); }
    p.exec(opts.bin, opts.args);
    if (p.exitCode() !== 0) { throw "Error "+p.exitCode()+": "+opts.err_msg; }
    return p;
}
