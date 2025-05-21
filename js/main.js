// main.js

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const nav = document.querySelector('nav');
      nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });
  }

  // Google Sheet URLs
  const SHEET_ID = '1dzuO_Uzi4Z5GHi97sE6RjELOrxzRbuRXcl1tg17ODsA';
  const URL_PARTICIPANTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teilnehmer&tqx=out:json`;
  const URL_SCHEDULE     = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Zeitplan&tqx=out:json`;

  // GViz JSON parser
  function parseGviz(jsonText) {
    const json = JSON.parse(
      jsonText.replace(/^[^(]*\(/, '').replace(/\);?$/, '')
    );
    const cols = json.table.cols.map(c => c.label);
    return json.table.rows
      .map(r => r.c.map(cell => (cell && cell.v)))
      .map(values =>
        cols.reduce((obj, col, i) => {
          obj[col] = values[i];
          return obj;
        }, {})
      );
  }

  // Render Participants
  function renderParticipants(list) {
    const tbody = document.getElementById('participants-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    list.forEach(p => {
      const tr = document.createElement('tr');
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

  // Render Schedule
  function renderSchedule(list) {
    const container = document.getElementById('schedule-container');
    if (!container) return;
    container.innerHTML = '';
    const byDay = list.reduce((acc, item) => {
      acc[item.Tag] = acc[item.Tag] || [];
      acc[item.Tag].push(item);
      return acc;
    }, {});
    Object.entries(byDay).forEach(([day, items]) => {
      const div = document.createElement('div');
      div.className = 'day';
      div.innerHTML = `<h2>${day}</h2>`;
      const ul = document.createElement('ul');
      items.forEach(it => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${it.Uhrzeit}</strong> ${it.Streamer}`;
        ul.appendChild(li);
      });
      div.appendChild(ul);
      container.appendChild(div);
    });
  }

  // Fetch and render Google Sheet data
  Promise.all([
    fetch(URL_PARTICIPANTS).then(r => r.text()).then(parseGviz),
    fetch(URL_SCHEDULE).then(r => r.text()).then(parseGviz)
  ])
    .then(([participants, schedule]) => {
      renderParticipants(participants);
      renderSchedule(schedule);
    })
    .catch(err => console.error('Fehler beim Laden aus Google Sheets:', err));

  // Load external HTML for YouTube & Rules tabs
  function loadExternalHTML(id, url) {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Netzwerkantwort war nicht ok: ${res.statusText}`);
        return res.text();
      })
      .then(html => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = html;
      })
      .catch(err => console.error(`Fehler beim Laden von ${url}:`, err));
  }

  loadExternalHTML('youtube', 'youtube.html');
  loadExternalHTML('rules', 'rules.html');

  // Tab switching logic
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const content = document.getElementById(targetId);
      if (content) content.classList.add('active');
    });
  });
});
