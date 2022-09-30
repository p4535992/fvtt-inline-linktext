// Allows the use of @inlineItem[id]   or other @inlineDocument[id] to put one of the fields from that item/document
// inline in another document.
//
// It isn't possible to get @inlineCompendium[id] to work because it requires ASYNChronous access.

import defaultSettings from './default-settings.mjs';

const MODULE_NAME = 'inline-linktext';

const _EntityMap = {
	"JournalEntry" : "journal",
	"Actor"        : "actors",
	"RollTable"    : "tables",
	"Scene"        : "scenes",
	"Item"         : "items",
};

let FieldOfDocument = {};

const DISPLAY_SENTENCE  = 0;
const DISPLAY_PARAGRAPH = 1;
const DISPLAY_ALL       = 2;
let DisplayAmount = DISPLAY_ALL;

/**
 * 
 * @param {string} docid The id-string as used in @Compendium[...] marker.
 * @returns Promise containing the Document retrieved from the compendium
 */
async function readpack(docid)
{
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
				return await pack.getDocument(packid);
		}
	}
	return undefined;
}

function findSection(html,sectionid) {
	let result="";
	if (html.hasChildNodes()) {
		let children = html.childNodes;
		let foundtag;
		for (const node of children) {
			// If we have a heading, then the parent node will contain all the text.
			if (foundtag) {
				// We've found the first element, so just append all subsequent elements,
				// until we find the same or higher header level.
				if (node.nodeType == Node.ELEMENT_NODE) {
					if (node.tagName.startsWith('H') &&
						node.tagName <= foundtag)
						return result;
					else
						result += node.outerHTML;
				}
			} else if (node.nodeType == Node.ELEMENT_NODE &&
				node.tagName.startsWith('H') &&
				JournalEntryPage.slugifyHeading(node) == sectionid) {
				// We no longer descend through children but instead start collecting HTML of elements
				// at the same level as this node.
				foundtag = node.tagName;
			} else {
				let text = findSection(node, sectionid);
				if (text.length>0) return text;
			}
		}
	}
	return result;
}

/**
 * For any link in the text which points to a document which is not visible to the current player
 * it will be replaced by the non-link text (so the player will be NOT aware that a link exists)
 * @param {string} [content]  unicode string as stored in db
 * @param {Object} [options]  Data for renderJournalSheet and renderActorSheet hooks
 */
async function _myenrichHTMLasync(wrapped, content, options) {
	// Replace all occurrences of @inlineDocument[...]{...]} to @Document[...]{...}<+ text from referenced document>
	// Outer while loop caters for processing of nested @inline statements
	while (content?.includes('@inline'))
	{
		const regex = /@inline([a-zA-Z]+)\[([a-zA-Z0-9.-]+)\]{[^}]+}/;
		const regex10 = /@inline([a-zA-Z]+)\[([a-zA-Z0-9.-]+)#([a-zA-Z0-9.-]+)\]{[^}]+}/;
		let found = content.match(regex);
		let section;
		if (!found) {
			found = content.match(regex10);
			if (!found) break;
			section = found[3];
		}

		const matching = found[0];	// full matching string
		let   doctype  = found[1];	// the type of document that has been inlined
		let   docid    = found[2];	// the ID of the thing that is being inline
		let doc;
		if (doctype === 'UUID') {
			// Foundry V10 contains @UUID[Item.id]
			// Optional #page at end
			doc = await fromUuid(docid);
		}
		else if (doctype == 'Compendium') {
			// V9-style link format
			doc = await readpack(docid);
			if (doc) {
				doctype = doc.type;
				doc = doc.document;
			}
		} else {
			// V9-style link format
			const table = _EntityMap[doctype];
			if (table) doc = game[table]?.get(docid);
		}

		let extratext="";
		if (doc) {
			let doctype = doc.constructor.name;  // Get the type of "doc"

			extratext = getProperty(doc, FieldOfDocument[doctype]);
			if (extratext.length > 0) {
				// Find the correct section
				if (section) {
					// Search extratext for any heading whose converted value matches section
					// 'section' is always lower case with "-" instead of spaces
					// JournalEntryPage.slugifyHeading(heading: string | HTMLHeadingElement): string
					const htmlbase = document.createElement('template');
					htmlbase.innerHTML = extratext;
					extratext = findSection(htmlbase.content, section);
					if (extratext.length == 0) {
						console.warn(`Failed to find section id ${section} within:\n${extratext}`)
					}
				}

				if (!extratext.startsWith('<')) {
					// No HTML formatting, so put it in a single span
					extratext = `<span class="inlineDocument inline${doctype}">` + extratext + '</span>';
				} else if (extratext.startsWith('<p>') && 
						extratext.endsWith('</p>') &&
					 	extratext.lastIndexOf('<p>') === 0) {
					// A single paragraph, so put it in a single span
					extratext = extratext.slice(3, -4);
					if (DisplayAmount == DISPLAY_SENTENCE) {
						let dot = extratext.indexOf('.');
						if (dot > 0) extratext = extratext.slice(0,dot+1);
					}
					extratext = `<span class="inlineDocument inline${doctype}">` + extratext + '</span>';
				} else if (DisplayAmount === DISPLAY_ALL) {
					// More than one paragraph, so put it in a DIV
					extratext = `<div class="inlineDocument inline${doctype}">` + extratext + '</div>';
				} else {
					let p1 = extratext.indexOf('<p>');
					let p2 = extratext.indexOf('</p>');
					// Reduce to only first paragraph - it might not be at the very start of the text
					extratext = extratext.slice(p1+3,p2);
					if (DisplayAmount === DISPLAY_SENTENCE) {
						// Reduce to only first sentence
						let dot = extratext.indexOf('.');
						if (dot > 0) extratext = extratext.slice(0,dot+1);	
					}
					extratext = `<span class="inlineDocument inline${doctype}">` + extratext + '</span>';
				}
			}
		}

		// Put just the base link type into the content string.
		content = content.replace(matching, '@' + matching.slice(7) + extratext);
	}

	// Finally, process the result into pure HTML
	return wrapped(content, options);	
}

// Non-async outer wrapper just in case enrichHTML is called with (async=false)
function _myenrichHTML(wrapped, content, options) {
	if (options.async) 
		return _myenrichHTMLasync(wrapped, content, options);
	else {
		console.warn('inline-linktext can NOT process calls to enrichHTML which are not async');
		return wrapped(content, options);
	}
}

Hooks.once('ready', () => {
	libWrapper.register('inline-linktext', 'TextEditor.enrichHTML', _myenrichHTML, 'WRAPPER');
})


//
// SETTINGS
//

Hooks.once('init', () => {
	console.debug('inline-linktext: performing init');
	const default_settings = defaultSettings();
	Object.keys(default_settings).forEach(k => {
		game.settings.register(MODULE_NAME, k, {
			name: game.i18n.localize(`INLINELINKTEXT.Settings${k}Title`),
			hint: game.i18n.localize(`INLINELINKTEXT.Settings${k}Hint`),
			scope: 'world',
			config: true,
			default: default_settings[k],
			type: String,
			onChange: value => { FieldOfDocument[k] = value }

		});
		FieldOfDocument[k] = game.settings.get(MODULE_NAME, k);
	});

	game.settings.register(MODULE_NAME, 'DisplayAmount', {
		name: game.i18n.localize(`INLINELINKTEXT.DisplayTitle`),
		hint: game.i18n.localize(`INLINELINKTEXT.DisplayHint`),
		scope: 'world',
		config: true,
		type: String,
		choices: {
			[DISPLAY_ALL]       : game.i18n.localize(`INLINELINKTEXT.DISPLAY_ALL`),
			[DISPLAY_PARAGRAPH] : game.i18n.localize(`INLINELINKTEXT.DISPLAY_PARAGRAPH`),
			[DISPLAY_SENTENCE]  : game.i18n.localize(`INLINELINKTEXT.DISPLAY_SENTENCE`),
		},
		default: DISPLAY_ALL,
		onChange : value => { 
			DisplayAmount = +value 
		}
	});
	DisplayAmount = +game.settings.get(MODULE_NAME, 'DisplayAmount');
})