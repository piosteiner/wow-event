// main.js

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
  const SHEET_ID = '1dzuO_Uzi4Z5GHi97sE6RjELOrxzRbuRXcl1tg17ODsA';
  const URL_PARTICIPANTS_CSV =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  const URL_SCHEDULE =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Zeitplan&tqx=out:json`;

  // 3) CSV → Array von Objekten
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

  // 4) GViz-JSON parser
  function parseGviz(jsonText) {
    const j = JSON.parse(
      jsonText.replace(/^[^(]*\(/, '').replace(/\);?$/, '')
    );
    const cols = j.table.cols.map(c => c.label);
    return j.table.rows
      .map(r => r.c.map(cell => (cell && cell.v)))
      .map(vals =>
        cols.reduce((o, col, i) => {
          o[col] = vals[i];
          return o;
        }, {})
      );
  }

  // 5) Render Participants
  function renderParticipants(list) {
    const tbody = document.getElementById('participants-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach(p => {
      const username = p.twitch_link
        ? p.twitch_link
            .replace(/^https?:\/\/(www\.)?twitch\.tv\//, '')
            .replace(/\/$/, '')
            .trim()
        : null;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.twitch_link
          ? `<a class="no_underline" href="${p.twitch_link}" target="_blank" rel="noopener">${p.streamer}</a>`
          : p.streamer}
        </td>
        <td id="live-status-${username}"
            data-live-status="offline">
          <span class="status-dot offline" title="Offline"></span>
        </td>
        <td>${p.char1 || ''}</td>
        <td>${p.class1 || ''}</td>
        <td>${p.lvl1 || ''}</td>
        <td>
          ${p.death1_clip
            ? `<a class="no_underline" href="${p.death1_clip}" target="_blank" rel="noopener">🎬💀</a>`
            : ''}
        </td>
        <td>${p.char2 || ''}</td>
        <td>${p.class2 || ''}</td>
        <td>${p.lvl2 || ''}</td>
        <td>
          ${p.death2_clip
            ? `<a class="no_underline" href="${p.death2_clip}" target="_blank" rel="noopener">🎬💀</a>`
            : ''}
        </td>
        <td>${p.char3 || ''}</td>
        <td>${p.class3 || ''}</td>
        <td>${p.lvl3 || ''}</td>
        <td>
          ${p.death3_clip
            ? `<a class="no_underline" href="${p.death3_clip}" target="_blank" rel="noopener">🎬💀</a>`
            : ''}
        </td>
      `;
      tbody.appendChild(tr);

      if (username) {
        fetch(`https://decapi.me/twitch/uptime/${username}`)
          .then(r => r.text())
          .then(text => {
            const cell = document.getElementById(`live-status-${username}`);
            if (!cell) return;

            if (text.includes('Error from Twitch API')) {
              cell.textContent = '404';
              cell.dataset.liveStatus = '404';
              return;
            }
            if (text.includes('is offline')) {
              cell.innerHTML = `<span class="status-dot offline" title="Offline"></span>`;
              cell.dataset.liveStatus = 'offline';
            } else {
              cell.innerHTML = `<span class="status-dot online" title="Online"></span>`;
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

  // 6) Render Schedule
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

  // 7) Fetch & render both sheets
  Promise.all([
    fetch(URL_PARTICIPANTS_CSV).then(r => r.text()).then(parseCSV),
    fetch(URL_SCHEDULE).then(r => r.text()).then(parseGviz)
  ])
    .then(([participants, schedule]) => {
      renderParticipants(participants);
      renderSchedule(schedule);
      makeTableSortable(); // initialize sorting
    })
    .catch(err => console.error('Fehler beim Laden der Daten:', err));

  // 8) Load external HTML for YouTube & Rules
  function loadExternalHTML(id, url) {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.text();
      })
      .then(html => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = html;
      })
      .catch(err => console.error(`Fehler beim Laden von ${url}:`, err));
  }
  loadExternalHTML('youtube', 'youtube.html');
  loadExternalHTML('rules',   'rules.html');

  // 9) Tab switching logic
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // 10) Sorting functions
  function sortTableByColumn(table, colIndex, type, asc = true) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const sorted = rows.sort((a, b) => {
      let av, bv;
      if (type === 'live') {
        av = a.cells[colIndex].dataset.liveStatus;
        bv = b.cells[colIndex].dataset.liveStatus;
        const rank = s => ({ online: 0, offline: 1, '404': 2 }[s] ?? 3);
        return (rank(av) - rank(bv)) * (asc ? 1 : -1);
      } else {
        av = a.cells[colIndex].textContent.trim().toLowerCase();
        bv = b.cells[colIndex].textContent.trim().toLowerCase();
        return av.localeCompare(bv) * (asc ? 1 : -1);
      }
    });
    tbody.innerHTML = '';
    sorted.forEach(r => tbody.appendChild(r));
  }

  function makeTableSortable() {
    const table = document.getElementById('participants-table');
    if (!table) return;
    const state = {};
    table.querySelectorAll('th.sortable').forEach((th, idx) => {
      const type = th.dataset.sort;
      state[type] = true;
      th.addEventListener('click', () => {
        table.querySelectorAll('th.sortable').forEach(x => x.classList.remove('asc','desc'));
        sortTableByColumn(table, idx, type, state[type]);
        th.classList.add(state[type] ? 'asc' : 'desc');
        state[type] = !state[type];
      });
    });
  }
});
