/**
 * Clique em [data-wa] abre modal de lead; ao enviar, avisa a Zita por e-mail e abre o WhatsApp.
 */
(function () {
  if (window.__zgWaLeadModal) return;
  window.__zgWaLeadModal = true;

  var pendingHref = "";
  var lastFocus = null;

  var style = document.createElement("style");
  style.textContent =
    ".wa-lead{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(40,28,32,.45)}" +
    ".wa-lead[hidden]{display:none!important}" +
    ".wa-lead__panel{width:100%;max-width:26rem;max-height:min(92vh,40rem);overflow:auto;background:#fff;border-radius:12px;padding:1.35rem 1.25rem 1.25rem;box-shadow:0 18px 48px rgba(40,28,32,.22);font-family:Outfit,system-ui,sans-serif;color:#3a3032}" +
    ".wa-lead__head{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:1rem}" +
    ".wa-lead__title{margin:0;font-family:\"EB Garamond\",Georgia,serif;font-size:1.45rem;font-weight:500;line-height:1.25;color:#5c3f46}" +
    ".wa-lead__close{flex-shrink:0;width:2rem;height:2rem;border:0;border-radius:999px;background:#f5ecee;color:#5c3f46;font-size:1.25rem;line-height:1;cursor:pointer}" +
    ".wa-lead__close:hover{background:#eadde0}" +
    ".wa-lead__field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.85rem}" +
    ".wa-lead__field label{font-size:.82rem;font-weight:500;color:#5c3f46}" +
    ".wa-lead__field input,.wa-lead__field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(142,90,102,.28);border-radius:8px;padding:.65rem .75rem;font:inherit;font-size:.95rem;color:#3a3032;background:#fff}" +
    ".wa-lead__field input:focus,.wa-lead__field textarea:focus{outline:2px solid rgba(142,90,102,.35);outline-offset:1px;border-color:#8e5a66}" +
    ".wa-lead__field textarea{min-height:5.5rem;resize:vertical}" +
    ".wa-lead__hp{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden}" +
    ".wa-lead__err{margin:0 0 .75rem;font-size:.85rem;color:#a33;display:none}" +
    ".wa-lead__err.is-on{display:block}" +
    ".wa-lead__submit{width:100%;border:0;border-radius:999px;padding:.85rem 1.1rem;background:#1c7a45;color:#fff;font:inherit;font-size:.95rem;font-weight:600;cursor:pointer}" +
    ".wa-lead__submit:hover{background:#166238}" +
    ".wa-lead__submit:disabled{opacity:.65;cursor:wait}";
  document.head.appendChild(style);

  var root = document.createElement("div");
  root.className = "wa-lead";
  root.id = "wa-lead-modal";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "wa-lead-title");
  root.innerHTML =
    '<div class="wa-lead__panel">' +
    '<div class="wa-lead__head">' +
    '<h2 class="wa-lead__title" id="wa-lead-title">Antes de falar no WhatsApp</h2>' +
    '<button type="button" class="wa-lead__close" data-wa-lead-close aria-label="Fechar">&times;</button>' +
    "</div>" +
    '<form id="wa-lead-form" novalidate>' +
    '<div class="wa-lead__hp" aria-hidden="true">' +
    '<label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>' +
    "</div>" +
    '<div class="wa-lead__field">' +
    '<label for="wa-lead-questao">Qual é a principal questão que motivou sua busca pela psicoterapia?</label>' +
    '<textarea id="wa-lead-questao" name="questao" required rows="3"></textarea>' +
    "</div>" +
    '<div class="wa-lead__field">' +
    '<label for="wa-lead-nome">Nome Completo</label>' +
    '<input id="wa-lead-nome" name="nome" type="text" required autocomplete="name">' +
    "</div>" +
    '<div class="wa-lead__field">' +
    '<label for="wa-lead-email">Email</label>' +
    '<input id="wa-lead-email" name="email" type="email" required autocomplete="email">' +
    "</div>" +
    '<div class="wa-lead__field">' +
    '<label for="wa-lead-telefone">Telefone</label>' +
    '<input id="wa-lead-telefone" name="telefone" type="tel" required autocomplete="tel">' +
    "</div>" +
    '<p class="wa-lead__err" id="wa-lead-err" role="alert"></p>' +
    '<button type="submit" class="wa-lead__submit">Enviar no WhatsApp</button>' +
    "</form>" +
    "</div>";
  document.body.appendChild(root);

  var form = document.getElementById("wa-lead-form");
  var errEl = document.getElementById("wa-lead-err");
  var submitBtn = form.querySelector('button[type="submit"]');
  var openedAt = 0;

  function showErr(msg) {
    errEl.textContent = msg || "";
    errEl.classList.toggle("is-on", !!msg);
  }

  function openModal(href) {
    pendingHref = href;
    lastFocus = document.activeElement;
    openedAt = Date.now();
    form.reset();
    showErr("");
    root.hidden = false;
    document.body.style.overflow = "hidden";
    var first = document.getElementById("wa-lead-questao");
    if (first) first.focus();
  }

  function closeModal() {
    root.hidden = true;
    document.body.style.overflow = "";
    pendingHref = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openWhatsApp() {
    var href = pendingHref;
    closeModal();
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target;
      if (!el || !el.closest) return;
      var link = el.closest("a[data-wa]");
      if (!link) return;
      e.preventDefault();
      openModal(link.href || link.getAttribute("href") || "");
    },
    true
  );

  root.addEventListener("click", function (e) {
    if (e.target === root || (e.target.closest && e.target.closest("[data-wa-lead-close]"))) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !root.hidden) closeModal();
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    showErr("");

    var questao = (form.questao.value || "").trim();
    var nome = (form.nome.value || "").trim();
    var email = (form.email.value || "").trim();
    var telefone = (form.telefone.value || "").trim();
    var website = (form.website.value || "").trim();

    if (!questao || !nome || !email || !telefone) {
      showErr("Preencha todos os campos para continuar.");
      return;
    }
    if (!form.email.checkValidity()) {
      showErr("Informe um e-mail válido.");
      return;
    }

    submitBtn.disabled = true;
    var prevLabel = submitBtn.textContent;
    submitBtn.textContent = "Enviando...";

    // ponytail: API grava + e-mail; WhatsApp abre mesmo se a API falhar
    if (!website) {
      try {
        await fetch("/api/wa-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questao: questao,
            nome: nome,
            email: email,
            telefone: telefone,
            website: website,
            page: window.location.href || "",
            openedAt: openedAt,
          }),
        });
      } catch (err) {
        /* segue */
      }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = prevLabel;
    openWhatsApp();
  });
})();
