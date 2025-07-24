# Development Scripts Organization

This directory contains all development-related scripts organized by the date they were created, with subdirectories for different types of functionality.

## Directory Structure

```
development-scripts/
├── README.md (this file)
├── 2025-07-21/
│   ├── analysis/
│   │   ├── analyze-screenshots.py - Screenshot analysis automation
│   │   └── chrimson-analysis-results.json - Analysis results data
│   ├── deployment/
│   │   ├── verify-deployment.js - Deployment verification script
│   │   └── diagnostic-report.md - System diagnostic documentation
│   └── testing/
│       ├── test-system.bat - System testing automation
│       ├── test-system-fixed.bat - Fixed version of system tests
│       └── manual-test-checklist.md - Manual testing procedures
├── 2025-07-22/
│   └── documentation/
│       └── manual-figure-generation.md - Figure generation documentation
└── 2025-07-23/
    └── data-extraction/
        ├── extract_hdf5_mat_data.py - HDF5/MAT data extraction
        ├── extract_mat_data.py - MATLAB data extraction
        ├── extract_mechanosensation_data.py - Mechanosensation data extraction
        ├── extract_all_trajectory_data.m - Complete trajectory data extraction
        ├── extract_complete_mechanosensation_data.m - Complete mechanosensation extraction
        ├── extract_trajectory_coordinates.m - Trajectory coordinate extraction
        ├── data_extraction_probe.js - Data extraction probing tool
        ├── extraction_probe_results.txt - Probe results output
        └── EXTRACTION_CAPABILITIES_SUMMARY.md - Summary of extraction capabilities
```

## Organization Rules

1. **Date-based folders**: Scripts are organized by creation date (YYYY-MM-DD format)
2. **Functional subfolders**: Within each date folder, scripts are categorized by function:
   - `analysis/` - Data analysis and processing scripts
   - `deployment/` - Deployment and verification scripts
   - `testing/` - Testing automation and procedures
   - `documentation/` - Documentation generation and guides
   - `data-extraction/` - Data extraction and processing tools

## Usage Guidelines

- When adding new development scripts, create or use the appropriate date folder
- Place scripts in the most relevant functional subfolder
- Update this README when adding new categories or significant changes
- Include brief descriptions of script purposes in commit messages

## Related Directories

- `config/` - Configuration files (DNS, deployment configs)
- `scripts/` - General utility scripts not tied to specific development tasks
- `tools/` - Binary tools and large files
- `docs/` - Project documentation and logs 