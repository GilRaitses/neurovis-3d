# Correspondence: Cypress Testing Handoff for NeuroCircuit.Science Platform

**Date:** July 22, 2025  
**Time:** 18:35:53  
**From:** Windows Development Agent  
**To:** Mac Testing Agent  
**Subject:** Cypress E2E Testing for Whitepaper Figure Generation

## PROJECT OVERVIEW

### **Platform Identity**
- **Project Name:** NeuroCircuit.Science
- **Domain:** https://neurocircuit.science (Firebase Hosting + Cloudflare DNS)
- **Purpose:** Sophisticated neuroscience research platform for Drosophila larval mechanosensory circuit analysis
- **Framework:** Angular 20 + Three.js + Neuroglancer integration
- **Backend:** Python Flask statistical microservice deployed to Google Cloud Run

### **Current Development Status**
The platform has undergone a complete frontend redesign from scratch after the user declared the previous implementation "completely wrong" and "bullshit". We have successfully:

1. **Eliminated all fake/placeholder components** including CAVE tokens, non-functional visualizations, and mock data
2. **Implemented real data integration** from mechanosensation pipeline with FEM analysis results
3. **Deployed Python statistical microservice** for envelope model calculations (replacing Math.random() placeholders)
4. **Established professional dashboard UI** with sidebar navigation and Angular Material design
5. **Configured DNS and SSL** for production domain (neurocircuit.science)

## CURRENT TECHNICAL STATE

### **Data Pipeline Integration**
- **Real FEM Analysis Data:** Loaded from `src/assets/data/` directory
- **Trajectory Data:** MATLAB .mat files (20MB all_trajectories.mat + experiment metadata)
- **Statistical Analysis:** Python service at `https://neurovis-stats-359448340087.us-central1.run.app`
- **Analytics Dashboard:** Live data showing track completeness, reorientation counts, quality distribution

### **Core Platform Components**
1. **Analytics Summary** - Real mechanosensation data visualization with statistical metrics
2. **Track Management** - Experiment viewer with trajectory filtering and frame index management  
3. **Behavioral Arena** - Three.js trace visualization of selected trajectories
4. **Neural Circuits** - Neuroglancer integration (placeholder - needs implementation)

### **Recent Technical Achievements**
- **Removed Math.random() placeholders** from envelope model service
- **Implemented deterministic statistical methods:** Shapiro-Wilk tests, t-tests, descriptive statistics
- **Python backend integration** with fallback to local calculations
- **Professional UI redesign** with proper navigation and data visualization
- **DNS/SSL configuration** resolved after network stack reset

## CYPRESS TESTING MISSION

### **Primary Objective**
Generate high-quality screenshots for **whitepaper figures** that demonstrate the platform's scientific capabilities and data visualization features.

### **Critical Testing Requirements**
- **NO LOCALHOST TESTING** - All tests must run against the live Firebase app at https://neurocircuit.science
- **Screenshot quality verification** - Each screenshot must be reviewed against evaluation criteria
- **100% accuracy to documentation** - No placeholders, bypasses, or fallbacks acceptable
- **Self-documenting failures** - If something fails, investigate root cause, don't reframe objectives

### **Test Files Location**
- **Primary Test Suite:** `cypress/e2e/whitepaper-figures.cy.ts`
- **Evaluation Criteria:** `cypress/evaluation-criteria.md`
- **Manual Fallback Instructions:** `manual-figure-generation.md`

## EXPECTED WHITEPAPER FIGURES

### **Figure 1: Platform Overview**
**Screenshot:** Dashboard landing page with sidebar navigation
**Evaluation Criteria:**
- Professional UI design visible
- All 4 main sections accessible (Analytics, Track Management, Behavioral Arena, Neural Circuits)
- NeuroCircuit.Science branding clear
- No loading states or placeholder content

### **Figure 2: Analytics Data Visualization**
**Screenshot:** Analytics tab with real FEM data loaded
**Evaluation Criteria:**
- Live statistics: track counts, reorientation metrics, quality distribution
- Progress bars showing meaningful percentages
- Pipeline information with experiment ID and methodology
- No "Loading..." states - actual data displayed

### **Figure 3: Python Service Integration**
**Screenshot:** Network tab or console showing successful API calls to Cloud Run service
**Evaluation Criteria:**
- HTTP requests to `https://neurovis-stats-359448340087.us-central1.run.app`
- Statistical calculations returned (not fallback data)
- Response times and data validation visible

### **Figure 4: Data Pipeline Workflow**
**Screenshot:** Browser DevTools showing loaded JSON assets
**Evaluation Criteria:**
- FEM analysis files successfully loaded from `/assets/data/`
- Network requests show 200 status for trajectory data
- File sizes match expected values (20MB+ for trajectory data)

### **Figure 5: Component Integration**
**Screenshot:** Multiple tabs open showing different platform sections
**Evaluation Criteria:**
- Track Management shows experiment data
- Behavioral Arena ready for trajectory visualization
- Neural Circuits section acknowledges Neuroglancer integration status
- Consistent styling across all sections

## DOCUMENTATION REFERENCES

### **Core Documentation**
- **Project README:** `README.md` - Architecture overview and setup instructions
- **Manual Testing Guide:** `manual-test-checklist.md` - Comprehensive verification procedures
- **Evaluation Criteria:** `cypress/evaluation-criteria.md` - Success metrics for each figure

### **Technical Implementation Details**
- **Analytics Service:** `src/app/services/analytics-data.service.ts` - Real data loading
- **Envelope Models:** `src/app/services/envelope-model.service.ts` - Python statistical integration
- **Main Component:** `src/app/app.component.ts` - Dashboard UI with data-cy attributes
- **Python Backend:** `backend/stats-service/` - Flask microservice for statistical calculations

### **Data Sources**
- **FEM Inventory:** `src/assets/data/fem_data_inventory.json` - Data pipeline metadata
- **Trajectory Data:** `src/assets/data/trajectories/` - MATLAB .mat files with experimental data
- **Pipeline Results:** `src/assets/data/final_pipeline_summary.json` - Analysis outcomes

## TESTING ENVIRONMENT SETUP

### **Prerequisites**
- **Node.js/npm** for Cypress
- **Network access** to https://neurocircuit.science
- **Browser compatibility** - Chrome/Firefox for consistent rendering
- **Screenshot storage** - Organized by figure number and timestamp

### **Known Issues to Validate**
1. **DNS Resolution:** Ensure neurocircuit.science resolves correctly on Mac
2. **SSL Certificate:** Verify Firebase SSL is properly minted and trusted
3. **Data Loading:** Confirm all JSON assets load without CORS issues
4. **Python Service:** Test statistical API responses from Cloud Run

### **Cypress Configuration**
- **Base URL:** https://neurocircuit.science
- **Viewport:** 1280x720 for consistent figure dimensions
- **Wait Strategies:** Proper data-cy attribute targeting, not arbitrary timeouts
- **Screenshot Naming:** Include figure number and timestamp for organization

## SUCCESS CRITERIA

### **For Each Figure:**
1. **Visual Quality:** Professional appearance matching platform design
2. **Data Accuracy:** Real data displayed, no placeholders or fallbacks
3. **Functional Elements:** All UI components rendered and responsive
4. **Technical Validation:** Network requests successful, APIs responding
5. **Documentation Match:** Screenshot content aligns with evaluation criteria

### **Overall Mission Success:**
- **5 high-quality figures** ready for whitepaper inclusion
- **Evaluation report** comparing screenshots against criteria
- **Technical validation** confirming platform functionality
- **Issue identification** for any remaining development needs

## POST-TESTING DELIVERABLES

### **Expected Outputs**
1. **Screenshot Collection:** 5 figures with proper naming convention
2. **Evaluation Report:** Comparison against `cypress/evaluation-criteria.md`
3. **Technical Assessment:** Platform performance and functionality status
4. **Issue Documentation:** Any discrepancies or areas needing attention

### **Communication Protocol**
- **Success Confirmation:** Report completion status with screenshot quality assessment
- **Issue Escalation:** Document any technical failures or evaluation mismatches
- **Recommendations:** Suggest improvements for whitepaper presentation

## CONTEXT FOR SCIENTIFIC IMPORTANCE

### **Research Domain**
This platform represents cutting-edge neuroscience research infrastructure for:
- **Drosophila larval mechanosensory circuits** analysis
- **CHRIMSON optogenetics** experimental data
- **FlyWire connectome** integration
- **Behavioral modeling** with statistical validation

### **Whitepaper Significance**
These figures will demonstrate:
- **Real-time data processing** capabilities
- **Statistical rigor** in analysis methods
- **Professional software** for neuroscience research
- **Integration of multiple** data modalities (FEM, trajectories, neural circuits)

The quality of these screenshots directly impacts the scientific credibility and professional presentation of this neuroscience research platform.

---

**End of Correspondence**

**Next Steps:** Execute Cypress test suite and generate whitepaper figures with rigorous evaluation against established criteria. 