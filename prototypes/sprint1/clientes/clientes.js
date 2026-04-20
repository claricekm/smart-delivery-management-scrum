(function () {
  const STORAGE_KEY = "smartdelivery-clientes";

  const defaultClientes = [
    {
      id: "cli-001",
      tipo: "Particular",
      nome: "João Silva",
      nomeEmpresa: "",
      email: "joao@exemplo.com",
      contacto: "912 345 678",
      nif: "123456789",
      morada: "Rua das Flores, 12, Lisboa",
      registadoEm: "2025-01-01",
      historico: [
        { id: "#1021", data: "2026-04-14", estado: "Entregue", valor: 12.5 },
        { id: "#0975", data: "2026-04-03", estado: "Cancelada", valor: 0 },
        { id: "#0950", data: "2026-03-27", estado: "Em distribuição", valor: 8.9 }
      ]
    },
    {
      id: "cli-002",
      tipo: "Empresa",
      nome: "Mariana Costa",
      nomeEmpresa: "Empresa XPTO",
      email: "contacto@xpto.com",
      contacto: "213 456 789",
      nif: "507654321",
      morada: "Avenida Central, 245, Porto",
      registadoEm: "2025-02-10",
      historico: [
        { id: "#1018", data: "2026-04-12", estado: "Entregue", valor: 42.3 },
        { id: "#1004", data: "2026-04-01", estado: "Entregue", valor: 18.75 }
      ]
    }
  ];

  function loadClientes() {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      saveClientes(defaultClientes);
      return [...defaultClientes];
    }

    try {
      const clientes = JSON.parse(raw);
      if (Array.isArray(clientes) && clientes.length > 0) {
        return clientes;
      }
    } catch (error) {
      console.error("Nao foi possivel ler os clientes guardados.", error);
    }

    saveClientes(defaultClientes);
    return [...defaultClientes];
  }

  function saveClientes(clientes) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  }

  function getClientes() {
    return loadClientes();
  }

  function getClienteById(id) {
    return getClientes().find((cliente) => cliente.id === id) || null;
  }

  function addCliente(cliente) {
    const clientes = getClientes();
    clientes.push(cliente);
    saveClientes(clientes);
  }

  function updateCliente(clienteAtualizado) {
    const clientes = getClientes().map((cliente) =>
      cliente.id === clienteAtualizado.id ? clienteAtualizado : cliente
    );
    saveClientes(clientes);
  }

  function getInitials(nome) {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join("");
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function formatCurrency(valor) {
    return `${Number(valor).toFixed(2)} EUR`;
  }

  function formatHistoryDate(dateString) {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-PT").format(date);
  }

  function getTipoTag(tipo) {
    return tipo === "Empresa" ? "🏢 Empresa" : "👤 Particular";
  }

  function getBadgeClass(estado) {
    if (estado === "Entregue") {
      return "badge-success";
    }

    if (estado === "Cancelada") {
      return "badge-error";
    }

    return "badge-warning";
  }

  function createClienteRow(cliente) {
    const tr = document.createElement("tr");
    const displayName = cliente.tipo === "Empresa" ? cliente.nomeEmpresa : cliente.nome;

    tr.innerHTML = `
      <td>
        <div class="courier-info">
          <div class="avatar">${getInitials(displayName)}</div>
          <div>
            <div class="courier-name">${displayName}</div>
            <div class="courier-meta">${cliente.email}</div>
          </div>
        </div>
      </td>
      <td>${cliente.contacto}</td>
      <td><span class="tag">${getTipoTag(cliente.tipo)}</span></td>
      <td>
        <div class="table-actions">
          <a href="detalhe-cliente.Html?id=${cliente.id}" class="btn btn-secondary btn-sm">Ver</a>
          <a href="registo-cliente.Html?id=${cliente.id}" class="btn btn-secondary btn-sm">Editar</a>
        </div>
      </td>
    `;

    return tr;
  }

  function renderListaPage() {
    const tableBody = document.querySelector("[data-clientes-lista]");
    if (!tableBody) {
      return;
    }

    const totalEl = document.querySelector("[data-total-clientes]");
    const particularesEl = document.querySelector("[data-total-particulares]");
    const empresasEl = document.querySelector("[data-total-empresas]");
    const resumoEl = document.querySelector("[data-clientes-resumo]");
    const searchInput = document.querySelector("[data-clientes-search]");
    const typeFilter = document.querySelector("[data-clientes-filter]");

    const clientes = getClientes();

    function renderRows() {
      const termo = (searchInput?.value || "").trim().toLowerCase();
      const tipo = typeFilter?.value || "";
      const filtrados = clientes.filter((cliente) => {
        const displayName = cliente.tipo === "Empresa" ? cliente.nomeEmpresa : cliente.nome;
        const matchesTerm =
          !termo ||
          displayName.toLowerCase().includes(termo) ||
          cliente.email.toLowerCase().includes(termo) ||
          cliente.nif.includes(termo);
        const matchesTipo = !tipo || cliente.tipo === tipo;

        return matchesTerm && matchesTipo;
      });

      tableBody.innerHTML = "";
      filtrados.forEach((cliente) => {
        tableBody.appendChild(createClienteRow(cliente));
      });

      if (resumoEl) {
        resumoEl.textContent = `A mostrar ${filtrados.length} de ${clientes.length} clientes`;
      }
    }

    if (totalEl) {
      totalEl.textContent = String(clientes.length);
    }

    if (particularesEl) {
      particularesEl.textContent = String(clientes.filter((cliente) => cliente.tipo === "Particular").length);
    }

    if (empresasEl) {
      empresasEl.textContent = String(clientes.filter((cliente) => cliente.tipo === "Empresa").length);
    }

    renderRows();

    searchInput?.addEventListener("input", renderRows);
    typeFilter?.addEventListener("change", renderRows);
  }

  function renderDetalhePage() {
    const detailRoot = document.querySelector("[data-cliente-detalhe]");
    if (!detailRoot) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get("id") || getClientes()[0]?.id;
    const cliente = getClienteById(clienteId);

    if (!cliente) {
      detailRoot.innerHTML = `
        <div class="alert alert-error">
          <div>Cliente nao encontrado.</div>
        </div>
      `;
      return;
    }

    const displayName = cliente.tipo === "Empresa" ? cliente.nomeEmpresa : cliente.nome;
    const historico = cliente.historico || [];
    const historicoRows = historico.length
      ? historico
          .map(
            (item) => `
              <tr>
                <td><strong>${item.id}</strong></td>
                <td>${formatHistoryDate(item.data)}</td>
                <td><span class="badge ${getBadgeClass(item.estado)}">${item.estado}</span></td>
                <td>${formatCurrency(item.valor)}</td>
              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td colspan="4" style="text-align:center;color:var(--text-muted);">Sem encomendas registadas.</td>
          </tr>
        `;

    detailRoot.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:20px;">
          <div style="width:60px;height:60px;border-radius:50%;background:#e8f2f1;color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">${getInitials(displayName)}</div>
          <div style="flex:1">
            <div style="font-size:19px;font-weight:700;">${displayName}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">${cliente.contacto} · ${cliente.email}</div>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
              <span class="tag">${getTipoTag(cliente.tipo)}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Registado em</div>
            <div style="font-size:13px;font-weight:600;margin-top:3px;">${formatDate(cliente.registadoEm)}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-label">Dados do Cliente</div>
        <div class="detail-grid">
          <div><div class="detail-label">Nome completo</div><div class="detail-value">${cliente.nome}</div></div>
          <div><div class="detail-label">Email</div><div class="detail-value">${cliente.email}</div></div>
          <div><div class="detail-label">Contacto</div><div class="detail-value">${cliente.contacto}</div></div>
          <div><div class="detail-label">Tipo</div><div class="detail-value">${cliente.tipo}</div></div>
          <div><div class="detail-label">NIF</div><div class="detail-value">${cliente.nif}</div></div>
          <div><div class="detail-label">Morada</div><div class="detail-value">${cliente.morada || "-"}</div></div>
          ${
            cliente.tipo === "Empresa"
              ? `<div><div class="detail-label">Nome da empresa</div><div class="detail-value">${cliente.nomeEmpresa}</div></div>`
              : ""
          }
        </div>
      </div>

      <div class="card">
        <div class="section-label">Historico de Encomendas</div>
        <table class="table">
          <thead>
            <tr>
              <th>ID Encomenda</th>
              <th>Data</th>
              <th>Estado</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>${historicoRows}</tbody>
        </table>
      </div>
    `;

    const breadcrumbName = document.querySelector("[data-cliente-breadcrumb]");
    if (breadcrumbName) {
      breadcrumbName.textContent = displayName;
    }

    const editLink = document.querySelector("[data-cliente-editar]");
    if (editLink) {
      editLink.setAttribute("href", `registo-cliente.Html?id=${cliente.id}`);
    }
  }

  function renderRegistoPage() {
    const form = document.querySelector("[data-cliente-form]");
    if (!form) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get("id");
    const clienteExistente = clienteId ? getClienteById(clienteId) : null;
    const tipoField = form.querySelector("[name='tipo']");
    const empresaGroup = document.querySelector("[data-empresa-group]");
    const empresaInput = form.querySelector("[name='nomeEmpresa']");
    const successMsg = document.getElementById("successMsg");
    const errorMsg = document.querySelector("[data-form-error]");

    function syncEmpresaField() {
      const isEmpresa = tipoField.value === "Empresa";
      empresaGroup.style.display = isEmpresa ? "block" : "none";
      empresaInput.required = isEmpresa;

      if (!isEmpresa) {
        empresaInput.value = "";
      }
    }

    tipoField.addEventListener("change", syncEmpresaField);

    if (clienteExistente) {
      form.querySelector("[name='nome']").value = clienteExistente.nome || "";
      form.querySelector("[name='email']").value = clienteExistente.email || "";
      form.querySelector("[name='contacto']").value = clienteExistente.contacto || "";
      form.querySelector("[name='tipo']").value = clienteExistente.tipo || "";
      form.querySelector("[name='nif']").value = clienteExistente.nif || "";
      form.querySelector("[name='nomeEmpresa']").value = clienteExistente.nomeEmpresa || "";
      form.querySelector("[name='morada']").value = clienteExistente.morada || "";

      const pageTitle = document.querySelector(".page-title");
      const topbarTitle = document.querySelector(".topbar-title");
      const breadcrumb = document.querySelector(".breadcrumb span");
      const submitButton = form.querySelector("button[type='submit']");

      if (pageTitle) {
        pageTitle.textContent = "Editar Cliente";
      }
      if (topbarTitle) {
        topbarTitle.textContent = "Editar Cliente";
      }
      if (breadcrumb) {
        breadcrumb.textContent = "Editar Registo";
      }
      if (submitButton) {
        submitButton.lastChild.textContent = " Guardar Alterações";
      }
    }

    syncEmpresaField();

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(form);
      const tipo = String(formData.get("tipo") || "").trim();
      const nome = String(formData.get("nome") || "").trim();
      const nomeEmpresa = String(formData.get("nomeEmpresa") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const contacto = String(formData.get("contacto") || "").trim();
      const nif = String(formData.get("nif") || "").trim();
      const morada = String(formData.get("morada") || "").trim();

      const invalido =
        !nome ||
        !email ||
        !contacto ||
        !tipo ||
        !nif ||
        (tipo === "Empresa" && !nomeEmpresa);

      if (invalido) {
        if (errorMsg) {
          errorMsg.style.display = "flex";
        }
        if (successMsg) {
          successMsg.style.display = "none";
        }
        return;
      }

      const clientePayload = {
        id: clienteExistente ? clienteExistente.id : `cli-${Date.now()}`,
        tipo,
        nome,
        nomeEmpresa,
        email,
        contacto,
        nif,
        morada,
        registadoEm: clienteExistente ? clienteExistente.registadoEm : new Date().toISOString(),
        historico: clienteExistente ? clienteExistente.historico || [] : []
      };

      if (clienteExistente) {
        updateCliente(clientePayload);
      } else {
        addCliente(clientePayload);
      }

      form.reset();
      syncEmpresaField();

      if (errorMsg) {
        errorMsg.style.display = "none";
      }
      if (successMsg) {
        successMsg.style.display = "flex";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderListaPage();
    renderDetalhePage();
    renderRegistoPage();
  });
})();
