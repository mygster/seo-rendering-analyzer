// popup.js — håndterer popup-UI og kommunikation med content script

const btnAnalyze = document.getElementById("btn-analyze");
const btnClear   = document.getElementById("btn-clear");
const statusEl   = document.getElementById("status");
const resultsEl  = document.getElementById("results");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

function showResults({ ssrCount, csrCount, pageType, total }) {
  const ssrPct = total > 0 ? Math.round((ssrCount / total) * 100) : 0;
  const csrPct = total > 0 ? Math.round((csrCount / total) * 100) : 0;

  const badge = document.getElementById("page-type-badge");
  badge.textContent = pageType;
  badge.className = "page-type " + (pageType === "CSR" ? "csr" : "ssr");

  document.getElementById("bar-ssr").style.width  = ssrPct + "%";
  document.getElementById("bar-csr").style.width  = csrPct + "%";
  document.getElementById("ssr-count").textContent = ssrCount;
  document.getElementById("csr-count").textContent  = csrCount;

  resultsEl.style.display = "block";
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Injicer content script hvis ikke allerede aktivt
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (_) {
    // Allerede injekteret — ingen fejl
  }
}

btnAnalyze.addEventListener("click", async () => {
  btnAnalyze.disabled = true;
  setStatus("Henter rå HTML...");
  resultsEl.style.display = "none";

  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("Ingen aktiv fane fundet.", true);
    btnAnalyze.disabled = false;
    return;
  }

  await ensureContentScript(tab.id);

  chrome.tabs.sendMessage(tab.id, { action: "analyze" }, response => {
    btnAnalyze.disabled = false;

    if (chrome.runtime.lastError) {
      setStatus("Fejl: " + chrome.runtime.lastError.message, true);
      return;
    }
    if (!response || !response.ok) {
      setStatus("Analyse fejlede: " + (response?.error || "ukendt fejl"), true);
      return;
    }

    setStatus(`${response.total} elementer analyseret`);
    showResults(response);
  });
});

btnClear.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  await ensureContentScript(tab.id);

  chrome.tabs.sendMessage(tab.id, { action: "clear" }, () => {
    resultsEl.style.display = "none";
    setStatus("");
  });
});
