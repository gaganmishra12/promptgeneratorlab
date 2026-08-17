// cookie-consent.js
// Lightweight cookie consent banner. No dependencies.
// Stores the visitor's choice in localStorage so the banner only shows once.

(function () {
  var CONSENT_KEY = "pgl_cookie_consent";
  var existing = localStorage.getItem(CONSENT_KEY);
  if (existing) return; // already answered

  var banner = document.createElement("div");
  banner.id = "cookieBanner";
  banner.style.cssText = [
    "position:fixed", "left:0", "right:0", "bottom:0", "z-index:999",
    "background:#1E1B4B", "color:#E5E4F5", "padding:16px 20px",
    "display:flex", "flex-wrap:wrap", "gap:14px", "align-items:center", "justify-content:space-between",
    "font-family:'IBM Plex Sans',sans-serif", "font-size:13.5px",
    "box-shadow:0 -6px 24px -8px rgba(0,0,0,.3)"
  ].join(";");

  banner.innerHTML =
    '<span style="max-width:560px;">We use cookies to run this site and, if you agree, for analytics and advertising. See our ' +
    '<a href="/cookie-policy.html" style="color:#F97316; font-weight:600; text-decoration:none;">Cookie Policy</a>.</span>' +
    '<span style="display:flex; gap:10px; flex-shrink:0;">' +
    '<button id="cookieDecline" style="font-family:\'IBM Plex Mono\',monospace; font-size:12.5px; background:transparent; border:1.5px solid #4B4870; color:#E5E4F5; padding:9px 16px; border-radius:7px; cursor:pointer;">Decline</button>' +
    '<button id="cookieAccept" style="font-family:\'IBM Plex Mono\',monospace; font-weight:700; font-size:12.5px; background:#F97316; border:none; color:#fff; padding:9px 16px; border-radius:7px; cursor:pointer;">Accept</button>' +
    '</span>';

  document.body.appendChild(banner);

  document.getElementById("cookieAccept").addEventListener("click", function () {
    localStorage.setItem(CONSENT_KEY, "accepted");
    banner.remove();
    // If/when you add Google Analytics or Ads, initialize them here,
    // only after consent has been accepted.
  });

  document.getElementById("cookieDecline").addEventListener("click", function () {
    localStorage.setItem(CONSENT_KEY, "declined");
    banner.remove();
  });
})();
