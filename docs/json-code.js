/* Renders a JSON document as highlighted, line-addressable markup.
   Shared by the examples gallery and the field reference: both show the same documents, and a
   sample must not look like a different thing depending on which page you met it on. */
(function (global) {
  "use strict";

  // Keys, strings and literals. Nothing here spans a line: in pretty-printed JSON a real newline
  // can only appear between tokens, never inside one (\n inside a string arrives escaped).
  var TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function highlightLine(text, line, options) {
    var match;
    var last = 0;
    TOKEN.lastIndex = 0;
    while ((match = TOKEN.exec(text)) !== null) {
      if (match.index > last) line.appendChild(document.createTextNode(text.slice(last, match.index)));
      if (match[2] !== undefined) {
        // A key carrying a colon is another project's vocabulary — the spec promises never to
        // mint one, so the colour is a fact about the field, not decoration.
        var name = match[1].slice(1, -1);
        var external = name.indexOf(":") !== -1;
        var key = el("k", external ? "tok-ext" : null, match[1]);
        if (external && options.extTitle) key.title = options.extTitle;
        line.appendChild(key);
        line.appendChild(document.createTextNode(match[2]));
      } else if (match[1] !== undefined) {
        line.appendChild(el("s", null, match[1]));
      } else {
        line.appendChild(el("span", "tok-lit", match[3] !== undefined ? match[3] : match[4]));
      }
      last = match.index + match[0].length;
    }
    line.appendChild(document.createTextNode(text.slice(last)));
  }

  /**
   * source   the document, as text
   * options  { hits: [1-based line numbers to mark], extTitle: tooltip for prefixed keys }
   * Returns a fragment of one <span class="code-line"> per line, so a caller can point at a
   * field's exact lines — and scroll to them — without re-parsing anything.
   */
  function renderJson(source, options) {
    options = options || {};
    var hits = {};
    (options.hits || []).forEach(function (n) { hits[n] = true; });

    var frag = document.createDocumentFragment();
    source.split("\n").forEach(function (text, i) {
      var line = el("span", "code-line" + (hits[i + 1] ? " is-hit" : ""));
      line.dataset.line = String(i + 1);
      highlightLine(text, line, options);
      frag.appendChild(line);
    });
    return frag;
  }

  global.OTECode = { renderJson: renderJson };
})(window);
