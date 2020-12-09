import { loadConfig } from './config';

const env = process.env.NODE_ENV || 'development';

// export default configs;
module.exports = async () => {
  const { database: config } = await loadConfig();
  return { [env]: config };
};
