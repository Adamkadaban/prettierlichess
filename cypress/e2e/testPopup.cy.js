const NAMES = [
	'primaryColor',
	'secondaryColor',
	'tertiaryColor',
	'backgroundColor',
	'surfaceColor',
	'surfaceHoverColor',
	'defaultWhiteColor',
	'textColor',
	'darkSquareColor',
	'lightSquareColor',
	'lastMoveColor',
	'premoveColor',
	'moveIndicatorColor',
	'primaryArrowColor',
	'secondaryArrowColor',
	'tertiaryArrowColor',
	'alternateArrowColor',
];

describe('Test native board coordinates', () => {
	it('Follows scoped native colors and restores custom colors', () => {
		cy.startup();
		const build =
			Cypress.browser.name === 'firefox' ? 'dist-firefox' : 'dist-chrome';
		cy.readFile(`${build}/styles.css`).then((styles) => {
			cy.readFile(`${build}/content.js`).then((content) => {
				cy.document().then((doc) => {
					const frame = doc.createElement('iframe');
					doc.body.appendChild(frame);
					const win = frame.contentWindow;
					const page = win.document;
					page.body.className = 'coords-in';
					page.body.innerHTML =
						'<div class="is2d"><div class="cg-wrap orientation-white">' +
						'<coords class="files" style="---cg-ccb: #123456; ---cg-ccw: #abcdef">' +
						'<coord></coord><coord></coord></coords><cg-resize></cg-resize></div></div>';
					const style = page.createElement('style');
					style.textContent = styles;
					page.head.appendChild(style);
					let storageChanged;
					win.chrome = {
						storage: {
							sync: {
								get: (request, callback) =>
									callback({
										boardDark: '#112233',
										boardLight: '#ddeeff',
										defaultBoardSwitch: true,
										layoutPreference: 'lichess',
									}),
							},
							onChanged: {
								addListener: (listener) => {
									storageChanged = listener;
								},
							},
						},
						runtime: {onMessage: {addListener() {}}},
					};
					const script = page.createElement('script');
					script.textContent = content;
					page.body.appendChild(script);
					const colors = () =>
						Array.from(
							page.querySelectorAll('coord'),
							(coord) => win.getComputedStyle(coord).color
						);
					expect(colors()).to.deep.equal([
						'rgb(171, 205, 239)',
						'rgb(18, 52, 86)',
					]);
					const resize = page.querySelector('cg-resize');
					expect(
						win.getComputedStyle(resize, '::before').backgroundColor
					).to.equal(win.getComputedStyle(resize).color);
					page.querySelector('.cg-wrap').className =
						'cg-wrap orientation-black';
					expect(colors()).to.deep.equal([
						'rgb(18, 52, 86)',
						'rgb(171, 205, 239)',
					]);
					page.querySelector('coords').style.setProperty(
						'---cg-ccb',
						'#654321'
					);
					expect(colors()[0]).to.equal('rgb(101, 67, 33)');
					page.querySelector('.is2d').className = 'is3d';
					expect(colors()).to.deep.equal([
						'rgb(255, 255, 255)',
						'rgb(255, 255, 255)',
					]);
					storageChanged(
						{defaultBoardSwitch: {newValue: false}},
						'sync'
					);
					expect(colors()).to.deep.equal([
						'rgb(17, 34, 51)',
						'rgb(221, 238, 255)',
					]);
					frame.remove();
				});
			});
		});
	});
});

describe('Test color pickrs', () => {
	beforeEach(cy.startup);

	it('Pickrs exist and open', () => {
		cy.get('.pickr').should('exist');
		cy.get('.pickr').should('be.visible');
		cy.get('.pcr-app').should('not.be.visible');

		cy.get('.pickr > button').first().click();
		cy.get('.pcr-app').should('be.visible');
	});
	it('Get default values for pickrs', () => {
		for (let i = 0; i < NAMES.length; i++) {
			cy.get('.pickr')
				.eq(i)
				.getColor()
				.then(($color) => {
					Cypress.expose(NAMES[i], $color);
				});
		}
	});
	it('Closing the pickrs', () => {
		cy.get('.pickr>button').first().click();
		cy.get('.pcr-app').should('be.visible');
		cy.closePickr();
		cy.get('.pcr-app').should('not.be.visible');
	});
	it('Changing the pickrs', () => {
		cy.get('.pickr').first().changeColor('#000000');
		cy.get('.pickr').first().shouldHaveColor('#000000');
	});
});

describe('Test navigation containing-block fixtures', () => {
	beforeEach(cy.startup);

	[390, 768, 1000, 1020, 1440].forEach((width) => {
		it(`Preserves navigation bounds in a header fixture at ${width}px`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'navigation-width-fixture';
				frame.style.cssText =
					`width: ${width}px; height: 800px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							* { box-sizing: border-box; }
							html { ---site-header-height: 64px; }
							body { margin: 0; }
							header#top {
								position: relative;
								width: calc(100% - 20px);
								height: 64px;
							}
							.topnav-toggle { display: none; }
							#topnav { top: 0; left: 0; }
						</style>
						<link rel="stylesheet" href="/styles.css">
					</head><body>
						<header id="top">
							<input class="topnav-toggle" type="checkbox" checked>
							<nav id="topnav">
								<section><a href="#play">Play</a></section>
							</nav>
						</header>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#navigation-width-fixture').should(($frame) => {
				const frame = $frame[0];
				const doc = frame.contentDocument;
				const win = frame.contentWindow;
				const link = doc.querySelector('link[rel="stylesheet"]');
				expect(link, 'built stylesheet link').to.exist;
				expect(link.sheet, 'loaded built stylesheet').to.exist;
				expect(link.sheet.cssRules.length).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);

				const nav = doc.getElementById('topnav');
				const header = doc.getElementById('top');
				const bounds = nav.getBoundingClientRect();
				const headerBounds = header.getBoundingClientRect();
				if (width >= 1020) {
					const left = headerBounds.left + header.clientLeft;
					expect(header.clientWidth).to.be.lessThan(win.innerWidth);
					expect(nav.offsetParent).to.equal(header);
					expect(bounds.left).to.be.closeTo(left, 1);
					expect(bounds.top).to.be.closeTo(headerBounds.top, 1);
					expect(bounds.width).to.be.closeTo(header.clientWidth, 1);
					expect(bounds.right).to.be.at.most(
						left + header.clientWidth + 1
					);
				} else {
					expect(win.getComputedStyle(nav).position).to.equal(
						'fixed'
					);
					expect(bounds.left).to.be.closeTo(0, 1);
					expect(bounds.top).to.be.closeTo(headerBounds.bottom, 1);
					expect(bounds.width).to.be.closeTo(
						width * (width <= 713 ? 0.9 : 0.6),
						1
					);
					expect(bounds.bottom).to.be.closeTo(800, 1);
				}
			});
		});
	});
});

describe('Test broadcast stylesheet fixtures', () => {
	beforeEach(cy.startup);

	[
		{width: 390, nativeMargin: 45},
		{width: 799, nativeMargin: 57},
		{width: 800, nativeMargin: 57},
	].forEach(({width, nativeMargin}) => {
		it(`Preserves broadcast margin scope at ${width}px`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'broadcast-style-fixture';
				frame.style.cssText =
					`width: ${width}px; height: 900px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							main.is-relay:not(.has-relay-tour) {
								margin-top: ${nativeMargin}px;
							}
						</style>
						<link rel="stylesheet" href="/styles.css">
					</head><body>
						<div id="main-wrap">
							<main id="game" class="analyse has-players is-relay"></main>
							<main id="overview" class="analyse has-players is-relay has-relay-tour"></main>
							<main id="study" class="analyse has-players"></main>
							<main id="analysis" class="analyse"></main>
						</div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#broadcast-style-fixture').should(($frame) => {
				const frame = $frame[0];
				const doc = frame.contentDocument;
				const win = frame.contentWindow;
				const link = doc.querySelector('link[rel="stylesheet"]');
				expect(link, 'built stylesheet link').to.exist;
				expect(link.sheet, 'loaded built stylesheet').to.exist;
				expect(link.sheet.cssRules.length).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);

				const gameStyle = win.getComputedStyle(
					doc.getElementById('game')
				);
				expect(gameStyle.marginTop).to.equal(`${nativeMargin}px`);
				expect(gameStyle.overflow).to.equal('visible');
				if (width < 800) {
					for (const id of ['overview', 'study', 'analysis']) {
						const style = win.getComputedStyle(
							doc.getElementById(id)
						);
						expect(style.margin, id).to.equal('0px');
						expect(style.overflow, id).to.equal('hidden');
					}
				}
			});
		});
	});

	[
		{width: 390, height: 900},
		{width: 740, height: 390},
		{width: 800, height: 900},
	].forEach(({width, height}) => {
		it(`Scopes broadcast overview layout at ${width}x${height}`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'broadcast-overview-fixture';
				frame.style.cssText =
					`width: ${width}px; height: ${height}px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							* { box-sizing: border-box; }
							body { margin: 0; }
							main.analyse {
								display: grid;
								grid-template-areas: 'board';
							}
							main.is-relay.has-relay-tour {
								grid-template-areas: 'relay-tour' 'side' 'relay-admin';
							}
							main.is-relay:not(.has-relay-tour) { margin-top: 57px; }
							main.is-relay .relay-tour { grid-area: relay-tour; }
							main.is-relay .relay-tour__side { grid-area: side; }
							main.is-relay .relay-admin__container { grid-area: relay-admin; }
							#overview > * { min-width: 12rem; min-height: 4rem; }
							@media (min-width: 800px), (orientation: landscape) {
								main.is-relay.has-relay-tour {
									grid-template-areas: 'relay-tour . side';
								}
							}
						</style>
						<link rel="stylesheet" href="/styles.css">
					</head><body>
						<div id="main-wrap">
							<main id="overview" class="analyse has-players is-relay has-relay-tour">
								<aside class="relay-tour__side">Game list</aside>
								<div class="relay-tour">Round overview</div>
								<div class="relay-admin__container">Broadcast controls</div>
							</main>
							<main id="game" class="analyse has-players is-relay"></main>
							<main id="study" class="analyse has-players"></main>
						</div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#broadcast-overview-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				const ruleCount =
					doc.querySelector('link')?.sheet?.cssRules.length || 0;
				expect(ruleCount, 'loaded built stylesheet').to.be.greaterThan(
					0
				);
				expect(win.innerWidth).to.equal(width);
				expect(win.innerHeight).to.equal(height);

				const overview = doc.getElementById('overview');
				const overviewStyle = win.getComputedStyle(overview);
				const gameStyle = win.getComputedStyle(
					doc.getElementById('game')
				);
				const studyStyle = win.getComputedStyle(
					doc.getElementById('study')
				);
				expect(gameStyle.marginTop).to.equal('57px');
				expect(gameStyle.overflow).to.equal('visible');
				expect(studyStyle.marginTop).to.equal('0px');
				if (width >= 800) {
					expect(overviewStyle.gridTemplateAreas).to.equal(
						'"relay-tour . side"'
					);
					expect(gameStyle.gridTemplateAreas).to.equal('"board"');
					expect(studyStyle.gridTemplateAreas).to.equal('"board"');
					return;
				}

				const gameAreas = [
					'board',
					'controls',
					'tools',
					'side',
					'round-training',
					'under',
					'chat',
					'uchat',
				]
					.map((area) => `"${area}"`)
					.join(' ');
				expect(gameStyle.gridTemplateAreas).to.equal(
					width > height ? '"board"' : gameAreas
				);
				expect(studyStyle.gridTemplateAreas).to.equal(gameAreas);
				expect(studyStyle.overflow).to.equal('hidden');
				expect(overviewStyle.gridTemplateAreas).to.equal(
					'"relay-tour" "side" "relay-admin"'
				);
				const bounds = overview.getBoundingClientRect();
				expect(bounds.left).to.be.at.least(0);
				expect(bounds.right).to.be.at.most(width);
				let previousBottom = bounds.top;
				for (const selector of [
					'.relay-tour',
					'.relay-tour__side',
					'.relay-admin__container',
				]) {
					const child = overview.querySelector(selector);
					const rect = child.getBoundingClientRect();
					expect(rect.width, selector).to.be.greaterThan(0);
					expect(rect.left, selector).to.be.at.least(bounds.left);
					expect(rect.right, selector).to.be.at.most(bounds.right);
					expect(rect.top, selector).to.be.at.least(previousBottom);
					expect(rect.bottom, selector).to.be.at.most(bounds.bottom);
					previousBottom = rect.bottom;
				}
				expect(overview.scrollWidth).to.be.at.most(
					overview.clientWidth
				);
			});
		});
	});
});

describe('Test broadcast control spacing fixtures', () => {
	beforeEach(cy.startup);

	[
		{width: 390, height: 900, nativeHeight: 45},
		{width: 799, height: 900, nativeHeight: 57},
		{width: 800, height: 900, nativeHeight: 57},
		{width: 740, height: 390, nativeHeight: 57},
	].forEach(({width, height, nativeHeight}) => {
		it(`Preserves broadcast control spacing at ${width}x${height}`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'broadcast-control-fixture';
				frame.style.cssText =
					`width: ${width}px; height: ${height}px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							.analyse__controls { margin: 11px 7px 13px; }
							@media (max-width: 799px) and (orientation: portrait) {
								.analyse.is-relay .analyse__controls {
									margin-top: ${nativeHeight}px;
								}
							}
						</style>
						<link rel="stylesheet" href="/styles.css">
					</head><body>
						<div id="main-wrap">
							<main id="game" class="analyse has-players is-relay">
								<div class="analyse__controls analyse-controls"></div>
							</main>
							<main id="overview" class="analyse has-players is-relay has-relay-tour">
								<div class="analyse__controls analyse-controls"></div>
							</main>
							<main id="study" class="analyse has-players">
								<div class="analyse__controls analyse-controls"></div>
							</main>
							<main id="analysis" class="analyse">
								<div class="analyse__controls analyse-controls"></div>
							</main>
						</div>
						<div id="standalone" class="analyse__controls analyse-controls"></div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#broadcast-control-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				const ruleCount =
					doc.querySelector('link')?.sheet?.cssRules.length || 0;
				expect(ruleCount, 'loaded built stylesheet').to.be.greaterThan(
					0
				);
				expect(win.innerWidth).to.equal(width);
				expect(win.innerHeight).to.equal(height);
				const gameMargin =
					width < 800 && height >= width ? nativeHeight : 0;
				for (const [selector, top] of [
					['#game .analyse__controls', gameMargin],
					['#overview .analyse__controls', 0],
					['#study .analyse__controls', 0],
					['#analysis .analyse__controls', 0],
					['#standalone', 0],
				]) {
					const style = win.getComputedStyle(
						doc.querySelector(selector)
					);
					expect(style.marginTop, selector).to.equal(`${top}px`);
					expect(
						[
							style.marginRight,
							style.marginBottom,
							style.marginLeft,
						],
						selector
					).to.deep.equal(['16px', '0px', '16px']);
				}
			});
		});
	});
});

describe('Test broadcast landscape layout fixtures', () => {
	beforeEach(cy.startup);

	const relayAreas = [
		'board gauge side',
		'board gauge tools',
		'board . controls',
		'under under under',
		'relay-admin . .',
	]
		.map((area) => `"${area}"`)
		.join(' ');
	const stackedAreas = [
		'board',
		'controls',
		'tools',
		'side',
		'round-training',
		'under',
		'chat',
		'uchat',
	]
		.map((area) => `"${area}"`)
		.join(' ');

	[
		{kind: 'game', width: 740, height: 390},
		{kind: 'game', width: 390, height: 900},
		{kind: 'game', width: 800, height: 390},
		{kind: 'analysis', width: 740, height: 390},
		{kind: 'study', width: 740, height: 390},
		{kind: 'overview', width: 740, height: 390},
	].forEach(({kind, width, height}) => {
		it(`Scopes landscape layout for ${kind} at ${width}x${height}`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'broadcast-landscape-fixture';
				frame.style.cssText =
					`width: ${width}px; height: ${height}px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				const classes = {
					game: 'analyse has-players is-relay',
					overview: 'analyse has-players is-relay has-relay-tour',
					study: 'analyse has-players',
					analysis: 'analyse',
				};
				const content =
					kind === 'overview'
						? `<div class="relay-tour">Round overview</div>
							<aside class="relay-tour__side">Game list</aside>`
						: `<div class="analyse__board main-board">
								${
									kind === 'game'
										? '<div class="relay-board-player relay-board-player-bot">Player</div>'
										: ''
								}
							</div>
							<aside class="${
								kind === 'game'
									? 'relay-tour__side'
									: 'analyse__side'
							}">Game list</aside>
							<div class="analyse__tools">Moves</div>
							<div class="analyse__controls analyse-controls">Move controls</div>`;
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							* { box-sizing: border-box; }
							body {
								margin: 0;
								---display-columns: 1;
								---site-header-height: 40px;
								---block-gap: 10px;
								---analyse-gauge-col: var(---block-gap);
								---analyse-gauge-offset: calc(var(---analyse-gauge-col) - 4px);
								---col2-uniboard-width: min(
									calc(100vw - var(---block-gap) - 240px - 20px),
									calc(100vh - var(---site-header-height) - 1rem)
								);
								---cg-height: 100vw;
								---cg-width: var(---cg-height);
								--fixture-player-height: 57px;
							}
							main.analyse {
								display: grid;
								grid-template-areas: 'board' 'controls' 'tools' 'side';
							}
							main.is-relay:not(.has-relay-tour) { margin-top: var(--fixture-player-height); }
							.main-board {
								grid-area: board;
								position: relative;
								display: block;
								height: 0;
								padding-bottom: 100%;
								width: 100%;
							}
							.relay-board-player-bot {
								position: absolute;
								top: var(---cg-height);
								width: var(---cg-width);
								height: var(--fixture-player-height);
							}
							.relay-tour { grid-area: relay-tour; min-height: 4rem; }
							.relay-tour__side, .analyse__side { grid-area: side; min-height: 4rem; }
							.analyse__tools { grid-area: tools; height: auto; }
							.analyse__controls { grid-area: controls; }
							@media (max-width: 799px) and (orientation: portrait) {
								.analyse.is-relay .analyse__controls { margin-top: var(--fixture-player-height); }
							}
							@media (min-width: 800px), (orientation: landscape) {
								body {
									---display-columns: 2;
									---cg-height: var(---col2-uniboard-width);
								}
								main.analyse {
									grid-template-columns:
										var(---col2-uniboard-width) var(---analyse-gauge-col)
										minmax(calc(240px - var(---analyse-gauge-offset)), calc(400px - var(---analyse-gauge-offset)));
								}
								main.is-relay:not(.has-relay-tour) {
									grid-template-rows: repeat(2, calc(var(---cg-height) / 2)) var(--fixture-player-height);
									grid-template-areas: ${relayAreas};
								}
								main.is-relay .analyse__controls { height: var(--fixture-player-height); }
								main.is-relay.has-relay-tour { grid-template-areas: 'relay-tour . side'; }
							}
							@media (max-width: 799px) and (orientation: landscape) {
								body {
									---cg-height: calc(100vh - var(---site-header-height) - var(---block-gap));
								}
								main.analyse {
									grid-template-columns:
										minmax(55vmin, calc(100vh - var(---site-header-height) - var(---block-gap)))
										var(---analyse-gauge-col)
										minmax(calc(200px - var(---analyse-gauge-offset)), calc(240px - var(---analyse-gauge-offset)));
								}
							}
						</style>
						<link rel="stylesheet" href="/styles.css">
					</head><body>
						<div id="main-wrap"><main class="${classes[kind]}">${content}</main></div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#broadcast-landscape-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				const ruleCount =
					doc.querySelector('link')?.sheet?.cssRules.length || 0;
				expect(ruleCount, 'loaded built stylesheet').to.be.greaterThan(
					0
				);
				expect(win.innerWidth).to.equal(width);
				expect(win.innerHeight).to.equal(height);
				const main = doc.querySelector('main');
				const mainStyle = win.getComputedStyle(main);
				if (kind === 'overview') {
					expect(mainStyle.gridTemplateAreas).to.equal(
						'"relay-tour" "side" "relay-admin"'
					);
					const tour = doc
						.querySelector('.relay-tour')
						.getBoundingClientRect();
					const side = doc
						.querySelector('.relay-tour__side')
						.getBoundingClientRect();
					expect(tour.left).to.be.at.least(0);
					expect(tour.right).to.be.at.most(width);
					expect(side.top).to.be.at.least(tour.bottom);
					return;
				}

				const board = doc.querySelector('.main-board');
				const boardRect = board.getBoundingClientRect();
				const tools = doc.querySelector('.analyse__tools');
				const toolsStyle = win.getComputedStyle(tools);
				const controls = doc.querySelector('.analyse__controls');
				const controlsStyle = win.getComputedStyle(controls);
				if (kind === 'game') {
					expect(mainStyle.marginTop).to.equal('57px');
					expect(mainStyle.overflow).to.equal('visible');
				}
				if (kind !== 'game' || height >= width) {
					expect(mainStyle.gridTemplateAreas).to.equal(stackedAreas);
					expect(boardRect.width).to.equal(width);
					expect(boardRect.height).to.equal(width);
					expect(win.getComputedStyle(board).marginLeft).to.equal(
						'-10px'
					);
					expect(toolsStyle.height).to.equal(`${height / 2}px`);
					expect(toolsStyle.marginBottom).to.equal('20px');
					expect(controlsStyle.marginTop).to.equal(
						kind === 'game' ? '57px' : '0px'
					);
					return;
				}

				expect(mainStyle.gridTemplateAreas).to.equal(relayAreas);
				const columns = mainStyle.gridTemplateColumns
					.split(' ')
					.map(parseFloat);
				expect(columns).to.have.length(3);
				expect(columns[1]).to.equal(width < 800 ? 10 : 30);
				expect(boardRect.width).to.be.at.most(height);
				expect(boardRect.height).to.be.closeTo(boardRect.width, 1);
				expect(win.getComputedStyle(board).marginLeft).to.equal('0px');
				expect(toolsStyle.marginBottom).to.equal('0px');
				expect(controlsStyle.marginTop).to.equal('0px');
				const controlsRect = controls.getBoundingClientRect();
				const playerRect = doc
					.querySelector('.relay-board-player-bot')
					.getBoundingClientRect();
				expect(controlsRect.left).to.be.at.least(playerRect.right);
				expect(tools.getBoundingClientRect().bottom).to.be.at.most(
					controlsRect.top
				);
				expect(main.scrollWidth).to.be.at.most(main.clientWidth);
			});
		});
	});
});

describe('Test analysis control palette fixtures', () => {
	beforeEach(cy.startup);

	[
		{width: 390, theme: 'light', background: '#fff', page: '#ededed'},
		{width: 390, theme: 'dark', background: '#262421', page: '#161512'},
		{width: 800, theme: 'light', background: '#fff', page: '#ededed'},
	].forEach(({width, theme, background, page}) => {
		it(`Preserves the control palette at ${width}px in ${theme}`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'analysis-control-palette';
				frame.style.cssText =
					`width: ${width}px; height: 900px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html class="${theme}" style="--surfaceColor: #2b3a40 !important">
					<head><style>
						:root { --c-bg: ${background}; --c-bg-page: ${page}; --c-font-dimmer: #aaa; }
						.fbt { background: transparent; }
						@media (max-width: 799px) and (orientation: portrait) {
							.analyse__controls .fbt {
								background: color-mix(in oklab, var(--c-bg) 50%, var(--c-bg-page));
							}
							.analyse__controls [data-mode='ceval']::after {
								content: '';
								color: var(--c-font-dimmer);
							}
						}
					</style><link rel="stylesheet" href="/styles.css"></head>
					<body><main class="analyse">
						<div class="analyse__controls analyse-controls">
							<div class="jumps"><button class="fbt move">Next</button></div>
							<button class="fbt tool">Explorer</button>
							<button class="fbt active" data-mode="ceval">Evaluation</button>
						</div>
					</main></body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#analysis-control-palette').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(
					doc.querySelector('link')?.sheet?.cssRules.length || 0,
					'loaded built stylesheet'
				).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);
				const context = doc.createElement('canvas').getContext('2d');
				const paint = (color) => {
					context.clearRect(0, 0, 1, 1);
					context.fillStyle = '#000';
					context.fillStyle = color;
					context.fillRect(0, 0, 1, 1);
					return Array.from(context.getImageData(0, 0, 1, 1).data);
				};
				const root = win.getComputedStyle(doc.documentElement);
				const mode = doc.querySelector('[data-mode="ceval"]');
				expect(win.getComputedStyle(mode, '::after').color).to.equal(
					win.getComputedStyle(mode).color
				);
				for (const [selector, color] of [
					[
						'.move, .tool',
						width < 800
							? root.getPropertyValue('--surfaceColor')
							: 'transparent',
					],
					['.active', root.getPropertyValue('--primaryColor')],
				]) {
					const expected = paint(color);
					for (const button of doc.querySelectorAll(selector)) {
						const actual = paint(
							win.getComputedStyle(button).backgroundColor
						);
						actual.forEach((value, index) =>
							expect(
								Math.abs(value - expected[index]),
								`${selector} channel ${index}`
							).to.be.at.most(1)
						);
					}
				}
			});
		});
	});
});

describe('Test native round row sizing', () => {
	beforeEach(cy.startup);

	[
		{width: 390, boardHeight: 384},
		{width: 799, boardHeight: 560},
		{width: 800, boardHeight: 400},
	].forEach(({width, boardHeight}) => {
		it(`Preserves the native board row at ${width}px`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'round-row-fixture';
				frame.style.cssText =
					`width: ${width}px; height: 1000px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html><head><style>
						* { box-sizing: border-box; }
						body { margin: 0; }
						.round__app {
							display: grid;
							grid-template-columns: 100%;
							grid-template-rows: auto 30px 20px auto auto 20px 30px auto auto auto auto 0;
							grid-template-areas: 'pocket-top' 'user-top' 'mat-top' 'board'
								'expi-bot' 'mat-bot' 'user-bot' 'pocket-bot' 'controls' 'moves' 'voice' 'kb-move';
						}
						.round__app__board { grid-area: board; height: ${boardHeight}px; }
						.ruser-bottom { grid-area: user-bot; }
						.rclock-top {
							grid-area: 2 / 1 / 4 / 2;
							display: flex;
							justify-self: end;
						}
						i5d { grid-area: moves; min-height: 40px; }
						@media (min-width: 800px) {
							.round__app {
								grid-template-columns: 50% 50%;
								grid-template-rows: auto;
								grid-template-areas: 'board moves';
							}
							.ruser-bottom, .rclock-top { display: none; }
						}
					</style><link rel="stylesheet" href="/styles.css"></head>
					<body><main class="round"><div class="round__app">
						<div class="round__app__board"></div>
						<div class="rclock rclock-top"><div class="time">03:00</div></div>
						<div class="ruser-bottom">Player</div>
						<i5d><button>Previous</button><button>Next</button></i5d>
					</div></main></body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#round-row-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(
					doc.querySelector('link')?.sheet?.cssRules.length || 0
				).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);
				const app = doc.querySelector('.round__app');
				const rows = win
					.getComputedStyle(app)
					.gridTemplateRows.split(' ')
					.map(parseFloat);
				expect(rows[width < 800 ? 3 : 0]).to.equal(boardHeight);
				const board = doc
					.querySelector('.round__app__board')
					.getBoundingClientRect();
				const moves = doc.querySelector('i5d').getBoundingClientRect();
				if (width < 800) {
					expect(moves.top).to.be.at.least(board.bottom);
					expect(
						doc
							.querySelector('.rclock-top .time')
							.getBoundingClientRect().bottom
					).to.be.at.most(board.top);
				} else {
					expect(moves.left).to.be.at.least(board.right);
				}
			});
		});
	});
});

describe('Test navigation', () => {
	beforeEach(cy.startup);

	it('Test tabs', () => {
		cy.get('#siteTab').should('have.class', 'active');
		cy.get('#boardTab').should('not.have.class', 'active');
		cy.get('#siteColorGroup').should('be.visible');
		cy.get('#boardColorGroup').should('not.be.visible');

		cy.get('#boardTab').click();
		cy.get('#siteTab').should('not.have.class', 'active');
		cy.get('#boardTab').should('have.class', 'active');
		cy.get('#siteColorGroup').should('not.be.visible');
		cy.get('#boardColorGroup').should('be.visible');

		cy.get('#siteTab').click();
		cy.get('#siteTab').should('have.class', 'active');
		cy.get('#boardTab').should('not.have.class', 'active');
		cy.get('#siteColorGroup').should('be.visible');
		cy.get('#boardColorGroup').should('not.be.visible');
	});
	it('Test color pickrs for tab change', () => {
		cy.get('.pickr').eq(2).should('be.visible');
		cy.get('.pickr').eq(2).changeColor('#6DD397');
		cy.get('.pickr').last().should('not.be.visible');

		cy.get('#boardTab').click();
		cy.get('.pickr').last().should('be.visible');
		cy.get('.pickr').last().changeColor('#357391');
		cy.get('.pickr').eq(2).should('not.be.visible');

		cy.get('#siteTab').click();
		cy.get('.pickr').eq(2).shouldHaveColor('#6DD397');

		cy.get('#boardTab').click();
		cy.get('.pickr').last().shouldHaveColor('#357391');
	});
	it('Test options for both tabs', () => {
		cy.get('#resetButton').should('be.visible');
		cy.get('#importButton').should('be.visible');
		cy.get('#exportButton').should('be.visible');

		cy.get('#boardTab').click();
		cy.get('#resetButton').should('be.visible');
		cy.get('#importButton').should('be.visible');
		cy.get('#exportButton').should('be.visible');
	});
});

describe('Test custom board colors', () => {
	beforeEach(cy.startup);

	it('Test pickrs after toggle', () => {
		cy.get('#boardTab').click();
		cy.get('#hideBoardColors').should('be.visible');
		cy.get('.customBoardGroup > .boardColorSelector').should('be.visible');

		cy.get('#hideBoardColors').click();
		cy.get('#hideBoardColors').should('be.visible');
		cy.get('.customBoardGroup > .boardColorSelector').should(
			'not.be.visible'
		);

		cy.get('#hideBoardColors').click();
		cy.get('#hideBoardColors').should('be.visible');
		cy.get('.customBoardGroup > .boardColorSelector').should('be.visible');
	});
	it('Test tab after toggle', () => {
		cy.get('#boardTab').click();

		for (let i = 0; i < 2; i++) {
			cy.get('#hideBoardColors').click();
			cy.get('#boardTab').should('have.class', 'active');
			cy.get('#siteTab').should('not.have.class', 'active');
		}
	});
	it('Test reset of custom board colors', () => {
		cy.get('#boardTab').click();
		cy.get('.pickr')
			.eq(8)
			.shouldHaveColor(Cypress.expose('darkSquareColor'));
		cy.get('.pickr')
			.eq(9)
			.shouldHaveColor(Cypress.expose('lightSquareColor'));
		cy.get('.pickr').eq(8).changeColor('#B406A6');
		cy.get('.pickr').eq(9).changeColor('#B406A6');
		cy.get('#hideBoardColors').click();
		cy.get('#hideBoardColors').click();
		cy.get('.pickr')
			.eq(8)
			.shouldHaveColor(Cypress.expose('darkSquareColor'));
		cy.get('.pickr')
			.eq(9)
			.shouldHaveColor(Cypress.expose('lightSquareColor'));
	});
});

describe('Test reset', () => {
	beforeEach(cy.startup);

	it('Test colors after reset', () => {
		cy.get('#resetButton').should('be.visible');
		cy.get('.pickr').changeColor('#000000', true);

		cy.get('#resetButton').click();

		for (let i = 0; i < NAMES.length; i++) {
			cy.get('.pickr').eq(i).shouldHaveColor(Cypress.expose(NAMES[i]));
		}
	});
	it('Test custom board colors after reset', () => {
		cy.get('#boardTab').click();
		cy.get('#hideBoardColors').click();

		cy.get('#hideBoardColors').should('be.visible');
		cy.get('.customBoardGroup > .boardColorSelector').should(
			'not.be.visible'
		);

		cy.get('#resetButton').click();
		cy.get('#boardTab').click();

		cy.get('#hideBoardColors').should('be.visible');
		cy.get('.customBoardGroup > .boardColorSelector').should('be.visible');
	});
});

describe('Test storage', () => {
	beforeEach(cy.startup);

	it('Test storage', () => {
		cy.get('#layoutSelect').select('lichess');
		cy.get('.pickr').changeColor('#000000', true);

		cy.reload();

		cy.get('#layoutSelect').should('have.value', 'lichess');

		cy.get('.pickr').shouldHaveColor('#000000');
	});
});

describe('Test import/export', () => {
	beforeEach(cy.startup);

	it('Test import', () => {
		const IMPORT_STRING = '{\n"primaryColor": "#18D329"\n}';
		cy.get('#basicImport').should('not.be.visible');
		cy.get('#importAction').should('not.be.visible');

		cy.inputFile(IMPORT_STRING);
		cy.get('.pickr').first().shouldHaveColor('#18D329');
	});
	it('Test export', () => {
		cy.get('.pickr').first().changeColor('#7918D3');
		cy.get('#exportButton').should('be.visible').click();

		cy.then(() => {
			cy.wait(1000).then(() => {
				cy.readFile('./cypress/downloads/prettierlichess_config.json')
					.its('primaryColor')
					.should('eq', '#7918D3');
				cy.readFile('./cypress/downloads/prettierlichess_config.json')
					.its('secondaryColor')
					.then((color) => {
						expect(color.toUpperCase()).to.eq(
							Cypress.expose('secondaryColor')
						);
					});
			});
		});
	});
	it('Test import with already set value', () => {
		const IMPORT_STRING =
			'{"primaryColor": "#18D329", "preMove": "#12345678"}';

		cy.get('.pickr').first().changeColor('#c513c2');
		cy.get('.pickr').eq(1).changeColor('#c513c2');

		cy.inputFile(IMPORT_STRING);

		cy.get('.pickr').first().shouldHaveColor('#18D329');
		cy.get('.pickr')
			.eq(1)
			.shouldHaveColor(Cypress.expose('secondaryColor'));
		cy.window().then((win) => {
			expect(win.localStorage.getItem('preMove')).to.eq('#12345678');
		});
	});
	it('Test empty export', () => {
		const stub = cy.stub();
		cy.on('window:alert', stub);
		cy.window().then((win) => win.chrome.storage.sync.clear());
		cy.get('#exportButton').click();

		cy.then(() => {
			expect(stub.getCall(0)).to.be.calledWith(
				'No custom colors have been set.'
			);
		});
	});
	it('Restores default colours for an empty object', () => {
		cy.get('.pickr').first().changeColor('#123456');
		cy.get('#basicImport').invoke('val', '{}');
		cy.get('#importAction').click({force: true});
		cy.get('.pickr')
			.first()
			.shouldHaveColor(Cypress.expose('primaryColor'));
	});
	it('Rejects invalid imports without changing settings or reloading', () => {
		let original;
		cy.window().then((win) => {
			win.localStorage.setItem('primaryColor', '#123456');
			win.localStorage.setItem('layoutPreference', 'lichess');
			win.localStorage.setItem('streamerMode', 'true');
			win.localStorage.setItem('defaultBoardSwitch', 'true');
			original = {...win.localStorage};
			cy.stub(win, 'alert').as('importError');
			cy.spy(win.chrome.storage.sync, 'get').as('read');
			cy.spy(win.chrome.storage.sync, 'set').as('save');
			cy.spy(win.chrome.storage.sync, 'clear').as('clear');
			cy.spy(win.chrome.tabs, 'query').as('reloadTabs');
			win.addEventListener('beforeunload', cy.stub().as('reloadPopup'));
		});
		const invalid = [
			'{',
			'null',
			'[]',
			'"#123456"',
			'42',
			'{"colors": {"primaryColor": "#18D329"}}',
			'{"primaryColour": "#18D329"}',
			'{"primaryColor": "#123"}',
			'{"primaryColor": "#1234"}',
			'{"primaryColor": "#12345g"}',
			'{"primaryColor": "#123456789"}',
			'{"primaryColor": ""}',
			'{"primaryColor": null}',
			'{"primaryColor": 123456}',
			'{"primaryColor": false}',
			'{"primaryColor": "#123456", "boardDark": "red"}',
		];
		invalid.forEach((input, index) => {
			cy.get('#basicImport').invoke('val', input);
			cy.get('#importAction').click({force: true});
			cy.get('@importError').should('have.callCount', index + 1);
			cy.window().then((win) => {
				expect({...win.localStorage}).to.deep.eq(original);
			});
		});
		cy.get('@importError').should(
			'have.been.calledWithMatch',
			'Invalid color scheme'
		);
		cy.get('@read').should('not.have.been.called');
		cy.get('@save').should('not.have.been.called');
		cy.get('@clear').should('not.have.been.called');
		cy.get('@reloadTabs').should('not.have.been.called');
		cy.get('@reloadPopup').should('not.have.been.called');
	});
	[false, true].forEach((nativeBoard) => {
		it(`Preserves preferences with native board ${nativeBoard}`, () => {
			const preferences = {
				layoutPreference: 'lichess',
				streamerMode: 'true',
				defaultBoardSwitch: String(nativeBoard),
				unrelatedPreference: '{"keep": true}',
			};
			cy.window().then((win) => {
				Object.entries(preferences).forEach(([key, value]) => {
					win.localStorage.setItem(key, value);
				});
			});
			cy.inputFile(
				JSON.stringify({
					primaryColor: '#18D329',
					boardDark: '#123456',
					boardLight: '#abcdef',
					layoutPreference: 'default',
					streamerMode: false,
					defaultBoardSwitch: !nativeBoard,
					unrelatedPreference: 'ignored',
				})
			);
			cy.get('#layoutSelect').should('have.value', 'lichess');
			cy.window().then((win) => {
				Object.entries(preferences).forEach(([key, value]) => {
					expect(win.localStorage.getItem(key)).to.eq(value);
				});
				expect(win.localStorage.getItem('boardDark')).to.eq(
					nativeBoard ? '#FFFFFF00' : '#123456'
				);
				expect(win.localStorage.getItem('boardLight')).to.eq(
					nativeBoard ? '#FFFFFF00' : '#abcdef'
				);
			});
			cy.get('#boardTab').click();
			cy.get('.customBoardGroup > .boardColorSelector').should(
				nativeBoard ? 'not.be.visible' : 'be.visible'
			);
		});
	});
	it('Waits for the storage read and write before reloading', () => {
		let finishRead;
		let finishWrite;
		let original;
		cy.window().then((win) => {
			const mock = win.chrome;
			original = {...win.localStorage};
			const set = mock.storage.sync.set.bind(mock.storage.sync);
			cy.stub(mock.storage.sync, 'get').callsFake((key, callback) => {
				finishRead = () => callback({defaultBoardSwitch: false});
			});
			cy.stub(mock.storage.sync, 'set')
				.callsFake((colors, callback) => {
					finishWrite = () => set(colors, callback);
				})
				.as('save');
			cy.spy(mock.tabs, 'query').as('reloadTabs');
			const reloadPopup = cy.stub().as('reloadPopup');
			win.addEventListener('beforeunload', () => {
				expect(win.localStorage.getItem('primaryColor')).to.eq(
					'#18D329'
				);
				reloadPopup();
			});
		});
		cy.get('#basicImport').invoke('val', '{"primaryColor": "#18D329"}');
		cy.get('#importAction').click({force: true});
		cy.get('@save').should('not.have.been.called');
		cy.get('@reloadTabs').should('not.have.been.called');
		cy.get('@reloadPopup').should('not.have.been.called');
		cy.then(() => finishRead());
		cy.get('@save').should('have.been.calledOnce');
		cy.window().then((win) => {
			expect({...win.localStorage}).to.deep.eq(original);
		});
		cy.get('@reloadTabs').should('not.have.been.called');
		cy.get('@reloadPopup').should('not.have.been.called');
		cy.then(() => finishWrite());
		cy.get('.pickr').first().shouldHaveColor('#18D329');
		cy.get('@reloadTabs').should('have.been.calledOnce');
		cy.get('@reloadPopup').should('have.been.calledOnce');
	});
	['get', 'set'].forEach((operation) => {
		it(`Reports storage ${operation} errors without reloading`, () => {
			let original;
			cy.window().then((win) => {
				const mock = win.chrome;
				original = {...win.localStorage};
				cy.stub(win, 'alert').as('importError');
				cy.spy(mock.storage.sync, 'clear').as('clear');
				cy.spy(mock.tabs, 'query').as('reloadTabs');
				win.addEventListener(
					'beforeunload',
					cy.stub().as('reloadPopup')
				);
				cy.stub(mock.storage.sync, operation).callsFake(
					(value, callback) => {
						win.setTimeout(() => {
							mock.runtime.lastError = {message: 'Storage error'};
							try {
								callback();
							} finally {
								delete mock.runtime.lastError;
							}
						}, 0);
					}
				);
			});
			cy.get('#basicImport').invoke('val', '{"primaryColor": "#18D329"}');
			cy.get('#importAction').click({force: true});
			cy.get('@importError').should(
				'have.been.calledWithMatch',
				operation === 'get'
					? 'Could not read your settings'
					: 'Could not save the color scheme'
			);
			cy.window().then((win) => {
				expect({...win.localStorage}).to.deep.eq(original);
			});
			cy.get('@clear').should('not.have.been.called');
			cy.get('@reloadTabs').should('not.have.been.called');
			cy.get('@reloadPopup').should('not.have.been.called');
		});
	});
	it('Does nothing when file selection is cancelled', () => {
		cy.window().then((win) => {
			cy.spy(win, 'FileReader').as('reader');
			cy.stub(win, 'alert').as('importError');
		});
		cy.get('#fileSelector').trigger('change', {force: true});
		cy.get('@reader').should('not.have.been.called');
		cy.get('@importError').should('not.have.been.called');
	});
	['error', 'abort', 'throw'].forEach((failure) => {
		it(`Reports file read ${failure} without changing settings`, () => {
			let original;
			cy.window().then((win) => {
				original = {...win.localStorage};
				cy.stub(win, 'alert').as('importError');
				cy.stub(win.FileReader.prototype, 'readAsText').callsFake(
					function () {
						if (failure === 'throw') {
							throw new Error('File read failed');
						}
						this.dispatchEvent(new win.ProgressEvent(failure));
					}
				);
			});
			cy.get('#fileSelector').selectFile(
				{
					contents: Cypress.Buffer.from(
						'{"primaryColor": "#18D329"}'
					),
					fileName: 'colors.json',
					mimeType: 'application/json',
				},
				{force: true}
			);
			cy.get('@importError').should(
				'have.been.calledWithMatch',
				'Could not read the color scheme file'
			);
			cy.window().then((win) => {
				expect({...win.localStorage}).to.deep.eq(original);
			});
			cy.get('#fileSelector').should('have.value', '');
		});
	});
});
