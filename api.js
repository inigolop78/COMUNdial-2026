const API_KEY  = '0502e169cbd544fe55413778498ff4ed';
const API_HOST = 'v3.football.api-sports.io';

// FIFA World Cup 2026 league ID in API-Football is 1
// Season 2026, confirmed tournament
const MUNDIAL_LEAGUE_ID = 1;
const MUNDIAL_SEASON    = 2026;

const TEAM_NAME_MAP = {
  'República Checa':    'Czech Republic',
  'Países Bajos':       'Netherlands',
  'R.D. del Congo':     'DR Congo',
  'Costa de Marfil':    'Ivory Coast',
  'Arabia Saudí':       'Saudi Arabia',
  'Bosnia Herzegovina': 'Bosnia',
  'Nueva Zelanda':      'New Zealand',
  'Estados Unidos':     'USA',
  'Corea del Sur':      'South Korea',
  'Curaçao':            'Curacao',
  'Iraq':               'Iraq',
  'Irán':               'Iran',
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
  el.title = {
    loading: 'Actualizando resultados...',
    ok:      'Resultados actualizados',
    error:   'Sin conexión — usando datos locales',
    idle:    ''
  }[state] || '';
}

async function fetchAPI(endpoint) {
  const res = await fetch(`https://${API_HOST}${endpoint}`, {
    headers: {
      'x-rapidapi-key':  API_KEY,
      'x-rapidapi-host': API_HOST
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function matchFixtureToKey(homeName, awayName, goalsHome, goalsAway) {
  const home = fromApiName(homeName);
  const away = fromApiName(awayName);
  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      const p0 = p[0], p1 = p[1];
      const ah = toApiName(p0), aa = toApiName(p1);
      if (ah === toApiName(home) && aa === toApiName(away)) {
        return { key: `${grupo}-${idx}`, local: goalsHome, visit: goalsAway };
      }
      if (ah === toApiName(away) && aa === toApiName(home)) {
        return { key: `${grupo}-${idx}`, local: goalsAway, visit: goalsHome };
      }
    }
  }
  return null;
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    // Fetch all fixtures for the World Cup 2026
    const data = await fetchAPI(
      `/fixtures?league=${MUNDIAL_LEAGUE_ID}&season=${MUNDIAL_SEASON}`
    );

    if (!data.response || data.errors?.token) {
      throw new Error(data.errors?.token || 'API error');
    }

    let updated = 0;
    const FINISHED = ['FT', 'AET', 'PEN'];

    data.response.forEach(fix => {
      const status = fix.fixture.status.short;
      if (!FINISHED.includes(status)) return;
      const gl = fix.goals.home, gv = fix.goals.away;
      if (gl === null || gv === null) return;

      const match = matchFixtureToKey(
        fix.teams.home.name, fix.teams.away.name, gl, gv
      );
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
    console.log(`Sync OK — ${updated} results updated from ${data.response.length} fixtures`);

  } catch(err) {
    console.warn('API sync failed:', err.message);
    setSyncStatus('error');
  }
}

async function initSync() {
  await syncFromAPI();
  setInterval(syncFromAPI, 5 * 60 * 1000);
}
