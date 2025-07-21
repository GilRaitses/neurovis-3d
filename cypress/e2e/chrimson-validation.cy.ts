/**
 * CHRIMSON Neuroglancer System Validation Tests
 * Takes screenshots of each feature to analyze working status
 */

describe('CHRIMSON Neuroglancer System', () => {
  beforeEach(() => {
    // Start with fresh page
    cy.visit('http://localhost:4200');
    cy.wait(2000); // Allow initial load
  });

  it('1. Frontend Loading - Should display main interface', () => {
    cy.screenshot('01-frontend-loading');
    
    // Check main components are present
    cy.get('mat-toolbar').should('contain', 'NeuroVis-3D');
    cy.get('mat-toolbar').should('contain', 'CHRIMSON');
    
    // Check dual panel layout
    cy.get('.content-grid').should('exist');
    cy.get('.left-panel').should('exist');
    cy.get('.right-panel').should('exist');
    
    cy.screenshot('01-frontend-loaded');
  });

  it('2. Python Backend Connection - Should connect to real FlyWire', () => {
    // Check Python Neuroglancer component
    cy.get('app-python-neuroglancer-viewer').should('exist');
    
    // Check connection status
    cy.get('.connection-status').should('exist');
    
    // Try to connect to backend
    cy.get('button').contains('Check Connection').click();
    cy.wait(3000); // Allow connection attempt
    
    cy.screenshot('02-backend-connection-attempt');
    
    // Check if backend is running
    cy.get('.connection-status').then(($status) => {
      if ($status.hasClass('connected')) {
        cy.screenshot('02-backend-connected');
      } else {
        cy.screenshot('02-backend-disconnected');
      }
    });
  });

  it('3. FEM Data Loading - Should load mechanosensory data', () => {
    // Check FEM data loader component
    cy.get('app-fem-data-loader').should('exist');
    
    // Try to load demo data
    cy.get('button').contains('Load Demo Data').click();
    cy.wait(2000);
    
    cy.screenshot('03-fem-data-loading');
    
    // Check if data loaded
    cy.get('.data-status').should('exist');
    cy.screenshot('03-fem-data-loaded');
  });

  it('4. CHRIMSON Circuit Search - Should find real circuits', () => {
    // Navigate to circuit search
    cy.get('button').contains('Search CHRIMSON Circuits').click();
    cy.wait(5000); // Allow time for real FlyWire query
    
    cy.screenshot('04-circuit-search-started');
    
    // Check for circuit results
    cy.get('.circuit-summary', { timeout: 10000 }).should('exist');
    cy.screenshot('04-circuit-search-results');
    
    // Check for specific circuit types
    cy.get('.summary-item').should('contain', 'REAL');
    cy.screenshot('04-circuit-types-found');
  });

  it('5. Neuroglancer Visualization - Should create 3D view', () => {
    // First ensure circuits are loaded
    cy.get('button').contains('Search CHRIMSON Circuits').click();
    cy.wait(5000);
    
    // Create visualization
    cy.get('button').contains('Create 3D View').click();
    cy.wait(8000); // Allow Neuroglancer to initialize
    
    cy.screenshot('05-neuroglancer-creation-started');
    
    // Check for Neuroglancer iframe
    cy.get('.neuroglancer-iframe', { timeout: 15000 }).should('exist');
    cy.screenshot('05-neuroglancer-iframe-loaded');
    
    // Check overlay controls
    cy.get('.overlay-controls').should('exist');
    cy.screenshot('05-neuroglancer-controls');
  });

  it('6. Behavioral Arena - Should display larval simulation', () => {
    // Check behavioral arena component
    cy.get('app-behavioral-arena').should('exist');
    
    cy.screenshot('06-behavioral-arena-loaded');
    
    // Check Three.js canvas
    cy.get('canvas').should('exist');
    cy.screenshot('06-threejs-canvas');
    
    // Check simulation controls
    cy.get('.simulation-controls').should('exist');
    cy.screenshot('06-simulation-controls');
  });

  it('7. CHRIMSON Activity Simulation - Should respond to red light', () => {
    // Load FEM data first
    cy.get('button').contains('Load Demo Data').click();
    cy.wait(2000);
    
    // Enable optogenetic stimulus
    cy.get('input[type="checkbox"]').contains('Optogenetic').check();
    cy.screenshot('07-optogenetic-enabled');
    
    // Start simulation
    cy.get('button').contains('Start Simulation').click();
    cy.wait(3000);
    
    cy.screenshot('07-chrimson-simulation-active');
    
    // Check for red light indicator
    cy.get('.stimulus-indicator').should('contain', 'Red Light');
    cy.screenshot('07-red-light-active');
  });

  it('8. Real-time Synchronization - Should sync between panels', () => {
    // Load data and start simulation
    cy.get('button').contains('Load Demo Data').click();
    cy.wait(2000);
    
    // Search circuits
    cy.get('button').contains('Search CHRIMSON Circuits').click();
    cy.wait(5000);
    
    // Create visualization
    cy.get('button').contains('Create 3D View').click();
    cy.wait(8000);
    
    // Start simulation
    cy.get('button').contains('Start Simulation').click();
    cy.wait(2000);
    
    cy.screenshot('08-full-system-active');
    
    // Check activity updates
    cy.get('.activity-indicator').should('exist');
    cy.screenshot('08-activity-updates');
    
    // Check timeline synchronization
    cy.get('.timeline-control').should('exist');
    cy.screenshot('08-timeline-sync');
  });

  it('9. Health Status - Should show system health', () => {
    // Check health component
    cy.get('app-health').should('exist');
    
    cy.screenshot('09-health-component');
    
    // Check system status indicators
    cy.get('.health-indicator').should('exist');
    cy.screenshot('09-health-status');
    
    // Check error handling
    cy.get('.error-status').should('exist');
    cy.screenshot('09-error-handling');
  });

  it('10. Full Integration Test - Complete workflow', () => {
    cy.screenshot('10-integration-start');
    
    // 1. Load FEM data
    cy.get('button').contains('Load Demo Data').click();
    cy.wait(2000);
    cy.screenshot('10-step1-data-loaded');
    
    // 2. Search circuits
    cy.get('button').contains('Search CHRIMSON Circuits').click();
    cy.wait(5000);
    cy.screenshot('10-step2-circuits-found');
    
    // 3. Create visualization
    cy.get('button').contains('Create 3D View').click();
    cy.wait(8000);
    cy.screenshot('10-step3-visualization-created');
    
    // 4. Enable CHRIMSON
    cy.get('input[type="checkbox"]').contains('Optogenetic').check();
    cy.screenshot('10-step4-chrimson-enabled');
    
    // 5. Start simulation
    cy.get('button').contains('Start Simulation').click();
    cy.wait(3000);
    cy.screenshot('10-step5-simulation-running');
    
    // 6. Verify full system
    cy.get('.neuroglancer-iframe').should('exist');
    cy.get('canvas').should('exist');
    cy.get('.activity-indicator').should('exist');
    cy.screenshot('10-full-integration-complete');
  });
}); 