(function () {
  const STORAGE_KEY_MORADAS = "smartdelivery-moradas";

  function getClienteIdFromUrl() {
    return new URLSearchParams(window.location.search).get("clienteId");
  }

  function getMoradasByCliente(clienteId) {
    const raw = window.localStorage.getItem(STORAGE_KEY_MORADAS);
    if (!raw) return [];
    try {
      const todas = JSON.parse(raw);
      return Array.isArray(todas) ? todas.filter(function (m) { return m.clienteId === clienteId; }) : [];
    } catch (e) { return []; }
  }

  function saveMorada(morada) {
    const raw = window.localStorage.getItem(STORAGE_KEY_MORADAS);
    let todas = [];
    try { todas = JSON.parse(raw) || []; } catch (e) { todas = []; }
    if (!Array.isArray(todas)) todas = [];
    if (morada.principal) {
      todas = todas.map(function (m) {
        if (m.clienteId === morada.clienteId) m.principal = false;
        return m;
      });
    }
    const idx = todas.findIndex(function (m) { return m.id === morada.id; });
    if (idx >= 0) { todas[idx] = morada; } else { todas.push(morada); }
    window.localStorage.setItem(STORAGE_KEY_MORADAS, JSON.stringify(todas));
  }

  function removeMorada(moradaId) {
    const raw = window.localStorage.getItem(STORAGE_KEY_MORADAS);
    let todas = [];
    try { todas = JSON.parse(raw) || []; } catch (e) { todas = []; }
    todas = todas.filter(function (m) { return m.id !== moradaId; });
    window.localStorage.setItem(STORAGE_KEY_MORADAS, JSON.stringify(todas));
  }

  function setMoradaPrincipal(moradaId, clienteId) {
    const raw = window.localStorage.getItem(STORAGE_KEY_MORADAS);
    let todas = [];
    try { todas = JSON.parse(raw) || []; } catch (e) { todas = []; }
    todas = todas.map(function (m) {
      if (m.clienteId === clienteId) m.principal = (m.id === moradaId);
      return m;
    });
    window.localStorage.setItem(STORAGE_KEY_MORADAS, JSON.stringify(todas));
  }

  function getTipoIcon(tipo) {
    if (tipo === "Casa") return "🏠";
    if (tipo === "Trabalho") return "💼";
    return "📦";
  }

  function syncBreadcrumbAndLinks(clienteId) {
    if (!clienteId) return;
    var breadcrumb = document.querySelector("[data-cliente-breadcrumb]");
    if (breadcrumb && typeof getClienteById === "function") {
      var c = getClienteById(clienteId);
      if (c) {
        breadcrumb.textContent = c.tipo === "Empresa" ? c.nomeEmpresa : c.nome;
      }
    }
    var btnVoltar = document.getElementById("btnVoltar");
    if (btnVoltar) btnVoltar.href = "detalhe-cliente.Html?id=" + clienteId;

    var btnNovaMorada = document.getElementById("btnNovaMorada");
    if (btnNovaMorada) btnNovaMorada.href = "registo-morada.Html?clienteId=" + clienteId;

    var btnCancelar = document.getElementById("btnCancelar");
    if (btnCancelar) btnCancelar.href = "lista-moradas.Html?clienteId=" + clienteId;

    var linkListaMoradas = document.getElementById("linkListaMoradas");
    if (linkListaMoradas) linkListaMoradas.href = "lista-moradas.Html?clienteId=" + clienteId;

    var btnAdicionarMorada = document.getElementById("btnAdicionarMorada");
    if (btnAdicionarMorada) btnAdicionarMorada.href = "registo-morada.Html?clienteId=" + clienteId;

    var btnAdicionarMoradaPanel = document.getElementById("btnAdicionarMoradaPanel");
    if (btnAdicionarMoradaPanel) btnAdicionarMoradaPanel.href = "registo-morada.Html?clienteId=" + clienteId;
  }

  // ── Lista de Moradas ───────────────────────────────────────────────────────

  function renderListaMoradasPage() {
    var tbody = document.querySelector("[data-moradas-lista]");
    if (!tbody) return;

    var clienteId = getClienteIdFromUrl();
    syncBreadcrumbAndLinks(clienteId);

    var moradas = clienteId ? getMoradasByCliente(clienteId) : [];
    var totalEl = document.querySelector("[data-total-moradas]");
    var principalEl = document.querySelector("[data-total-principal]");
    var alternativasEl = document.querySelector("[data-total-alternativas]");
    var resumoEl = document.querySelector("[data-moradas-resumo]");

    if (totalEl) totalEl.textContent = moradas.length;
    if (principalEl) principalEl.textContent = moradas.filter(function (m) { return m.principal; }).length;
    if (alternativasEl) alternativasEl.textContent = moradas.filter(function (m) { return !m.principal; }).length;
    if (resumoEl) resumoEl.textContent = "A mostrar " + moradas.length + " morada(s)";

    tbody.innerHTML = "";

    if (!moradas.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">Sem moradas registadas. <a href="registo-morada.Html?clienteId=' + clienteId + '" class="btn-link">Adicionar morada</a>.</td></tr>';
      return;
    }

    var pendingRemoveId = null;

    moradas.forEach(function (m) {
      var tr = document.createElement("tr");
      var estadoBadge = m.principal
        ? '<span class="badge badge-success">● Principal</span>'
        : '<span class="badge badge-muted">Alternativa</span>';
      var setPrincipalBtn = !m.principal
        ? '<button class="btn btn-secondary btn-sm" data-set-principal="' + m.id + '">Definir principal</button>'
        : "";

      tr.innerHTML =
        "<td>" +
          "<div style='font-weight:600;'>" + m.rua + ", " + m.numero + "</div>" +
          "<div style='font-size:12px;color:var(--text-muted);margin-top:2px;'>Registada em " + (m.registadaEm || "—") + "</div>" +
        "</td>" +
        "<td>" + m.codigoPostal + "</td>" +
        "<td>" + m.cidade + "</td>" +
        "<td><span class='tag'>" + getTipoIcon(m.tipo) + " " + m.tipo + "</span></td>" +
        "<td>" + estadoBadge + "</td>" +
        "<td>" +
          "<div class='table-actions'>" +
            "<a href='registo-morada.Html?clienteId=" + clienteId + "&moradaId=" + m.id + "' class='btn btn-secondary btn-sm'>Editar</a>" +
            setPrincipalBtn +
            "<button class='btn btn-danger btn-sm' data-remover='" + m.id + "'>Remover</button>" +
          "</div>" +
        "</td>";
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-remover]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pendingRemoveId = this.getAttribute("data-remover");
        document.getElementById("modalRemover").style.display = "flex";
      });
    });

    tbody.querySelectorAll("[data-set-principal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMoradaPrincipal(this.getAttribute("data-set-principal"), clienteId);
        renderListaMoradasPage();
      });
    });

    var btnConfirmar = document.getElementById("btnConfirmarRemover");
    if (btnConfirmar) {
      btnConfirmar.onclick = function () {
        if (pendingRemoveId) {
          removeMorada(pendingRemoveId);
          pendingRemoveId = null;
          document.getElementById("modalRemover").style.display = "none";
          renderListaMoradasPage();
        }
      };
    }
  }

  // ── Registo de Morada ──────────────────────────────────────────────────────

  function renderRegistoMoradaPage() {
    var form = document.querySelector("[data-morada-form]");
    if (!form) return;

    var params = new URLSearchParams(window.location.search);
    var clienteId = params.get("clienteId");
    var moradaId = params.get("moradaId");
    var errorMsg = document.querySelector("[data-form-error]");
    var successMsg = document.getElementById("successMsg");

    syncBreadcrumbAndLinks(clienteId);

    if (moradaId && clienteId) {
      var moradas = getMoradasByCliente(clienteId);
      var moradaExistente = moradas.find(function (m) { return m.id === moradaId; }) || null;
      if (moradaExistente) {
        form.querySelector("[name='rua']").value = moradaExistente.rua || "";
        form.querySelector("[name='numero']").value = moradaExistente.numero || "";
        form.querySelector("[name='codigoPostal']").value = moradaExistente.codigoPostal || "";
        form.querySelector("[name='cidade']").value = moradaExistente.cidade || "";
        form.querySelector("[name='tipo']").value = moradaExistente.tipo || "";
        form.querySelector("[name='distrito']").value = moradaExistente.distrito || "";
        form.querySelector("[name='instrucoes']").value = moradaExistente.instrucoes || "";
        form.querySelector("[name='principal']").checked = !!moradaExistente.principal;

        var pageTitle = document.querySelector(".page-title");
        var topbarTitle = document.querySelector(".topbar-title");
        if (pageTitle) pageTitle.textContent = "Editar Morada";
        if (topbarTitle) topbarTitle.textContent = "Editar Morada";
        var submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.lastChild.textContent = " Guardar Alterações";
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var fd = new FormData(form);
      var rua = String(fd.get("rua") || "").trim();
      var numero = String(fd.get("numero") || "").trim();
      var codigoPostal = String(fd.get("codigoPostal") || "").trim();
      var cidade = String(fd.get("cidade") || "").trim();
      var tipo = String(fd.get("tipo") || "").trim();
      var principal = form.querySelector("[name='principal']").checked;

      if (!rua || !numero || !codigoPostal || !cidade || !tipo) {
        if (errorMsg) errorMsg.style.display = "flex";
        if (successMsg) successMsg.style.display = "none";
        return;
      }

      var hoje = new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit", month: "short", year: "numeric"
      }).format(new Date());

      saveMorada({
        id: moradaId || ("mor-" + Date.now()),
        clienteId: clienteId,
        rua: rua,
        numero: numero,
        codigoPostal: codigoPostal,
        cidade: cidade,
        tipo: tipo,
        distrito: String(fd.get("distrito") || "").trim(),
        instrucoes: String(fd.get("instrucoes") || "").trim(),
        principal: principal,
        registadaEm: moradaId ? undefined : hoje
      });

      form.reset();
      if (errorMsg) errorMsg.style.display = "none";
      if (successMsg) successMsg.style.display = "flex";
    });
  }

  // ── Seleção de Morada ──────────────────────────────────────────────────────

  var moradaSelecionadaId = null;

  function renderSelecaoMoradaPage() {
    var lista = document.getElementById("listaMoradasSelecao");
    if (!lista) return;

    var params = new URLSearchParams(window.location.search);
    var clienteId = params.get("clienteId");
    syncBreadcrumbAndLinks(clienteId);

    if (clienteId && typeof getClienteById === "function") {
      var c = getClienteById(clienteId);
      if (c) {
        var nome = c.tipo === "Empresa" ? c.nomeEmpresa : c.nome;
        var ctx = document.getElementById("contextCard");
        var nomeCtx = document.getElementById("nomeClienteCtx");
        var subtitulo = document.getElementById("subtituloSelecao");
        if (ctx) ctx.style.display = "flex";
        if (nomeCtx) nomeCtx.textContent = nome;
        if (subtitulo) subtitulo.textContent = "Escolha a morada de entrega para a encomenda de " + nome + ".";
      }
    }

    var moradas = clienteId ? getMoradasByCliente(clienteId) : [];

    if (!moradas.length) {
      lista.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">Sem moradas registadas. <a href="registo-morada.Html?clienteId=' + clienteId + '" class="btn-link">Adicionar morada</a>.</div>';
      return;
    }

    lista.innerHTML = "";
    var defaultMorada = moradas.find(function (m) { return m.principal; }) || moradas[0];
    moradaSelecionadaId = defaultMorada.id;

    moradas.forEach(function (m) {
      var card = document.createElement("div");
      card.className = "morada-card" + (m.id === moradaSelecionadaId ? " selected" : "");
      card.id = "morada-card-" + m.id;
      var estadoBadge = m.principal
        ? '<span class="badge badge-success">● Principal</span>'
        : '<span class="badge badge-muted">Alternativa</span>';

      card.innerHTML =
        '<div class="morada-radio" id="radio-' + m.id + '"></div>' +
        '<div class="morada-info">' +
          '<div class="morada-rua">' + m.rua + ", " + m.numero + "</div>" +
          '<div class="morada-detalhe">' + m.codigoPostal + " " + m.cidade + (m.instrucoes ? " · " + m.instrucoes : "") + "</div>" +
          '<div class="morada-tags"><span class="tag">' + getTipoIcon(m.tipo) + " " + m.tipo + "</span>" + estadoBadge + "</div>" +
        "</div>";

      card.addEventListener("click", function () { selecionarMorada(m.id, moradas); });
      lista.appendChild(card);
    });

    atualizarPainelConfirmacao(defaultMorada);
  }

  function selecionarMorada(id, moradas) {
    moradaSelecionadaId = id;
    moradas.forEach(function (m) {
      var card = document.getElementById("morada-card-" + m.id);
      if (card) card.classList.toggle("selected", m.id === id);
    });
    var morada = moradas.find(function (m) { return m.id === id; });
    if (morada) atualizarPainelConfirmacao(morada);
  }

  function atualizarPainelConfirmacao(m) {
    var painel = document.getElementById("moradaSelecionadaDetalhe");
    var btnUsar = document.getElementById("btnUsarMorada");
    if (!painel) return;
    painel.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:#e8f2f1;color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;">' + getTipoIcon(m.tipo) + "</div>" +
        "<div>" +
          '<div style="font-weight:600;font-size:14px;">' + m.rua + ", " + m.numero + "</div>" +
          '<div style="font-size:12px;color:var(--text-muted);">' + m.tipo + (m.principal ? " · Principal" : " · Alternativa") + "</div>" +
        "</div></div>" +
      '<div class="detail-grid" style="grid-template-columns:1fr;">' +
        "<div><div class='detail-label'>Código Postal</div><div class='detail-value'>" + m.codigoPostal + "</div></div>" +
        "<div><div class='detail-label'>Cidade</div><div class='detail-value'>" + m.cidade + "</div></div>" +
        "<div><div class='detail-label'>Instruções</div><div class='detail-value'>" + (m.instrucoes || "—") + "</div></div>" +
      "</div>";
    if (btnUsar) btnUsar.removeAttribute("disabled");
  }

  window.confirmarMorada = function () {
    var clienteId = getClienteIdFromUrl();
    var moradas = clienteId ? getMoradasByCliente(clienteId) : [];
    var m = moradas.find(function (x) { return x.id === moradaSelecionadaId; });
    if (!m) return;
    var alerta = document.getElementById("alertaSucesso");
    var confirmadaEl = document.getElementById("moradaConfirmada");
    if (confirmadaEl) confirmadaEl.textContent = m.rua + ", " + m.numero;
    if (alerta) { alerta.style.display = "flex"; alerta.scrollIntoView({ behavior: "smooth" }); }
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderListaMoradasPage();
    renderRegistoMoradaPage();
    renderSelecaoMoradaPage();
  });
})();