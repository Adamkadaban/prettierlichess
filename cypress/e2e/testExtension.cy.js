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

	[390, 768, 1000].forEach((width) => {
		it(`Test mobile navigation scrolling at ${width}px`, () => {
			cy.viewport(width, 600);
			cy.get('#topnav').should(($nav) => {
				expect($nav[0].getBoundingClientRect().right).to.be.at.most(1);
			});
			cy.get('.hbg').click();
			cy.get('.topnav-toggle').should('be.checked');
			cy.get('#topnav')
				.should(($nav) => {
					const nav = $nav[0];
					const bounds = nav.getBoundingClientRect();
					const header = nav.ownerDocument.getElementById('top');
					expect(bounds.top).to.be.closeTo(
						header.getBoundingClientRect().bottom,
						1
					);
					expect(bounds.left).to.be.closeTo(0, 1);
					expect(bounds.bottom).to.be.at.most(600);
					expect(nav.scrollHeight).to.be.greaterThan(
						nav.clientHeight
					);
				})
				.scrollTo('bottom')
				.should(($nav) => {
					expect($nav[0].scrollTop).to.be.greaterThan(0);
				});
			cy.get('#topnav section:last-child div a')
				.last()
				.should('be.visible')
				.should(($link) => {
					const link = $link[0];
					const nav = link.closest('#topnav').getBoundingClientRect();
					const bounds = link.getBoundingClientRect();
					expect(bounds.top).to.be.at.least(nav.top);
					expect(bounds.bottom).to.be.at.most(nav.bottom);
				});
			cy.get('.hbg').click();
			cy.get('.topnav-toggle').should('not.be.checked');
			cy.get('#topnav').should(($nav) => {
				expect($nav[0].getBoundingClientRect().right).to.be.at.most(1);
			});
		});
	});

	it('Test desktop navigation above the mobile breakpoint', () => {
		cy.viewport(1020, 600);
		cy.get('.hbg').should('not.be.visible');
		cy.get('#topnav')
			.should('be.visible')
			.and('have.css', 'position', 'absolute')
			.and('have.css', 'transform', 'none');
	});
});
