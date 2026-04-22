(function () {
  "use strict";

  if (window.__esaInjected) return;
  window.__esaInjected = true;

  var highlightedSpans = [];
  var highlightWrapper = null;
  var overlayEl = null;
  var outsideClickHandler = null;

  // Word lookup elements
  var wordIconEl = null;
  var wordPopupEl = null;
  var wordPopupCloseHandler = null;

  var DEFAULT_COLORS = {
    subject: "#bfdbfe",
    verb: "#fecaca",
    object: "#bbf7d0",
    attributive: "#a78bfa",
    adverbial: "#fb923c",
    weak: "#d1d5db",
  };

  var DEFAULT_ENDPOINT =
    (globalThis.ESA_CONFIG && globalThis.ESA_CONFIG.defaultApiEndpoint) ||
    "http://127.0.0.1:8082";

  var ATTRIBUTIVE_ROLES = ["adjective", "relative_clause", "compound"];
  var ADVERBIAL_ROLES = ["adverb", "prepositional_phrase", "adverb_clause"];

  function getColorForComponent(comp, colors, mode) {
    var c = colors || DEFAULT_COLORS;
    var role = (comp.role || "").toLowerCase().replace(/\s+/g, "_");
    var category = (comp.category || "").toLowerCase();

    if (mode === "speed" && category === "modifier") {
      return { type: "faded", color: c.weak };
    }
    if (role === "subject") return { type: "fill", color: c.subject };
    if (role === "verb") return { type: "fill", color: c.verb };
    if (role === "object") return { type: "fill", color: c.object };
    if (ATTRIBUTIVE_ROLES.indexOf(role) !== -1) return { type: "outline", color: c.attributive };
    if (ADVERBIAL_ROLES.indexOf(role) !== -1) return { type: "outline", color: c.adverbial };
    return { type: "faded", color: c.weak };
  }

  function applyStyle(span, styleInfo) {
    if (styleInfo.type === "fill") {
      span.style.backgroundColor = styleInfo.color;
    } else if (styleInfo.type === "outline") {
      span.style.border = "1.5px solid " + styleInfo.color;
      span.style.borderRadius = "3px";
    } else if (styleInfo.type === "faded") {
      span.style.backgroundColor = styleInfo.color;
      span.style.opacity = "0.45";
    }
  }

  function buildLegend(colors, mode) {
    var c = colors || DEFAULT_COLORS;
    if (mode === "speed") {
      return [
        { label: "Subject", color: c.subject, type: "fill" },
        { label: "Verb", color: c.verb, type: "fill" },
        { label: "Object", color: c.object, type: "fill" },
        { label: "Other (dimmed)", color: c.weak, type: "faded" },
      ];
    }
    return [
      { label: "Subject", color: c.subject, type: "fill" },
      { label: "Verb", color: c.verb, type: "fill" },
      { label: "Object", color: c.object, type: "fill" },
      { label: "Attributive / Clause", color: c.attributive, type: "outline" },
      { label: "Adverbial", color: c.adverbial, type: "outline" },
      { label: "Weak Modifier", color: c.weak, type: "faded" },
    ];
  }

  function normalizeWhitespace(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function sentenceCase(text) {
    var clean = normalizeWhitespace(text);
    if (!clean) return "";
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function stripTrailingPunctuation(text) {
    return normalizeWhitespace(text).replace(/[.,;:!?]+$/, "");
  }

  function buildPrimaryCoreSummary(analysis) {
    var bits = [];
    if (analysis.core && analysis.core.subject && analysis.core.subject.text) {
      bits.push({ label: "Subject", text: analysis.core.subject.text, tone: "subject" });
    }
    if (analysis.core && analysis.core.verb && analysis.core.verb.text) {
      bits.push({ label: "Verb", text: analysis.core.verb.text, tone: "verb" });
    }
    if (analysis.core && analysis.core.object && analysis.core.object.text) {
      bits.push({ label: "Object", text: analysis.core.object.text, tone: "object" });
    }
    return bits;
  }

  function getModifierLabel(role) {
    if (role === "relative_clause") return "Secondary Clause";
    if (role === "adverb_clause") return "Condition / Time Clause";
    if (role === "prepositional_phrase") return "Support Detail";
    if (role === "infinitive_phrase") return "Purpose Phrase";
    if (role === "participle_phrase") return "Descriptive Phrase";
    return "Secondary Structure";
  }

  function splitMeaningUnits(text) {
    var clean = stripTrailingPunctuation(text);
    if (!clean) return [];

    var parts = clean
      .split(/,\s+|\s+\bthat\b\s+|\s+\bwho\b\s+|\s+\bwhich\b\s+|\s+\bwhen\b\s+|\s+\bwhile\b\s+|\s+\bbecause\b\s+|\s+\babout\b\s+/i)
      .map(function (part) { return normalizeWhitespace(part); })
      .filter(Boolean);

    if (parts.length > 1) {
      return parts.slice(0, 4);
    }

    var tokens = clean.split(/\s+/);
    var units = [];
    var chunkSize = tokens.length > 10 ? 4 : 3;
    for (var i = 0; i < tokens.length; i += chunkSize) {
      units.push(tokens.slice(i, i + chunkSize).join(" "));
    }
    return units.slice(0, 4);
  }

  function buildSecondaryRewrite(component) {
    var text = stripTrailingPunctuation(component.text);
    if (!text) return "";

    var role = component.role || "";
    if (role === "relative_clause") {
      var rel = text.match(/^(who|that|which)\s+(.+)$/i);
      if (rel) {
        return sentenceCase(rel[2]) + ".";
      }
    }

    if (role === "adverb_clause") {
      var adv = text.match(/^(although|because|when|while|if|since|after|before)\s+(.+)$/i);
      if (adv) {
        return sentenceCase(adv[2]) + ".";
      }
    }

    if (role === "prepositional_phrase") {
      return "This adds detail: " + text + ".";
    }

    return sentenceCase(text) + ".";
  }

  function buildSecondaryStructures(analysis) {
    if (!analysis || !analysis.components || !analysis.components.length) return [];

    var eligibleRoles = {
      relative_clause: true,
      adverb_clause: true,
      prepositional_phrase: true,
      infinitive_phrase: true,
      participle_phrase: true,
    };

    return analysis.components
      .filter(function (component) {
        return component.category === "modifier" &&
          eligibleRoles[component.role] &&
          normalizeWhitespace(component.text).split(/\s+/).length >= 3;
      })
      .slice(0, 3)
      .map(function (component) {
        return {
          label: getModifierLabel(component.role),
          text: normalizeWhitespace(component.text),
          modifies: component.modifies || "sentence",
          rewrite: buildSecondaryRewrite(component),
          meaningUnits: splitMeaningUnits(component.text),
        };
      });
  }

  function isExtensionValid() {
    try { return !!chrome.runtime.id; } catch (e) { return false; }
  }

  function getEndpoint(cb) {
    if (!isExtensionValid()) { cb(DEFAULT_ENDPOINT); return; }
    chrome.storage.local.get("apiEndpoint", function (data) {
      cb(data.apiEndpoint || DEFAULT_ENDPOINT);
    });
  }

  // ============================
  // Floating Word Icon on Select
  // ============================

  document.addEventListener("mouseup", function (e) {
    // Don't show icon if clicking on our own UI
    if (wordIconEl && wordIconEl.contains(e.target)) return;
    if (overlayEl && overlayEl.contains(e.target)) return;
    if (wordPopupEl && wordPopupEl.contains(e.target)) return;

    // Use mouse position for icon placement (works for all selections)
    var mouseX = e.pageX;
    var mouseY = e.pageY;

    // Small delay to let selection settle
    setTimeout(function () {
      removeWordIcon();

      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : "";

      if (!text) return;

      var isWord = text.split(/\s+/).length <= 3;

      var icon = document.createElement("div");
      icon.className = "esa-word-icon";
      if (isWord) {
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2v3"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>';
        icon.title = "Look up word";
      } else {
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>';
        icon.title = "Analyze sentence";
      }

      // Position near the mouse cursor (end of selection)
      icon.style.top = (mouseY - 36) + "px";
      icon.style.left = (mouseX + 8) + "px";

      var savedText = text;
      icon.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        removeWordIcon();
        // Get fresh selection rect for overlay positioning
        var sel2 = window.getSelection();
        var rect = null;
        if (sel2 && sel2.rangeCount > 0) {
          rect = sel2.getRangeAt(0).getBoundingClientRect();
        }
        if (isWord) {
          lookupWord(savedText, rect);
        } else {
          analyzeFromIcon(savedText, rect);
        }
      });

      document.body.appendChild(icon);
      wordIconEl = icon;
    }, 50);
  });

  // Hide word popup when clicking elsewhere
  document.addEventListener("mousedown", function (e) {
    if (wordIconEl && !wordIconEl.contains(e.target)) {
      removeWordIcon();
    }
    if (wordPopupEl && !wordPopupEl.contains(e.target)) {
      removeWordPopup();
    }
  });

  // ============================
  // Analyze from floating icon
  // ============================

  function analyzeFromIcon(text, rect) {
    getEndpoint(function (endpoint) {
      if (!isExtensionValid()) return;
      chrome.storage.local.get(["esaMode", "esaColors", "esaProviders", "esaActiveProvider"], function (data) {
        var mode = data.esaMode || "speed";
        var colors = data.esaColors || DEFAULT_COLORS;
        var providers = data.esaProviders || [];
        var activeId = data.esaActiveProvider || "nlp";

        var reqBody = { sentence: text };

        // Find active provider
        for (var i = 0; i < providers.length; i++) {
          if (providers[i].id === activeId && providers[i].type === "llm") {
            reqBody.provider = {
              type: "llm",
              api_key: providers[i].apiKey,
              base_url: providers[i].baseUrl || undefined,
              model: providers[i].model || undefined,
            };
            break;
          }
        }

        fetch(endpoint + "/api/v1/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        })
          .then(function (res) { return res.json(); })
          .then(function (analysis) {
            if (analysis.error) return;
            cleanup();
            // Re-select and highlight
            var sel = window.getSelection();
            var range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            if (range && canHighlightInPlace(range) && analysis.components) {
              try {
                highlightInPlace(range, analysis.components, mode, colors);
              } catch (err) {
                cleanupHighlights();
              }
            }
            showOverlay(analysis, range, mode, colors);
          })
          .catch(function () {});
      });
    });
  }

  function removeWordIcon() {
    if (wordIconEl && wordIconEl.parentNode) {
      wordIconEl.parentNode.removeChild(wordIconEl);
    }
    wordIconEl = null;
  }

  // ============================
  // Word Lookup + Popup
  // ============================

  function lookupWord(word, rect) {
    removeWordIcon();
    removeWordPopup();

    // Show loading popup
    var popup = createWordPopup(rect);
    popup.body.innerHTML = '<div class="esa-word-loading">Looking up...</div>';
    document.body.appendChild(popup.el);
    wordPopupEl = popup.el;

    getEndpoint(function (endpoint) {
      fetch(endpoint + "/api/v1/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          renderWordResult(popup, data);
          saveToVocabulary(data);
        })
        .catch(function (err) {
          popup.body.innerHTML = '<div class="esa-word-error">Lookup failed</div>';
        });
    });
  }

  function createWordPopup(rect) {
    var el = document.createElement("div");
    el.className = "esa-word-popup";

    var top = rect.bottom + window.scrollY + 6;
    var left = rect.left + window.scrollX;

    // Keep in viewport
    if (left + 320 > window.innerWidth + window.scrollX) {
      left = window.innerWidth + window.scrollX - 330;
    }

    el.style.top = top + "px";
    el.style.left = left + "px";

    // Header
    var header = document.createElement("div");
    header.className = "esa-word-popup-header";

    var closeBtn = document.createElement("button");
    closeBtn.className = "esa-overlay-close";
    closeBtn.textContent = "\u00d7";
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeWordPopup();
    });
    header.appendChild(closeBtn);
    el.appendChild(header);

    // Body
    var body = document.createElement("div");
    body.className = "esa-word-popup-body";
    el.appendChild(body);

    makeDraggable(el, header);

    return { el: el, body: body };
  }

  function renderWordResult(popup, data) {
    var body = popup.body;
    body.innerHTML = "";

    // Word title
    var title = document.createElement("div");
    title.className = "esa-word-title";
    title.textContent = data.word || "";
    body.appendChild(title);

    // Phonetic
    if (data.phonetic) {
      var phonetic = document.createElement("div");
      phonetic.className = "esa-word-phonetic";
      phonetic.textContent = data.phonetic;

      // Audio button
      if (data.audio) {
        var audioBtn = document.createElement("button");
        audioBtn.className = "esa-word-audio-btn";
        audioBtn.textContent = "\uD83D\uDD0A";
        audioBtn.title = "Play pronunciation";
        audioBtn.addEventListener("click", function () {
          var audio = new Audio(data.audio);
          audio.play();
        });
        phonetic.appendChild(audioBtn);
      }
      body.appendChild(phonetic);
    }

    // Definitions
    if (data.definitions && data.definitions.length > 0) {
      var defList = document.createElement("div");
      defList.className = "esa-word-defs";

      var limit = Math.min(data.definitions.length, 4);
      for (var i = 0; i < limit; i++) {
        var def = data.definitions[i];
        var defEl = document.createElement("div");
        defEl.className = "esa-word-def";

        var pos = document.createElement("span");
        pos.className = "esa-word-pos";
        pos.textContent = def.part_of_speech;
        defEl.appendChild(pos);

        var meaning = document.createElement("span");
        meaning.className = "esa-word-meaning";
        meaning.textContent = def.meaning;
        defEl.appendChild(meaning);

        defList.appendChild(defEl);
      }
      body.appendChild(defList);
    } else {
      var noResult = document.createElement("div");
      noResult.className = "esa-word-no-result";
      noResult.textContent = "No definitions found.";
      body.appendChild(noResult);
    }

    // "Saved to vocabulary" badge
    var saved = document.createElement("div");
    saved.className = "esa-word-saved";
    saved.textContent = "Added to vocabulary";
    body.appendChild(saved);
  }

  function removeWordPopup() {
    if (wordPopupEl && wordPopupEl.parentNode) {
      wordPopupEl.parentNode.removeChild(wordPopupEl);
    }
    wordPopupEl = null;
  }

  // ============================
  // Vocabulary Storage
  // ============================

  function saveToVocabulary(wordData) {
    if (!wordData || !wordData.word || !isExtensionValid()) return;
    chrome.storage.local.get("esaVocabulary", function (result) {
      var vocab = result.esaVocabulary || [];

      // Don't add duplicates
      for (var i = 0; i < vocab.length; i++) {
        if (vocab[i].word === wordData.word) {
          // Update lookup count
          vocab[i].count = (vocab[i].count || 1) + 1;
          vocab[i].lastLookup = Date.now();
          chrome.storage.local.set({ esaVocabulary: vocab });
          return;
        }
      }

      vocab.unshift({
        word: wordData.word,
        phonetic: wordData.phonetic || "",
        definitions: (wordData.definitions || []).slice(0, 3),
        count: 1,
        addedAt: Date.now(),
        lastLookup: Date.now(),
      });

      // Keep max 500 words
      if (vocab.length > 500) vocab = vocab.slice(0, 500);

      chrome.storage.local.set({ esaVocabulary: vocab });
    });
  }

  // ============================
  // Message Listener
  // ============================

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (msg.action === "getSelection") {
      sendResponse({ text: window.getSelection().toString() });
      return;
    }

    if (msg.action === "highlight") {
      cleanup();
      var colors = msg.colors || DEFAULT_COLORS;
      handleHighlight(msg.analysis, msg.mode || "speed", colors);
      sendResponse({ ok: true });
      return;
    }

    if (msg.action === "cleanup") {
      cleanup();
      sendResponse({ ok: true });
      return;
    }
  });

  // ============================
  // Sentence Analysis Highlight
  // ============================

  function handleHighlight(analysis, mode, colors) {
    if (!analysis) return;

    var sel = window.getSelection();
    var range = null;

    if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0);

      if (canHighlightInPlace(range) && analysis.components && analysis.components.length > 0) {
        try {
          highlightInPlace(range, analysis.components, mode, colors);
        } catch (err) {
          console.warn("ESA: in-place highlight failed.", err);
          cleanupHighlights();
        }
      }
    }

    showOverlay(analysis, range, mode, colors);
  }

  function canHighlightInPlace(range) {
    if (range.startContainer === range.endContainer) return true;
    return false;
  }

  function highlightInPlace(range, components, mode, colors) {
    var fullText = range.toString();
    if (!fullText) return;

    var sorted = components.slice().sort(function (a, b) { return a.start - b.start; });

    var wrapper = document.createElement("span");
    wrapper.className = "esa-wrapper";

    var cursor = 0;

    for (var i = 0; i < sorted.length; i++) {
      var comp = sorted[i];
      var start = comp.start;
      var end = comp.end;

      if (start >= fullText.length || end <= 0) continue;
      var clampStart = Math.max(0, start);
      var clampEnd = Math.min(fullText.length, end);

      if (clampStart > cursor) {
        wrapper.appendChild(document.createTextNode(fullText.slice(cursor, clampStart)));
      }

      var span = document.createElement("span");
      span.className = "esa-highlight";
      span.setAttribute("data-role", comp.role || "");
      span.setAttribute("title", (comp.role || "") + (comp.category ? " (" + comp.category + ")" : ""));
      span.textContent = fullText.slice(clampStart, clampEnd);

      var styleInfo = getColorForComponent(comp, colors, mode);
      applyStyle(span, styleInfo);

      wrapper.appendChild(span);
      highlightedSpans.push(span);

      cursor = clampEnd;
    }

    if (cursor < fullText.length) {
      wrapper.appendChild(document.createTextNode(fullText.slice(cursor)));
    }

    range.deleteContents();
    range.insertNode(wrapper);
    highlightWrapper = wrapper;
    window.getSelection().removeAllRanges();
  }

  // ============================
  // Sentence Analysis Overlay
  // ============================

  function showOverlay(analysis, range, mode, colors) {
    removeOverlay();

    var overlay = document.createElement("div");
    overlay.className = "esa-overlay";

    var top = 100;
    var left = 100;

    if (range) {
      var rect = range.getBoundingClientRect();
      top = rect.bottom + 8;
      left = rect.left;
    }

    var maxLeft = window.innerWidth - 440;
    var maxTop = window.innerHeight - 300;
    if (left > maxLeft) left = Math.max(10, maxLeft);
    if (top > maxTop) top = Math.max(10, maxTop);

    overlay.style.top = top + "px";
    overlay.style.left = left + "px";

    var header = document.createElement("div");
    header.className = "esa-overlay-header";

    var modeLabel = document.createElement("span");
    modeLabel.className = "esa-mode-label";
    var modeName = mode === "speed" ? "Speed Reading" : "Learning";
    modeLabel.innerHTML = '<span class="esa-mode-name">' + modeName + '</span> Mode';
    header.appendChild(modeLabel);

    var closeBtn = document.createElement("button");
    closeBtn.className = "esa-overlay-close";
    closeBtn.textContent = "\u00d7";
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeOverlay();
    });
    header.appendChild(closeBtn);
    overlay.appendChild(header);

    makeDraggable(overlay, header);

    var body = document.createElement("div");
    body.className = "esa-overlay-body";

    var primaryCore = buildPrimaryCoreSummary(analysis);
    if (primaryCore.length > 0) {
      var primarySection = document.createElement("section");
      primarySection.className = "esa-breakdown-section";

      var primaryTitle = document.createElement("h4");
      primaryTitle.textContent = "Main Sentence";
      primarySection.appendChild(primaryTitle);

      var primaryGrid = document.createElement("div");
      primaryGrid.className = "esa-core-grid";
      for (var i = 0; i < primaryCore.length; i++) {
        var item = primaryCore[i];
        var card = document.createElement("div");
        card.className = "esa-core-card esa-core-card-" + item.tone;

        var cardLabel = document.createElement("div");
        cardLabel.className = "esa-core-card-label";
        cardLabel.textContent = item.label;
        card.appendChild(cardLabel);

        var cardText = document.createElement("div");
        cardText.className = "esa-core-card-text";
        cardText.textContent = item.text;
        card.appendChild(cardText);

        primaryGrid.appendChild(card);
      }
      primarySection.appendChild(primaryGrid);
      body.appendChild(primarySection);
    }

    if (analysis.core_sentence) {
      var h = document.createElement("h4");
      h.textContent = "Short-Sentence Rewrite";
      body.appendChild(h);

      var p = document.createElement("div");
      p.className = "esa-core-text";
      p.textContent = analysis.core_sentence;
      body.appendChild(p);
    }

    var secondaryStructures = buildSecondaryStructures(analysis);
    if (secondaryStructures.length > 0) {
      var secondarySection = document.createElement("section");
      secondarySection.className = "esa-breakdown-section";

      var secondaryTitle = document.createElement("h4");
      secondaryTitle.textContent = "Secondary Structure";
      secondarySection.appendChild(secondaryTitle);

      for (var j = 0; j < secondaryStructures.length; j++) {
        var block = secondaryStructures[j];
        var blockEl = document.createElement("div");
        blockEl.className = "esa-secondary-block";

        var blockHead = document.createElement("div");
        blockHead.className = "esa-secondary-head";

        var badge = document.createElement("span");
        badge.className = "esa-secondary-badge";
        badge.textContent = block.label;
        blockHead.appendChild(badge);

        var modifies = document.createElement("span");
        modifies.className = "esa-secondary-modifies";
        modifies.textContent = "Supports " + block.modifies;
        blockHead.appendChild(modifies);
        blockEl.appendChild(blockHead);

        var blockText = document.createElement("div");
        blockText.className = "esa-secondary-text";
        blockText.textContent = block.text;
        blockEl.appendChild(blockText);

        if (block.meaningUnits.length > 0) {
          var units = document.createElement("div");
          units.className = "esa-meaning-units";
          for (var k = 0; k < block.meaningUnits.length; k++) {
            var chip = document.createElement("span");
            chip.className = "esa-meaning-chip";
            chip.textContent = block.meaningUnits[k];
            units.appendChild(chip);
          }
          blockEl.appendChild(units);
        }

        if (block.rewrite) {
          var rewrite = document.createElement("div");
          rewrite.className = "esa-secondary-rewrite";
          rewrite.textContent = block.rewrite;
          blockEl.appendChild(rewrite);
        }

        secondarySection.appendChild(blockEl);
      }

      body.appendChild(secondarySection);
    }

    if (analysis.explanation) {
      var h2 = document.createElement("h4");
      h2.textContent = "Explanation";
      body.appendChild(h2);

      var p2 = document.createElement("div");
      p2.className = "esa-explanation-text";
      p2.textContent = analysis.explanation;
      body.appendChild(p2);
    }

    var legend = buildLegend(colors, mode);
    var legendH = document.createElement("h4");
    legendH.textContent = "Legend";
    body.appendChild(legendH);

    var legendDiv = document.createElement("div");
    legendDiv.className = "esa-legend";
    for (var i = 0; i < legend.length; i++) {
      var item = legend[i];
      var el = document.createElement("span");
      el.className = "esa-legend-item";

      var swatch = document.createElement("span");
      swatch.className = "esa-legend-swatch";
      if (item.type === "outline") {
        swatch.classList.add("esa-swatch-outline");
        swatch.style.borderColor = item.color;
      } else if (item.type === "faded") {
        swatch.classList.add("esa-swatch-faded");
        swatch.style.backgroundColor = item.color;
      } else {
        swatch.style.backgroundColor = item.color;
      }
      el.appendChild(swatch);
      el.appendChild(document.createTextNode(item.label));
      legendDiv.appendChild(el);
    }
    body.appendChild(legendDiv);

    overlay.appendChild(body);
    document.body.appendChild(overlay);
    overlayEl = overlay;

    setTimeout(function () {
      outsideClickHandler = function (e) {
        if (overlayEl && !overlayEl.contains(e.target)) {
          removeOverlay();
        }
      };
      document.addEventListener("click", outsideClickHandler, true);
    }, 100);
  }

  // ============================
  // Shared: Drag Logic
  // ============================

  function makeDraggable(overlay, handle) {
    var isDragging = false;
    var offsetX = 0;
    var offsetY = 0;

    handle.addEventListener("mousedown", function (e) {
      if (e.target.tagName === "BUTTON") return;
      isDragging = true;
      offsetX = e.clientX - overlay.getBoundingClientRect().left;
      offsetY = e.clientY - overlay.getBoundingClientRect().top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      overlay.style.left = (e.clientX - offsetX) + "px";
      overlay.style.top = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", function () {
      isDragging = false;
    });
  }

  // ============================
  // Cleanup
  // ============================

  function removeOverlay() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;

    if (outsideClickHandler) {
      document.removeEventListener("click", outsideClickHandler, true);
      outsideClickHandler = null;
    }
  }

  function cleanupHighlights() {
    if (highlightWrapper && highlightWrapper.parentNode) {
      var parent = highlightWrapper.parentNode;
      var textNode = document.createTextNode(highlightWrapper.textContent);
      parent.replaceChild(textNode, highlightWrapper);
      parent.normalize();
      highlightWrapper = null;
    }
    highlightedSpans = [];
  }

  function cleanup() {
    cleanupHighlights();
    removeOverlay();
    removeWordIcon();
    removeWordPopup();
  }
})();
