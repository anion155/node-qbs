import qbs

Product {
    Depends { name: "NodeAddon" }
    property bool installAddon: true

    Group {
        condition: installAddon
        fileTagsFilter: "nodeaddon"
        qbs.install: true
    }
}
