#!/usr/bin/env node
var path = require('path');
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var WebpackAssetsManifest = require("webpack-assets-manifest");

var isProd = process.env['NODE_ENV'] == 'production';

var nodeModulesRoot = path.resolve(__dirname, "node_modules");

var ALIAS = {
};

var DEV_SERVER_HOST = 'localhost';
var DEV_SERVER_PORT = 9090;
var DEV_SERVER_PATH = '/';
const OUTPUT_DIR = path.resolve(__dirname, 'media', 'dist');

var app = webpack({
    context: path.resolve(__dirname, 'media/src'),
    resolve: {
        root: [
            path.resolve(__dirname, 'media/src/js'),
            path.resolve(__dirname, 'media/src/css'),
        ],
        alias: ALIAS
    },
    entry: [
        "./css/style.less",
        "./js/main.js"
    ],
    devtool: 'source-map',
    output: {
        path: OUTPUT_DIR,
        filename: 'js/app.[hash].js'
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new ExtractTextPlugin('css/style.[contenthash].css'),
        new WebpackAssetsManifest({
          // Options go here 
        }),
        new CopyWebpackPlugin([{
            from: 'images', 
            to: 'images/'}]),
        
        new CopyWebpackPlugin([{
            from: path.resolve(nodeModulesRoot, 'materialize-css', 'fonts'),
            to: 'fonts',
            flatten: true }]),
        
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        })
    ],
    module: {
        loaders: [
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('style-loader', ['css-loader', 'less-loader'])
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components|__tests__)/,
                loaders: ['babel', 'eslint-loader']
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file?name=/media/fonts/[name].[ext]&emitFile=false'
            }
        ]
    }
});


const compilerHandler = function (err, stats) {
    if (err) {
        console.error("FATAL ERROR", err);
        return;
    }
    console.log(stats.toString({
        context: path.resolve(__dirname, 'media'),
        hash: false,
        version: false,
        timings: true,
        assets: false,
        chunks: true,
        chunkModules: false,
        modules: false,
        children: false,
        colors: true
    }));
};


if (isProd) {
    app.run(compilerHandler);
    return
}

app.watch({}, compilerHandler);

// var server = new WebpackDevServer(app, {
//     contentBase: OUTPUT_DIR,
//     hot: true,
//     publicPath: DEV_SERVER_PATH,
//     filename: 'js/app.js',
//     stats: {
//         hash: false,
//         version: false,
//         timings: true,
//         assets: false,
//         chunks: true,
//         chunkModules: false,
//         modules: false,
//         children: false,
//         colors: true
//     }
// });
// server.listen(DEV_SERVER_PORT, DEV_SERVER_HOST, function () {
//     console.log('dev server started');
// });
