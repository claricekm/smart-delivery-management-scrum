(function () {
  var PER_PAGE = 8;
  var currentPage = 1;
  var allItems = [];

  function mergeAll() {
    var notifs = (JSON.parse(localStorage.getItem("smartdelivery-notificacoes")) || []).map(function (n) {
      return {
        id: n.id,
        data: n.enviadaEm,
        cliente: n.clienteNome,
        referencia: n.encomendaId,
        canal: n.canal,
        origem: "estado",
        conteudo: "Estado: " + n.estado,
        estado: n.lida ? "Enviado" : "Pendente"
      };
    });
    var avisos = (JSON.parse(localStorage.getItem("smartdelivery-avisos")) || []).map(function (a) {
      return {
        id: a.id,
        data: a.enviadoEm,
        cliente: a.clienteNome,
        referencia: a.entregaId,
        canal: a.canal,
        origem: "aviso",
        conteudo: a.tipo + " — " + a.motivo,
        estado: a.lido ? "Enviado" : "Pendente"
      };
    });
    return notifs.concat(avisos).sort(function (a, b) { return new Date(b.data) - new Date(a.data); });
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  }

  function estadoBadge(e) {
    if (e === "Enviado")  return '<span class="badge badge-success">' + e + '</span>';
    if (e === "Pendente") return '<span class="badge badge-warning">' + e + '</span>';
    return '<span class="badge badge-error">' + e + '</span>';
  }

  function origemBadge(o) {
    return o === "estado"
      ? '<span class="badge badge-info">🔔 Notif. Estado</span>'
      : '<span class="badge badge-warning">⚠️ Aviso Atraso</span>';
  }

  function canalBadge(c) {
    var map = { "Email": "badge-info", "SMS": "badge-warning", "Ambos": "badge-success" };
    return '<span class="badge ' + (map[c] || "badge-muted") + '">' + c + '</span>';
  }

  function renderPage(items) {
    var tbody    = document.querySelector("[data-hist-lista]");
    var resumoEl = document.querySelector("[data-hist-resumo]");
    var btnPrev  = document.getElementById("btnPrevPage");
    var btnNext  = document.getElementById("btnNextPage");
    var paginaEl = document.getElementById("paginaAtual");
    if (!tbody) return;

    var total = items.length;
    var pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (currentPage > pages) currentPage = pages;
    var start = (currentPage - 1) * PER_PAGE;
    var slice = items.slice(start, start + PER_PAGE);

    tbody.innerHTML = "";
    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px;">Sem notificações registadas.</td></tr>';
    } else {
      slice.forEach(function (n) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td><strong>" + n.id + "</strong></td>" +
          "<td style='white-space:nowrap;'>" + fmtDate(n.data) + "</td>" +
          "<td>" + n.cliente + "</td>" +
          "<td>" + n.referencia + "</td>" +
          "<td>" + canalBadge(n.canal) + "</td>" +
          "<td>" + origemBadge(n.origem) + "</td>" +
          "<td style='max-width:180px;font-size:12px;'>" + n.conteudo + "</td>" +
          "<td>" + estadoBadge(n.estado) + "</td>" +
          "<td><button class='btn btn-secondary btn-sm' data-ver='" + n.id + "'>Ver</button></td>";
        tbody.appendChild(tr);
      });
    }

    if (resumoEl) resumoEl.textContent = total ? (start + 1) + "–" + Math.min(start + PER_PAGE, total) + " de " + total + " notificações" : "Sem resultados";
    if (paginaEl) paginaEl.textContent = "Pág. " + currentPage + " / " + pages;
    if (btnPrev)  btnPrev.disabled = currentPage === 1;
    if (btnNext)  btnNext.disabled = currentPage >= pages;

    tbody.querySelectorAll("[data-ver]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = this.getAttribute("data-ver");
        var n  = allItems.find(function (x) { return x.id === id; });
        if (!n) return;
        document.getElementById("modalDetalheHistConteudo").innerHTML =
          '<div class="detail-grid" style="grid-template-columns:1fr;">' +
            "<div><div class='detail-label'>ID</div><div class='detail-value'>" + n.id + "</div></div>" +
            "<div><div class='detail-label'>Cliente</div><div class='detail-value'>" + n.cliente + "</div></div>" +
            "<div><div class='detail-label'>Referência</div><div class='detail-value'>" + n.referencia + "</div></div>" +
            "<div><div class='detail-label'>Canal</div><div class='detail-value'>" + canalBadge(n.canal) + "</div></div>" +
            "<div><div class='detail-label'>Origem</div><div class='detail-value'>" + origemBadge(n.origem) + "</div></div>" +
            "<div><div class='detail-label'>Conteúdo</div><div class='detail-value'>" + n.conteudo + "</div></div>" +
            "<div><div class='detail-label'>Data/Hora</div><div class='detail-value'>" + fmtDate(n.data) + "</div></div>" +
            "<div><div class='detail-label'>Estado</div><div class='detail-value'>" + estadoBadge(n.estado) + "</div></div>" +
          "</div>";
        document.getElementById("modalDetalheHist").style.display = "flex";
      });
    });
  }

  function applyFilters() {
    var search  = (document.querySelector("[data-hist-search]")        || {}).value || "";
    var tipo    = (document.querySelector("[data-hist-filter-tipo]")   || {}).value || "";
    var origem  = (document.querySelector("[data-hist-filter-origem]") || {}).value || "";
    var de      = (document.querySelector("[data-hist-filter-de]")     || {}).value || "";
    var ate     = (document.querySelector("[data-hist-filter-ate]")    || {}).value || "";
    var t       = search.toLowerCase().trim();

    var filtered = allItems.filter(function (n) {
      var mSearch = !t      || n.cliente.toLowerCase().includes(t) || n.referencia.toLowerCase().includes(t);
      var mTipo   = !tipo   || n.canal  === tipo;
      var mOrigem = !origem || n.origem === origem;
      var mDe     = !de     || new Date(n.data) >= new Date(de);
      var mAte    = !ate    || new Date(n.data) <= new Date(ate + "T23:59:59");
      return mSearch && mTipo && mOrigem && mDe && mAte;
    });

    currentPage = 1;

    var totalEl    = document.querySelector("[data-hist-total]");
    var enviadasEl = document.querySelector("[data-hist-enviadas]");
    var pendEl     = document.querySelector("[data-hist-pendentes]");
    var falhasEl   = document.querySelector("[data-hist-falhas]");
    if (totalEl)    totalEl.textContent    = allItems.length;
    if (enviadasEl) enviadasEl.textContent = allItems.filter(function(n){ return n.estado === "Enviado"; }).length;
    if (pendEl)     pendEl.textContent     = allItems.filter(function(n){ return n.estado === "Pendente"; }).length;
    if (falhasEl)   falhasEl.textContent   = allItems.filter(function(n){ return n.estado === "Falha"; }).length;

    renderPage(filtered);
    return filtered;
  }

  document.addEventListener("DOMContentLoaded", function () {
    allItems = mergeAll();
    var filtered = applyFilters();

    ["[data-hist-search]","[data-hist-filter-tipo]","[data-hist-filter-origem]","[data-hist-filter-de]","[data-hist-filter-ate]"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.addEventListener("input",  function () { filtered = applyFilters(); });
      if (el) el.addEventListener("change", function () { filtered = applyFilters(); });
    });

    var btnPrev = document.getElementById("btnPrevPage");
    var btnNext = document.getElementById("btnNextPage");
    if (btnPrev) btnPrev.addEventListener("click", function () { currentPage--; renderPage(filtered); });
    if (btnNext) btnNext.addEventListener("click", function () { currentPage++; renderPage(filtered); });

    var btnLimpar = document.getElementById("btnLimparFiltros");
    if (btnLimpar) btnLimpar.addEventListener("click", function () {
      document.querySelectorAll("[data-hist-search],[data-hist-filter-tipo],[data-hist-filter-origem],[data-hist-filter-de],[data-hist-filter-ate]").forEach(function(el){ el.value = ""; });
      filtered = applyFilters();
    });
  });
})();