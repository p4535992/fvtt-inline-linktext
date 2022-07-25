[![ko-fi](https://img.shields.io/badge/Ko--Fi-farling-success)](https://ko-fi.com/farling)
[![patreon](https://img.shields.io/badge/Patreon-amusingtime-success)](https://patreon.com/amusingtime)
[![paypal](https://img.shields.io/badge/Paypal-farling-success)](https://paypal.me/farling)
![GitHub License](https://img.shields.io/github/license/farling42/fvtt-inline-linktext)
![](https://img.shields.io/badge/Foundry-v9-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/farling42/fvtt-inline-linktext/latest/module.zip)

## Introduction

This module allows @inline<Document>[id]{label} to be used to put one field from the referenced document inline in the current document.

By configuration, you can choose whether to include the entire description text from the linked entity, only the first paragraph from the linked entity, or only the first sentence from the first paragraph of the linked entity.

## Limitation

When @inlineCompendium is used, the first time the document is opened a placeholder will be displayed. Re-opening the document should display the correct text. (This is required because the compendium entry(ies) need to be read from the server before they can be used).

## Configuration

In the module settings, you can define which field is read from each document type.

When first enabled, the default settings for the world's game system will be loaded. The game systems with specific default settings are: cyphersystem, pf1, pf2e, dnd5e

## Support

If you like what it does, then all contributions will be gratefully received at [Kofi](https://ko-fi.com/farling) or [Paypal](https://paypal.me/farling)
or if you're feeling really generous you could set up a regular contribution at [Patreon](https://www.patreon.com/amusingtime) 
