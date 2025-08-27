const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');

module.exports = merge(common, {
	mode: 'production',
	output: {
		clean: true,
		publicPath: '/',
	},
	devServer: {
		static: path.resolve(__dirname, 'docs'),
		port: 8080,
		hot: false,
		historyApiFallback: true,
	},
	plugins: [],
});
