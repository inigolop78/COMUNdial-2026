// ===== STATE =====
let resultados = {}; // key: "GRUPO-matchIdx" or "phase-matchId", value: {local, visit}
let eliminatoriaResults = {}; // key: matchId, value: {local, visit, winner, loser}
let currentGroup = 'A';
let currentModal = null;

// ===== STORAGE =====
function saveData() {
  localStorage.setItem('mundial2026_resultados', JSON.stringify(resultados));
  localStorage.setItem('mundial2026_eliminatorias', JSON.stringify(eliminatoriaResults));
}
function loadData() {
  try {
    const r = localStorage.getItem('mundial2026_resultados');
    if (r) resultados = JSON.parse(r);
    const e = localStorage.getItem('mundial2026_eliminatorias');
    if (e) eliminatoriaResults = JSON.parse(e);
  } catch(e) {}
}

// ===== STANDINGS =====
function calcStandings(grupo) {
  const equipos = GRUPOS[grupo];
  const partidos = PARTIDOS_GRUPO[grupo];
  const stats = {};
  equipos.forEach(eq => {
    stats[eq] = { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
  });

  partidos.forEach((p, idx) => {
    const key = `${grupo}-${idx}`;
    const res = resultados[key];
    if (res === undefined || res.local === '' || res.visit === '') return;
    const gl = parseInt(res.local), gv = parseInt(res.visit);
    if (isNaN(gl) || isNaN(gv)) return;
    const [local, visit] = p;
    stats[local].pj++; stats[visit].pj++;
    stats[local].gf += gl; stats[local].gc += gv;
    stats[visit].gf += gv; stats[visit].gc += gl;
    if (gl > gv) {
      stats[local].pts += 3; stats[local].pg++;
      stats[visit].pp++;
    } else if (gl < gv) {
      stats[visit].pts += 3; stats[visit].pg++;
      stats[local].pp++;
    } else {
      stats[local].pts++; stats[local].pe++;
      stats[visit].pts++; stats[visit].pe++;
    }
  });

  const arr = equipos.map(eq => ({ equipo: eq, ...stats[eq], dif: stats[eq].gf - stats[eq].gc }));
  arr.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });
  return arr;
}

function getAllStandings() {
  const all = {};
  Object.keys(GRUPOS).forEach(g => { all[g] = calcStandings(g); });
  return all;
}

function getClassified(standings) {
  // Returns ref -> team name
  const classified = {};
  Object.keys(standings).forEach(g => {
    const s = standings[g];
    classified[`1${g}`] = s[0]?.equipo || '';
    classified[`2${g}`] = s[1]?.equipo || '';
    classified[`3${g}`] = s[2]?.equipo || '';
    classified[`4${g}`] = s[3]?.equipo || '';
  });
  return classified;
}

// ===== COMUNIO POINTS =====
function calcComunioPoints(participante, standings, elimResults) {
  const teamPoints = {};

  // Fase de grupos
  Object.keys(standings).forEach(g => {
    standings[g].forEach((team, idx) => {
      if (!teamPoints[team.equipo]) teamPoints[team.equipo] = 0;
      // Points from matches won/drawn
      teamPoints[team.equipo] += team.pts; // 3 per win, 1 per draw
    });
  });

  // Dieciseisavos bonus (pos in group)
  Object.keys(standings).forEach(g => {
    const s = standings[g];
    const bonus = [5, 3, 1, 0];
    s.forEach((team, idx) => {
      if (!teamPoints[team.equipo]) teamPoints[team.equipo] = 0;
      teamPoints[team.equipo] += bonus[idx] || 0;
    });
  });

  // Knockout rounds
  const knockoutBonus = {
    '1/8': 15, '1/4': 20, '1/2': 30
  };

  ['1/16', '1/8', '1/4', '1/2'].forEach(phase => {
    if (!ELIMINATORIAS[phase]) return;
    ELIMINATORIAS[phase].forEach(match => {
      const res = elimResults[match.id];
      if (!res || !res.winner) return;
      if (!teamPoints[res.winner]) teamPoints[res.winner] = 0;
      if (phase !== '1/16' && knockoutBonus[phase]) {
        teamPoints[res.winner] += knockoutBonus[phase];
      }
    });
  });

  // 3rd place
  if (elimResults['TP']?.winner) {
    const t = elimResults['TP'].winner;
    if (!teamPoints[t]) teamPoints[t] = 0;
    teamPoints[t] += PUNTUACION_COMUNIO.tercerPuesto;
  }
  if (elimResults['TP']?.loser) {
    const t = elimResults['TP'].loser;
    if (!teamPoints[t]) teamPoints[t] = 0;
    teamPoints[t] += PUNTUACION_COMUNIO.cuartoPuesto;
  }

  // Final
  if (elimResults['FIN']?.winner) {
    const winner = elimResults['FIN'].winner;
    const loser = elimResults['FIN'].loser;
    if (!teamPoints[winner]) teamPoints[winner] = 0;
    if (!teamPoints[loser]) teamPoints[loser] = 0;
    teamPoints[winner] += PUNTUACION_COMUNIO.campeon;
    teamPoints[loser] += PUNTUACION_COMUNIO.segundoPuesto;
  }

  // Sum for participant
  let total = 0;
  const breakdown = {};
  participante.equipos.forEach(eq => {
    const pts = teamPoints[eq] || 0;
    breakdown[eq] = pts;
    total += pts;
  });

  return { total, breakdown };
}

// ===== RENDER: PARTIDOS =====
function renderPartidos() {
  const container = document.getElementById('partidos-container');
  const tabsEl = document.getElementById('group-tabs');
  tabsEl.innerHTML = '';

  Object.keys(GRUPOS).forEach(g => {
    const tab = document.createElement('button');
    tab.className = `group-tab${g === currentGroup ? ' active' : ''}`;
    tab.textContent = `Grupo ${g}`;
    tab.onclick = () => { currentGroup = g; renderPartidos(); };
    tabsEl.appendChild(tab);
  });

  const partidos = PARTIDOS_GRUPO[currentGroup];
  container.innerHTML = '';

  const label = document.createElement('div');
  label.className = 'match-group-label';
  label.textContent = `Grupo ${currentGroup}`;
  container.appendChild(label);

  partidos.forEach((p, idx) => {
    const key = `${currentGroup}-${idx}`;
    const res = resultados[key];
    const played = res && res.local !== '' && res.visit !== '';
    const card = document.createElement('div');
    card.className = `match-card${played ? ' played' : ''}`;
    card.innerHTML = `
      <span class="match-date">${p[2]}</span>
      <span class="match-team">${p[0]}</span>
      <div class="match-score">
        <div class="score-box${!played ? ' empty' : ''}">${played ? res.local : '–'}</div>
        <span class="score-sep-display">:</span>
        <div class="score-box${!played ? ' empty' : ''}">${played ? res.visit : '–'}</div>
      </div>
      <span class="match-team right">${p[1]}</span>
    `;
    card.onclick = () => openModal('grupo', currentGroup, idx, p[0], p[1], res);
    container.appendChild(card);
  });
}

// ===== RENDER: GRUPOS =====
function renderGrupos() {
  const container = document.getElementById('grupos-container');
  container.innerHTML = '';
  const standings = getAllStandings();

  Object.keys(GRUPOS).forEach(g => {
    const s = standings[g];
    const block = document.createElement('div');
    block.className = 'group-block';
    block.innerHTML = `
      <div class="group-block-header">
        <div class="group-badge">${g}</div>
        <span>Grupo ${g}</span>
      </div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th><th>PTS</th>
          </tr>
        </thead>
        <tbody>
          ${s.map((t, i) => {
            const dif = t.dif;
            const difClass = dif > 0 ? 'dif-pos' : dif < 0 ? 'dif-neg' : '';
            return `<tr>
              <td><span class="pos-badge pos-${i+1}">${i+1}</span></td>
              <td>${t.equipo}</td>
              <td>${t.pj}</td>
              <td>${t.pg}</td>
              <td>${t.pe}</td>
              <td>${t.pp}</td>
              <td>${t.gf}</td>
              <td>${t.gc}</td>
              <td class="${difClass}">${dif > 0 ? '+' : ''}${dif}</td>
              <td class="pts-cell">${t.pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
    container.appendChild(block);
  });
}

// ===== RENDER: ELIMINATORIAS =====
function getTeamForRef(ref, standings, classified) {
  if (classified[ref]) return classified[ref];
  // Check previous round winner
  const res = eliminatoriaResults[ref];
  if (res?.winner) return res.winner;
  return null;
}

function renderEliminatorias() {
  const container = document.getElementById('eliminatorias-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const classified = getClassified(standings);

  const phaseNames = {
    '1/16': 'Dieciseisavos de Final',
    '1/8': 'Octavos de Final',
    '1/4': 'Cuartos de Final',
    '1/2': 'Semifinales',
    '3-4': 'Tercer y Cuarto Puesto',
    'FINAL': 'Final'
  };

  Object.keys(ELIMINATORIAS).forEach(phase => {
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'bracket-phase';
    const title = document.createElement('div');
    title.className = 'phase-title';
    title.textContent = phaseNames[phase] || phase;
    phaseDiv.appendChild(title);

    ELIMINATORIAS[phase].forEach(match => {
      const res = eliminatoriaResults[match.id];
      const t1 = getTeamForRef(match.e1, standings, classified) || classified[match.e1] || match.e1.length <= 3 ? (classified[match.e1] || match.desc.split(' vs ')[0]) : match.e1;
      const t2 = getTeamForRef(match.e2, standings, classified) || classified[match.e2] || match.e2;

      // Friendly display for tbd
      const label1 = classified[match.e1] || eliminatoriaResults[match.e1]?.winner || match.e1;
      const label2 = classified[match.e2] || eliminatoriaResults[match.e2]?.winner || match.e2;

      const isTbd1 = !classified[match.e1] && !eliminatoriaResults[match.e1]?.winner;
      const isTbd2 = !classified[match.e2] && !eliminatoriaResults[match.e2]?.winner;

      const played = res && res.local !== undefined;
      const winner = res?.winner;

      const card = document.createElement('div');
      card.className = 'bracket-match';
      card.innerHTML = `
        <div class="bracket-match-id">${match.id}</div>
        <div class="bracket-teams">
          <span class="bracket-team${isTbd1 ? ' tbd' : ''}${winner === label1 ? ' bracket-winner' : ''}">${label1}</span>
          <div class="bracket-score">
            <div class="bracket-score-box">${played && res.local !== undefined ? res.local : '–'}</div>
            <span style="color:var(--text3);font-size:0.7rem;padding:0 2px">:</span>
            <div class="bracket-score-box">${played && res.visit !== undefined ? res.visit : '–'}</div>
          </div>
          <span class="bracket-team${isTbd2 ? ' tbd' : ''}${winner === label2 ? ' bracket-winner' : ''}">${label2}</span>
        </div>
      `;
      card.onclick = () => {
        if (!isTbd1 && !isTbd2) {
          openModalElim(match.id, label1, label2, res);
        }
      };
      phaseDiv.appendChild(card);
    });

    container.appendChild(phaseDiv);
  });
}

// ===== RENDER: COMUNIO =====
function renderComunio() {
  const container = document.getElementById('comunio-container');
  container.innerHTML = '';
  const standings = getAllStandings();

  const results = COMUNIO_PARTICIPANTES.map(p => {
    const { total, breakdown } = calcComunioPoints(p, standings, eliminatoriaResults);
    return { ...p, total, breakdown };
  });
  results.sort((a, b) => b.total - a.total);

  // Podium
  const podiumEmojis = ['🥇', '🥈', '🥉', '4️⃣'];
  const podium = document.createElement('div');
  podium.className = 'comunio-podium';
  results.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = `podium-card${i === 0 ? ' rank-1' : ''}`;
    card.innerHTML = `
      <div class="podium-rank">${podiumEmojis[i]}</div>
      <div class="podium-name">${p.nombre}</div>
      <div class="podium-pts">${p.total}</div>
      <div class="podium-pts-label">pts</div>
    `;
    podium.appendChild(card);
  });
  container.appendChild(podium);

  // Detail
  const detail = document.createElement('div');
  detail.className = 'comunio-detail';
  detail.innerHTML = `<div class="comunio-detail-header"><span>Participante</span><span>Desglose</span></div>`;

  results.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'comunio-participant-row';
    const chipsHtml = p.equipos.map(eq => `
      <div class="comunio-team-chip">
        <span class="chip-name">${eq}</span>
        <span class="chip-pts">${p.breakdown[eq] || 0} pts</span>
      </div>
    `).join('');
    row.innerHTML = `
      <div class="comunio-p-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <span>${podiumEmojis[i]} <strong>${p.nombre}</strong></span>
        <span class="comunio-p-pts">${p.total} pts</span>
      </div>
      <div class="comunio-teams-grid">${chipsHtml}</div>
    `;
    detail.appendChild(row);
  });
  container.appendChild(detail);
}

// ===== MODAL =====
function openModal(type, grupo, idx, local, visit, res) {
  currentModal = { type, grupo, idx };
  document.getElementById('modal-title').textContent = `Grupo ${grupo}`;
  document.getElementById('modal-local').textContent = local;
  document.getElementById('modal-visit').textContent = visit;
  document.getElementById('score-local').value = res?.local ?? '';
  document.getElementById('score-visit').value = res?.visit ?? '';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('score-local').focus(), 100);
}

function openModalElim(matchId, local, visit, res) {
  currentModal = { type: 'elim', matchId, local, visit };
  document.getElementById('modal-title').textContent = matchId;
  document.getElementById('modal-local').textContent = local;
  document.getElementById('modal-visit').textContent = visit;
  document.getElementById('score-local').value = res?.local ?? '';
  document.getElementById('score-visit').value = res?.visit ?? '';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('score-local').focus(), 100);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentModal = null;
}

function saveModal() {
  const sl = document.getElementById('score-local').value;
  const sv = document.getElementById('score-visit').value;
  if (sl === '' || sv === '') return;
  const gl = parseInt(sl), gv = parseInt(sv);
  if (isNaN(gl) || isNaN(gv)) return;

  if (currentModal.type === 'grupo') {
    const key = `${currentModal.grupo}-${currentModal.idx}`;
    resultados[key] = { local: gl, visit: gv };
  } else if (currentModal.type === 'elim') {
    const winner = gl > gv ? currentModal.local : gv > gl ? currentModal.visit : null;
    const loser  = gl > gv ? currentModal.visit : gv > gl ? currentModal.local : null;
    eliminatoriaResults[currentModal.matchId] = {
      local: gl, visit: gv, winner, loser,
      teamLocal: currentModal.local, teamVisit: currentModal.visit
    };
  }

  saveData();
  closeModal();
  renderAll();
}

function clearModal() {
  if (currentModal.type === 'grupo') {
    const key = `${currentModal.grupo}-${currentModal.idx}`;
    delete resultados[key];
  } else if (currentModal.type === 'elim') {
    delete eliminatoriaResults[currentModal.matchId];
  }
  saveData();
  closeModal();
  renderAll();
}

// ===== NAVIGATION =====
function renderAll() {
  renderPartidos();
  renderGrupos();
  renderEliminatorias();
  renderComunio();
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`sec-${btn.dataset.section}`).classList.add('active');
    });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Hide splash
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    document.getElementById('app').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
    }, 600);
  }, 1400);

  initNav();
  renderAll();

  // Modal events
  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('modal-clear').addEventListener('click', clearModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.querySelector('.modal-overlay').addEventListener('click', closeModal);

  // Enter key in score inputs
  document.getElementById('score-local').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('score-visit').focus();
  });
  document.getElementById('score-visit').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveModal();
  });
});

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
