describe('Optional desktop sidebar', () => {
	let settings;
	let changeSettings;

	function startSidebar(values = {}) {
		settings = {...values};
		cy.readFile('src/sidebar.js').then((source) => {
			cy.window().then((win) => {
				let onChanged;
				changeSettings = (changes) => {
					Object.assign(settings, changes);
					onChanged(
						Object.fromEntries(
							Object.entries(changes).map(([key, newValue]) => [
								key,
								{newValue},
							])
						),
						'sync'
					);
				};
				// Exercise the content script without changing extension storage.
				win.Function(
					'chrome',
					source
				)({
					storage: {
						sync: {
							get: (_, callback) => callback(settings),
							set: (values) => changeSettings(values),
						},
						onChanged: {
							addListener: (callback) => (onChanged = callback),
						},
					},
				});
			});
		});
	}

	beforeEach(() => {
		cy.viewport(1600, 1000);
		cy.visit('https://lichess.org/analysis');
		cy.window().its('site.analysis').should('exist');
	});

	it('Leaves the default layout untouched and restores it after toggling', () => {
		let columns;
		let side;
		cy.get('main.analyse').then(($main) => {
			columns = $main.css('grid-template-columns');
		});
		cy.get('.analyse__side').then(($side) => {
			side = $side[0];
		});
		startSidebar();
		cy.get('.pl-sidebar-toggle').should('not.exist');
		cy.get('html').should('not.have.class', 'pl-sidebar-collapsed');
		cy.then(() => changeSettings({collapsibleSidebar: true}));
		cy.get('.pl-sidebar-toggle')
			.should('have.attr', 'aria-expanded', 'true')
			.click()
			.should('have.attr', 'aria-expanded', 'false')
			.should('have.text', 'Show sidebar');
		cy.get('.analyse__side').should('not.be.visible');
		cy.get('.analyse__board, .analyse__controls, .analyse__tools').should(
			'be.visible'
		);
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(true));
		cy.get('.pl-sidebar-toggle').click();
		cy.get('.analyse__side')
			.should('be.visible')
			.then(($side) => expect($side[0]).to.equal(side));
		cy.get('main.analyse').should(($main) => {
			expect($main.css('grid-template-columns')).to.equal(columns);
		});
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(false));
	});

	it('Restores stacked layouts without overwriting the desktop choice', () => {
		startSidebar({
			collapsibleSidebar: true,
			sidebarCollapsed: true,
		});
		cy.get('.analyse__side').should('not.be.visible');
		cy.viewport(1000, 900);
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.be.visible');
		cy.viewport(390, 844);
		cy.get('.analyse__side').should('be.visible');
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(true));
		cy.viewport(1600, 1000);
		cy.get('.analyse__side').should('not.be.visible');
		cy.get('.pl-sidebar-toggle').should('be.visible');
		cy.then(() => changeSettings({collapsibleSidebar: false}));
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.exist');
		cy.then(() => changeSettings({collapsibleSidebar: true}));
		cy.get('.analyse__side').should('not.be.visible');
		cy.get('.pl-sidebar-toggle').should('be.visible');
	});

	it('Preserves focus when another page collapses a focused sidebar', () => {
		startSidebar({collapsibleSidebar: true});
		cy.get('.analyse__side a').first().focus();
		cy.then(() => changeSettings({sidebarCollapsed: true}));
		cy.get('.pl-sidebar-toggle').should('be.focused');
		cy.get('.analyse__side').should('not.be.visible');
		cy.then(() =>
			changeSettings({
				collapsibleSidebar: undefined,
				sidebarCollapsed: undefined,
			})
		);
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.exist');
	});

	it('Isolates activation keys from document shortcuts without cancelling defaults', () => {
		startSidebar({collapsibleSidebar: true});
		cy.get('.pl-sidebar-toggle').then(($button) => {
			const button = $button[0];
			const KeyboardEvent =
				button.ownerDocument.defaultView.KeyboardEvent;
			// Use a separate document so a regression cannot run live engine shortcuts.
			const doc =
				button.ownerDocument.implementation.createHTMLDocument();
			doc.body.append(button);
			const shortcuts = [];
			const phases = ['keydown', 'keypress', 'keyup'];
			for (const type of phases) {
				doc.addEventListener(type, (event) => {
					shortcuts.push(event.key);
					if (event.key === ' ' || event.key === 'Enter')
						event.preventDefault();
				});
			}
			for (const key of [' ', 'Enter']) {
				for (const type of phases) {
					const event = new KeyboardEvent(type, {
						key,
						bubbles: true,
						cancelable: true,
					});
					expect(button.dispatchEvent(event)).to.equal(true);
					expect(event.defaultPrevented).to.equal(false);
				}
			}
			expect(shortcuts).to.deep.equal([]);
			expect(button.getAttribute('aria-expanded')).to.equal('true');

			for (const type of phases) {
				button.dispatchEvent(
					new KeyboardEvent(type, {key: 'Tab', bubbles: true})
				);
			}
			expect(shortcuts).to.deep.equal(['Tab', 'Tab', 'Tab']);

			shortcuts.length = 0;
			const otherButton = doc.createElement('button');
			doc.body.append(otherButton);
			for (const key of [' ', 'Enter']) {
				for (const type of phases) {
					const event = new KeyboardEvent(type, {
						key,
						bubbles: true,
						cancelable: true,
					});
					expect(otherButton.dispatchEvent(event)).to.equal(false);
				}
			}
			expect(shortcuts).to.deep.equal([
				' ',
				' ',
				' ',
				'Enter',
				'Enter',
				'Enter',
			]);
		});
	});

	it('Keeps nested study chapters and chat intact while hidden', () => {
		cy.get('.analyse__side').then(($side) => {
			$side.append(
				'<div class="study__side" id="sidebar-study-fixture">' +
					'<div class="study__chapters"><button>Chapter one</button></div>' +
					'<div class="mchat"><input aria-label="Chat draft" value="Unsent message"></div>' +
					'</div>'
			);
		});
		startSidebar({collapsibleSidebar: true});
		cy.get('.pl-sidebar-toggle').click();
		cy.get('#sidebar-study-fixture').should('not.be.visible');
		cy.get('.pl-sidebar-toggle').click();
		cy.get('#sidebar-study-fixture .study__chapters').should('be.visible');
		cy.get('#sidebar-study-fixture input')
			.should('be.visible')
			.should('have.value', 'Unsent message');
	});

	it('Leaves game controls and the vertical layout button available', () => {
		cy.visit('https://lichess.org/tv');
		cy.get('.round__app').should('be.visible');
		startSidebar({
			collapsibleSidebar: true,
			sidebarCollapsed: true,
		});
		cy.get('.round__side').should('not.be.visible');
		cy.get('.round__app, .rcontrols, .streamerButton').should('be.visible');
		cy.get('.pl-sidebar-toggle').click();
		cy.get('.round__side').should('be.visible');
	});
});

describe('Test whole extension', () => {
	beforeEach(() => {
		cy.visit('https://lichess.org');
		// Send extension message to clear synced storage
		window.postMessage({type: 'cypress', command: 'sync.clear'}, '*');
		cy.reload();
		cy.on('uncaught:exception', (err, runnable) => {
			return false;
		});
	});

	it('Test injection', () => {
		cy.get('body').should(
			'have.css',
			'background-color',
			'rgb(39, 42, 44)'
		);
	});
	it('Opens navigation menus added after page load', () => {
		cy.document().then((doc) => {
			const section = doc.createElement('section');
			section.id = 'prettier-test-menu';
			section.innerHTML =
				'<a href="#menu">Extra menu</a> \n' +
				'<div role="group"><a href="/analysis">Analysis</a></div>';
			doc.querySelector('#topnav').appendChild(section);
		});
		cy.get('#prettier-test-menu > a').focus();
		cy.get('#prettier-test-menu > div')
			.should('be.visible')
			.should('have.css', 'opacity', '1');
		cy.get('#prettier-test-menu > div > a').focus();
		cy.get('#prettier-test-menu > div').should('be.visible');
		cy.get('#prettier-test-menu > div > a').blur();
		cy.get('#prettier-test-menu > div').should('have.css', 'opacity', '0');
	});
	it('Test vertical layout button', () => {
		cy.visit('https://lichess.org/tv');
		cy.get('.ruser.ruser-top')
			.first()
			.should('not.have.css', 'padding', '0px');
		cy.get('.button.streamerButton')
			.should('exist')
			.should('contain.text', 'Enable Vertical Layout')
			.click();
		cy.get('.ruser.ruser-top').first().should('have.css', 'padding', '0px');
		cy.get('.button.streamerButton')
			.should('exist')
			.should('contain.text', 'Disable Vertical Layout')
			.click();
	});
	it('Shows both sides of the evaluation gauge', () => {
		cy.visit('https://lichess.org/analysis');
		cy.window().its('site.analysis').should('exist');
		cy.window().then((win) => {
			win.site.analysis.node.eval = {cp: 400};
			win.site.analysis.redraw();
		});
		cy.get('.eval-gauge').should(($gauge) => {
			const background = $gauge.css('background-image');
			expect(background).to.include('rgb(26, 26, 26)');
			expect(background).to.include('rgb(225, 225, 225)');
		});
		cy.get('.eval-gauge').then(($gauge) => {
			for (const percent of [0, 25, 50, 75, 100]) {
				$gauge.css({
					transition: 'none',
					'--eval-percent': `${percent}%`,
				});
				expect($gauge.css('background-image')).to.include(
					`rgb(26, 26, 26) ${percent}%`
				);
				expect($gauge.css('background-image')).to.include(
					`rgb(225, 225, 225) ${percent}%`
				);
			}
		});
	});
});
