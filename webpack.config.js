const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const SOURCE = __dirname + '/src';
const DESTINATION = __dirname + '/www';
const IS_PROD = (process.env.NODE_ENV === 'production');

const cssLoader = (!IS_PROD ? [ 'style-loader', 'css-loader' ] :
	ExtractTextPlugin.extract({ use: 'css-loader', fallback: 'isomorphic-style-loader' }));

module.exports = {

	entry: [
        SOURCE + '/index.js',
    ],

	output: {
		filename: 'index.js',
		path: DESTINATION
	},

	module: {
		loaders: [
			{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
			{ test: /\.css$/, loader: cssLoader },
			{ test: /\.(svg|ttf|eot|woff2?|jpg|png)$/, loader: 'file-loader?name=./assets/[hash].[ext]' },
			{
				test: /\.html$/,
				loader: 'html-loader',
				options: { minimize: true }
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: { loaders: { css: cssLoader } }
			}
		]
	},

	plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: `"${ IS_PROD ? 'production' : 'development' }"`
            }
        }),
		new webpack.optimize.UglifyJsPlugin({
			output: { comments: false }
        }),
        new HtmlWebpackPlugin({
            template: `${SOURCE}/index.html`,
            filename: `index.html`,
            inject: 'body'
        }),
        new ExtractTextPlugin('index.css')
    ],

	resolve: {
		modules: [
			__dirname + '/node_modules',
			SOURCE
		],
		alias: {
			vue: (IS_PROD ? 'vue/dist/vue.min.js' : 'vue/dist/vue.js')
		}
	},

    node: {
        fs: 'empty'
    }

};

if (!IS_PROD) {
    module.exports.plugins = module.exports.plugins.filter(x => {
        return x.constructor !== webpack.optimize.UglifyJsPlugin &&
            x.constructor !== ExtractTextPlugin;
    });
}
