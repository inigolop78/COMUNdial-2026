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
  'Czechia':                'República Checa',
  'New Zealand':            'Nueva Zelanda',
  'USA':                    'Estados Unidos',
  'United States':          'Estados Unidos',
  'South Korea':            'Corea del Sur',
  'Korea Republic':         'Corea del Sur',
  'Curacao':                'Curaçao',
  'Iran':                   'Irán',
  'Morocco':                'Marruecos',
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
  'Portugal':               'Portugal',
  'Argentina':              'Argentina',
  'Brazil':                 'Brasil',
  'Colombia':               'Colombia',
  'Ecuador':                'Ecuador',
  'Uruguay':                'Uruguay',
  'Paraguay':               'Paraguay',
  'Australia':              'Australia',
  'Ghana':                  'Ghana',
  'England':                'Inglaterra',
  'Qatar':                  'Qatar',
  'Iraq':                   'Iraq',
  'Senegal':                'Senegal',
  'Austria':                'Austria',
  'Turkey':                 'Turquía',
  'Türkiye':                'Turquía',
};

function fromApiName(n) { return TEAM_NAME_MAP[n] || n; }

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = { loading:'Actualizando...', ok:'Actualizado', error:'Sin conexión', idle:'' }[state]||'';
}

function matchFixture(home, away, gl, gv) {
  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      if (p[0]===home && p[1]===away) return { key:`${grupo}-${idx}`, local:gl, visit:gv };
      if (p[0]===away && p[1]===home) return { key:`${grupo}-${idx}`, local:gv, visit:gl };
    }
  }
  return null;
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    const res = await fetch(WORKER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.matches?.length) throw new Error('No matches');

    const FINISHED = ['FINISHED','IN_PLAY','PAUSED'];
    let updated = 0;
    data.matches.forEach(m => {
      if (!FINISHED.includes(m.status)) return;
      const gl = m.score?.fullTime?.home;
      const gv = m.score?.fullTime?.away;
      if (gl == null || gv == null) return;
      const home = fromApiName(m.homeTeam.name);
      const away = fromApiName(m.awayTeam.name);
      const match = matchFixture(home, away, gl, gv);
      if (!match) return;
      const existing = resultados[match.key];
      if (existing && !existing.fromAPI) return;
      resultados[match.key] = { local: match.local, visit: match.visit, fromAPI: true };
      updated++;
    });

    if (updated > 0) { save(); renderAll(); }
    setSyncStatus('ok');
    console.log(`Sync OK — ${updated} results updated`);
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
    console.log('Total matches:', data.matches?.length);
    const finished = data.matches?.filter(m => ['FINISHED','IN_PLAY','PAUSED'].includes(m.status));
    console.log('Finished:', finished?.length);
    console.log('First:', finished?.[0]?.homeTeam?.name, 'vs', finished?.[0]?.awayTeam?.name, finished?.[0]?.score?.fullTime);
    // Check unmatched
    let unmatched = [];
    finished?.forEach(m => {
      const home = fromApiName(m.homeTeam.name);
      const away = fromApiName(m.awayTeam.name);
      if (!matchFixture(home, away, 0, 0)) unmatched.push(`${m.homeTeam.name} vs ${m.awayTeam.name}`);
    });
    if (unmatched.length) console.log('Unmatched:', unmatched);
    return data;
  } catch(e) { console.error('Debug failed:', e.message); }
};
