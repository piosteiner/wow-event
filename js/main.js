//main.js//

// Simple mobile nav toggle
document.querySelector('.nav-toggle').addEventListener('click', () => {
  const nav = document.querySelector('nav');
  nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
});


// Helfer: Google-GViz-JSON in ein Array von Objekten umwandeln
function parseGviz(jsonText) {
  // Entfernt das Prefix/Suffix, damit wir reines JSON haben
  const json = JSON.parse(
    jsonText
      .replace(/^[^(]*\(/, "")
      .replace(/\);?$/, "")
  );
  // Spaltenüberschriften
  const cols = json.table.cols.map(c => c.label);
  // Zeilen in Objekte übersetzen
  return json.table.rows.map(r =>
    r.c.map(cell => (cell && cell.v))
  ).map(values =>
    cols.reduce((obj, col, i) => (obj[col] = values[i], obj), {})
  );
}

// Deine Google Sheet-ID
const SHEET_ID = '1dzuO_Uzi4Z5GHi97sE6RjELOrxzRbuRXcl1tg17ODsA';

// URLs zu deinen beiden Sheets (Tabellenblätter müssen "Teilnehmer" und "Zeitplan" heißen)
const URL_PARTICIPANTS = 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teilnehmer&tqx=out:json`;
const URL_SCHEDULE = 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Zeitplan&tqx=out:json`;

// DOM-Renderer (bleibt wie vorher)
function renderParticipants(list) {
  const tbody = document.getElementById("participants-body");
  tbody.innerHTML = "";
  list.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.Name}</td>
      <td><img src="${p.Avatar}" alt="" width="24"> ${p.Status}</td>
      <td><a href="${p.Char1_Link}">${p.Char1_Name}</a></td>
      <td><a href="${p.Char2_Link}">${p.Char2_Name}</a></td>
      <td><a href="${p.Char3_Link}">${p.Char3_Name}</a></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSchedule(list) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";
  // Gruppieren nach Tag
  const byDay = list.reduce((acc, item) => {
    acc[item.Tag] = acc[item.Tag] || [];
    acc[item.Tag].push(item);
    return acc;
  }, {});
  Object.entries(byDay).forEach(([day, items]) => {
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `<h2>${day}</h2>`;
    const ul = document.createElement("ul");
    items.forEach(it => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${it.Uhrzeit}</strong> ${it.Streamer}`;
      ul.appendChild(li);
    });
    div.appendChild(ul);
    container.appendChild(div);
  });
}

// Daten fetchen und rendern
Promise.all([
  fetch(URL_PARTICIPANTS).then(r => r.text()).then(parseGviz),
  fetch(URL_SCHEDULE).then(r => r.text()).then(parseGviz)
])
.then(([participants, schedule]) => {
  renderParticipants(participants);
  renderSchedule(schedule);
})
.catch(err => console.error("Fehler beim Laden aus Google Sheets:", err));

//-----------------------------------

// Tab-Logik
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-tab');

    // 1) alle Buttons deaktiveren
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    // 2) alle Sektionen verstecken
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));

    // 3) geklickten Button aktivieren
    btn.classList.add('active');
    // 4) zugehörige Sektion einblenden
    document.getElementById(targetId).classList.add('active');
  });
});
