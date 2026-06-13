const GRUPOS = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'],
  B: ['Canadá', 'Bosnia Herzegovina', 'Qatar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curaçao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudí', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Iraq', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'R.D. del Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá']
};

// Partido: [local, visitante, fecha]
const PARTIDOS_GRUPO = {
  A: [
    ['México', 'Sudáfrica', '12 Jun'],
    ['Corea del Sur', 'República Checa', '12 Jun'],
    ['República Checa', 'Sudáfrica', '18 Jun'],
    ['México', 'Corea del Sur', '19 Jun'],
    ['República Checa', 'México', '25 Jun'],
    ['Sudáfrica', 'Corea del Sur', '25 Jun'],
  ],
  B: [
    ['Canadá', 'Bosnia Herzegovina', '13 Jun'],
    ['Qatar', 'Suiza', '13 Jun'],
    ['Canadá', 'Qatar', '19 Jun'],
    ['Suiza', 'Bosnia Herzegovina', '19 Jun'],
    ['Bosnia Herzegovina', 'Qatar', '24 Jun'],
    ['Suiza', 'Canadá', '24 Jun'],
  ],
  C: [
    ['Brasil', 'Marruecos', '14 Jun'],
    ['Haití', 'Escocia', '14 Jun'],
    ['Escocia', 'Marruecos', '20 Jun'],
    ['Brasil', 'Haití', '20 Jun'],
    ['Marruecos', 'Haití', '25 Jun'],
    ['Escocia', 'Brasil', '25 Jun'],
  ],
  D: [
    ['Estados Unidos', 'Paraguay', '13 Jun'],
    ['Australia', 'Turquía', '14 Jun'],
    ['Estados Unidos', 'Australia', '19 Jun'],
    ['Turquía', 'Paraguay', '20 Jun'],
    ['Paraguay', 'Australia', '26 Jun'],
    ['Turquía', 'Estados Unidos', '26 Jun'],
  ],
  E: [
    ['Alemania', 'Curaçao', '14 Jun'],
    ['Costa de Marfil', 'Ecuador', '15 Jun'],
    ['Alemania', 'Costa de Marfil', '20 Jun'],
    ['Ecuador', 'Curaçao', '21 Jun'],
    ['Curaçao', 'Costa de Marfil', '25 Jun'],
    ['Ecuador', 'Alemania', '25 Jun'],
  ],
  F: [
    ['Países Bajos', 'Japón', '14 Jun'],
    ['Suecia', 'Túnez', '15 Jun'],
    ['Países Bajos', 'Suecia', '20 Jun'],
    ['Túnez', 'Japón', '21 Jun'],
    ['Japón', 'Suecia', '26 Jun'],
    ['Túnez', 'Países Bajos', '26 Jun'],
  ],
  G: [
    ['Bélgica', 'Egipto', '15 Jun'],
    ['Irán', 'Nueva Zelanda', '16 Jun'],
    ['Bélgica', 'Irán', '21 Jun'],
    ['Nueva Zelanda', 'Egipto', '22 Jun'],
    ['Egipto', 'Irán', '27 Jun'],
    ['Nueva Zelanda', 'Bélgica', '27 Jun'],
  ],
  H: [
    ['Arabia Saudí', 'Uruguay', '15 Jun'],
    ['España', 'Cabo Verde', '15 Jun'],
    ['España', 'Arabia Saudí', '21 Jun'],
    ['Uruguay', 'Cabo Verde', '22 Jun'],
    ['Cabo Verde', 'Arabia Saudí', '27 Jun'],
    ['Uruguay', 'España', '27 Jun'],
  ],
  I: [
    ['Francia', 'Senegal', '16 Jun'],
    ['Iraq', 'Noruega', '17 Jun'],
    ['Francia', 'Iraq', '22 Jun'],
    ['Noruega', 'Senegal', '23 Jun'],
    ['Noruega', 'Francia', '26 Jun'],
    ['Senegal', 'Iraq', '26 Jun'],
  ],
  J: [
    ['Argentina', 'Argelia', '17 Jun'],
    ['Austria', 'Jordania', '17 Jun'],
    ['Argentina', 'Austria', '22 Jun'],
    ['Jordania', 'Argelia', '23 Jun'],
    ['Argelia', 'Austria', '28 Jun'],
    ['Jordania', 'Argentina', '28 Jun'],
  ],
  K: [
    ['Portugal', 'R.D. del Congo', '17 Jun'],
    ['Uzbekistán', 'Colombia', '18 Jun'],
    ['Portugal', 'Uzbekistán', '23 Jun'],
    ['Colombia', 'R.D. del Congo', '24 Jun'],
    ['Colombia', 'Portugal', '28 Jun'],
    ['R.D. del Congo', 'Uzbekistán', '28 Jun'],
  ],
  L: [
    ['Inglaterra', 'Croacia', '17 Jun'],
    ['Ghana', 'Panamá', '18 Jun'],
    ['Inglaterra', 'Ghana', '23 Jun'],
    ['Panamá', 'Croacia', '24 Jun'],
    ['Croacia', 'Ghana', '27 Jun'],
    ['Panamá', 'Inglaterra', '27 Jun'],
  ]
};

// Cuadro eliminatorio: [id, descripción, equipo1_ref, equipo2_ref]
const ELIMINATORIAS = {
  '1/16': [
    { id: 'DF1',  desc: '2º A vs 2º B',       e1: '2A', e2: '2B' },
    { id: 'DF2',  desc: '1º C vs 2º F',       e1: '1C', e2: '2F' },
    { id: 'DF3',  desc: '1º E vs 3º A/B/C/D/F', e1: '1E', e2: '3ABCDF' },
    { id: 'DF4',  desc: '1º F vs 2º C',       e1: '1F', e2: '2C' },
    { id: 'DF5',  desc: '2º E vs 2º I',       e1: '2E', e2: '2I' },
    { id: 'DF6',  desc: '1º I vs 3º C/D/F/G/H', e1: '1I', e2: '3CDFGH' },
    { id: 'DF7',  desc: '1º A vs 3º C/E/F/H/I', e1: '1A', e2: '3CEFHI' },
    { id: 'DF8',  desc: '1º L vs 3º E/H/I/J/K', e1: '1L', e2: '3EHIJK' },
    { id: 'DF9',  desc: '1º G vs 3º A/E/H/I/J', e1: '1G', e2: '3AEHIJ' },
    { id: 'DF10', desc: '1º D vs 3º B/E/F/I/J', e1: '1D', e2: '3BEFIJ' },
    { id: 'DF11', desc: '1º H vs 2º J',       e1: '1H', e2: '2J' },
    { id: 'DF12', desc: '2º K vs 2º L',       e1: '2K', e2: '2L' },
    { id: 'DF13', desc: '1º B vs 3º E/F/G/I/J', e1: '1B', e2: '3EFGIJ' },
    { id: 'DF14', desc: '2º D vs 2º G',       e1: '2D', e2: '2G' },
    { id: 'DF15', desc: '1º J vs 2º H',       e1: '1J', e2: '2H' },
    { id: 'DF16', desc: '1º K vs 3º D/E/I/J/L', e1: '1K', e2: '3DEIJL' },
  ],
  '1/8': [
    { id: 'OF1', desc: 'G DF3 vs G DF6',  e1: 'DF3', e2: 'DF6' },
    { id: 'OF2', desc: 'G DF1 vs G DF4',  e1: 'DF1', e2: 'DF4' },
    { id: 'OF3', desc: 'G DF2 vs G DF5',  e1: 'DF2', e2: 'DF5' },
    { id: 'OF4', desc: 'G DF7 vs G DF8',  e1: 'DF7', e2: 'DF8' },
    { id: 'OF5', desc: 'G DF12 vs G DF11', e1: 'DF12', e2: 'DF11' },
    { id: 'OF6', desc: 'G DF9 vs G DF10', e1: 'DF9', e2: 'DF10' },
    { id: 'OF7', desc: 'G DF14 vs G DF15', e1: 'DF14', e2: 'DF15' },
    { id: 'OF8', desc: 'G DF13 vs G DF16', e1: 'DF13', e2: 'DF16' },
  ],
  '1/4': [
    { id: 'CF1', desc: 'G OF1 vs G OF2', e1: 'OF1', e2: 'OF2' },
    { id: 'CF2', desc: 'G OF5 vs G OF6', e1: 'OF5', e2: 'OF6' },
    { id: 'CF3', desc: 'G OF3 vs G OF4', e1: 'OF3', e2: 'OF4' },
    { id: 'CF4', desc: 'G OF7 vs G OF8', e1: 'OF7', e2: 'OF8' },
  ],
  '1/2': [
    { id: 'SF1', desc: 'G CF1 vs G CF2', e1: 'CF1', e2: 'CF2' },
    { id: 'SF2', desc: 'G CF3 vs G CF4', e1: 'CF3', e2: 'CF4' },
  ],
  '3-4': [
    { id: 'TP', desc: 'Perdedor SF1 vs Perdedor SF2', e1: 'SF1L', e2: 'SF2L' },
  ],
  'FINAL': [
    { id: 'FIN', desc: 'G SF1 vs G SF2', e1: 'SF1', e2: 'SF2' },
  ]
};

// Participantes del Comunio y sus equipos elegidos
const COMUNIO_PARTICIPANTES = [
  {
    nombre: 'Francia',
    equipos: ['Francia', 'España', 'Argentina', 'Inglaterra', 'Portugal', 'Brasil', 'Países Bajos', 'Marruecos', 'Bélgica', 'Alemania', 'Croacia', 'Colombia']
  },
  {
    nombre: 'Senegal',
    equipos: ['Senegal', 'México', 'Estados Unidos', 'Uruguay', 'Japón', 'Suiza', 'Irán', 'Turquía', 'Ecuador', 'Austria', 'Costa de Marfil', 'Suecia']
  },
  {
    nombre: 'Argelia',
    equipos: ['Argelia', 'Egipto', 'Canadá', 'Noruega', 'Panamá', 'República Checa', 'Escocia', 'Túnez', 'R.D. del Congo', 'Ghana']
  },
  {
    nombre: 'Uzbekistán',
    equipos: ['Uzbekistán', 'Qatar', 'Iraq', 'Sudáfrica', 'Arabia Saudí', 'Jordania', 'Bosnia Herzegovina', 'Curaçao', 'Cabo Verde', 'Haití']
  }
];

// Puntuación Comunio
const PUNTUACION_COMUNIO = {
  faseGrupos: { ganado: 3, empate: 1 },
  dieciseisavos: { primero: 5, segundo: 3, tercero: 1 },
  octavos: 15,
  cuartos: 20,
  semifinal: 30,
  cuartoPuesto: 30,
  tercerPuesto: 45,
  segundoPuesto: 60,
  campeon: 75
};
