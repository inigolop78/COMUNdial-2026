const API_KEY  = '0502e169cbd544fe55413778498ff4ed';
const API_HOST = 'v3.football.api-sports.io';
const LEAGUE   = 1;
const SEASON   = 2026;

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

function toApiName(n) { return TEAM_NAME_MAP[n] || n; }
function fromApiName(n) {
  const rev = Object.fromEntries(Object.entries(TEAM_NAME_MAP).map(([k,v])=>[v,k]));
  return rev[n] || n;
}

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = { loading:'Actualizando...', ok:'Resultados actualizados', error:'Sin conexión', idle:'' }[state]||'';
}

// Use allorigins.win as CORS proxy to bypass browser restrictions
async function fetchViaProxy(endpoint) {
  const url = `https://${API_HOST}${endpoint}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  
  // allorigins can't forward custom headers, so try direct first
  try {
    const res = await fetch(url, {
      headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }
    });
    if (res.ok) return res.json();
  } catch(e) { /* CORS blocked, fall through to proxy */ }

  // Fallback: proxy (loses auth headers, may get 401)
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const wrapper = await res.json();
  return JSON.parse(wrapper.contents);
}

function matchFixtureToKey(homeName, awayName, goalsHome, goalsAway) {
  const home = fromApiName(homeName);
  const away = fromApiName(awayName);
  for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
    for (const [idx, p] of partidos.entries()) {
      const ah = toApiName(p[0]), aa = toApiName(p[1]);
      const bh = toApiName(home), ba = toApiName(away);
      if (ah===bh && aa===ba) return { key:`${grupo}-${idx}`, local:goalsHome, visit:goalsAway };
      if (ah===ba && aa===bh) return { key:`${grupo}-${idx}`, local:goalsAway, visit:goalsHome };
    }
  }
  return null;
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    const data = await fetchViaProxy(`/fixtures?league=${LEAGUE}&season=${SEASON}`);

    if (data.errors?.token) throw new Error('Auth error: ' + data.errors.token);
    if (!data.response?.length) throw new Error('No fixtures returned');

    const FINISHED = ['FT','AET','PEN'];
    let updated = 0;

    data.response.forEach(fix => {
      if (!FINISHED.includes(fix.fixture.status.short)) return;
      const gl = fix.goals.home, gv = fix.goals.away;
      if (gl===null||gv===null) return;
      const match = matchFixtureToKey(fix.teams.home.name, fix.teams.away.name, gl, gv);
      if (!match) return;
      const existing = resultados[match.key];
      if (existing && !existing.fromAPI) return; // don't overwrite manual entries
      resultados[match.key] = { local:match.local, visit:match.visit, fromAPI:true };
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
