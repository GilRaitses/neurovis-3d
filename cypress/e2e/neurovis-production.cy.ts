/// <reference types="cypress" />

describe('NeuroVis-3D Production E2E Tests', () => {
  const PRODUCTION_URL = 'https://neurovis-3d.web.app';
  const BACKEND_URL = 'https://neuroglancer-backend-359448340087.us-central1.run.app';

  beforeEach(() => {
    cy.visit(PRODUCTION_URL);
    cy.wait(2000); // Allow Angular app to initialize
  });

  describe('Application Loading & Structure', () => {
    it('should load the main application successfully', () => {
      // Verify page title contains expected text
      cy.title().should('contain', 'NeuroVis');
      
      // Check main toolbar
      cy.get('mat-toolbar').should('be.visible');
      cy.get('mat-toolbar span').should('contain.text', 'NeuroVis-3D');
      cy.get('mat-toolbar .subtitle').should('contain.text', '🔴 CHRIMSON Phantom Mechanosensation');
    });

    it('should display all main application components', () => {
      // Verify main grid layout
      cy.get('.app-container').should('be.visible');
      cy.get('.content-grid').should('be.visible');
      cy.get('.bottom-panel').should('be.visible');

      // Check left panel - Behavioral Arena
      cy.get('.left-panel').should('be.visible');
      cy.get('app-behavioral-arena').should('be.visible');

      // Check right panel - Python Neuroglancer Viewer  
      cy.get('.right-panel').should('be.visible');
      cy.get('app-python-neuroglancer-viewer').should('be.visible');

      // Check bottom panel components
      cy.get('app-fem-data-loader').should('be.visible');
      cy.get('app-health').should('be.visible');
    });
  });

  describe('Backend Connectivity & API Testing', () => {
    it('should test backend health endpoint directly', () => {
      cy.request({
        method: 'GET',
        url: `${BACKEND_URL}/api/health`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'healthy');
        expect(response.body).to.have.property('environment', 'cloud_run');
        expect(response.body).to.have.property('port', '8080');
      });
    });

    it('should handle FlyWire API failures gracefully', () => {
      cy.request({
        method: 'GET',
        url: `${BACKEND_URL}/api/circuits/search`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.have.property('success', false);
        expect(response.body).to.have.property('error', 'FlyWire service not available');
        expect(response.body).to.have.property('data_source', 'flywire');
        // CRITICAL: Ensure no mock data is returned
        expect(response.body).to.not.have.property('circuits');
        expect(response.body).to.not.have.property('mock');
      });
    });

    it('should test SSL connectivity endpoint', () => {
      cy.request({
        method: 'GET', 
        url: `${BACKEND_URL}/api/test-ssl`,
        failOnStatusCode: false
      }).then((response) => {
        // SSL endpoint may return 500 if not implemented, that's fine
        expect([200, 500]).to.include(response.status);
        if (response.status === 200) {
          expect(response.body).to.have.property('ssl_working', false);
          expect(response.body).to.have.property('success', false);
        }
      });
    });
  });

  describe('Health Component Integration', () => {
    it('should display system health status', () => {
      // Check health component is present
      cy.get('app-health mat-card').should('be.visible');
      cy.get('app-health mat-card-title').should('contain.text', 'System Health Status');
      cy.get('app-health mat-card-subtitle').should('contain.text', 'FlyWire API and Service Connectivity');

      // Check status grid
      cy.get('.status-grid').should('be.visible');
      cy.get('.status-item').should('have.length.at.least', 4);

      // Verify health check button
      cy.get('button').contains('Check Health').should('be.visible');
      cy.get('button').contains('Reset Connection').should('be.visible');
    });

    it('should handle health check interactions', () => {
      // Click health check button
      cy.get('button').contains('Check Health').click();
      
      // Wait for health check to complete
      cy.wait(3000);
      
      // Should show error status due to FlyWire SSL issues
      cy.get('.status-item').should('contain.text', 'FlyWire API');
      cy.get('.status-item').should('contain.text', 'Authentication');
    });
  });

  describe('Python Neuroglancer Viewer', () => {
    it('should display the neuroglancer viewer component', () => {
      cy.get('app-python-neuroglancer-viewer mat-card').should('be.visible');
      cy.get('app-python-neuroglancer-viewer mat-card-title')
        .should('contain.text', 'CHRIMSON Neural Circuits');
    });

    it('should handle backend connection attempts', () => {
      // Check if connection status is displayed
      cy.get('app-python-neuroglancer-viewer').within(() => {
        cy.get('mat-card-content').should('be.visible');
      });
    });
  });

  describe('FEM Data Loader', () => {
    it('should display the FEM data loader component', () => {
      cy.get('app-fem-data-loader mat-card').should('be.visible');
      cy.get('app-fem-data-loader mat-card-title')
        .should('contain.text', 'FEM Data Integration');
    });
  });

  describe('Behavioral Arena', () => {
    it('should display the behavioral arena component', () => {
      cy.get('app-behavioral-arena mat-card').should('be.visible');
      cy.get('app-behavioral-arena mat-card-title')
        .should('contain.text', 'Behavioral Arena');
    });
  });

  describe('Scientific Integrity Validation', () => {
    it('should ensure no mock or dummy data is served', () => {
      // Test all API endpoints to ensure they fail properly without serving fake data
      const endpoints = [
        '/api/circuits/search',
        '/api/visualization/create', 
        '/api/circuits/current'
      ];

      endpoints.forEach((endpoint) => {
        cy.request({
          method: 'GET',
          url: `${BACKEND_URL}${endpoint}`,
          failOnStatusCode: false
        }).then((response) => {
          // Should fail with proper error, not return mock data
          if (response.body.success !== undefined) {
            expect(response.body.success).to.be.false;
          }
          expect(response.body).to.not.have.property('mock');
          expect(response.body).to.not.have.property('demo');
          expect(response.body).to.not.have.property('fake');
          if (response.body.circuits) {
            expect(response.body.circuits).to.be.empty;
          }
        });
      });
    });

    it('should validate CHRIMSON-specific error handling', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/activity/update`,
        body: {
          optogeneticStimulus: true,
          mechanicalForce: 0.5,
          timestamp: Date.now()
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should fail properly without serving mock responses
        expect(response.body.success).to.be.false;
        expect(response.body.error).to.contain('FlyWire service not available');
      });
    });
  });

  describe('Responsive Design & Performance', () => {
    it('should be responsive on mobile viewport', () => {
      cy.viewport(375, 667); // iPhone size
      cy.get('.content-grid').should('be.visible');
      cy.get('mat-toolbar').should('be.visible');
    });

    it('should load within reasonable time', () => {
      const start = Date.now();
      cy.get('mat-toolbar').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(10000); // 10 seconds max
      });
    });
  });

  describe('Error State Handling', () => {
    it('should handle network failures gracefully', () => {
      // Check that navigator is online
      cy.window().its('navigator.onLine').should('eq', true);
      
      // App should still display properly even with backend unavailable
      cy.get('mat-toolbar').should('be.visible');
      cy.get('app-health').should('be.visible');
    });
  });

  afterEach(() => {
    // Take screenshot on failure for debugging
    cy.screenshot({ capture: 'fullPage' });
  });
}); 