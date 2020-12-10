import HtmlPlugin from 'html-webpack-plugin';
import { join as joinPath, resolve as resolvePath } from 'path';
import sveltePreprocess from 'svelte-preprocess';
import TerserPlugin from 'terser-webpack-plugin';
import { Configuration } from 'webpack';

const root = __dirname;
const publicDir = joinPath(root, 'public');

const mode = getWebpackMode();

const config: Configuration = {
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
      // Fix for svelte-loader problem. See
      // https://github.com/sveltejs/svelte-loader/issues/139.
      {
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false // load Svelte correctly
        }
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            // Set emitCss to false to fix svelte-loader problem. See
            // https://github.com/sveltejs/svelte-loader/issues/139.
            emitCss: false,
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
              name: '[name].[ext]',
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
  resolve: {
    alias: {
      svelte: resolvePath('node_modules', 'svelte')
    },
    extensions: [ '.mjs', '.js', '.svelte', '.ts' ],
    mainFields: [ 'svelte', 'browser', 'module', 'main' ]
  },
  output: {
    filename: 'app.js',
    path: publicDir
  },
  plugins: [
    new HtmlPlugin({
      title: 'Rock Paper Scissors'
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
