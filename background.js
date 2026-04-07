// background.js — Service worker
// Fetcher rå HTML (ingen JS) for en given URL og returnerer den til content script.
// Kører som service worker i Manifest V3.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "fetchRaw") {
    fetch(msg.url, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
    })
      .then(res => res.text().then(html => ({ ok: true, html })))
      .catch(err => ({ ok: false, html: "", error: err.message }))
      .then(sendResponse);

    return true; // Hold kanalen åben for async svar
  }
});
