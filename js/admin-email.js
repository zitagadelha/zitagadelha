(function () {
  var loginView = document.getElementById('login-view');
  var dashboardView = document.getElementById('dashboard-view');
  var loginForm = document.getElementById('admin-login-form');
  var loginError = document.getElementById('admin-login-error');
  var loginSubmitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
  var logoutBtn = document.getElementById('admin-logout');
  var filterForm = document.getElementById('admin-filter-form');
  var periodSelect = document.getElementById('admin-period');
  var customStart = document.getElementById('admin-start');
  var customEnd = document.getElementById('admin-end');
  var searchInput = document.getElementById('admin-search');
  var countEl = document.getElementById('admin-count');
  var tableBody = document.getElementById('admin-table-body');
  var exportCsv = document.getElementById('export-csv');
  var exportXlsx = document.getElementById('export-xlsx');
  var exportPdf = document.getElementById('export-pdf');
  var passwordToggle = document.getElementById('admin-password-toggle');
  var passwordInput = document.getElementById('admin-password');

  var currentRows = [];
  var client = null;

  function showLoginError(message) {
    if (!loginError) return;
    loginError.hidden = false;
    loginError.textContent = message;
  }

  function clearLoginError() {
    if (!loginError) return;
    loginError.hidden = true;
    loginError.textContent = '';
  }

  function getClient() {
    if (client) return client;

    if (!window.getSupabaseClient) {
      throw new Error('Configuração do Supabase não carregou. Recarregue a página.');
    }

    if (!window.supabase) {
      throw new Error('Biblioteca do Supabase não carregou. Verifique sua conexão e recarregue.');
    }

    client = window.getSupabaseClient();
    return client;
  }

  function showLogin() {
    if (loginView) loginView.hidden = false;
    if (dashboardView) dashboardView.hidden = true;
  }

  function showDashboard() {
    if (loginView) loginView.hidden = true;
    if (dashboardView) dashboardView.hidden = false;
  }

  function formatDateTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getPeriodRange() {
    var period = periodSelect ? periodSelect.value : '30';
    var end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === 'personalizado') {
      var startValue = customStart && customStart.value;
      var endValue = customEnd && customEnd.value;

      if (startValue && endValue) {
        var customStartDate = new Date(startValue + 'T00:00:00');
        var customEndDate = new Date(endValue + 'T23:59:59');

        if (customStartDate <= customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
      }
    }

    var days = ['3', '7', '30'].indexOf(period) !== -1 ? parseInt(period, 10) : 30;
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    return { start: start, end: end };
  }

  function toggleCustomDates() {
    var isCustom = periodSelect && periodSelect.value === 'personalizado';
    if (customStart) customStart.disabled = !isCustom;
    if (customEnd) customEnd.disabled = !isCustom;
  }

  function renderTable(rows) {
    currentRows = rows;

    if (countEl) {
      countEl.textContent = rows.length + ' inscritos no período';
    }

    if (!tableBody) return;

    if (!rows.length) {
      tableBody.innerHTML =
        '<tr><td colspan="3" class="admin-email__empty">Nenhum cadastro encontrado.</td></tr>';
      return;
    }

    tableBody.innerHTML = rows.map(function (row) {
      return (
        '<tr>' +
        '<td><a href="mailto:' + escapeHtml(row.email) + '">' + escapeHtml(row.email) + '</a></td>' +
        '<td>' + escapeHtml(row.source_page || '—') + '</td>' +
        '<td>' + escapeHtml(formatDateTime(row.created_at)) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadSubscribers() {
    var supabaseClient = getClient();
    var range = getPeriodRange();
    var search = searchInput ? searchInput.value.trim() : '';

    var query = supabaseClient
      .from('newsletter_subscribers')
      .select('id, email, source_page, created_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('email', '%' + search + '%');
    }

    var result = await query;

    if (result.error) {
      renderTable([]);
      return;
    }

    renderTable(result.data || []);
  }

  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportAsCsv() {
    var lines = ['E-mail;Página;Cadastro'];

    currentRows.forEach(function (row) {
      lines.push([
        '"' + String(row.email).replace(/"/g, '""') + '"',
        '"' + String(row.source_page || '').replace(/"/g, '""') + '"',
        '"' + formatDateTime(row.created_at).replace(/"/g, '""') + '"'
      ].join(';'));
    });

    var blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

    downloadBlob('newsletter_' + fileStamp() + '.csv', blob);
  }

  function exportAsXlsx() {
    if (!window.XLSX) return;

    var sheetData = [
      ['E-mail', 'Página', 'Cadastro']
    ];

    currentRows.forEach(function (row) {
      sheetData.push([
        row.email,
        row.source_page || '',
        formatDateTime(row.created_at)
      ]);
    });

    var worksheet = window.XLSX.utils.aoa_to_sheet(sheetData);
    var workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscritos');
    window.XLSX.writeFile(workbook, 'newsletter_' + fileStamp() + '.xlsx');
  }

  function exportAsPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) return;

    var doc = new window.jspdf.jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text('Inscritos da newsletter', 14, 16);
    doc.setFontSize(10);
    doc.text('Total: ' + currentRows.length, 14, 24);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 30,
        head: [['E-mail', 'Página', 'Cadastro']],
        body: currentRows.map(function (row) {
          return [
            row.email,
            row.source_page || '—',
            formatDateTime(row.created_at)
          ];
        }),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [156, 99, 111] }
      });
    }

    doc.save('newsletter_' + fileStamp() + '.pdf');
  }

  function fileStamp() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
      '_' + pad(now.getHours()) + pad(now.getMinutes());
  }

  async function init() {
    toggleCustomDates();

    try {
      var supabaseClient = getClient();
      var sessionResult = await supabaseClient.auth.getSession();

      if (sessionResult.data.session) {
        showDashboard();
        await loadSubscribers();
      } else {
        showLogin();
      }

      supabaseClient.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_IN') {
          showDashboard();
          loadSubscribers();
        }

        if (event === 'SIGNED_OUT') {
          showLogin();
          renderTable([]);
        }
      });
    } catch (err) {
      console.error('Admin bootstrap error:', err);
      showLogin();
      showLoginError(err.message || 'Não foi possível iniciar o painel. Recarregue a página.');
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      clearLoginError();

      var emailInput = document.getElementById('admin-email');
      var passwordField = document.getElementById('admin-password');
      var email = emailInput ? emailInput.value.trim() : '';
      var password = passwordField ? passwordField.value : '';

      if (!email || !passwordField || !passwordField.checkValidity()) {
        showLoginError('Informe um e-mail válido.');
        return;
      }

      if (!password) {
        showLoginError('Informe a senha.');
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Entrando...';
      }

      try {
        var supabaseClient = getClient();
        var result = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (result.error) {
          console.error('Admin login error:', result.error);
          var message = result.error.message || '';

          if (/invalid login credentials/i.test(message)) {
            showLoginError('E-mail ou senha inválidos.');
          } else if (/email not confirmed/i.test(message)) {
            showLoginError('E-mail ainda não confirmado no Supabase. Marque "Auto Confirm User" ao criar o usuário.');
          } else if (/email provider.*disabled/i.test(message)) {
            showLoginError('Login por e-mail está desativado no Supabase. Ative em Authentication → Providers → Email.');
          } else {
            showLoginError('Não foi possível entrar. Tente novamente em instantes.');
          }
          return;
        }

        showDashboard();
        await loadSubscribers();
      } catch (err) {
        console.error('Admin login exception:', err);
        showLoginError(err.message || 'Erro ao conectar. Recarregue a página e tente novamente.');
      } finally {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = 'Entrar';
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      try {
        var supabaseClient = getClient();
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.error('Admin logout error:', err);
      }
      showLogin();
    });
  }

  if (filterForm) {
    filterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      loadSubscribers().catch(function (err) {
        console.error('Filter error:', err);
      });
    });
  }

  if (periodSelect) {
    periodSelect.addEventListener('change', toggleCustomDates);
  }

  if (exportCsv) exportCsv.addEventListener('click', exportAsCsv);
  if (exportXlsx) exportXlsx.addEventListener('click', exportAsXlsx);
  if (exportPdf) exportPdf.addEventListener('click', exportAsPdf);

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      var show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      passwordToggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      passwordToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      passwordToggle.classList.toggle('is-visible', show);
    });
  }

  init();
})();
