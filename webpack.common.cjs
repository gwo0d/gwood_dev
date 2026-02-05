const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
	resolve: {
		alias: {
			'~': path.resolve(__dirname, 'node_modules'),
		},
		extensions: ['.tsx', '.ts', '.js'],
	},
	entry: './src/ts/main.ts',
	output: {
		filename: 'bundle.[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: '/',
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
			minify: 'auto',
			inject: 'body',
			scriptLoading: 'defer',
		}),
		new MiniCssExtractPlugin({
			filename: 'styles.[contenthash].css',
			chunkFilename: '[id].css',
		}),
		new PreloadWebpackPlugin({
			rel: 'preload',
			include: 'allAssets',
			fileWhitelist: [/\.js$/, /\.css$/],
			fileBlacklist: [
				/assets\//,
				/\.ico$/,
				/\.png$/,
				/\.svg$/,
				/\.webmanifest$/,
			],
		}),
		new CopyWebpackPlugin({
			patterns: [
				{ from: 'src/assets', to: 'assets', noErrorOnMissing: true },
				{ from: 'src/_redirects', to: '', noErrorOnMissing: true },
				{ from: 'src/_headers', to: '', noErrorOnMissing: true },
			],
		}),
		new CompressionPlugin({
			filename: '[path][base].gz',
			algorithm: 'gzip',
			test: /\.(js|css|html|svg)$/i,
			threshold: 10240,
			minRatio: 0.8,
			deleteOriginalAssets: false,
		}),
	],
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: {
					loader: 'ts-loader',
					options: {
						transpileOnly: true,
					},
				},
				exclude: /node_modules/,
			},
			{
				test: /\.(scss)$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					{
						loader: 'css-loader',
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [autoprefixer],
							},
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								silenceDeprecations: [
									'mixed-decls',
									'color-functions',
									'global-builtin',
									'import',
								],
							},
						},
					},
				],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif|ico|woff|woff2|eot|ttf|otf|webp)$/i,
				type: 'asset/resource',
			},
		],
	},
};
