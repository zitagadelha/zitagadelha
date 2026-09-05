(function () {
  var openBtn = document.getElementById('ebook-open');
  var modal = document.getElementById('ebook-modal');
  var form = document.getElementById('ebook-form');
  if (!openBtn || !modal || !form) return;

  var feedback = document.getElementById('ebook-feedback');
  var emailInput = document.getElementById('ebook-email');
  var submitBtn = form.querySelector('button[type="submit"]');
  var pdfUrl = openBtn.getAttribute('data-ebook-pdf') || 'downloads/guia-breve-autoconhecimento.pdf';
  var closeEls = modal.querySelectorAll('[data-ebook-close]');
  var lastFocus = null;
  var btnLabel = 'Baixar PDF gratuitamente';

  function showMessage(text, isError) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.classList.toggle('ebook-modal__feedback--error', !!isError);
    feedback.classList.toggle('ebook-modal__feedback--success', !isError);
  }

  function clearMessage() {
    if (!feedback) return;
    feedback.hidden = true;
    feedback.textContent = '';
    feedback.classList.remove('ebook-modal__feedback--error', 'ebook-modal__feedback--success');
  }

  function syncButtonState() {
    if (!submitBtn || !emailInput) return;
    var email = (emailInput.value || '').trim();
    submitBtn.disabled = !email;
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('ebook-modal-open');
    clearMessage();
    if (emailInput) emailInput.value = '';
    syncButtonState();
    if (emailInput) {
      setTimeout(function () {
        emailInput.focus();
      }, 30);
    }
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('ebook-modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function openPdf() {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }

  openBtn.addEventListener('click', function (event) {
    event.preventDefault();
    openModal();
  });

  closeEls.forEach(function (el) {
    el.addEventListener('click', function () {
      closeModal();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });

  if (emailInput) {
    emailInput.addEventListener('input', syncButtonState);
    emailInput.addEventListener('change', syncButtonState);
  }

  syncButtonState();

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessage();

    var email = (emailInput && emailInput.value ? emailInput.value : '').trim().toLowerCase();

    if (!email || !emailInput.checkValidity()) {
      showMessage('Informe um e-mail válido.', true);
      return;
    }

    if (!window.getSupabaseClient) {
      showMessage('Não foi possível conectar. Recarregue a página.', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparando...';

    var pdfWindow = window.open('', '_blank');

    try {
      var client = window.getSupabaseClient();
      var result = await client.from('newsletter_subscribers').insert({
        email: email,
        source_page: (window.location.pathname || '/') + '#guia'
      });

      if (result.error) {
        var isDuplicate =
          result.error.code === '23505' ||
          /duplicate|unique/i.test(result.error.message || '');

        if (!isDuplicate) {
          console.error('Ebook signup error:', result.error);
          if (pdfWindow) pdfWindow.close();
          showMessage('Não foi possível liberar o download. Tente novamente.', true);
          return;
        }
      }

      if (pdfWindow) {
        pdfWindow.opener = null;
        pdfWindow.location = pdfUrl;
      } else {
        openPdf();
      }

      form.reset();
      syncButtonState();
      showMessage('Pronto! O guia abriu em uma nova aba.', false);

      setTimeout(function () {
        closeModal();
        clearMessage();
      }, 1200);
    } catch (err) {
      console.error('Ebook signup exception:', err);
      if (pdfWindow) pdfWindow.close();
      showMessage('Erro de conexão. Tente novamente em instantes.', true);
    } finally {
      submitBtn.textContent = btnLabel;
      syncButtonState();
    }
  });
})();
