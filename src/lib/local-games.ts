export type GameMedia = { id: string; name: string; kind: 'image' | 'audio' | 'video' | 'pdf'; file: Blob };
export type GameQuestion = { id: string; text: string; answer: string; questionMedia: GameMedia[]; answerMedia: GameMedia[] };
export type GameRound = { id: string; name: string; questions: GameQuestion[] };
export type LocalGame = { id: string; title: string; rounds: GameRound[] };

export const emptyQuestion = (): GameQuestion => ({ id: crypto.randomUUID(), text: '', answer: '', questionMedia: [], answerMedia: [] });
export const emptyRound = (index: number): GameRound => ({ id: crypto.randomUUID(), name: `Round ${index + 1}`, questions: [emptyQuestion()] });

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('285-trivia', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('games', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadGames(): Promise<LocalGame[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('games', 'readonly');
    const request = transaction.objectStore('games').getAll();
    let games: LocalGame[] = [];
    request.onsuccess = () => { games = request.result; };
    transaction.oncomplete = () => { database.close(); resolve(games); };
    transaction.onabort = () => { database.close(); reject(transaction.error); };
  });
}

export async function saveGame(game: LocalGame): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('games', 'readwrite');
    transaction.objectStore('games').put(game);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onabort = () => { database.close(); reject(transaction.error); };
  });
}

export function readLegacyDrafts(): LocalGame[] {
  const saved: unknown = JSON.parse(localStorage.getItem('285-trivia-drafts') || '[]');
  if (!Array.isArray(saved)) return [];
  return saved.filter(game => game && typeof game.id === 'string' && typeof game.title === 'string').map(game => ({ id: game.id, title: game.title, rounds: [emptyRound(0)] }));
}
