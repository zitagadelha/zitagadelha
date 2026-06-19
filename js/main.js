(function () {
  const WA_URL =
    "https://wa.me/5585988122222?text=Ol%C3%A1.+Vim+do+site+e+gostaria+de+marcar+uma+sess%C3%A3o+particular+com+a+@zitapsi%E2%80%A6.";

  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.setAttribute("href", WA_URL);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
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

  document.querySelectorAll(".review-card").forEach((card) => {
    const text = card.querySelector(".review-card__text");
    const btn = card.querySelector(".review-card__read-more");
    if (!text || !btn) return;

    const full = text.textContent.trim();
    if (full.length <= 160) {
      btn.remove();
      return;
    }

    text.classList.add("is-collapsed");
    btn.addEventListener("click", () => {
      const collapsed = text.classList.toggle("is-collapsed");
      btn.textContent = collapsed ? "Leia mais" : "Esconder";
    });
  });

  const track = document.querySelector(".testimonials__track");
  if (!track) return;

  const prevBtn = document.querySelector(".testimonials__nav--prev");
  const nextBtn = document.querySelector(".testimonials__nav--next");
  const allSlides = Array.from(track.querySelectorAll(".testimonials__slide"));
  if (!allSlides.length) return;

  const mobileMq = window.matchMedia("(max-width: 767px)");

  allSlides.forEach((slide) => {
    slide.dataset.hasPhoto = slide.querySelector("img.review-card__avatar") ? "true" : "false";
  });

  function isMobileView() {
    return mobileMq.matches;
  }

  function sortSlidesForViewport() {
    const withPhoto = allSlides.filter((slide) => slide.dataset.hasPhoto === "true");
    const withoutPhoto = allSlides.filter((slide) => slide.dataset.hasPhoto !== "true");

    if (isMobileView()) {
      withPhoto.forEach((slide) => {
        slide.hidden = false;
        track.appendChild(slide);
      });
      withoutPhoto.forEach((slide) => {
        slide.hidden = true;
        track.appendChild(slide);
      });
      return;
    }

    allSlides.forEach((slide) => {
      slide.hidden = false;
    });
    [...withPhoto, ...withoutPhoto].forEach((slide) => track.appendChild(slide));
  }

  function getActiveSlides() {
    return allSlides.filter((slide) => !slide.hidden);
  }

  let index = 0;
  let autoplayTimer;
  let visible = 3;

  function getVisible() {
    return isMobileView() ? 1 : 3;
  }

  function getMaxIndex() {
    return Math.max(0, getActiveSlides().length - visible);
  }

  function updateCarousel() {
    sortSlidesForViewport();
    visible = getVisible();
    const max = getMaxIndex();
    if (index > max) index = 0;

    const slideWidth = 100 / visible;
    track.style.transform = `translateX(-${index * slideWidth}%)`;

    allSlides.forEach((slide) => {
      slide.style.flex = slide.hidden ? "0 0 0" : `0 0 ${slideWidth}%`;
    });
  }

  function next() {
    index = index >= getMaxIndex() ? 0 : index + 1;
    updateCarousel();
  }

  function prev() {
    index = index <= 0 ? getMaxIndex() : index - 1;
    updateCarousel();
  }

  function startAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(next, 6000);
  }

  function initCarousel() {
    prevBtn?.addEventListener("click", () => {
      prev();
      startAutoplay();
    });

    nextBtn?.addEventListener("click", () => {
      next();
      startAutoplay();
    });

    mobileMq.addEventListener("change", () => {
      index = 0;
      updateCarousel();
    });

    updateCarousel();
    startAutoplay();
  }

  const defer =
    window.requestIdleCallback ||
    function (cb) {
      window.setTimeout(cb, 300);
    };

  defer(initCarousel);
})();
