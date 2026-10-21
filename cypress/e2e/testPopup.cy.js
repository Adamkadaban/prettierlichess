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
					.should('eq', '#f5c276');
			});
		});
	});
	it('Test import with already set value', () => {
		const IMPORT_STRING = '{\n"primaryColor": "#18D329"\n}';

		cy.get('.pickr').first().changeColor('#c513c2');
		cy.get('.pickr').eq(0).changeColor('#c513c2');

		cy.inputFile(IMPORT_STRING);

		cy.get('.pickr').first().shouldHaveColor('#18D329');
		cy.get('.pickr')
			.eq(1)
			.shouldHaveColor(Cypress.expose('secondaryColor'));
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
