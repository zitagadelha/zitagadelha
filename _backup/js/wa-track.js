/**
 * Rastreamento unificado de cliques WhatsApp (dataLayer -> GTM -> Ads/GA4).
 * Dispara em qualquer [data-wa] ou link wa.me / api.whatsapp.com.
 */
(function () {
  if (window.__zgWaTrackBound) return;
  window.__zgWaTrackBound = true;

  function isWhatsAppHref(href) {
    if (!href) return false;
    var h = String(href).toLowerCase();
    return (
      h.indexOf("wa.me/") !== -1 ||
      h.indexOf("api.whatsapp.com/") !== -1 ||
      h.indexOf("whatsapp.com/send") !== -1
    );
  }

  function resolveLocation(el) {
    var explicit = el.getAttribute("data-wa-location");
    if (explicit) return explicit;

    var id = (el.id || "").toLowerCase();
    if (id.indexOf("header") !== -1) return "header";
    if (id.indexOf("hero") !== -1) return "hero";
    if (id.indexOf("sobre") !== -1) return "sobre";
    if (id.indexOf("atendimento") !== -1) return "atendimento";
    if (id.indexOf("final") !== -1 || id.indexOf("cta") !== -1) return "cta_final";
    if (id.indexOf("float") !== -1) return "float";
    if (id.indexOf("footer") !== -1) return "footer";

    if (el.classList.contains("whatsapp-float")) return "float";
    if (el.classList.contains("site-nav__cta")) return "header";
    if (el.closest && el.closest(".cta-final")) return "cta_final";
    if (el.closest && el.closest(".hero")) return "hero";
    if (el.closest && el.closest(".site-footer")) return "footer";
    if (el.closest && el.closest("#quemsoueu")) return "sobre";
    if (el.closest && el.closest("#atendimento")) return "atendimento";

    return "other";
  }

  function resolveLabel(el) {
    var text = (el.getAttribute("aria-label") || el.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 80) || "whatsapp";
  }

  function pushWhatsAppClick(el) {
    var href = el.href || el.getAttribute("href") || "";
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "whatsapp_click",
      wa_location: resolveLocation(el),
      wa_button_id: el.id || "",
      wa_button_label: resolveLabel(el),
      wa_link: href.split("?")[0],
      page_path: window.location.pathname || "/",
      page_title: document.title || "",
      page_location: window.location.href || "",
    });
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target;
      if (!el || !el.closest) return;
      var link = el.closest("a[data-wa], a[href*='wa.me'], a[href*='api.whatsapp.com'], a[href*='whatsapp.com/send']");
      if (!link) return;
      if (!link.hasAttribute("data-wa") && !isWhatsAppHref(link.getAttribute("href") || link.href)) {
        return;
      }
      pushWhatsAppClick(link);
    },
    true
  );
})();
