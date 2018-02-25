import qbs
import Node

Module {
    id: nanModule

    Depends { name: "cpp" }

    property path sourceDirectory: project.sourceDirectory

    property string node

    Node.NanProbe {
        id: nanProbe
        sourceDirectory: nanModule.sourceDirectory
        node: nanModule.node
    }
    cpp.includePaths: nanProbe.includePaths

    validate: {
      if (!nanProbe.found) {
        throw "Could not find Nan module.";
      }
    }
}
