const API_KEY = '0502e169cbd544fe55413778498ff4ed';
const API_HOST = 'v3.football.api-sports.io';

const TEAM_NAME_MAP = {
  'República Checa': 'Czech Republic',
  'Países Bajos':    'Netherlands',
  'R.D. del Congo':  'DR Congo',
  'Costa de Marfil': 'Ivory Coast',
  'Arabia Saudí':    'Saudi Arabia',
  'Bosnia Herzegovina': 'Bosnia',
  'Nueva Zelanda':   'New Zealand',
  'Estados Unidos':  'USA',
  'Corea del Sur':   'South Korea',
  'Curaçao':         'Curacao',
};

function toApiName(n)   { return TEAM_NAME_MAP[n] || n; }
function fromApiName(n) {
  const rev = Object.fromEntries(Object.entries(TEAM_NAME_MAP).map(([k,v])=>[v,k]));
  return rev[n] || n;
}

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = { loading:'Actualizando...', ok:'Datos actualizados', error:'Sin conexión — datos locales', idle:'' }[state] || '';
}

async function fetchAPI(endpoint) {
  const res = await fetch(`https://${API_HOST}${endpoint}`, {
    headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function findLeagueId() {
  const cached = localStorage.getItem('mw26_league_id');
  if (cached) return parseInt(cached);
  // Try multiple search strategies
  const attempts = [
    '/leagues?name=FIFA World Cup&season=2026',
    '/leagues?name=World Cup&season=2026',
    '/leagues?code=WC&season=2026',
    '/leagues?type=Cup&season=2026&country=World',
  ];
  for (const url of attempts) {
    try {
      const data = await fetchAPI(url);
      const league = data.response?.find(l =>
        l.league?.name?.toLowerCase().includes('world cup') ||
        l.league?.name?.toLowerCase().includes('mundial')
      );
      if (league?.league?.id) {
        localStorage.setItem('mw26_league_id', league.league.id);
        console.log('Found league:', league.league.name, 'ID:', league.league.id);
        return league.league.id;
      }
    } catch(e) { continue; }
  }
  return null;
}

async function fetchGroupFixtures(leagueId) {
  // Try fetching group stage rounds
  const rounds = ['Group Stage - 1','Group Stage - 2','Group Stage - 3','Group Stage'];
  let all = [];
  for (const round of rounds) {
    try {
      const data = await fetchAPI(`/fixtures?league=${leagueId}&season=2026&round=${encodeURIComponent(round)}`);
      if (data.response?.length) all = all.concat(data.response);
    } catch(e) { continue; }
  }
  // Deduplicate by fixture id
  const seen = new Set();
  return all.filter(f => { if (seen.has(f.fixture.id)) return false; seen.add(f.fixture.id); return true; });
}

function matchFixture(fixture) {
  const home = fromApiName(fixture.teams.home.name);
  const away = fromApiName(fixture.teams.away.name);
  const status = fixture.fixture.status.short;
  const finished = ['FT','AET','PEN'].includes(status);
  if (!finished) return null;
  const gl = fixture.goals.home, gv = fixture.goals.away;
  if (gl === null || gv === null) return null;

  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      const ph = toApiName(p[0]), pa = toApiName(p[1]);
      const ah = toApiName(home), aa = toApiName(away);
      if (ph===ah && pa===aa) return { key:`${grupo}-${idx}`, local:gl, visit:gv };
      if (ph===aa && pa===ah) return { key:`${grupo}-${idx}`, local:gv, visit:gl };
    }
  }
  return null;
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    const leagueId = await findLeagueId();
    if (!leagueId) throw new Error('League not found');

    const fixtures = await fetchGroupFixtures(leagueId);
    let updated = 0;

    fixtures.forEach(fix => {
      const match = matchFixture(fix);
      if (!match) return;
      // Don't overwrite manually entered results
      const existing = resultados[match.key];
      if (existing && !existing.fromAPI) return;
      resultados[match.key] = { local: match.local, visit: match.visit, fromAPI: true };
      updated++;
    });

    if (updated > 0) { save(); renderAll(); }
    setSyncStatus('ok');
    localStorage.setItem('mw26_last_sync', Date.now());
    console.log(`Sync OK — ${updated} results updated`);
  } catch(err) {
    console.warn('API sync failed:', err.message);
    setSyncStatus('error');
  }
}

async function initSync() {
  await syncFromAPI();
  setInterval(syncFromAPI, 5 * 60 * 1000);
}
