import path from 'path';
import fs from 'fs';

export interface AppConfig {
  DB_PATH: string;
  PORT: number;
}

const DEFAULT_CONFIG: AppConfig = {
  DB_PATH: 'X:\\FRP\\database.db',
  PORT: 3001
};

let cachedConfig: AppConfig | null = null;

function getConfigFilePath(): string {
  // When running as a pkg-bundled exe, process.execPath is the exe itself
  // In dev mode, use the project root (process.cwd())
  const isPkg = typeof (process as any).pkg !== 'undefined';
  const baseDir = isPkg ? path.dirname(process.execPath) : process.cwd();
  return path.join(baseDir, 'config.json');
}

export function getAppConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = getConfigFilePath();

  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️  config.json not found at ${configPath}. Creating with defaults.`);
    console.warn(`⚠️  Edit config.json and set DB_PATH to your shared SQLite database location.`);
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    cachedConfig = { ...DEFAULT_CONFIG };
    return cachedConfig;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    cachedConfig = {
      DB_PATH: parsed.DB_PATH || DEFAULT_CONFIG.DB_PATH,
      PORT: parsed.PORT || DEFAULT_CONFIG.PORT
    };
    console.log(`✅ Config loaded: DB_PATH=${cachedConfig.DB_PATH}, PORT=${cachedConfig.PORT}`);
    return cachedConfig;
  } catch (err) {
    console.error(`❌ Failed to parse config.json: ${err instanceof Error ? err.message : err}`);
    console.warn('Using default configuration.');
    cachedConfig = { ...DEFAULT_CONFIG };
    return cachedConfig;
  }
}
