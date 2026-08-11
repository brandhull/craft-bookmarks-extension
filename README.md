# Craft Bookmarks

A personal Chrome extension (Manifest V3) that saves the page you're on straight
into a [Craft](https://www.craft.do) **Collection** — styled to feel like Craft's
own web clipper.

## Summary

Click the toolbar icon (or right-click selected text) and a compact popup opens
with the page's **Title** and **Link** already filled in. Add a **Category** and
**Notes**, hit **Save Clip**, and a new row lands in your Craft "Bookmarks"
collection via the [Craft Connect API](https://connect.craft.do/api-docs). No
server, no backend — the extension talks to Craft directly.

## Features

- **One-click capture** — toolbar popup prefills Title + Link from the active tab.
- **Right-click to save** — highlight text on any page → right-click → **Save to
  Craft**; the popup opens with that text dropped into Notes.
- **Category picker** — single-select synced to your collection's existing options.
- **Craft-native look** — clipper-style filled fields, the real Craft logo, and
  Craft's brand blue on the save button.
- **Direct to Craft** — writes through the Connect API from the background service
  worker (which bypasses CORS); nothing is stored or proxied elsewhere.

## Collection schema

Rows are written to a Craft Collection with these columns:

| Key        | Column   | Type          |
|------------|----------|---------------|
| `title`    | Title    | text (headline)|
| `link`     | Link     | url           |
| `notes`    | Notes    | text          |
| `category` | Category | single-select |

## Setup

### 1. Enable the Craft API

1. Craft → sidebar → **Imagine** tab (or **Settings → API**).
2. Create an **API connection** whose scope **includes the document that holds
   your Bookmarks collection**.
3. Copy the generated **API URL**.

### 2. Load the extension

1. Go to `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select this folder.

### 3. Configure

1. Open the extension's **Options** (gear icon in the popup).
2. Paste the **Craft API URL** (leave Bearer token blank unless your connection
   uses a separate one).
3. **Save settings** → **Test connection** (a green result means you're good).

> The API URL is a credential and is stored only in `chrome.storage.local` —
> it is never written to these files. Removing/uninstalling the extension clears
> it, so keep it handy; a plain **Reload** preserves it.

## How saving works

The service worker posts to the Connect API:

```
POST {apiUrl}/collections/{collectionId}/items
{ "items": [ { "title": "...", "properties": { "link": "...", "notes": "...", "category": "..." } } ] }
```

If a save ever returns a 4xx, the popup surfaces Craft's response body verbatim so
the exact path/field names can be corrected in `buildItemRequest()` in
[`background.js`](background.js).

## Files

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest (module service worker, context menu, icons) |
| `background.js` | The only code that calls Craft; also the right-click menu |
| `popup.html` / `popup.css` / `popup.js` | The clipper-style save form |
| `options.html` / `options.js` | Settings + connection test |
| `config.js` | Defaults: collection id, column keys, category list |
| `icons/` | Craft logo at 16/32/48/128 |

## Notes

- Built for personal use; the default collection id and categories in `config.js`
  are specific to the author's Craft workspace — change them for your own.
