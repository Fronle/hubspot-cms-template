const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const isDevelopment = process.env.NODE_ENV === 'development'
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
	entry: () => {
		const def = {
			index: ['./src/scripts/index.ts', './src/styles/index.scss'],
			// react: ['react', 'react-dom'],
			vue: ['vue'],
			landing_page: {
				import: ['./src/styles/temp_dlp.scss', './src/scripts/temp_dlp.ts'],
				dependOn: 'vue'
			}
		}

		const moduleParents = fs.readdirSync(path.resolve(__dirname, 'src/modules'));

		for (const moduleParent of moduleParents) {
			if (moduleParent.match(/.module/i)) {
				const folder = `modules/${moduleParent}/module`
				console.log(moduleParent);
				def[folder] = {
					import: [`./src/${folder}.ts`, `./src/${folder}.scss`],
					dependOn: 'vue',
				}
			} else {
				const modules = fs.readdirSync(path.resolve(__dirname, `src/modules/${moduleParent}`));
				for (const module of modules) {
					const folder = `modules/${moduleParent}/${module}/module`

					def[folder] = {
						import: [`./src/${folder}.ts`, `./src/${folder}.scss`],
						dependOn: ['vue'],
					}
				}
			}
		}

		return def;
	},

	output: {
		filename: ({ chunk }) => {
			const regex = /([a-zA-Z]*).(module)/

			return regex.test(chunk.name) ? '[name].js' : 'js/[name].js'
		},
		path: path.resolve(__dirname, 'dist/')
	},

	plugins: [
		// new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: ({ chunk }) => {
				return chunk.name === 'index' || chunk.name === 'landing_page' ? 'css/[name].css' : '[name].css';
			}
		}),
		new CopyWebpackPlugin({
			patterns: [
				{ from: 'src/images', to: 'images' },
				{ from: 'src/templates', to: 'templates' },
				{
					from: 'src/modules',
					to: 'modules',
					filter: async (resourcePath) => {
						const filename = path.extname(resourcePath);

						return (filename !== '.ts' && filename !== '.scss');
					},

				},
				{ from: 'src/theme.json', to: '' }
			]
		}),
		new VueLoaderPlugin()
	],

	module: {
		rules: [
			{
				test: /\.svg$/,
				loader: 'svg-inline-loader'
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					loaders: {
						'scss': 'vue-style-loader!css-loader!sass-loader',
						'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
					},
				},
			},
			{
				test: /\.(ts|tsx)$/,
				loader: 'ts-loader',
				include: [path.resolve(__dirname, 'src')],
				exclude: [/node_modules/]
			},

			{
				test: /.(scss|css)$/,

				use: [
					{
						loader: MiniCssExtractPlugin.loader
					},
					{
						loader: 'css-loader',

						options: {
							sourceMap: isDevelopment
						}
					},
					{
						loader: 'sass-loader',

						options: {
							sourceMap: isDevelopment
						}
					}
				]
			}
		]
	},

	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm.js',
		},
		extensions: ['.tsx', '.ts', '.js', '.scss', '.vue']
	},

	optimization: {
		minimizer: [new TerserPlugin()],
	}
};
