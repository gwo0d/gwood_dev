const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/js/main.js',
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'docs'),
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
      chunkFilename: '[id].css'
    }),
    new PreloadWebpackPlugin({
      rel: 'preload',
      include: 'allAssets',
      fileWhitelist: [/\.js$/, /\.css$/],
      fileBlacklist: [
        /favicon\//,
        /\.ico$/,
        /\.png$/,
        /\.svg$/,
        /\.webmanifest$/
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/assets/favicon', to: 'favicon' }
      ]
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
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico|woff|woff2|eot|ttf|otf|webp)$/i,
        type: 'asset/resource',
      }
    ]
  }
};
