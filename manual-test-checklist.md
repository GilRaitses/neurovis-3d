# CHRIMSON Manual Testing Checklist
## No Fallbacks, No Mock Data - Real FlyWire Only

### Prerequisites
- [ ] Angular frontend running on http://localhost:4200
- [ ] Python backend running on http://localhost:5000  
- [ ] All port conflicts resolved
- [ ] Browser with developer tools open

---

## Test 1: Frontend Loading
### Expected Result: Angular app loads without infinite spinner

**Steps:**
1. Navigate to http://localhost:4200
2. Wait maximum 30 seconds for initial load
3. Check for CHRIMSON interface elements

**Validation Checklist:**
- [ ] Page loads completely (no infinite spinner)
- [ ] Material UI toolbar visible with "NeuroVis-3D" and "CHRIMSON" 
- [ ] Dual panel layout visible (left: behavioral arena, right: neuroglancer)
- [ ] No JavaScript errors in browser console
- [ ] Angular application bundle loads successfully

**Screenshot:** `01-frontend-loading.png`

---

## Test 2: Backend Connection  
### Expected Result: Python backend responds to health checks

**Steps:**
1. Open browser to http://localhost:5000/api/health
2. Check response content
3. Verify SSL connection status

**Validation Checklist:**
- [ ] Health endpoint returns JSON response
- [ ] Response contains `"real_data_only": true`
- [ ] `flywire_connected` status (may be false due to SSL)
- [ ] `neuroglancer_url` present (may be null if connection failed)
- [ ] No 500 errors for basic API endpoints

**Expected Response (if SSL works):**
```json
{
  "status": "healthy",
  "neuroglancer_url": "http://localhost:9997",
  "flywire_connected": true,
  "dataset": "flywire_fafb_production",
  "real_data_only": true
}
```

**Expected Response (SSL issues):**
```json
{
  "status": "error", 
  "error": "SSL connection failed",
  "real_data_only": true,
  "flywire_connected": false
}
```

**Screenshot:** `02-backend-connection.png`

---

## Test 3: Python Neuroglancer Component
### Expected Result: Neuroglancer viewer component loads in Angular

**Steps:**
1. Navigate to main page http://localhost:4200
2. Locate Python Neuroglancer viewer component
3. Check iframe integration
4. Test backend communication buttons

**Validation Checklist:**
- [ ] `<app-python-neuroglancer-viewer>` component visible
- [ ] Connection status indicator present
- [ ] "Check Connection" button responds
- [ ] "Search Circuits" button present
- [ ] "Create Visualization" button present
- [ ] Iframe placeholder for Neuroglancer (may be empty due to SSL)

**Screenshot:** `03-neuroglancer-component.png`

---

## Test 4: Behavioral Arena (Three.js)
### Expected Result: 3D visualization of larval movement

**Steps:**
1. Navigate to main page
2. Locate behavioral arena panel (left side)
3. Check Three.js canvas rendering
4. Test interaction controls

**Validation Checklist:**
- [ ] `<app-behavioral-arena>` component visible
- [ ] Three.js canvas element present and rendering
- [ ] 3D scene with larval body model (basic geometry)
- [ ] Camera controls responsive (orbit, zoom)
- [ ] No WebGL errors in console
- [ ] FEM data controls visible

**Screenshot:** `04-behavioral-arena.png`

---

## Test 5: CHRIMSON Activity Simulation
### Expected Result: Red light stimulus affects neural activity

**Steps:**
1. Load FEM data (use demo button if available)
2. Enable optogenetic stimulus (red light)
3. Observe neuron activity changes
4. Check synchronization between panels

**Validation Checklist:**
- [ ] FEM data loading mechanism works
- [ ] Optogenetic stimulus toggle/slider present  
- [ ] Activity indicators respond to red light
- [ ] Temporal dynamics follow 11.5s peak pattern
- [ ] No fallback to mock data (check console logs)

**Screenshot:** `05-chrimson-activity.png`

---

## Test 6: Real-Time Synchronization
### Expected Result: Behavioral and neural panels stay synchronized

**Steps:**
1. Trigger events in behavioral arena
2. Observe corresponding neural responses  
3. Check timestamp synchronization
4. Verify data flow Angular → Python backend

**Validation Checklist:**
- [ ] Events trigger in both panels simultaneously
- [ ] Timestamp indicators match between components
- [ ] Network requests visible in browser dev tools
- [ ] WebSocket connections (if implemented)
- [ ] No latency issues or desync

**Screenshot:** `06-synchronization.png`

---

## Test 7: Error Handling
### Expected Result: Graceful failure without fallbacks

**Steps:**
1. Disconnect backend (stop Python server)
2. Test frontend error handling
3. Restart backend and test recovery
4. Check for any mock data usage

**Validation Checklist:**
- [ ] Frontend shows clear error messages
- [ ] No fallback to mock data anywhere
- [ ] Backend returns appropriate HTTP status codes
- [ ] Recovery works when backend restored
- [ ] Console shows "NO FALLBACKS" confirmations

**Screenshot:** `07-error-handling.png`

---

## Test 8: Full Integration Test
### Expected Result: Complete CHRIMSON workflow

**Steps:**
1. Load real FlyWire circuit data (if SSL works)
2. Simulate larval movement in behavioral arena
3. Apply CHRIMSON red light stimulus 
4. Observe phantom mechanosensation response
5. Verify neural circuit activation patterns

**Validation Checklist:**
- [ ] FlyWire circuit data loads (or fails gracefully)
- [ ] Larval model responds to stimuli
- [ ] Red light triggers mechanosensory neurons
- [ ] Circuit visualization updates in real-time
- [ ] All data sources marked as "flywire_real"

**Screenshot:** `08-full-integration.png`

---

## Critical Issues to Document

### SSL Certificate Issues
If backend fails with SSL errors:
- [ ] Document exact SSL error message
- [ ] Test with different networks/VPN
- [ ] Contact network administrator
- [ ] **DO NOT** enable fallback mock data

### Cypress Spawn UNKNOWN Error
If Cypress automation fails:
- [ ] Try `npm install cypress@latest --save-dev`
- [ ] Use this manual checklist instead
- [ ] Document Windows-specific issues
- [ ] Consider alternative testing tools

### Port Conflicts
If services fail to start:
- [ ] Use `netstat -ano` to check port usage
- [ ] Kill conflicting processes
- [ ] Update port configurations if needed
- [ ] Document process dependencies

---

## Screenshot Analysis

After completing manual tests:

1. **Collect all screenshots** in `manual-test-screenshots/` folder
2. **Run analysis script**: `python analyze-screenshots.py`
3. **Generate priority fix list** based on visual evidence
4. **Document working vs broken features**
5. **Plan next development iteration**

---

## Success Criteria

### Minimum Viable System
- [ ] Angular frontend loads without errors
- [ ] Backend API responds (even with SSL issues)
- [ ] Three.js renders basic 3D scene
- [ ] Components communicate via HTTP

### Full CHRIMSON System
- [ ] Real FlyWire data integration
- [ ] Neural circuit mesh visualization  
- [ ] CHRIMSON red light simulation
- [ ] Phantom mechanosensation modeling
- [ ] Real-time behavioral/neural sync

---

## Next Steps After Testing

### If Tests Pass
1. Deploy to Firebase hosting
2. Set up production FlyWire connection
3. Add more neural circuit types
4. Enhance CHRIMSON simulation accuracy

### If Tests Fail
1. Prioritize fixes based on screenshot analysis
2. Focus on SSL/connectivity issues first
3. Ensure "NO FALLBACKS" policy maintained
4. Document all issues for systematic resolution 