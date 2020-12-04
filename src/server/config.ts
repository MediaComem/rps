import { join as joinPath, resolve as resolvePath } from 'path';

export interface Config {
  readonly port: number;
}

export const root = resolvePath(joinPath(__dirname, '..', '..'));

export function load(): Promise<Config> {
  return Promise.resolve({
    port: parseEnvPort('RPS_PORT', { required: false }) || parseEnvPort('PORT', { required: false }) || 3000
  });
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
