const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');

module.exports = merge(common, {
	mode: 'development',
	devtool: 'source-map',
	devServer: {
		static: path.resolve(__dirname, 'dist'),
		port: 8080,
		hot: true,
		compress: true,
	},
	performance: {
		hints: false,
	},
});
