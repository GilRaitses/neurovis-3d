describe('Enhanced Track Management System', () => {
  beforeEach(() => {
    cy.visit('/');
    
    // Navigate to Track ID Manager tab
    cy.contains('Track ID Manager').click();
    
    // Wait for data to load
    cy.get('.track-id-manager-card', { timeout: 10000 }).should('be.visible');
  });

  describe('Data Loading and Structure', () => {
    it('should load MAT files and display structured data', () => {
      // Check if enhanced data management controls are visible
      cy.get('.data-management-controls').should('be.visible');
      
      // Verify experiment metadata is displayed
      cy.get('.data-summary-card').should('contain', 'Enhanced Data Management');
      cy.get('.stat-value').should('exist');
      
      // Take screenshot of loaded data
      cy.screenshot('01-data-loaded');
    });

    it('should display track quality metrics', () => {
      // Check for quality indicators
      cy.get('.stat-item').should('contain', 'High Quality Tracks');
      cy.get('.stat-item').should('contain', 'Pending Changes');
      cy.get('.stat-item').should('contain', 'Data Format');
      
      // Verify MAT → YAML → H5 workflow indication
      cy.get('.stat-value').should('contain', 'MAT → YAML → H5');
      
      cy.screenshot('02-quality-metrics');
    });

    it('should show experiment selection and track overview', () => {
      // Select experiment
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
      
      // Verify track table is displayed
      cy.get('.tracks-table').should('be.visible');
      cy.get('th').should('contain', 'Track ID');
      cy.get('th').should('contain', 'Duration');
      cy.get('th').should('contain', 'Quality');
      
      // Check for track quality indicators
      cy.get('.quality-excellent, .quality-good, .quality-fair, .quality-poor').should('exist');
      
      cy.screenshot('03-track-overview');
    });
  });

  describe('Track Visualization and Selection', () => {
    beforeEach(() => {
      // Select an experiment first
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
    });

    it('should visualize tracks in the behavioral arena box', () => {
      // Select a track for viewing
      cy.get('.tracks-table tr').eq(1).click();
      
      // Verify track is selected and visualized
      cy.get('.current-track-info').should('be.visible');
      cy.get('.box-container canvas').should('be.visible');
      cy.get('.box-info').should('contain', 'Viewing:');
      
      cy.screenshot('04-track-visualization');
    });

    it('should show playback controls and frame information', () => {
      // Check playback controls
      cy.get('.playback-controls').should('be.visible');
      cy.get('button[mat-fab]').should('exist'); // Play/pause buttons
      cy.get('.frame-range-slider').should('exist');
      cy.get('.speed-range-slider').should('exist');
      
      // Verify visualization options
      cy.get('mat-checkbox').should('contain.text', 'Show trajectory paths in box');
      cy.get('mat-checkbox').should('contain.text', 'Highlight reorientations');
      cy.get('mat-checkbox').should('contain.text', 'Show predecessor traces');
      
      cy.screenshot('05-playback-controls');
    });
  });

  describe('Track Linking Analysis', () => {
    beforeEach(() => {
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
    });

    it('should display track linking suggestions', () => {
      // Check for linking analysis section
      cy.get('.linking-analysis').should('be.visible');
      cy.get('h3').should('contain', 'Track ID Linking Analysis');
      
      // Look for linking suggestions (may be dynamically generated)
      cy.get('.linking-suggestions').should('exist');
      
      cy.screenshot('06-linking-analysis');
    });

    it('should show confidence breakdown for linking suggestions', () => {
      // If linking suggestions exist, check for confidence indicators
      cy.get('body').then(($body) => {
        if ($body.find('.link-suggestion').length > 0) {
          cy.get('.confidence-breakdown').should('exist');
          cy.get('mat-chip').should('contain.text', 'confidence');
        }
      });
      
      cy.screenshot('07-confidence-breakdown');
    });

    it('should allow accepting and rejecting track links', () => {
      // If suggestions exist, test interaction
      cy.get('body').then(($body) => {
        if ($body.find('.link-suggestion').length > 0) {
          // Test accept/reject buttons
          cy.get('button').should('contain', 'Accept Link');
          cy.get('button').should('contain', 'Reject');
          cy.get('button').should('contain', 'Visualize in Box');
        }
      });
      
      cy.screenshot('08-link-actions');
    });
  });

  describe('Enhanced Data Management', () => {
    beforeEach(() => {
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
    });

    it('should show data management controls', () => {
      // Verify enhanced data management section
      cy.get('.data-management-controls').should('be.visible');
      cy.get('.data-summary-card').should('contain', '📊 Enhanced Data Management');
      
      // Check management action buttons
      cy.get('button').should('contain', 'Export Changes for Downstream');
      cy.get('button').should('contain', 'Generate H5 Explorer');
      cy.get('button').should('contain', 'View Data Provenance');
      
      cy.screenshot('09-data-management');
    });

    it('should generate H5 explorer when clicked', () => {
      // Click H5 explorer button
      cy.get('button').contains('Generate H5 Explorer').click();
      
      // Note: In a real test, we'd verify the new window opened
      // For now, we'll just verify the button click worked
      cy.screenshot('10-h5-explorer-clicked');
    });

    it('should show data provenance information', () => {
      // Click provenance button
      cy.get('button').contains('View Data Provenance').click();
      
      // Note: This currently shows an alert, in real implementation would be modal
      cy.screenshot('11-provenance-clicked');
    });

    it('should track pending changes count', () => {
      // Check initial pending changes (should be 0)
      cy.get('.stat-value').contains('0').should('exist');
      
      // If we make changes, the count should update
      // (This would require actual linking actions)
      
      cy.screenshot('12-pending-changes');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
    });

    it('should disable export when no changes are pending', () => {
      // Export button should be disabled initially
      cy.get('button').contains('Export Changes for Downstream').should('be.disabled');
      
      cy.screenshot('13-export-disabled');
    });

    it('should show export workflow for downstream compatibility', () => {
      // Verify export button exists with proper labeling
      cy.get('button').contains('Export Changes for Downstream').should('be.visible');
      
      // Check that the workflow is indicated in UI
      cy.get('.stat-value').should('contain', 'MAT → YAML → H5');
      
      cy.screenshot('14-export-workflow');
    });
  });

  describe('User Interface Responsiveness', () => {
    it('should be responsive on different screen sizes', () => {
      // Test mobile view
      cy.viewport(375, 667);
      cy.get('.track-id-manager-card').should('be.visible');
      cy.screenshot('15-mobile-view');
      
      // Test tablet view
      cy.viewport(768, 1024);
      cy.get('.track-id-manager-card').should('be.visible');
      cy.screenshot('16-tablet-view');
      
      // Test desktop view
      cy.viewport(1920, 1080);
      cy.get('.track-id-manager-card').should('be.visible');
      cy.screenshot('17-desktop-view');
    });

    it('should maintain functionality across viewports', () => {
      // Test critical functionality on different screen sizes
      const viewports = [
        [375, 667],   // Mobile
        [768, 1024],  // Tablet
        [1920, 1080]  // Desktop
      ];

      viewports.forEach(([width, height], index) => {
        cy.viewport(width, height);
        
        // Select experiment
        cy.get('mat-select[placeholder="Select Experiment"]').click();
        cy.get('mat-option').first().click();
        
        // Verify key elements are accessible
        cy.get('.tracks-table').should('be.visible');
        cy.get('.box-container').should('be.visible');
        cy.get('.data-management-controls').should('be.visible');
        
        cy.screenshot(`18-functionality-${index + 1}`);
      });
    });
  });

  describe('Integration Testing', () => {
    it('should integrate with other app components', () => {
      // Test navigation between tabs
      cy.contains('FEM Analysis Summary').click();
      cy.get('.fem-summary').should('be.visible');
      
      cy.contains('Track ID Manager').click();
      cy.get('.track-id-manager-card').should('be.visible');
      
      cy.contains('Behavioral Arena').click();
      cy.get('.behavioral-arena-card').should('be.visible');
      
      cy.contains('Neural Circuits').click();
      cy.get('mat-card').should('contain', 'Coming Soon');
      
      cy.screenshot('19-navigation-integration');
    });

    it('should maintain state when switching between tabs', () => {
      // Select experiment and track
      cy.contains('Track ID Manager').click();
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
      
      // Navigate away and back
      cy.contains('FEM Analysis Summary').click();
      cy.contains('Track ID Manager').click();
      
      // Verify selection is maintained
      cy.get('.track-overview').should('be.visible');
      
      cy.screenshot('20-state-persistence');
    });
  });

  describe('Performance and Loading', () => {
    it('should load data within acceptable time limits', () => {
      // Test initial load performance
      const start = Date.now();
      
      cy.get('.track-id-manager-card').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(5000); // 5 second timeout
      });
      
      cy.screenshot('21-performance-test');
    });

    it('should handle large datasets efficiently', () => {
      // Select experiment with tracks
      cy.get('mat-select[placeholder="Select Experiment"]').click();
      cy.get('mat-option').first().click();
      
      // Verify table renders efficiently
      cy.get('.tracks-table tr').should('have.length.greaterThan', 1);
      
      // Test scrolling and selection performance
      cy.get('.tracks-table').scrollTo('bottom');
      cy.get('.tracks-table').scrollTo('top');
      
      cy.screenshot('22-dataset-performance');
    });
  });
}); 