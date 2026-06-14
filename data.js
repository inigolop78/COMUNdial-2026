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

// Bracket: cada partido tiene id, refs a los dos participantes
// e1/e2 pueden ser: "1A","2B" (clasificados de grupo), o id de partido previo (ganador)
const BRACKET = [
  // DIECISEISAVOS (Round of 32) - Official FIFA 2026 draw
  // M74: 1E vs 3ABCDF  (Boston)
  { id:'DF1',  r:0, e1:'1E',  e2:'3ABCDF', next:'OF1', slot:0 },
  // M77: 1I vs 3CDFGH  (New York)
  { id:'DF2',  r:0, e1:'1I',  e2:'3CDFGH', next:'OF1', slot:1 },
  // M78: 2E vs 2I      (Dallas)
  { id:'DF3',  r:0, e1:'2E',  e2:'2I',     next:'OF2', slot:0 },
  // M76: 1C vs 2F      (Houston)
  { id:'DF4',  r:0, e1:'1C',  e2:'2F',     next:'OF2', slot:1 },
  // M79: 1A vs 3CEFHI  (Mexico City)
  { id:'DF5',  r:0, e1:'1A',  e2:'3CEFHI', next:'OF3', slot:0 },
  // M80: 1L vs 3EHIJK  (Atlanta)
  { id:'DF6',  r:0, e1:'1L',  e2:'3EHIJK', next:'OF3', slot:1 },
  // M86: 1J vs 2H      (Miami)
  { id:'DF7',  r:0, e1:'1J',  e2:'2H',     next:'OF4', slot:0 },
  // M87: 2D vs 2G      (Dallas)
  { id:'DF8',  r:0, e1:'2D',  e2:'2G',     next:'OF4', slot:1 },
  // M83: 2K vs 2L      (Toronto)
  { id:'DF9',  r:0, e1:'2K',  e2:'2L',     next:'OF5', slot:0 },
  // M84: 1H vs 2J      (Los Angeles)
  { id:'DF10', r:0, e1:'1H',  e2:'2J',     next:'OF5', slot:1 },
  // M85: 1B vs 3EFGIJ  (Vancouver)
  { id:'DF11', r:0, e1:'1B',  e2:'3EFGIJ', next:'OF6', slot:0 },
  // M88: 1K vs 3EHIJK  (Kansas City)
  { id:'DF12', r:0, e1:'1K',  e2:'3EHIJK', next:'OF6', slot:1 },
  // M81: 1D vs 3BEFIJ  (SF Bay Area)
  { id:'DF13', r:0, e1:'1D',  e2:'3BEFIJ', next:'OF7', slot:0 },
  // M82: 1G vs 3AEHIJ  (Seattle)
  { id:'DF14', r:0, e1:'1G',  e2:'3AEHIJ', next:'OF7', slot:1 },
  // M75: 1F vs 2C      (Monterrey)
  { id:'DF15', r:0, e1:'1F',  e2:'2C',     next:'OF8', slot:0 },
  // M89: 2A vs 2B      (Los Angeles)
  { id:'DF16', r:0, e1:'2A',  e2:'2B',     next:'OF8', slot:1 },
  // OCTAVOS (Round of 16)
  { id:'OF1',  r:1, e1:'DF1', e2:'DF2',  next:'CF1', slot:0 },
  { id:'OF2',  r:1, e1:'DF3', e2:'DF4',  next:'CF1', slot:1 },
  { id:'OF3',  r:1, e1:'DF5', e2:'DF6',  next:'CF2', slot:0 },
  { id:'OF4',  r:1, e1:'DF7', e2:'DF8',  next:'CF2', slot:1 },
  { id:'OF5',  r:1, e1:'DF9', e2:'DF10', next:'CF3', slot:0 },
  { id:'OF6',  r:1, e1:'DF11',e2:'DF12', next:'CF3', slot:1 },
  { id:'OF7',  r:1, e1:'DF13',e2:'DF14', next:'CF4', slot:0 },
  { id:'OF8',  r:1, e1:'DF15',e2:'DF16', next:'CF4', slot:1 },
  // CUARTOS
  { id:'CF1',  r:2, e1:'OF1', e2:'OF2',  next:'SF1', slot:0 },
  { id:'CF2',  r:2, e1:'OF3', e2:'OF4',  next:'SF1', slot:1 },
  { id:'CF3',  r:2, e1:'OF5', e2:'OF6',  next:'SF2', slot:0 },
  { id:'CF4',  r:2, e1:'OF7', e2:'OF8',  next:'SF2', slot:1 },
  // SEMIFINALES
  { id:'SF1',  r:3, e1:'CF1', e2:'CF2',  next:'FIN', slot:0, loserNext:'TP' },
  { id:'SF2',  r:3, e1:'CF3', e2:'CF4',  next:'FIN', slot:1, loserNext:'TP' },
  // 3º/4º PUESTO
  { id:'TP',   r:4, e1:'SF1L',e2:'SF2L', next:null,  slot:0 },
  // FINAL
  { id:'FIN',  r:4, e1:'SF1', e2:'SF2',  next:null,  slot:0 },
];


const APUESTAS = [
  { nombre: 'Íñigo Lop', equipos: ['España','Francia','Alemania','Uruguay','Turquía','México','Canadá','Egipto','República Checa','Nueva Zelanda','Bosnia Herzegovina','Ghana'] },
  { nombre: 'Antonio',   equipos: ['Francia','Inglaterra','España','México','Japón','Uruguay','Paraguay','República Checa','Canadá','Sudáfrica','Bosnia Herzegovina','Ghana'] },
  { nombre: 'Jon',       equipos: ['España','Francia','Brasil','Uruguay','Suiza','Japón','Noruega','Canadá','Costa de Marfil','Ghana','Arabia Saudí','Qatar'] },
  { nombre: 'Íñigo Lariz', equipos: ['Francia','España','Portugal','Senegal','Suiza','Ecuador','Noruega','Costa de Marfil','Argelia','Ghana','Arabia Saudí','Bosnia Herzegovina'] },
  { nombre: 'Javi',      equipos: ['Portugal','Marruecos','España','Senegal','Japón','Ecuador','Noruega','Paraguay','Argelia','Bosnia Herzegovina','Arabia Saudí','Ghana'] },
  { nombre: 'Cid',       equipos: ['Alemania','Francia','Inglaterra','México','Estados Unidos','Japón','Egipto','Noruega','República Checa','Qatar','Ghana','Arabia Saudí'] },
  { nombre: 'Isaac',     equipos: ['España','Francia','Portugal','Estados Unidos','México','Turquía','Noruega','Egipto','Suecia','Bosnia Herzegovina','Sudáfrica','Ghana'] },
  { nombre: 'Miguel Ang',equipos: ['España','Inglaterra','Francia','Senegal','Estados Unidos','México','Noruega','Argelia','Egipto','Uzbekistán','Qatar','Ghana'] },
  { nombre: 'Oscar',     equipos: ['Francia','España','Portugal','Turquía','Uruguay','México','Noruega','Egipto','República Checa','Ghana','Arabia Saudí','Bosnia Herzegovina'] },
  { nombre: 'Gerardo',   equipos: ['Argentina','Francia','Marruecos','Uruguay','Ecuador','México','Noruega','Costa de Marfil','Paraguay','Ghana','Arabia Saudí','Sudáfrica'] },
];

const PUNTUACION_COMUNIO = {
  faseGrupos:    { ganado: 3, empate: 1 },
  dieciseisavos: { primero: 5, segundo: 3, tercero: 1 },
  octavos:       15,
  cuartos:       20,
  semifinal:     30,
  cuartoPuesto:  30,
  tercerPuesto:  45,
  segundoPuesto: 60,
  campeon:       75
};
