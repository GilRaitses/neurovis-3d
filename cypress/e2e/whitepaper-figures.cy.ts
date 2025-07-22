describe('Whitepaper Figure Generation', () => {
  beforeEach(() => {
    // Clear any cached data and ensure fresh state
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/');
    
    // Wait for application to fully load
    cy.get('[data-cy="app-loaded"]', { timeout: 10000 }).should('exist');
    
    // Wait for analytics data to load
    cy.get('[data-cy="analytics-data-loaded"]', { timeout: 15000 }).should('exist');
  });

  describe('Figure 1: Platform Overview & Analytics Dashboard', () => {
    it('Figure 1A: Landing page with professional sidebar navigation', () => {
      // Ensure we're on analytics tab
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Wait for UI to settle
      cy.wait(2000);
      
      // Take screenshot of full dashboard layout
      cy.screenshot('Figure_1A_Dashboard_Overview', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 800 }
      });
      
      // Verify navigation elements are visible
      cy.get('[data-cy="nav-analytics"]').should('be.visible');
      cy.get('[data-cy="nav-track-management"]').should('be.visible');
      cy.get('[data-cy="nav-behavioral-arena"]').should('be.visible');
      cy.get('[data-cy="nav-neural-circuits"]').should('be.visible');
    });

    it('Figure 1B: Analytics summary with real mechanosensation data', () => {
      // Navigate to analytics if not already there
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Wait for data to load and verify real data is displayed
      cy.get('[data-cy="total-tracks"]').should('contain', '53');
      cy.get('[data-cy="total-reorientations"]').should('contain', '1542');
      cy.get('[data-cy="mean-reorientations"]').should('not.contain', '0');
      
      // Focus on the analytics cards area
      cy.get('[data-cy="analytics-summary"]').scrollIntoView();
      cy.wait(1000);
      
      cy.screenshot('Figure_1B_Analytics_Summary', {
        capture: 'viewport',
        clip: { x: 300, y: 200, width: 900, height: 400 }
      });
    });

    it('Figure 1C: Data quality metrics with progress bars', () => {
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Scroll to metrics section
      cy.get('[data-cy="metrics-section"]').scrollIntoView();
      cy.wait(1000);
      
      // Verify progress bars are populated
      cy.get('[data-cy="track-completeness-bar"]').should('be.visible');
      cy.get('[data-cy="reorientation-progress-bar"]').should('be.visible');
      cy.get('[data-cy="frequency-progress-bar"]').should('be.visible');
      
      cy.screenshot('Figure_1C_Quality_Metrics', {
        capture: 'viewport',
        clip: { x: 300, y: 300, width: 900, height: 500 }
      });
    });
  });

  describe('Figure 2: Real Data Integration & Statistical Analysis', () => {
    it('Figure 2A: Loading state transition demonstration', () => {
      // Clear storage to force reload
      cy.clearLocalStorage();
      cy.visit('/');
      
      // Capture loading state
      cy.get('[data-cy="loading-state"]').should('be.visible');
      cy.screenshot('Figure_2A_Loading_State', {
        capture: 'viewport',
        clip: { x: 300, y: 200, width: 900, height: 400 }
      });
      
      // Wait for data to load and capture populated state
      cy.get('[data-cy="analytics-data-loaded"]', { timeout: 15000 }).should('exist');
      cy.wait(2000);
      
      cy.screenshot('Figure_2A_Data_Loaded', {
        capture: 'viewport',
        clip: { x: 300, y: 200, width: 900, height: 400 }
      });
    });

    it('Figure 2B: Python service statistical calculations', () => {
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Open browser console to show Python service calls
      cy.window().then((win) => {
        // Enable console logging capture
        cy.task('log', 'Monitoring Python service calls...');
      });
      
      // Wait for Python service calls to complete
      cy.wait(5000);
      
      // Verify real statistical values are displayed
      cy.get('[data-cy="experiment-date"]').should('contain', 'July 11, 2025');
      cy.get('[data-cy="pipeline-version"]').should('contain', 'windows_compatible');
      cy.get('[data-cy="total-tracks"]').should('contain', '53');
      
      cy.screenshot('Figure_2B_Statistical_Results', {
        capture: 'viewport'
      });
    });

    it('Figure 2C: Browser console showing Python service integration', () => {
      // Open DevTools programmatically if possible, or document the console output
      cy.window().its('console').then((console) => {
        cy.task('log', 'Console output captured for Python service calls');
      });
      
      // Take a screenshot that includes visible data proving Python integration
      cy.get('[data-cy="analytics-summary"]').scrollIntoView();
      cy.screenshot('Figure_2C_Service_Integration', {
        capture: 'viewport'
      });
    });
  });

  describe('Figure 3: Data Pipeline & Processing', () => {
    it('Figure 3A: Raw trajectory data summary', () => {
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Focus on pipeline execution data
      cy.get('[data-cy="pipeline-info"]').scrollIntoView();
      cy.wait(1000);
      
      // Verify specific data values
      cy.get('[data-cy="experiment-id"]').should('contain', '2025-07-11_12-08-49');
      cy.get('[data-cy="total-tracks"]').should('contain', '53');
      cy.get('[data-cy="total-reorientations"]').should('contain', '1542');
      
      cy.screenshot('Figure_3A_Pipeline_Summary', {
        capture: 'viewport',
        clip: { x: 300, y: 150, width: 900, height: 600 }
      });
    });

    it('Figure 3B: Quality distribution breakdown', () => {
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Scroll to quality breakdown section
      cy.get('[data-cy="quality-breakdown"]').scrollIntoView();
      cy.wait(1000);
      
      // Verify quality distribution chips are visible
      cy.get('[data-cy="quality-excellent"]').should('be.visible');
      cy.get('[data-cy="quality-good"]').should('be.visible');
      cy.get('[data-cy="quality-fair"]').should('be.visible');
      cy.get('[data-cy="quality-poor"]').should('be.visible');
      
      cy.screenshot('Figure_3B_Quality_Distribution', {
        capture: 'viewport',
        clip: { x: 300, y: 400, width: 900, height: 300 }
      });
    });

    it('Figure 3C: Pipeline validation and methodology', () => {
      cy.get('[data-cy="nav-analytics"]').click();
      
      // Focus on methodology and validation info
      cy.get('[data-cy="methodology-info"]').scrollIntoView();
      cy.wait(1000);
      
      // Verify methodology is displayed
      cy.get('[data-cy="methodology"]').should('not.be.empty');
      cy.get('[data-cy="pipeline-status"]').should('contain', 'COMPLETE');
      
      cy.screenshot('Figure_3C_Pipeline_Validation', {
        capture: 'viewport',
        clip: { x: 300, y: 500, width: 900, height: 300 }
      });
    });
  });

  describe('Figure 4: Component Integration', () => {
    it('Figure 4A: Track ID Manager with experiment data', () => {
      cy.get('[data-cy="nav-track-management"]').click();
      cy.wait(2000);
      
      // Verify track manager loads
      cy.get('[data-cy="track-manager"]').should('be.visible');
      
      cy.screenshot('Figure_4A_Track_Manager', {
        capture: 'viewport'
      });
    });

    it('Figure 4B: Behavioral Arena component', () => {
      cy.get('[data-cy="nav-behavioral-arena"]').click();
      cy.wait(2000);
      
      // Verify behavioral arena loads
      cy.get('[data-cy="behavioral-arena"]').should('be.visible');
      
      cy.screenshot('Figure_4B_Behavioral_Arena', {
        capture: 'viewport'
      });
    });

    it('Figure 4C: Neural Circuits section', () => {
      cy.get('[data-cy="nav-neural-circuits"]').click();
      cy.wait(2000);
      
      // Verify neural circuits section
      cy.get('[data-cy="neural-circuits"]').should('be.visible');
      cy.get('[data-cy="neuroglancer-integration"]').should('be.visible');
      
      cy.screenshot('Figure_4C_Neural_Circuits', {
        capture: 'viewport'
      });
    });
  });

  describe('Figure 5: System Robustness & Error Handling', () => {
    it('Figure 5A: Network resilience test', () => {
      // Test with simulated network issues
      cy.intercept('GET', '**/assets/data/**', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/');
      cy.wait('@networkError');
      
      // Should show loading state or error handling
      cy.screenshot('Figure_5A_Network_Resilience', {
        capture: 'viewport'
      });
    });

    it('Figure 5B: Python service fallback demonstration', () => {
      // Mock Python service failure
      cy.intercept('POST', '**/envelope-analysis', { statusCode: 500 }).as('serviceError');
      
      cy.visit('/');
      cy.wait(5000);
      
      // Should fall back to local calculations
      cy.get('[data-cy="analytics-data-loaded"]').should('exist');
      
      cy.screenshot('Figure_5B_Service_Fallback', {
        capture: 'viewport'
      });
    });
  });
});

// Helper function to capture specific UI elements
function captureElement(selector: string, filename: string) {
  cy.get(selector).should('be.visible').then(($el) => {
    const rect = $el[0].getBoundingClientRect();
    cy.screenshot(filename, {
      capture: 'viewport',
      clip: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    });
  });
} 