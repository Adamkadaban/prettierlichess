const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {execSync} = require('child_process');

const browserTarget = process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome';
const outputDir = browserTarget === 'firefox' ? 'dist-firefox' : 'dist-chrome';

// Plugin to generate Firefox manifest after build
class FirefoxManifestPlugin {
	apply(compiler) {
		if (browserTarget === 'firefox') {
			compiler.hooks.afterEmit.tap('FirefoxManifestPlugin', () => {
				execSync('node ./scripts/generate-firefox-manifest.js', {
					stdio: 'inherit',
				});
			});
		}
	}
}

module.exports = {
	mode: 'production',
	entry: {
		popup: './src/popup.js',
	},
	output: {
		path: path.resolve(process.cwd(), outputDir),
	},
	plugins: [
		new CleanWebpackPlugin(),
		new CopyPlugin({
			patterns: [
				{
					from: 'src',
					to: '.',
					transform(content, absoluteFrom) {
						if (
							browserTarget === 'firefox' &&
							absoluteFrom.endsWith('.css')
						) {
							return content
								.toString()
								.replaceAll(
									'chrome-extension://',
									'moz-extension://'
								);
						}
						return content;
					},
					globOptions: {
						ignore: ['./popup.js'],
					},
				},
				{
					from: './node_modules/@simonwep/pickr/dist/themes/nano.min.css',
					to: './nano.min.css',
				},
			],
		}),
		new FirefoxManifestPlugin(),
	],
};
