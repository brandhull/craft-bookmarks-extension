// Service worker: the only place that talks to the Craft Connect API.
// Extension service workers with host_permissions bypass CORS, so a direct
// fetch works even if the API sends no CORS headers.

import { DEFAULT_COLLECTION_ID, COLUMN_KEYS, PENDING_KEY } from "./config.js";

async function getConfig() {
  const cfg = await chrome.storage.local.get([
    "craftApiUrl",
    "craftToken",
    "collectionId"
  ]);
  return {
    craftApiUrl: cfg.craftApiUrl || "",
    craftToken: cfg.craftToken || "",
    collectionId: cfg.collectionId || DEFAULT_COLLECTION_ID
  };
}

// Build the request to add one item to the collection.
//
// >>> ENDPOINT TO CONFIRM <<<
// The Craft Connect API base URL + exact collection-items path come from the
// "AI bundle" you download when you enable the API in Craft's Imagine tab.
// This is the best-known shape (mirrors the Craft tooling: an `items` array of
// { title, properties }). If a Save returns a 4xx, the response body below will
// tell us the corrected path/field names — that's a one-line fix here.
function buildItemRequest({ craftApiUrl, craftToken, collectionId }, fields) {
  const base = craftApiUrl.replace(/\/+$/, "");
  const url = `${base}/collections/${encodeURIComponent(collectionId)}/items`;

  const properties = {};
  if (fields.link) properties[COLUMN_KEYS.link] = fields.link;
  if (fields.notes) properties[COLUMN_KEYS.notes] = fields.notes;
  if (fields.category) properties[COLUMN_KEYS.category] = fields.category;

  const headers = { "Content-Type": "application/json" };
  // If your connection uses a Bearer token instead of a token-in-URL, set it
  // in options; otherwise this header is omitted and the token lives in the URL.
  if (craftToken) headers["Authorization"] = `Bearer ${craftToken}`;

  const body = JSON.stringify({
    items: [
      {
        [COLUMN_KEYS.title]: fields.title || fields.link || "Untitled",
        properties
      }
    ]
  });

  return { url, headers, body };
}

async function addBookmark(fields) {
  const cfg = await getConfig();
  if (!cfg.craftApiUrl) {
    throw new Error("No Craft API URL set. Open the extension's Options and paste the API URL from Craft's Imagine tab.");
  }

  const { url, headers, body } = buildItemRequest(cfg, fields);

  let res;
  try {
    res = await fetch(url, { method: "POST", headers, body });
  } catch (e) {
    throw new Error(`Network error reaching Craft: ${e.message}. Check the API URL and that host_permissions covers its domain.`);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Craft API responded ${res.status}. Body: ${text.slice(0, 500)}`);
  }
  return text;
}

// A lightweight connectivity check used by the Options "Test connection" button.
async function testConnection() {
  const cfg = await getConfig();
  if (!cfg.craftApiUrl) throw new Error("No Craft API URL set.");
  const base = cfg.craftApiUrl.replace(/\/+$/, "");
  const headers = {};
  if (cfg.craftToken) headers["Authorization"] = `Bearer ${cfg.craftToken}`;

  // GET /documents is a known read endpoint on the Connect API; a 200 means the
  // URL + auth are valid even before we finalize the write path.
  const res = await fetch(`${base}/documents`, { headers });
  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text.slice(0, 800) };
}

// ---- Right-click "Save to Craft" on selected text ----
const MENU_ID = "save-to-craft-selection";

// Recreate the menu on install/update (removeAll avoids duplicate-id errors).
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Save to Craft",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  // Stash the highlighted text; the popup reads it on open and clears it.
  await chrome.storage.local.set({
    [PENDING_KEY]: { note: (info.selectionText || "").trim(), ts: Date.now() }
  });
  try {
    await chrome.action.openPopup();
  } catch (_) {
    // openPopup can be unavailable in rare window states; the text is already
    // stored, so clicking the toolbar icon will still fill Notes.
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "ADD_BOOKMARK") {
    addBookmark(msg.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // keep the channel open for the async response
  }
  if (msg?.type === "TEST_CONNECTION") {
    testConnection()
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
