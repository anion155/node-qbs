import qbs
import Node

Module {
    id: nanModule

    Depends { name: "cpp" }

    property path sourceDirectory: project.sourceDirectory

    property string node
    property string npm

    Node.NanProbe {
        id: nanProbe
        sourceDirectory: nanModule.sourceDirectory
        node: nanModule.node
        npm: nanModule.npm
    }
    cpp.systemIncludePaths: nanProbe.includePaths

    validate: {
      if (!nanProbe.found) {
        throw "Could not find Nan module.";
      }
    }
}
