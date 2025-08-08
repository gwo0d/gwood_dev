const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');

module.exports = merge(common, {
  mode: 'production',
  output: {
    clean: true,
    publicPath: './',
  },
  plugins: [],
});
