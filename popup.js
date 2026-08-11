import { DEFAULT_CATEGORIES, PENDING_KEY } from "./config.js";

const $ = (id) => document.getElementById(id);

async function init() {
  // Prefill from the active tab (activeTab permission grants this on popup open).
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      $("title").value = tab.title || "";
      $("link").value = tab.url || "";
    }
  } catch (_) {
    /* no tab access; leave fields blank */
  }

  // Populate categories from saved config (falls back to the seeded list).
  const { categories } = await chrome.storage.local.get("categories");
  const cats = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
  const select = $("category");
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "— none —";
  select.appendChild(blank);
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  }

  // If opened via the right-click "Save to Craft" menu, drop the captured
  // selection into Notes. TTL guards against a stale capture from a past visit.
  const { pendingNote } = await chrome.storage.local.get(PENDING_KEY);
  if (pendingNote?.note && Date.now() - pendingNote.ts < 5 * 60 * 1000) {
    $("notes").value = pendingNote.note;
  }
  await chrome.storage.local.remove(PENDING_KEY);
}

function setStatus(msg, kind) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status" + (kind ? " " + kind : "");
}

async function save(e) {
  e.preventDefault();
  const btn = $("save");
  const payload = {
    title: $("title").value.trim(),
    link: $("link").value.trim(),
    notes: $("notes").value.trim(),
    category: $("category").value
  };
  if (!payload.link) {
    setStatus("A link is required.", "err");
    return;
  }

  btn.disabled = true;
  setStatus("Saving…");
  try {
    const resp = await chrome.runtime.sendMessage({ type: "ADD_BOOKMARK", payload });
    if (resp?.ok) {
      setStatus("Saved to Craft ✓", "ok");
      setTimeout(() => window.close(), 900);
    } else {
      setStatus(resp?.error || "Unknown error.", "err");
      btn.disabled = false;
    }
  } catch (err) {
    setStatus(err.message, "err");
    btn.disabled = false;
  }
}

$("form").addEventListener("submit", save);
$("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

init();
