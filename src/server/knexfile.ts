import { env, loadConfig } from './config.js';

// export default configs;
export default async () => {
  const { database: config } = await loadConfig();
  return { [env]: config };
};
