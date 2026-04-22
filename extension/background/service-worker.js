(function () {
  "use strict";

  importScripts("../shared/runtime-config.js");

  const DEFAULT_ENDPOINT =
    (globalThis.ESA_CONFIG && globalThis.ESA_CONFIG.defaultApiEndpoint) ||
    "http://127.0.0.1:8082";
  const MENU_ID = "esa-analyze-sentence";
  const INJECT_FILES = ["shared/runtime-config.js", "content/content.js"];
  const INJECT_CSS = ["content/content.css"];

  // Register context menu on install
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Analyze Sentence",
      contexts: ["selection"],
    });
  });

  // Handle context menu click
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID) return;
    if (!tab || !tab.id) return;

    const selectedText = info.selectionText;
    if (!selectedText || !selectedText.trim()) return;

    try {
      await ensureContentScriptInjected(tab.id);

      const endpoint = await getEndpoint();
      const apiUrl = endpoint + "/api/v1/analyze";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: selectedText.trim() }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("ESA API error:", res.status, errText);
        return;
      }

      const analysis = await res.json();
      const mode = await getMode();
      const colors = await getColors();

      // Send result + mode + colors to content script
      chrome.tabs.sendMessage(tab.id, {
        action: "highlight",
        analysis: analysis,
        mode: mode,
        colors: colors,
      });
    } catch (err) {
      console.error("ESA fetch error:", err);
    }
  });

  function getEndpoint() {
    return new Promise((resolve) => {
      chrome.storage.local.get("apiEndpoint", (data) => {
        resolve(data.apiEndpoint || DEFAULT_ENDPOINT);
      });
    });
  }

  function getMode() {
    return new Promise((resolve) => {
      chrome.storage.local.get("esaMode", (data) => {
        resolve(data.esaMode || "speed");
      });
    });
  }

  function getColors() {
    return new Promise((resolve) => {
      chrome.storage.local.get("esaColors", (data) => {
        resolve(data.esaColors || null);
      });
    });
  }

  async function ensureContentScriptInjected(tabId) {
    const [{ result: injected }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!window.__esaInjected,
    });

    if (injected) return;

    await chrome.scripting.insertCSS({
      target: { tabId },
      files: INJECT_CSS,
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: INJECT_FILES,
    });
  }
})();
