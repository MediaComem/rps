import { join as joinPath } from 'path';
import { Configuration } from 'webpack';

const root = __dirname;
const publicDir = joinPath(root, 'public');

process.traceDeprecation = true;

const config: Configuration = {
  entry: './website/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts' ]
  },
  output: {
    filename: 'app.js',
    path: publicDir
  }
};

export default config;
