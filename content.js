// content.js — SEO Rendering Analyzer
//
// Sammenligner rå HTML (ingen JS) mod live DOM for at klassificere elementer:
//   SSR/SSG — fandtes i rå HTML  → grønt overlay
//   CSR     — kun efter JS-kørsel → orange overlay

const STYLE_ID  = "seo-render-style";
const ATTR      = "data-seo-render";
const ATTR_SCRIPT = "data-seo-script";
const SELECTORS = "h1, h2, h3, h4, h5, h6, p, img, nav, header, footer, main, section, article";

// ---------- Hjælpefunktioner ----------

function extractTexts(doc) {
  const texts = new Set();
  doc.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,a,span").forEach(el => {
    const t = el.textContent.trim();
    if (t.length > 10) texts.add(t);
  });
  return texts;
}

function extractSrcs(doc) {
  const srcs = new Set();
  doc.querySelectorAll("img").forEach(img => {
    const src = img.getAttribute("src");
    if (src) srcs.add(src);
  });
  return srcs;
}

function extractScriptSrcs(doc) {
  const srcs = new Set();
  doc.querySelectorAll("script[src]").forEach(s => {
    const src = s.getAttribute("src");
    if (src) srcs.add(src);
  });
  return srcs;
}

function scriptFilename(src) {
  try {
    const pathname = new URL(src, location.href).pathname;
    const name = pathname.split("/").pop() || src;
    return name.length > 40 ? name.slice(0, 37) + "…" : name;
  } catch {
    const name = src.split("/").pop() || src;
    return name.length > 40 ? name.slice(0, 37) + "…" : name;
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${ATTR}="ssr"] {
      outline: 2px solid rgba(34, 197, 94, 0.85) !important;
      background-color: rgba(34, 197, 94, 0.07) !important;
      position: relative;
    }
    [${ATTR}="csr"] {
      outline: 2px solid rgba(249, 115, 22, 0.85) !important;
      background-color: rgba(249, 115, 22, 0.07) !important;
      position: relative;
    }
    [${ATTR}="csr"][${ATTR_SCRIPT}]::after {
      content: attr(${ATTR_SCRIPT});
      position: absolute;
      top: 0;
      left: 0;
      background: rgba(234, 88, 12, 0.92);
      color: #fff;
      font-size: 9px;
      font-family: ui-monospace, monospace;
      font-weight: 600;
      line-height: 1;
      padding: 2px 5px 3px;
      border-radius: 0 0 4px 0;
      white-space: nowrap;
      z-index: 2147483647;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

function removeOverlays() {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
  document.querySelectorAll(`[${ATTR}]`).forEach(el => {
    el.removeAttribute(ATTR);
    el.removeAttribute(ATTR_SCRIPT);
  });
}

// ---------- Analyse ----------

function analyzeElements(rawHtml) {
  const parser   = new DOMParser();
  const rawDoc   = parser.parseFromString(rawHtml, "text/html");
  const rawTexts = extractTexts(rawDoc);
  const rawSrcs  = extractSrcs(rawDoc);
  const rawSrcsArr = [...rawSrcs];

  // Find scripts der kun findes i live DOM (= JS-injekterede)
  const rawScriptSrcs = extractScriptSrcs(rawDoc);
  const csrScriptLabel = [...document.querySelectorAll("script[src]")]
    .map(s => s.getAttribute("src"))
    .filter(src => src && !rawScriptSrcs.has(src))
    .map(scriptFilename)
    .filter((v, i, a) => a.indexOf(v) === i) // unikke
    .slice(0, 3)
    .join(", ") || null;

  let ssrCount = 0, csrCount = 0;

  document.querySelectorAll(SELECTORS).forEach(el => {
    const tag = el.tagName.toLowerCase();
    let inRaw = false;

    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      inRaw = rawSrcs.has(src) ||
              rawSrcsArr.some(s => s && src && (s.includes(src) || src.includes(s)));
    } else {
      const content = el.textContent.trim();
      if (content.length < 8) return;
      inRaw = rawTexts.has(content) ||
              [...rawTexts].some(rt => rt.includes(content) || content.includes(rt));
    }

    if (inRaw) {
      el.setAttribute(ATTR, "ssr");
      ssrCount++;
    } else {
      el.setAttribute(ATTR, "csr");
      if (csrScriptLabel) el.setAttribute(ATTR_SCRIPT, csrScriptLabel);
      csrCount++;
    }
  });

  const total    = ssrCount + csrCount;
  const pageType = total > 0 && csrCount / total > 0.5 ? "CSR" : "SSR/SSG";

  return { ssrCount, csrCount, pageType, total };
}

// ---------- Besked-lytter ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === "analyze") {
    chrome.runtime.sendMessage({ action: "fetchRaw", url: location.href }, response => {
      if (!response || !response.ok) {
        sendResponse({ ok: false, error: response?.error || "Fetch fejlede" });
        return;
      }
      const result = analyzeElements(response.html);
      injectStyles();
      sendResponse({ ok: true, ...result });
    });
    return true; // async
  }

  if (msg.action === "clear") {
    removeOverlays();
    sendResponse({ ok: true });
    return true;
  }

});
