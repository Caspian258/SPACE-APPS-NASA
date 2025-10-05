(function () {
  const ASTEROID_PATH = 'Database/Trials/BaseAsteroides.jsonl';
  const COMET_PATH = 'Database/Trials/Comets.json';

  const globalScope = typeof window !== 'undefined' ? window : globalThis;
  globalScope.asteroidDatabase = Array.isArray(globalScope.asteroidDatabase) ? globalScope.asteroidDatabase : [];
  globalScope.cometDatabase = Array.isArray(globalScope.cometDatabase) ? globalScope.cometDatabase : [];

  function parseJsonl(text) {
    return (text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.warn('Línea JSONL inválida omitida:', line);
          return null;
        }
      })
      .filter(Boolean);
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Error ${response.status} cargando ${path}`);
    }
    return response;
  }

  async function loadDatabases() {
    let asteroidData = [];
    let cometData = [];

    try {
      const [asteroidResponse, cometResponse] = await Promise.all([
        fetchJson(ASTEROID_PATH).then((res) => res.text()),
        fetchJson(COMET_PATH).then((res) => res.json())
      ]);
      asteroidData = parseJsonl(asteroidResponse);
      cometData = Array.isArray(cometResponse) ? cometResponse : [];
    } catch (error) {
      console.error('No se pudieron cargar las bases de datos locales:', error);
    }

    globalScope.asteroidDatabase = asteroidData;
    globalScope.cometDatabase = cometData;
    return { asteroidDatabase: asteroidData, cometDatabase: cometData };
  }

  if (!globalScope.databaseReady) {
    globalScope.databaseReady = loadDatabases().catch((error) => {
      console.error('Error durante la carga de datos:', error);
      return { asteroidDatabase: globalScope.asteroidDatabase, cometDatabase: globalScope.cometDatabase };
    });
  }
})();
