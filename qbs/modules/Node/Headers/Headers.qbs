import qbs
import Node
import "../../../imports/Node/semver-compare.js" as SemVer

Module {
    id: headersModule

    Depends { name: "cpp" }

    property path sourceDirectory: project.sourceDirectory

    property string node
    property string npm

    property path devdir
    property string version

    Node.HeadersProbe {
        id: headersProbe
        sourceDirectory: headersModule.sourceDirectory
        node: headersModule.node
        npm: headersModule.npm
        devdir: headersModule.devdir
        version: headersModule.version
    }
    cpp.cxxLanguageVersion: SemVer.cmp(headersProbe.version, "3.0.0") >= 0 ? "c++11" : original
    cpp.systemIncludePaths: headersProbe.includePaths

    validate: {
        if (!headersProbe.found) {
            throw "Could not find Node headers.";
        }
    }
}
