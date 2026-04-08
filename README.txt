SEO RENDERING ANALYZER — Chrome Extension
==========================================
Version 1.1

HVAD GOR EXTENSIONEN?
=====================
Extensionen analyserer hvordan en sides indhold er renderet:

  SSR/SSG (groen)  — Indhold fandtes i raa HTML, dvs. server-renderet
  CSR (orange)     — Indhold injekteret af JavaScript efter sideload

Hvert orange CSR-element viser et lille label med navnet paa det/de
JavaScript-filer der er ansvarlige for at loade indholdet dynamisk.
Op til 3 script-filnavne vises kommasepareret.

INSTALLATION I CHROME
=====================
1. Aaben Chrome og gaa til: chrome://extensions/
2. Slaa "Developer mode" til (toggle oeverst til hoejre)
3. Klik paa "Load unpacked"
4. Vaelg den mappe hvor du har extensionen liggende
5. Extensionen vises nu i din toolbar (klik puzzle-ikonet og pin den)

BRUG
====
1. Gaa til en hjemmeside
2. Klik paa flamme-ikonet i toolbaren
3. Klik "Analyser side"
4. Groen outline = SSR/SSG (server-renderet)
   Orange outline = CSR (JavaScript-renderet)
   Orange label paa CSR-elementer = script der loader indholdet
5. Klik "Ryd" for at fjerne overlays

POPUP-VISNING
=============
- Badge viser samlet vurdering: CSR eller SSR/SSG
- Progress bar viser fordeling mellem SSR og CSR elementer
- Tæller viser antal af hver type

BEGRAENSNINGER
==============
- img-elementer viser ikke script-label (browser-begraensning for ::after)
- Script-tilskrivning er baseret paa hvilke scripts der IKKE fandtes i
  raa HTML — ikke en direkte execution trace
- Sider med login-vaeg eller anti-bot beskyttelse kan give fejl paa fetch

GENINDLAES EFTER AENDRINGER
============================
Gaa til chrome://extensions/ og klik paa reload-ikonet ud for extensionen.

CHANGELOG
=========
v1.1 - CSR-elementer viser nu script-reference som label (data-seo-script)
v1.0 - Initial release: CSR/SSR/SSG element-analyse med farve-overlay
