describe('Phase 1: Analytics with Real Data', () => {
  beforeEach(() => {
    cy.visit('/');
    // Analytics should be the default tab (selectedTab = 0)
  });

  it('should load and display real mechanosensation data', () => {
    // Verify the page loads
    cy.get('.app-container').should('be.visible');
    
    // Verify Analytics is the active tab
    cy.get('.mat-mdc-list-item.active').should('contain', 'Analytics');
    cy.get('.mat-mdc-list-item.active').should('contain', 'Mechanosensation data analysis');
    
    // Wait for data to load and verify real numbers appear
    cy.get('.stat-number').should('have.length.at.least', 3);
    
    // Verify real track count (53 from mechanosensation data)
    cy.get('.stat-card.excellent .stat-number').should('contain', '53');
    
    // Verify real reorientation count (1542 from data)
    cy.get('.stat-card.good .stat-number').should('contain', '1542');
    
    // Verify pipeline status
    cy.get('.stat-card.premium .stat-number').should('contain', 'COMPLETE');
    
    cy.screenshot('phase1-01-analytics-real-data');
  });

  it('should show correct terminology and remove fake elements', () => {
    // Verify "Analytics" instead of "FEM Analysis"
    cy.get('h1').should('contain', 'Analytics');
    cy.get('.panel-subtitle').should('contain', 'Mechanosensation analysis pipeline results');
    
    // Verify fake CHRIMSON and ML cards are removed
    cy.get('.stat-card').should('have.length', 3); // Should only have 3 cards now
    cy.get('.stat-label').should('not.contain', 'CHRIMSON Optogenetics');
    cy.get('.stat-label').should('not.contain', 'Self-Supervised Learning');
    
    // Verify only real data cards exist
    cy.get('.stat-label').should('contain', 'Trajectory Tracks');
    cy.get('.stat-label').should('contain', 'Reorientations');
    cy.get('.stat-label').should('contain', 'Pipeline Status');
    
    cy.screenshot('phase1-02-correct-terminology');
  });

  it('should display real data quality metrics', () => {
    // Wait for data to load
    cy.get('.metrics-section').should('be.visible');
    
    // Verify real metrics are shown
    cy.get('.metric-label').should('contain', 'Detection Confidence');
    cy.get('.metric-label').should('contain', 'Track Completeness');
    cy.get('.metric-label').should('contain', 'Mean Frequency');
    
    // Verify frequency value is real (should be around 0.0427 Hz)
    cy.get('.metric-row').contains('Mean Frequency').parent().find('.metric-value')
      .should('match', /0\.\d{4} Hz/);
    
    cy.screenshot('phase1-03-real-metrics');
  });

  it('should show track quality distribution from real data', () => {
    // Verify quality distribution card exists
    cy.get('.quality-distribution-card').should('be.visible');
    cy.get('.quality-distribution-card').should('contain', 'Track Quality Distribution');
    
    // Verify all quality categories are present
    cy.get('.quality-item.excellent').should('be.visible');
    cy.get('.quality-item.good').should('be.visible');
    cy.get('.quality-item.fair').should('be.visible');
    cy.get('.quality-item.poor').should('be.visible');
    
    // Verify quality counts add up to 53 total tracks
    cy.get('.quality-count').then($counts => {
      const total = Array.from($counts).reduce((sum, el) => sum + parseInt(el.textContent || '0'), 0);
      expect(total).to.equal(53);
    });
    
    cy.screenshot('phase1-04-quality-distribution');
  });

  it('should load data from real mechanosensation files', () => {
    // Verify the data loading process by checking console logs
    cy.window().then((win) => {
      // Check that the service was called (should be visible in console)
      cy.get('.stat-number').should('contain', '53'); // Confirms data loaded
    });
    
    // Verify experiment date is from real data (July 11, 2025)
    cy.get('.panel-subtitle').should('contain', 'July 11, 2025');
    
    // Verify methodology text is from real data
    cy.get('.stat-description').should('contain', 'Non-overlapping binning (corrected)');
    
    cy.screenshot('phase1-05-real-data-source');
  });

  it('should show progress bars with real calculated values', () => {
    // Verify progress bars are present and have real values
    cy.get('mat-progress-bar').should('have.length.at.least', 6);
    
    // All progress bars should have some value (not 0 or 100 for most)
    cy.get('mat-progress-bar').each($bar => {
      // Progress bars should be rendered (have value attribute)
      cy.wrap($bar).should('have.attr', 'ng-reflect-value');
    });
    
    cy.screenshot('phase1-06-progress-bars');
  });

  it('should not show loading state after data loads', () => {
    // Verify loading state is not visible after data loads
    cy.get('.loading-state').should('not.exist');
    
    // Verify all data sections are visible
    cy.get('.stats-grid').should('be.visible');
    cy.get('.metrics-section').should('be.visible');
    
    cy.screenshot('phase1-07-loaded-state');
  });

  it('should maintain responsive design with real data', () => {
    // Test desktop view
    cy.viewport(1920, 1080);
    cy.get('.stats-grid').should('be.visible');
    cy.get('.metrics-section').should('have.css', 'grid-template-columns');
    cy.screenshot('phase1-08-desktop-responsive');
    
    // Test tablet view
    cy.viewport(768, 1024);
    cy.get('.stats-grid').should('be.visible');
    cy.screenshot('phase1-09-tablet-responsive');
    
    // Test mobile view
    cy.viewport(375, 667);
    cy.get('.stats-grid').should('be.visible');
    cy.screenshot('phase1-10-mobile-responsive');
  });

  it('should validate data accuracy against whitepaper claims', () => {
    // Verify the numbers match what's documented in the whitepaper
    
    // Check tracks: should be 53 (from whitepaper)
    cy.get('.stat-card.excellent .stat-number').should('contain', '53');
    
    // Check reorientations: should be 1542 (from whitepaper)
    cy.get('.stat-card.good .stat-number').should('contain', '1542');
    
    // Check pipeline status: should be COMPLETE
    cy.get('.stat-card.premium .stat-number').should('contain', 'COMPLETE');
    
    // Check experiment date: should be 2025-07-11 from pipeline
    cy.get('.panel-subtitle').should('contain', '2025');
    
    cy.screenshot('phase1-11-whitepaper-validation');
  });
});

describe('Phase 1: Navigation and Other Tabs', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should maintain other tabs as placeholders for future phases', () => {
    // Click Track Management tab
    cy.contains('Track Management').click();
    cy.get('.track-id-manager-card').should('be.visible');
    cy.screenshot('phase1-12-track-management-placeholder');
    
    // Click Behavioral Arena tab
    cy.contains('Behavioral Arena').click();
    cy.get('.behavioral-arena-card').should('be.visible');
    cy.screenshot('phase1-13-behavioral-arena-placeholder');
    
    // Click Neural Circuits tab
    cy.contains('Neural Circuits').click();
    cy.get('.coming-soon-card').should('be.visible');
    cy.get('.coming-soon-card').should('contain', 'Neuroglancer Integration');
    cy.screenshot('phase1-14-neural-circuits-placeholder');
    
    // Return to Analytics
    cy.contains('Analytics').click();
    cy.get('.stats-grid').should('be.visible');
    cy.screenshot('phase1-15-back-to-analytics');
  });
}); 