(function () {
  var KEY = "smartdelivery-preferencias";

  var defaults = {
    canalEmail: true, canalSms: true,
    notifConfirmacao: true, notifAtraso: true,
    notifSaida: false, notifRegisto: false
  };

  function getPref(clienteId) {
    try {
      var all = JSON.parse(localStorage.getItem(KEY)) || {};
      return Object.assign({}, defaults, all[clienteId] || {});
    } catch (e) { return Object.assign({}, defaults); }
  }

  function savePref(clienteId, pref) {
    var all = {};
    try { all = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { all = {}; }
    all[clienteId] = pref;
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  function loadToggles(clienteId) {
    var p = getPref(clienteId);
    document.getElementById("canal-email").checked       = !!p.canalEmail;
    document.getElementById("canal-sms").checked         = !!p.canalSms;
    document.getElementById("notif-confirmacao").checked = !!p.notifConfirmacao;
    document.getElementById("notif-atraso").checked      = !!p.notifAtraso;
    document.getElementById("notif-saida").checked       = !!p.notifSaida;
    document.getElementById("notif-registo").checked     = !!p.notifRegisto;

    if (typeof getClienteById === "function") {
      var c = getClienteById(clienteId);
      if (c) {
        document.getElementById("descEmail").textContent = "Receber notificações por email (" + c.email + ")";
        document.getElementById("descSms").textContent   = "Receber notificações por SMS (" + c.contacto + ")";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var select = document.querySelector("[data-pref-cliente-select]");
    if (!select) return;

    if (typeof getClientes === "function") {
      var clientes = getClientes();
      select.innerHTML = "";
      clientes.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = (c.tipo === "Empresa" ? c.nomeEmpresa : c.nome) + " (" + c.tipo + ")";
        select.appendChild(opt);
      });
    }

    loadToggles(select.value);

    select.addEventListener("change", function () {
      loadToggles(this.value);
      document.getElementById("prefSuccessMsg").style.display = "none";
    });

    var btnGuardar = document.getElementById("btnGuardarPref");
    if (btnGuardar) {
      btnGuardar.addEventListener("click", function () {
        savePref(select.value, {
          canalEmail:       document.getElementById("canal-email").checked,
          canalSms:         document.getElementById("canal-sms").checked,
          notifConfirmacao: document.getElementById("notif-confirmacao").checked,
          notifAtraso:      document.getElementById("notif-atraso").checked,
          notifSaida:       document.getElementById("notif-saida").checked,
          notifRegisto:     document.getElementById("notif-registo").checked
        });
        var msg = document.getElementById("prefSuccessMsg");
        if (msg) { msg.style.display = "flex"; setTimeout(function(){ msg.style.display = "none"; }, 3000); }
      });
    }

    var btnCancelar = document.getElementById("btnCancelarPref");
    if (btnCancelar) btnCancelar.addEventListener("click", function () {
      loadToggles(select.value);
    });
  });
})();