(function () {
  var form = document.getElementById('newsletter-form');
  if (!form || !window.getSupabaseClient) return;

  var feedback = document.getElementById('newsletter-feedback');
  var consent = document.getElementById('newsletter-consent');
  var submitBtn = form.querySelector('button[type="submit"]');
  var pdfUrl = form.getAttribute('data-pdf') || 'downloads/guia-breve-autoconhecimento.pdf';
  var btnLabel = submitBtn ? submitBtn.textContent : '';

  function showMessage(text, isError) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.classList.toggle('lead-feedback--error', !!isError);
    feedback.classList.toggle('lead-feedback--success', !isError);
    feedback.classList.toggle('nl-feedback--error', !!isError);
    feedback.classList.toggle('nl-feedback--success', !isError);
  }

  function clearMessage() {
    if (!feedback) return;
    feedback.hidden = true;
    feedback.textContent = '';
    feedback.classList.remove(
      'lead-feedback--error',
      'lead-feedback--success',
      'nl-feedback--error',
      'nl-feedback--success'
    );
  }

  function openPdf(pdfWindow) {
    if (pdfWindow) {
      pdfWindow.opener = null;
      pdfWindow.location = pdfUrl;
      return;
    }
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessage();

    var emailInput = form.querySelector('input[name="email"]');
    var email = (emailInput.value || '').trim().toLowerCase();

    if (!email || !emailInput.checkValidity()) {
      showMessage('Informe um e-mail válido.', true);
      return;
    }

    if (consent && !consent.checked) {
      showMessage('Marque o consentimento para continuar.', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparando...';

    var pdfWindow = window.open('', '_blank');

    try {
      var client = window.getSupabaseClient();
      var result = await client.from('newsletter_subscribers').insert({
        email: email,
        source_page: (window.location.pathname || '/') + '#entre-nos'
      });

      if (result.error) {
        var isDuplicate =
          result.error.code === '23505' ||
          /duplicate|unique/i.test(result.error.message || '');

        if (!isDuplicate) {
          console.error('Lead signup error:', result.error);
          if (pdfWindow) pdfWindow.close();
          showMessage('Não foi possível concluir. Tente novamente.', true);
          return;
        }
      }

      openPdf(pdfWindow);
      form.reset();
      if (consent) consent.checked = true;
      showMessage('Pronto! O guia abriu em uma nova aba.', false);
    } catch (err) {
      console.error('Lead signup exception:', err);
      if (pdfWindow) pdfWindow.close();
      showMessage('Erro de conexão. Tente novamente em instantes.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = btnLabel;
    }
  });
})();
