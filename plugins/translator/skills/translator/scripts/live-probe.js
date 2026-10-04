// live-probe.js — paste as the `function` of the browser MCP's evaluate call
// (chrome-devtools `evaluate_script`, Playwright `browser_evaluate`). Read-only:
// it changes nothing on the page. Returns what a reader actually sees, as JSON
// for `translate.mjs live <probe.json>`:
//   texts   — visible text nodes + translatable attributes (placeholder, title,
//             aria-label, alt), deduplicated, in document order
//   clipped — elements whose text does not fit: cut off by overflow, ellipsised,
//             or spilling out of a button/link/label/badge box
() => {
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "TEMPLATE", "TEXTAREA"]);
  const BOXY = new Set(["BUTTON", "A", "LABEL", "TH", "TD", "LI", "OPTION", "SUMMARY", "H1", "H2", "H3", "H4", "H5", "H6"]);
  const sel = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) {
      let p = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(`${p}#${n.id}`); break; }
      const cls = [...n.classList].filter((c) => !/^(css|sc|jsx|_)-|\d{3,}/.test(c)).slice(0, 2);
      if (cls.length) p += "." + cls.join(".");
      parts.unshift(p);
    }
    return parts.join(" > ");
  };
  const visible = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (SKIP.has(n.tagName) || n.getAttribute("aria-hidden") === "true" || n.hidden) return false;
      const s = getComputedStyle(n);
      // opacity:0 is NOT hidden: scroll-reveal animations park every below-the-fold
      // section at 0 until scrolled to (starogram /uk: 51 of ~120 strings seen otherwise).
      if (s.display === "none" || s.visibility === "hidden") return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const texts = [], seen = new Set(), clipped = [], checked = new Set();
  const add = (t, el, attr) => {
    t = t.replace(/\s+/g, " ").trim();
    if (t.length < 2 || !/\p{L}/u.test(t) || seen.has(t)) return;
    seen.add(t);
    texts.push(attr ? { t, tag: el.tagName.toLowerCase(), attr } : { t, tag: el.tagName.toLowerCase() });
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || !node.textContent.trim() || !visible(el)) continue;
    add(node.textContent, el);
    // Clipping: the box that holds the text, checked once.
    const box = el.closest("button, a, label, th, td, li, option, summary, h1, h2, h3, h4, h5, h6, [class*=badge], [class*=chip], [class*=tag], [class*=btn]") || el;
    if (checked.has(box)) continue;
    checked.add(box);
    const s = getComputedStyle(box);
    const hides = /hidden|clip/.test(s.overflowX + s.overflowY) || s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none" && s.webkitLineClamp !== undefined && s.webkitLineClamp !== "";
    const cut = hides && (box.scrollWidth > box.clientWidth + 1 || box.scrollHeight > box.clientHeight + 1);
    let spill = 0;
    if (!cut && (BOXY.has(box.tagName) || box !== el)) {
      const range = document.createRange();
      range.selectNodeContents(box);
      const tr = range.getBoundingClientRect(), br = box.getBoundingClientRect();
      spill = Math.round(Math.max(tr.right - br.right, br.left - tr.left, 0));
    }
    if (cut || spill > 2) clipped.push({ t: box.innerText.replace(/\s+/g, " ").trim().slice(0, 120), sel: sel(box), how: cut ? (s.textOverflow === "ellipsis" ? "ellipsis" : "overflow-hidden") : `spills ${spill}px` });
  }
  for (const el of document.querySelectorAll("[placeholder], [title], [aria-label], img[alt], input[type=submit][value], input[type=button][value]")) {
    if (!visible(el)) continue;
    for (const a of ["placeholder", "title", "aria-label", "alt", "value"]) if (el.hasAttribute(a) && (a !== "value" || el.tagName === "INPUT")) add(el.getAttribute(a), el, a);
  }
  return {
    url: location.href,
    lang: document.documentElement.lang || null,
    title: document.title,
    viewport: `${innerWidth}x${innerHeight}`,
    texts: [{ t: document.title, tag: "title" }, ...texts].filter((x) => x.t),
    clipped: clipped.slice(0, 60),
  };
};
