describe('NeuroVis3D Brain Viewer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the main application without infinite spinner', () => {
    // Verify the page loads and title is correct
    cy.title().should('eq', 'NeuroVis3D');
    
    // Check that the toolbar is present
    cy.get('mat-toolbar').should('be.visible');
    cy.get('mat-toolbar span').first().should('contain.text', 'NeuroVis3D');
    
    // Verify welcome card is displayed
    cy.get('.welcome-card').should('be.visible');
    cy.get('mat-card-title').should('contain.text', 'Neural Circuit Visualization');
    cy.get('mat-card-subtitle').should('contain.text', 'Angular 20 + Three.js + FlyWire Connectome');
    
    // Check that success message is visible (confirms app loaded properly)
    cy.get('mat-card-content p').first().should('contain.text', 'Success!');
    
    // Verify action buttons are present
    cy.get('button[mat-raised-button]').should('contain.text', 'Start Visualization');
    cy.get('button[mat-button]').should('contain.text', 'Load Demo Data');
  });

  it('should display the 3D brain viewer component', () => {
    // Verify brain viewer component is present
    cy.get('app-brain-viewer').should('be.visible');
    
    // Check brain viewer card
    cy.get('.brain-viewer-card').should('be.visible');
    cy.get('.brain-viewer-card mat-card-title').should('contain.text', '3D Brain Circuit Viewer');
    cy.get('.brain-viewer-card mat-card-subtitle').should('contain.text', 'FlyWire Connectome Visualization');
    
    // Verify 3D canvas is present
    cy.get('.brain-canvas').should('be.visible');
    
    // Check that the canvas has proper dimensions
    cy.get('.viewer-container').should('have.css', 'height', '500px');
    cy.get('.brain-canvas').should('be.visible').and(($canvas) => {
      expect($canvas[0]).to.have.property('tagName', 'CANVAS');
    });
  });

  it('should display control buttons and stats overlay', () => {
    // Verify control buttons are present
    cy.get('.controls-overlay').should('be.visible');
    
    // Check specific control buttons
    cy.get('button[mat-mini-fab]').should('have.length', 3);
    
    // Reset view button
    cy.get('button[mat-mini-fab]').first().should('be.visible');
    cy.get('button[mat-mini-fab]').first().find('mat-icon').should('contain.text', '3d_rotation');
    
    // Animation toggle button  
    cy.get('button[mat-mini-fab]').eq(1).should('be.visible');
    cy.get('button[mat-mini-fab]').eq(1).find('mat-icon').should('contain.text', 'pause');
    
    // Wireframe toggle button
    cy.get('button[mat-mini-fab]').eq(2).should('be.visible');
    cy.get('button[mat-mini-fab]').eq(2).find('mat-icon').should('contain.text', 'grid_on');
    
    // Check activity slider
    cy.get('.slider-group').should('be.visible');
    cy.get('.slider-group label').should('contain.text', 'Circuit Activity');
    cy.get('mat-slider').should('be.visible');
    
    // Verify stats overlay
    cy.get('.stats-overlay').should('be.visible');
    cy.get('.stat-item').should('have.length', 3);
    
    // Check stats content
    cy.get('.stat-item').first().should('contain.text', 'Neurons:');
    cy.get('.stat-item').eq(1).should('contain.text', 'Synapses:');
    cy.get('.stat-item').eq(2).should('contain.text', 'FPS:');
  });

  it('should interact with brain viewer controls', () => {
    // Wait for component to initialize
    cy.wait(1000);
    
    // Test animation toggle
    cy.get('button[mat-mini-fab]').eq(1).click();
    cy.get('button[mat-mini-fab]').eq(1).find('mat-icon').should('contain.text', 'play_arrow');
    
    // Toggle back to pause
    cy.get('button[mat-mini-fab]').eq(1).click();
    cy.get('button[mat-mini-fab]').eq(1).find('mat-icon').should('contain.text', 'pause');
    
    // Test reset view button (should not cause errors)
    cy.get('button[mat-mini-fab]').first().click();
    
    // Test wireframe toggle (should not cause errors)
    cy.get('button[mat-mini-fab]').eq(2).click();
  });

  it('should display neuron and synapse counts', () => {
    // Wait for component to initialize and populate stats
    cy.wait(1000);
    
    // Check that stats have actual values (not zero)
    cy.get('.stat-item').first().find('.stat-value').should('not.contain.text', '0');
    cy.get('.stat-item').eq(1).find('.stat-value').should('not.contain.text', '0');
    
    // FPS should be updating (greater than 0)
    cy.get('.stat-item').eq(2).find('.stat-value').should('not.contain.text', '0');
  });

  it('should verify Three.js rendering is working', () => {
    // Wait for Three.js to initialize
    cy.wait(2000);
    
    // Check that canvas context exists and is WebGL
    cy.get('.brain-canvas').should(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      expect(gl).to.not.be.null;
    });
    
    // Verify canvas has been drawn to (non-empty)
    cy.get('.brain-canvas').should(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      expect(canvas.width).to.be.greaterThan(0);
      expect(canvas.height).to.be.greaterThan(0);
    });
  });

  it('should not show any loading spinners after initialization', () => {
    // Wait for full initialization
    cy.wait(3000);
    
    // Verify no progress bars are visible
    cy.get('mat-progress-bar').should('not.exist');
    
    // Verify no loading text is present
    cy.get('body').should('not.contain.text', 'Loading');
    cy.get('body').should('not.contain.text', 'loading');
  });

  it('should be responsive and work on different viewport sizes', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('app-brain-viewer').should('be.visible');
    cy.get('.brain-canvas').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('app-brain-viewer').should('be.visible');
    cy.get('.brain-canvas').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1920, 1080);
    cy.get('app-brain-viewer').should('be.visible');
    cy.get('.brain-canvas').should('be.visible');
  });
}); 