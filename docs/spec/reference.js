/* Field reference — renders data/reference.json, which is generated from the JSON Schemas. */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with the landing page: pick a language once
  var STICKY_OFFSET = 140; // header + sticky toolbar: what counts as "the top of the reading area"

  var UI = {
    en: {
      pill: "Draft 0.x",
      draft: "Fields can still change, be renamed or be dropped.",
      follow: "Follow the discussion",
      navSpec: "How it works",
      navAdopt: "Adopt it",
      navReference: "Reference",
      navDevelopers: "Developers",
      navTools: "Tools",
      title: "Field reference",
      lead: "Every field of OTE Spec v0.2. This page is generated from the JSON Schemas, so it cannot drift from what the validator actually enforces.",
      rules: "Rules a validator can't check",
      raw: "Raw JSON Schema",
      footerNote: "Generated from the schemas. Draft specification — fields may change.",
      required: "required",
      optional: "optional",
      examples: "Examples",
      onlyRequired: "Only required",
      onlyRequiredShort: "Req.",
      tocTitle: "On this page",
      tocLegend: "Required in a minimal document",
      searchPlaceholder: "Filter fields…",
      searchLabel: "Filter fields",
      count: "Showing {shown} of {total} fields",
      noMatch: "No field matches that filter.",
      clear: "Clear the filter",
      anchorLabel: "Link to this field",
    },
    es: {
      pill: "Borrador 0.x",
      draft: "Los campos pueden cambiar, renombrarse o desaparecer.",
      follow: "Sigue la discusión",
      navSpec: "Cómo funciona",
      navAdopt: "Adhiérete",
      navReference: "Referencia",
      navDevelopers: "Desarrolladores",
      navTools: "Herramientas",
      title: "Referencia de campos",
      lead: "Todos los campos de OTE Spec v0.2. Esta página se genera a partir de los JSON Schema, así que no puede separarse de lo que el validador exige de verdad.",
      rules: "Reglas que un validador no ve",
      raw: "JSON Schema en crudo",
      footerNote: "Generado a partir de los schemas. Especificación en borrador: los campos pueden cambiar.",
      required: "obligatorio",
      optional: "opcional",
      examples: "Ejemplos",
      onlyRequired: "Solo obligatorios",
      onlyRequiredShort: "Oblig.",
      tocTitle: "En esta página",
      tocLegend: "Obligatorio en un documento mínimo",
      searchPlaceholder: "Filtrar campos…",
      searchLabel: "Filtrar campos",
      count: "Mostrando {shown} de {total} campos",
      noMatch: "Ningún campo coincide con el filtro.",
      clear: "Quitar el filtro",
      anchorLabel: "Enlace a este campo",
    },
  };

  var state = { lang: FALLBACK, model: null, onlyRequired: false, query: "" };

  var dom = {
    reference: document.getElementById("reference"),
    toc: document.getElementById("toc-panel"),
    tocToggle: document.getElementById("toc-toggle"),
    search: document.getElementById("field-search"),
    required: document.getElementById("only-required"),
    count: document.getElementById("ref-count"),
    here: document.getElementById("toolbar-here"),
  };

  function pickLang() {
    var qs = new URLSearchParams(location.search).get("lang");
    if (qs && SUPPORTED.indexOf(qs) !== -1) return qs;
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || FALLBACK];
    for (var i = 0; i < prefs.length; i++) {
      var base = String(prefs[i]).toLowerCase().split("-")[0];
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
    return FALLBACK;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // "Required" on a field means required *within its parent object*. A field is only required
  // in a minimal valid document if that field AND every ancestor object are required — e.g.
  // `location.geo.lat` is required inside `geo`, but `geo` (and `location`) are optional, so a
  // minimal document needs none of them. The "only required" filter uses this stricter notion.
  function isDocRequired(fields, f) {
    if (!f.required) return false;
    var parts = f.path.split(".");
    var prefix = "";
    for (var i = 0; i < parts.length - 1; i++) {
      prefix = prefix ? prefix + "." + parts[i] : parts[i];
      var ancestor = null;
      for (var j = 0; j < fields.length; j++) {
        if (fields[j].path === prefix) { ancestor = fields[j]; break; }
      }
      if (ancestor && !ancestor.required) return false;
    }
    return true;
  }

  function matches(f, query) {
    if (!query) return true;
    var hay = [f.path, f.type, f.description[state.lang]]
      .concat((f.examples || []).map(function (e) { return JSON.stringify(e); }))
      .join(" ")
      .toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function visibleFields(schema) {
    return schema.fields.filter(function (f) {
      return (!state.onlyRequired || isDocRequired(schema.fields, f)) && matches(f, state.query);
    });
  }

  // Field descriptions come from the schema and may name other fields in `backticks`
  // or point at a spec elsewhere with a bare URL — both become real markup here.
  function withCode(text) {
    var frag = document.createDocumentFragment();
    text.split(/`([^`]+)`/).forEach(function (part, i) {
      if (i % 2) return frag.appendChild(el("code", null, part));
      part.split(/(https?:\/\/[^\s)]*[^\s).,;:])/).forEach(function (bit, j) {
        if (!bit) return;
        if (j % 2 === 0) return frag.appendChild(document.createTextNode(bit));
        var a = el("a", "ref-link", bit.replace(/^https?:\/\//, ""));
        a.href = bit;
        a.target = "_blank";
        a.rel = "noopener";
        frag.appendChild(a);
      });
    });
    return frag;
  }

  // Marks every occurrence of the active filter, in place, without touching the markup around it.
  function highlight(root, query) {
    if (!query) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (node) {
      var lower = node.nodeValue.toLowerCase();
      if (lower.indexOf(query) === -1) return;
      var frag = document.createDocumentFragment();
      var from = 0;
      for (var at = lower.indexOf(query); at !== -1; at = lower.indexOf(query, from)) {
        frag.appendChild(document.createTextNode(node.nodeValue.slice(from, at)));
        frag.appendChild(el("mark", null, node.nodeValue.slice(at, at + query.length)));
        from = at + query.length;
      }
      frag.appendChild(document.createTextNode(node.nodeValue.slice(from)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  // The name reads as "parent.parent.leaf" with the parents dimmed: the leaf is what you scan for.
  function fieldName(path) {
    var name = el("code", "field-name");
    var at = path.lastIndexOf(".");
    if (at !== -1) name.appendChild(el("span", "path-parent", path.slice(0, at + 1)));
    name.appendChild(document.createTextNode(path.slice(at + 1)));
    return name;
  }

  function renderToc(t) {
    dom.toc.replaceChildren();
    dom.toc.appendChild(el("p", "toc-title", t.tocTitle));
    dom.toc.appendChild(el("p", "toc-legend", t.tocLegend));

    var any = false;
    state.model.schemas.forEach(function (schema) {
      var fields = visibleFields(schema);
      if (!fields.length) return;
      any = true;

      var group = el("div", "toc-group");
      var head = el("a", null, schema.name);
      head.href = "#" + schema.name;
      group.appendChild(head);

      var list = el("ul", "toc-list");
      fields.forEach(function (f) {
        var item = document.createElement("li");
        var link = el("a", isDocRequired(schema.fields, f) ? "toc-required" : null);
        link.appendChild(el("span", null, f.path.split(".").pop()));
        link.href = "#" + schema.name + "-" + f.path;
        link.title = f.path;
        link.dataset.depth = String(f.path.split(".").length - 1);
        link.dataset.target = schema.name + "-" + f.path;
        item.appendChild(link);
        list.appendChild(item);
      });
      group.appendChild(list);
      dom.toc.appendChild(group);
    });

    if (!any) dom.toc.appendChild(el("p", "toc-empty", t.noMatch));
  }

  function render() {
    var t = UI[state.lang];
    document.documentElement.lang = state.lang;
    document.title = t.title + " — OTE Spec v0.2";

    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = t[node.getAttribute("data-t")];
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-t-placeholder]").forEach(function (node) {
      node.placeholder = t[node.getAttribute("data-t-placeholder")];
    });
    document.querySelectorAll("[data-t-aria]").forEach(function (node) {
      node.setAttribute("aria-label", t[node.getAttribute("data-t-aria")]);
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });

    dom.reference.replaceChildren();
    if (!state.model) return;

    var shown = 0;
    var total = 0;

    state.model.schemas.forEach(function (schema) {
      total += schema.fields.length;
      var fields = visibleFields(schema);
      shown += fields.length;
      if (!fields.length) return;

      var section = el("section", "ref-schema");
      section.id = schema.name;

      var h2 = el("h2");
      h2.append(el("code", null, schema.name), document.createTextNode(" — " + schema.title[state.lang]));
      section.appendChild(h2);
      section.appendChild(el("p", "ref-schema-desc", schema.description[state.lang]));

      fields.forEach(function (f) {
        var card = el("article", "field" + (f.required ? " field-required" : ""));
        card.id = schema.name + "-" + f.path;
        card.dataset.depth = String(f.path.split(".").length - 1);

        var head = el("div", "field-head");
        head.appendChild(fieldName(f.path));
        head.appendChild(el("span", "field-type", f.type));

        var anchor = el("a", "field-anchor", "#");
        anchor.href = "#" + card.id;
        anchor.setAttribute("aria-label", t.anchorLabel + ": " + f.path);
        head.appendChild(anchor);

        head.appendChild(
          el("span", "field-req " + (f.required ? "is-required" : "is-optional"), f.required ? t.required : t.optional)
        );
        card.appendChild(head);

        var desc = el("p", "field-desc");
        desc.appendChild(withCode(f.description[state.lang]));
        card.appendChild(desc);

        if (f.examples && f.examples.length) {
          var ex = el("div", "field-examples");
          ex.appendChild(el("span", "field-examples-label", t.examples));
          f.examples.forEach(function (value) {
            ex.appendChild(el("code", null, JSON.stringify(value)));
          });
          card.appendChild(ex);
        }

        highlight(card, state.query);
        section.appendChild(card);
      });

      dom.reference.appendChild(section);
    });

    if (!shown) {
      var empty = el("div", "ref-empty");
      empty.appendChild(el("p", null, t.noMatch));
      var reset = el("button", "btn btn-ghost", t.clear);
      reset.type = "button";
      reset.addEventListener("click", function () {
        dom.search.value = "";
        dom.required.checked = false;
        state.query = "";
        state.onlyRequired = false;
        render();
        dom.search.focus();
      });
      empty.appendChild(reset);
      dom.reference.appendChild(empty);
    }

    dom.count.textContent =
      state.query || state.onlyRequired
        ? t.count.replace("{shown}", shown).replace("{total}", total)
        : "";

    renderToc(t);
    syncPosition();
  }

  /* ---------- scrollspy: the TOC and the toolbar chip say where you are ---------- */

  var spyQueued = false;
  function syncPosition() {
    var sections = dom.reference.querySelectorAll(".ref-schema");
    var cards = dom.reference.querySelectorAll(".field");
    var currentSchema = null;
    var currentField = null;

    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= STICKY_OFFSET) currentSchema = s.id;
    });
    cards.forEach(function (c) {
      if (c.getBoundingClientRect().top <= STICKY_OFFSET) currentField = c.id;
    });
    if (!currentSchema && sections.length) currentSchema = sections[0].id;

    dom.here.hidden = !currentSchema;
    if (currentSchema) {
      dom.here.href = "#" + currentSchema;
      dom.here.firstElementChild.textContent = currentSchema;
    }

    dom.toc.querySelectorAll(".toc-list a").forEach(function (link) {
      if (link.dataset.target === currentField) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    // Keep the active entry inside the (scrollable) TOC viewport. Scroll the panel by hand:
    // scrollIntoView would also move the document, fighting the reader's own scroll.
    var active = dom.toc.querySelector('.toc-list a[aria-current="true"]');
    if (active) {
      var panel = dom.toc.getBoundingClientRect();
      var item = active.getBoundingClientRect();
      if (item.top < panel.top) dom.toc.scrollTop -= panel.top - item.top + 8;
      else if (item.bottom > panel.bottom) dom.toc.scrollTop += item.bottom - panel.bottom + 8;
    }
  }

  window.addEventListener("scroll", function () {
    if (spyQueued || !state.model) return;
    spyQueued = true;
    requestAnimationFrame(function () {
      spyQueued = false;
      syncPosition();
    });
  }, { passive: true });

  /* ---------- controls ---------- */

  var searchTimer;
  dom.search.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.query = dom.search.value.trim().toLowerCase();
      render();
    }, 90);
  });
  dom.search.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dom.search.value) {
      dom.search.value = "";
      state.query = "";
      render();
    }
  });

  // "/" jumps to the filter, the convention on every reference site.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    e.preventDefault();
    dom.search.focus();
    dom.search.select();
  });

  dom.required.addEventListener("change", function () {
    state.onlyRequired = dom.required.checked;
    render();
  });

  // Below 980px the TOC is a disclosure; above it, it is always open.
  var narrow = window.matchMedia("(max-width: 980px)");
  var expanded = false;
  function syncToc() {
    if (narrow.matches) {
      dom.toc.hidden = !expanded;
      dom.tocToggle.setAttribute("aria-expanded", String(expanded));
    } else {
      dom.toc.hidden = false;
      dom.tocToggle.setAttribute("aria-expanded", "false");
    }
  }
  dom.tocToggle.addEventListener("click", function () {
    expanded = !expanded;
    syncToc();
  });
  dom.toc.addEventListener("click", function (e) {
    if (e.target.closest("a") && narrow.matches) {
      expanded = false;
      syncToc();
    }
  });
  narrow.addEventListener("change", syncToc);
  syncToc();

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.dataset.lang;
      try { localStorage.setItem(STORAGE_KEY, state.lang); } catch (e) { /* private mode */ }
      render();
    });
  });

  // Same nav as the landing page, so moving between them doesn't feel like leaving the site.
  // This page IS the reference, so say so.
  var current = document.querySelector('.nav a[data-nav="reference"]');
  if (current) current.setAttribute("aria-current", "page");

  state.lang = pickLang();
  // Browsers restore form values on reload and back-navigation: start from what the controls say.
  state.query = dom.search.value.trim().toLowerCase();
  state.onlyRequired = dom.required.checked;
  render();

  fetch("../data/reference.json")
    .then(function (res) { return res.json(); })
    .then(function (model) {
      state.model = model;
      render();
      // A deep link opened before the fields existed still has to land on its field.
      if (location.hash.length > 1) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      }
    })
    .catch(function (err) {
      console.error("[OTE] failed to load the field reference", err);
    });
})();
