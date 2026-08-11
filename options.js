import { DEFAULT_COLLECTION_ID, DEFAULT_CATEGORIES } from "./config.js";

const $ = (id) => document.getElementById(id);

function setStatus(msg, kind) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status" + (kind ? " " + kind : "");
}

async function load() {
  const cfg = await chrome.storage.local.get([
    "craftApiUrl",
    "craftToken",
    "collectionId",
    "categories"
  ]);
  $("apiUrl").value = cfg.craftApiUrl || "";
  $("token").value = cfg.craftToken || "";
  $("collectionId").value = cfg.collectionId || DEFAULT_COLLECTION_ID;
  const cats = Array.isArray(cfg.categories) && cfg.categories.length ? cfg.categories : DEFAULT_CATEGORIES;
  $("categories").value = cats.join("\n");
}

async function save() {
  const categories = $("categories").value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await chrome.storage.local.set({
    craftApiUrl: $("apiUrl").value.trim(),
    craftToken: $("token").value.trim(),
    collectionId: $("collectionId").value.trim() || DEFAULT_COLLECTION_ID,
    categories
  });
  setStatus("Settings saved ✓", "ok");
}

async function test() {
  setStatus("Testing…");
  $("testOut").hidden = true;
  // Persist first so the worker reads current values.
  await save();
  setStatus("Testing…");
  try {
    const resp = await chrome.runtime.sendMessage({ type: "TEST_CONNECTION" });
    if (resp?.ok) {
      const { status, ok, body } = resp.result;
      setStatus(ok ? `Connected (HTTP ${status}) ✓` : `Reached server but got HTTP ${status}`, ok ? "ok" : "err");
      $("testOut").hidden = false;
      $("testOut").textContent = body;
    } else {
      setStatus(resp?.error || "Test failed.", "err");
    }
  } catch (err) {
    setStatus(err.message, "err");
  }
}

$("save").addEventListener("click", save);
$("test").addEventListener("click", test);
load();
