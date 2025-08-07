const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const PurgeCSSPlugin = require('purgecss-webpack-plugin');
const globAll = require('glob-all');
const path = require('path');

module.exports = merge(common, {
  mode: 'production',
  output: {
    clean: true
  },
  plugins: [
    new PurgeCSSPlugin({
      paths: globAll.sync([
        `${path.join(process.cwd(), 'src')}/**/*.js`,
        `${path.join(process.cwd(), 'src')}/**/*.html`,
        `${path.join(process.cwd(), 'src')}/**/*.scss`
      ]),
    }),
  ]
});
