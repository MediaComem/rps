import { env, loadConfig } from './config';

// export default configs;
module.exports = async () => {
  const { database: config } = await loadConfig();
  return { [env]: config };
};
