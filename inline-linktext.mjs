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
	//"Compendium"   : "packs",   // Getting the contents is ASYNC, so won't work for a synchronous enrichHTML
};

/**
 * 
 * @param {string} docid The id-string as used in @Compendium[...] marker.
 * @returns Promise containing the Document retrieved from the compendium
 */
async function readpack(docid)
{
	// TextEditor.enrichHTML is not async, so we can't access Compendiums - BOO
	const mark = docid.lastIndexOf('.');
	if (mark>0) {
		const packname = docid.slice(0,mark);
		const packid   = docid.slice(mark+1);
		// only getDocument is async
		return await game.packs.get(packname)?.getDocument(packid);
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
		const doctype  = found[1];	// the type of document that has been inlined	
		const docid    = found[2];	// the ID of the thing that is being inline
		const table = _EntityMap[doctype];
		if (table)
		{
			// But readpack is ASYNC because of... Compendiums...
			// and so this function can't wait for it to finish :-(
			let doc = (table === 'packs') ? readpack(docid) : game[table]?.get(docid);
			if (doc) extratext = doc.data?.data?.description;  // for Item from CypherSystem
			if (extratext) {
				if (extratext.startsWith('<p>') && extratext.endsWith('</p>') &&
					extratext.lastIndexOf('<p>') === 0) {0
					extratext = `<span class="inline${doctype}">` + extratext.slice(3, -4) + '</span>';
				} else {
					extratext = `<div class="inline${doctype}">` + extratext + '</div>';
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
	// Only check for link visibility if NOT a gm
	console.warn(`inline-linktext: ready hook`);
	libWrapper.register('inline-linktext', 'TextEditor.enrichHTML', _doEnrich, 'WRAPPER');
})
