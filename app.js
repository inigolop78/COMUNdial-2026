// ===== STATE =====
let resultados = {};
let elimResults = {};
let currentModal = null;

// ===== STORAGE =====
function save() {
  localStorage.setItem('mw26_res', JSON.stringify(resultados));
  localStorage.setItem('mw26_eli', JSON.stringify(elimResults));
}
function load() {
  try {
    const r = localStorage.getItem('mw26_res'); if (r) resultados = JSON.parse(r);
    const e = localStorage.getItem('mw26_eli'); if (e) elimResults = JSON.parse(e);
  } catch(e) {}
}

// ===== STANDINGS =====
function calcStandings(grupo) {
  const equipos = GRUPOS[grupo];
  const partidos = PARTIDOS_GRUPO[grupo];
  const st = {};
  equipos.forEach(eq => { st[eq] = {pts:0,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0}; });
  partidos.forEach((p, idx) => {
    const res = resultados[`${grupo}-${idx}`];
    if (!res || res.local==='' || res.visit==='') return;
    const gl=parseInt(res.local), gv=parseInt(res.visit);
    if (isNaN(gl)||isNaN(gv)) return;
    st[p[0]].pj++; st[p[1]].pj++;
    st[p[0]].gf+=gl; st[p[0]].gc+=gv;
    st[p[1]].gf+=gv; st[p[1]].gc+=gl;
    if (gl>gv)      { st[p[0]].pts+=3; st[p[0]].pg++; st[p[1]].pp++; }
    else if (gl<gv) { st[p[1]].pts+=3; st[p[1]].pg++; st[p[0]].pp++; }
    else            { st[p[0]].pts++;  st[p[0]].pe++;  st[p[1]].pts++; st[p[1]].pe++; }
  });
  return equipos.map(eq=>({equipo:eq,...st[eq],dif:st[eq].gf-st[eq].gc}))
    .sort((a,b)=>b.pts-a.pts||b.dif-a.dif||b.gf-a.gf);
}

function isGroupFinished(grupo) {
  const partidos = PARTIDOS_GRUPO[grupo];
  return partidos.every((p, idx) => {
    const res = resultados[`${grupo}-${idx}`];
    return res && res.local !== '' && res.visit !== '' && !isNaN(parseInt(res.local)) && !isNaN(parseInt(res.visit));
  });
}

function getAllStandings() {
  const all={};
  Object.keys(GRUPOS).forEach(g=>{all[g]=calcStandings(g);});
  return all;
}

function getClassified(standings) {
  const c={};
  Object.keys(standings).forEach(g=>{
    if (isGroupFinished(g)) {
      standings[g].forEach((t,i)=>{ c[`${i+1}${g}`]=t.equipo; });
    }
  });
  return c;
}

function getTeamLabel(ref, classified) {
  if (classified[ref]) return { name: classified[ref], tbd: false };
  const res = elimResults[ref];
  if (res?.winner) return { name: res.winner, tbd: false };
  if (ref.endsWith('L')) {
    const matchId = ref.slice(0,-1);
    const r = elimResults[matchId];
    if (r?.loser) return { name: r.loser, tbd: false };
  }
  return { name: 'Por determinar', tbd: true };
}

// ===== TEAM POINTS (for Puntuaciones + Apuestas) =====
function calcTeamPoints(standings) {
  const pts = {};
  // Init all teams
  Object.keys(GRUPOS).forEach(g => {
    GRUPOS[g].forEach(eq => { pts[eq] = 0; });
  });

  // Group stage match points (3 win, 1 draw) — always count
  Object.keys(standings).forEach(g => {
    standings[g].forEach(t => {
      pts[t.equipo] += t.pts;
    });
  });

  // Dieciseisavos bonus (1st=5, 2nd=3, 3rd=1) — ONLY if group is finished
  Object.keys(standings).forEach(g => {
    if (!isGroupFinished(g)) return;
    const bonus = [5,3,1,0];
    standings[g].forEach((t,i) => {
      pts[t.equipo] += bonus[i] || 0;
    });
  });

  // Knockout bonuses
  BRACKET.forEach(m => {
    const res = elimResults[m.id];
    if (!res?.winner) return;
    const bonusMap = { OF:15, CF:20, SF:30 };
    const prefix = m.id.replace(/\d+.*/, '');
    if (bonusMap[prefix]) pts[res.winner] = (pts[res.winner]||0) + bonusMap[prefix];
    if (m.id === 'TP') {
      pts[res.winner] = (pts[res.winner]||0) + PUNTUACION_COMUNIO.tercerPuesto;
      if (res.loser) pts[res.loser] = (pts[res.loser]||0) + PUNTUACION_COMUNIO.cuartoPuesto;
    }
    if (m.id === 'FIN') {
      pts[res.winner] = (pts[res.winner]||0) + PUNTUACION_COMUNIO.campeon;
      if (res.loser) pts[res.loser] = (pts[res.loser]||0) + PUNTUACION_COMUNIO.segundoPuesto;
    }
  });

  return pts;
}

function calcTeamBreakdown(equipo, standings) {
  const g = Object.keys(GRUPOS).find(g => GRUPOS[g].includes(equipo));
  const st = standings[g]?.find(t => t.equipo === equipo);
  const breakdown = {
    faseGrupos: st ? st.pts : 0,
    dieciseisavos: 0, octavos: 0, cuartos: 0,
    semifinal: 0, cuarto: 0, tercero: 0, segundo: 0, campeon: 0
  };

  if (isGroupFinished(g) && st) {
    const pos = standings[g].findIndex(t => t.equipo === equipo);
    breakdown.dieciseisavos = [5,3,1,0][pos] || 0;
  }

  BRACKET.forEach(m => {
    const res = elimResults[m.id];
    if (!res) return;
    const prefix = m.id.replace(/\d+.*/, '');
    if (res.winner === equipo) {
      if (prefix === 'OF') breakdown.octavos = 15;
      if (prefix === 'CF') breakdown.cuartos = 20;
      if (prefix === 'SF') breakdown.semifinal = 30;
      if (m.id === 'TP')  breakdown.tercero = PUNTUACION_COMUNIO.tercerPuesto;
      if (m.id === 'FIN') breakdown.campeon = PUNTUACION_COMUNIO.campeon;
    }
    if (res.loser === equipo) {
      if (prefix === 'SF') breakdown.cuarto = PUNTUACION_COMUNIO.cuartoPuesto;
      if (m.id === 'FIN')  breakdown.segundo = PUNTUACION_COMUNIO.segundoPuesto;
    }
  });

  return breakdown;
}

// ===== RENDER: FASE DE GRUPOS =====
function renderFaseGrupos() {
  const container = document.getElementById('fasegrupos-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const grupKeys = Object.keys(GRUPOS);
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Single scrollable row with all groups
    const wrap = document.createElement('div');
    wrap.className = 'group-row-wrap';
    const row = document.createElement('div');
    row.className = 'group-row';
    grupKeys.forEach(g => {
      const s = standings[g];
      const block = document.createElement('div');
      block.className = 'group-col';
      const hdr = document.createElement('div');
      hdr.className = 'group-col-header';
      hdr.innerHTML = `<div class="group-badge">${g}</div><span>Grupo ${g}</span>`;
      block.appendChild(hdr);
      const matchesDiv = document.createElement('div');
      matchesDiv.className = 'group-matches';
      PARTIDOS_GRUPO[g].forEach((p, idx) => {
        const key = `${g}-${idx}`;
        const res = resultados[key];
        const played = res && res.local!=='' && res.visit!=='';
        const mc = document.createElement('div');
        mc.className = `mini-match${played?' played':''}`;
        mc.innerHTML = `
          <span class="mini-team">${p[0]}</span>
          <div class="mini-score">
            <span class="mini-box${!played?' empty':''}">${played?res.local:'–'}</span>
            <span class="mini-sep">:</span>
            <span class="mini-box${!played?' empty':''}">${played?res.visit:'–'}</span>
          </div>
          <span class="mini-team right">${p[1]}</span>
        `;
        mc.onclick = () => openModal('grupo', g, idx, p[0], p[1], res);
        matchesDiv.appendChild(mc);
      });
      block.appendChild(matchesDiv);
      // Spacer that fills remaining height between matches and standings
      const spacer = document.createElement('div');
      spacer.className = 'group-spacer';
      block.appendChild(spacer);
      const tbl = document.createElement('table');
      tbl.className = 'mini-table';
      tbl.innerHTML = `<thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PTS</th><th>DIF</th></tr></thead>`;
      const tbody = document.createElement('tbody');
      s.forEach((t,i) => {
        const dif = t.dif;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="pos-badge pos-${i+1}">${i+1}</span></td>
          <td class="team-name-cell">${t.equipo}</td>
          <td>${t.pj}</td>
          <td class="pts-cell">${t.pts}</td>
          <td class="${dif>0?'dif-pos':dif<0?'dif-neg':''}">${dif>0?'+':''}${dif}</td>
        `;
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      block.appendChild(tbl);
      row.appendChild(block);
    });
    wrap.appendChild(row);
    container.appendChild(wrap);
    return;
  }

  for (let i=0; i<grupKeys.length; i+=6) {
    const wrap = document.createElement('div');
    wrap.className = 'group-row-wrap';
    const row = document.createElement('div');
    row.className = 'group-row';
    [grupKeys[i], grupKeys[i+1], grupKeys[i+2], grupKeys[i+3], grupKeys[i+4], grupKeys[i+5]].forEach(g => {
      if (!g) return;
      const s = standings[g];
      const block = document.createElement('div');
      block.className = 'group-col';
      const hdr = document.createElement('div');
      hdr.className = 'group-col-header';
      hdr.innerHTML = `<div class="group-badge">${g}</div><span>Grupo ${g}</span>`;
      block.appendChild(hdr);
      const matchesDiv = document.createElement('div');
      matchesDiv.className = 'group-matches';
      PARTIDOS_GRUPO[g].forEach((p, idx) => {
        const key = `${g}-${idx}`;
        const res = resultados[key];
        const played = res && res.local!=='' && res.visit!=='';
        const mc = document.createElement('div');
        mc.className = `mini-match${played?' played':''}`;
        mc.innerHTML = `
          <span class="mini-team">${p[0]}</span>
          <div class="mini-score">
            <span class="mini-box${!played?' empty':''}">${played?res.local:'–'}</span>
            <span class="mini-sep">:</span>
            <span class="mini-box${!played?' empty':''}">${played?res.visit:'–'}</span>
          </div>
          <span class="mini-team right">${p[1]}</span>
        `;
        mc.onclick = () => openModal('grupo', g, idx, p[0], p[1], res);
        matchesDiv.appendChild(mc);
      });
      block.appendChild(matchesDiv);
      // Spacer that fills remaining height between matches and standings
      const spacer = document.createElement('div');
      spacer.className = 'group-spacer';
      block.appendChild(spacer);
      const tbl = document.createElement('table');
      tbl.className = 'mini-table';
      tbl.innerHTML = `<thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PTS</th><th>DIF</th></tr></thead>`;
      const tbody = document.createElement('tbody');
      s.forEach((t,i) => {
        const dif = t.dif;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="pos-badge pos-${i+1}">${i+1}</span></td>
          <td class="team-name-cell">${t.equipo}</td>
          <td>${t.pj}</td>
          <td class="pts-cell">${t.pts}</td>
          <td class="${dif>0?'dif-pos':dif<0?'dif-neg':''}">${dif>0?'+':''}${dif}</td>
        `;
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      block.appendChild(tbl);
      row.appendChild(block);
    });
    wrap.appendChild(row);
    container.appendChild(wrap);
  }
}

// ===== RENDER: ELIMINATORIAS =====
function renderEliminatorias() {
  const container = document.getElementById('eliminatorias-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const classified = getClassified(standings);

  const rounds = [
    { label: 'Dieciseisavos', ids: ['DF1','DF2','DF3','DF4','DF5','DF6','DF7','DF8','DF9','DF10','DF11','DF12','DF13','DF14','DF15','DF16'] },
    { label: 'Octavos',       ids: ['OF1','OF2','OF3','OF4','OF5','OF6','OF7','OF8'] },
    { label: 'Cuartos',       ids: ['CF1','CF2','CF3','CF4'] },
    { label: 'Semis',         ids: ['SF1','SF2'] },
    { label: '3º/4º · Final', ids: ['TP','FIN'] },
  ];

  const bracketWrap = document.createElement('div');
  bracketWrap.className = 'bracket-scroll';
  const bracketInner = document.createElement('div');
  bracketInner.className = 'bracket-inner';

  rounds.forEach(round => {
    const col = document.createElement('div');
    col.className = 'bracket-col';
    const lbl = document.createElement('div');
    lbl.className = 'bracket-col-label';
    lbl.textContent = round.label;
    col.appendChild(lbl);
    const matchesWrap = document.createElement('div');
    matchesWrap.className = 'bracket-col-matches';

    round.ids.forEach(id => {
      const m = BRACKET.find(b=>b.id===id);
      if (!m) return;
      const t1 = getTeamLabel(m.e1, classified);
      const t2 = getTeamLabel(m.e2, classified);
      const res = elimResults[id];
      const played = res && res.local !== undefined;
      const winner = res?.winner;

      const card = document.createElement('div');
      card.className = `b-match${played?' b-played':''}`;

      const makeRow = (team, score, isWinner) => {
        const div = document.createElement('div');
        div.className = `b-team${team.tbd?' b-tbd':''}${isWinner?' b-winner':''}`;
        div.innerHTML = `<span class="b-name">${team.name}</span><span class="b-score">${played&&score!==undefined?score:''}</span>`;
        return div;
      };

      card.appendChild(makeRow(t1, res?.local,  winner===t1.name));
      const div = document.createElement('div'); div.className='b-divider'; card.appendChild(div);
      card.appendChild(makeRow(t2, res?.visit, winner===t2.name));
      const idLbl = document.createElement('div'); idLbl.className='b-id'; idLbl.textContent=id; card.appendChild(idLbl);

      card.onclick = () => {
        if (!t1.tbd && !t2.tbd) openModalElim(id, t1.name, t2.name, res);
      };
      matchesWrap.appendChild(card);
    });

    col.appendChild(matchesWrap);
    bracketInner.appendChild(col);
  });

  bracketWrap.appendChild(bracketInner);
  container.appendChild(bracketWrap);
}

// ===== RENDER: PUNTUACIONES =====
function renderPuntuaciones() {
  const container = document.getElementById('puntuaciones-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const teamPts = calcTeamPoints(standings);

  const wrap = document.createElement('div');
  wrap.className = 'pts-layout';

  // Main table
  const tableWrap = document.createElement('div');
  tableWrap.className = 'pts-main-wrap';
  const tbl = document.createElement('table');
  tbl.className = 'pts-main-table';
  tbl.innerHTML = `<thead><tr>
    <th>Equipo</th><th>Gr</th><th>GF</th><th>1/16</th><th>Oct</th>
    <th>Cto</th><th>Semi</th><th>4º</th><th>3º</th><th>2º</th><th>🏆</th><th>Tot</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  const allTeams2 = [];
  Object.keys(GRUPOS).forEach(g => { GRUPOS[g].forEach(eq => { allTeams2.push({eq,g,total:teamPts[eq]||0}); }); });
  allTeams2.sort((a,b) => b.total - a.total || a.g.localeCompare(b.g));
  allTeams2.forEach(({eq,g}) => {
      const bd = calcTeamBreakdown(eq, standings);
      const total = teamPts[eq] || 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="pts-team">${eq}</td>
        <td class="pts-grp">${g}</td>
        <td>${bd.faseGrupos||0}</td>
        <td>${bd.dieciseisavos||0}</td>
        <td>${bd.octavos||0}</td>
        <td>${bd.cuartos||0}</td>
        <td>${bd.semifinal||0}</td>
        <td>${bd.cuarto||0}</td>
        <td>${bd.tercero||0}</td>
        <td>${bd.segundo||0}</td>
        <td>${bd.campeon||0}</td>
        <td class="pts-total">${total}</td>
      `;
      tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  tableWrap.appendChild(tbl);
  wrap.appendChild(tableWrap);

  // Summary table on the right
  const summaryWrap = document.createElement('div');
  summaryWrap.className = 'pts-summary-wrap';
  summaryWrap.innerHTML = `
    <table class="pts-summary-table">
      <thead><tr><th colspan="2">Puntuación</th></tr></thead>
      <tbody>
        <tr><td>1/16 · 1º grupo</td><td>5</td></tr>
        <tr><td>1/16 · 2º grupo</td><td>3</td></tr>
        <tr><td>1/16 · 3º grupo</td><td>1</td></tr>
        <tr><td>Octavos</td><td>15</td></tr>
        <tr><td>Cuartos</td><td>20</td></tr>
        <tr><td>Semifinal</td><td>30</td></tr>
        <tr><td>4º Puesto</td><td>30</td></tr>
        <tr><td>3er Puesto</td><td>45</td></tr>
        <tr><td>2º Puesto</td><td>60</td></tr>
        <tr><td>🏆 Campeón</td><td>75</td></tr>
      </tbody>
    </table>
  `;
  wrap.appendChild(summaryWrap);
  container.appendChild(wrap);
}

// ===== RENDER: APUESTAS =====
function renderApuestas() {
  const container = document.getElementById('apuestas-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const teamPts = calcTeamPoints(standings);

  const participantes = APUESTAS.map(p => {
    const total = p.equipos.reduce((s,eq)=>(s+(teamPts[eq]||0)),0);
    const breakdown = {};
    p.equipos.forEach(eq=>{ breakdown[eq]=teamPts[eq]||0; });
    return {...p, total, breakdown};
  }).sort((a,b)=>b.total-a.total);

  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

  // Layout: 2 rows of 5 participants + ranking on right
  const apuestasLayout = document.createElement('div');
  apuestasLayout.className = 'apuestas-layout';

  const cardsCol = document.createElement('div');
  cardsCol.className = 'apuestas-cards-col';

  // Row 1: first 5 participants
  const row1 = document.createElement('div');
  row1.className = 'apuestas-row';
  // Row 2: last 5 participants
  const row2 = document.createElement('div');
  row2.className = 'apuestas-row';

  participantes.forEach((p,i) => {
    const card = document.createElement('div');
    card.className = 'apuesta-card';
    const sorted = [...p.equipos].sort((a,b)=>(p.breakdown[b]||0)-(p.breakdown[a]||0));
    card.innerHTML = `
      <div class="apuesta-card-header">
        <span>${medals[i]} <strong>${p.nombre}</strong></span>
        <span class="apuesta-total">${p.total} pts</span>
      </div>
      <div class="apuesta-teams-list">
        ${sorted.map(eq=>`
          <div class="apuesta-chip">
            <span class="chip-name">${eq}</span>
            <span class="chip-pts">${p.breakdown[eq]||0}</span>
          </div>
        `).join('')}
      </div>
    `;
    if (i < 5) row1.appendChild(card);
    else row2.appendChild(card);
  });

  cardsCol.appendChild(row1);
  cardsCol.appendChild(row2);

  const rankCol = document.createElement('div');
  rankCol.className = 'apuestas-rank-col';
  const rankDiv = document.createElement('div');
  rankDiv.className = 'apuestas-ranking';
  const rankTitle = document.createElement('div');
  rankTitle.className = 'rank-title';
  rankTitle.innerHTML = '<span>Participante</span><span>Puntos</span>';
  rankDiv.appendChild(rankTitle);
  participantes.forEach((p,i) => {
    const row = document.createElement('div');
    row.className = `rank-row${i===0?' rank-first':''}`;
    row.innerHTML = `
      <span class="rank-medal">${medals[i]}</span>
      <span class="rank-name">${p.nombre}</span>
      <span class="rank-pts">${p.total}</span>
    `;
    rankDiv.appendChild(row);
  });
  rankCol.appendChild(rankDiv);

  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    apuestasLayout.appendChild(rankCol);
    apuestasLayout.appendChild(cardsCol);
  } else {
    apuestasLayout.appendChild(cardsCol);
    apuestasLayout.appendChild(rankCol);
  }
  container.appendChild(apuestasLayout);
}

// ===== MODAL =====
function openModal(type, grupo, idx, local, visit, res) {
  currentModal = {type, grupo, idx, local, visit};
  document.getElementById('modal-title').textContent = `${local} vs ${visit}`;
  document.getElementById('modal-local').textContent = local;
  document.getElementById('modal-visit').textContent = visit;
  document.getElementById('score-local').value = res?.local ?? '';
  document.getElementById('score-visit').value = res?.visit ?? '';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('score-local').focus(),100);
}
function openModalElim(id, local, visit, res) {
  currentModal = {type:'elim', matchId:id, local, visit};
  document.getElementById('modal-title').textContent = `${id} · ${local} vs ${visit}`;
  document.getElementById('modal-local').textContent = local;
  document.getElementById('modal-visit').textContent = visit;
  document.getElementById('score-local').value = res?.local ?? '';
  document.getElementById('score-visit').value = res?.visit ?? '';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('score-local').focus(),100);
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentModal = null;
}
function saveModal() {
  const sl = document.getElementById('score-local').value;
  const sv = document.getElementById('score-visit').value;
  if (sl===''||sv==='') return;
  const gl=parseInt(sl), gv=parseInt(sv);
  if (isNaN(gl)||isNaN(gv)) return;
  if (currentModal.type==='grupo') {
    resultados[`${currentModal.grupo}-${currentModal.idx}`] = {local:gl,visit:gv};
  } else {
    const winner = gl>gv?currentModal.local:gv>gl?currentModal.visit:null;
    const loser  = gl>gv?currentModal.visit:gv>gl?currentModal.local:null;
    elimResults[currentModal.matchId] = {local:gl,visit:gv,winner,loser};
  }
  save(); closeModal(); renderAll();
}
function clearModal() {
  if (currentModal.type==='grupo') delete resultados[`${currentModal.grupo}-${currentModal.idx}`];
  else delete elimResults[currentModal.matchId];
  save(); closeModal(); renderAll();
}

// ===== NAV =====
function renderAll() {
  renderFaseGrupos();
  renderEliminatorias();
  renderPuntuaciones();
  renderApuestas();
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`sec-${btn.dataset.section}`).classList.add('active');
    });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  load();
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    document.getElementById('app').classList.remove('hidden');
    setTimeout(()=>{ document.getElementById('splash').style.display='none'; }, 600);
  }, 500);
  initNav();
  renderAll();
  initSync();
  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('modal-clear').addEventListener('click', clearModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.querySelector('.modal-overlay').addEventListener('click', closeModal);
  document.getElementById('score-local').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('score-visit').focus(); });
  document.getElementById('score-visit').addEventListener('keydown', e=>{ if(e.key==='Enter') saveModal(); });
});

// Service worker disabled to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}
