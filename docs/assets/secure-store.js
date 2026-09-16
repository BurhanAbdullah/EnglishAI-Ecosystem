(() => {
  const DB_NAME = 'englishai-secure-state';
  const STORE = 'keys';
  const VERSION = 1;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let dbPromise;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB unavailable'));
    });
    return dbPromise;
  }

  async function getKey() {
    const db = await openDb();
    const existing = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get('device-key');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(key, 'device-key');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return key;
  }

  async function set(name, value) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = enc.encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const packed = { v: 1, iv: Array.from(iv), data: Array.from(new Uint8Array(ciphertext)) };
    localStorage.setItem(name, JSON.stringify(packed));
  }

  async function get(name) {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const packed = JSON.parse(raw);
      if (!packed?.iv || !packed?.data) return null;
      const key = await getKey();
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(packed.iv) }, key, new Uint8Array(packed.data));
      return JSON.parse(dec.decode(plaintext));
    } catch { return null; }
  }

  function remove(name) { localStorage.removeItem(name); }

  window.EnglishAISecureStore = { set, get, remove };
})();
