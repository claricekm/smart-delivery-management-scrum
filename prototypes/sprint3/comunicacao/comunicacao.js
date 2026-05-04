(function () {
  const KEY_NOTIF  = "smartdelivery-notificacoes";
  const KEY_AVISOS = "smartdelivery-avisos";

  function getAll(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }

  function saveAll(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function addItem(key, item) {
    var list = getAll(key);
    list.unshift(item);
    saveAll(key, list);
  }

  function seedIfEmpty() {
    if (!getAll(KEY_NOTIF).length) {
      saveAll(KEY_NOTIF, [
        { id: "notif-001", encomendaId: "#1021", clienteNome: "João Silva",   estado: "Entregue",        canal: "Email", enviadaEm: "2026-05-03T14:22:00", previsao: "",                    lida: true  },
        { id: "notif-002", encomendaId: "#1018", clienteNome: "Empresa XPTO", estado: "Em Distribuição", canal: "Ambos", enviadaEm: "2026-05-04T09:10:00", previsao: "2026-05-04T14:00:00", lida: false },
        { id: "notif-003", encomendaId: "#0975", clienteNome: "João Silva",   estado: "Cancelada",       canal: "SMS",   enviadaEm: "2026-04-03T11:05:00", previsao: "",                    lida: true  }
      ]);
    }
    if (!getAll(KEY_AVISOS).length) {
      saveAll(KEY_AVISOS, [
        { id: "aviso-001", entregaId: "ENT-042", clienteNome: "Empresa XPTO", tipo: "Atraso",        motivo: "Trânsito",                novaData: "2026-05-04T17:00:00", canal: "Email", enviadoEm: "2026-05-04T10:30:00", lido: false },
        { id: "aviso-002", entregaId: "ENT-039", clienteNome: "João Silva",   tipo: "Reagendamento", motivo: "Condições meteorológicas", novaData: "2026-05-05T10:00:00", canal: "Ambos", enviadoEm: "2026-05-03T18:45:00", lido: true  }
      ]);
    }
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso));
  }

  function estadoBadge(estado) {
    var map = {
      "Em Distribuição": "badge-info",
      "Entregue":        "badge-success",
      "Cancelada":       "badge-error",
      "Pendente":        "badge-warning"
    };
    return '<span class="badge ' + (map[estado] || "badge-muted") + '">' + estado + '</span>';
  }

  function canalBadge(canal) {
    var map = { "Email": "badge-info", "SMS": "badge-warning", "Ambos": "badge-success" };
    return '<span class="badge ' + (map[canal] || "badge-muted") + '">' + canal + '</span>';
  }

  function tipoBadge(tipo) {
    return tipo === "Reagendamento"
      ? '<span class="badge badge-info">📅 Reagendamento</span>'
      : '<span class="badge badge-warning">⚠️ Atraso</span>';
  }

  function lidaBadge(lido) {
    return lido
      ? '<span class="badge badge-success">✓ Lida</span>'
      : '<span class="badge badge-muted">Pendente</span>';
  }

  // ── Página notificacao-estado ──────────────────────────────────────────────

  function renderNotificacaoEstadoPage() {
    var tbody = document.querySelector("[data-notificacoes-lista]");
    if (!tbody) return;

    seedIfEmpty();

    var searchInput  = document.querySelector("[data-notif-search]");
    var filterEstado = document.querySelector("[data-notif-filter-estado]");
    var filterCanal  = document.querySelector("[data-notif-filter-canal]");
    var resumoEl     = document.querySelector("[data-notif-resumo]");

    function render() {
      var notifs  = getAll(KEY_NOTIF);
      var termo   = (searchInput  ? searchInput.value  : "").toLowerCase().trim();
      var estado  = filterEstado  ? filterEstado.value  : "";
      var canal   = filterCanal   ? filterCanal.value   : "";

      var filtradas = notifs.filter(function (n) {
        var mTermo  = !termo  || n.encomendaId.toLowerCase().includes(termo) || n.clienteNome.toLowerCase().includes(termo);
        var mEstado = !estado || n.estado === estado;
        var mCanal  = !canal  || n.canal  === canal;
        return mTermo && mEstado && mCanal;
      });

      var totalEl = document.querySelector("[data-total-notificacoes]");
      var entEl   = document.querySelector("[data-total-entregues]");
      var distEl  = document.querySelector("[data-total-distribuicao]");
      var canEl   = document.querySelector("[data-total-canceladas]");
      if (totalEl) totalEl.textContent = notifs.length;
      if (entEl)   entEl.textContent   = notifs.filter(function(n){ return n.estado === "Entregue"; }).length;
      if (distEl)  distEl.textContent  = notifs.filter(function(n){ return n.estado === "Em Distribuição"; }).length;
      if (canEl)   canEl.textContent   = notifs.filter(function(n){ return n.estado === "Cancelada"; }).length;

      tbody.innerHTML = "";
      if (!filtradas.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px;">Sem notificações registadas.</td></tr>';
        if (resumoEl) resumoEl.textContent = "Sem resultados.";
        return;
      }

      filtradas.forEach(function (n) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td><strong>" + n.encomendaId + "</strong></td>" +
          "<td>" + n.clienteNome + "</td>" +
          "<td>" + estadoBadge(n.estado) + "</td>" +
          "<td>" + canalBadge(n.canal) + "</td>" +
          "<td>" + fmtDate(n.enviadaEm) + "</td>" +
          "<td>" + (n.previsao ? fmtDate(n.previsao) : "—") + "</td>" +
          "<td><div class='table-actions'>" +
            "<button class='btn btn-secondary btn-sm' data-ver='" + n.id + "'>Ver</button>" +
          "</div></td>";
        tbody.appendChild(tr);
      });

      if (resumoEl) resumoEl.textContent = "A mostrar " + filtradas.length + " de " + notifs.length + " notificações";

      tbody.querySelectorAll("[data-ver]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-ver");
          var n  = getAll(KEY_NOTIF).find(function (x) { return x.id === id; });
          if (!n) return;
          document.getElementById("modalDetalheConteudo").innerHTML =
            '<div class="detail-grid" style="grid-template-columns:1fr;">' +
              "<div><div class='detail-label'>ID Encomenda</div><div class='detail-value'>" + n.encomendaId + "</div></div>" +
              "<div><div class='detail-label'>Cliente</div><div class='detail-value'>" + n.clienteNome + "</div></div>" +
              "<div><div class='detail-label'>Novo Estado</div><div class='detail-value'>" + estadoBadge(n.estado) + "</div></div>" +
              "<div><div class='detail-label'>Canal</div><div class='detail-value'>" + canalBadge(n.canal) + "</div></div>" +
              "<div><div class='detail-label'>Enviada em</div><div class='detail-value'>" + fmtDate(n.enviadaEm) + "</div></div>" +
              "<div><div class='detail-label'>Previsão de Entrega</div><div class='detail-value'>" + (n.previsao ? fmtDate(n.previsao) : "—") + "</div></div>" +
            "</div>";
          document.getElementById("modalDetalhe").style.display = "flex";
        });
      });
    }

    render();
    if (searchInput)  searchInput.addEventListener("input", render);
    if (filterEstado) filterEstado.addEventListener("change", render);
    if (filterCanal)  filterCanal.addEventListener("change", render);

    var btnEnviar = document.getElementById("btnConfirmarEnvio");
    if (btnEnviar) {
      btnEnviar.addEventListener("click", function () {
        var encId    = (document.getElementById("modalEncomendaId").value || "").trim();
        var estado   = document.getElementById("modalEstado").value;
        var previsao = document.getElementById("modalPrevisao").value;
        var canal    = document.getElementById("modalCanal").value;
        if (!encId || !estado) return;
        addItem(KEY_NOTIF, {
          id: "notif-" + Date.now(),
          encomendaId: encId,
          clienteNome: "—",
          estado: estado,
          canal: canal,
          enviadaEm: new Date().toISOString(),
          previsao: previsao || "",
          lida: false
        });
        document.getElementById("modalEncomendaId").value = "";
        document.getElementById("modalEstado").value = "";
        document.getElementById("modalPrevisao").value = "";
        document.getElementById("modalEnviar").style.display = "none";
        render();
      });
    }
  }

  // ── Página aviso-atraso ────────────────────────────────────────────────────

  function renderAvisoAtrasoPage() {
    var tbody = document.querySelector("[data-avisos-lista]");
    if (!tbody) return;

    seedIfEmpty();

    var searchInput  = document.querySelector("[data-aviso-search]");
    var filterTipo   = document.querySelector("[data-aviso-filter-tipo]");
    var filterMotivo = document.querySelector("[data-aviso-filter-motivo]");
    var resumoEl     = document.querySelector("[data-avisos-resumo]");

    function render() {
      var avisos  = getAll(KEY_AVISOS);
      var termo   = (searchInput  ? searchInput.value  : "").toLowerCase().trim();
      var tipo    = filterTipo    ? filterTipo.value    : "";
      var motivo  = filterMotivo  ? filterMotivo.value  : "";

      var filtrados = avisos.filter(function (a) {
        var mTermo  = !termo  || a.entregaId.toLowerCase().includes(termo) || a.clienteNome.toLowerCase().includes(termo);
        var mTipo   = !tipo   || a.tipo   === tipo;
        var mMotivo = !motivo || a.motivo === motivo;
        return mTermo && mTipo && mMotivo;
      });

      var totalEl = document.querySelector("[data-total-avisos]");
      var atraEl  = document.querySelector("[data-total-atrasos]");
      var reagEl  = document.querySelector("[data-total-reagendamentos]");
      var lidoEl  = document.querySelector("[data-total-lidos]");
      if (totalEl) totalEl.textContent = avisos.length;
      if (atraEl)  atraEl.textContent  = avisos.filter(function(a){ return a.tipo === "Atraso"; }).length;
      if (reagEl)  reagEl.textContent  = avisos.filter(function(a){ return a.tipo === "Reagendamento"; }).length;
      if (lidoEl)  lidoEl.textContent  = avisos.filter(function(a){ return a.lido; }).length;

      tbody.innerHTML = "";
      if (!filtrados.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px;">Sem avisos registados.</td></tr>';
        if (resumoEl) resumoEl.textContent = "Sem resultados.";
        return;
      }

      filtrados.forEach(function (a) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td><strong>" + a.entregaId + "</strong></td>" +
          "<td>" + a.clienteNome + "</td>" +
          "<td>" + tipoBadge(a.tipo) + "</td>" +
          "<td>" + a.motivo + "</td>" +
          "<td>" + fmtDate(a.novaData) + "</td>" +
          "<td>" + fmtDate(a.enviadoEm) + "</td>" +
          "<td>" + lidaBadge(a.lido) + "</td>" +
          "<td><div class='table-actions'>" +
            "<button class='btn btn-secondary btn-sm' data-ver='" + a.id + "'>Ver</button>" +
            (!a.lido ? "<button class='btn btn-secondary btn-sm' data-confirmar='" + a.id + "'>Confirmar leitura</button>" : "") +
          "</div></td>";
        tbody.appendChild(tr);
      });

      if (resumoEl) resumoEl.textContent = "A mostrar " + filtrados.length + " de " + avisos.length + " avisos";

      tbody.querySelectorAll("[data-ver]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-ver");
          var a  = getAll(KEY_AVISOS).find(function (x) { return x.id === id; });
          if (!a) return;
          document.getElementById("modalDetalheAvisoConteudo").innerHTML =
            '<div class="detail-grid" style="grid-template-columns:1fr;">' +
              "<div><div class='detail-label'>ID Entrega</div><div class='detail-value'>" + a.entregaId + "</div></div>" +
              "<div><div class='detail-label'>Cliente</div><div class='detail-value'>" + a.clienteNome + "</div></div>" +
              "<div><div class='detail-label'>Tipo</div><div class='detail-value'>" + tipoBadge(a.tipo) + "</div></div>" +
              "<div><div class='detail-label'>Motivo</div><div class='detail-value'>" + a.motivo + "</div></div>" +
              "<div><div class='detail-label'>Nova Data/Hora</div><div class='detail-value'>" + fmtDate(a.novaData) + "</div></div>" +
              "<div><div class='detail-label'>Canal</div><div class='detail-value'>" + canalBadge(a.canal) + "</div></div>" +
              "<div><div class='detail-label'>Enviado em</div><div class='detail-value'>" + fmtDate(a.enviadoEm) + "</div></div>" +
              "<div><div class='detail-label'>Leitura confirmada</div><div class='detail-value'>" + lidaBadge(a.lido) + "</div></div>" +
            "</div>";
          document.getElementById("modalDetalheAviso").style.display = "flex";
        });
      });

      tbody.querySelectorAll("[data-confirmar]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id     = this.getAttribute("data-confirmar");
          var avisos = getAll(KEY_AVISOS).map(function (a) {
            if (a.id === id) a.lido = true;
            return a;
          });
          saveAll(KEY_AVISOS, avisos);
          render();
        });
      });
    }

    render();
    if (searchInput)  searchInput.addEventListener("input",  render);
    if (filterTipo)   filterTipo.addEventListener("change",  render);
    if (filterMotivo) filterMotivo.addEventListener("change", render);

    var btnConfirmar = document.getElementById("btnConfirmarAviso");
    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", function () {
        var entregaId = (document.getElementById("avisoEntregaId").value || "").trim();
        var tipo      = document.getElementById("avisoTipo").value;
        var motivo    = document.getElementById("avisoMotivo").value;
        var novaData  = document.getElementById("avisoNovaData").value;
        var canal     = document.getElementById("avisoCanal").value;
        if (!entregaId || !tipo || !motivo || !novaData) return;
        if (tipo === "Reagendamento" && new Date(novaData) <= new Date()) {
          alert("A data de reagendamento deve ser uma data futura válida.");
          return;
        }
        addItem(KEY_AVISOS, {
          id: "aviso-" + Date.now(),
          entregaId: entregaId,
          clienteNome: "—",
          tipo: tipo,
          motivo: motivo,
          novaData: novaData,
          canal: canal,
          enviadoEm: new Date().toISOString(),
          lido: false
        });
        document.getElementById("avisoEntregaId").value = "";
        document.getElementById("avisoTipo").value = "";
        document.getElementById("avisoMotivo").value = "";
        document.getElementById("avisoNovaData").value = "";
        document.getElementById("modalAvisar").style.display = "none";
        var successMsg = document.getElementById("avisoSuccessMsg");
        if (successMsg) { successMsg.style.display = "flex"; setTimeout(function(){ successMsg.style.display = "none"; }, 4000); }
        render();
      });
    }
  }

  window.toggleReagendamento = function () {};

  document.addEventListener("DOMContentLoaded", function () {
    renderNotificacaoEstadoPage();
    renderAvisoAtrasoPage();
  });
})();