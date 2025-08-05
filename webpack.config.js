'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PurgeCSSPlugin = require('purgecss-webpack-plugin')
const globAll = require('glob-all')
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/js/main.js',
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, 'docs'),
        publicPath: '/',
        clean: true
    },
    devtool: 'source-map',
    devServer: {
        static: path.resolve(__dirname, 'docs'),
        port: 8080,
        hot: true
    },
    performance: {
        hints: false
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html', minify: 'auto' }),
        new MiniCssExtractPlugin({
            filename: 'styles.[contenthash].css',
            chunkFilename: '[id].css'
        }),
        new PurgeCSSPlugin({
            paths: globAll.sync([
                `${path.join(process.cwd(), 'src')}/**/*.js`,
                `${path.join(process.cwd(), 'src')}/**/*.html`,
                `${path.join(process.cwd(), 'src')}/**/*.scss`
            ]),
        }),
        new PreloadWebpackPlugin({
            rel: 'preload',
            include: 'allAssets'
        })
    ],
    module: {
        rules: [
            {
                test: /\.(scss)$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    autoprefixer
                                ]
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                silenceDeprecations: [
                                    'mixed-decls',
                                    'color-functions',
                                    'global-builtin',
                                    'import'
                                ]
                            }
                        }
                    }
                ]
            }
        ]
    }
}