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
      navExamples: "Examples",
      navReference: "Reference",
      navDevelopers: "Developers",
      navTools: "Tools",
      title: "Field reference",
      lead: "Every field of OTE Spec v0.3. This page is generated from the JSON Schemas, so it cannot drift from what the validator actually enforces.",
      rules: "Rules a validator can't check",
      raw: "Raw JSON Schema",
      examplesCta: "Practical examples",
      footerNote: "Generated from the schemas. Draft specification — fields may change.",
      required: "required",
      optional: "optional",
      examples: "Examples",
      examplesHint: "Click a value to see it inside a whole document",
      inDocs: "See it in a real document",
      inDocsCount: "In {n} example document(s)",
      hideDocs: "Hide the document",
      loadingDocs: "Loading examples…",
      docsFailed: "The examples could not be loaded.",
      fullExample: "Open the full example",
      highlighted: "{n} highlighted line(s)",
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
      extTag: "Not generated from the schemas",
      extTitle: "The field you need isn't here",
      extLead: "Add it. OTE's schemas do not forbid extra fields, on purpose: your document stays valid, and a consumer that doesn't understand them can ignore them safely. This is how the spec grows — through fields someone already uses, not fields we imagine will be needed.",
      extCoreTitle: "Candidate for the core",
      extCoreBody: "A generic field that could become part of OTE. Write it without a prefix. If enough people need it, it gets standardised — and your local meaning gives way to the normative one.",
      extVocabTitle: "Someone else's vocabulary",
      extVocabBody: "A field whose meaning is defined by another project, and that will never belong to OTE. Write it with a prefix. It cannot collide with a core field, today or at 1.0.",
      extPromise: "OTE will never mint a field name containing a colon.",
      extPromiseBody: "That reservation is what makes the second column safe — and what lets OTE connect to other specifications without being coupled to them.",
      extMore: "Full extension rules",
      extIssue: "Tell us what you're using",
    },
    es: {
      pill: "Borrador 0.x",
      draft: "Los campos pueden cambiar, renombrarse o desaparecer.",
      follow: "Sigue la discusión",
      navSpec: "Cómo funciona",
      navAdopt: "Adhiérete",
      navExamples: "Ejemplos",
      navReference: "Referencia",
      navDevelopers: "Desarrolladores",
      navTools: "Herramientas",
      title: "Referencia de campos",
      lead: "Todos los campos de OTE Spec v0.3. Esta página se genera a partir de los JSON Schema, así que no puede separarse de lo que el validador exige de verdad.",
      rules: "Reglas que un validador no ve",
      raw: "JSON Schema en crudo",
      examplesCta: "Ejemplos prácticos",
      footerNote: "Generado a partir de los schemas. Especificación en borrador: los campos pueden cambiar.",
      required: "obligatorio",
      optional: "opcional",
      examples: "Ejemplos",
      examplesHint: "Pulsa un valor para verlo dentro de un documento entero",
      inDocs: "Verlo en un documento real",
      inDocsCount: "En {n} documento(s) de ejemplo",
      hideDocs: "Ocultar el documento",
      loadingDocs: "Cargando los ejemplos…",
      docsFailed: "No se han podido cargar los ejemplos.",
      fullExample: "Abrir el ejemplo completo",
      highlighted: "{n} línea(s) resaltada(s)",
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
      extTag: "Escrito a mano, no generado de los schemas",
      extTitle: "El campo que necesitas no está aquí",
      extLead: "Añádelo. Los schemas de OTE no prohíben campos adicionales, a propósito: tu documento sigue siendo válido, y quien no los entienda puede ignorarlos sin romperse. Es la vía por la que la spec crece: campos que alguien ya usa de verdad, no campos que imaginamos que harán falta.",
      extCoreTitle: "Candidato a núcleo",
      extCoreBody: "Un campo genérico que aspira a ser de OTE. Se escribe sin prefijo. Si le hace falta a bastante gente, se estandariza — y tu significado local cede ante el normativo.",
      extVocabTitle: "Vocabulario de otro proyecto",
      extVocabBody: "Un campo cuyo significado lo define otro proyecto y que nunca será de OTE. Se escribe con prefijo. No puede colisionar con un campo del núcleo, hoy ni en la 1.0.",
      extPromise: "OTE no acuñará jamás un nombre de campo que contenga dos puntos.",
      extPromiseBody: "Esa reserva es lo que hace segura la segunda columna, y lo que permite que OTE conecte con otras especificaciones sin acoplarse a ellas.",
      extMore: "Las reglas completas",
      extIssue: "Cuéntanos qué estás usando",
    },
  };

  // `examples` is the gallery's data, fetched the first time someone asks to see a field in
  // context — the reference is useful without it, so it must not be on the critical path.
  // `open` maps a field's card id to the example file shown under it, and survives re-renders:
  // typing in the filter must not close the document you were reading.
  var state = {
    lang: FALLBACK,
    model: null,
    onlyRequired: false,
    query: "",
    examples: null,
    examplesState: "idle",
    open: {},
  };

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
      // The ancestor of `organizers[].name` is the field named `organizers`: the `[]` marks
      // "each item of", it is not part of the parent's name.
      var parentPath = prefix.replace(/\[\]$/, "");
      var ancestor = null;
      for (var j = 0; j < fields.length; j++) {
        if (fields[j].path === parentPath) { ancestor = fields[j]; break; }
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

  /* ---------- "show me this field in a real document" ---------- */

  /* The gallery's data, loaded on demand. The reference answers "what is this field"; these
     panels answer "what does it look like in something I could publish" — and the point is
     that you never leave the page to find out, so you keep your place in the table. */

  function usageFor(path) {
    var usage = state.examples && state.examples.usage[path];
    return usage && usage.length ? usage : null;
  }

  function exampleFile(file) {
    return state.examples.examples.find(function (ex) { return ex.file === file; });
  }

  function loadExamples() {
    if (state.examplesState !== "idle") return Promise.resolve();
    state.examplesState = "loading";
    render();
    return fetch("../data/examples.json")
      .then(function (res) { return res.json(); })
      .then(function (model) {
        state.examples = model;
        state.examplesState = "ready";
        render();
      })
      .catch(function (err) {
        console.error("[OTE] failed to load the example documents", err);
        state.examplesState = "failed";
        render();
      });
  }

  // `value` is optional: when the reader pressed one of the schema's example values, prefer a
  // document that actually contains that value — being shown the field elsewhere is a worse
  // answer to "where does this go?" than being shown the very thing you clicked.
  function openDocument(cardId, path, value) {
    state.open[cardId] = { path: path, value: value };
    if (!state.examples) return void loadExamples();
    // The offer is made before the documents are known; a field none of them uses withdraws it.
    if (!usageFor(path)) delete state.open[cardId];
    render();
    var card = document.getElementById(cardId);
    if (card) card.scrollIntoView({ block: "nearest" });
  }

  // A schema example is one value; a document is pretty-printed over many lines, so the two are
  // never equal as text. Compare by the scalars inside: a document containing every leaf of the
  // value is showing that value, whatever the whitespace.
  function leavesOf(value, out) {
    if (Array.isArray(value)) value.forEach(function (item) { leavesOf(item, out); });
    else if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) { leavesOf(value[key], out); });
    } else out.push(JSON.stringify(value));
    return out;
  }

  /** The field's own block: its line, plus everything indented under it. */
  function blockAt(source, line) {
    var lines = source.split("\n");
    var first = lines[line - 1];
    if (first === undefined) return "";
    var indent = first.search(/\S/);
    var block = [first];
    for (var i = line; i < lines.length && lines[i].search(/\S/) > indent; i++) block.push(lines[i]);
    return block.join("\n");
  }

  function blockShows(source, line, value) {
    var block = blockAt(source, line);
    // Compared block by block, not document by document: a feed holds ten events, and being
    // dropped on some other event's `startDate` is not showing the reader the value they pressed.
    return leavesOf(value, []).every(function (leaf) { return block.indexOf(leaf) !== -1; });
  }

  /**
   * Which document to open, and on which line: what the reader picked, else the occurrence that
   * actually holds the value they pressed, else simply the first example that uses the field.
   */
  function pickUsage(open, usage) {
    var chosen = open.file && usage.find(function (use) { return use.file === open.file; });
    var candidates = chosen ? [chosen] : usage;

    if (open.value !== undefined) {
      for (var i = 0; i < candidates.length; i++) {
        var source = exampleFile(candidates[i].file).source;
        var line = candidates[i].lines.find(function (n) { return blockShows(source, n, open.value); });
        if (line) return { use: candidates[i], line: line };
      }
    }
    var fallback = candidates[0] || usage[0];
    return { use: fallback, line: fallback.lines[0] };
  }

  function appendDocuments(card, path, t) {
    var open = state.open[card.id];
    var usage = usageFor(path);

    // Before the data is there we cannot know whether this field appears anywhere, so the
    // offer is made for every field and withdrawn for the few that turn out to have none.
    if (state.examples && !usage) return;

    var bar = el("div", "field-docs-bar");
    var toggle = el("button", "field-docs-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(Boolean(open)));
    toggle.textContent = open ? t.hideDocs : t.inDocs;
    toggle.addEventListener("click", function () {
      if (open) {
        delete state.open[card.id];
        render();
      } else {
        openDocument(card.id, path);
      }
    });
    bar.appendChild(toggle);

    if (usage) {
      bar.appendChild(el("span", "field-docs-count", t.inDocsCount.replace("{n}", usage.length)));
    }
    if (state.examplesState === "loading") bar.appendChild(el("span", "field-docs-count", t.loadingDocs));
    if (state.examplesState === "failed") bar.appendChild(el("span", "field-docs-count", t.docsFailed));
    card.appendChild(bar);

    if (!open || !usage) return;

    var picked = pickUsage(open, usage);
    var use = picked.use;
    var example = exampleFile(use.file);
    var panel = el("div", "field-docs");

    if (usage.length > 1) {
      var picker = el("div", "field-docs-picker");
      usage.forEach(function (candidate) {
        var chip = el("button", "field-doc-chip" + (candidate.file === use.file ? " is-active" : ""));
        chip.type = "button";
        chip.textContent = exampleFile(candidate.file).title[state.lang];
        chip.setAttribute("aria-pressed", String(candidate.file === use.file));
        chip.addEventListener("click", function () {
          state.open[card.id] = { path: path, file: candidate.file, value: open.value };
          render();
        });
        picker.appendChild(chip);
      });
      panel.appendChild(picker);
    }

    var figure = el("figure", "code-block code-block-sm");
    var caption = el("figcaption");
    caption.appendChild(el("code", null, example.file));
    caption.appendChild(el("span", "field-docs-lines", t.highlighted.replace("{n}", use.lines.length)));
    var full = el("a", "field-docs-full", t.fullExample + " →");
    full.href = "/examples/#" + example.file.replace(/\.json$/, "");
    caption.appendChild(full);
    figure.appendChild(caption);

    var pre = document.createElement("pre");
    var code = document.createElement("code");
    code.appendChild(window.OTECode.renderJson(example.source, { hits: use.lines, extTitle: t.extVocabTitle }));
    pre.appendChild(code);
    figure.appendChild(pre);
    panel.appendChild(figure);
    card.appendChild(panel);

    // Open on the field, not on line 1: a 90-line feed would otherwise show its licence header
    // and hide the very thing the reader asked to see. On the next frame, because the card is
    // still detached from the document here — offsets of a detached element are all zero.
    requestAnimationFrame(function () {
      var hit = code.querySelector('.code-line[data-line="' + picked.line + '"]') ||
        code.querySelector(".code-line.is-hit");
      if (!hit) return;
      // By rectangle, not by offsetTop: the card is positioned, so offsets are measured from it
      // and not from the scrolling box.
      var delta = hit.getBoundingClientRect().top - pre.getBoundingClientRect().top;
      pre.scrollTop = Math.max(0, pre.scrollTop + delta - pre.clientHeight / 3);
    });
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
    document.title = t.title + " — OTE Spec v0.3";

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

        var path = schema.name + "." + f.path;

        if (f.examples && f.examples.length) {
          var ex = el("div", "field-examples");
          ex.appendChild(el("span", "field-examples-label", t.examples));
          f.examples.forEach(function (value) {
            // The schema's own examples stay exactly what they were — single values, as the
            // schema declares them. They just became a way in: press one and the same value
            // appears where it lives, inside a whole document. Pressable from the first paint,
            // before the documents are fetched: whether a value leads anywhere is not something
            // the reader should have to discover by the button appearing late.
            var button = el("button", "field-example", JSON.stringify(value));
            button.type = "button";
            button.title = t.examplesHint;
            button.addEventListener("click", function () {
              openDocument(card.id, path, value);
            });
            ex.appendChild(button);
          });
          card.appendChild(ex);
        }

        appendDocuments(card, path, t);

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
