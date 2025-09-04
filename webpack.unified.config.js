import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/unified-entry.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'unified-bundle.js',
    library: 'UnifiedLib',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  mode: 'production',
  optimization: {
    minimize: true
  },
  resolve: {
    fallback: {
      // Browser polyfills for Node.js modules
      "buffer": false,
      "stream": false,
      "crypto": false,
      "path": false,
      "fs": false,
      "util": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};