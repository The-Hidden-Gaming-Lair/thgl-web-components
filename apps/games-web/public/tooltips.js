/*!
 * THGL Tooltips - https://www.th.gl/tooltips.js
 * Hover tooltips for links to The Hidden Gaming Lair codex entries
 * (https://<game>.th.gl/[locale/]db/<section>/<id>). Dependency-free, no
 * cookies, no tracking. Optional config, set BEFORE this script:
 *   window.thglTooltipsConfig = {
 *     colorLinks: false,   // tint links with the entry's rarity colour
 *     iconizeLinks: false, // prepend the entry icon to links
 *     renameLinks: false,  // replace link text with the entry name
 *     iconSize: "small",   // "small" (16px) | "medium" (24px) link icons
 *     locale: undefined,   // e.g. "de" for links without a locale prefix
 *   };
 * API: window.thglTooltips.refresh() re-scans the page (also automatic).
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.thglTooltips && window.thglTooltips.version) {
    window.thglTooltips.refresh();
    return;
  }

  var cfg = window.thglTooltipsConfig || {};
  var PATH_RE =
    /^\/(?:([a-z]{2}(?:-[A-Za-z]{2,4})?)\/)?db\/([^/?#]+)\/([^/?#]+)\/?$/;
  var SKIP_HOSTS = { www: 1, app: 1, cdn: 1, static: 1, api: 1, status: 1 };
  var DELAY = 150;
  var DONE = "data-thgl-tt";
  var cache = {};
  var host, root, box, current, timer, lastX, lastY, io, mo;

  // Codex link -> {api, key} or null.
  function parse(href) {
    if (!href) return null;
    var u;
    try {
      u = new URL(href, document.baseURI);
    } catch (e) {
      return null;
    }
    var h = u.hostname;
    var live = /\.th\.gl$/.test(h) && !SKIP_HOSTS[h.split(".")[0]];
    var dev = /\.localhost$/.test(h) && u.port === "3100";
    if (!live && !dev) return null;
    var m = PATH_RE.exec(u.pathname);
    if (!m) return null;
    var locale = m[1] || cfg.locale || "";
    var section, id;
    try {
      section = decodeURIComponent(m[2]);
      id = decodeURIComponent(m[3]);
    } catch (e) {
      return null;
    }
    var api =
      u.origin +
      "/api/db/tooltip?section=" +
      encodeURIComponent(section) +
      "&id=" +
      encodeURIComponent(id) +
      (locale ? "&locale=" + encodeURIComponent(locale) : "");
    return { api: api };
  }

  function targetOf(el) {
    while (el && el.nodeType === 1) {
      if (el.hasAttribute("data-thgl")) return el;
      if (el.tagName === "A" && el.href) return el;
      el = el.parentElement;
    }
    return null;
  }

  function hrefOf(el) {
    return el.getAttribute("data-thgl") || el.href;
  }

  function load(el) {
    var p = parse(hrefOf(el));
    if (!p) return null;
    if (!cache[p.api]) {
      cache[p.api] = fetch(p.api, { credentials: "omit", mode: "cors" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (d) {
          return d && typeof d.name === "string" ? d : null;
        })
        .catch(function () {
          return null;
        });
    }
    return cache[p.api];
  }

  // ---- tooltip (shadow root, styles isolated both ways) ----
  var CSS =
    ":host{all:initial}" +
    ".tt{position:fixed;top:0;left:0;max-width:320px;min-width:180px;box-sizing:border-box;" +
    "padding:10px 12px 8px;background:#0b0b0f;border:1px solid #2a2a33;border-radius:8px;" +
    "box-shadow:0 8px 28px rgba(0,0,0,.55);color:#d4d4d8;" +
    "font:13px/1.4 Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    "pointer-events:none;opacity:0;transition:opacity .08s}" +
    ".tt.on{opacity:1}" +
    ".hd{display:flex;gap:10px;align-items:center}" +
    ".ic{flex:none;width:40px;height:40px;overflow:hidden;border-radius:6px;background:#16161d;border:1px solid #2a2a33}" +
    ".ic>div{background-repeat:no-repeat;transform-origin:0 0}" +
    ".nm{font-weight:600;font-size:15px;color:#f5f5f5;line-height:1.25;word-break:break-word}" +
    ".sc{font-size:12px;color:#f59e0b;margin-top:1px}" +
    ".rr{display:inline-block;font-size:11px;border:1px solid currentColor;border-radius:4px;padding:0 5px;margin-left:6px;vertical-align:1px}" +
    ".ds{margin-top:8px;color:#a1a1aa}" +
    ".st{margin-top:8px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px}" +
    ".st dt{color:#71717a}.st dd{margin:0;color:#e4e4e7;text-align:right}" +
    ".ft{margin-top:8px;padding-top:6px;border-top:1px solid #2a2a33;font-size:10px;color:#71717a;" +
    "display:flex;justify-content:space-between;gap:8px}";

  function ensureBox() {
    if (box) return box;
    host = document.createElement("div");
    host.setAttribute("data-thgl-tooltips", "");
    host.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none";
    root = host.attachShadow ? host.attachShadow({ mode: "closed" }) : host;
    var style = document.createElement("style");
    style.textContent = CSS;
    root.appendChild(style);
    box = document.createElement("div");
    box.className = "tt";
    box.setAttribute("role", "tooltip");
    root.appendChild(box);
    document.body.appendChild(host);
    return box;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function sprite(icon, size) {
    var inner = document.createElement("div");
    var s = size / (icon.width || size);
    inner.style.cssText =
      "width:" +
      icon.width +
      "px;height:" +
      icon.height +
      "px;background-image:url(" +
      JSON.stringify(String(icon.url)) +
      ");background-position:-" +
      (+icon.x || 0) +
      "px -" +
      (+icon.y || 0) +
      "px;transform:scale(" +
      s +
      ")";
    return inner;
  }

  function render(d) {
    var b = ensureBox();
    b.textContent = "";
    var hd = el("div", "hd");
    if (d.icon && d.icon.url) {
      var ic = el("div", "ic");
      ic.appendChild(sprite(d.icon, 40));
      hd.appendChild(ic);
    }
    var t = el("div");
    var nm = el("div", "nm", d.name);
    if (d.rarity && /^#[0-9a-f]{3,8}$/i.test(d.rarity.color))
      nm.style.color = d.rarity.color;
    t.appendChild(nm);
    var sc = el("div", "sc", d.section || "");
    if (d.rarity && d.rarity.label) {
      var rr = el("span", "rr", d.rarity.label);
      if (/^#[0-9a-f]{3,8}$/i.test(d.rarity.color))
        rr.style.color = d.rarity.color;
      sc.appendChild(rr);
    }
    t.appendChild(sc);
    hd.appendChild(t);
    b.appendChild(hd);
    if (d.description) b.appendChild(el("div", "ds", d.description));
    if (d.stats && d.stats.length) {
      var dl = el("dl", "st");
      for (var i = 0; i < d.stats.length && i < 6; i++) {
        dl.appendChild(el("dt", null, d.stats[i].label));
        dl.appendChild(el("dd", null, d.stats[i].value));
      }
      b.appendChild(dl);
    }
    var ft = el("div", "ft");
    ft.appendChild(el("span", null, d.game || ""));
    ft.appendChild(el("span", null, "The Hidden Gaming Lair"));
    b.appendChild(ft);
  }

  function place() {
    if (!box || !current) return;
    var vw = window.innerWidth,
      vh = window.innerHeight,
      w = box.offsetWidth,
      h = box.offsetHeight,
      x,
      y;
    if (lastX != null) {
      x = lastX + 16;
      y = lastY + 18;
      if (x + w > vw - 8) x = lastX - w - 16;
      if (y + h > vh - 8) y = lastY - h - 12;
    } else {
      var r = current.getBoundingClientRect();
      x = r.left;
      y = r.bottom + 8;
      if (y + h > vh - 8) y = r.top - h - 8;
    }
    x = Math.max(8, Math.min(x, vw - w - 8));
    y = Math.max(8, Math.min(y, vh - h - 8));
    box.style.transform = "translate(" + x + "px," + y + "px)";
  }

  function show(target, useCursor) {
    var p = load(target);
    if (!p) return;
    clearTimeout(timer);
    current = target;
    if (!useCursor) lastX = lastY = null;
    timer = setTimeout(function () {
      p.then(function (d) {
        if (!d || current !== target) return;
        render(d);
        box.classList.add("on");
        place();
      });
    }, DELAY);
  }

  function hide() {
    clearTimeout(timer);
    current = null;
    if (box) box.classList.remove("on");
  }

  document.addEventListener(
    "mouseover",
    function (e) {
      var t = targetOf(e.target);
      if (t === current) return;
      if (!t) return current && hide();
      lastX = e.clientX;
      lastY = e.clientY;
      show(t, true);
    },
    true,
  );
  document.addEventListener(
    "mouseout",
    function (e) {
      if (!current) return;
      var to = e.relatedTarget;
      if (!to || !current.contains(to)) hide();
    },
    true,
  );
  document.addEventListener(
    "mousemove",
    function (e) {
      if (!current) return;
      lastX = e.clientX;
      lastY = e.clientY;
      place();
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    "focusin",
    function (e) {
      var t = targetOf(e.target);
      if (t) show(t, false);
    },
    true,
  );
  document.addEventListener("focusout", hide, true);
  document.addEventListener(
    "touchstart",
    function (e) {
      var t = targetOf(e.target);
      if (!t) return hide();
      if (t === current) return;
      var touch = e.touches && e.touches[0];
      lastX = touch ? touch.clientX : null;
      lastY = touch ? touch.clientY : null;
      show(t, !!touch);
    },
    { capture: true, passive: true },
  );
  window.addEventListener("scroll", hide, { capture: true, passive: true });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hide();
  });

  // ---- optional link decoration (lazy, per visible link) ----
  function decorate(a, d) {
    if (!d) return;
    if (cfg.renameLinks && !a.children.length) a.textContent = d.name;
    if (cfg.colorLinks) {
      var c = d.rarity && d.rarity.color;
      a.style.color = /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#f59e0b";
    }
    if (cfg.iconizeLinks && d.icon && d.icon.url) {
      var size = cfg.iconSize === "medium" ? 24 : 16;
      var wrap = document.createElement("span");
      wrap.setAttribute("data-thgl-icon", "");
      wrap.setAttribute("aria-hidden", "true");
      wrap.style.cssText =
        "display:inline-block;width:" +
        size +
        "px;height:" +
        size +
        "px;overflow:hidden;vertical-align:middle;margin-right:4px;border-radius:3px;line-height:0";
      var inner = sprite(d.icon, size);
      inner.style.backgroundRepeat = "no-repeat";
      inner.style.transformOrigin = "0 0";
      wrap.appendChild(inner);
      a.insertBefore(wrap, a.firstChild);
    }
  }

  function scan(rootNode) {
    if (!decorating()) return;
    var list = (rootNode || document).querySelectorAll
      ? (rootNode || document).querySelectorAll("a[href]")
      : [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (a.hasAttribute(DONE) || !parse(a.href)) continue;
      a.setAttribute(DONE, "");
      if (io) io.observe(a);
      else
        (function (a) {
          var p = load(a);
          if (p)
            p.then(function (d) {
              decorate(a, d);
            });
        })(a);
    }
  }

  function decorating() {
    return !!(cfg.iconizeLinks || cfg.renameLinks || cfg.colorLinks);
  }

  // Observers exist only while a decoration option is on (hover alone needs
  // none: it is delegated on document, so SPA-inserted links just work).
  function setup() {
    cfg = window.thglTooltipsConfig || cfg;
    if (window.thglTooltips) window.thglTooltips.config = cfg;
    if (!decorating() || !document.body) return;
    if (!io && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (!entries[i].isIntersecting) continue;
            var a = entries[i].target;
            io.unobserve(a);
            var p = load(a);
            if (p)
              p.then(
                (function (a) {
                  return function (d) {
                    decorate(a, d);
                  };
                })(a),
              );
          }
        },
        { rootMargin: "200px" },
      );
    }
    if (!mo && "MutationObserver" in window) {
      mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType !== 1 || n.hasAttribute("data-thgl-icon")) continue;
            if (n.tagName === "A") scan(n.parentNode);
            else scan(n);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
    scan(document);
  }

  window.thglTooltips = {
    version: 1,
    config: cfg,
    refresh: setup,
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
