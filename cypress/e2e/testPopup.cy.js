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
		cy.get('.pickr').eq(1).shouldHaveColor(Cypress.env('secondaryColor'));
	});
	it('Test empty export', () => {
		const stub = cy.stub();
		cy.on('window:alert', stub);
		cy.window().then((win) => win.localStorage.clear());
		cy.reload();
		cy.get('#exportButton').click();

		cy.then(() => {
			expect(stub.getCall(0)).to.be.calledWith(
				'No custom colors have been set.'
			);
		});
	});
});

describe('Test saved color profiles', () => {
	beforeEach(() => {
		cy.visit('localhost:8000');
		cy.get('#profileControls').should('not.be.disabled');
	});

	function openProfiles() {
		cy.get('#savedProfiles > summary').click();
	}

	function saveProfile(name) {
		cy.get('#profileName').clear().type(name);
		cy.get('#saveProfile').click();
		cy.get('#profileStatus').should('have.text', `Saved “${name}”.`);
	}

	function savedProfiles(win) {
		return JSON.parse(win.localStorage.getItem('local:savedColorProfiles'));
	}

	it('Restores rendered arrow defaults from a fresh-storage snapshot', () => {
		cy.request('http://localhost:8000/styles.css').then(({body}) => {
			const secondary = body
				.match(/--arrowSecondary:\s*(#[0-9a-f]+)/i)[1]
				.toUpperCase();
			const tertiary = body
				.match(/--arrowTertiary:\s*(#[0-9a-f]+)/i)[1]
				.toUpperCase();
			cy.window().then((win) => {
				expect(win.localStorage.getItem('arrowSecondary')).to.equal(
					null
				);
				expect(win.localStorage.getItem('arrowTertiary')).to.equal(
					null
				);
			});
			openProfiles();
			saveProfile('Original defaults');
			cy.get('#boardTab').click();
			cy.get('.pickr').eq(14).shouldHaveColor(secondary);
			cy.get('.pickr').eq(15).shouldHaveColor(tertiary);
			cy.get('.pickr').eq(14).changeColor('#112233');
			cy.get('.pickr').eq(15).changeColor('#445566');
			saveProfile('Changed arrows');
			cy.window().then((win) => {
				cy.spy(win.Storage.prototype, 'setItem').as('profileWrites');
			});
			cy.get('#profileSelect').select('Original defaults');
			cy.get('#profileStatus').should(
				'have.text',
				'Applied “Original defaults”.'
			);
			cy.get('.pickr').eq(14).shouldHaveColor(secondary);
			cy.get('.pickr').eq(15).shouldHaveColor(tertiary);
			cy.get('@profileWrites').should('have.callCount', 17);
			cy.window().then((win) => {
				expect(
					JSON.parse(
						win.localStorage.getItem('arrowSecondary')
					).toUpperCase()
				).to.equal(secondary);
				expect(
					JSON.parse(
						win.localStorage.getItem('arrowTertiary')
					).toUpperCase()
				).to.equal(tertiary);
			});
		});
	});

	it('Saves complete palettes and switches without reloading the popup', () => {
		cy.get('#savedProfiles').should('not.have.attr', 'open');
		cy.get('#saveProfile').should('not.be.visible');
		cy.get('.pickr').first().changeColor('#123456');
		openProfiles();
		saveProfile('Forest');
		cy.window().then((win) => {
			const [profile] = savedProfiles(win);
			expect(profile.colors.primaryColor).to.equal('#123456');
			expect(Object.keys(profile.colors)).to.have.length(17);
			expect(profile.colors.backgroundColor).to.equal('#272a2c');
			expect(profile.colors.preMove).to.equal('#1b7cc733');
			win.profileTestMarker = true;
		});

		cy.get('.pickr').first().changeColor('#654321');
		cy.get('.pickr').eq(3).changeColor('#222222');
		saveProfile('Night');
		cy.get('#profileSelect').select('Forest');
		cy.get('#profileStatus').should('have.text', 'Applied “Forest”.');
		cy.get('.pickr').first().shouldHaveColor('#123456');
		cy.get('.pickr').eq(3).shouldHaveColor('#272A2C');
		cy.get('#profileSelect').select('Night');
		cy.get('.pickr').first().shouldHaveColor('#654321');
		cy.get('.pickr').eq(3).shouldHaveColor('#222222');
		cy.window().its('profileTestMarker').should('eq', true);

		cy.reload();
		openProfiles();
		cy.get('#profileSelect').select('Forest');
		cy.get('.pickr').first().shouldHaveColor('#123456');
	});

	it('Preserves all preferences and honors native or custom board mode', () => {
		cy.get('#boardTab').click();
		cy.get('.pickr').eq(8).changeColor('#334455');
		openProfiles();
		saveProfile('Custom board');
		cy.window().then((win) => {
			win.localStorage.setItem(
				'layoutPreference',
				JSON.stringify('lichess')
			);
			win.localStorage.setItem('streamerMode', 'true');
			win.localStorage.setItem('defaultBoardSwitch', 'true');
			win.localStorage.setItem('boardDark', JSON.stringify('#FFFFFF00'));
			win.localStorage.setItem('boardLight', JSON.stringify('#FFFFFF00'));
			win.localStorage.setItem(
				'futurePreference',
				JSON.stringify({enabled: true})
			);
		});
		cy.reload();
		openProfiles();
		saveProfile('Native board');
		cy.get('#profileSelect').select('Custom board');
		cy.get('#profileStatus').should('have.text', 'Applied “Custom board”.');
		cy.window().then((win) => {
			expect(JSON.parse(win.localStorage.getItem('boardDark'))).to.equal(
				'#FFFFFF00'
			);
			expect(JSON.parse(win.localStorage.getItem('boardLight'))).to.equal(
				'#FFFFFF00'
			);
			expect(win.localStorage.getItem('defaultBoardSwitch')).to.equal(
				'true'
			);
			expect(
				JSON.parse(win.localStorage.getItem('layoutPreference'))
			).to.equal('lichess');
			expect(win.localStorage.getItem('streamerMode')).to.equal('true');
			expect(
				JSON.parse(win.localStorage.getItem('futurePreference'))
			).to.deep.equal({enabled: true});
			win.localStorage.setItem('defaultBoardSwitch', 'false');
		});
		cy.reload();
		openProfiles();
		cy.get('#profileSelect').select('Native board');
		cy.window().then((win) => {
			expect(JSON.parse(win.localStorage.getItem('boardDark'))).to.equal(
				'#71828F'
			);
		});
		cy.get('#profileSelect').select('Custom board');
		cy.window().then((win) => {
			expect(JSON.parse(win.localStorage.getItem('boardDark'))).to.equal(
				'#334455'
			);
			expect(win.localStorage.getItem('defaultBoardSwitch')).to.equal(
				'false'
			);
			expect(
				JSON.parse(win.localStorage.getItem('layoutPreference'))
			).to.equal('lichess');
			expect(win.localStorage.getItem('streamerMode')).to.equal('true');
			expect(
				JSON.parse(win.localStorage.getItem('futurePreference'))
			).to.deep.equal({enabled: true});
		});
	});

	it('Renames and deletes profiles without changing active colors', () => {
		const alert = cy.stub();
		cy.on('window:alert', alert);
		const confirm = cy.stub();
		confirm.onFirstCall().returns(false);
		confirm.onSecondCall().returns(true);
		cy.on('window:confirm', confirm);
		cy.get('.pickr').first().changeColor('#123456');
		openProfiles();
		saveProfile('Forest');
		cy.get('#profileName').clear().type('  Woodland  ');
		cy.get('#renameProfile').click();
		cy.get('#profileSelect').should('have.value', 'Woodland');
		cy.get('#profileSelect option').should('have.length', 2);
		cy.reload();
		openProfiles();
		cy.get('#profileSelect').select('Woodland');
		cy.get('#profileName').clear().type('woodland');
		cy.get('#saveProfile').click();
		cy.then(() =>
			expect(alert.lastCall.args[0]).to.contain('already exists')
		);
		cy.get('#profileName').clear().type(' ');
		cy.get('#renameProfile').click();
		cy.then(() =>
			expect(alert.lastCall.args[0]).to.contain('Enter a profile name')
		);
		cy.get('#deleteProfile').click();
		cy.get('#profileSelect').should('have.value', 'Woodland');
		cy.get('#deleteProfile').click();
		cy.get('#profileSelect option').should('have.length', 1);
		cy.get('#renameProfile').should('be.disabled');
		cy.get('#deleteProfile').should('be.disabled');
		cy.get('.pickr').first().shouldHaveColor('#123456');
		cy.window().then((win) => expect(savedProfiles(win)).to.deep.equal([]));
	});

	it('Keeps saved profiles when importing or resetting active colors', () => {
		cy.get('.pickr').first().changeColor('#123456');
		openProfiles();
		saveProfile('Original');
		cy.inputFile('{"primaryColor":"#ABCDEF"}');
		openProfiles();
		saveProfile('Imported');
		cy.get('#resetButton').click();
		openProfiles();
		cy.get('#profileSelect').select('Original');
		cy.get('.pickr').first().shouldHaveColor('#123456');
		cy.get('#profileSelect').select('Imported');
		cy.get('.pickr').first().shouldHaveColor('#ABCDEF');
		cy.window().then((win) => expect(savedProfiles(win)).to.have.length(2));
	});

	it('Rejects malformed saved data without overwriting it or active colors', () => {
		const alert = cy.stub();
		cy.on('window:alert', alert);
		const malformed = [
			{name: 'Broken', colors: {primaryColor: 'not a color'}},
		];
		cy.window().then((win) => {
			win.localStorage.setItem(
				'local:savedColorProfiles',
				JSON.stringify(malformed)
			);
		});
		cy.reload();
		cy.then(() =>
			expect(alert.lastCall.args[0]).to.contain('Invalid color')
		);
		openProfiles();
		cy.get('#profileName').type('New');
		cy.get('#saveProfile').click();
		cy.window().then((win) => {
			expect(savedProfiles(win)).to.deep.equal(malformed);
			expect(win.localStorage.getItem('primaryColor')).to.equal(null);
		});
	});

	it('Reports local quota and sync write failures without claiming success', () => {
		const alert = cy.stub();
		cy.on('window:alert', alert);
		cy.get('.pickr').first().changeColor('#123456');
		openProfiles();
		saveProfile('Forest');
		let write;
		cy.window().then((win) => {
			write = cy.stub(win.Storage.prototype, 'setItem').callsFake(() => {
				throw new Error('QUOTA_BYTES quota exceeded');
			});
		});
		cy.get('#profileName').clear().type('Night');
		cy.get('#saveProfile').click();
		cy.then(() => expect(alert.lastCall.args[0]).to.contain('QUOTA_BYTES'));
		cy.get('#profileStatus').should('be.empty');
		cy.window().then((win) => {
			expect(
				savedProfiles(win).map((profile) => profile.name)
			).to.deep.equal(['Forest']);
			write.restore();
		});
		cy.get('.pickr').first().changeColor('#654321');
		cy.window().then((win) => {
			write = cy.stub(win.Storage.prototype, 'setItem').callsFake(() => {
				throw new Error('Sync storage unavailable');
			});
		});
		cy.get('#profileSelect').select('Forest');
		cy.then(() =>
			expect(alert.lastCall.args[0]).to.contain(
				'Sync storage unavailable'
			)
		);
		cy.get('#profileStatus').should('be.empty');
		cy.get('.pickr').first().shouldHaveColor('#654321');
		cy.window().then((win) => {
			expect(
				JSON.parse(win.localStorage.getItem('primaryColor'))
			).to.equal('#654321');
			write.restore();
		});
	});
});
