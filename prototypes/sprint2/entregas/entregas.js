const deliveryCouriers = [
  { id: 1, nome: "Joao Silva", zona: "Lisboa Centro", veiculo: "Moto", disponibilidade: "Disponivel", carga: 4, capacidade: 8, eta: "14 min" },
  { id: 2, nome: "Marta Costa", zona: "Lisboa Centro", veiculo: "Bicicleta", disponibilidade: "Disponivel", carga: 2, capacidade: 6, eta: "18 min" },
  { id: 3, nome: "Rui Gomes", zona: "Lisboa Norte", veiculo: "Carrinha", disponibilidade: "Ocupado", carga: 7, capacidade: 8, eta: "26 min" },
  { id: 4, nome: "Ana Ferreira", zona: "Margem Sul", veiculo: "Moto", disponibilidade: "Disponivel", carga: 1, capacidade: 7, eta: "22 min" },
  { id: 5, nome: "Bruno Santos", zona: "Lisboa Centro", veiculo: "Carrinha", disponibilidade: "Disponivel", carga: 3, capacidade: 10, eta: "12 min" }
];

const planningData = [
  { id: "ZC-01", modo: "zona", zona: "Lisboa Centro", estafeta: "Joao Silva", paragens: 7, carga: 63, inicio: "14:20", estado: "Em preparacao", sequencia: ["Hub Oriente", "Baixa", "Chiado", "Santos"], resumo: "Zona com maior densidade de entregas farmaceuticas." },
  { id: "ZN-02", modo: "zona", zona: "Lisboa Norte", estafeta: "Rui Gomes", paragens: 5, carga: 88, inicio: "14:45", estado: "Quase completa", sequencia: ["Lumiar", "Telheiras", "Campo Grande"], resumo: "Janela mais apertada entre 15:30 e 16:30." },
  { id: "MS-03", modo: "zona", zona: "Margem Sul", estafeta: "Ana Ferreira", paragens: 4, carga: 42, inicio: "15:00", estado: "Balanceada", sequencia: ["Almada", "Cacilhas", "Corroios"], resumo: "Rota compacta com baixa carga." },
  { id: "R-08", modo: "rota", zona: "Lisboa Centro", estafeta: "Joao Silva", paragens: 7, carga: 63, inicio: "14:20", estado: "Em execucao", sequencia: ["Hub Oriente", "Rua do Ouro", "Rua da Prata", "Chiado", "Cais do Sodre"], resumo: "Rota otimizada por prioridade e distancia." },
  { id: "R-11", modo: "rota", zona: "Lisboa Norte", estafeta: "Rui Gomes", paragens: 5, carga: 88, inicio: "14:45", estado: "Ajuste necessario", sequencia: ["Hub Prior Velho", "Lumiar", "Ameixoeira", "Telheiras"], resumo: "Precisa redistribuir uma paragem para evitar atraso." },
  { id: "R-14", modo: "rota", zona: "Margem Sul", estafeta: "Ana Ferreira", paragens: 4, carga: 42, inicio: "15:00", estado: "Pronta", sequencia: ["Hub Almada", "Cacilhas", "Laranjeiro", "Corroios"], resumo: "Rota curta com folga operacional." }
];

const deliveryTimeline = [
  { estado: "Encomenda preparada", hora: "13:40", detalhe: "Hub Oriente validou embalagem e etiqueta." },
  { estado: "Atribuida ao estafeta", hora: "14:05", detalhe: "Atribuicao manual feita por Marta Oliveira." },
  { estado: "Recolhida no hub", hora: "14:18", detalhe: "Joao Silva confirmou carregamento na moto." },
  { estado: "Saiu para entrega", hora: "14:32", detalhe: "Rota R-08 iniciada com 7 paragens." }
];

let selectedCourierId = null;
let currentPlanningMode = "zona";
let deliveryStatusIndex = 1;
const deliveryFlow = [
  { badge: "badge-warning", titulo: "Aguarda recolha", detalhe: "Entrega pronta para carregamento." },
  { badge: "badge-info", titulo: "Em distribuicao", detalhe: "Saiu para entrega" },
  { badge: "badge-success", titulo: "Entregue", detalhe: "Entrega concluida com sucesso" }
];

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "atribuicao") {
    initAssignmentPage();
  }

  if (page === "planeamento") {
    initPlanningPage();
  }

  if (page === "detalhe-entrega") {
    initDeliveryDetailPage();
  }
});

function initAssignmentPage() {
  const zoneFilter = document.getElementById("filtro-zona");
  const vehicleFilter = document.getElementById("filtro-veiculo");

  zoneFilter.addEventListener("change", renderCourierTable);
  vehicleFilter.addEventListener("change", renderCourierTable);

  document.getElementById("sugerir-atribuicao").addEventListener("click", () => {
    const couriers = getFilteredCouriers();
    if (!couriers.length) {
      window.alert("Nao existe nenhum estafeta para os filtros selecionados.");
      return;
    }

    const bestCourier = [...couriers].sort((a, b) => {
      const scoreA = (a.capacidade - a.carga) * 10 - parseInt(a.eta, 10);
      const scoreB = (b.capacidade - b.carga) * 10 - parseInt(b.eta, 10);
      return scoreB - scoreA;
    })[0];

    selectedCourierId = bestCourier.id;
    renderCourierTable();
    updateAssignmentSummary();
  });

  document.getElementById("limpar-selecao").addEventListener("click", () => {
    selectedCourierId = null;
    updateAssignmentSummary();
    renderCourierTable();
  });

  document.getElementById("confirmar-atribuicao").addEventListener("click", () => {
    const courier = deliveryCouriers.find((item) => item.id === selectedCourierId);
    if (!courier) {
      window.alert("Selecione um estafeta antes de confirmar.");
      return;
    }

    if (courier.carga >= courier.capacidade) {
      window.alert("Este estafeta ja atingiu a capacidade maxima.");
      return;
    }

    window.alert(`Encomenda ENC-3204 atribuida a ${courier.nome}.`);
    courier.carga += 1;
    updateAssignmentSummary();
    renderCourierTable();
  });

  renderCourierTable();
  updateAssignmentSummary();
}

function getFilteredCouriers() {
  const zone = document.getElementById("filtro-zona").value;
  const vehicle = document.getElementById("filtro-veiculo").value;

  return deliveryCouriers.filter((courier) => {
    const zoneMatch = courier.zona === zone;
    const vehicleMatch = vehicle === "Todos" || courier.veiculo === vehicle;
    const availabilityMatch = courier.disponibilidade === "Disponivel";
    return zoneMatch && vehicleMatch && availabilityMatch;
  });
}

function renderCourierTable() {
  const zone = document.getElementById("filtro-zona").value;
  const tbody = document.getElementById("lista-estafetas-atribuicao");
  const counter = document.getElementById("contador-estafetas");
  document.getElementById("atribuicao-zona").textContent = zone;

  const couriers = getFilteredCouriers();
  counter.textContent = `${couriers.length} resultados`;

  if (!couriers.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Sem estafetas para esta combinacao de filtros.</td></tr>';
    return;
  }

  tbody.innerHTML = couriers.map((courier) => {
    const selected = courier.id === selectedCourierId;
    const badgeClass = courier.disponibilidade === "Disponivel" ? "badge-success" : "badge-warning";
    const freeSlots = courier.capacidade - courier.carga;

    return `
      <tr>
        <td>
          <div class="courier-info">
            <div class="avatar">${getInitials(courier.nome)}</div>
            <div>
              <div class="courier-name">${courier.nome}</div>
              <div class="courier-meta">${freeSlots} vagas restantes</div>
            </div>
          </div>
        </td>
        <td>${courier.zona}</td>
        <td>${courier.veiculo}</td>
        <td><span class="badge ${badgeClass}">${courier.disponibilidade}</span></td>
        <td>
          <div style="min-width:140px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
              <span>${courier.carga}/${courier.capacidade}</span>
              <span>${Math.round((courier.carga / courier.capacidade) * 100)}%</span>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill ${getLoadClass(courier.carga / courier.capacidade)}" style="width:${(courier.carga / courier.capacidade) * 100}%"></div></div>
          </div>
        </td>
        <td>${courier.eta}</td>
        <td><button class="btn ${selected ? "btn-primary" : "btn-secondary"} btn-sm" data-select-courier="${courier.id}">${selected ? "Selecionado" : "Selecionar"}</button></td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-select-courier]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCourierId = Number(button.dataset.selectCourier);
      renderCourierTable();
      updateAssignmentSummary();
    });
  });
}

function updateAssignmentSummary() {
  const badge = document.getElementById("resumo-badge");
  const courier = deliveryCouriers.find((item) => item.id === selectedCourierId);

  if (!courier) {
    badge.className = "badge badge-muted";
    badge.textContent = "Sem selecao";
    document.getElementById("resumo-estafeta").textContent = "Por definir";
    document.getElementById("resumo-carga").textContent = "-";
    document.getElementById("resumo-eta").textContent = "-";
    document.getElementById("resumo-veiculo").textContent = "-";
    return;
  }

  badge.className = "badge badge-success";
  badge.textContent = "Pronto a atribuir";
  document.getElementById("resumo-estafeta").textContent = courier.nome;
  document.getElementById("resumo-carga").textContent = `${courier.carga}/${courier.capacidade} entregas`;
  document.getElementById("resumo-eta").textContent = courier.eta;
  document.getElementById("resumo-veiculo").textContent = courier.veiculo;
}

function initPlanningPage() {
  document.querySelectorAll("[data-planeamento-modo]").forEach((button) => {
    button.addEventListener("click", () => {
      currentPlanningMode = button.dataset.planeamentoModo;
      renderPlanning();
    });
  });

  document.getElementById("planeamento-filtro-zona").addEventListener("change", renderPlanning);
  document.getElementById("planeamento-data").addEventListener("change", renderPlanning);
  renderPlanning();
}

function renderPlanning() {
  const zoneFilter = document.getElementById("planeamento-filtro-zona").value;
  const modeLabel = document.getElementById("modo-ativo");
  const list = planningData.filter((item) => {
    const zoneMatch = zoneFilter === "Todas" || item.zona === zoneFilter;
    return item.modo === currentPlanningMode && zoneMatch;
  });

  modeLabel.textContent = currentPlanningMode === "zona" ? "Vista por zona" : "Vista por rota";

  document.querySelectorAll("[data-planeamento-modo]").forEach((button) => {
    const active = button.dataset.planeamentoModo === currentPlanningMode;
    button.className = `btn ${active ? "btn-primary" : "btn-secondary"} btn-sm`;
  });

  document.getElementById("planeamento-contador").textContent = `${list.length} registos`;
  document.getElementById("planeamento-total").textContent = list.reduce((sum, item) => sum + item.paragens, 0);
  document.getElementById("planeamento-rotas").textContent = list.length;
  document.getElementById("planeamento-zonas").textContent = new Set(list.map((item) => item.zona)).size;
  document.getElementById("planeamento-carga").textContent = `${list.length ? Math.round(list.reduce((sum, item) => sum + item.carga, 0) / list.length) : 0}%`;

  document.getElementById("planeamento-resumo").innerHTML = list.length ? `
    <div><div class="detail-label">Data selecionada</div><div class="detail-value">${formatInputDate(document.getElementById("planeamento-data").value)}</div></div>
    <div><div class="detail-label">Melhor cobertura</div><div class="detail-value">${list[0].zona}</div></div>
    <div><div class="detail-label">Estafetas escalados</div><div class="detail-value">${list.map((item) => item.estafeta).join(", ")}</div></div>
    <div><div class="detail-label">Nota operacional</div><div class="detail-value">${list[0].resumo}</div></div>
  ` : `
    <div style="grid-column:span 2;"><div class="detail-value">Sem dados para os filtros escolhidos.</div></div>
  `;

  document.getElementById("planeamento-lista").innerHTML = list.length ? list.map((item) => `
    <tr data-planeamento-id="${item.id}">
      <td><strong>${item.id}</strong></td>
      <td>${item.zona}</td>
      <td>${item.estafeta}</td>
      <td>${item.paragens}</td>
      <td>${item.carga}%</td>
      <td>${item.inicio}</td>
      <td><span class="badge ${getPlanningBadge(item.estado)}">${item.estado}</span></td>
    </tr>
  `).join("") : '<tr><td colspan="7" style="text-align:center;">Sem rotas ou zonas nesta vista.</td></tr>';

  const selected = list[0];
  renderPlanningSequence(selected);

  document.querySelectorAll("[data-planeamento-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const item = list.find((entry) => entry.id === row.dataset.planeamentoId);
      renderPlanningSequence(item);
    });
  });
}

function renderPlanningSequence(item) {
  const title = document.getElementById("planeamento-sequencia-titulo");
  const sequence = document.getElementById("planeamento-sequencia");

  if (!item) {
    title.textContent = "Sem selecao";
    title.className = "badge badge-muted";
    sequence.innerHTML = '<div class="timeline-item"><div class="timeline-content"><div class="timeline-state">Sem sequencia para apresentar.</div></div></div>';
    return;
  }

  title.textContent = item.id;
  title.className = "badge badge-info";
  sequence.innerHTML = item.sequencia.map((stop, index) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-state">${index + 1}. ${stop}</span>
          <span class="timeline-time">${item.inicio}</span>
        </div>
        <div class="timeline-user">${item.estafeta} · ${item.zona}</div>
      </div>
    </div>
  `).join("");
}

function initDeliveryDetailPage() {
  renderDeliveryTimeline();

  document.getElementById("avancar-estado").addEventListener("click", () => {
    if (deliveryStatusIndex >= deliveryFlow.length - 1) {
      window.alert("A entrega ja esta concluida.");
      return;
    }

    deliveryStatusIndex += 1;
    const nextStatus = deliveryFlow[deliveryStatusIndex];
    deliveryTimeline.push({
      estado: nextStatus.titulo,
      hora: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      detalhe: "Atualizacao manual registada no prototipo."
    });

    if (nextStatus.titulo === "Entregue") {
      document.getElementById("prova-entrega").textContent = "Assinatura digital recebida por Marta Ribeiro as 16:01.";
      document.getElementById("indicador-eta").textContent = "Concluida";
    }

    updateDeliveryHeader();
    renderDeliveryTimeline();
  });

  document.getElementById("registar-ocorrencia").addEventListener("click", () => {
    deliveryTimeline.push({
      estado: "Ocorrencia registada",
      hora: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      detalhe: "Cliente avisado sobre atraso de 10 minutos."
    });
    renderDeliveryTimeline();
    window.alert("Ocorrencia registada na timeline.");
  });

  updateDeliveryHeader();
}

function updateDeliveryHeader() {
  const status = deliveryFlow[deliveryStatusIndex];
  const badge = document.getElementById("entrega-estado-badge");
  badge.className = `badge ${status.badge} badge-large`;
  badge.textContent = status.titulo;
  document.getElementById("entrega-estado-label").textContent = status.detalhe;

  if (status.titulo === "Entregue") {
    document.getElementById("entrega-acoes").innerHTML = '<span class="badge badge-success">Fluxo concluido</span>';
  }
}

function renderDeliveryTimeline() {
  const container = document.getElementById("timeline-entrega");
  document.getElementById("timeline-total").textContent = `${deliveryTimeline.length} eventos`;

  container.innerHTML = deliveryTimeline.map((item) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-state">${item.estado}</span>
          <span class="timeline-time">${item.hora}</span>
        </div>
        <div class="timeline-user">${item.detalhe}</div>
      </div>
    </div>
  `).join("");
}

function getLoadClass(ratio) {
  if (ratio >= 0.85) return "progress-high";
  if (ratio >= 0.6) return "progress-med";
  return "progress-low";
}

function getPlanningBadge(status) {
  if (status === "Pronta" || status === "Balanceada") return "badge-success";
  if (status === "Ajuste necessario" || status === "Quase completa") return "badge-warning";
  return "badge-info";
}

function getInitials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatInputDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
