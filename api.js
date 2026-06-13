// football-data.org API - Free tier includes World Cup 2026
const FD_TOKEN = '0d8d85a0c9334a2da73dfedb45d9c62e';
const FD_BASE  = 'https://api.football-data.org/v4';
const WC_CODE  = 'WC'; // FIFA World Cup competition code

const TEAM_NAME_MAP = {
  'Czech Republic':     'República Checa',
  'Netherlands':        'Países Bajos',
  'DR Congo':           'R.D. del Congo',
  'Congo DR':           'R.D. del Congo',
  "Côte d'Ivoire":      'Costa de Marfil',
  'Ivory Coast':        'Costa de Marfil',
  'Saudi Arabia':       'Arabia Saudí',
  'Bosnia and Herzegovina': 'Bosnia Herzegovina',
  'New Zealand':        'Nueva Zelanda',
  'USA':                'Estados Unidos',
  'United States':      'Estados Unidos',
  'South Korea':        'Corea del Sur',
  'Korea Republic':     'Corea del Sur',
  'Curaçao':            'Curaçao',
  'Curacao':            'Curaçao',
  'Iran':               'Irán',
  'Iraq':               'Iraq',
  'Morocco':            'Marruecos',
  'Senegal':            'Senegal',
  'Algeria':            'Argelia',
  'Norway':             'Noruega',
  'Sweden':             'Suecia',
  'Switzerland':        'Suiza',
  'Belgium':            'Bélgica',
  'Egypt':              'Egipto',
  'Germany':            'Alemania',
  'France':             'Francia',
  'Spain':              'España',
  'Portugal':           'Portugal',
  'England':            'Inglaterra',
  'Argentina':          'Argentina',
  'Brazil':             'Brasil',
  'Colombia':           'Colombia',
  'Ecuador':            'Ecuador',
  'Uruguay':            'Uruguay',
  'Paraguay':           'Paraguay',
  'Australia':          'Australia',
  'Japan':              'Japón',
  'Túnez':              'Túnez',
  'Tunisia':            'Túnez',
  'Ghana':              'Ghana',
  'Panama':             'Panamá',
  'Croatia':            'Croacia',
  'Scotland':           'Escocia',
  'Haiti':              'Haití',
  'Canada':             'Canadá',
  'Qatar':              'Qatar',
  'Mexico':             'México',
  'Jordan':             'Jordania',
  'Austria':            'Austria',
  'Uzbekistan':         'Uzbekistán',
  'Cape Verde':         'Cabo Verde',
  'South Africa':       'Sudáfrica',
  'Cameroon':           'Camerún',
  'Cabo Verde':         'Cabo Verde',
};

function fromApiName(n) { return TEAM_NAME_MAP[n] || n; }
function toApiName(n) {
  const rev = Object.fromEntries(Object.entries(TEAM_NAME_MAP).map(([k,v])=>[v,k]));
  return rev[n] || n;
}

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = {
    loading: 'Actualizando resultados...',
    ok:      'Resultados actualizados',
    error:   'Sin conexión — datos locales',
    idle:    ''
  }[state] || '';
}

async function fdFetch(endpoint) {
  const res = await fetch(`${FD_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': FD_TOKEN }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

function matchFixture(homeName, awayName, gl, gv) {
  const home = fromApiName(homeName);
  const away = fromApiName(awayName);
  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      const p0 = p[0], p1 = p[1];
      const bh = fromApiName(toApiName(home)), ba = fromApiName(toApiName(away));
      if (p0===home && p1===away) return { key:`${grupo}-${idx}`, local:gl, visit:gv };
      if (p0===away && p1===home) return { key:`${grupo}-${idx}`, local:gv, visit:gl };
      // Also try direct name matching
      if (p0===bh && p1===ba) return { key:`${grupo}-${idx}`, local:gl, visit:gv };
      if (p0===ba && p1===bh) return { key:`${grupo}-${idx}`, local:gv, visit:gl };
    }
  }
  return null;
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    const data = await fdFetch(`/competitions/${WC_CODE}/matches?status=FINISHED`);

    if (!data.matches?.length) throw new Error('No finished matches yet');

    let updated = 0;
    data.matches.forEach(m => {
      const gl = m.score?.fullTime?.home;
      const gv = m.score?.fullTime?.away;
      if (gl === null || gl === undefined || gv === null || gv === undefined) return;

      const home = fromApiName(m.homeTeam.name);
      const away = fromApiName(m.awayTeam.name);
      const match = matchFixture(home, away, gl, gv);
      if (!match) {
        console.log('No match found for:', home, 'vs', away);
        return;
      }

      const existing = resultados[match.key];
      if (existing && !existing.fromAPI) return;
      resultados[match.key] = { local: match.local, visit: match.visit, fromAPI: true };
      updated++;
    });

    if (updated > 0) { save(); renderAll(); }
    setSyncStatus('ok');
    localStorage.setItem('mw26_last_sync', Date.now());
    console.log(`Sync OK — ${updated} results updated from ${data.matches.length} finished matches`);

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
    const data = await fdFetch(`/competitions/${WC_CODE}/matches?status=FINISHED`);
    console.log('Finished matches:', data.matches?.length);
    console.log('First match:', data.matches?.[0]?.homeTeam?.name, 'vs', data.matches?.[0]?.awayTeam?.name, data.matches?.[0]?.score?.fullTime);
    return data;
  } catch(e) {
    console.error('Debug failed:', e.message);
  }
};
