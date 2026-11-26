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
  var tableHead = document.getElementById('admin-table-head');
  var tableBody = document.getElementById('admin-table-body');
  var exportCsv = document.getElementById('export-csv');
  var exportXlsx = document.getElementById('export-xlsx');
  var exportPdf = document.getElementById('export-pdf');
  var passwordToggle = document.getElementById('admin-password-toggle');
  var passwordInput = document.getElementById('admin-login-password');
  var tabButtons = document.querySelectorAll('[data-admin-tab]');

  var currentRows = [];
  var currentView = 'newsletter';
  var client = null;

  function isWhatsAppView() {
    return currentView === 'whatsapp';
  }

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
    if (dashboardView) {
      dashboardView.hidden = false;
    }
  }

  function withTimeout(promise, ms, message) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error(message || 'Tempo esgotado. Tente novamente.'));
        }, ms);
      })
    ]);
  }

  function canUseLocalStorage() {
    try {
      var key = '__zita_auth_test__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function signInAdmin(email, password) {
    var supabaseClient = getClient();
    var response = await fetch(
      window.SUPABASE_URL + '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        headers: {
          apikey: window.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      }
    );

    var payload = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      var errMsg = payload.error_description || payload.msg || payload.message || 'E-mail ou senha inválidos.';
      throw new Error(errMsg);
    }

    var sessionResult = await supabaseClient.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token
    });

    if (sessionResult.error) {
      throw sessionResult.error;
    }

    return sessionResult;
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

    if (period === 'todos') {
      return { start: null, end: end };
    }

    var days = ['7', '14', '30', '60', '90'].indexOf(period) !== -1 ? parseInt(period, 10) : 30;
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    return { start: start, end: end };
  }

  function toggleCustomDates() {
    var isCustom = periodSelect && periodSelect.value === 'personalizado';
    var datesWrap = document.getElementById('admin-dates');

    if (datesWrap) datesWrap.hidden = !isCustom;
    if (customStart) customStart.disabled = !isCustom;
    if (customEnd) customEnd.disabled = !isCustom;
  }

  function shortText(value, max) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  function syncTableHead() {
    if (!tableHead) return;
    if (isWhatsAppView()) {
      tableHead.innerHTML = '<tr><th>Nome</th><th>Cadastro</th><th></th></tr>';
      return;
    }
    tableHead.innerHTML = '<tr><th>E-mail</th><th>Página</th><th>Cadastro</th></tr>';
  }

  function renderTable(rows) {
    currentRows = rows;
    syncTableHead();

    if (countEl) {
      countEl.textContent = isWhatsAppView()
        ? rows.length + ' leads no período'
        : rows.length + ' inscritos no período';
    }

    if (!tableBody) return;

    var cols = 3;

    if (!rows.length) {
      tableBody.innerHTML =
        '<tr><td colspan="' + cols + '" class="admin-email__empty">Nenhum cadastro encontrado.</td></tr>';
      return;
    }

    if (isWhatsAppView()) {
      tableBody.innerHTML = rows.map(function (row, index) {
        return (
          '<tr>' +
          '<td>' + escapeHtml(row.nome || '—') + '</td>' +
          '<td>' + escapeHtml(formatDateTime(row.created_at)) + '</td>' +
          '<td class="admin-email__actions">' +
          '<button type="button" class="admin-email__detail-btn" data-wa-detail="' + index + '">Ver detalhes</button>' +
          '</td>' +
          '</tr>'
        );
      }).join('');
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

  var detailModal = document.getElementById('wa-detail-modal');
  var detailBody = document.getElementById('wa-detail-body');
  var detailClose = document.getElementById('wa-detail-close');
  var detailTitle = document.getElementById('wa-detail-title');

  function closeWaDetail() {
    if (detailModal) detailModal.hidden = true;
  }

  function openWaDetail(row) {
    if (!detailModal || !detailBody || !row) return;
    if (detailTitle) {
      detailTitle.textContent = row.nome ? String(row.nome) : 'Detalhes do lead';
    }
    detailBody.innerHTML =
      '<div><dt>Nome</dt><dd>' + escapeHtml(row.nome || '—') + '</dd></div>' +
      '<div><dt>E-mail</dt><dd><a href="mailto:' + escapeHtml(row.email || '') + '">' + escapeHtml(row.email || '—') + '</a></dd></div>' +
      '<div><dt>Telefone</dt><dd>' + escapeHtml(row.telefone || '—') + '</dd></div>' +
      '<div><dt>Motivo da busca</dt><dd class="admin-email__detail-questao">' + escapeHtml(row.questao || '—') + '</dd></div>' +
      '<div><dt>Página</dt><dd>' + escapeHtml(row.page || '—') + '</dd></div>' +
      '<div><dt>Cadastro</dt><dd>' + escapeHtml(formatDateTime(row.created_at)) + '</dd></div>';
    detailModal.hidden = false;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadRows() {
    var supabaseClient = getClient();
    var range = getPeriodRange();
    var search = searchInput ? searchInput.value.trim() : '';
    var query;

    if (isWhatsAppView()) {
      query = supabaseClient
        .from('wa_leads')
        .select('id, nome, email, telefone, questao, page, created_at')
        .lte('created_at', range.end.toISOString())
        .order('created_at', { ascending: false });
    } else {
      query = supabaseClient
        .from('newsletter_subscribers')
        .select('id, email, source_page, created_at')
        .lte('created_at', range.end.toISOString())
        .order('created_at', { ascending: false });
    }

    if (range.start) {
      query = query.gte('created_at', range.start.toISOString());
    }

    if (search) {
      if (isWhatsAppView()) {
        var term = search.replace(/,/g, ' ').replace(/%/g, '');
        query = query.or(
          'email.ilike.%' + term + '%,' +
          'nome.ilike.%' + term + '%,' +
          'telefone.ilike.%' + term + '%'
        );
      } else {
        query = query.ilike('email', '%' + search + '%');
      }
    }

    var result = await query;

    if (result.error) {
      console.error('Admin load error:', result.error);
      renderTable([]);
      return;
    }

    renderTable(result.data || []);
  }

  function setView(view) {
    currentView = view === 'whatsapp' ? 'whatsapp' : 'newsletter';
    closeWaDetail();
    tabButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-admin-tab') === currentView;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    return loadRows();
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

  function exportPrefix() {
    return isWhatsAppView() ? 'whatsapp_' : 'newsletter_';
  }

  function exportAsCsv() {
    var lines = isWhatsAppView()
      ? ['Nome;E-mail;Telefone;Questão;Página;Cadastro']
      : ['E-mail;Página;Cadastro'];

    currentRows.forEach(function (row) {
      if (isWhatsAppView()) {
        lines.push([
          '"' + String(row.nome || '').replace(/"/g, '""') + '"',
          '"' + String(row.email || '').replace(/"/g, '""') + '"',
          '"' + String(row.telefone || '').replace(/"/g, '""') + '"',
          '"' + String(row.questao || '').replace(/"/g, '""') + '"',
          '"' + String(row.page || '').replace(/"/g, '""') + '"',
          '"' + formatDateTime(row.created_at).replace(/"/g, '""') + '"'
        ].join(';'));
        return;
      }

      lines.push([
        '"' + String(row.email).replace(/"/g, '""') + '"',
        '"' + String(row.source_page || '').replace(/"/g, '""') + '"',
        '"' + formatDateTime(row.created_at).replace(/"/g, '""') + '"'
      ].join(';'));
    });

    var blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

    downloadBlob(exportPrefix() + fileStamp() + '.csv', blob);
  }

  function exportAsXlsx() {
    if (!window.XLSX) return;

    var sheetData = isWhatsAppView()
      ? [['Nome', 'E-mail', 'Telefone', 'Questão', 'Página', 'Cadastro']]
      : [['E-mail', 'Página', 'Cadastro']];

    currentRows.forEach(function (row) {
      if (isWhatsAppView()) {
        sheetData.push([
          row.nome || '',
          row.email || '',
          row.telefone || '',
          row.questao || '',
          row.page || '',
          formatDateTime(row.created_at)
        ]);
        return;
      }

      sheetData.push([
        row.email,
        row.source_page || '',
        formatDateTime(row.created_at)
      ]);
    });

    var worksheet = window.XLSX.utils.aoa_to_sheet(sheetData);
    var workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      isWhatsAppView() ? 'WhatsApp' : 'Inscritos'
    );
    window.XLSX.writeFile(workbook, exportPrefix() + fileStamp() + '.xlsx');
  }

  function exportAsPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) return;

    var doc = new window.jspdf.jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text(isWhatsAppView() ? 'Leads do WhatsApp' : 'Inscritos da newsletter', 14, 16);
    doc.setFontSize(10);
    doc.text('Total: ' + currentRows.length, 14, 24);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 30,
        head: isWhatsAppView()
          ? [['Nome', 'E-mail', 'Telefone', 'Questão', 'Página', 'Cadastro']]
          : [['E-mail', 'Página', 'Cadastro']],
        body: currentRows.map(function (row) {
          if (isWhatsAppView()) {
            return [
              row.nome || '—',
              row.email || '—',
              row.telefone || '—',
              shortText(row.questao || '', 120) || '—',
              shortText(row.page || '', 40) || '—',
              formatDateTime(row.created_at)
            ];
          }
          return [
            row.email,
            row.source_page || '—',
            formatDateTime(row.created_at)
          ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [156, 99, 111] }
      });
    }

    doc.save(exportPrefix() + fileStamp() + '.pdf');
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
        await loadRows();
      } else {
        showLogin();
      }

      supabaseClient.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_IN') {
          showDashboard();
          loadRows();
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

      var emailInput = document.getElementById('admin-login-email');
      var passwordField = document.getElementById('admin-login-password');
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

      if (!canUseLocalStorage()) {
        showLoginError('O navegador bloqueou o armazenamento local. Desative o modo anônimo ou permita cookies para este site.');
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Entrando...';
      }

      try {
        await withTimeout(
          signInAdmin(email, password),
          20000,
          'O servidor demorou para responder. Verifique sua internet e tente novamente.'
        );

        showDashboard();
        await loadRows();
      } catch (err) {
        console.error('Admin login exception:', err);
        var message = err && err.message ? err.message : '';

        if (/invalid login credentials/i.test(message)) {
          showLoginError('E-mail ou senha inválidos.');
        } else if (/email not confirmed/i.test(message)) {
          showLoginError('E-mail ainda não confirmado. Recrie o usuário com "Auto Confirm User" marcado.');
        } else if (/email provider.*disabled/i.test(message)) {
          showLoginError('Login por e-mail desativado no Supabase. Ative em Authentication → Providers → Email.');
        } else {
          showLoginError(message || 'Erro ao conectar. Recarregue a página e tente novamente.');
        }
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
      loadRows().catch(function (err) {
        console.error('Filter error:', err);
      });
    });
  }

  if (periodSelect) {
    periodSelect.addEventListener('change', toggleCustomDates);
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setView(btn.getAttribute('data-admin-tab')).catch(function (err) {
        console.error('Tab switch error:', err);
      });
    });
  });

  if (tableBody) {
    tableBody.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest
        ? event.target.closest('[data-wa-detail]')
        : null;
      if (!btn) return;
      var index = parseInt(btn.getAttribute('data-wa-detail'), 10);
      if (Number.isNaN(index) || !currentRows[index]) return;
      openWaDetail(currentRows[index]);
    });
  }

  if (detailClose) {
    detailClose.addEventListener('click', closeWaDetail);
  }

  if (detailModal) {
    detailModal.addEventListener('click', function (event) {
      if (event.target === detailModal) closeWaDetail();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && detailModal && !detailModal.hidden) {
      closeWaDetail();
    }
  });

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
