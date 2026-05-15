export const GENRE_COLORS: { [key: string]: string } = {
  pop: '#e91e63', rock: '#f44336', jazz: '#ff9800', electronic: '#2196f3',
  hiphop: '#9c27b0', classical: '#795548', folk: '#4caf50', reggae: '#8bc34a',
  blues: '#1565c0', country: '#ff8f00', soul: '#e65100', funk: '#6a1b9a',
  metal: '#424242', indie: '#00897b', ambient: '#0288d1', dance: '#d81b60',
  edm: '#7b1fa2', chillout: '#00796b', rnb: '#c62828', latin: '#f9a825',
  house: '#1565c0', techno: '#37474f', trance: '#4a148c', rap: '#212121',
  '8bit': '#00bcd4', acidjazz: '#ff6f00', african: '#8d6e63', afropop: '#43a047',
  alternativehiphop: '#6a1b9a', alternativepop: '#d81b60', alternativernb: '#ad1457',
  alternativerock: '#c62828', dreampop: '#7e57c2', electrohouse: '#0288d1',
  electronica: '#0097a7', electrorock: '#1565c0', electrofunk: '#6a1b9a',
  electroswing: '#f57f17', easylistening: '#558b2f', experimental: '#37474f',
  freejazz: '#e65100', hardrock: '#b71c1c', hardcore: '#212121',
  indiepop: '#ec407a', indierock: '#7cb342', jazzfusion: '#ff8f00',
  jazzfunk: '#ef6c00', latinjazz: '#ff8f00', neoclassical: '#4a148c',
  newage: '#00838f', nujazz: '#e65100', oriental: '#ff6f00',
  progressiverock: '#4527a0', ragtime: '#6d4c41', salsa: '#f4511e',
  singersongwriter: '#2e7d32', ska: '#00695c', smoothjazz: '#ff8f00',
  spacerock: '#1a237e', synthpop: '#7b1fa2', trailer: '#37474f',
  triphop: '#4a148c', waltz: '#5d4037', world: '#2e7d32', chillhop: '#00796b',
  corporate: '#455a64', contemporarypiano: '#4527a0', darkambient: '#212121',
  dancehall: '#00897b', dancepop: '#e91e63', disco: '#f06292', dub: '#2e7d32',
  downtempo: '#37474f', default: '#4f6ef7'
};

export function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre.toLowerCase()] || GENRE_COLORS['default'];
}
