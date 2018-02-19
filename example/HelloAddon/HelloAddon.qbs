import qbs
import Node

Node.AddonProduct {
    Group {
        name: "NodeAddon"
        files: [
            "**/*.h", "**/*.hpp",
            "**/*.cc", "**/*.cpp",
        ]
    }
}
