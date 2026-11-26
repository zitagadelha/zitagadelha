(function () {
  var KEY = "zg_cookie_consent";

  function grantConsent() {
    gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  }

  var salvo = null;
  try {
    salvo = localStorage.getItem(KEY);
  } catch (e) {}
  if (salvo === "granted") {
    grantConsent();
    return;
  }
  if (salvo === "denied") return;

  var banner = document.getElementById("cookie-banner");
  var accept = document.getElementById("cookie-accept");
  var refuse = document.getElementById("cookie-refuse");
  if (!banner || !accept) return;

  var shown = false;
  function showBanner() {
    if (shown) return;
    shown = true;
    document.body.classList.add("has-cookie-banner");
    banner.hidden = false;
    window.removeEventListener("scroll", onScroll, { passive: true });
  }

  function onScroll() {
    if (window.scrollY > 120) showBanner();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(showBanner, 8000);

  function fechar() {
    banner.hidden = true;
    document.body.classList.remove("has-cookie-banner");
  }

  if (refuse) {
    refuse.addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, "denied");
      } catch (e) {}
      fechar();
    });
  }

  accept.addEventListener("click", function () {
    try {
      localStorage.setItem(KEY, "granted");
    } catch (e) {
      /* file:// pode bloquear localStorage em alguns navegadores */
    }
    grantConsent();
    banner.hidden = true;
    document.body.classList.remove("has-cookie-banner");
  });
})();
