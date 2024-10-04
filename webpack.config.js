import HtmlPlugin from 'html-webpack-plugin';
import { join as joinPath, resolve as resolvePath } from 'path';
import { sveltePreprocess } from 'svelte-preprocess';
import TerserPlugin from 'terser-webpack-plugin';

import * as pkg from './package.json' with { type: 'json' };

const root = import.meta.dirname;
const publicDir = joinPath(root, 'public');

const mode = getWebpackMode();

const config = {
  mode,
  devtool: 'source-map',
  entry: './src/website/main.ts',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [ 'style-loader', 'css-loader' ],
      },
      {
        test: /\.styl$/i,
        use: [ 'style-loader', 'css-loader', 'stylus-loader' ]
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: sveltePreprocess({})
          }
        }
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      }
    ]
  },
  optimization: {
    minimize: mode === 'production',
    minimizer: [ new TerserPlugin() ]
  },
  performance: {
    hints: false,
    maxEntrypointSize: 1024 * 1024 * 2, // 2 MB
    maxAssetSize: 1024 * 512 // 512 KB
  },
  resolve: {
    alias: {
      svelte: resolvePath('node_modules', 'svelte/src/runtime')
    },
    extensions: [ '.mjs', '.js', '.svelte', '.ts' ],
    mainFields: [ 'svelte', 'browser', 'module', 'main' ],
    conditionNames: [ 'svelte', 'browser' ]
  },
  output: {
    filename: 'app.[contenthash].js',
    path: publicDir
  },
  plugins: [
    new HtmlPlugin({
      title: pkg.title || 'Rock Paper Scissors'
    })
  ]
};

export default config;

function getWebpackMode() {
  const mode = process.env.RPS_WEBPACK_MODE;
  if (mode === undefined || mode === 'development') {
    return 'development';
  } else if (mode === 'production') {
    return 'production';
  } else {
    throw new Error(`Environment variable $RPS_WEBPACK_MODE must be either "development" or "production", but its value is ${JSON.stringify(mode)}`);
  }
}
