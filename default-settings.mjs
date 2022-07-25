
// Arrays should be accessed using index as a separate field,
// e.g.   data.pages[0].content should be put into the table as data.pages.0.content

//
// Settings for Foundry V9
//
const fvtt_9_settings = {
    "cyphersystem": {
        "Actor"        : "data.data.basic.description",
        "Item"         : "data.data.description",
        "JournalEntry" : "data.content",
        "RollTable"    : "description",
        "Scene"        : "name",
    }
};

//
// Settings for Foundry V10
//
const fvtt_10_settings = {
    "cyphersystem": {
        "Actor"        : "system.basic.description",
        "Item"         : "system.description",
        "JournalEntry" : "pages.contents.0.text.content",
        "RollTable"    : "description",
        "Scene"        : "name",
    }
};

const settings = {
    "9"  : fvtt_9_settings,
    "10" : fvtt_10_settings, 
}

const default_settings = {
	"Actor"        : "data.data.description",
	"Item"         : "data.data.description",
	"JournalEntry" : "data.content",
	"RollTable"    : "description",
	"Scene"        : "name",
}

export default function defaultSettings() {
    return settings[game.version.split('.')[0]]?.[game.system.id] || default_settings;
}