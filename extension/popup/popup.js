(function () {
  "use strict";

  var analyzeBtn = document.getElementById("analyzeBtn");
  var statusEl = document.getElementById("status");
  var resultArea = document.getElementById("resultArea");
  var coreSentenceEl = document.getElementById("coreSentence");
  var explanationEl = document.getElementById("explanation");
  var clearBtn = document.getElementById("clearBtn");
  var modeSpeedBtn = document.getElementById("modeSpeed");
  var modeLearningBtn = document.getElementById("modeLearning");

  // Color inputs
  var colorSubject = document.getElementById("colorSubject");
  var colorVerb = document.getElementById("colorVerb");
  var colorObject = document.getElementById("colorObject");
  var colorAttributive = document.getElementById("colorAttributive");
  var colorAdverbial = document.getElementById("colorAdverbial");
  var colorWeak = document.getElementById("colorWeak");
  var saveColorsBtn = document.getElementById("saveColorsBtn");
  var resetColorsBtn = document.getElementById("resetColorsBtn");
  var colorsSavedEl = document.getElementById("colorsSaved");

  var DEFAULT_ENDPOINT = "http://127.0.0.1:8082";
  var currentMode = "speed";

  var DEFAULT_COLORS = {
    subject: "#bfdbfe",
    verb: "#fecaca",
    object: "#bbf7d0",
    attributive: "#a78bfa",
    adverbial: "#fb923c",
    weak: "#d1d5db",
  };

  // --- Colors ---

  function loadColors() {
    chrome.storage.local.get("esaColors", function (data) {
      var c = data.esaColors || DEFAULT_COLORS;
      colorSubject.value = c.subject || DEFAULT_COLORS.subject;
      colorVerb.value = c.verb || DEFAULT_COLORS.verb;
      colorObject.value = c.object || DEFAULT_COLORS.object;
      colorAttributive.value = c.attributive || DEFAULT_COLORS.attributive;
      colorAdverbial.value = c.adverbial || DEFAULT_COLORS.adverbial;
      colorWeak.value = c.weak || DEFAULT_COLORS.weak;
    });
  }

  function getCurrentColors() {
    return {
      subject: colorSubject.value,
      verb: colorVerb.value,
      object: colorObject.value,
      attributive: colorAttributive.value,
      adverbial: colorAdverbial.value,
      weak: colorWeak.value,
    };
  }

  loadColors();

  saveColorsBtn.addEventListener("click", function () {
    chrome.storage.local.set({ esaColors: getCurrentColors() }, function () {
      colorsSavedEl.classList.remove("hidden");
      setTimeout(function () { colorsSavedEl.classList.add("hidden"); }, 1500);
    });
  });

  resetColorsBtn.addEventListener("click", function () {
    chrome.storage.local.set({ esaColors: DEFAULT_COLORS }, function () {
      loadColors();
      colorsSavedEl.textContent = "Reset!";
      colorsSavedEl.classList.remove("hidden");
      setTimeout(function () {
        colorsSavedEl.textContent = "Saved!";
        colorsSavedEl.classList.add("hidden");
      }, 1500);
    });
  });

  // --- Mode Switch ---

  function setMode(mode) {
    currentMode = mode;
    chrome.storage.local.set({ esaMode: mode });
    if (mode === "speed") {
      modeSpeedBtn.classList.add("active");
      modeLearningBtn.classList.remove("active");
    } else {
      modeLearningBtn.classList.add("active");
      modeSpeedBtn.classList.remove("active");
    }
  }

  chrome.storage.local.get("esaMode", function (data) {
    setMode(data.esaMode || "speed");
  });

  modeSpeedBtn.addEventListener("click", function () { setMode("speed"); });
  modeLearningBtn.addEventListener("click", function () { setMode("learning"); });

  // --- AI Model Providers ---

  var providerListEl = document.getElementById("providerList");
  var providerSelectEl = document.getElementById("providerSelect");
  var keyInputAreaEl = document.getElementById("keyInputArea");
  var keyInputLabelEl = document.getElementById("keyInputLabel");
  var providerApiKeyInput = document.getElementById("providerApiKey");
  var saveProviderBtn = document.getElementById("saveProviderBtn");
  var cancelProviderBtn = document.getElementById("cancelProviderBtn");

  // Predefined model catalog: name, model ID, base URL
  var MODEL_CATALOG = {
    "gpt-4o-mini":         { name: "GPT-4o Mini",        baseUrl: "" },
    "gpt-4o":              { name: "GPT-4o",             baseUrl: "" },
    "gpt-4.1-mini":        { name: "GPT-4.1 Mini",       baseUrl: "" },
    "gpt-4.1":             { name: "GPT-4.1",            baseUrl: "" },
    "claude-haiku-4-5":    { name: "Claude Haiku 4.5",   baseUrl: "https://api.anthropic.com/v1/" },
    "claude-sonnet-4-5":   { name: "Claude Sonnet 4.5",  baseUrl: "https://api.anthropic.com/v1/" },
    "claude-opus-4":       { name: "Claude Opus 4",      baseUrl: "https://api.anthropic.com/v1/" },
    "deepseek-chat":       { name: "DeepSeek V3",        baseUrl: "https://api.deepseek.com/v1" },
    "deepseek-reasoner":   { name: "DeepSeek R1",        baseUrl: "https://api.deepseek.com/v1" },
  };

  var DEFAULT_PROVIDERS = [
    { id: "nlp", name: "NLP (Local)", type: "nlp", apiKey: "", baseUrl: "", model: "" }
  ];

  var providers = [];
  var activeProviderId = "nlp";
  var pendingModelId = null;

  function loadProviders() {
    chrome.storage.local.get(["esaProviders", "esaActiveProvider"], function (data) {
      providers = data.esaProviders || DEFAULT_PROVIDERS.slice();
      activeProviderId = data.esaActiveProvider || "nlp";
      renderProviders();
    });
  }

  function saveProviders() {
    chrome.storage.local.set({ esaProviders: providers, esaActiveProvider: activeProviderId });
  }

  function getActiveProvider() {
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].id === activeProviderId) return providers[i];
    }
    return providers[0] || DEFAULT_PROVIDERS[0];
  }

  function renderProviders() {
    providerListEl.innerHTML = "";
    for (var i = 0; i < providers.length; i++) {
      (function (idx) {
        var p = providers[idx];
        var item = document.createElement("div");
        item.className = "provider-item" + (p.id === activeProviderId ? " active" : "");

        var radio = document.createElement("div");
        radio.className = "provider-radio";
        item.appendChild(radio);

        var nameEl = document.createElement("span");
        nameEl.className = "provider-name";
        nameEl.textContent = p.name;
        item.appendChild(nameEl);

        var tag = document.createElement("span");
        tag.className = "provider-tag";
        tag.textContent = p.type === "nlp" ? "Local" : (p.model || "LLM");
        item.appendChild(tag);

        // Status indicator for LLM providers
        if (p.type === "llm" && p.status) {
          var statusEl = document.createElement("span");
          statusEl.className = "provider-status provider-status-" + p.status;
          if (p.status === "ok") statusEl.textContent = "\u2713";
          else if (p.status === "error") statusEl.textContent = "\u2717";
          else if (p.status === "checking") statusEl.textContent = "\u2026";
          statusEl.title = p.status === "ok" ? "Connected" : p.status === "error" ? "Click to retry" : "Checking...";
          if (p.status === "error") {
            statusEl.style.cursor = "pointer";
            statusEl.addEventListener("click", function (e) {
              e.stopPropagation();
              checkProviderHealth(p.id);
            });
          }
          item.appendChild(statusEl);
        }

        providerListEl.appendChild(item);

        // Error message row below the provider item
        if (p.type === "llm" && p.status === "error" && p.errorMsg) {
          var errRow = document.createElement("div");
          errRow.className = "provider-error-msg";
          errRow.textContent = p.errorMsg;
          providerListEl.appendChild(errRow);
        }

        // Click to select
        item.addEventListener("click", function (e) {
          if (e.target.closest(".provider-arrow") || e.target.closest(".provider-delete")) return;
          activeProviderId = p.id;
          saveProviders();
          renderProviders();
        });

        // Reorder arrows
        if (providers.length > 1) {
          var arrows = document.createElement("div");
          arrows.className = "provider-arrows";

          var upBtn = document.createElement("button");
          upBtn.className = "provider-arrow";
          upBtn.textContent = "\u25B2";
          upBtn.disabled = idx === 0;
          upBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (idx > 0) {
              var tmp = providers[idx - 1];
              providers[idx - 1] = providers[idx];
              providers[idx] = tmp;
              saveProviders();
              renderProviders();
            }
          });
          arrows.appendChild(upBtn);

          var downBtn = document.createElement("button");
          downBtn.className = "provider-arrow";
          downBtn.textContent = "\u25BC";
          downBtn.disabled = idx === providers.length - 1;
          downBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (idx < providers.length - 1) {
              var tmp = providers[idx + 1];
              providers[idx + 1] = providers[idx];
              providers[idx] = tmp;
              saveProviders();
              renderProviders();
            }
          });
          arrows.appendChild(downBtn);
          item.appendChild(arrows);
        }

        // Delete (not for NLP)
        if (p.type !== "nlp") {
          var delBtn = document.createElement("button");
          delBtn.className = "provider-delete";
          delBtn.textContent = "\u00d7";
          delBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            providers.splice(idx, 1);
            if (activeProviderId === p.id) {
              activeProviderId = providers[0] ? providers[0].id : "nlp";
            }
            saveProviders();
            renderProviders();
          });
          item.appendChild(delBtn);
        }
      })(i);
    }

    // Update dropdown: hide models already added
    var addedModels = {};
    for (var j = 0; j < providers.length; j++) {
      if (providers[j].model) addedModels[providers[j].model] = true;
    }
    var options = providerSelectEl.options;
    for (var k = 1; k < options.length; k++) {
      options[k].disabled = !!addedModels[options[k].value];
      options[k].style.color = addedModels[options[k].value] ? "#d1d5db" : "";
    }
  }

  loadProviders();

  // When user picks a model from dropdown, show key input
  providerSelectEl.addEventListener("change", function () {
    var modelId = providerSelectEl.value;
    if (!modelId) return;
    pendingModelId = modelId;
    var info = MODEL_CATALOG[modelId];
    keyInputLabelEl.textContent = (info ? info.name : modelId) + " API Key";
    providerApiKeyInput.value = "";
    keyInputAreaEl.classList.remove("hidden");
    providerApiKeyInput.focus();
  });

  cancelProviderBtn.addEventListener("click", function () {
    keyInputAreaEl.classList.add("hidden");
    providerSelectEl.selectedIndex = 0;
    pendingModelId = null;
  });

  saveProviderBtn.addEventListener("click", function () {
    var apiKey = providerApiKeyInput.value.trim();
    if (!apiKey) { providerApiKeyInput.focus(); return; }
    if (!pendingModelId) return;

    var info = MODEL_CATALOG[pendingModelId] || { name: pendingModelId, baseUrl: "" };
    var newProvider = {
      id: "llm_" + Date.now(),
      name: info.name,
      type: "llm",
      apiKey: apiKey,
      baseUrl: info.baseUrl,
      model: pendingModelId,
      status: "checking",
    };
    providers.push(newProvider);

    saveProviders();
    renderProviders();
    keyInputAreaEl.classList.add("hidden");
    providerSelectEl.selectedIndex = 0;
    pendingModelId = null;

    // Run health check
    checkProviderHealth(newProvider.id);
  });

  function updateProviderStatus(providerId, status, errorMsg) {
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].id === providerId) {
        providers[i].status = status;
        providers[i].errorMsg = errorMsg || "";
        break;
      }
    }
    saveProviders();
    renderProviders();
  }

  function parseErrorMessage(text) {
    try {
      var data = JSON.parse(text);
      var detail = data.detail || data.error || "";
      if (typeof detail === "string") {
        // "Analysis failed: Error code: 401 - {'error': {'message': 'Incorrect API key...'...}}"
        var msgMatch = detail.match(/'message':\s*'([^']+)'/);
        if (msgMatch) {
          var msg = msgMatch[1];
          if (msg.length > 80) return msg.substring(0, 77) + "...";
          return msg;
        }
        // "Analysis failed: Error code: 429 - {...insufficient_quota...}"
        var codeMatch = detail.match(/Error code:\s*(\d+)/);
        if (codeMatch) {
          var code = codeMatch[1];
          if (code === "401") return "Invalid API key";
          if (code === "429") return "No credits / rate limited";
          if (code === "404") return "Model not found";
          if (code === "403") return "Access denied";
          return "API error " + code;
        }
        // "message": "..." in JSON-style error bodies
        var jsonMsgMatch = detail.match(/"message":\s*"([^"]+)"/);
        if (jsonMsgMatch) return jsonMsgMatch[1].substring(0, 80);
        // Strip "Analysis failed: " prefix
        detail = detail.replace(/^Analysis failed:\s*/i, "");
        if (detail.length <= 80) return detail;
        return detail.substring(0, 77) + "...";
      }
      return "Unknown error";
    } catch (e) {
      if (text && text.length <= 80) return text;
      return "Request failed";
    }
  }

  function checkProviderHealth(providerId) {
    var provider = null;
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].id === providerId) { provider = providers[i]; break; }
    }
    if (!provider) return;

    updateProviderStatus(providerId, "checking", "");

    getEndpoint().then(function (endpoint) {
      return fetch(endpoint + "/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: "The cat sat.",
          provider: {
            type: "llm",
            api_key: provider.apiKey,
            base_url: provider.baseUrl || undefined,
            model: provider.model || undefined,
          },
        }),
      });
    })
    .then(function (res) {
      if (res.ok) {
        updateProviderStatus(providerId, "ok", "");
      } else {
        return res.text().then(function (text) {
          updateProviderStatus(providerId, "error", parseErrorMessage(text));
        });
      }
    })
    .catch(function (err) {
      updateProviderStatus(providerId, "error", "Server unreachable");
    });
  }

  // --- Helpers ---

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = "status " + type;
    statusEl.classList.remove("hidden");
  }

  function hideStatus() {
    statusEl.classList.add("hidden");
  }

  function showResult(analysis) {
    coreSentenceEl.textContent = analysis.core_sentence || "";
    explanationEl.textContent = analysis.explanation || "";
    resultArea.classList.remove("hidden");
  }

  function hideResult() {
    resultArea.classList.add("hidden");
  }

  function getEndpoint() {
    return new Promise(function (resolve) {
      chrome.storage.local.get("apiEndpoint", function (data) {
        resolve(data.apiEndpoint || DEFAULT_ENDPOINT);
      });
    });
  }

  // --- Clear ---

  clearBtn.addEventListener("click", async function () {
    hideStatus();
    hideResult();
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tabs[0].id, { action: "cleanup" });
    } catch (err) {
      // ignore
    }
  });

  // --- Analyze ---

  analyzeBtn.addEventListener("click", async function () {
    hideStatus();
    hideResult();

    var tab;
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
    } catch (err) {
      showStatus("Cannot access the active tab.", "error");
      return;
    }

    var selectedText;
    try {
      var response = await chrome.tabs.sendMessage(tab.id, { action: "getSelection" });
      selectedText = response && response.text;
    } catch (err) {
      showStatus("Cannot communicate with the page. Try reloading it.", "error");
      return;
    }

    if (!selectedText || !selectedText.trim()) {
      showStatus("Please select some text on the page first.", "error");
      return;
    }

    showStatus("Analyzing...", "loading");
    analyzeBtn.disabled = true;

    try {
      var endpoint = await getEndpoint();
      var apiUrl = endpoint + "/api/v1/analyze";

      // Build request with active provider config
      var activeProvider = getActiveProvider();
      var reqBody = { sentence: selectedText.trim() };
      if (activeProvider.type === "llm") {
        reqBody.provider = {
          type: "llm",
          api_key: activeProvider.apiKey,
          base_url: activeProvider.baseUrl || undefined,
          model: activeProvider.model || undefined,
        };
      }

      var res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      if (!res.ok) {
        var errText = await res.text();
        throw new Error("API error " + res.status + ": " + errText);
      }

      var analysis = await res.json();

      // Send result + mode + colors to content script
      chrome.tabs.sendMessage(tab.id, {
        action: "highlight",
        analysis: analysis,
        mode: currentMode,
        colors: getCurrentColors(),
      });

      showStatus("Done!", "success");
      showResult(analysis);
    } catch (err) {
      showStatus(err.message || "Request failed.", "error");
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  // --- Vocabulary ---

  var vocabCountEl = document.getElementById("vocabCount");
  var vocabListEl = document.getElementById("vocabList");
  var clearVocabBtn = document.getElementById("clearVocabBtn");
  var exportVocabBtn = document.getElementById("exportVocabBtn");

  function loadVocabulary() {
    chrome.storage.local.get("esaVocabulary", function (result) {
      var vocab = result.esaVocabulary || [];
      vocabCountEl.textContent = vocab.length;
      vocabListEl.innerHTML = "";

      if (vocab.length === 0) {
        var empty = document.createElement("div");
        empty.className = "vocab-empty";
        empty.textContent = "No words yet. Select a word on any page to look it up.";
        vocabListEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < vocab.length; i++) {
        (function (idx) {
          var entry = vocab[idx];
          var item = document.createElement("div");
          item.className = "vocab-item";

          var wordEl = document.createElement("span");
          wordEl.className = "vocab-word";
          wordEl.textContent = entry.word;
          item.appendChild(wordEl);

          if (entry.phonetic) {
            var phoneticEl = document.createElement("span");
            phoneticEl.className = "vocab-phonetic";
            phoneticEl.textContent = entry.phonetic;
            item.appendChild(phoneticEl);
          }

          if (entry.definitions && entry.definitions.length > 0) {
            var meaningEl = document.createElement("span");
            meaningEl.className = "vocab-meaning";
            meaningEl.textContent = entry.definitions[0].meaning;
            meaningEl.title = entry.definitions[0].meaning;
            item.appendChild(meaningEl);
          }

          if (entry.count > 1) {
            var countEl = document.createElement("span");
            countEl.className = "vocab-count";
            countEl.textContent = "\u00d7" + entry.count;
            item.appendChild(countEl);
          }

          var delBtn = document.createElement("button");
          delBtn.className = "vocab-delete";
          delBtn.textContent = "\u00d7";
          delBtn.title = "Remove";
          delBtn.addEventListener("click", function () {
            vocab.splice(idx, 1);
            chrome.storage.local.set({ esaVocabulary: vocab }, function () {
              loadVocabulary();
            });
          });
          item.appendChild(delBtn);

          vocabListEl.appendChild(item);
        })(i);
      }
    });
  }

  loadVocabulary();

  // Listen for storage changes (word added from content script)
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.esaVocabulary) {
      loadVocabulary();
    }
  });

  clearVocabBtn.addEventListener("click", function () {
    chrome.storage.local.set({ esaVocabulary: [] }, function () {
      loadVocabulary();
    });
  });

  exportVocabBtn.addEventListener("click", function () {
    chrome.storage.local.get("esaVocabulary", function (result) {
      var vocab = result.esaVocabulary || [];
      if (vocab.length === 0) return;

      var csv = "Word,Phonetic,Definition,Lookups,Added\n";
      for (var i = 0; i < vocab.length; i++) {
        var e = vocab[i];
        var def = (e.definitions && e.definitions[0]) ? e.definitions[0].meaning : "";
        var date = e.addedAt ? new Date(e.addedAt).toLocaleDateString() : "";
        csv += '"' + (e.word || "") + '","' + (e.phonetic || "") + '","' + def.replace(/"/g, '""') + '",' + (e.count || 1) + ',"' + date + '"\n';
      }

      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "vocabulary.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  });
})();
