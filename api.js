const WORKER_URL = '/.netlify/functions/get-matches';

const TEAM_NAME_MAP = {
  'Mexico': 'México',
  'Mexico National Team': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  'Korea Republic': 'Corea del Sur',
  'Republic of Korea': 'Corea del Sur',
  'Korea, South': 'Corea del Sur',
  'Korea South': 'Corea del Sur',
  'Czech Republic': 'República Checa',
  'Czechia': 'República Checa',
  'Czech Rep.': 'República Checa',
  'Netherlands': 'Países Bajos',
  'Bosnia and Herzegovina': 'Bosnia Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia Herzegovina',
  'Bosnia & Herzegovina': 'Bosnia Herzegovina',
  'Saudi Arabia': 'Arabia Saudí',
  'Iran': 'Irán',
  'Morocco': 'Marruecos',
  'Algeria': 'Argelia',
  'Tunisia': 'Túnez',
  'Tunisia National Team': 'Túnez',
  'Egypt': 'Egipto',
  'Cape Verde': 'Cabo Verde',
  'Cape Verde Islands': 'Cabo Verde',
  'Ghana': 'Ghana',
  'Senegal': 'Senegal',
  'USA': 'Estados Unidos',
  'United States': 'Estados Unidos',
  'United States of America': 'Estados Unidos',
  'United States Men': 'Estados Unidos',
  'USMNT': 'Estados Unidos',
  'Canada': 'Canadá',
  'Panama': 'Panamá',
  'Haiti': 'Haití',
  'Brazil': 'Brasil',
  'Brazil National Team': 'Brasil',
  'Argentina': 'Argentina',
  'Paraguay': 'Paraguay',
  'Uruguay': 'Uruguay',
  'Colombia': 'Colombia',
  'Ecuador': 'Ecuador',
  'Germany': 'Alemania',
  'France': 'Francia',
  'Spain': 'España',
  'Portugal': 'Portugal',
  'Belgium': 'Bélgica',
  'Austria': 'Austria',
  'Switzerland': 'Suiza',
  'Sweden': 'Suecia',
  'Norway': 'Noruega',
  'England': 'Inglaterra',
  'Scotland': 'Escocia',
  'Croatia': 'Croacia',
  'Japan': 'Japón',
  'Australia': 'Australia',
  'New Zealand': 'Nueva Zelanda',
  'Curacao': 'Curaçao',
  'Curaçao': 'Curaçao',
  "Côte d'Ivoire": 'Costa de Marfil',
  'Ivory Coast': 'Costa de Marfil',
  "Cote d'Ivoire": 'Costa de Marfil',
  'Cote dIvoire': 'Costa de Marfil',
  'Iraq': 'Iraq',
  'Qatar': 'Qatar',
  'Jordan': 'Jordania',
  'Uzbekistan': 'Uzbekistán',
  'Turkey': 'Turquía',
  'Türkiye': 'Turquía',
  'DR Congo': 'R.D. del Congo',
  'Congo, Dem. Rep.': 'R.D. del Congo',
  'Congo DR': 'R.D. del Congo',
  'Democratic Republic of the Congo': 'R.D. del Congo',
};

function fromApiName(n) {
  if (!n || typeof n !== 'string') {
    console.warn(`⚠️ Invalid team name: ${JSON.stringify(n)}`);
    return n;
  }
  const trimmed = n.trim();
  if (TEAM_NAME_MAP[trimmed]) {
    return TEAM_NAME_MAP[trimmed];
  }
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [apiName, spanishName] of Object.entries(TEAM_NAME_MAP)) {
    if (apiName.toLowerCase() === lowerTrimmed) {
      console.log(`ℹ️ Case-insensitive team match: "${trimmed}" → "${spanishName}"`);
      return spanishName;
    }
  }
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    for (const word of words) {
      const mappedWord = TEAM_NAME_MAP[word.trim()];
      if (mappedWord) {
        console.log(`ℹ️ Partial match: "${trimmed}" → "${mappedWord}" (word: "${word}")`);
        return mappedWord;
      }
    }
  }
  console.warn(`⚠️ Team name NOT found in TEAM_NAME_MAP: "${n}"`);
  return trimmed;
}

const STAGE_TO_ROUNDS = {
  'LAST_32': 'DF',
  'ROUND_OF_32': 'DF',
  'LAST_16': 'OF',
  'ROUND_OF_16': 'OF',
  'QUARTER_FINALS': 'CF',
  'SEMI_FINALS': 'SF',
  'THIRD_PLACE': 'TP',
  'FINAL': 'FIN',
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
        loser: gl > gv ? (reversed ? home : away) : gv > gl ? (reversed ? away : home) : null,
        teamLocal: reversed ? away : home,
        teamVisit: reversed ? home : away,
      };
    }
  }
  return null;
}

function getTeamFromRef(ref) {
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
    let updatedGroups = 0;
    let updatedKnockout = 0;
    let failedMatches = [];

    data.matches.forEach(m => {
      if (!FINISHED.includes(m.status)) return;
      const gl = m.score?.fullTime?.home;
      const gv = m.score?.fullTime?.away;
      if (gl == null || gv == null) return;

      const home = fromApiName(m.homeTeam.name);
      const away = fromApiName(m.awayTeam.name);
      const stage = m.stage;

      if (!home || home === m.homeTeam.name.trim() || !away || away === m.awayTeam.name.trim()) {
        failedMatches.push({
          type: 'mapping_failed',
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          mappedHome: home,
          mappedAway: away
        });
      }

      if (stage && (stage.includes('GROUP') || stage === 'GROUP_STAGE')) {
        const match = matchGroupFixture(home, away, gl, gv);
        if (!match) {
          failedMatches.push({
            type: 'group_not_found',
            home: home,
            away: away,
            stage: stage
          });
          return;
        }
        const existing = resultados[match.key];
        if (existing && !existing.fromAPI) return;
        resultados[match.key] = { local: match.local, visit: match.visit, fromAPI: true };
        updatedGroups++;
        return;
      }

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

    if (updatedGroups > 0 || updatedKnockout > 0) { 
      save(); 
      renderAll(); 
    }
    
    setSyncStatus('ok');
    console.log(`✅ Sync OK — Grupos: ${updatedGroups}, Eliminatorias: ${updatedKnockout}`);
    
    if (failedMatches.length > 0) {
      console.warn(`⚠️ ${failedMatches.length} partidos no pudieron ser procesados:`);
      failedMatches.forEach(m => {
        console.warn(`   ${m.home || m.mappedHome} vs ${m.away || m.mappedAway} (${m.type})`);
      });
    }
  } catch(err) {
    console.warn('❌ API sync failed:', err.message);
    setSyncStatus('error');
  }
}

async function initSync() {
  setTimeout(async () => {
    await syncFromAPI();
    setInterval(syncFromAPI, 3 * 60 * 1000);
  }, 1500);
}

window.debugTeamNames = () => {
  console.log('═══ TEST DE MAPEO DE NOMBRES ═══\n');
  const testCases = ['Mexico', 'Brazil', 'Argentina', 'England', 'USA', 'South Africa', 'South Korea', 'Czech Republic', 'Bosnia and Herzegovina', 'Congo DR', 'Ivory Coast', 'Cape Verde Islands'];
  testCases.forEach(name => {
    const mapped = fromApiName(name);
    const status = mapped !== name ? '✅' : '❌';
    console.log(`${status} "${name}" → "${mapped}"`);
  });
};

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
