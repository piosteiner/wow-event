// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const nav = document.querySelector('nav');
      nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });
  }

  // 2) Google Sheet URLs
  const SHEET_ID               = '1dzuO_Uzi4Z5GHi97sE6RjELOrxzRbuRXcl1tg17ODsA';
  const URL_PARTICIPANTS_CSV   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  const URL_SCHEDULE_CSV       = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=217501760`;

  // 3) Storage for loaded data
  let participantsData = [];
  let scheduleData     = [];

  // 4) CSV → Array of objects
  function parseCSV(text) {
    const [headerLine, ...lines] = text.trim().split('\n');
    const headers = headerLine.split(',').map(h => h.trim());
    return lines.map(line => {
      const cols = line.split(',').map(c => c.trim());
      return headers.reduce((obj, h, i) => {
        obj[h] = cols[i] || '';
        return obj;
      }, {});
    });
  }

  // 5) Render Participants
  function renderParticipants(list) {
    const tbody = document.getElementById('participants-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach(p => {
      const username = p.twitch_link
        ? p.twitch_link.replace(/^https?:\/\/(www\.)?twitch\.tv\//, '').replace(/\/$/, '').trim()
        : null;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.twitch_link
          ? `<a href="${p.twitch_link}" target="_blank" rel="noopener">${p.streamer}</a>`
          : p.streamer}</td>
        <td id="live-status-${username}" data-live-status="offline">
          <span class="status-dot offline" title="Offline"></span>
        </td>
        <td>${p.char1||''}</td>
        <td>${p.class1||''}</td>
        <td>${p.lvl1||''}</td>
        <td>${p.death1_clip
          ? `<a class="death-clip" href="${p.death1_clip}" target="_blank" rel="noopener">🎬💀</a>`
          : ''}</td>
        <td>${p.char2||''}</td>
        <td>${p.class2||''}</td>
        <td>${p.lvl2||''}</td>
        <td>${p.death2_clip
          ? `<a class="death-clip" href="${p.death2_clip}" target="_blank" rel="noopener">🎬💀</a>`
          : ''}</td>
        <td>${p.char3||''}</td>
        <td>${p.class3||''}</td>
        <td>${p.lvl3||''}</td>
        <td>${p.death3_clip
          ? `<a class="death-clip" href="${p.death3_clip}" target="_blank" rel="noopener">🎬💀</a>`
          : ''}</td>
      `;
      tbody.appendChild(tr);

      // strike-through if last cell has skull
      const lastCell = tr.querySelector('td:last-child');
      if (lastCell && lastCell.textContent.includes('🎬💀')) {
        tr.querySelector('td:first-child').style.textDecoration = 'line-through';
      }

      // fetch live-status
      if (username) {
        fetch(`https://decapi.me/twitch/uptime/${username}`)
          .then(r => r.text())
          .then(text => {
            const cell = document.getElementById(`live-status-${username}`);
            if (!cell) return;
            if (text.includes('Error from Twitch API')) {
              cell.textContent = '404';
              cell.dataset.liveStatus = '404';
            } else if (text.includes('is offline')) {
              cell.innerHTML = `<span class="status-dot offline"></span>`;
              cell.dataset.liveStatus = 'offline';
            } else {
              cell.innerHTML = `<span class="status-dot online"></span>`;
              cell.dataset.liveStatus = 'online';
            }
          })
          .catch(() => {
            const cell = document.getElementById(`live-status-${username}`);
            if (cell) {
              cell.textContent = '404';
              cell.dataset.liveStatus = '404';
            }
          });
      }
    });
  }

  // 6) Render Schedule by mirroring the CSV exactly
  function renderSchedule(list) {
    const container = document.getElementById('schedule-container');
    if (!container) return;
    container.innerHTML = '';

    if (list.length === 0) {
      container.textContent = 'Keine Termine gefunden.';
      return;
    }

    const table = document.createElement('table');
    table.classList.add('schedule-table');

    // thead
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    Object.keys(list[0]).forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement('tbody');
    list.forEach(row => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.appendChild(table);
  }

  // 7) Initial Fetch & Render both sheets
  Promise.all([
    fetch(URL_PARTICIPANTS_CSV).then(r => r.text()).then(parseCSV),
    fetch(URL_SCHEDULE_CSV).   then(r => r.text()).then(parseCSV)
  ])
  .then(([parts, sched]) => {
    participantsData = parts;
    scheduleData     = sched;
    renderParticipants(participantsData);
    renderSchedule(scheduleData);
    makeTableSortable();
  })
  .catch(err => console.error('Fehler beim Laden der Daten:', err));

  // 8) External HTML for YouTube & Rules
  function loadExternalHTML(id, url) {
    fetch(url)
      .then(res => { if (!res.ok) throw ''; return res.text(); })
      .then(html => document.getElementById(id).innerHTML = html)
      .catch(() => {});
  }
  loadExternalHTML('youtube','youtube.html');
  loadExternalHTML('rules',  'rules.html');

  // 9) Tab switching (show/hide) + force reload on participants
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');
      if (targetId === 'participants') renderParticipants(participantsData);
    });
  });

  // 10) Sorting functions
  function sortTableByColumn(table, colIndex, type, asc = true) {
    const tbody = table.querySelector('tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr'));
    const sorted = rows.sort((a,b) => {
      if (type === 'live') {
        const rank = s => ({ online:0, offline:1,'404':2 }[s]||3);
        return (rank(a.cells[colIndex].dataset.liveStatus)
              - rank(b.cells[colIndex].dataset.liveStatus)) * (asc?1:-1);
      }
      if (type.startsWith('lvl')) {
        const na = parseInt(a.cells[colIndex].textContent)||0;
        const nb = parseInt(b.cells[colIndex].textContent)||0;
        return (na-nb)*(asc?1:-1);
      }
      const ta = a.cells[colIndex].textContent.trim().toLowerCase();
      const tb = b.cells[colIndex].textContent.trim().toLowerCase();
      return ta.localeCompare(tb)*(asc?1:-1);
    });
    tbody.innerHTML = '';
    sorted.forEach(r => tbody.appendChild(r));
  }

  function makeTableSortable() {
    const table = document.getElementById('participants-table');
    if (!table) return;
    const state = {};
    table.querySelectorAll('th.sortable').forEach(th => {
      const type = th.dataset.sort;
      state[type] = true;
      th.addEventListener('click', () => {
        table.querySelectorAll('th.sortable').forEach(x => x.classList.remove('asc','desc'));
        const idx = th.cellIndex;
        sortTableByColumn(table, idx, type, state[type]);
        th.classList.add(state[type]?'asc':'desc');
        state[type] = !state[type];
      });
    });
  }
});
