// Shared defaults for the Craft Bookmarks extension.
// These seed the options page on first run; everything is editable there
// and persisted in chrome.storage.local.

// Your real collection, discovered from your Craft workspace:
//   Document  "Random Bookmarks"  5C07F8DC-53B1-49D1-BE3D-2D8317AF3F02
//   Collection "Bookmarks"        E6581872-A310-46BD-8851-46938512F920
export const DEFAULT_COLLECTION_ID = "E6581872-A310-46BD-8851-46938512F920";

// storage.local key for text captured via the right-click menu, read by the popup.
export const PENDING_KEY = "pendingNote";

// Column keys in your collection (NOT the display names):
//   title  -> "Title" (row headline, text)
//   link   -> "Link"  (url)
//   notes  -> "Notes" (text)
//   category -> "Category" (single-select)
export const COLUMN_KEYS = {
  title: "title",
  link: "link",
  notes: "notes",
  category: "category"
};

// The single-select options that already exist on your Category column.
export const DEFAULT_CATEGORIES = [
  "AI",
  "Apps",
  "BH Gifts",
  "Business",
  "BYU-Idaho",
  "Carrd",
  "Church",
  "Family",
  "Framer",
  "Tech",
  "Office",
  "Personal",
  "Smart Home",
  "Video",
  "Writing"
];
