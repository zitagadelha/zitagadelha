(function () {
  var form = document.getElementById('newsletter-form');
  if (!form || !window.getSupabaseClient) return;

  var feedback = document.getElementById('newsletter-feedback');
  var consent = document.getElementById('newsletter-consent');
  var submitBtn = form.querySelector('button[type="submit"]');

  function showMessage(text, isError) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.classList.toggle('newsletter__feedback--error', !!isError);
    feedback.classList.toggle('newsletter__feedback--success', !isError);
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    var emailInput = form.querySelector('input[name="email"]');
    var email = (emailInput.value || '').trim().toLowerCase();

    if (!email || !emailInput.checkValidity()) {
      showMessage('Informe um e-mail válido.', true);
      return;
    }

    if (!consent.checked) {
      showMessage('Marque o consentimento para continuar.', true);
      return;
    }

    submitBtn.disabled = true;

    try {
      var client = window.getSupabaseClient();
      var result = await client.from('newsletter_subscribers').insert({
        email: email,
        source_page: window.location.pathname || '/'
      });

      if (result.error) {
        if (result.error.code === '23505') {
          showMessage('Este e-mail já está cadastrado.', true);
        } else {
          showMessage('Não foi possível concluir o cadastro. Tente novamente.', true);
        }
        return;
      }

      form.reset();
      showMessage('Cadastro realizado com sucesso!', false);
    } catch (err) {
      showMessage('Erro de conexão. Tente novamente em instantes.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
