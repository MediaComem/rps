import { Config as KnexConfig } from 'knex';
import { join as joinPath, resolve as resolvePath } from 'path';

export interface Config {
  readonly database: KnexConfig;
  readonly port: number;
}

export const root = resolvePath(joinPath(__dirname, '..', '..'));

export async function loadConfig(): Promise<Config> {
  await loadDotenvIfAvailable();

  return Promise.resolve({
    database: {
      client: 'postgresql',
      // FIXME: check valid URL
      connection: process.env.RPS_DATABASE_URL || 'postgresql://rps@localhost/rps',
      // FIXME: pretty database query logs
      debug: parseEnvBoolean('RPS_DATABASE_DEBUG', { required: false }),
      migrations: {
        directory: joinPath(root, 'dist', 'server', 'migrations'),
        tableName: 'migrations'
      },
      pool: {
        min: 2,
        max: 10
      }
    },
    port: parseEnvPort('RPS_PORT', { required: false }) || parseEnvPort('PORT', { required: false }) || 3000
  });
}

async function loadDotenvIfAvailable() {
  let dotenv;
  try {
    dotenv = await import('dotenv');
  } catch {
    // Ignore missing dotenv.
  }

  if (dotenv) {
    dotenv.config({
      path: joinPath(root, '.env')
    });
  }
}

interface ParseEnvOptions {
  readonly defaultValue: string;
  readonly required?: boolean;
}

interface ParseEnvIntegerOptions extends ParseEnvOptions {
  readonly min?: number;
  readonly max?: number;
}

function parseEnv(varname: string, options?: Partial<ParseEnvOptions>): string | undefined;
function parseEnv(varname: string, options: ParseEnvOptions): string;
function parseEnv(varname: string, options: Partial<ParseEnvOptions> = {}) {

  const required = options.required ?? true;
  const value = process.env[varname];

  if (value !== undefined) {
    return value;
  } else if (required) {
    throw new Error(`Environment variable $${varname} is required`);
  } else {
    return options.defaultValue;
  }
}

function parseEnvBoolean(varname: string, options?: Partial<ParseEnvOptions>): boolean | undefined;
function parseEnvBoolean(varname: string, options: ParseEnvOptions): boolean;
function parseEnvBoolean(varname: string, options: Partial<ParseEnvOptions> = {}) {

  const value = parseEnv(varname, options);
  if (value === undefined) {
    return;
  }

  if (/^(?:1|y|yes|t|true)$/u.exec(value)) {
    return true;
  } else if (/^(?:0|n|no|f|false)$/u.exec(value)) {
    return false;
  } else {
    throw new Error(`Environment variable $${varname} must be a boolean, but its value is: ${JSON.stringify(value)}`);
  }
}

function parseEnvInteger(varname: string, options?: Partial<ParseEnvIntegerOptions>): number | undefined;
function parseEnvInteger(varname: string, options: ParseEnvIntegerOptions): number;
function parseEnvInteger(varname: string, options: Partial<ParseEnvIntegerOptions> = {}) {

  const value = parseEnv(varname, options);
  if (value === undefined) {
    return;
  }

  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Environment variable $${varname} must be an integer, but its value is: ${JSON.stringify(value)}`);
  }

  const { min, max } = options;
  if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
    throw new Error(`Environment variable $${varname} must be an integer between ${min ?? '-Infinity'} and ${max ?? 'Infinity'}, but its value is: ${value}`);
  }

  return parsed;
}

function parseEnvPort(varname: string, options?: Partial<ParseEnvOptions>): number | undefined;
function parseEnvPort(varname: string, options: ParseEnvOptions): number;
function parseEnvPort(varname: string, options: Partial<ParseEnvOptions> = {}) {
  return parseEnvInteger(varname, { ...options, min: 1, max: 65535 });
}
