(function () {
  const WA_URL =
    "https://wa.me/5585988122222?text=Ol%C3%A1.+Vim+do+site+e+gostaria+de+marcar+uma+sess%C3%A3o+particular+com+a+@zitapsi%E2%80%A6.";

  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.setAttribute("href", WA_URL);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
    el.addEventListener("click", () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "whatsapp_lead_click" });
    });
  });

  document.querySelectorAll(".faq__question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      const isOpen = item.classList.contains("is-open");

      document.querySelectorAll(".faq__item").forEach((faq) => {
        faq.classList.remove("is-open");
        faq.querySelector(".faq__question").setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  const navToggle = document.querySelector(".site-nav__toggle");
  const navMenu = document.getElementById("site-nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"
      );
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menu de navegação");
      });
    });
  }
})();
