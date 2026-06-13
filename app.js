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

function getAllStandings() {
  const all={};
  Object.keys(GRUPOS).forEach(g=>{all[g]=calcStandings(g);});
  return all;
}

function getClassified(standings) {
  const c={};
  Object.keys(standings).forEach(g=>{
    standings[g].forEach((t,i)=>{ c[`${i+1}${g}`]=t.equipo; });
  });
  return c;
}

function getTeamLabel(ref, classified) {
  if (classified[ref]) return { name: classified[ref], tbd: false };
  const res = elimResults[ref];
  if (res?.winner) return { name: res.winner, tbd: false };
  // loser ref
  if (ref.endsWith('L')) {
    const matchId = ref.slice(0,-1);
    const r = elimResults[matchId];
    if (r?.loser) return { name: r.loser, tbd: false };
  }
  return { name: ref, tbd: true };
}

// ===== COMUNIO POINTS =====
function calcTeamPoints(standings) {
  const pts = {};
  // Group stage
  Object.keys(standings).forEach(g => {
    standings[g].forEach(t => {
      if (!pts[t.equipo]) pts[t.equipo] = 0;
      pts[t.equipo] += t.pts; // 3 win, 1 draw
    });
  });
  // 1/16 bonus by position
  Object.keys(standings).forEach(g => {
    const bonus = [5,3,1,0];
    standings[g].forEach((t,i) => {
      pts[t.equipo] = (pts[t.equipo]||0) + bonus[i];
    });
  });
  // Knockout bonuses
  const bonusMap = {'OF':15,'CF':20,'SF':30,'FIN':75};
  BRACKET.forEach(m => {
    const res = elimResults[m.id];
    if (!res?.winner) return;
    if (!pts[res.winner]) pts[res.winner]=0;
    const prefix = m.id.replace(/\d+/,'');
    if (bonusMap[prefix]) pts[res.winner] += bonusMap[prefix];
    // Loser bonuses
    if (m.id==='TP') {
      if (res.winner) pts[res.winner] = (pts[res.winner]||0) + PUNTUACION_COMUNIO.tercerPuesto;
      if (res.loser)  pts[res.loser]  = (pts[res.loser]||0)  + PUNTUACION_COMUNIO.cuartoPuesto;
    }
    if (m.id==='FIN' && res.loser) {
      pts[res.loser] = (pts[res.loser]||0) + PUNTUACION_COMUNIO.segundoPuesto;
    }
  });
  return pts;
}

// ===== RENDER: FASE DE GRUPOS =====
function renderFaseGrupos() {
  const container = document.getElementById('fasegrupos-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const grupKeys = Object.keys(GRUPOS);

  for (let i=0; i<grupKeys.length; i+=2) {
    const row = document.createElement('div');
    row.className = 'group-row';
    [grupKeys[i], grupKeys[i+1]].forEach(g => {
      if (!g) return;
      const s = standings[g];
      const block = document.createElement('div');
      block.className = 'group-col';
      // Header
      const hdr = document.createElement('div');
      hdr.className = 'group-col-header';
      hdr.innerHTML = `<div class="group-badge">${g}</div><span>Grupo ${g}</span>`;
      block.appendChild(hdr);
      // Matches
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
          <span class="mini-date">${p[2]}</span>
        `;
        mc.onclick = () => openModal('grupo', g, idx, p[0], p[1], res);
        matchesDiv.appendChild(mc);
      });
      block.appendChild(matchesDiv);
      // Standings table
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
    container.appendChild(row);
  }
}

// ===== RENDER: ELIMINATORIAS (BRACKET) =====
function renderEliminatorias() {
  const container = document.getElementById('eliminatorias-container');
  container.innerHTML = '';
  const standings = getAllStandings();
  const classified = getClassified(standings);

  // Group by round
  const rounds = [
    { label: 'Dieciseisavos', ids: ['DF1','DF2','DF3','DF4','DF5','DF6','DF7','DF8','DF9','DF10','DF11','DF12','DF13','DF14','DF15','DF16'] },
    { label: 'Octavos', ids: ['OF1','OF2','OF3','OF4','OF5','OF6','OF7','OF8'] },
    { label: 'Cuartos', ids: ['CF1','CF2','CF3','CF4'] },
    { label: 'Semis', ids: ['SF1','SF2'] },
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

      const card = document.createElement('div');
      card.className = 'b-match';
      if (played) card.classList.add('b-played');

      const makeTeamRow = (team, scoreVal, isWinner) => {
        const div = document.createElement('div');
        div.className = `b-team${team.tbd?' b-tbd':''}${isWinner?' b-winner':''}`;
        div.innerHTML = `
          <span class="b-name">${team.name}</span>
          <span class="b-score">${played && scoreVal!==undefined ? scoreVal : ''}</span>
        `;
        return div;
      };

      const winner = res?.winner;
      card.appendChild(makeTeamRow(t1, res?.local,  winner===t1.name));
      const divider = document.createElement('div');
      divider.className = 'b-divider';
      card.appendChild(divider);
      card.appendChild(makeTeamRow(t2, res?.visit, winner===t2.name));

      const idLabel = document.createElement('div');
      idLabel.className = 'b-id';
      idLabel.textContent = id;
      card.appendChild(idLabel);

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

  // Ranking table
  const rankDiv = document.createElement('div');
  rankDiv.className = 'apuestas-ranking';
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  participantes.forEach((p,i) => {
    const row = document.createElement('div');
    row.className = `rank-row${i===0?' rank-first':''}`;
    row.innerHTML = `
      <span class="rank-medal">${medals[i]}</span>
      <span class="rank-name">${p.nombre}</span>
      <span class="rank-pts">${p.total} <small>pts</small></span>
    `;
    rankDiv.appendChild(row);
  });
  container.appendChild(rankDiv);

  // Detail cards
  participantes.forEach((p,i) => {
    const card = document.createElement('div');
    card.className = 'apuesta-card';
    const sortedEquipos = [...p.equipos].sort((a,b)=>(p.breakdown[b]||0)-(p.breakdown[a]||0));
    card.innerHTML = `
      <div class="apuesta-card-header">
        <span>${medals[i]} <strong>${p.nombre}</strong></span>
        <span class="apuesta-total">${p.total} pts</span>
      </div>
      <div class="apuesta-teams">
        ${sortedEquipos.map(eq=>`
          <div class="apuesta-chip">
            <span class="chip-name">${eq}</span>
            <span class="chip-pts">${p.breakdown[eq]||0}</span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

// ===== RENDER: PUNTUACIONES =====
function renderPuntuaciones() {
  const container = document.getElementById('puntuaciones-container');
  container.innerHTML = `
    <div class="pts-table-wrap">
      <table class="pts-table">
        <thead>
          <tr><th>Fase</th><th>Condición</th><th>Puntos</th></tr>
        </thead>
        <tbody>
          <tr><td>Fase de Grupos</td><td>Victoria</td><td class="pts-val">3</td></tr>
          <tr><td>Fase de Grupos</td><td>Empate</td><td class="pts-val">1</td></tr>
          <tr><td>Dieciseisavos</td><td>1º de grupo</td><td class="pts-val">5</td></tr>
          <tr><td>Dieciseisavos</td><td>2º de grupo</td><td class="pts-val">3</td></tr>
          <tr><td>Dieciseisavos</td><td>3º de grupo</td><td class="pts-val">1</td></tr>
          <tr><td>Octavos</td><td>Pasar ronda</td><td class="pts-val">15</td></tr>
          <tr><td>Cuartos</td><td>Pasar ronda</td><td class="pts-val">20</td></tr>
          <tr><td>Semifinal</td><td>Pasar ronda</td><td class="pts-val">30</td></tr>
          <tr><td>4º Puesto</td><td>Perder semifinal</td><td class="pts-val">30</td></tr>
          <tr><td>3er Puesto</td><td>Ganar 3º/4º</td><td class="pts-val">45</td></tr>
          <tr><td>2º Puesto</td><td>Finalista</td><td class="pts-val">60</td></tr>
          <tr><td>🏆 Campeón</td><td>Ganar el Mundial</td><td class="pts-val gold">75</td></tr>
        </tbody>
      </table>
    </div>
    <div class="pts-note">
      Los puntos de fase de grupos se acumulan partido a partido.<br>
      Los puntos de dieciseisavos se otorgan según la posición final en el grupo.
    </div>
  `;
}

// ===== MODAL =====
function openModal(type, grupo, idx, local, visit, res) {
  currentModal = {type, grupo, idx, local, visit};
  document.getElementById('modal-title').textContent = `Grupo ${grupo} · ${local} vs ${visit}`;
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
  renderApuestas();
  renderPuntuaciones();
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
  }, 1400);
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
