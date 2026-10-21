<p align="center">
	<img src="https://raw.githubusercontent.com/prettierlichess/prettierlichess/master/res/prettierlichess-logo.svg" width=150>
	<h1 align="center">Prettierlichess</h1>
</p>
<p align="center">
	<a href="https://prettierlichess.github.io/">
		<img src="https://img.shields.io/badge/Official Website-gray?logo=lichess&style=for-the-badge">
	</a>
	<a href="https://chrome.google.com/webstore/detail/prettier-lichess/epgnobcgnmchnhgkgpedebbmhbblfcob">
		<img src="https://img.shields.io/chrome-web-store/rating/epgnobcgnmchnhgkgpedebbmhbblfcob?color=blue&label=Chrome%20store&logo=googlechrome&style=for-the-badge">
	</a>
	<a href="https://addons.mozilla.org/en-US/firefox/addon/prettier-lichess/">
		<img src="https://img.shields.io/amo/rating/prettier-lichess?color=blue&label=Firefox%20store&logo=firefox&style=for-the-badge">
	</a>
	<a href="https://github.com/prettierlichess/prettierlichess/releases/latest">
		<img src="https://img.shields.io/github/v/release/prettierlichess/prettierlichess?style=for-the-badge">
	</a>
</p>

[Lichess](https://lichess.org/) is an amazing platform that has more than just the ability to play chess, and all for free. Unfortunately I felt like it didn't show this well with it's current design, nor did it show that it was a site that resides in 2023. Now with Prettier Lichess, Lichess becomes more readable, more discoverable, and prettier (plus customizable colors)!

## Code and license

Here is the source code for both the chrome and firefox extension! It's simple but it's mine. Feel free to download, fork, use, and mess with it all you want. No attribution or anything required.

The extension is not published in the Apple Store, but it is possible to get it to work in Safari by creating a build with XCode. More information about that can be found [here](https://github.com/prettierlichess/prettierlichess/issues/153).

## General Usage

To install the extension, go to the official website for [Firefox](https://addons.mozilla.org/en-US/firefox/addon/prettier-lichess) or [Chrome](https://chrome.google.com/webstore/detail/prettier-lichess/epgnobcgnmchnhgkgpedebbmhbblfcob). Set Lichess to dark background to have the best compatibility with prettierlichess. \
With the pop-up you can then customise the colours and choose themes. Have fun!

### Importing colours

Import a JSON object containing colour names and `#RRGGBB` or `#RRGGBBAA`
values, for example `{"primaryColor": "#18D329"}`. Invalid JSON or invalid
values for known colours show an error without changing settings.
Unknown keys are ignored. Omitted colours return to their defaults; an
empty object restores all default colours. Layout, vertical mode and the
native-board choice are preserved, with native-board colours kept transparent.
Imports save a complete palette, so subsequent exports include default colours
as well (except native-board colours).

## Community Themes

Check out the community driven theme library [here](https://github.com/algertc/prettierlichess-themes).

## Development workflow

### Setup

Use Node.js 22, 24, or 26+ for the development tools.

Execute this command for the setup to get all packages:

```
npm install
```

### Build

Build outputs are separated per browser:

-   Chrome build → `dist-chrome/`
-   Firefox build → `dist-firefox/`

For a single combined build (both Chrome and Firefox), run:

```
npm run build
```

To build just one target:

```
npm run build:chrome
npm run build:firefox
```

The Firefox build also emits a Firefox-friendly `manifest.json` into `dist-firefox/` based on `src/manifest.firefox.json`.

### Watch/serve

To rebuild automatically when changes are made (watches both Chrome and Firefox builds simultaneously), run:

```
npm run watch   # Watches both builds, writes to dist-chrome/ and dist-firefox/
```

For the popup test server:

```
npm run popup:run    # builds Chrome then serves from dist-chrome/
```

That's pretty much it :smiley:

For a more detailed description of how the extension works, have a look [here](https://github.com/prettierlichess/prettierlichess/blob/master/.github/CONTRIBUTING.md#structure-of-the-extension).

## Questions, bugs and feature requests

If you have any questions, feature requests or want to report bugs, feel free to [create an issue](https://github.com/prettierlichess/prettierlichess/issues/new).

## How to contribute

For more information, see the [contribution page](https://github.com/prettierlichess/prettierlichess/blob/master/.github/CONTRIBUTING.md).

## Contributors

Thanks to everyone who contributed to this project! Prettierlichess exists thanks to you.
