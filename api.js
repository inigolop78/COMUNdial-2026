// ===== API-FOOTBALL INTEGRATION =====
// Replace with your API key from api-football.com
const API_KEY = '0502e169cbd544fe55413778498ff4ed';
const API_HOST = 'v3.football.api-sports.io';
const MUNDIAL_2026_ID = 1; // Will be updated when API confirms the tournament ID

// Map our team names to API-Football team names
const TEAM_NAME_MAP = {
  'República Checa': 'Czech Republic',
  'Países Bajos': 'Netherlands',
  'R.D. del Congo': 'DR Congo',
  'Costa de Marfil': "Ivory Coast",
  'Arabia Saudí': 'Saudi Arabia',
  'Bosnia Herzegovina': 'Bosnia',
  'Nueva Zelanda': 'New Zealand',
  'Estados Unidos': 'USA',
  'Corea del Sur': 'South Korea',
};

function toApiName(name) {
  return TEAM_NAME_MAP[name] || name;
}
function fromApiName(name) {
  const rev = Object.fromEntries(Object.entries(TEAM_NAME_MAP).map(([k,v])=>[v,k]));
  return rev[name] || name;
}

// Sync status indicator
function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = state === 'loading' ? 'Actualizando...'
           : state === 'ok'      ? 'Datos actualizados'
           : state === 'error'   ? 'Sin conexión — datos locales'
           : 'Sincronización';
}

async function fetchAPI(endpoint) {
  const res = await fetch(`https://${API_HOST}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Find the World Cup 2026 league ID
async function findWorldCup2026Id() {
  const cached = localStorage.getItem('mw26_league_id');
  if (cached) return parseInt(cached);
  const data = await fetchAPI('/leagues?name=FIFA World Cup&season=2026');
  const league = data.response?.[0]?.league?.id;
  if (league) localStorage.setItem('mw26_league_id', league);
  return league || MUNDIAL_2026_ID;
}

// Fetch all group stage fixtures
async function fetchFixtures(leagueId) {
  const data = await fetchAPI(`/fixtures?league=${leagueId}&season=2026&round=Group Stage`);
  return data.response || [];
}

// Parse API fixture into our result format
function parseFixture(fixture) {
  const home = fromApiName(fixture.teams.home.name);
  const away = fromApiName(fixture.teams.away.name);
  const status = fixture.fixture.status.short;
  const finished = ['FT','AET','PEN'].includes(status);
  if (!finished) return null;
  return {
    home,
    away,
    goalsHome: fixture.goals.home,
    goalsAway: fixture.goals.away,
  };
}

// Match API result to our partido index
function matchToKey(home, away) {
  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      const ph = toApiName(p[0]), pa = toApiName(p[1]);
      const ah = toApiName(home), aa = toApiName(away);
      if ((ph===ah && pa===aa) || (ph===aa && pa===ah)) {
        return { grupo, idx, reversed: ph===aa };
      }
    }
  }
  return null;
}

// Main sync function
async function syncFromAPI() {
  if (!API_KEY || API_KEY === '0502e169cbd544fe55413778498ff4ed') {
    console.log('API key not set — skipping sync');
    return false;
  }

  setSyncStatus('loading');
  try {
    const leagueId = await findWorldCup2026Id();
    const fixtures = await fetchFixtures(leagueId);
    let updated = 0;

    fixtures.forEach(fix => {
      const parsed = parseFixture(fix);
      if (!parsed) return;
      const match = matchToKey(parsed.home, parsed.away);
      if (!match) return;
      const { grupo, idx, reversed } = match;
      const key = `${grupo}-${idx}`;
      const local = reversed ? parsed.goalsAway : parsed.goalsHome;
      const visit = reversed ? parsed.goalsHome : parsed.goalsAway;
      // Only update if not manually overridden or same value
      resultados[key] = { local, visit, fromAPI: true };
      updated++;
    });

    if (updated > 0) {
      save();
      renderAll();
    }

    setSyncStatus('ok');
    localStorage.setItem('mw26_last_sync', Date.now());
    console.log(`Sync OK — ${updated} results updated`);
    return true;
  } catch (err) {
    console.warn('API sync failed:', err.message);
    setSyncStatus('error');
    return false;
  }
}

// Auto-sync on startup and every 5 minutes
async function initSync() {
  await syncFromAPI();
  setInterval(syncFromAPI, 5 * 60 * 1000);
}
