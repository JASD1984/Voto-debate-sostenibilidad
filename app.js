const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxtx3JNOJ56b1mNDnIYYTzPxuzbPQ7b_muxpw-PRV2d3gB_DKswAr710dh895MhrE1wRA/exec";
const POINTS_BY_RANK = {
  first: 2,
  second: 1.5,
  third: 1
};

let chartsLoaded = false;
let pendingStatsPayload = null;
let currentRoster = [...FALLBACK_ROSTER];

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  renderRoster(currentRoster);
  populateSelects(currentRoster);
  setupForm();
  loadGoogleCharts();
  fetchSummaryFromSheet();
});

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll(".tabs__button"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      panels.forEach((panel) => panel.classList.remove("is-visible"));

      button.classList.add("is-active");
      const target = document.querySelector(`#tab-${button.dataset.tab}`);
      if (target) {
        target.classList.add("is-visible");
      }
    });
  });
}

function renderRoster(roster) {
  const tbody = document.getElementById("roster-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  roster.forEach((person) => {
    const tr = document.createElement("tr");

    const stanceClass =
      person.stance.toLowerCase() === "a favor"
        ? "badge--favor"
        : person.stance.toLowerCase() === "en contra"
        ? "badge--contra"
        : "badge--ambos";

    tr.innerHTML = `
      <td>${person.name}</td>
      <td>${person.topic}</td>
      <td><span class="badge ${stanceClass}">${person.stance}</span></td>
      <td>${person.notes}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateSelects(roster) {
  const favorOptions = roster.filter((p) =>
    ["a favor", "ambos"].includes(p.stance.toLowerCase())
  );
  const contraOptions = roster.filter((p) =>
    ["en contra", "ambos"].includes(p.stance.toLowerCase())
  );

  const selectGroups = document.querySelectorAll(".select-grid");

  selectGroups.forEach((group) => {
    const category = group.dataset.category;
    const options =
      category === "favor" ? favorOptions : contraOptions;

    group.querySelectorAll("select").forEach((select) => {
      fillSelect(select, options);
      select.addEventListener("change", () => {
        validateUniqueSelection(group);
      });
    });
  });
}

function fillSelect(select, options) {
  select.innerHTML = `<option value="">Selecciona un alumno/a</option>`;
  options.forEach((person) => {
    const option = document.createElement("option");
    option.value = person.name;
    option.textContent = person.name;
    select.appendChild(option);
  });
}

function validateUniqueSelection(group) {
  const selects = Array.from(group.querySelectorAll("select"));
  const values = selects.map((s) => s.value).filter(Boolean);
  const hasDuplicate = new Set(values).size !== values.length;

  selects.forEach((select) => {
    if (values.filter((value) => value === select.value).length > 1) {
      select.setCustomValidity("No puedes repetir nombres en esta categoría.");
    } else {
      select.setCustomValidity("");
    }
  });

  return !hasDuplicate;
}

function setupForm() {
  const form = document.getElementById("vote-form");
  const feedback = document.getElementById("form-feedback");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const voterName = form["voter-name"].value.trim();
    const favorGroup = form.querySelector('.select-grid[data-category="favor"]');
    const contraGroup = form.querySelector(
      '.select-grid[data-category="contra"]'
    );

    const allFilled = Array.from(
      form.querySelectorAll("select[required]")
    ).every((select) => select.value);

    const favorValid = validateUniqueSelection(favorGroup);
    const contraValid = validateUniqueSelection(contraGroup);

    if (!voterName || !allFilled || !favorValid || !contraValid) {
      showFeedback(
        feedback,
        "⚠️ Revisa que tu nombre y todas las selecciones sean válidas.",
        false
      );
      return;
    }

    const payload = {
      voterName,
      favor: {
        first: form["favor-first"].value,
        second: form["favor-second"].value,
        third: form["favor-third"].value
      },
      contra: {
        first: form["contra-first"].value,
        second: form["contra-second"].value,
        third: form["contra-third"].value
      }
    };

    try {
      showFeedback(feedback, "⏳ Enviando tu votación...", true);
      await sendVote(payload);
      form.reset();
      [favorGroup, contraGroup].forEach((group) => {
        group
          .querySelectorAll("select")
          .forEach((select) => select.setCustomValidity(""));
      });
      showFeedback(
        feedback,
        `🎉 ${voterName}, tu voto ha sido recogido y guardado. ¡Gracias por participar!`,
        true
      );
      fetchSummaryFromSheet();
    } catch (error) {
      console.error(error);
      const message =
        error?.message ||
        "No se ha podido registrar el voto. Verifica la conexión e inténtalo de nuevo.";
      showFeedback(feedback, `❌ ${message}`, false);
    }
  });
}

async function sendVote(payload) {
  if (!SCRIPT_URL.startsWith("https://script.google.com")) {
    throw new Error("Configura la constante SCRIPT_URL con tu dirección de Apps Script.");
  }

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: new URLSearchParams({
      payload: JSON.stringify(payload)
    }).toString()
  });

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error("Respuesta no válida del servidor.");
  }

  if (!response.ok || result?.ok === false) {
    throw new Error(result?.error || "Error al registrar el voto.");
  }
}

function showFeedback(container, message, isSuccess) {
  if (!container) return;
  container.textContent = message;
  container.classList.toggle("is-success", isSuccess);
  container.classList.toggle("is-error", !isSuccess);
}

function fetchSummaryFromSheet() {
  if (!SCRIPT_URL.startsWith("https://script.google.com")) {
    drawStatsPlaceholder();
    return;
  }

  fetch(`${SCRIPT_URL}?action=summary`, { mode: "cors" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo obtener la información del Google Sheet.");
      }
      return response.json();
    })
    .then((data) => {
      if (data?.ok === false) {
        throw new Error(data.error || "El script devolvió un error.");
      }

      if (Array.isArray(data?.roster) && data.roster.length) {
        currentRoster = data.roster;
        renderRoster(currentRoster);
        populateSelects(currentRoster);
      }
      pendingStatsPayload = data?.votes || null;
      if (chartsLoaded && pendingStatsPayload) {
        drawCharts(pendingStatsPayload);
      }
    })
    .catch((error) => {
      console.warn(error);
      drawStatsPlaceholder();
    });
}

function drawStatsPlaceholder() {
  const emptyStats = {
    favor: { totals: [], table: [] },
    contra: { totals: [], table: [] }
  };
  pendingStatsPayload = emptyStats;
  if (chartsLoaded) {
    drawCharts(emptyStats);
  }
}

function loadGoogleCharts() {
  if (typeof google === "undefined") {
    console.error("Google Charts no está disponible. Revisa tu conexión.");
    return;
  }

  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(() => {
    chartsLoaded = true;
    if (pendingStatsPayload) {
      drawCharts(pendingStatsPayload);
    }
  });
}

function drawCharts(votesData) {
  drawChartForCategory("favor", votesData.favor);
  drawChartForCategory("contra", votesData.contra);
  renderTables(votesData);
}

function drawChartForCategory(category, data) {
  const chartContainer = document.getElementById(
    `chart-${category}`
  );
  if (!chartContainer) return;

  const chartData = new google.visualization.DataTable();
  chartData.addColumn("string", "Alumno/a");
  chartData.addColumn("number", "Puntos");

  if (Array.isArray(data?.totals) && data.totals.length) {
    data.totals.forEach((row) => {
      chartData.addRow([row.name, row.points]);
    });
  }

  const options = {
    backgroundColor: "transparent",
    legend: { position: "none" },
    chartArea: { width: "80%", height: "75%" },
    colors: category === "favor" ? ["#43a047"] : ["#d32f2f"],
    hAxis: {
      minValue: 0,
      textStyle: { color: "#1c2333" }
    },
    vAxis: {
      textStyle: { color: "#1c2333" }
    }
  };

  const chart = new google.visualization.BarChart(chartContainer);
  chart.draw(chartData, options);
}

function renderTables(votesData) {
  const favorBody = document.getElementById("favor-summary");
  const contraBody = document.getElementById("contra-summary");
  if (!favorBody || !contraBody) {
    return;
  }

  fillSummaryTable(favorBody, votesData?.favor?.table || []);
  fillSummaryTable(contraBody, votesData?.contra?.table || []);
}

function fillSummaryTable(tbody, rows) {
  tbody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Sin votos registrados todavía.</td>`;
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.points.toFixed(2)}</td>
      <td>${row.first || 0}</td>
      <td>${row.second || 0}</td>
      <td>${row.third || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}
