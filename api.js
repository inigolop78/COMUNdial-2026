// API-Football widgets handle data fetching automatically
// This file handles the sync between widget data and our app state

const API_KEY = '0502e169cbd544fe55413778498ff4ed';

function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-${state}`;
  el.title = { loading:'Actualizando...', ok:'Resultados actualizados', error:'Sin conexión', idle:'' }[state]||'';
}

// Parse standings from API-Football widget data
const TEAM_NAME_MAP = {
  'Czech Republic':  'República Checa',
  'Netherlands':     'Países Bajos',
  'DR Congo':        'R.D. del Congo',
  'Ivory Coast':     'Costa de Marfil',
  'Saudi Arabia':    'Arabia Saudí',
  'Bosnia':          'Bosnia Herzegovina',
  'New Zealand':     'Nueva Zelanda',
  'USA':             'Estados Unidos',
  'South Korea':     'Corea del Sur',
  'Curacao':         'Curaçao',
  'Iran':            'Irán',
};
function fromApiName(n) { return TEAM_NAME_MAP[n] || n; }
function toApiName(n) {
  const rev = Object.fromEntries(Object.entries(TEAM_NAME_MAP).map(([k,v])=>[v,k]));
  return rev[n] || n;
}

async function syncFromAPI() {
  setSyncStatus('loading');
  try {
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT-AET-PEN`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length) throw new Error(JSON.stringify(data.errors));
    if (!data.response?.length) throw new Error('No fixtures returned');

    let updated = 0;
    data.response.forEach(fix => {
      const gl = fix.goals.home, gv = fix.goals.away;
      if (gl === null || gv === null) return;
      const home = fromApiName(fix.teams.home.name);
      const away = fromApiName(fix.teams.away.name);
      for (const [grupo, partidos] of Object.entries(PARTIDOS_GRUPO)) {
        for (const [idx, p] of partidos.entries()) {
          const ah = toApiName(p[0]), aa = toApiName(p[1]);
          const bh = toApiName(home), ba = toApiName(away);
          let local, visit;
          if (ah===bh && aa===ba) { local=gl; visit=gv; }
          else if (ah===ba && aa===bh) { local=gv; visit=gl; }
          else continue;
          const key = `${grupo}-${idx}`;
          const existing = resultados[key];
          if (existing && !existing.fromAPI) continue;
          resultados[key] = { local, visit, fromAPI: true };
          updated++;
        }
      }
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
  const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT', {
    headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
  });
  const data = await res.json();
  console.log('Results:', data.results, 'Errors:', data.errors);
  console.log('First fixture:', data.response?.[0]?.teams);
  return data;
};
