/**
 * Mobile nav toggle — shared by every page, since none of them share a JS bundle.
 * Below the responsive breakpoint (see styles.css), .nav becomes a dropdown panel that
 * this script opens/closes; above it, .nav-toggle is hidden and .nav sits inline as usual.
 */
(function () {
  "use strict";

  document.querySelectorAll(".nav-toggle").forEach(function (toggle) {
    var nav = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    // A link was just followed (same-page anchor or a new page) — either way, don't
    // leave the panel open behind it.
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        close();
        toggle.focus();
      }
    });

    // Resizing past the breakpoint with the panel open would otherwise leave it
    // "open" in a layout that no longer has a collapsed state to close it from.
    // Keep this number in sync with the media query in styles.css.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1200) close();
    });
  });
})();
