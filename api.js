const FD_TOKEN = '0d8d85a0c9334a2da73dfedb45d9c62e';

// Use a CORS proxy since football-data.org blocks direct browser requests
// corsproxy.io is a free, reliable CORS proxy
const PROXY = 'https://corsproxy.io/?';
const FD_BASE = 'https://api.football-data.org/v4';

const TEAM_NAME_MAP = {
  'Czech Republic':         'República Checa',
  'Netherlands':            'Países Bajos',
  'DR Congo':               'R.D. del Congo',
  'Congo DR':               'R.D. del Congo',
  "Côte d'Ivoire":          'Costa de Marfil',
  'Ivory Coast':            'Costa de Marfil',
  'Saudi Arabia':           'Arabia Saudí',
  'Bosnia and Herzegovina': 'Bosnia Herzegovina',
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
};

function fromApiName(n) { return TEAM_NAME_MAP[n] || n; }

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = { loading:'Actualizando...', ok:'Actualizado', error:'Sin conexión', idle:'' }[state]||'';
}

async function fdFetch(endpoint) {
  const url = `${FD_BASE}${endpoint}`;
  // Try multiple CORS proxies in order
  const proxies = [
    // thingproxy passes custom headers
    `https://thingproxy.freeboard.io/fetch/${url}`,
    // allorigins wraps response in .contents
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  // Direct call first
  try {
    const res = await fetch(url, { headers: { 'X-Auth-Token': FD_TOKEN }, mode: 'cors' });
    if (res.ok) return res.json();
  } catch(e) {}
  // Try proxies
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        headers: { 'X-Auth-Token': FD_TOKEN, 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) continue;
      const text = await res.text();
      return JSON.parse(text);
    } catch(e) { continue; }
  }
  throw new Error('All proxy attempts failed');
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
    const data = await fdFetch('/competitions/WC/matches?status=FINISHED');
    if (!data.matches?.length) throw new Error('No finished matches');

    let updated = 0;
    data.matches.forEach(m => {
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
    const data = await fdFetch('/competitions/WC/matches?status=FINISHED');
    console.log('Finished matches:', data.matches?.length);
    console.log('First:', data.matches?.[0]?.homeTeam?.name, 'vs', data.matches?.[0]?.awayTeam?.name, data.matches?.[0]?.score?.fullTime);
    return data;
  } catch(e) { console.error('Debug failed:', e.message); }
};
