//
// Allows the use of @inlineItem[id]   or other @inlineDocument[id] to put one of the fields from that item/document
// inline in another document.
//
// It isn't possible to get @inlineCompendium[id] to work because it requires ASYNChronous access.
//
const _EntityMap = {
	"JournalEntry" : "journal",
	"Actor"        : "actors",
	"RollTable"    : "tables",
	"Scene"        : "scenes",
	"Item"         : "items",
	"Compendium"   : "packs",   // Getting the contents is ASYNC, so won't work for a synchronous enrichHTML
};

let FieldOfDocument = {
	"JournalEntry" : "data.content",
	"Actor"        : "data.data.description",
	"RollTable"    : "data.data.description",
	"Scene"        : "data.data.description",
	"Item"         : "data.data.description",
}

const DEFERRED_MSG = '<span class="inlineReload">{Reload to read text from Compendium}</span>';

function getField(document, fieldstring)
{
	let parts = fieldstring.split('.');
	for (let part of parts) {
		document = document[part];
		if (!document) break;
	}
	return document;
}

/**
 * 
 * @param {string} docid The id-string as used in @Compendium[...] marker.
 * @returns Promise containing the Document retrieved from the compendium
 */
function readpack(docid)
{
	// TextEditor.enrichHTML is not async, so we can't access Compendiums - BOO
	const mark = docid.lastIndexOf('.');
	if (mark>0) {
		const packname = docid.slice(0,mark);
		const packid   = docid.slice(mark+1);
		// only getDocument is async
		const pack = game.packs.get(packname);
		if (pack) {
			const cached = pack.get(packid);
			if (cached instanceof foundry.abstract.Document) 
				return {
					"type": pack.metadata.type,
					"document": cached
				};
			else
				return pack.getDocument(packid); // Promise
		}
	}
	return undefined;
}

/**
 * For any link in the text which points to a document which is not visible to the current player
 * it will be replaced by the non-link text (so the player will be NOT aware that a link exists)
 * @param {string} [content]  unicode string as stored in db
 * @param {Object} [options]  Data for renderJournalSheet and renderActorSheet hooks
 */
function _doEnrich(wrapped, content, options) {	
	// Replace all occurrences of @inlineDocument[...]{...]} to @Document[...]{...}<+ text from referenced document>
	// Outer while loop caters for processing of nested @inline statements
	while (content.includes('@inline'))
	{
		const regex = /@inline([a-zA-Z]+)\[([a-zA-Z0-9.-]+)\]{[^}]+}/;
		let found = content.match(regex);
		if (!found) break;

		let extratext="";
		const matching = found[0];	// full matching string
		let   doctype  = found[1];	// the type of document that has been inlined	
		const docid    = found[2];	// the ID of the thing that is being inline
		const table = _EntityMap[doctype];
		if (table)
		{
			// But readpack is ASYNC because of... Compendiums...
			// and so this function can't wait for it to finish :-(
			let doc;
			if (table === 'packs') {
				doc = readpack(docid);
				if (doc && !(doc instanceof Promise)) {
					doctype = doc.type;
					doc = doc.document;
				}
			 } else {
				doc = game[table]?.get(docid);
			 }
			 if (doc instanceof Promise) {
				extratext = DEFERRED_MSG;
			 } else {
				if (doc) extratext = getField(doc, FieldOfDocument[doctype]);
				if (extratext) {
					if (extratext.startsWith('<p>') && extratext.endsWith('</p>') &&
						extratext.lastIndexOf('<p>') === 0) {
						extratext = `<span class="inlineDocument inline${doctype}">` + extratext.slice(3, -4) + '</span>';
					} else {
						extratext = `<div class="inlineDocument inline${doctype}">` + extratext + '</div>';
					}
				}
			}
		}

		// Put just the base link type into the content string.
		content = content.replace(matching, '@' + matching.slice(7) + extratext);
	}

	// Finally, process the result into pure HTML
	return wrapped(content, options);	
}

Hooks.once('ready', () => {
	libWrapper.register('inline-linktext', 'TextEditor.enrichHTML', _doEnrich, 'WRAPPER');
})
