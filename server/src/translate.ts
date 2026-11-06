const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ES_EN: Record<string, string> = {
  arbol: 'tree', arboles: 'trees', espada: 'sword', escudo: 'shield', casa: 'house', castillo: 'castle', dragon: 'dragon',
  personaje: 'character', personajes: 'characters', enemigo: 'enemy', enemigos: 'enemies', monstruo: 'monster', monstruos: 'monsters',
  mazmorra: 'dungeon', bosque: 'forest', montana: 'mountain', agua: 'water', fuego: 'fire', hielo: 'ice', nieve: 'snow',
  lluvia: 'rain', viento: 'wind', explosion: 'explosion', moneda: 'coin', monedas: 'coins', llave: 'key', puerta: 'door',
  coche: 'car', nave: 'spaceship', espacio: 'space', zombi: 'zombie', esqueleto: 'skeleton', pistola: 'gun', arma: 'weapon',
  armas: 'weapons', boton: 'button', botones: 'buttons', menu: 'menu', musica: 'music', sonido: 'sound', sonidos: 'sounds',
  efecto: 'effect', efectos: 'effects', salto: 'jump', paso: 'footstep', pasos: 'footsteps', golpe: 'hit', risa: 'laugh',
  ciudad: 'city', edificio: 'building', edificios: 'buildings', carretera: 'road', mesa: 'table', silla: 'chair', cama: 'bed',
  planta: 'plant', flor: 'flower', roca: 'rock', piedra: 'stone', perro: 'dog', gato: 'cat', caballo: 'horse', pajaro: 'bird',
  pez: 'fish', tranquila: 'calm', tranquilo: 'calm', epica: 'epic', epico: 'epic', batalla: 'battle', misterio: 'mystery',
  terror: 'horror', aventura: 'adventure', muebles: 'furniture', cofre: 'chest', pocion: 'potion', mago: 'wizard', caballero: 'knight',
  barco: 'ship', isla: 'island', desierto: 'desert', cueva: 'cave', suelo: 'ground', fondo: 'background', icono: 'icon', iconos: 'icons',
  fuente: 'font', letra: 'font', juego: 'game', juegos: 'games', ladrillo: 'brick', madera: 'wood', hierba: 'grass',
};

/** Traduce palabra a palabra las más usadas en juegos; lo desconocido se deja igual. */
export function toEnglish(query: string): string {
  return query.trim().split(/\s+/).filter(Boolean).map((w) => ES_EN[fold(w)] ?? w).join(' ');
}
