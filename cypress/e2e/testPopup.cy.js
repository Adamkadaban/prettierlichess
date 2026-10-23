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
						'<div class="is2d"><div class="main-board"><div class="cg-wrap orientation-white">' +
						'<coords class="files" style="---cg-ccb: #123456; ---cg-ccw: #abcdef">' +
						'<coord></coord><coord></coord></coords><cg-resize></cg-resize></div></div></div>';
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
					expect(
						win.getComputedStyle(resize, '::before').backgroundColor
					).to.equal(win.getComputedStyle(resize).color);
					expect(colors()).to.deep.equal([
						'rgb(255, 255, 255)',
						'rgb(255, 255, 255)',
					]);
					page.querySelector('.is3d').className = 'is2d';
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

describe('Test native 3D board artwork', () => {
	it('Preserves the 3D face while keeping 2D mini-board colors', () => {
		cy.startup();
		const build =
			Cypress.browser.name === 'firefox' ? 'dist-firefox' : 'dist-chrome';
		cy.readFile(`${build}/styles.css`).then((styles) => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				doc.body.appendChild(frame);
				const win = frame.contentWindow;
				const page = win.document;
				page.body.innerHTML =
					'<div class="is3d"><div class="main-board"><cg-container><cg-board>' +
					'<square class="last-move"></square></cg-board></cg-container></div>' +
					'<div class="is2d mini-board"><cg-container><cg-board></cg-board></cg-container></div></div>';
				const style = page.createElement('style');
				style.textContent =
					'.main-board cg-board::before { content: ""; background-image: linear-gradient(#aaa, #333); }' +
					styles;
				page.head.appendChild(style);
				const board = page.querySelector('.main-board cg-board');
				const mini = page.querySelector('.mini-board cg-board');
				const art = win.getComputedStyle(
					board,
					'::before'
				).backgroundImage;
				expect(art).to.contain('linear-gradient');
				expect(win.getComputedStyle(board, '::after').display).to.equal(
					'none'
				);
				expect(
					win.getComputedStyle(mini, '::after').display
				).not.to.equal('none');
				expect(
					win.getComputedStyle(mini, '::after').backgroundImage
				).to.contain('repeating-conic-gradient');
				expect(
					win.getComputedStyle(board.querySelector('square'))
						.backgroundColor
				).not.to.equal('rgba(0, 0, 0, 0)');
				page.querySelector('.is3d').className = 'is2d';
				expect(
					win.getComputedStyle(board, '::after').display
				).not.to.equal('none');
				expect(
					win.getComputedStyle(board, '::after').backgroundImage
				).to.contain('repeating-conic-gradient');
				expect(
					win.getComputedStyle(board, '::before').backgroundImage
				).to.equal(art);
				frame.remove();
			});
		});
	});
});

describe('Test native 3D mobile geometry fixtures', () => {
	beforeEach(cy.startup);

	[
		{kind: 'analysis', mode: '3d', width: 390, height: 844},
		{kind: 'analysis', mode: '3d', width: 740, height: 390},
		{kind: 'analysis', mode: '3d', width: 799, height: 900},
		{kind: 'round', mode: '3d', width: 390, height: 844},
		{
			kind: 'round',
			mode: '3d',
			width: 740,
			height: 390,
			headerHeight: 40,
		},
		{kind: 'relay', mode: '3d', width: 390, height: 844},
		{kind: 'relay', mode: '3d', width: 740, height: 390},
		{kind: 'analysis', mode: '3d', width: 800, height: 900},
		{kind: 'analysis', mode: '3d', width: 1440, height: 900},
		{kind: 'analysis', mode: '2d', width: 390, height: 844},
		{kind: 'round', mode: '2d', width: 390, height: 844},
		{
			kind: 'round',
			mode: '2d',
			width: 740,
			height: 390,
			headerHeight: 40,
		},
		{kind: 'relay', mode: '2d', width: 390, height: 844},
		{kind: 'analysis', mode: '2d', width: 1440, height: 900},
		{kind: 'study', mode: '2d', width: 390, height: 844},
		{kind: 'study', mode: '3d', width: 390, height: 844},
		{kind: 'puzzle', mode: '2d', width: 740, height: 900, gutter: 10},
		{
			kind: 'study',
			mode: '2d',
			width: 740,
			height: 900,
			gutter: 10,
			orientation: 'black',
		},
		{kind: 'tv', mode: '2d', width: 740, height: 900, gutter: 10},
	].forEach((testCase) => {
		const {
			kind,
			mode,
			width,
			height,
			headerHeight = 60,
			gutter = 0,
			orientation = 'white',
		} = testCase;
		it(`Preserves ${mode} ${kind} geometry at ${width}x${height}`, () => {
			const round = kind === 'round' || kind === 'tv';
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'native-3d-geometry-fixture';
				frame.style.cssText =
					`width: ${width}px; height: ${height}px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				const board = `<div class="main-board ${
					round
						? 'round__app__board'
						: kind === 'puzzle'
						? 'puzzle__board'
						: 'analyse__board'
				}">${
					kind === 'study'
						? `<div class="study__player study__player-top"><div class="left"><span class="info"><span class="name">${
								orientation === 'white' ? 'Black' : 'White'
						  }</span></span></div></div>`
						: ''
				}<div class="cg-wrap orientation-${orientation}"><cg-container><cg-board>
					<piece class="black king"></piece>
				</cg-board>${
					gutter
						? ['ranks', 'files']
								.map(
									(axis) =>
										`<coords class="${axis} ${orientation}">${Array.from(
											axis === 'ranks'
												? '12345678'
												: 'abcdefgh',
											(label) => `<coord>${label}</coord>`
										).join('')}</coords>`
								)
								.join('')
						: ''
				}</cg-container></div>${
					kind === 'study'
						? `<div class="study__player study__player-bot"><div class="left"><span class="info"><span class="name">${
								orientation === 'white' ? 'White' : 'Black'
						  }</span></span></div></div>`
						: ''
				}</div>`;
				frame.srcdoc = `<!doctype html><html><head><style>
					*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
					${gutter ? 'html { overflow-y: hidden; }' : ''}
					body {
						width: calc(100% - ${gutter}px);
						---site-header-height: ${headerHeight}px;
						---block-gap: 10px;
						---col2-uniboard-width: min(calc(100vw - 280px), 696px);
						---col3-uniboard-width: 696px;
					}
					#top { position: sticky; top: 0; height: var(---site-header-height); z-index: 106; }
					#main-wrap { display: grid; grid-template-areas: 'main'; margin-top: .5vmin; }
					main { grid-area: main; }
					.analyse, .puzzle {
						display: grid;
						grid-template-columns: 100%;
						grid-template-areas: 'board' 'controls' 'tools' 'side';
					}
					.main-board {
						grid-area: board; position: relative; display: block;
						width: 100%; height: 0; padding-bottom: 100%;
					}
					.cg-wrap { box-sizing: content-box; display: block; position: relative; }
					.main-board .cg-wrap { position: absolute; width: 100%; height: 100%; }
					cg-container, cg-board { position: absolute; display: block; top: 0; right: 0; width: 100%; height: 100%; }
					cg-board { left: 0; }
					coords { display: flex; position: absolute; pointer-events: none; }
					coords coord { flex: auto; }
					coords.ranks { flex-flow: column-reverse; width: .8em; height: 100%; top: 1px; right: 0; }
					coords.ranks.black { flex-flow: column; }
					coords.files { flex-flow: row; width: 100%; height: 1.4em; bottom: 0; left: 0; }
					coords.files.black { flex-flow: row-reverse; }
					coords.files coord { padding-left: 4px; }
					piece { position: absolute; width: 12.5%; height: 12.5%; top: 0; left: 0; z-index: 2; }
					.is3d .main-board { padding-bottom: calc(100% * 476 / 512); }
					.is3d .main-board .cg-wrap { height: calc(100% * 464.5 / 476); }
					.is3d piece { width: 16.741%; height: 23.563%; left: -1.85%; top: -9.1%; }
					.is3d .main-board, .is3d .eval-gauge { margin-top: calc(var(---cg-height) * 2 / 100); }
					.eval-gauge { display: none; grid-area: gauge; height: var(---cg-height); }
					.analyse__controls { grid-area: controls; height: 40px; }
					.analyse__tools { grid-area: tools; }
					.analyse__side { grid-area: side; }
					.study__player {
						position: absolute; right: 0; display: flex; align-items: center;
						width: var(---cg-width, 100%); height: 1.6rem; white-space: nowrap;
					}
					.study__player-top { top: -1.6rem; }
					.is3d .study__player-top { top: calc(-1.6rem - var(---cg-width) / 20); }
					.study__player-bot { top: var(---cg-height, 100%); }
					@media (max-width: 799px) and (orientation: portrait) {
						.analyse.has-players .analyse__controls { margin-top: 1.6rem; }
					}
					main.round { display: grid; grid-template-areas: 'app'; }
					.round__app {
						grid-area: app; display: grid; grid-template-columns: 100%;
						grid-template-rows: auto 30px 20px auto auto 20px 30px auto auto auto auto 0;
						grid-template-areas: 'pocket-top' 'user-top' 'mat-top' 'board'
							'expi-bot' 'mat-bot' 'user-bot' 'pocket-bot' 'controls' 'moves' 'voice' 'kb-move';
					}
					.ruser-top { grid-area: user-top; }
					.ruser-bottom { grid-area: user-bot; }
					.rclock-top { grid-area: 2 / 1 / 4 / 2; justify-self: end; }
					.rclock-bottom { grid-area: 6 / 1 / 8 / 2; justify-self: end; }
					i5d { display: block; grid-area: moves; }
					bo3 { display: flex; }
					bo3 button { flex: 1; min-height: 32px; }
					@media (min-width: 800px), (orientation: landscape) {
						.analyse {
							grid-template-columns: var(---col2-uniboard-width) 10px minmax(240px, 400px);
							grid-template-areas: 'board gauge tools' 'under . controls' 'under . side';
						}
						.analyse .eval-gauge { display: block; }
						main.round {
							grid-template-columns: 1fr 1fr;
							grid-template-areas: 'app app';
						}
						.round__app {
							justify-self: center;
							grid-template-columns: var(---col2-uniboard-width) 240px;
							column-gap: var(---block-gap);
							grid-template-rows: minmax(0, 1fr) 0 repeat(10, auto) minmax(0, 1fr);
							grid-template-areas:
								'board voice' 'board .' 'board mat-top' 'board clock-top'
								'board expi-top' 'board user-top' 'board moves' 'board controls'
								'board user-bot' 'board expi-bot' 'board clock-bot' 'board mat-bot'
								'board .' 'kb-move .';
						}
						.rclock-top { grid-area: clock-top; justify-self: start; }
						.rclock-bottom { grid-area: clock-bot; justify-self: start; }
					}
					@media (max-width: 799px) and (orientation: landscape) {
						.analyse {
							grid-template-columns:
								minmax(55vmin, calc(100vh - var(---site-header-height) - var(---block-gap)))
								10px minmax(200px, 240px);
						}
						.round__app {
							grid-template-columns:
								minmax(55vmin, calc(100vh - var(---site-header-height) - var(---block-gap)))
								minmax(200px, 240px);
						}
					}
					@media (min-width: 1261px) {
						.analyse { grid-template-areas: 'side . board gauge tools' 'side . under . controls'; }
					}
				</style><link rel="stylesheet" href="/styles.css"><style>
					@font-face { font-family: 'Red Hat Text'; src: url('/fonts/RedHatText-Regular.ttf'); }
					@font-face { font-family: 'Red Hat Display'; src: url('/fonts/RedHatDisplay-Regular.ttf'); }
				</style></head><body class="coords-in">
					<header id="top">Lichess</header>
					<div id="main-wrap" class="is${mode}">
						<main class="${
							round
								? `round${kind === 'tv' ? ' tv-single' : ''}`
								: kind === 'puzzle'
								? 'puzzle puzzle-play'
								: `analyse${
										kind === 'relay'
											? ' is-relay'
											: kind === 'study'
											? ' has-players'
											: ''
								  }`
						}">
							${
								round
									? `<div class="round__app">${board}
										<div class="ruser ruser-top">White</div>
										<div class="rclock rclock-top"><div class="time">03:00</div></div>
										<div class="ruser ruser-bottom">Black</div>
										<div class="rclock rclock-bottom"><div class="time">02:59</div></div>
										<i5d><bo3><button>Previous</button><button>Next</button></bo3></i5d>
									</div>`
									: `${board}${
											kind === 'relay' || width >= 800
												? '<div class="eval-gauge"></div>'
												: ''
									  }
										<div class="analyse__controls">Move controls</div>
										<div class="analyse__tools"></div><aside class="analyse__side"></aside>`
							}
						</main>
					</div>
				</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#native-3d-geometry-fixture')
				.should(($frame) => {
					expect(
						$frame[0].contentDocument.querySelector('link')?.sheet
							?.cssRules.length || 0,
						'loaded built stylesheet'
					).to.be.greaterThan(0);
				})
				.then(async ($frame) => {
					const doc = $frame[0].contentDocument;
					const win = $frame[0].contentWindow;
					await doc.fonts.ready;
					// Chessground updateBounds rounds container width, preserving the wrap ratio.
					const wrap = doc
						.querySelector('.cg-wrap')
						.getBoundingClientRect();
					const boardWidth =
						(Math.floor((wrap.width * win.devicePixelRatio) / 8) *
							8) /
						win.devicePixelRatio;
					const boardHeight = boardWidth * (wrap.height / wrap.width);
					const container = doc.querySelector('cg-container');
					container.style.width = `${boardWidth}px`;
					container.style.height = `${boardHeight}px`;
					const main = doc.querySelector('main');
					main.style.setProperty('---cg-width', `${boardWidth}px`);
					main.style.setProperty('---cg-height', `${boardHeight}px`);
				})
				.should(($frame) => {
					const doc = $frame[0].contentDocument;
					const win = $frame[0].contentWindow;
					expect(win.innerWidth).to.equal(width);
					expect(win.innerHeight).to.equal(height);
					const outer = doc.querySelector('.main-board');
					const outerRect = outer.getBoundingClientRect();
					const board = doc
						.querySelector('cg-board')
						.getBoundingClientRect();
					const piece = doc
						.querySelector('piece')
						.getBoundingClientRect();
					const header = doc
						.getElementById('top')
						.getBoundingClientRect();
					const available = doc
						.getElementById('main-wrap')
						.getBoundingClientRect();
					if (kind === 'study') {
						const main = doc
							.querySelector('main')
							.getBoundingClientRect();
						const top = doc
							.querySelector('.study__player-top')
							.getBoundingClientRect();
						const bottom = doc
							.querySelector('.study__player-bot')
							.getBoundingClientRect();
						expect(
							top.top,
							'upper player strip clears clipping main'
						).to.be.at.least(main.top - 0.1);
						expect(top.top).to.be.at.least(header.bottom);
						expect(
							top.bottom,
							'upper strip stays off squares'
						).to.be.at.most(board.top);
						expect(
							bottom.top,
							'lower strip stays off squares'
						).to.be.at.least(board.bottom);
						if (mode === '3d') {
							expect(
								top.bottom,
								'upper strip clears 3D piece bounds'
							).to.be.at.most(piece.top + 0.1);
						}
						for (const player of doc.querySelectorAll(
							'.study__player'
						)) {
							const rect = player.getBoundingClientRect();
							expect(
								rect.left,
								'player strip clears left clipping edge'
							).to.be.at.least(
								Math.max(main.left, available.left)
							);
							expect(
								rect.right,
								'player strip clears right clipping edge'
							).to.be.at.most(
								Math.min(main.right, available.right)
							);
							expect(
								player.contains(
									doc.elementFromPoint(
										rect.left + rect.width / 2,
										rect.top + rect.height / 2
									)
								),
								'player strip is visible and unobstructed'
							).to.equal(true);
						}
					}
					expect(
						board.height / board.width,
						'native board ratio'
					).to.be.closeTo(mode === '3d' ? 464.5 / 512 : 1, 0.0001);
					if (mode === '3d') {
						expect(
							outerRect.height / outerRect.width,
							'native outer ratio'
						).to.be.closeTo(476 / 512, 0.0001);
						expect(outerRect.left).to.be.at.least(0);
						expect(outerRect.right).to.be.at.most(width);
					} else if (width < 800 && kind !== 'relay') {
						expect(
							doc.querySelector('main').getBoundingClientRect()
								.right,
							'2D main fits available content'
						).to.be.at.most(available.right);
						expect(
							outerRect.right,
							'2D board fits available content'
						).to.be.at.most(available.right);
						expect(outerRect.left).to.be.at.least(available.left);
						expect(
							outerRect.height,
							'square 2D wrapper'
						).to.be.closeTo(outerRect.width, 0.1);
						expect(win.getComputedStyle(outer).marginLeft).to.equal(
							'0px'
						);
					} else if (
						mode === '2d' &&
						kind === 'relay' &&
						width < 800
					) {
						expect(
							outerRect.width,
							'existing relay sizing'
						).to.equal(width);
						expect(win.getComputedStyle(outer).marginLeft).to.equal(
							'-10px'
						);
					}
					if (gutter) {
						expect(
							available.width,
							'reserved scrollbar width'
						).to.equal(width - gutter);
						const ranks = [
							...doc.querySelectorAll('coords.ranks coord'),
						];
						const files = [
							...doc.querySelectorAll('coords.files coord'),
						];
						expect(
							ranks.map((coord) => coord.textContent).join('')
						).to.equal('12345678');
						expect(
							files.map((coord) => coord.textContent).join('')
						).to.equal('abcdefgh');
						for (const coord of [...ranks, ...files]) {
							const range = doc.createRange();
							range.selectNodeContents(coord);
							const rect = range.getBoundingClientRect();
							expect(
								rect.width,
								`visible ${coord.textContent}`
							).to.be.greaterThan(0);
							expect(rect.left).to.be.at.least(board.left);
							expect(
								rect.right,
								`contained ${coord.textContent}`
							).to.be.at.most(available.right);
							expect(rect.top).to.be.at.least(board.top);
							expect(rect.bottom).to.be.at.most(
								board.bottom + 0.1
							);
						}
						expect(
							ranks[0].getBoundingClientRect().top <
								ranks[7].getBoundingClientRect().top
						).to.equal(orientation === 'black');
						expect(
							files[0].getBoundingClientRect().left <
								files[7].getBoundingClientRect().left
						).to.equal(orientation === 'white');
					}
					if (
						mode === '3d' &&
						width < 800 &&
						(!round || width > height)
					) {
						expect(
							piece.top,
							'3D piece clears sticky header'
						).to.be.at.least(header.bottom);
						expect(
							piece.top,
							'3D piece clears clipping main'
						).to.be.at.least(
							doc.querySelector('main').getBoundingClientRect()
								.top - 0.1
						);
					} else {
						expect(
							parseFloat(win.getComputedStyle(outer).marginTop),
							'unchanged native margin'
						).to.be.closeTo(
							mode === '3d' ? board.height * 0.02 : 0,
							0.1
						);
					}
					const gauge = doc.querySelector('.eval-gauge');
					if (
						gauge &&
						win.getComputedStyle(gauge).display !== 'none'
					) {
						expect(
							gauge.getBoundingClientRect().top,
							'gauge aligns with board'
						).to.be.closeTo(board.top, 0.1);
					}
					if (width === 1440)
						expect(board.width, 'desktop board size').to.equal(696);
					if (round) {
						if (width > height) {
							expect(
								outerRect.width,
								'native landscape track'
							).to.be.closeTo(height - headerHeight - 10, 0.1);
							expect(outerRect.bottom).to.be.at.most(height);
							expect(
								win.getComputedStyle(outer).marginLeft
							).to.equal('0px');
							for (const element of doc.querySelectorAll(
								'.ruser, .rclock, bo3'
							)) {
								const rect = element.getBoundingClientRect();
								expect(
									rect.left,
									'controls beside board'
								).to.be.at.least(board.right);
								expect(rect.right).to.be.at.most(width);
								expect(
									rect.top,
									'controls below header'
								).to.be.at.least(header.bottom);
								expect(
									rect.bottom,
									'controls inside viewport'
								).to.be.at.most(height);
							}
						} else {
							for (const selector of [
								'.ruser-top',
								'.rclock-top',
							]) {
								expect(
									doc
										.querySelector(selector)
										.getBoundingClientRect().bottom
								).to.be.at.most(outerRect.top + 0.1);
							}
							for (const selector of [
								'.ruser-bottom',
								'.rclock-bottom',
								'bo3',
							]) {
								expect(
									doc
										.querySelector(selector)
										.getBoundingClientRect().top
								).to.be.at.least(outerRect.bottom - 0.1);
							}
						}
						for (const button of doc.querySelectorAll(
							'bo3 button'
						)) {
							const rect = button.getBoundingClientRect();
							expect(
								button.contains(
									doc.elementFromPoint(
										rect.left + rect.width / 2,
										rect.top + rect.height / 2
									)
								),
								'unobstructed replay control'
							).to.equal(true);
						}
					}
				});
		});
	});
});

describe('Test account menu open-state fixtures', () => {
	beforeEach(cy.startup);

	[
		{width: 1440, account: true},
		{width: 390, account: true},
		{width: 1440, account: false},
	].forEach(({width, account}) => {
		it(`Keeps the ${
			account ? 'account' : 'preferences'
		} toggle stable at ${width}px`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'account-menu-fixture';
				frame.style.cssText = `width: ${width}px; height: 400px; border: 0; max-width: none;`;
				frame.srcdoc = `<!doctype html><html><head><style>
					* { box-sizing: border-box; }
					body { margin: 0; }
					#top { height: 60px; display: flex; justify-content: flex-end; }
					.site-buttons { display: flex; align-items: center; position: relative; }
					.dasher { display: flex; align-items: center; }
					.toggle { height: 60px; line-height: 60px; padding: 0 .7rem; border: 0; background: transparent; }
					#user_tag { max-width: 36vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
					#user_tag::after { content: 'O'; font-size: 2rem; margin-left: .5rem; color: #aaa; }
					.dropdown { display: none; position: absolute; top: 60px; right: 0; width: 225px; height: 100px; background: #444; }
					.shown .toggle { background: #444; color: #fff; }
					.shown .dropdown { display: block; }
				</style><link rel="stylesheet" href="/styles.css"></head><body>
					<header id="top"><span class="accent" style="color: var(--primaryColor)"></span>
						<div class="site-buttons">
							<div class="notify shown"><button class="toggle link">Notifications</button></div>
							<div class="dasher"><button ${
								account
									? 'id="user_tag"'
									: 'aria-label="Preferences"'
							} class="toggle link">${
								account ? 'ExamplePlayer' : 'Settings'
							}</button>
								<div id="dasher_app" class="dropdown">Menu</div></div>
						</div>
					</header>
				</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#account-menu-fixture')
				.should(($frame) => {
					expect(
						$frame[0].contentDocument.querySelector('link')?.sheet
							?.cssRules.length || 0
					).to.be.greaterThan(0);
				})
				.then(($frame) => {
					const doc = $frame[0].contentDocument;
					const win = $frame[0].contentWindow;
					const dasher = doc.querySelector('.dasher');
					const button = dasher.querySelector('.toggle');
					const bounds = () => {
						const r = button.getBoundingClientRect();
						return [r.x, r.y, r.width, r.height];
					};
					const closed = bounds();
					const notification = win.getComputedStyle(
						doc.querySelector('.notify .toggle')
					).backgroundColor;
					dasher.classList.add('shown');
					const accent = win.getComputedStyle(
						doc.querySelector('.accent')
					).color;
					expect(
						win.getComputedStyle(button).backgroundColor
					).to.equal('rgba(0, 0, 0, 0)');
					expect(win.getComputedStyle(button).color).to.equal(accent);
					if (account)
						expect(
							win.getComputedStyle(button, '::after').color
						).to.equal(accent);
					expect(
						bounds(),
						'open state does not move or resize the control'
					).to.deep.equal(closed);
					expect(
						win.getComputedStyle(doc.querySelector('.dropdown'))
							.display
					).to.equal('block');
					expect(
						win.getComputedStyle(
							doc.querySelector('.notify .toggle')
						).backgroundColor
					).to.equal(notification);
					dasher.classList.remove('shown');
					expect(bounds()).to.deep.equal(closed);
					expect(
						win.getComputedStyle(doc.querySelector('.dropdown'))
							.display
					).to.equal('none');
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

describe('Test Insights containment fixtures', () => {
	beforeEach(cy.startup);

	const mount = ({width, padding, id = 'insight'}) => {
		cy.document().then((doc) => {
			const mainWidth = width === 1440 ? 968 : width;
			const frame = doc.createElement('iframe');
			frame.id = 'insights-containment-fixture';
			frame.style.cssText =
				`width: ${width}px; height: 900px; border: 0; ` +
				'max-width: none; flex-shrink: 0;';
			// Model view.ts widthStyle(mainW()) and the existing scroll wrappers.
			// Static canvas dimensions model native output, not Chart.js resizing.
			const content = `
				<header style="width: ${mainWidth}px">Chess Insights</header>
				<div class="insight__main box" style="width: ${mainWidth}px">
					<canvas class="chart" width="${mainWidth - 4}" height="600"
						style="display: block; width: ${mainWidth - 4}px; height: 600px"></canvas>
					<div class="hscroll" style="width: ${mainWidth}px">
						<table><thead><tr><th>Variant</th><th>Accuracy</th><th>Number of moves</th></tr></thead>
							<tbody><tr><td>${'UltraBullet analysis '.repeat(
								24
							)}</td><td>48.2%</td><td>10,472</td></tr>
							<tr><td>Blitz</td><td>76.1%</td><td>87,181</td></tr></tbody></table>
					</div>
					<div class="game-sample box hscroll" style="width: ${mainWidth}px">
						<div class="boards">${Array.from(
							{length: 8},
							(_, index) =>
								`<a href="#game-${index}">Sample game ${
									index + 1
								}</a>`
						).join('')}</div>
					</div>
				</div>`;
			frame.srcdoc = `<!doctype html>
				<html><head>
					<style>
						* { box-sizing: border-box; }
						body { margin: 0; }
						.ready { display: block; }
						header { height: 60px; padding: 0 1vw; }
						.insight__main { border: 1px solid; border-top: 0; }
						.hscroll { overflow: auto; white-space: nowrap; }
						table { border-collapse: collapse; }
						th, td { padding: 8px; }
						.boards { display: flex; width: max-content; }
						.boards a { display: block; width: 200px; padding: 8px; }
						@media (min-width: 800px) { .ready { display: flex; } }
					</style>
					<link rel="stylesheet" href="/styles.css">
					<style>
						#main-wrap main.fixture { padding: 0 ${padding}px !important; }
					</style>
				</head><body>
					<div id="main-wrap"><main id="${id}" class="fixture">
						<div class="ready">${
							width === 1440
								? `<aside style="width: 280px"></aside><span style="width: 26px"></span><div style="width: ${mainWidth}px">${content}</div>`
								: content
						}</div>
					</main></div>
				</body></html>`;
			doc.body.appendChild(frame);
		});
		return cy.get('#insights-containment-fixture').should(($frame) => {
			const frame = $frame[0];
			const link = frame.contentDocument.querySelector('link');
			expect(
				link?.sheet?.cssRules.length,
				'loaded built stylesheet'
			).to.be.greaterThan(0);
			expect(frame.contentWindow.innerWidth).to.equal(width);
		});
	};

	const assertContained = (element, win) => {
		const parent = element.parentElement;
		const style = win.getComputedStyle(parent);
		const left =
			parent.getBoundingClientRect().left +
			parent.clientLeft +
			parseFloat(style.paddingLeft);
		const right =
			left +
			parent.clientWidth -
			parseFloat(style.paddingLeft) -
			parseFloat(style.paddingRight);
		const bounds = element.getBoundingClientRect();
		expect(
			bounds.left,
			`${element.tagName}.${element.className} left bound`
		).to.be.at.least(left - 1);
		expect(
			bounds.right,
			`${element.tagName}.${element.className} right bound`
		).to.be.at.most(right + 1);
	};

	const assertScrollable = (wrapper, win) => {
		expect(win.getComputedStyle(wrapper).overflowX).to.equal('auto');
		const maximum = wrapper.scrollWidth - wrapper.clientWidth;
		expect(
			maximum,
			'intrinsic content needs horizontal scrolling'
		).to.be.greaterThan(0);
		const contents = wrapper.textContent;
		wrapper.scrollLeft = maximum;
		expect(
			wrapper.scrollLeft,
			'can reach horizontal scroll end'
		).to.be.closeTo(maximum, 1);
		const last = wrapper.querySelector(
			'tr:last-child td:last-child, .boards a:last-child'
		);
		const right =
			wrapper.getBoundingClientRect().left +
			wrapper.clientLeft +
			wrapper.clientWidth;
		expect(
			last.getBoundingClientRect().right,
			'last data is reachable'
		).to.be.at.most(right + 1);
		expect(last.getBoundingClientRect().right).to.be.greaterThan(
			wrapper.getBoundingClientRect().left
		);
		wrapper.scrollLeft = 0;
		expect(
			wrapper.scrollLeft,
			'can restore horizontal scroll start'
		).to.equal(0);
		expect(wrapper.textContent, 'data survives scrolling').to.equal(
			contents
		);
	};

	[
		{width: 390, padding: 8},
		{width: 390, padding: 23},
		{width: 1440, padding: 0},
	].forEach(({width, padding}) => {
		it(`Contains native inline widths at ${width}px with ${padding}px padding`, () => {
			mount({width, padding}).then(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				const main = doc.querySelector('#insight');
				const panel = main.querySelector('.insight__main');
				const header = main.querySelector('header');
				const canvas = panel.querySelector('canvas');
				const data = panel.textContent;
				const canvasBefore = canvas.getBoundingClientRect().toJSON();
				assertContained(header, win);
				assertContained(panel, win);
				Array.from(panel.children).forEach((child) =>
					assertContained(child, win)
				);
				panel
					.querySelectorAll('.hscroll')
					.forEach((wrapper) => assertScrollable(wrapper, win));
				expect(panel.textContent).to.equal(data);
				expect(panel.textContent)
					.to.include('48.2%')
					.and.include('87,181');
				expect(panel.querySelectorAll('.boards a')).to.have.length(8);
				expect(canvas.getBoundingClientRect().height).to.equal(
					canvas.height
				);
				if (width === 1440) {
					// An identical subtree outside Insights is the unconstrained control.
					main.id = 'outside-insight';
					expect(
						canvas.getBoundingClientRect().toJSON(),
						'desktop canvas unchanged'
					).to.deep.equal(canvasBefore);
					main.id = 'insight';
				}
			});
		});
	});

	it('Leaves inline widths outside Insights unchanged', () => {
		mount({width: 390, padding: 8, id: 'outside-insight'}).then(
			($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				const panel = doc.querySelector('.insight__main');
				const elements = [
					doc.querySelector('header'),
					panel,
					...panel.children,
				];
				for (const element of elements) {
					expect(
						element.getBoundingClientRect().width,
						element.className
					).to.be.closeTo(parseFloat(element.style.width), 1);
				}
				expect(panel.getBoundingClientRect().right).to.be.greaterThan(
					panel.parentElement.getBoundingClientRect().right
				);
				panel
					.querySelectorAll('.hscroll')
					.forEach((wrapper) => assertScrollable(wrapper, win));
			}
		);
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

describe('Test donation badge header fixtures', () => {
	beforeEach(cy.startup);

	[1440, 714, 713, 390].forEach((width) => {
		it(`Preserves native donation alignment and visibility at ${width}px`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'donation-header-fixture';
				frame.style.cssText =
					`width: ${width}px; height: 900px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				// Native layout contracts: ui/lib/css/header/{header,title,buttons}.
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							* { box-sizing: border-box; }
							html { ---site-header-height: 60px; font-size: 14px; }
							body { margin: 0; line-height: 1.5; }
							#top {
								height: var(---site-header-height); display: flex;
								justify-content: space-between; position: relative;
								max-width: 1800px; margin: 0 auto;
							}
							.site-title-nav { display: flex; justify-content: flex-start; }
							.site-title {
								display: flex; align-items: center; white-space: nowrap;
								padding: 0 1rem; margin-inline-start: 0.5rem;
								font-size: 30px; transform: translateY(-3px);
							}
							.site-name { display: none; }
							.site-icon { display: block; }
							@media (min-width: 1120px) {
								.site-name { display: block; }
								.site-icon { display: none; }
							}
							@media (max-width: 1019px) {
								.site-title { margin-inline-start: calc(0.5rem + var(---site-header-height)); }
							}
							@media (max-width: 499px) {
								.site-title { display: none; }
							}
							.site-title-nav__donate {
								display: flex; align-items: center; justify-content: center;
								white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
								max-width: 30vw; text-transform: uppercase;
								padding: 0 1.1rem 0 1.3rem; margin: 6px 0 5px 0;
							}
							.site-title-nav__donate::before {
								content: '\\e06c'; font-family: lichess; font-size: 1.2em;
								vertical-align: middle; text-transform: none;
								position: relative; right: 5px; top: -1px;
							}
							.site-buttons { display: flex; align-items: center; position: relative; }
							.site-buttons .link {
								display: block; height: var(---site-header-height);
								line-height: var(---site-header-height); padding: 0 20px;
							}
							@media (max-width: 650px) {
								.site-title-nav__donate { display: none; }
							}
						</style>
						<link rel="stylesheet" href="/styles.css">
					</head><body>
						<header id="top">
							<div class="site-title-nav">
								<a class="site-title" href="/"><span class="site-name">lichess<span>.org</span></span><i class="site-icon">&#xe07a;</i></a>
								<a class="site-title-nav__donate" href="/patron">Donate</a>
							</div>
							<div class="site-buttons"><a class="link" href="#signin">Sign in</a></div>
						</header>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#donation-header-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				const link = doc.querySelector('link[rel="stylesheet"]');
				expect(link, 'built stylesheet link').to.exist;
				expect(link.sheet, 'loaded built stylesheet').to.exist;
				expect(link.sheet.cssRules.length).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);

				const rect = (selector) =>
					doc.querySelector(selector).getBoundingClientRect();
				const header = rect('#top');
				const logo = rect('.site-title');
				const buttons = rect('.site-buttons');
				expect(header.height).to.equal(60);
				if (width >= 500) {
					expect(logo.top, 'native logo translation').to.be.closeTo(
						header.top - 3,
						0.1
					);
					expect(logo.height).to.be.closeTo(header.height, 0.1);
				}
				expect(buttons.top, 'native header controls').to.be.closeTo(
					header.top,
					0.1
				);
				expect(buttons.right).to.be.closeTo(header.right, 0.1);
				expect(buttons.height).to.be.closeTo(header.height, 0.1);

				const donate = doc.querySelector('.site-title-nav__donate');
				const style = win.getComputedStyle(donate);
				expect(style.visibility).to.equal(
					width <= 713 ? 'hidden' : 'visible'
				);
				if (width <= 650) {
					expect(
						style.display,
						'native narrow-screen collapse'
					).to.equal('none');
					expect(donate.getClientRects()).to.have.length(0);
					return;
				}

				const bounds = donate.getBoundingClientRect();
				expect(bounds.top, 'native top margin').to.be.closeTo(
					header.top + 6,
					0.1
				);
				expect(bounds.bottom, 'native bottom margin').to.be.closeTo(
					header.bottom - 5,
					0.1
				);
				expect(
					bounds.left,
					'badge follows logo without moving it'
				).to.be.closeTo(logo.right, 0.1);
				const range = doc.createRange();
				range.selectNodeContents(donate);
				const text = range.getBoundingClientRect();
				expect(text.height).to.be.greaterThan(0);
				expect(
					(text.top + text.bottom) / 2,
					'text is vertically centered'
				).to.be.closeTo((bounds.top + bounds.bottom) / 2, 2);
			});
		});
	});
});

describe('Test Insights canvas fixtures', () => {
	beforeEach(cy.startup);

	let content;
	before(() => {
		const build =
			Cypress.browser.name === 'firefox' ? 'dist-firefox' : 'dist-chrome';
		cy.readFile(`${build}/content.js`).then((source) => {
			content = source;
		});
	});

	// Native contracts: lila/ui/insight/src/chart.ts and ui/lib/css/theme/.
	const nativeThemes = [
		{theme: 'light', background: 'hsl(0 0% 100%)', font: [77, 77, 77]},
		{theme: 'dark', background: 'hsl(37 7% 14%)', font: [204, 204, 204]},
	];
	const palettes = [
		{
			name: 'defaultDark',
			surface: '#333538',
			background: '#272a2c',
			white: '#f2f5f3',
		},
		{
			name: 'invertedLight',
			surface: '#f5f5f5',
			background: '#e0e0e0',
			white: '#111111',
		},
	];
	const applyPalette = (doc, palette) => {
		for (const [name, value] of Object.entries({
			surfaceColor: palette.surface,
			backgroundColor: palette.background,
			defaultWhite: palette.white,
		})) {
			doc.body.style.setProperty(`--${name}`, value);
		}
	};
	const fixture = (native, palette) => {
		cy.document().then((doc) => {
			const frame = doc.createElement('iframe');
			frame.id = 'insights-canvas-fixture';
			frame.style.cssText = 'width: 900px; height: 700px; border: 0;';
			frame.srcdoc = `<!doctype html>
				<html class="${native.theme}"><head>
					<style>
						:root {
							--c-bg: ${native.background};
							--c-bg-box: var(--c-bg);
							--c-bg-opaque: ${native.opaque || native.background};
						}
						body { margin: 0; }
						.box { width: 400px; }
						canvas { display: block; }
						#native-surface { background: var(--c-bg-box); }
						/* Model the independent Insights controls palette bridge. */
						#insight {
							--c-bg: var(--surfaceColor) !important;
							--c-bg-box: var(--surfaceColor) !important;
							--c-bg-opaque: var(--surfaceColor) !important;
						}
					</style>
					<link rel="stylesheet" href="/styles.css">
				</head><body data-theme="${native.theme}">
					<main id="insight"><div class="box">
						<canvas class="chart" width="360" height="180"></canvas>
						<canvas id="other-canvas" width="10" height="10"></canvas>
					</div></main>
					<div id="outside" class="box">
						<canvas class="chart" width="360" height="180"></canvas>
					</div>
					<div id="native-surface"></div>
				</body></html>`;
			doc.body.appendChild(frame);
		});
		return cy
			.get('#insights-canvas-fixture')
			.should(($frame) => {
				const doc = $frame[0].contentDocument;
				const link = doc.querySelector('link');
				expect(doc.readyState, 'fixture markup is ready').not.to.equal(
					'loading'
				);
				expect(
					link?.sheet?.cssRules.length,
					'loaded built stylesheet'
				).to.be.greaterThan(0);
			})
			.then(($frame) => {
				const doc = $frame[0].contentDocument;
				applyPalette(doc, palette);
				const canvas = doc.querySelector('#insight canvas.chart');
				const ctx = canvas.getContext('2d');
				ctx.font = '12px Arial';
				ctx.fillStyle = `rgb(${native.font.join(',')})`;
				ctx.fillText('Accuracy · Number of moves', 20, 150);
				return {doc, win: $frame[0].contentWindow, canvas, ctx};
			});
	};
	const executeContent = (
		win,
		get = (request, callback) => callback({layoutPreference: 'lichess'})
	) => {
		win.chrome = {
			storage: {
				sync: {
					get,
					set() {
						throw new Error('Unexpected storage write');
					},
				},
				onChanged: {addListener() {}},
			},
			runtime: {onMessage: {addListener() {}}},
		};
		new win.Function(content).call(win);
	};
	const startContent = (context) => {
		executeContent(context.win);
		return context;
	};
	const channels = (color) => color.match(/[\d.]+/g).map(Number);
	const background = (win, node) => {
		for (; node; node = node.parentElement) {
			const rgba = channels(win.getComputedStyle(node).backgroundColor);
			if (rgba.length === 3 || rgba[3] === 1) return rgba.slice(0, 3);
			expect(
				rgba[3],
				'fixture backgrounds are opaque or transparent'
			).to.equal(0);
		}
		throw new Error('No opaque canvas backdrop');
	};
	const luminance = (rgb) =>
		rgb
			.map((value) => {
				const channel = value / 255;
				return channel <= 0.04045
					? channel / 12.92
					: ((channel + 0.055) / 1.055) ** 2.4;
			})
			.reduce(
				(sum, value, index) =>
					sum + value * [0.2126, 0.7152, 0.0722][index],
				0
			);

	describe('Native font contrast', () => {
		nativeThemes.forEach((native) => {
			palettes.forEach((palette) => {
				it(`Keeps ${native.theme} glyphs readable on ${palette.name}`, () => {
					fixture(native, palette).then(({win, canvas, ctx}) => {
						const pixels = ctx.getImageData(
							0,
							0,
							canvas.width,
							canvas.height
						).data;
						let textPixels = 0;
						for (let i = 0; i < pixels.length; i += 4) {
							if (
								pixels[i + 3] === 255 &&
								native.font.every(
									(value, channel) =>
										pixels[i + channel] === value
								)
							)
								textPixels++;
						}
						expect(
							textPixels,
							'opaque native-color glyph pixels'
						).to.be.greaterThan(0);
						const ink = luminance(native.font);
						const surface = luminance(background(win, canvas));
						expect(
							(Math.max(ink, surface) + 0.05) /
								(Math.min(ink, surface) + 0.05),
							'native canvas text contrast'
						).to.be.at.least(4.5);
					});
				});
			});
		});
	});

	describe('Native surface isolation', () => {
		it('Keeps translucent native themes readable over opposite surfaces', () => {
			nativeThemes.forEach((native) => {
				const light = native.theme === 'light';
				const value = light ? '100%' : '0%';
				fixture(
					{
						...native,
						theme: `transp ${native.theme}`,
						background: `hsl(0 0% ${value} / 0.6)`,
						opaque: `hsl(0 0% ${value} / 0.9)`,
					},
					{
						surface: light ? '#000000' : '#ffffff',
						background: light ? '#000000' : '#ffffff',
						white: 'transparent',
					}
				)
					.then(startContent)
					.then(({doc, win, canvas}) => {
						const rgba = channels(
							win.getComputedStyle(canvas).backgroundColor
						);
						const behind = background(win, canvas.parentElement);
						const composited = rgba
							.slice(0, 3)
							.map(
								(value, index) =>
									value * rgba[3] +
									behind[index] * (1 - rgba[3])
							);
						const ink = luminance(native.font);
						const surface = luminance(composited);
						const contrast =
							(Math.max(ink, surface) + 0.05) /
							(Math.min(ink, surface) + 0.05);
						expect(
							contrast,
							`${native.theme} translucent canvas text contrast`
						).to.be.at.least(4.5);
						const channel = light ? 255 : 0;
						expect(
							rgba,
							'native opaque-token capture'
						).to.deep.equal([channel, channel, channel, 0.9]);
						cy.writeFile(
							`cypress/downloads/insights-translucency-${native.theme}.json`,
							{canvas: rgba, behind, composited, contrast}
						);
						doc.defaultView.frameElement.remove();
					});
			});
		});

		nativeThemes.forEach((native) => {
			it(`Captures the ${native.theme} surface without changing canvas rendering`, () => {
				fixture(native, palettes[0]).then(({doc, win, canvas, ctx}) => {
					const sheet = doc.querySelector('link').sheet;
					const rule = Array.from(sheet.cssRules).find(
						(rule) => rule.selectorText === '#insight canvas.chart'
					);
					expect(rule, 'scoped canvas exception').to.exist;
					const exception = rule.style.cssText;
					const outside = doc.querySelector('#outside canvas');
					const other = doc.querySelector('#other-canvas');
					const snapshot = () => ({
						bounds: canvas.getBoundingClientRect().toJSON(),
						width: canvas.width,
						height: canvas.height,
						pixels: canvas.toDataURL(),
						contextFont: ctx.font,
						cssFont: win.getComputedStyle(canvas).font,
						filter: win.getComputedStyle(canvas).filter,
						forcedColorAdjust:
							win.getComputedStyle(canvas).forcedColorAdjust,
						outsideBackground:
							win.getComputedStyle(outside).backgroundColor,
						outsideRadius:
							win.getComputedStyle(outside).borderRadius,
						outsideBounds: outside.getBoundingClientRect().toJSON(),
						outsideSurface: win.getComputedStyle(
							outside.parentElement
						).backgroundColor,
						otherBackground:
							win.getComputedStyle(other).backgroundColor,
						otherRadius: win.getComputedStyle(other).borderRadius,
						bodyBackground: win.getComputedStyle(doc.body)
							.backgroundColor,
					});
					const nativeSurface = win.getComputedStyle(
						doc.querySelector('#native-surface')
					).backgroundColor;
					[
						...palettes,
						{
							name: 'transparent',
							surface: 'transparent',
							background: '#000000',
							white: 'transparent',
						},
					].forEach((palette) => {
						applyPalette(doc, palette);
						rule.style.cssText = '';
						const before = snapshot();
						rule.style.cssText = exception;
						expect(snapshot(), palette.name).to.deep.equal(before);
						expect(
							win.getComputedStyle(canvas).backgroundColor,
							palette.name
						).to.equal(nativeSurface);
						expect(
							win.getComputedStyle(canvas).borderRadius
						).to.equal(
							win
								.getComputedStyle(doc.documentElement)
								.getPropertyValue('--borderRadius')
								.trim()
						);
						expect(
							win.getComputedStyle(
								doc.querySelector('#native-surface')
							).backgroundColor
						).to.equal(nativeSurface);
						const insight = doc.querySelector('#insight');
						expect(
							win
								.getComputedStyle(insight)
								.getPropertyValue('--c-bg-box')
								.trim()
						).to.equal(palette.surface);
						for (const ancestor of [
							canvas.parentElement,
							insight,
							doc.body,
						]) {
							expect(
								win.getComputedStyle(ancestor).overflowX
							).to.equal('visible');
							expect(
								win.getComputedStyle(ancestor).overflowY
							).to.equal('visible');
						}
					});
				});
			});
		});
	});

	describe('Per-document palette snapshot', () => {
		nativeThemes.forEach((native, index) => {
			it(`Keeps the initial ${native.theme} palette across native theme and style changes`, () => {
				fixture(native, palettes[index])
					.then(startContent)
					.then(({doc, win, canvas}) => {
						const insight = doc.getElementById('insight');
						const captured = doc.getElementById(
							'prettier-insight-canvas-background'
						);
						const initial = {
							background:
								win.getComputedStyle(canvas).backgroundColor,
							bounds: canvas.getBoundingClientRect().toJSON(),
							pixels: canvas.toDataURL(),
						};
						const initialNative = win
							.getComputedStyle(doc.body)
							.getPropertyValue('--c-bg-opaque');
						const opposite = nativeThemes[1 - index];
						doc.documentElement.className = opposite.theme;
						doc.documentElement.style.setProperty(
							'--c-bg',
							opposite.background
						);
						doc.documentElement.style.setProperty(
							'--c-bg-opaque',
							opposite.background
						);
						const nativeStyle = `width: ${
							insight.getBoundingClientRect().width
						}px; ---chart-height: 180px;`;
						insight.setAttribute('style', nativeStyle);
						executeContent(win);
						doc.dispatchEvent(new win.Event('DOMContentLoaded'));

						expect(
							win
								.getComputedStyle(doc.body)
								.getPropertyValue('--c-bg-opaque')
						).not.to.equal(initialNative);
						expect(insight.getAttribute('style')).to.equal(
							nativeStyle
						);
						expect(
							{
								background:
									win.getComputedStyle(canvas)
										.backgroundColor,
								bounds: canvas.getBoundingClientRect().toJSON(),
								pixels: canvas.toDataURL(),
							},
							'initial native palette and canvas rendering'
						).to.deep.equal(initial);
						expect(
							doc.querySelectorAll(
								'#prettier-insight-canvas-background'
							)
						).to.have.length(1);
						expect(
							doc.getElementById(
								'prettier-insight-canvas-background'
							)
						).to.equal(captured);
						const ink = luminance(native.font);
						const surface = luminance(background(win, canvas));
						expect(
							(Math.max(ink, surface) + 0.05) /
								(Math.min(ink, surface) + 0.05)
						).to.be.at.least(4.5);
					});
			});
		});

		it('Waits for native markup when initialized before html and body exist', () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'insights-canvas-fixture';
				doc.body.appendChild(frame);
				const win = frame.contentWindow;
				const page = win.document;
				page.open();
				expect(page.documentElement).to.equal(null);
				expect(page.body).to.equal(null);
				const pending = [];
				executeContent(win, (request, callback) =>
					pending.push(callback)
				);
				page.write(`<!doctype html><html class="dark"><head>
					<style>
						:root { --c-bg-opaque: hsl(37 7% 14%); }
						#insight { --c-bg-box: white; --c-bg-opaque: white; }
					</style>
					<link rel="stylesheet" href="/styles.css">
					</head><body data-theme="system">
						<main id="insight"><canvas class="chart"></canvas></main>
					</body></html>`);
				pending.forEach((callback) =>
					callback({layoutPreference: 'lichess'})
				);
				page.close();
			});
			cy.get('#insights-canvas-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(doc.getElementById('prettier-insight-canvas-background'))
					.to.exist;
				expect(
					win.getComputedStyle(doc.querySelector('canvas'))
						.backgroundColor
				).to.equal('rgb(38, 36, 33)');
			});
		});

		it('Resolves contextual colors once instead of retaining live color functions', () => {
			fixture(
				{
					...nativeThemes[0],
					opaque: 'light-dark(white, black)',
				},
				palettes[0]
			)
				.then((context) => {
					context.doc.body.style.colorScheme = 'light';
					return startContent(context);
				})
				.then(({doc, win, canvas}) => {
					expect(
						win.getComputedStyle(canvas).backgroundColor
					).to.equal('rgb(255, 255, 255)');
					doc.body.style.colorScheme = 'dark';
					expect(
						win.getComputedStyle(canvas).backgroundColor
					).to.equal('rgb(255, 255, 255)');
					expect(doc.body.querySelectorAll('canvas')).to.have.length(
						3
					);
				});
		});

		it('Leaves other pages untouched and warns if the native Insights color is unavailable', () => {
			fixture(nativeThemes[0], palettes[0]).then(({doc, win, canvas}) => {
				const warnings = Cypress.sinon.spy(win.console, 'warn');
				const insight = doc.getElementById('insight');
				insight.id = 'other-page';
				const before = {
					pixels: canvas.toDataURL(),
					bounds: canvas.getBoundingClientRect().toJSON(),
					background: win.getComputedStyle(canvas).backgroundColor,
					bodyStyle: doc.body.getAttribute('style'),
				};
				executeContent(win);
				expect(doc.getElementById('prettier-insight-canvas-background'))
					.not.to.exist;
				expect(warnings.callCount).to.equal(0);
				expect({
					pixels: canvas.toDataURL(),
					bounds: canvas.getBoundingClientRect().toJSON(),
					background: win.getComputedStyle(canvas).backgroundColor,
					bodyStyle: doc.body.getAttribute('style'),
				}).to.deep.equal(before);
				insight.id = 'insight';
				for (const invalid of ['not-a-color', 'initial']) {
					doc.documentElement.style.setProperty(
						'--c-bg-opaque',
						invalid
					);
					executeContent(win);
					expect(
						doc.getElementById('prettier-insight-canvas-background')
					).not.to.exist;
				}
				expect(warnings.callCount).to.equal(2);
				expect(warnings.firstCall.args[0]).to.include(
					'Native Insights canvas background unavailable'
				);
				expect(canvas.toDataURL()).to.equal(before.pixels);
			});
		});
	});

	describe('Forced colors', () => {
		let resetMedia;
		let restoreRule;

		afterEach(() => {
			if (restoreRule) restoreRule();
			if (resetMedia) cy.then(resetMedia);
			restoreRule = undefined;
			resetMedia = undefined;
		});

		it('Preserves composited plot colors under UA forced colors', function () {
			if (Cypress.browser.name === 'firefox') this.skip();

			const emulate = (features) =>
				Cypress.automation('remote:debugger:protocol', {
					command: 'Emulation.setEmulatedMedia',
					params: {features},
				});
			const capture = (name) => {
				let path;
				cy.get('#insights-canvas-fixture').then(($frame) => {
					const win = $frame[0].contentWindow;
					const doc = win.document;
					const bounds = doc
						.querySelector('#insight canvas.chart')
						.getBoundingClientRect();
					const radius = parseFloat(
						win
							.getComputedStyle(doc.documentElement)
							.getPropertyValue('--borderRadius')
					);
					// Compare plot colors, not the intentionally rounded corners.
					const clip = {
						x: bounds.x + radius,
						y: bounds.y + radius,
						width: bounds.width - radius * 2,
						height: bounds.height - radius * 2,
					};
					return cy
						.wrap($frame)
						.screenshot(`insights-forced-colors-${name}`, {
							overwrite: true,
							clip,
							onAfterScreenshot: (element, details) => {
								path = details.path;
							},
						});
				});
				return cy.then(() => cy.readFile(path, 'base64'));
			};

			cy.viewport(1000, 900);
			cy.window().then((win) => {
				const initial = win.matchMedia(
					'(forced-colors: active)'
				).matches;
				resetMedia = () =>
					emulate([]).then(() => {
						expect(
							win.matchMedia('(forced-colors: active)').matches,
							'forced-colors emulation restored'
						).to.equal(initial);
					});
				return emulate([{name: 'forced-colors', value: 'active'}]);
			});

			nativeThemes.forEach((native, index) => {
				let before;
				let screenshot;
				let context;
				let snapshot;

				fixture(native, palettes[index])
					.then(startContent)
					.then(({doc, win, canvas}) => {
						context = {doc, win, canvas};
						const frame = win.frameElement;
						frame.style.position = 'fixed';
						frame.style.top = '0';
						frame.style.left = '0';
						frame.style.zIndex = '2147483647';
						expect(
							win.matchMedia('(forced-colors: active)').matches,
							'forced colors actually active in fixture'
						).to.equal(true);
						const rule = Array.from(
							doc.querySelector('link').sheet.cssRules
						).find(
							(rule) =>
								rule.selectorText === '#insight canvas.chart'
						);
						expect(rule, 'scoped canvas exception').to.exist;
						const exception = rule.style.cssText;
						restoreRule = () => {
							rule.style.cssText = exception;
						};
						snapshot = () => ({
							bounds: canvas.getBoundingClientRect().toJSON(),
							pixels: canvas.toDataURL(),
							backdrop: background(win, canvas),
							forcedColorAdjust:
								win.getComputedStyle(canvas).forcedColorAdjust,
						});
						rule.style.cssText = '';
						before = snapshot();
						expect(before.forcedColorAdjust).to.equal('auto');
					});
				capture(`${native.theme}-before`).then((image) => {
					screenshot = image;
				});
				cy.then(() => {
					restoreRule();
					expect(
						context.win.matchMedia('(forced-colors: active)')
							.matches
					).to.equal(true);
					expect(
						snapshot(),
						'native buffer and UA backdrop'
					).to.deep.equal(before);
				});
				capture(`${native.theme}-after`).then((image) => {
					expect(
						image === screenshot,
						`${native.theme} composited plot screenshot unchanged`
					).to.equal(true);
					return emulate([]).then(() => {
						expect(
							context.win.getComputedStyle(context.canvas)
								.backgroundColor,
							'native palette retained after forced colors'
						).to.equal(
							context.win.getComputedStyle(
								context.doc.getElementById('native-surface')
							).backgroundColor
						);
						context.win.frameElement.remove();
						restoreRule = undefined;
						return emulate([
							{name: 'forced-colors', value: 'active'},
						]);
					});
				});
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
					const boardWidth =
						kind === 'game'
							? width
							: main.clientWidth -
							  parseFloat(mainStyle.paddingLeft) -
							  parseFloat(mainStyle.paddingRight);
					expect(boardRect.width).to.equal(boardWidth);
					expect(boardRect.height).to.equal(boardWidth);
					expect(win.getComputedStyle(board).marginLeft).to.equal(
						kind === 'game' ? '-10px' : '0px'
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

describe('Test themed button label readability', () => {
	beforeEach(cy.startup);

	['light', 'dark'].forEach((scheme) => {
		it(`Removes native ${scheme} shadows from themed button labels`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'button-label-fixture';
				frame.srcdoc = `<!doctype html><html><head><style>
					body { font-size: 14px; }
					.button {
						display: inline-block; font: 500 14px sans-serif;
						text-shadow: .5px .5px 0 ${
							scheme === 'light'
								? 'rgba(0, 0, 0, .7)'
								: 'rgba(0, 0, 0, .8)'
						};
					}
					.button.disabled { opacity: .5; }
				</style><link rel="stylesheet" href="/styles.css"></head><body>
					<a class="button button-green text">Create a new tournament</a>
					<button class="button">Register</button>
					<button class="button disabled" disabled>Unavailable</button>
				</body></html>`;
				frame.style.cssText = 'width: 600px; height: 250px; border: 0;';
				doc.body.appendChild(frame);
			});
			cy.get('#button-label-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(
					doc.querySelector('link')?.sheet?.cssRules.length || 0
				).to.be.greaterThan(0);
				for (const button of doc.querySelectorAll('.button')) {
					expect(
						win.getComputedStyle(button).textShadow,
						'no native shadow is composited onto the extension text'
					).to.equal('none');
					const range = doc.createRange();
					range.selectNodeContents(button);
					const text = range.getBoundingClientRect();
					const box = button.getBoundingClientRect();
					expect(text.left).to.be.at.least(box.left);
					expect(text.right).to.be.at.most(box.right);
					expect(text.top).to.be.at.least(box.top);
					expect(text.bottom).to.be.at.most(box.bottom);
				}
				const disabled = doc.querySelector('button:disabled');
				expect(disabled.disabled).to.equal(true);
				expect(win.getComputedStyle(disabled).opacity).to.equal('0.5');
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

describe('Test Insights control palette fixtures', () => {
	beforeEach(cy.startup);

	[390, 1440].forEach((width) => {
		['light', 'dark'].forEach((theme) => {
			it(`Themes Insights controls without resizing at ${width}px in ${theme}`, () => {
				cy.document().then((doc) => {
					const frame = doc.createElement('iframe');
					frame.id = 'insights-control-palette';
					frame.style.cssText =
						`width: ${width}px; height: 900px; border: 0; ` +
						'max-width: none; flex-shrink: 0;';
					const controls = `
						<div class="info box"><div class="top">Assios</div></div>
						<div class="view-tabs"><div class="tab active">Insights</div><div class="tab">Filters</div></div>
						<div class="panel-tabs"><a class="tab active">Presets</a><a class="tab">Filters</a></div>
						<header><div class="axis-form">
							${['metric', 'dimension']
								.map(
									(axis) => `
								<div class="ms-parent ${axis}" style="width: var(---drop-menu-width)">
									<button class="ms-choice selected"><span>${axis}</span><div></div></button>
									<div class="ms-drop bottom" style="display: block">
										<ul>
											<li><label class="optgroup">Moves</label></li>
											<li class="selected"><label><input type="radio" checked>Accuracy</label></li>
											<li><label>Move time</label></li>
											<li><label class="disabled">Unavailable</label></li>
										</ul>
									</div>
								</div>`
								)
								.join('')}
						</div></header>
						<div class="insight__main box"><canvas class="chart" width="300" height="100"></canvas></div>
						<div class="filters"><div class="items"><div class="categ box">
							<div class="top">Game</div>
							<div class="ms-parent">
								<button class="ms-choice selected"><span>Blitz</span><div></div></button>
								<div class="ms-drop" style="display: block">
									<div class="ms-search"><input type="text" placeholder="Search"></div>
									<ul><li class="selected"><label><input type="checkbox" checked>Blitz</label></li></ul>
								</div>
							</div>
							<div class="ms-parent"><button class="ms-choice disabled"><span>Unavailable</span></button></div>
						</div></div></div>`;
					frame.srcdoc = `<!doctype html>
						<html class="${theme}"><head><style>
							:root {
								--c-bg: #262421; --c-bg-box: var(--c-bg); --c-bg-opaque: #262421;
								--c-bg-zebra: #33312e; --c-font: #bababa; --c-font-page: #949494;
								--c-border: #404040; --c-shade: #4d4d4d; --c-primary: #3692e7;
								--c-link: var(--c-primary); --c-accent: #d64f00; --c-over: white;
								--c-metal-top: #3c3934; --c-metal-bottom: #33312e;
								--c-body-gradient: hsl(37 12% 16%);
							}
							html.light {
								--c-bg: #fff; --c-bg-opaque: #fff; --c-bg-zebra: #f7f6f5;
								--c-font: #4d4d4d; --c-font-page: #5e5e5e; --c-border: #d9d9d9;
								--c-shade: #d6d6d6; --c-primary: #1b78d1;
								--c-metal-top: #f5f5f5; --c-metal-bottom: #ededed;
								--c-body-gradient: hsl(37 12% 84%);
							}
							* { box-sizing: border-box; }
							body { margin: 0; }
							button, input { font: inherit; }
							.ms-parent { display: inline-block; position: relative; vertical-align: middle; }
							.ms-choice {
								display: block; width: 100%; height: 26px; padding: 0;
								border: 1px solid var(--c-border); line-height: 26px;
								border-radius: 2px; background-color: var(--c-bg-box);
							}
							.ms-choice.disabled { background-color: var(--c-shade); }
							.ms-choice > span { position: absolute; top: 0; left: 0; right: 20px; padding-left: 8px; }
							.ms-drop {
								width: 100%; position: absolute; z-index: 1000; margin-top: -1px;
								background: var(--c-bg-opaque); border: 1px solid var(--c-border);
							}
							.ms-drop.bottom { top: 100%; }
							.ms-drop ul { margin: 0; padding: 0; }
							.ms-drop li { list-style: none; }
							.ms-drop label { display: block; white-space: nowrap; }
							.ms-drop .disabled { opacity: 0.35; }
							.ms-search { padding: 4px; }
							.ms-search input { width: 100%; border: 1px solid var(--c-border); }
							/* Mirror native page rules on a control outside #insight to check scope and geometry. */
							:is(#insight, #outside) .view-tabs,
							:is(#insight, #outside) .panel-tabs { display: flex; border-bottom: 2px solid var(--c-border); }
							:is(#insight, #outside) .tab {
								flex: 1 1 auto; padding: 0.5em 0.2em; position: relative;
								text-align: center; color: var(--c-font-page);
							}
							:is(#insight, #outside) .tab::after {
								content: ''; position: absolute; bottom: -2px; height: 2px; width: 96%;
								background: rgb(from var(--c-accent) r g b / calc(alpha * 0.6));
							}
							:is(#insight, #outside) .tab.active { color: var(--c-accent); }
							:is(#insight, #outside) header { height: var(---header-height); background: var(--c-bg-zebra); }
							:is(#insight, #outside) .axis-form { height: 100%; display: flex; justify-content: space-evenly; }
							:is(#insight, #outside) .axis-form .ms-choice {
								padding: calc(var(---header-height) / 2) 2px; border-width: 0 1px; border-radius: 0;
							}
							:is(#insight, #outside) .axis-form .ms-choice span { line-height: var(---header-height); }
							:is(#insight, #outside) .axis-form .ms-drop { color: var(--c-font); }
							:is(#insight, #outside) .axis-form input { display: none; }
							:is(#insight, #outside) .axis-form .selected label { background: var(--c-accent); color: var(--c-over); }
							:is(#insight, #outside) .ms-drop label:not(.optgroup) { padding: 4px 8px; text-indent: 1em; }
							:is(#insight, #outside) .ms-drop label:not(.optgroup):hover { background: color-mix(in oklab, var(--c-accent) 20%, var(--c-bg)); }
							:is(#insight, #outside) .top {
								background: linear-gradient(to bottom, var(--c-metal-top), var(--c-metal-bottom));
								border-bottom: 1px solid var(--c-border);
								box-shadow: inset 0 1px 3px -2px hsl(0 0% 45%),
									inset 0 -4px 6px -3px hsl(from var(--c-body-gradient) h s calc(l + 3) / 0.8);
							}
							:where(html.light) :is(#insight, #outside) .top {
								box-shadow: inset 0 3px 3px -2px #fff6,
									inset 0 -4px 6px -3px hsl(from var(--c-body-gradient) h s calc(l + 5) / 0.8);
							}
							:is(#insight, #outside) .filters .ms-parent { display: block; }
							:is(#insight, #outside) .filters .ms-choice { padding: 15px 10px; border-width: 0 0 1px; }
							:is(#insight, #outside) .filters .ms-choice.selected {
								background: color-mix(in oklab, var(--c-primary) 20%, var(--c-bg)); border-left: 3px solid var(--c-link);
							}
							:is(#insight, #outside) .filters .ms-drop { top: 0; margin-inline-start: 50%; }
						</style><link rel="stylesheet" href="/styles.css"></head><body>
							${['insight', 'outside']
								.map(
									(id) => `
								<main id="${id}" style="width: ${Math.min(width, 800)}px;
									---header-height: ${width < 800 ? 30 : 60}px;
									---drop-menu-width: ${width < 800 ? 154 : 200}px">
									${controls}
								</main>`
								)
								.join('')}
						</body></html>`;
					doc.body.appendChild(frame);
				});
				cy.get('#insights-control-palette').should(($frame) => {
					const doc = $frame[0].contentDocument;
					const win = $frame[0].contentWindow;
					expect(
						doc.querySelector('link')?.sheet?.cssRules.length || 0,
						'loaded built stylesheet'
					).to.be.greaterThan(0);
					expect(win.innerWidth).to.equal(width);
					const style = (selector) =>
						win.getComputedStyle(doc.querySelector(selector));
					for (const selector of [
						'header',
						'.axis-form .ms-choice',
						'.ms-drop',
						'.ms-search input',
					]) {
						expect(
							style(`#insight ${selector}`).backgroundColor,
							selector
						).to.equal('rgb(51, 53, 56)');
					}
					expect(
						style('#insight .axis-form .ms-drop').color
					).to.equal('rgb(170, 170, 170)');
					expect(
						style('#insight .axis-form .ms-drop').borderTopColor
					).to.equal('rgb(64, 66, 70)');
					expect(
						style('#insight .axis-form .selected label')
							.backgroundColor
					).to.equal('rgb(159, 192, 162)');
					expect(
						style('#insight .axis-form .selected label').color
					).to.equal('rgb(39, 42, 44)');
					expect(
						style('#insight .filters .ms-choice.selected')
							.borderLeftColor
					).to.equal('rgb(159, 192, 162)');
					expect(style('#insight .top').backgroundImage).to.equal(
						'linear-gradient(rgb(51, 53, 56), rgb(51, 53, 56))'
					);
					for (const selector of ['.info .top', '.filters .top']) {
						expect(
							style(`#outside ${selector}`).boxShadow,
							`${selector} native metal shadow outside Insights`
						).not.to.equal('none');
						if (theme === 'light') {
							expect(
								style(`#insight ${selector}`).boxShadow,
								`${selector} Light metal shadow`
							).to.equal('none');
						}
					}
					for (const selector of ['.view-tabs', '.panel-tabs']) {
						expect(
							style(`#insight ${selector} .active`).color
						).to.equal('rgb(159, 192, 162)');
						expect(
							style(`#insight ${selector} .tab:not(.active)`)
								.color
						).to.equal('rgb(170, 170, 170)');
					}
					expect(
						style('#outside .axis-form .ms-choice').backgroundColor
					).to.equal(
						theme === 'light'
							? 'rgb(255, 255, 255)'
							: 'rgb(38, 36, 33)'
					);
					expect(style('#outside .tab.active').color).to.equal(
						'rgb(214, 79, 0)'
					);
					expect(
						style('#outside .axis-form .selected label').color
					).to.equal('rgb(255, 255, 255)');
					const inside = doc.querySelector('#insight');
					const outside = doc.querySelector('#outside');
					const origin = inside.getBoundingClientRect();
					const controlOrigin = outside.getBoundingClientRect();
					const controls = outside.querySelectorAll('*');
					inside.querySelectorAll('*').forEach((element, index) => {
						const rect = element.getBoundingClientRect();
						const control = controls[index].getBoundingClientRect();
						for (const dimension of ['width', 'height']) {
							expect(
								rect[dimension],
								`${element.className} ${dimension}`
							).to.equal(control[dimension]);
						}
						expect(rect.x - origin.x).to.equal(
							control.x - controlOrigin.x
						);
						if (rect.width || rect.height) {
							expect(rect.y - origin.y).to.equal(
								control.y - controlOrigin.y
							);
						}
						for (const property of [
							'fontFamily',
							'fontSize',
							'fontWeight',
							'lineHeight',
						]) {
							expect(
								win.getComputedStyle(element)[property],
								property
							).to.equal(
								win.getComputedStyle(controls[index])[property]
							);
						}
					});
				});
			});
		});
	});
});

describe('Test toolbar hover capability fixtures (Chrome CDP)', () => {
	const protocol = (command, params) =>
		Cypress.automation('remote:debugger:protocol', {command, params});

	const findNode = (node, id) => {
		const attributes = node.attributes || [];
		for (let i = 0; i < attributes.length; i += 2) {
			if (attributes[i] === 'id' && attributes[i + 1] === id) return node;
		}
		for (const child of [
			...(node.children || []),
			...(node.contentDocument ? [node.contentDocument] : []),
		]) {
			const found = findNode(child, id);
			if (found) return found;
		}
	};

	const hoverControl = (id) =>
		cy
			.then(() => protocol('DOM.getDocument', {depth: -1, pierce: true}))
			.then(({root}) => {
				const fixture = findNode(root, 'toolbar-hover-fixture');
				const button = findNode(fixture.contentDocument, id);
				return protocol('DOM.getBoxModel', {nodeId: button.nodeId});
			})
			.then(({model}) =>
				// CDP's quad includes the scaled, nested Cypress AUT iframe.
				protocol('Input.dispatchMouseEvent', {
					type: 'mouseMoved',
					x: (model.border[0] + model.border[4]) / 2,
					y: (model.border[1] + model.border[5]) / 2,
					button: 'none',
					pointerType: 'mouse',
				})
			);

	beforeEach(function () {
		if (Cypress.browser.family !== 'chromium') this.skip();
		cy.startup();
	});

	afterEach(() => {
		if (Cypress.browser.family === 'chromium') {
			cy.then(() =>
				protocol('Emulation.setTouchEmulationEnabled', {enabled: false})
			);
		}
	});

	[
		{width: 1440, canHover: true},
		{width: 390, canHover: false},
		{width: 390, canHover: true},
		{width: 1440, canHover: false},
	].forEach(({width, canHover}) => {
		it(`Preserves toolbar states at ${width}px with hover ${
			canHover ? 'available' : 'unavailable'
		}`, () => {
			cy.viewport(width, 900);
			cy.then(() =>
				protocol('Emulation.setTouchEmulationEnabled', {
					enabled: !canHover,
					maxTouchPoints: 1,
				})
			);
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'toolbar-hover-fixture';
				frame.style.cssText =
					'position: fixed; inset: 0; width: 100%; height: 100%; ' +
					'border: 0; z-index: 2147483647;';
				frame.srcdoc = `<!doctype html>
					<html><head><style>
						:root { --c-bg: #262421; --c-bg-page: #161512; }
						.fbt, #native-background { background: transparent; }
						.fbt { width: 80px; height: 48px; }
						.fbt.disabled, .fbt:disabled { opacity: 0.4; }
						@media (max-width: 799px) and (orientation: portrait) {
							.analyse__controls .fbt, #native-background {
								background: color-mix(in oklab, var(--c-bg) 50%, var(--c-bg-page));
							}
						}
						@media (hover: hover) {
							.fbt:hover:not(.disabled):not([disabled]) {
								background: #369; color: #fff;
							}
						}
						#toolbar { position: fixed; top: 20px; left: 20px; display: flex; gap: 8px; }
					</style><link rel="stylesheet" href="/styles.css"></head>
					<body>
						<div id="toolbar" class="analyse__controls">
							<button id="explorer" class="fbt" data-act="opening-explorer">
								Explorer<svg class="spinner" width="12" height="12"><path d="M0 0L12 12"/></svg>
							</button>
							<button id="disabled-attribute" class="fbt" disabled>Disabled</button>
							<button id="disabled-class" class="fbt disabled">Disabled</button>
							<div id="native-background" hidden></div>
						</div>
						<div id="palette" hidden style="background: var(--primaryColor); color: var(--textColor); border-color: var(--backgroundColor)"></div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#toolbar-hover-fixture')
				.should(($frame) => {
					const doc = $frame[0].contentDocument;
					expect(
						doc.querySelector('link')?.sheet?.cssRules.length || 0,
						'loaded built stylesheet'
					).to.be.greaterThan(0);
					expect($frame[0].contentWindow.innerWidth).to.equal(width);
				})
				.then(($frame) => {
					const doc = $frame[0].contentDocument;
					const win = $frame[0].contentWindow;
					const palette = win.getComputedStyle(
						doc.getElementById('palette')
					);
					const nativeBackground = win.getComputedStyle(
						doc.getElementById('native-background')
					).backgroundColor;
					const assertColors = (id, active = false) =>
						cy.get('#toolbar-hover-fixture').should(() => {
							expect(
								win.matchMedia('(hover: hover)').matches
							).to.equal(canHover);
							expect(
								win.matchMedia('(hover: none)').matches
							).to.equal(!canHover);
							const button = doc.getElementById(id);
							expect(button.matches(':hover'), 'real CSS hover')
								.to.be.true;
							expect(
								button.classList.contains('active')
							).to.equal(active);
							const disabled = id !== 'explorer';
							const highlighted =
								active || (canHover && !disabled);
							const style = win.getComputedStyle(button);
							expect(
								style.backgroundColor,
								`${id} background`
							).to.equal(
								highlighted
									? palette.backgroundColor
									: nativeBackground
							);
							expect(style.color, `${id} foreground`).to.equal(
								highlighted
									? palette.borderTopColor
									: palette.color
							);
							if (disabled) expect(style.opacity).to.equal('0.4');
							else if (!active) {
								expect(
									win.getComputedStyle(
										button.querySelector('path')
									).stroke,
									'hovered inactive spinner stroke'
								).to.equal(
									canHover
										? palette.borderTopColor
										: palette.backgroundColor
								);
							}
						});

					hoverControl('explorer');
					assertColors('explorer');
					cy.then(() =>
						doc.getElementById('explorer').classList.add('active')
					);
					assertColors('explorer', true);
					cy.then(() =>
						doc
							.getElementById('explorer')
							.classList.remove('active')
					);
					assertColors('explorer');
					for (const id of ['disabled-attribute', 'disabled-class']) {
						hoverControl(id);
						assertColors(id);
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

describe('Test round board layout fixtures', () => {
	beforeEach(cy.startup);

	[
		{width: 390, height: 900, headerHeight: 40},
		{width: 740, height: 390, headerHeight: 40},
		{width: 740, height: 390, headerHeight: 64},
		{width: 800, height: 390, headerHeight: 40},
	].forEach(({width, height, headerHeight}) => {
		it(`Preserves the round board at ${width}x${height} with a ${headerHeight}px header`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'round-board-fixture';
				frame.style.cssText =
					`width: ${width}px; height: ${height}px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html>
					<html><head><style>
						* { box-sizing: border-box; }
						body {
							margin: 0;
							---site-header-height: ${headerHeight}px;
							---block-gap: 10px;
							---col2-uniboard-width: min(
								calc(100vw - var(---block-gap) - 240px - 20px),
								calc(100vh - var(---site-header-height) - 1rem)
							);
						}
						main.round { display: grid; grid-template-areas: 'app'; }
						.round__app {
							grid-area: app;
							display: grid;
							grid-template-columns: 100%;
							grid-template-rows: auto 30px 20px auto auto 20px 30px auto auto auto auto 0;
							grid-template-areas: 'pocket-top' 'user-top' 'mat-top' 'board'
								'expi-bot' 'mat-bot' 'user-bot' 'pocket-bot' 'controls' 'moves' 'voice' 'kb-move';
						}
						.main-board {
							grid-area: board;
							position: relative;
							display: block;
							width: 100%;
							height: 0;
							padding-bottom: 100%;
						}
						cg-container { position: absolute; width: 100%; height: 100%; }
						cg-board { display: block; width: 100%; height: 100%; }
						.ruser-top { grid-area: user-top; }
						.ruser-bottom { grid-area: user-bot; }
						.rclock-top { grid-area: 2 / 1 / 4 / 2; justify-self: end; }
						.rclock-bottom { grid-area: 6 / 1 / 8 / 2; justify-self: end; }
						i5d { grid-area: moves; display: block; }
						bo3 { display: flex; }
						bo3 button { flex: 1; min-height: 32px; }
						@media (min-width: 800px), (orientation: landscape) {
							main.round {
								grid-template-columns: 1fr 1fr;
								grid-template-areas: 'app app';
							}
							.round__app {
								justify-self: center;
								grid-template-columns: var(---col2-uniboard-width) 240px;
								column-gap: var(---block-gap);
								grid-template-rows: minmax(0, 1fr) 0 repeat(10, auto) minmax(0, 1fr);
								grid-template-areas:
									'board voice' 'board .' 'board mat-top' 'board clock-top'
									'board expi-top' 'board user-top' 'board moves' 'board controls'
									'board user-bot' 'board expi-bot' 'board clock-bot' 'board mat-bot'
									'board .' 'kb-move .';
							}
							.rclock-top { grid-area: clock-top; justify-self: start; }
							.rclock-bottom { grid-area: clock-bot; justify-self: start; }
						}
						@media (max-width: 799px) and (orientation: landscape) {
							.round__app {
								grid-template-columns:
									minmax(55vmin, calc(100vh - var(---site-header-height) - var(---block-gap)))
									minmax(200px, 240px);
							}
						}
					</style><link rel="stylesheet" href="/styles.css"></head>
					<body><div id="main-wrap"><main class="round"><div class="round__app">
						<div class="round__app__board main-board"><cg-container><cg-board></cg-board></cg-container></div>
						<div class="ruser ruser-top">White</div>
						<div class="rclock rclock-top"><div class="time">03:00</div></div>
						<div class="ruser ruser-bottom">Black</div>
						<div class="rclock rclock-bottom"><div class="time">02:59</div></div>
						<i5d><bo3>
							<button>First</button><button>Previous</button><button>Next</button><button>Last</button>
						</bo3></i5d>
					</div></main></div></body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#round-board-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(
					doc.querySelector('link')?.sheet?.cssRules.length || 0,
					'loaded built stylesheet'
				).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);
				expect(win.innerHeight).to.equal(height);
				const board = doc.querySelector('.main-board');
				const boardRect = board.getBoundingClientRect();
				expect(boardRect.height).to.be.closeTo(boardRect.width, 1);
				const controls = doc
					.querySelector('bo3')
					.getBoundingClientRect();
				if (height > width) {
					expect(boardRect.width).to.equal(
						doc.querySelector('.round__app').clientWidth
					);
					expect(boardRect.right).to.be.at.most(
						doc.documentElement.clientWidth
					);
					expect(win.getComputedStyle(board).marginLeft).to.equal(
						'0px'
					);
					expect(controls.top).to.be.at.least(boardRect.bottom);
					return;
				}

				const app = doc.querySelector('.round__app');
				const columns = win
					.getComputedStyle(app)
					.gridTemplateColumns.split(' ')
					.map(parseFloat);
				expect(columns).to.have.length(2);
				expect(boardRect.width, 'native board track').to.be.closeTo(
					columns[0],
					1
				);
				expect(boardRect.left).to.be.at.least(0);
				expect(boardRect.right).to.be.at.most(width);
				expect(boardRect.bottom).to.be.at.most(height);
				expect(win.getComputedStyle(board).marginLeft).to.equal('0px');
				for (const element of doc.querySelectorAll(
					'bo3, .ruser, .rclock'
				)) {
					const rect = element.getBoundingClientRect();
					expect(rect.left, 'beside the board').to.be.at.least(
						boardRect.right
					);
					expect(rect.right).to.be.at.most(width);
				}
				for (const button of doc.querySelectorAll('bo3 button')) {
					const rect = button.getBoundingClientRect();
					expect(
						button.contains(
							doc.elementFromPoint(
								rect.left + rect.width / 2,
								rect.top + rect.height / 2
							)
						),
						'unobstructed replay control'
					).to.equal(true);
				}
			});
		});
	});
});

describe('Test round markup fixtures', () => {
	beforeEach(cy.startup);

	[390, 1280].forEach((width) => {
		it(`Styles current and legacy round markup fixtures at ${width}px`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'round-markup-fixture';
				frame.style.cssText =
					`width: ${width}px; height: 800px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc =
					'<!doctype html><html><head><link rel="stylesheet" href="/styles.css"></head><body>' +
					'<rm6><rb1></rb1><l4x><i5z>1</i5z>' +
					'<u8t>e4</u8t><u8t class="a1t">e5</u8t></l4x></rm6>' +
					'<i5d><bo3></bo3><app><qzm>1</qzm>' +
					'<z7yx>e4</z7yx><z7yx class="a1t">e5</z7yx></app></i5d>' +
					'</body></html>';
				doc.body.appendChild(frame);
			});
			cy.get('#round-markup-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(
					doc.querySelector('link')?.sheet?.cssRules.length || 0
				).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);
				const style = (selector) =>
					win.getComputedStyle(doc.querySelector(selector));
				for (const [legacy, current, properties] of [
					[
						'rm6',
						'i5d',
						['backgroundColor', 'border', 'borderRadius'],
					],
					['rb1', 'bo3', ['backgroundColor', 'boxShadow']],
					['l4x', 'app', ['borderLeft', 'flexBasis', 'lineHeight']],
					['i5z', 'qzm', ['backgroundColor', 'color']],
					[
						'u8t.a1t',
						'z7yx.a1t',
						['backgroundColor', 'color', 'boxShadow'],
					],
				]) {
					for (const property of properties) {
						expect(
							style(current)[property],
							`${current} ${property}`
						).to.equal(style(legacy)[property]);
					}
				}
				expect(style('z7yx.a1t').backgroundColor).not.to.equal(
					style('z7yx:not(.a1t)').backgroundColor
				);
				expect(style('z7yx.a1t').boxShadow).not.to.equal('none');
			});
		});
	});
});

describe('Test profile activity timeline fixtures', () => {
	beforeEach(cy.startup);

	[
		{width: 390, direction: 'ltr'},
		{width: 500, direction: 'ltr'},
		{width: 740, direction: 'ltr'},
		{width: 1280, direction: 'ltr'},
		{width: 1280, direction: 'rtl'},
	].forEach(({width, direction}) => {
		it(`Preserves native profile activity alignment at ${width}px ${direction}`, () => {
			cy.document().then((doc) => {
				const frame = doc.createElement('iframe');
				frame.id = 'profile-activity-fixture';
				frame.style.cssText =
					`width: ${width}px; height: 800px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				frame.srcdoc = `<!doctype html><html dir="${direction}"><head>
					<style>
						*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
						html { font-size: clamp(12px, calc(12px + 2 * ((100vw - 300px) / 900)), 14px); }
						body { overflow-x: hidden; }
						.activity section { font-size: 1.2em; margin-inline-start: 2rem; padding-top: 1rem; }
						.activity section h2 { font-size: 1.2em; margin-bottom: 10px; }
						.activity .entries { display: flex; flex-flow: column; }
						.activity .entry {
							display: flex; flex-flow: row wrap; align-items: center;
							min-height: 64px; position: relative; padding: 6px 0;
						}
						.activity .entry:not(:first-child) { margin-top: -4px; }
						.activity .entry > div { max-width: 100%; }
						.activity .entry > icon {
							position: absolute; top: 7px; font-size: 24px; float: inline-start;
							width: 50px; height: 50px; margin-inline-start: -72px;
							line-height: 39px; text-align: center; background-color: #d59120;
							border: 3px solid #262421; border-radius: 50%; color: #fff;
						}
						.activity score { margin-left: auto; font-size: .7em; display: flex; gap: 8px; }
						.activity score > * { display: flex; gap: 4px; align-items: center; }
						@media (max-width: 799px) { .activity section { margin-inline-end: 2em; } }
						@media (min-width: 500px) {
							.activity .entries { margin: 0 50px; border-inline-start: 3px solid #d59120; }
							.activity .entry { padding-inline-start: 45px; }
						}
						.timeline .entry { padding: 8px 0; }
					</style><link rel="stylesheet" href="/styles.css">
					</head><body>
						<div class="activity"><section>
							<h2><time>Today</time></h2><div class="entries">
								<div class="entry"><icon data-icon="Z"></icon><div>Played 3 Blitz games</div>
									<score><win><strong>2</strong> wins</win><loss><strong>1</strong> loss</loss></score></div>
								<div class="entry"><icon data-icon="Y"></icon><div>Played 1 Rapid game</div>
									<score><win><strong>1</strong> win</win></score></div>
							</div>
						</section></div>
						<div class="timeline"><div class="entry">Homepage activity</div></div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#profile-activity-fixture').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(
					doc.querySelector('link')?.sheet?.cssRules.length || 0,
					'loaded built stylesheet'
				).to.be.greaterThan(0);
				expect(win.innerWidth).to.equal(width);
				const entries = doc.querySelector('.activity .entries');
				const spine = win.getComputedStyle(entries);
				const spineWidth = parseFloat(spine.borderInlineStartWidth);
				const hasSpine = width >= 500;
				expect(spineWidth > 0, 'responsive spine').to.equal(hasSpine);
				expect(spine.borderInlineEndWidth).to.equal('0px');
				for (const entry of entries.children) {
					const row = entry.getBoundingClientRect();
					const text = entry
						.querySelector('div')
						.getBoundingClientRect();
					const icon = entry.querySelector('icon');
					const style = win.getComputedStyle(icon);
					const bounds = icon.getBoundingClientRect();
					expect(bounds.width, 'rendered icon').to.be.greaterThan(0);
					expect(bounds.top).to.be.at.least(row.top);
					expect(bounds.bottom).to.be.at.most(row.bottom);
					expect(text.left).to.be.at.least(row.left);
					expect(text.right).to.be.at.most(row.right);
					expect(
						direction === 'rtl'
							? bounds.left - text.right
							: text.left - bounds.right,
						'icon separated from activity text'
					).to.be.greaterThan(0);
					expect(style.backgroundColor).to.equal(
						spine.borderInlineStartColor
					);
					if (hasSpine) {
						const rect = entries.getBoundingClientRect();
						const center =
							direction === 'rtl'
								? rect.right - spineWidth / 2
								: rect.left + spineWidth / 2;
						expect(
							bounds.left + bounds.width / 2,
							'icon centered on the spine'
						).to.be.closeTo(center, 1);
					}
				}
				const homepage = win.getComputedStyle(
					doc.querySelector('.timeline .entry')
				);
				expect(homepage.paddingTop).to.equal('0px');
				expect(homepage.paddingBottom).to.equal('0px');
				expect(homepage.paddingLeft).to.equal('10px');
				expect(homepage.paddingRight).to.equal('10px');
			});
		});
	});
});

describe('Test Explorer spacing stylesheet providers', () => {
	beforeEach(cy.startup);

	[
		{width: 1280, panelWidth: 280, ratingRows: 2},
		{width: 390, panelWidth: 320},
		{width: 1280, panelWidth: 480, ratingRows: 1},
	].forEach(({width, panelWidth, ratingRows}) => {
		it(`Contains choice labels in a ${panelWidth}px provider at ${width}px`, () => {
			cy.document().then((doc) => {
				const choices = (name, labels) =>
					`<section class="${name}"><label>${name}</label><div class="choices">` +
					labels
						.map(
							(label, index) =>
								`<button aria-pressed="${
									index > 0
								}">${label}</button>`
						)
						.join('') +
					'</div></section>';
				const speeds = choices(
					'speed',
					['U', 'B', 'Z', 'R', 'C', 'M'].map(
						(icon) => `<icon data-icon="${icon}"></icon>`
					)
				);
				const frame = doc.createElement('iframe');
				frame.id = 'explorer-spacing-provider';
				frame.style.cssText =
					`width: ${width}px; height: 800px; border: 0; ` +
					'max-width: none; flex-shrink: 0;';
				// Layout provider from lila 178a998d's explorer/_config.scss,
				// _explorer.scss and lib/css/base; not signed-in/native UI.
				frame.srcdoc = `<!doctype html>
					<html><head>
						<style>
							*, *::before, *::after {
								box-sizing: border-box;
								margin: 0;
								padding: 0;
							}
							html {
								font-size: clamp(12px, calc(12px + 2 * ((100vw - 300px) / 900)), 14px);
							}
							body { ---block-gap: 10px; }
							@media (min-width: 800px) {
								body { ---block-gap: 15px; }
							}
							button {
								appearance: none;
								background: none;
								border: none;
								font: inherit;
								text-align: inherit;
							}
							.explorer-box {
								position: relative;
								flex: 3 1 0;
								white-space: nowrap;
								overflow-x: hidden;
								overflow-y: auto;
								font-size: 0.9em;
								width: ${panelWidth}px;
							}
							.explorer__config section {
								margin: 0.4em var(---block-gap) 0;
							}
							.explorer__config label {
								font-weight: bold;
								display: block;
								line-height: 2em;
							}
							.explorer__config .choices { display: flex; }
							.explorer__config .choices button {
								flex-grow: 1;
								padding: 5px 0;
								text-align: center;
								border: 1px solid #888;
								border-width: 1px 0 1px 1px;
								text-transform: capitalize;
							}
							.explorer__config .choices button:last-child {
								border-right-width: 1px;
							}
							.explorer__config .choices button[aria-pressed='true'],
							.explorer__config .choices button.active {
								font-weight: bold;
							}
							.explorer__config .name > div {
								display: flex;
								align-items: center;
								flex-wrap: wrap;
							}
							.explorer__config .name .player-name {
								font-weight: bold;
								padding-inline: 1em;
								text-transform: none;
								margin-inline-end: 0.5em;
							}
							/* Local-font icon stand-ins, not native icon glyphs. */
							[data-icon]::before {
								font-family: 'Explorer Fixture Text';
								font-size: 1.2em;
								font-style: normal;
								font-weight: normal;
								vertical-align: middle;
								text-transform: none;
								content: attr(data-icon);
								opacity: 0.9;
								unicode-bidi: isolate;
							}
							.ordinary-settings .choices { display: flex; }
							.ordinary-settings button { padding: 5px 12px; }
						</style>
						<link rel="stylesheet" href="/styles.css">
						<style>
							/* Same bundled font, without extension-URL font faces. */
							@font-face {
								font-family: 'Explorer Fixture Text';
								font-weight: 400;
								src: url('/fonts/RedHatText-Regular.ttf');
							}
							@font-face {
								font-family: 'Explorer Fixture Text';
								font-weight: 700;
								src: url('/fonts/RedHatText-Bold.ttf');
							}
							html, body {
								font-family: 'Explorer Fixture Text', sans-serif !important;
							}
						</style>
					</head><body>
						<section class="explorer-box sub-box explorer__config">
							<div class="config"><div>
								${speeds}
								${choices('rating', [400, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500])}
							</div></div>
						</section>
						<section class="explorer-box sub-box explorer__config">
							<div class="config"><div class="player-db">
								<section class="name"><label>Player</label><div>
									<div class="choices"><button class="player-name active">ExamplePlayer</button></div>
								</div></section>
								${speeds}
								${choices('mode', ['Casual', 'Rated'])}
							</div></div>
						</section>
						<div class="ordinary-settings"><div class="config">
							<div class="choices"><button aria-pressed="true">Ordinary</button><button aria-pressed="false">Controls</button></div>
						</div></div>
					</body></html>`;
				doc.body.appendChild(frame);
			});
			cy.get('#explorer-spacing-provider')
				.should(($frame) => {
					const doc = $frame[0].contentDocument;
					expect(
						doc.querySelector('link')?.sheet?.cssRules.length || 0
					).to.be.greaterThan(0);
				})
				.then(($frame) => {
					const fonts = $frame[0].contentDocument.fonts;
					return fonts
						.load('12px "Explorer Fixture Text"')
						.then(() => fonts.ready);
				});
			cy.get('#explorer-spacing-provider').should(($frame) => {
				const doc = $frame[0].contentDocument;
				const win = $frame[0].contentWindow;
				expect(win.innerWidth).to.equal(width);
				const labelBounds = (button) => {
					const icon = button.querySelector('icon');
					if (icon) return icon.getBoundingClientRect();
					const range = doc.createRange();
					range.selectNodeContents(button);
					return range.getBoundingClientRect();
				};
				for (const group of doc.querySelectorAll(
					'.explorer__config .choices'
				)) {
					const groupBounds = group.getBoundingClientRect();
					const panel = group.closest('.explorer-box');
					const panelBounds = panel.getBoundingClientRect();
					expect(panelBounds.width).to.be.closeTo(panelWidth, 1);
					expect(groupBounds.left).to.be.at.least(panelBounds.left);
					expect(groupBounds.right).to.be.at.most(panelBounds.right);
					expect(group.scrollWidth).to.be.at.most(
						group.clientWidth + 1
					);
					let previous;
					const rows = new Set();
					for (const button of group.querySelectorAll('button')) {
						const bounds = button.getBoundingClientRect();
						const label = labelBounds(button);
						rows.add(Math.round(bounds.top));
						expect(bounds.left).to.be.at.least(groupBounds.left);
						expect(bounds.right).to.be.at.most(
							groupBounds.right + 1
						);
						expect(bounds.top).to.be.at.least(groupBounds.top);
						expect(bounds.bottom).to.be.at.most(
							groupBounds.bottom + 1
						);
						expect(label.width, button.outerHTML).to.be.greaterThan(
							0
						);
						expect(label.left - bounds.left).to.be.at.least(4.5);
						expect(bounds.right - label.right).to.be.at.least(4.5);
						expect(label.top).to.be.at.least(bounds.top - 1);
						expect(label.bottom).to.be.at.most(bounds.bottom + 1);
						if (
							previous &&
							Math.abs(previous.bounds.top - bounds.top) < 1
						) {
							expect(bounds.left).to.be.at.least(
								previous.bounds.right - 1
							);
							expect(
								label.left - previous.label.right
							).to.be.at.least(9);
						} else if (previous) {
							expect(bounds.top).to.be.at.least(
								previous.bounds.bottom - 1
							);
						}
						previous = {bounds, label};
					}
					if (group.closest('.rating') && ratingRows) {
						expect(rows.size, 'rating rows').to.equal(ratingRows);
					}
				}
				for (const button of doc.querySelectorAll(
					'.ordinary-settings button, .player-name'
				)) {
					const style = win.getComputedStyle(button);
					const inset = button.classList.contains('player-name')
						? parseFloat(style.fontSize)
						: 12;
					const bounds = button.getBoundingClientRect();
					const label = labelBounds(button);
					expect(label.left - bounds.left).to.be.closeTo(inset, 1);
					expect(bounds.right - label.right).to.be.closeTo(inset, 1);
				}
				expect(
					win.getComputedStyle(
						doc.querySelector('.ordinary-settings .choices')
					).flexWrap
				).to.equal('nowrap');
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

describe('Test optional custom pieces', () => {
	const names = [
		'wK',
		'wQ',
		'wR',
		'wB',
		'wN',
		'wP',
		'bK',
		'bQ',
		'bR',
		'bB',
		'bN',
		'bP',
	];
	let files;
	let nativeImage;

	function stored(win) {
		return JSON.parse(win.localStorage.getItem('local:pieceSet'));
	}

	function upload(selected = files) {
		cy.get('#pieceFiles').should('be.enabled').selectFile(selected);
	}

	function mountPieces() {
		cy.document().then((doc) => {
			nativeImage = `data:image/png;base64,${files[11].contents.toString(
				'base64'
			)}`;
			const fixture = doc.createElement('div');
			fixture.id = 'piece-fixture';
			fixture.innerHTML =
				'<div id="main-wrap" class="is2d"><cg-board><piece class="white king" data-name="wK"></piece></cg-board><div class="mini-board orientation-black"><cg-board><piece class="black knight" data-name="bN"></piece></cg-board></div><div id="promotion-choice"><piece class="white queen" data-name="wQ"></piece></div><div class="is3d"><piece class="white king"></piece></div></div><div class="is3d"><cg-board><piece class="black knight"></piece></cg-board></div>';
			doc.body.appendChild(fixture);
			const native = doc.createElement('style');
			native.textContent = `#piece-fixture piece { background-image: url("${nativeImage}"); }`;
			doc.head.appendChild(native);
			const script = doc.createElement('script');
			script.src = 'pieceContent.js';
			return new Cypress.Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
				doc.head.appendChild(script);
			});
		});
	}

	beforeEach(() => {
		cy.visit('http://localhost:8000/popup.html?pieces');
		cy.location('search').should('eq', '?pieces');
		cy.window().then((win) => {
			win.localStorage.clear();
			const canvas = win.document.createElement('canvas');
			canvas.width = canvas.height = 32;
			const context = canvas.getContext('2d');
			files = names.map((name, index) => {
				context.clearRect(0, 0, 32, 32);
				context.fillStyle = `hsl(${index * 30}, 80%, 50%)`;
				context.fillRect(8, 8, 16, 16);
				context.fillStyle = '#000';
				context.font = '8px sans-serif';
				context.fillText(name, 10, 20);
				return {
					contents: Cypress.Buffer.from(
						canvas.toDataURL('image/png').split(',')[1],
						'base64'
					),
					fileName: `${name}.png`,
					mimeType: 'image/png',
				};
			});
		});
		cy.reload();
		cy.get('#pieceFiles').should('be.enabled');
	});

	it('Imports atomically, opts in, persists and restores native pieces without changing other settings', () => {
		cy.window().then((win) => {
			win.localStorage.setItem('primaryColor', '#123456');
			win.localStorage.setItem('layoutPreference', 'lichess');
			win.localStorage.setItem('local:savedProfiles', 'keep me');
		});
		cy.get('#pieceSetSelect').should('have.value', 'native');
		upload();
		cy.get('#pieceStatus').should('contain.text', 'Upload saved');
		cy.get('#pieceSetSelect').should('have.value', 'native');
		cy.get('#piecePreview img').should('have.length', 12);
		cy.get('#piecePreviewLabel')
			.should('be.visible')
			.and('have.text', 'Saved upload (not active)');
		cy.get('#piecePreview img')
			.first()
			.should(($image) => {
				expect($image[0].naturalWidth).to.eq(32);
			})
			.then(($image) => {
				const canvas = $image[0].ownerDocument.createElement('canvas');
				canvas.width = canvas.height = 32;
				const context = canvas.getContext('2d');
				context.drawImage($image[0], 0, 0);
				expect(context.getImageData(0, 0, 1, 1).data[3]).to.eq(0);
				expect(context.getImageData(10, 10, 1, 1).data[3]).to.eq(255);
			});
		cy.get('#pieceSetSelect').select('uploaded');
		cy.get('#piecePreviewLabel').should('not.be.visible');
		cy.reload();
		cy.get('#pieceSetSelect').should('have.value', 'uploaded');
		cy.get('#pieceSetSelect').select('native');
		cy.get('#piecePreviewLabel').should('be.visible');
		cy.window().should((win) => {
			expect(stored(win).selection).to.eq('native');
			expect(Object.keys(stored(win).uploaded)).to.have.length(12);
			expect(win.localStorage.getItem('primaryColor')).to.eq('#123456');
			expect(win.localStorage.getItem('layoutPreference')).to.eq(
				'lichess'
			);
			expect(win.localStorage.getItem('local:savedProfiles')).to.eq(
				'keep me'
			);
		});
		cy.get('#pieceSetSelect').select('uploaded');
		cy.get('#deletePieces').click();
		cy.window().should((win) => expect(stored(win).uploaded).to.eq(null));
		cy.get('#pieceSetSelect').should('have.value', 'native');
		cy.get('#piecePreview img').should('not.exist');
		cy.get('#piecePreviewLabel').should('not.be.visible');
	});

	it('Rejects incomplete, duplicate, disguised, oversized and damaged PNGs without replacing the active set', () => {
		upload();
		cy.get('#pieceStatus').should('contain.text', 'Upload saved');
		cy.get('#pieceSetSelect').select('uploaded');
		cy.window().then((win) => {
			const previous = stored(win);
			const tooWide = Cypress.Buffer.from(files[0].contents);
			tooWide.writeUInt32BE(1024, 16);
			const animated = Cypress.Buffer.concat([
				files[0].contents.subarray(0, 33),
				Cypress.Buffer.from([
					0, 0, 0, 8, 97, 99, 84, 76, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
					0,
				]),
				files[0].contents.subarray(33),
			]);
			const invalid = [
				{
					name: 'missing bP.png',
					selected: files.slice(0, 11),
					message: 'Choose all 12 PNG files',
				},
				{
					name: 'duplicate wQ.png',
					selected: [files[1], ...files.slice(1)],
					message: 'Use each documented filename exactly once',
				},
				{
					name: 'SVG disguised as PNG',
					selected: [
						{...files[0], contents: Cypress.Buffer.from('<svg/>')},
						...files.slice(1),
					],
					message: 'Only PNG images are supported',
				},
				{
					name: 'file exceeds 128 KiB',
					selected: [
						{
							...files[0],
							contents: Cypress.Buffer.alloc(128 * 1024 + 1),
						},
						...files.slice(1),
					],
					message: 'no larger than 128 KiB',
				},
				{
					name: 'truncated PNG header',
					selected: [
						{
							...files[0],
							contents: files[0].contents.subarray(0, 24),
						},
						...files.slice(1),
					],
					message: 'Incomplete PNG data',
				},
				{
					name: '1024-pixel PNG width',
					selected: [
						{...files[0], contents: tooWide},
						...files.slice(1),
					],
					message: 'Each PNG must be square',
				},
				{
					name: 'animated PNG',
					selected: [
						{...files[0], contents: animated},
						...files.slice(1),
					],
					message: 'Animated PNGs are not supported',
				},
			];
			for (const {name, selected, message} of invalid) {
				cy.log(name);
				upload(selected);
				cy.get('#pieceStatus')
					.should('be.visible')
					.and(($status) => {
						expect($status.attr('data-error'), name).to.eq('true');
						expect($status.text(), name).to.include(message);
					});
				cy.window().should((current) =>
					expect(stored(current), name).to.deep.eq(previous)
				);
				cy.get('#pieceSetSelect')
					.should('be.enabled')
					.and('have.value', 'uploaded');
				cy.get('#pieceStatus').should(
					'have.attr',
					'data-error',
					'true'
				);
			}
			cy.log('file read failure');
			cy.then(() => {
				cy.stub(
					win.FileReader.prototype,
					'readAsArrayBuffer'
				).callsFake(function () {
					this.onerror();
				});
			});
			upload();
			cy.get('#pieceStatus')
				.should('be.visible')
				.and('have.attr', 'data-error', 'true')
				.and('contain.text', 'Could not read');
			cy.window().should((current) =>
				expect(stored(current)).to.deep.eq(previous)
			);
		});
	});

	it('Shows storage failures and keeps the previous set', () => {
		upload();
		cy.get('#pieceStatus').should('contain.text', 'Upload saved');
		cy.get('#pieceSetSelect').select('uploaded');
		cy.window().then((win) => {
			win.pieceStorageError = true;
		});
		cy.get('#pieceSetSelect').select('native');
		cy.get('#pieceStatus').should('contain.text', 'Could not save');
		cy.get('#pieceSetSelect').should('have.value', 'uploaded');
		upload();
		cy.get('#pieceStatus').should('contain.text', 'Could not save');
		cy.window().should((win) =>
			expect(stored(win).selection).to.eq('uploaded')
		);
	});

	it('Updates rendered pieces live, includes promotions and mini boards, and leaves 3D native', () => {
		mountPieces();
		cy.get('#prettierlichess-pieces').should('not.exist');
		upload();
		cy.get('#pieceStatus').should('contain.text', 'Upload saved');
		cy.get('#prettierlichess-pieces').should('not.exist');
		cy.get('#pieceSetSelect').select('uploaded');
		cy.get('#prettierlichess-pieces').should('exist');
		cy.window().then((win) => {
			cy.get('#piece-fixture piece[data-name]').each(($piece) => {
				expect($piece.css('background-image')).to.eq(
					`url("${stored(win).uploaded[$piece.attr('data-name')]}")`
				);
			});
		});
		cy.get('#piece-fixture .is3d piece').each(($piece) => {
			expect($piece.css('background-image')).to.eq(
				`url("${nativeImage}")`
			);
		});
		cy.get('#main-wrap').invoke('attr', 'class', 'is3d');
		cy.get('#piece-fixture piece').each(($piece) => {
			expect($piece.css('background-image')).to.eq(
				`url("${nativeImage}")`
			);
		});
		cy.get('#main-wrap').invoke('attr', 'class', 'is2d');
		cy.get('#pieceSetSelect').select('native');
		cy.get('#prettierlichess-pieces').should('not.exist');
		cy.get('#piece-fixture piece').each(($piece) => {
			expect($piece.css('background-image')).to.eq(
				`url("${nativeImage}")`
			);
		});
	});

	it('Rejects incomplete, corrupt and undecodable restored images before overriding native pieces', () => {
		cy.then(() => {
			const corrupt = Cypress.Buffer.from(files[0].contents);
			corrupt[corrupt.length - 17] ^= 1;
			for (const bytes of [
				files[0].contents.subarray(0, 24),
				files[0].contents.subarray(0, files[0].contents.length - 12),
				corrupt,
			]) {
				cy.window().then((win) => {
					win.localStorage.setItem(
						'local:pieceSet',
						JSON.stringify({
							version: 1,
							selection: 'uploaded',
							uploaded: Object.fromEntries(
								names.map((name) => [
									name,
									`data:image/png;base64,${bytes.toString(
										'base64'
									)}`,
								])
							),
						})
					);
				});
				cy.reload();
				mountPieces();
				cy.get('#pieceStatus').should(
					'contain.text',
					'Saved pieces are invalid'
				);
				cy.get('#pieceSetSelect').should('have.value', 'native');
				cy.get('#prettierlichess-pieces').should('not.exist');
				cy.get('#piece-fixture piece').each(($piece) => {
					expect($piece.css('background-image')).to.eq(
						`url("${nativeImage}")`
					);
				});
			}
		});
		cy.window().then((win) => {
			cy.stub(win.HTMLImageElement.prototype, 'decode')
				.rejects(new Error('Image decode failed'))
				.as('decodeFailure');
			win.chrome.storage.local.set(
				{
					pieceSet: {
						version: 1,
						selection: 'uploaded',
						uploaded: Object.fromEntries(
							files.map((file, index) => [
								names[index],
								`data:image/png;base64,${file.contents.toString(
									'base64'
								)}`,
							])
						),
					},
				},
				() => {}
			);
		});
		cy.get('@decodeFailure').should('have.been.called');
		cy.get('#pieceSetSelect')
			.should('be.enabled')
			.and('have.value', 'native');
		cy.get('#pieceStatus').should(
			'contain.text',
			'Saved pieces are invalid'
		);
		cy.get('#prettierlichess-pieces').should('not.exist');
	});

	it('Keeps the latest selection when older image decoding finishes later', () => {
		let release;
		let holding = true;
		mountPieces();
		cy.window().then((win) => {
			const pending = new Cypress.Promise((resolve) => {
				release = resolve;
			});
			cy.stub(win.HTMLImageElement.prototype, 'decode')
				.callsFake(() =>
					holding ? pending : Cypress.Promise.resolve()
				)
				.as('decodeGate');
			win.chrome.storage.local.set(
				{
					pieceSet: {
						version: 1,
						selection: 'uploaded',
						uploaded: Object.fromEntries(
							files.map((file, index) => [
								names[index],
								`data:image/png;base64,${file.contents.toString(
									'base64'
								)}`,
							])
						),
					},
				},
				() => {}
			);
		});
		cy.get('@decodeGate').should('have.been.called');
		cy.window().then((win) => {
			win.chrome.storage.local.set(
				{
					pieceSet: {version: 1, selection: 'native', uploaded: null},
				},
				() => {}
			);
		});
		cy.get('#pieceSetSelect')
			.should('be.enabled')
			.and('have.value', 'native');
		cy.then(() => {
			holding = false;
			release();
		});
		cy.get('@decodeGate').should('have.callCount', 24);
		cy.get('#pieceSetSelect').should('have.value', 'native');
		cy.get('#prettierlichess-pieces').should('not.exist');
		cy.get('#piece-fixture piece').each(($piece) => {
			expect($piece.css('background-image')).to.eq(
				`url("${nativeImage}")`
			);
		});
	});

	it('Keeps Eyes selected while adding, replacing and deleting an inactive upload', () => {
		cy.get('#eyesAttribution').should('not.be.visible');
		cy.get('#pieceSetSelect').select('eyes');
		cy.get('#eyesAttribution').should('be.visible');
		cy.get('#piecePreviewLabel').should('not.be.visible');
		cy.get('#piecePreview img')
			.should('have.length', 12)
			.each(($image) => {
				expect($image.attr('src')).to.include('/pieces/eyes/');
			});
		cy.get('#piecePreview img')
			.first()
			.should(($image) => {
				expect($image[0].naturalWidth).to.be.greaterThan(0);
			});
		cy.window().should((win) => expect(stored(win).uploaded).to.eq(null));
		upload();
		cy.get('#pieceFiles').should('be.enabled');
		cy.get('#pieceSetSelect').should('have.value', 'eyes');
		cy.window().then((win) => {
			const previous = stored(win).uploaded;
			expect(Object.keys(previous)).to.have.length(12);
			upload(
				files.map((file, index) => ({
					...file,
					contents: files[(index + 1) % files.length].contents,
				}))
			);
			cy.get('#pieceFiles').should('be.enabled');
			cy.window().should((current) => {
				expect(stored(current).selection).to.eq('eyes');
				expect(stored(current).uploaded).not.to.deep.eq(previous);
			});
			cy.reload();
			cy.get('#pieceSetSelect').should('have.value', 'eyes');
		});
		cy.get('#eyesAttribution').should('be.visible');
		cy.get('#piecePreviewLabel').should('not.be.visible');
		cy.get('#pieceStatus').should(
			'not.contain.text',
			'Lichess pieces restored'
		);
		cy.get('#piecePreview img').each(($image) => {
			expect($image.attr('src')).to.include('/pieces/eyes/');
		});
		cy.window().then((win) => {
			const replacement = stored(win).uploaded;
			cy.get('#pieceSetSelect').select('native');
			cy.get('#eyesAttribution').should('not.be.visible');
			cy.get('#piecePreviewLabel').should('be.visible');
			cy.get('#pieceSetSelect').select('uploaded');
			cy.get('#eyesAttribution').should('not.be.visible');
			cy.get('#piecePreviewLabel').should('not.be.visible');
			cy.window().should((current) =>
				expect(stored(current).uploaded).to.deep.eq(replacement)
			);
		});
		cy.get('#pieceSetSelect').select('eyes');
		cy.get('#deletePieces').click();
		cy.get('#pieceFiles').should('be.enabled');
		cy.window().should((win) => {
			expect(stored(win).selection).to.eq('eyes');
			expect(stored(win).uploaded).to.eq(null);
		});
		cy.get('#pieceSetSelect').should('have.value', 'eyes');
		cy.get('#deletePieces').should('be.disabled');
		cy.get('#piecePreview img')
			.should('have.length', 12)
			.each(($image) => {
				expect($image.attr('src')).to.include('/pieces/eyes/');
			});
		cy.get('#piecePreviewLabel').should('not.be.visible');
		cy.get('#eyesAttribution').should('be.visible');
		cy.get('#pieceStatus').should(
			'not.contain.text',
			'Lichess pieces restored'
		);
	});

	for (const outcome of ['success', 'failure']) {
		it(`Ignores superseded import ${outcome} after a storage update and newer selection`, () => {
			let release;
			let expected;
			let status;
			let input;
			cy.window().then((win) => {
				const read = win.FileReader.prototype.readAsArrayBuffer;
				cy.stub(
					win.FileReader.prototype,
					'readAsArrayBuffer'
				).callsFake(function (file) {
					if (!release) {
						release = () =>
							outcome === 'success'
								? read.call(this, file)
								: this.onerror();
					} else {
						read.call(this, file);
					}
				});
				cy.spy(win.HTMLCanvasElement.prototype, 'toDataURL').as(
					'importEncode'
				);
				expected = {
					version: 1,
					selection: 'uploaded',
					uploaded: Object.fromEntries(
						names.map((name, index) => [
							name,
							`data:image/png;base64,${files[
								(index + 1) % files.length
							].contents.toString('base64')}`,
						])
					),
				};
			});
			upload();
			cy.get('#pieceSetSelect').should('be.disabled');
			cy.window().then((win) => {
				win.chrome.storage.local.set(
					{
						pieceSet: {...expected, selection: 'native'},
					},
					() => {}
				);
			});
			cy.get('#pieceSetSelect').should('be.enabled').select('uploaded');
			cy.get('#pieceSetSelect').should('be.enabled');
			cy.get('#pieceStatus')
				.invoke('text')
				.then((text) => {
					status = text;
				});
			cy.get('#pieceFiles')
				.invoke('val')
				.then((value) => {
					input = value;
				});
			cy.then(() => release());
			if (outcome === 'success') {
				cy.get('@importEncode').should('have.callCount', 12);
			}
			cy.window().should((win) =>
				expect(stored(win)).to.deep.eq(expected)
			);
			cy.get('#pieceSetSelect')
				.should('be.enabled')
				.and('have.value', 'uploaded');
			cy.get('#pieceStatus').should(($status) => {
				expect($status.text()).to.eq(status);
				expect($status.attr('data-error')).to.eq('false');
			});
			cy.get('#pieceFiles').should(($files) => {
				expect($files.val()).to.eq(input);
				expect($files.prop('disabled')).to.eq(false);
			});
		});
	}
});
