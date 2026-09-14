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

  if (localStorage.getItem(KEY) === "granted") {
    grantConsent();
    return;
  }

  var banner = document.getElementById("cookie-banner");
  var accept = document.getElementById("cookie-accept");
  if (!banner || !accept) return;

  banner.hidden = false;
  accept.addEventListener("click", function () {
    try {
      localStorage.setItem(KEY, "granted");
    } catch (e) {
      /* file:// pode bloquear localStorage em alguns navegadores */
    }
    grantConsent();
    banner.hidden = true;
  });
})();
