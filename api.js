const WORKER_URL = 'https://mundial-proxy.inigolop.workers.dev';

const TEAM_NAME_MAP = {
  'Czech Republic':         'República Checa',
  'Netherlands':            'Países Bajos',
  'DR Congo':               'R.D. del Congo',
  "Côte d'Ivoire":          'Costa de Marfil',
  'Ivory Coast':            'Costa de Marfil',
  'Saudi Arabia':           'Arabia Saudí',
  'Bosnia and Herzegovina': 'Bosnia Herzegovina',
  'Bosnia-Herzegovina':     'Bosnia Herzegovina',
  'New Zealand':            'Nueva Zelanda',
  'USA':                    'Estados Unidos',
  'United States':          'Estados Unidos',
  'South Korea':            'Corea del Sur',
  'Korea Republic':         'Corea del Sur',
  'Curacao':                'Curaçao',
  'Czechia':                'República Checa',
  'Iran':                   'Irán',
  'Morocco':                'Marruecos',
  'Brazil':                 'Brasil',
  'Haiti':                  'Haití',
  'Scotland':               'Escocia',
  'Algeria':                'Argelia',
  'Norway':                 'Noruega',
  'Sweden':                 'Suecia',
  'Switzerland':            'Suiza',
  'Belgium':                'Bélgica',
  'Egypt':                  'Egipto',
  'Germany':                'Alemania',
  'France':                 'Francia',
  'Spain':                  'España',
  'Japan':                  'Japón',
  'Tunisia':                'Túnez',
  'Panama':                 'Panamá',
  'Croatia':                'Croacia',
  'Scotland':               'Escocia',
  'Haiti':                  'Haití',
  'Canada':                 'Canadá',
  'Mexico':                 'México',
  'Jordan':                 'Jordania',
  'Uzbekistan':             'Uzbekistán',
  'Cape Verde':             'Cabo Verde',
  'South Africa':           'Sudáfrica',
  'Turkey':                 'Turquía',
  'Türkiye':                'Turquía',
};

function fromApiName(n) { return TEAM_NAME_MAP[n] || n; }

// Map API stage names to our bracket IDs
const STAGE_TO_ROUNDS = {
  'LAST_32':         'DF',
  'ROUND_OF_32':     'DF',
  'LAST_16':         'OF',
  'ROUND_OF_16':     'OF',
  'QUARTER_FINALS':  'CF',
  'SEMI_FINALS':     'SF',
  'THIRD_PLACE':     'TP',
  'FINAL':           'FIN',
};

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = { loading:'Actualizando...', ok:'Actualizado', error:'Sin conexión', idle:'' }[state]||'';
}

function matchGroupFixture(home, away, gl, gv) {
  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      if (p[0]===home && p[1]===away) return { key:`${grupo}-${idx}`, local:gl, visit:gv };
      if (p[0]===away && p[1]===home) return { key:`${grupo}-${idx}`, local:gv, visit:gl };
    }
  }
  return null;
}

function matchKnockoutFixture(home, away, gl, gv, stage) {
  // Find the bracket match that has these two teams
  const prefix = STAGE_TO_ROUNDS[stage];
  if (!prefix) return null;

  for (const m of BRACKET) {
    if (!m.id.startsWith(prefix) && m.id !== 'TP' && m.id !== 'FIN') continue;
    if (stage === 'THIRD_PLACE' && m.id !== 'TP') continue;
    if (stage === 'FINAL' && m.id !== 'FIN') continue;

    const res = elimResults[m.id];
    const t1name = res?.teamLocal || getTeamFromRef(m.e1);
    const t2name = res?.teamVisit || getTeamFromRef(m.e2);

    if ((t1name===home && t2name===away) || (t1name===away && t2name===home)) {
      const reversed = t1name===away;
      return {
        matchId: m.id,
        local: reversed ? gv : gl,
        visit: reversed ? gl : gv,
        winner: gl > gv ? (reversed ? away : home) : gv > gl ? (reversed ? home : away) : null,
        loser:  gl > gv ? (reversed ? home : away) : gv > gl ? (reversed ? away : home) : null,
        teamLocal: reversed ? away : home,
        teamVisit: reversed ? home : away,
      };
    }
  }
  return null;
}

function getTeamFromRef(ref) {
  // Try to resolve a ref like "1A", "2B", "DF1" etc from current standings
  return null; // will be resolved by the app when teams are known
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    const res = await fetch(WORKER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.matches?.length) throw new Error('No matches');

    const FINISHED = ['FINISHED','IN_PLAY','PAUSED'];
    let updatedGroups = 0;
    let updatedKnockout = 0;

    data.matches.forEach(m => {
      if (!FINISHED.includes(m.status)) return;
      const gl = m.score?.fullTime?.home;
      const gv = m.score?.fullTime?.away;
      if (gl == null || gv == null) return;

      const home = fromApiName(m.homeTeam.name);
      const away = fromApiName(m.awayTeam.name);
      const stage = m.stage;

      // Group stage
      if (stage && (stage.includes('GROUP') || stage === 'GROUP_STAGE')) {
        const match = matchGroupFixture(home, away, gl, gv);
        if (!match) return;
        const existing = resultados[match.key];
        if (existing && !existing.fromAPI) return;
        resultados[match.key] = { local: match.local, visit: match.visit, fromAPI: true };
        updatedGroups++;
        return;
      }

      // Knockout stages
      const knockoutMatch = matchKnockoutFixture(home, away, gl, gv, stage);
      if (knockoutMatch) {
        const existing = elimResults[knockoutMatch.matchId];
        if (existing && !existing.fromAPI) return;
        elimResults[knockoutMatch.matchId] = {
          local: knockoutMatch.local,
          visit: knockoutMatch.visit,
          winner: knockoutMatch.winner,
          loser: knockoutMatch.loser,
          teamLocal: knockoutMatch.teamLocal,
          teamVisit: knockoutMatch.teamVisit,
          fromAPI: true
        };
        updatedKnockout++;
      }
    });

    if (updatedGroups > 0 || updatedKnockout > 0) { save(); renderAll(); }
    setSyncStatus('ok');
    console.log(`Sync OK — grupos: ${updatedGroups}, eliminatorias: ${updatedKnockout}`);
  } catch(err) {
    console.warn('API sync failed:', err.message);
    setSyncStatus('error');
  }
}

async function initSync() {
  setTimeout(async () => {
    await syncFromAPI();
    setInterval(syncFromAPI, 3 * 60 * 1000);
  }, 1500);
}

window.debugAPI = async () => {
  try {
    const res = await fetch(WORKER_URL);
    const data = await res.json();
    const finished = data.matches?.filter(m => ['FINISHED','IN_PLAY','PAUSED'].includes(m.status));
    console.log('Total:', data.matches?.length, 'Finished:', finished?.length);
    const stages = [...new Set(finished?.map(m => m.stage))];
    console.log('Stages:', stages);
    console.log('First:', finished?.[0]?.homeTeam?.name, 'vs', finished?.[0]?.awayTeam?.name);
    return data;
  } catch(e) { console.error('Debug failed:', e.message); }
};
