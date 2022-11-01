# CHANGELOG

## 0.7.1

- Ensure that relative `@UUID` links work in Foundry V10

## 0.7.0

- Provide the option to leave the Field settings blank in order to restore the default values for the version of Foundry being used.

## 0.6.0

- Ensure that inline text appears the first time that a compendium document is referenced.
- Optimise code for Foundry V10

## 0.5.2

- Ensure that document types are detected properly.
- In Foundry V10, ensure that if `JournalEntry` is configured to display `pages.contents...`, then the first page in the journal is selected and then handled as for `JournalEntryPage`.

## 0.5.1

Change minimum compatible version to 10

## 0.5

0.5 onwards supports Only Foundry V10.

Inline text will only work when TextEditor.enrichHTML is called with "async:true" (this is the default for core Foundry functionality).

Handle @includeUUID properly, including linking to sections within a journal entry.

When linking to a section within a journal page, with the Sentence/Paragraph/All module setting set to "All" then the entirety of the header and all sub-sections will be inlined (sub-sections are read until a header is found at the same level or higher as the linked section).

Remove the "placeholder" configuration setting, since being async means that entries from compendiums will always be inline properly.

Changed init message from error to debug.

## 0.4

Game-system specific configurations provided: currently cyphersystem, pf1, pf2e, dnd5e

Option to display either ALL the field from the linked entity, or only the first paragraph, or only the first sentence from the first paragraph.

Supports both Foundry V9 and Foundry V10.

## 0.3

Provide default settings based on the game system.

Provide option to take either only the first SENTENCE, the first PARAGRAPH, or ALL of the content from the linked entity.

Add default fields for game systems: cyphersystem, pf1, pf2e, dnd5e

## 0.2

Initial release that allows @inline<Document> instead of just @<Document> to put one field from the referenced object inline in the current text (immediately AFTER the link).

- A referenced object with a single paragraph will be placed inline (as a <span>).
- A referenced object with more than just a single paragraph will be displayed as a separate block (as a <div>).