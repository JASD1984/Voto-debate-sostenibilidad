const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxtx3JNOJ56b1mNDnIYYTzPxuzbPQ7b_muxpw-PRV2d3gB_DKswAr710dh895MhrE1wRA/exec";
const LOCAL_STORAGE_KEY = "debate-vote:voters";
let currentRoster = [...FALLBACK_ROSTER];

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  renderRoster(currentRoster);
  populateSelects(currentRoster);
  setupForm();
  fetchRosterFromSheet();
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
    const options = category === "favor" ? favorOptions : contraOptions;

    group.querySelectorAll("select").forEach((originalSelect) => {
      const select = originalSelect.cloneNode(false);
      fillSelect(select, options);
      select.addEventListener("change", () => {
        validateUniqueSelection(group);
        updateOptionAvailability(group);
      });
      originalSelect.replaceWith(select);
    });

    updateOptionAvailability(group);
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

function updateOptionAvailability(group) {
  const selects = Array.from(group.querySelectorAll("select"));
  const selectedValues = new Set(
    selects.map((select) => select.value).filter(Boolean)
  );

  selects.forEach((select) => {
    Array.from(select.options).forEach((option) => {
      if (!option.value) {
        option.disabled = false;
        return;
      }

      if (option.value === select.value) {
        option.disabled = false;
      } else {
        const shouldDisable = selectedValues.has(option.value);
        option.disabled = shouldDisable;
      }
    });
  });
}

function normalizeName(name) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function hasRecordedVote(normalizedName) {
  if (!normalizedName) return false;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(normalizedName);
  } catch (error) {
    console.warn("No se pudo leer el registro local de votos.", error);
    return false;
  }
}

function recordVote(normalizedName) {
  if (!normalizedName) return;
  let list = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch (error) {
    list = [];
  }
  if (!list.includes(normalizedName)) {
    list.push(normalizedName);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      // Ignorado: si localStorage falla no bloqueamos el flujo principal.
    }
  }
}

function setupForm() {
  const form = document.getElementById("vote-form");
  const feedback = document.getElementById("form-feedback");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const voterName = form["voter-name"].value.trim();
    const normalizedVoterName = normalizeName(voterName);
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

    if (hasRecordedVote(normalizedVoterName)) {
      showFeedback(
        feedback,
        "⚠️ Ya has registrado un voto desde este dispositivo. Solo se permite uno por alumno/a.",
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
      recordVote(normalizedVoterName);
      form.reset();
      [favorGroup, contraGroup].forEach((group) => {
        group
          .querySelectorAll("select")
          .forEach((select) => select.setCustomValidity(""));
      });
      populateSelects(currentRoster);
      showFeedback(
        feedback,
        `🎉 ${voterName}, tu voto ha sido recogido y guardado. ¡Gracias por participar!`,
        true
      );
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

function fetchRosterFromSheet() {
  if (!SCRIPT_URL.startsWith("https://script.google.com")) {
    return;
  }

  fetch(`${SCRIPT_URL}?action=roster`, { mode: "cors" })
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
    })
    .catch((error) => {
      console.warn("No se pudo actualizar el listado remoto:", error);
    });
}
