const webpack			= require('webpack');
const TerserPlugin		= require("terser-webpack-plugin");


module.exports = {
    target: 'web',
    mode: 'production', // production | development
    entry: [ './src/index.js' ],
    output: {
	filename: 'serious-error-types.bundled.js',
	globalObject: 'this',
	library: {
	    "name": "SeriousErrors",
	    "type": "umd",
	},
    },
    stats: {
	colors: true
    },
    devtool: 'source-map',
    optimization: {
	minimizer: [
	    new TerserPlugin({
		terserOptions: {
		    keep_classnames: true,
		},
	    }),
	],
    },
};
