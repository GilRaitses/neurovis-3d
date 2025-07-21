/// <reference types="cypress" />

describe('NeuroVis3D Basic Functionality', () => {
  it('should load without infinite spinner', () => {
    cy.visit('https://neurovis-3d.web.app');
    
    // Wait reasonable time for app to load
    cy.wait(5000);
    
    // Check that main content is visible
    cy.get('mat-toolbar', { timeout: 10000 }).should('be.visible');
    cy.get('.welcome-card', { timeout: 10000 }).should('be.visible');
    
    // Most importantly - check that brain viewer is present
    cy.get('app-brain-viewer', { timeout: 15000 }).should('be.visible');
    cy.get('.brain-canvas', { timeout: 15000 }).should('be.visible');
    
    // Verify no loading indicators persist
    cy.get('mat-progress-bar').should('not.exist');
    
    // Take screenshot for manual verification
    cy.screenshot('brain-viewer-loaded');
  });
}); 