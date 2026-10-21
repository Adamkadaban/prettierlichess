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
	it('Test destination hit testing while dragging', () => {
		cy.visit(
			'https://lichess.org/analysis/standard/4k3/8/8/3p4/4P3/8/8/4K3_w_-_-_0_1'
		);
		cy.window().its('lichess.chessground').should('be.a', 'function');
		cy.window().then((win) => {
			const ground = win.lichess.chessground();
			const board = ground.state.dom.elements.board;
			const bounds = board.getBoundingClientRect();
			const from = {
				clientX: bounds.left + (bounds.width * 4.5) / 8,
				clientY: bounds.top + (bounds.height * 4.5) / 8,
			};
			const trustAllEvents = ground.state.trustAllEvents;
			ground.state.trustAllEvents = true;
			board.dispatchEvent(
				new win.MouseEvent('mousedown', {
					bubbles: true,
					buttons: 1,
					...from,
				})
			);
			ground.state.trustAllEvents = trustAllEvents;

			for (const file of [4.5, 3.5]) {
				const to = {
					clientX: bounds.left + (bounds.width * file) / 8,
					clientY: bounds.top + (bounds.height * 3.5) / 8,
				};
				cy.document().trigger('mousemove', {buttons: 1, ...to});
				cy.get('.main-board cg-board').should(() => {
					expect(ground.state.draggable.current.started).to.be.true;
					const destination = win.document.elementFromPoint(
						to.clientX,
						to.clientY
					);
					expect(destination.tagName).to.equal('SQUARE');
					expect(destination.classList.contains('move-dest')).to.be
						.true;
					expect(destination.classList.contains('oc')).to.equal(
						file === 3.5
					);
					expect(win.getComputedStyle(destination).cursor).to.equal(
						'grabbing'
					);
				});
			}
			cy.then(() => ground.cancelMove());
		});
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
});
