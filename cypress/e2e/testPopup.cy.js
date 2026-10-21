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
					Cypress.env(NAMES[i], $color);
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
		cy.get('.pickr').eq(8).shouldHaveColor(Cypress.env('darkSquareColor'));
		cy.get('.pickr').eq(9).shouldHaveColor(Cypress.env('lightSquareColor'));
		cy.get('.pickr').eq(8).changeColor('#B406A6');
		cy.get('.pickr').eq(9).changeColor('#B406A6');
		cy.get('#hideBoardColors').click();
		cy.get('#hideBoardColors').click();
		cy.get('.pickr').eq(8).shouldHaveColor(Cypress.env('darkSquareColor'));
		cy.get('.pickr').eq(9).shouldHaveColor(Cypress.env('lightSquareColor'));
	});
});

describe('Test reset', () => {
	beforeEach(cy.startup);

	it('Test colors after reset', () => {
		cy.get('#resetButton').should('be.visible');
		cy.get('.pickr').changeColor('#000000', true);

		cy.get('#resetButton').click();

		for (let i = 0; i < NAMES.length; i++) {
			cy.get('.pickr').eq(i).shouldHaveColor(Cypress.env(NAMES[i]));
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
					.should('not.exist');
			});
		});
	});
	it('Test import with already set value', () => {
		const IMPORT_STRING = '{\n"primaryColor": "#18D329"\n}';

		cy.get('.pickr').first().changeColor('#c513c2');
		cy.get('.pickr').eq(0).changeColor('#c513c2');

		cy.inputFile(IMPORT_STRING);

		cy.get('.pickr').first().shouldHaveColor('#18D329');
		cy.get('.pickr').eq(1).shouldHaveColor(Cypress.env('secondaryColor'));
	});
	it('Test empty export', () => {
		const stub = cy.stub();
		cy.on('window:alert', stub);
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

	function stored(win) {
		return JSON.parse(win.localStorage.getItem('local:pieceSet'));
	}

	function upload(selected = files) {
		cy.get('#pieceFiles').selectFile(selected, {force: true});
	}

	beforeEach(() => {
		cy.visit('http://localhost:8000/popup.html?pieces');
		cy.window().then((win) => {
			win.localStorage.clear();
			const canvas = win.document.createElement('canvas');
			canvas.width = canvas.height = 32;
			const context = canvas.getContext('2d');
			context.fillStyle = '#ff0000';
			context.fillRect(8, 8, 16, 16);
			const contents = Cypress.Buffer.from(
				canvas.toDataURL('image/png').split(',')[1],
				'base64'
			);
			files = names.map((name) => ({
				contents,
				fileName: `${name}.png`,
				mimeType: 'image/png',
			}));
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
		cy.reload();
		cy.get('#pieceSetSelect').should('have.value', 'uploaded');
		cy.get('#pieceSetSelect').select('native');
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
		cy.get('#deletePieces').click();
		cy.window().should((win) => expect(stored(win).uploaded).to.eq(null));
		cy.get('#piecePreview img').should('not.exist');
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
				files.slice(0, 11),
				[files[1], ...files.slice(1)],
				[
					{...files[0], contents: Cypress.Buffer.from('<svg/>')},
					...files.slice(1),
				],
				[
					{
						...files[0],
						contents: Cypress.Buffer.alloc(128 * 1024 + 1),
					},
					...files.slice(1),
				],
				[
					{
						...files[0],
						contents: files[0].contents.subarray(0, 24),
					},
					...files.slice(1),
				],
				[{...files[0], contents: tooWide}, ...files.slice(1)],
				[{...files[0], contents: animated}, ...files.slice(1)],
			];
			for (const selected of invalid) {
				upload(selected);
				cy.get('#pieceStatus').should(
					'have.attr',
					'data-error',
					'true'
				);
				cy.window().should((current) =>
					expect(stored(current)).to.deep.eq(previous)
				);
				cy.get('#pieceSetSelect').should('have.value', 'uploaded');
			}
			cy.then(() => {
				cy.stub(
					win.FileReader.prototype,
					'readAsArrayBuffer'
				).callsFake(function () {
					this.onerror();
				});
			});
			upload();
			cy.get('#pieceStatus').should('contain.text', 'Could not read');
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
		cy.document().then((doc) => {
			doc.body.classList.add('is2d');
			const board = doc.createElement('div');
			board.innerHTML =
				'<cg-board><piece class="white king"></piece></cg-board><div class="mini-board orientation-black"><cg-board><piece class="black knight"></piece></cg-board></div><div id="promotion-choice"><piece class="white queen"></piece></div>';
			doc.body.appendChild(board);
			const script = doc.createElement('script');
			script.src = 'pieceContent.js';
			return new Cypress.Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
				doc.head.appendChild(script);
			});
		});
		cy.get('#prettierlichess-pieces').should('not.exist');
		upload();
		cy.get('#pieceStatus').should('contain.text', 'Upload saved');
		cy.get('#prettierlichess-pieces').should('not.exist');
		cy.get('#pieceSetSelect').select('uploaded');
		cy.get('piece').each(($piece) => {
			expect($piece.css('background-image')).to.include(
				'data:image/png;base64,'
			);
		});
		cy.document().then((doc) => doc.body.classList.replace('is2d', 'is3d'));
		cy.get('piece').should('have.css', 'background-image', 'none');
		cy.document().then((doc) => doc.body.classList.replace('is3d', 'is2d'));
		cy.get('#pieceSetSelect').select('native');
		cy.get('#prettierlichess-pieces').should('not.exist');
		cy.get('piece').should('have.css', 'background-image', 'none');
	});

	it('Opts into bundled artwork without overwriting the uploaded set', () => {
		cy.get('#pieceSetSelect').select('eyes');
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
		cy.get('#pieceStatus').should('contain.text', 'Upload saved');
		cy.get('#pieceSetSelect').should('have.value', 'native');
		cy.get('#pieceSetSelect').select('uploaded');
		cy.window().then((win) => {
			const previous = stored(win).uploaded;
			cy.get('#pieceSetSelect').select('eyes');
			cy.reload();
			cy.get('#pieceSetSelect').should('have.value', 'eyes');
			cy.get('#pieceSetSelect').select('native');
			cy.get('#pieceSetSelect').select('uploaded');
			cy.window().should((current) => {
				expect(stored(current).uploaded).to.deep.eq(previous);
				expect(stored(current).selection).to.eq('uploaded');
			});
		});
	});
});
