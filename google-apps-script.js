/**
 * Configura las hojas que se utilizarán.
 */
const SHEET_ROSTER = "Roster";
const SHEET_VOTES = "Votes";

/**
 * Tabla con la puntuación de cada puesto.
 * Ajusta los valores si necesitas otra ponderación.
 */
const POINTS_BY_RANK = {
  first: 2,
  second: 1.5,
  third: 1
};

/**
 * Fecha límite (incluida) para registrar votos.
 * Recuerda que el mes es base 0: 10 corresponde a noviembre.
 */
const VOTING_DEADLINE = new Date(2025, 10, 7, 23, 59, 59);

/**
 * GET https://SCRIPT_URL?action=summary
 * Devuelve el roster y las estadísticas agregadas.
 */
function doGet(e) {
  const action = (e.parameter.action || "summary").toLowerCase();
  if (action === "summary") {
    const payload = {
      ok: true,
      roster: getRoster(),
      votes: getVotesSummary()
    };
    return jsonResponse(payload);
  }

  if (action === "roster") {
    return jsonResponse({ ok: true, roster: getRoster() });
  }

  return jsonResponse({ ok: false, error: "Acción no soportada." });
}

/**
 * POST https://SCRIPT_URL
 * Guarda una votación.
 */
function doPost(e) {
  const rawPayload = (e.parameter && e.parameter.payload) || "";
  if (!rawPayload) {
    return jsonResponse({ ok: false, error: "Falta el cuerpo de la solicitud." });
  }

  let payload;
  try {
    payload = JSON.parse(rawPayload);
  } catch (error) {
    return jsonResponse({ ok: false, error: "Formato de payload no válido." });
  }
  const voterName = (payload.voterName || "").trim();
  if (!voterName) {
    return jsonResponse({ ok: false, error: "El nombre del votante es obligatorio." });
  }

  const timestamp = new Date();
  if (timestamp.getTime() > VOTING_DEADLINE.getTime()) {
    return jsonResponse({
      ok: false,
      error: "El plazo de votación terminó el 7 de noviembre de 2025 a las 23:59."
    });
  }

  const voterKey = normalizeName(voterName);
  if (hasVoterAlreadyVoted(voterKey)) {
    return jsonResponse({
      ok: false,
      error: "Ya has votado. El sistema solo permite una votación por alumno/a."
    });
  }

  let rowsToInsert;
  try {
    rowsToInsert = prepareVoteRows(voterName, payload, timestamp);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || "No se pudo procesar la votación."
    });
  }

  if (!rowsToInsert.length) {
    return jsonResponse({ ok: false, error: "No se han recibido votos válidos." });
  }

  const sheet = getOrCreateSheet(SHEET_VOTES, [
    "Marca temporal",
    "Votante",
    "Categoría",
    "Puesto",
    "Alumno/a elegido",
    "Puntos"
  ]);

  sheet
    .getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length)
    .setValues(rowsToInsert);

  return jsonResponse({ ok: true, message: "Votación registrada." });
}

/**
 * Convierte la información del payload en filas listas para insertar.
 */
function prepareVoteRows(voterName, payload, timestamp) {
  const voteTimestamp = timestamp instanceof Date ? timestamp : new Date();
  const rows = [];

  ["favor", "contra"].forEach((category) => {
    const votes = payload[category];
    if (!votes) return;

    const seen = new Set();
    ["first", "second", "third"].forEach((rank) => {
      const nominee = (votes[rank] || "").trim();
      if (!nominee) return;
      if (seen.has(nominee)) {
        throw new Error(
          `El voto para ${category} contiene nombres duplicados.`
        );
      }
      seen.add(nominee);

      rows.push([
        voteTimestamp,
        voterName,
        category,
        rank,
        nominee,
        POINTS_BY_RANK[rank] || 0
      ]);
    });
  });

  return rows;
}

function hasVoterAlreadyVoted(voterKey) {
  if (!voterKey) {
    return false;
  }

  const sheet = getOrCreateSheet(SHEET_VOTES, [
    "Marca temporal",
    "Votante",
    "Categoría",
    "Puesto",
    "Alumno/a elegido",
    "Puntos"
  ]);

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return false;
  }

  return values.slice(1).some((row) => normalizeName(row[1]) === voterKey);
}

/**
 * Lee el roster desde la hoja correspondiente.
 */
function getRoster() {
  const sheet = getOrCreateSheet(SHEET_ROSTER, ["Alumno/a", "Tema", "Postura", "Notas"]);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  return values.slice(1).map((row) => ({
    name: row[0],
    topic: row[1],
    stance: row[2],
    notes: row[3]
  }));
}

/**
 * Calcula las estadísticas de votos (totales y detalle por puesto).
 */
function getVotesSummary() {
  const sheet = getOrCreateSheet(SHEET_VOTES, [
    "Marca temporal",
    "Votante",
    "Categoría",
    "Puesto",
    "Alumno/a elegido",
    "Puntos"
  ]);

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return {
      favor: { totals: [], table: [] },
      contra: { totals: [], table: [] }
    };
  }

  const aggregations = {
    favor: {},
    contra: {}
  };

  values.slice(1).forEach((row) => {
    const category = String(row[2] || "").toLowerCase();
    const rank = String(row[3] || "").toLowerCase();
    const nominee = row[4];
    const points = Number(row[5]) || 0;

    if (!aggregations[category]) {
      return;
    }

    if (!aggregations[category][nominee]) {
      aggregations[category][nominee] = {
        name: nominee,
        points: 0,
        first: 0,
        second: 0,
        third: 0
      };
    }

    const record = aggregations[category][nominee];
    record.points += points;
    if (rank in record) {
      record[rank] += 1;
    }
  });

  const formatCategory = (category) => {
    const entries = Object.values(aggregations[category]);
    entries.sort((a, b) => b.points - a.points);
    return {
      totals: entries.map(({ name, points }) => ({ name, points })),
      table: entries
    };
  };

  return {
    favor: formatCategory("favor"),
    contra: formatCategory("contra")
  };
}

/**
 * Devuelve (o crea) una hoja por nombre.
 */
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else if (sheet.getLastRow() === 0 && headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

/**
 * Construye una respuesta JSON con cabeceras CORS.
 */
function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function normalizeName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
