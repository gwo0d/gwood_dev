'use strict'

import path from 'path'
import autoprefixer from 'autoprefixer'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import miniCssExtractPlugin from 'mini-css-extract-plugin'
import { PurgeCSSPlugin } from 'purgecss-webpack-plugin'
import * as glob from 'glob'

export default {
    mode: 'development',
    entry: './src/js/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(process.cwd(), 'dist'),
    },
    devServer: {
        static: path.resolve(process.cwd(), 'dist'),
        port: 8080,
        hot: true
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html', minify: 'auto' }),
        new miniCssExtractPlugin(),
        new PurgeCSSPlugin({
            paths: glob.sync(`${path.join(process.cwd(), 'src')}/**/*`, { nodir: true }),
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(scss)$/,
                use: [
                    {
                        loader: miniCssExtractPlugin.loader
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