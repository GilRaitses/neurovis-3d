# Scripts Directory

This directory contains general utility scripts that are not tied to specific development tasks or dates.

## Purpose

Unlike the `development-scripts/` directory which organizes scripts by creation date and specific development tasks, this directory is for:

- Utility scripts used across the project
- Build automation scripts
- General maintenance scripts
- Scripts that are part of the permanent project infrastructure

## Organization

Scripts in this directory should be:
- Well-documented with comments
- Stable and tested
- Used by multiple team members or processes
- Not experimental or one-time-use scripts

## Examples of Appropriate Scripts

- Build automation scripts
- Database migration utilities
- Environment setup scripts
- CI/CD helper scripts
- Code formatting/linting scripts

## Development vs. Scripts Directories

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `scripts/` | Permanent utility scripts | build.sh, setup-env.bat, lint.js |
| `development-scripts/` | Date-specific development work | analysis scripts, experimental tools, debugging scripts | 