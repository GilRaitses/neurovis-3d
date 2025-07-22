# Manual Whitepaper Figure Generation Instructions

Since Cypress is experiencing environment issues on Windows, here are manual instructions to generate the required whitepaper figures.

## Browser Setup
1. **Open Chrome/Edge** in incognito mode
2. **Navigate to**: https://neurovis-3d.web.app
3. **Set viewport to**: 1280x800 for consistent screenshots
4. **Open Developer Tools** (F12) to monitor console for Python service calls

## Figure Generation Process

### Figure 1: Platform Overview & Analytics Dashboard

#### Figure 1A: Dashboard Overview
1. **URL**: https://neurovis-3d.web.app
2. **Wait for**: Page to fully load (~5 seconds)
3. **Verify**: Sidebar shows Analytics, Track Management, Behavioral Arena, Neural Circuits
4. **Action**: Click "Analytics" tab if not already selected
5. **Screenshot**: Full viewport capture
6. **Expected**: Professional dashboard with sidebar navigation visible

#### Figure 1B: Analytics Summary Cards
1. **Navigate**: Ensure on Analytics tab
2. **Wait for**: Data to load (look for "53" tracks, "1542" reorientations)
3. **Verify**: Four colored cards with real data (no zeros)
4. **Action**: Scroll to ensure all cards are visible
5. **Screenshot**: Focus on the four data cards area
6. **Expected**: Real mechanosensation data displayed in colorful cards

#### Figure 1C: Quality Metrics
1. **Stay on**: Analytics tab
2. **Scroll down**: To Data Quality Metrics section
3. **Verify**: Three progress bars with meaningful percentages
4. **Verify**: Quality distribution chips (Excellent, Good, Fair, Poor)
5. **Screenshot**: Quality metrics and distribution section
6. **Expected**: Progress bars showing actual progress, not 0% or 100%

### Figure 2: Real Data Integration & Statistical Analysis

#### Figure 2A: Loading State Transition
1. **Action**: Clear browser cache (Ctrl+Shift+Del)
2. **Navigate**: https://neurovis-3d.web.app
3. **Quick screenshot**: Capture loading state (hourglass icon)
4. **Wait**: For data to fully load
5. **Screenshot**: Same area after data loads
6. **Expected**: Clear transition from loading to populated state

#### Figure 2B: Python Service Integration
1. **Open**: Developer Tools Console tab
2. **Navigate**: Analytics section
3. **Monitor**: Console for messages like "[EnvelopeModelService] Python service response"
4. **Verify**: 
   - Experiment date: July 11, 2025
   - Pipeline version: windows_compatible
   - Total tracks: 53
5. **Screenshot**: Both the UI and console (if possible)
6. **Expected**: Evidence of Python service calls in console

### Figure 3: Data Pipeline & Processing

#### Figure 3A: Pipeline Summary
1. **Location**: Analytics tab, scroll to Pipeline Execution Details
2. **Verify specific values**:
   - Experiment ID: 2025-07-11_12-08-49
   - Total tracks: 53
   - Total reorientations: 1542
   - Status: COMPLETE
3. **Screenshot**: Pipeline information section
4. **Expected**: All values match mechanosensation pipeline exactly

#### Figure 3B: Quality Distribution
1. **Location**: Quality distribution chips section
2. **Verify**: Four chips with counts and percentages
3. **Calculate**: Ensure totals add up to 53 tracks
4. **Screenshot**: Quality chips area
5. **Expected**: Meaningful distribution, not all in one category

#### Figure 3C: Methodology Display
1. **Location**: Pipeline details section
2. **Verify**: Methodology field shows actual algorithm name
3. **Verify**: Version and status information
4. **Screenshot**: Methodology and validation details
5. **Expected**: Non-empty methodology field

### Figure 4: Component Integration

#### Figure 4A: Track Manager
1. **Click**: Track Management tab
2. **Wait**: For component to load
3. **Verify**: Interface renders without errors
4. **Screenshot**: Full track management interface
5. **Expected**: Functional track management UI

#### Figure 4B: Behavioral Arena
1. **Click**: Behavioral Arena tab
2. **Wait**: For component to load
3. **Screenshot**: Behavioral arena interface
4. **Expected**: Component loads (even if placeholder)

#### Figure 4C: Neural Circuits
1. **Click**: Neural Circuits tab
2. **Verify**: Neuroglancer integration message
3. **Screenshot**: Neural circuits section
4. **Expected**: Professional "coming soon" interface

### Figure 5: System Robustness

#### Figure 5A: Network Resilience (Manual Test)
1. **Action**: Disconnect internet briefly
2. **Navigate**: Try to load page
3. **Screenshot**: Error handling state
4. **Reconnect**: Internet
5. **Expected**: Graceful error handling

#### Figure 5B: Service Fallback (Simulated)
1. **Developer Tools**: Network tab
2. **Block**: Requests to `neurovis-stats-*` (Python service)
3. **Refresh**: Page
4. **Monitor**: For fallback to local calculations
5. **Screenshot**: Data still showing (from fallback)
6. **Expected**: System continues to work with fallback data

## Manual Evaluation Checklist

### ✅ Figure 1A: Dashboard Overview
- [ ] Sidebar navigation visible with 4 tabs
- [ ] Professional Material Design layout
- [ ] NeuroCircuit.Science branding prominent
- [ ] Clean, modern appearance

### ✅ Figure 1B: Analytics Summary
- [ ] Total tracks shows: 53
- [ ] Total reorientations shows: 1542
- [ ] Mean reorientations > 0
- [ ] Duration and frequency cards populated
- [ ] Different card colors used

### ✅ Figure 1C: Quality Metrics
- [ ] Track completeness progress bar meaningful %
- [ ] Reorientation rate progress bar meaningful %
- [ ] Frequency quality progress bar meaningful %
- [ ] Quality distribution adds to 53 tracks

### ✅ Figure 2A: Loading Transition
- [ ] Loading state shows hourglass icon
- [ ] Data state shows populated cards
- [ ] Clear visual difference between states

### ✅ Figure 2B: Python Integration
- [ ] Console shows Python service calls
- [ ] Real statistical data displayed
- [ ] No random or placeholder values
- [ ] Pipeline version: windows_compatible

### ✅ Figure 3A: Pipeline Summary
- [ ] Experiment ID: 2025-07-11_12-08-49
- [ ] Tracks: 53, Reorientations: 1542
- [ ] Status: COMPLETE
- [ ] Pipeline details visible

### ✅ Figure 3B: Quality Distribution
- [ ] Four quality categories shown
- [ ] Counts and percentages calculated
- [ ] Total equals 53 tracks
- [ ] Color coding applied

### ✅ Figure 3C: Methodology
- [ ] Methodology field populated
- [ ] Not empty or "Unknown"
- [ ] Pipeline validation confirmed

### ✅ Figure 4A-C: Components
- [ ] Track Manager loads successfully
- [ ] Behavioral Arena renders
- [ ] Neural Circuits shows integration status

### ✅ Figure 5A-B: Robustness
- [ ] Graceful error handling
- [ ] Fallback mechanisms work
- [ ] No system crashes

## Screenshot Naming Convention
- `Figure_1A_Dashboard_Overview.png`
- `Figure_1B_Analytics_Summary.png`
- `Figure_1C_Quality_Metrics.png`
- `Figure_2A_Loading_State.png`
- `Figure_2A_Data_Loaded.png`
- `Figure_2B_Statistical_Results.png`
- `Figure_3A_Pipeline_Summary.png`
- `Figure_3B_Quality_Distribution.png`
- `Figure_3C_Pipeline_Validation.png`
- `Figure_4A_Track_Manager.png`
- `Figure_4B_Behavioral_Arena.png`
- `Figure_4C_Neural_Circuits.png`
- `Figure_5A_Network_Resilience.png`
- `Figure_5B_Service_Fallback.png`

## Quality Standards
- **Resolution**: Minimum 1280x800
- **Format**: PNG preferred
- **Content**: Ensure all text is readable
- **Focus**: Crop to relevant sections where specified
- **Consistency**: Same browser, same viewport size

## Post-Screenshot Validation
After taking each screenshot:
1. **Review against evaluation criteria**
2. **Verify data accuracy** (53 tracks, 1542 reorientations, etc.)
3. **Check visual quality** (readable text, proper colors)
4. **Confirm functionality** demonstrated

## Expected Results Summary
If everything is working correctly, you should see:
- ✅ **Real mechanosensation data** (53 tracks, 1542 reorientations)
- ✅ **Python service integration** (console logs showing service calls)
- ✅ **Professional UI** (Material Design, proper colors)
- ✅ **Functional components** (all tabs load without errors)
- ✅ **Robust error handling** (graceful fallbacks)

## Troubleshooting
If you see:
- **All zeros**: Data loading failed
- **"Loading..."**: Network or service issues
- **Console errors**: Check Python service connectivity
- **Broken layout**: Clear cache and retry
- **Missing data**: Check JSON file accessibility 