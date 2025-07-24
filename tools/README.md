# Tools Directory

This directory contains binary tools, large files, and external utilities used in development.

## Contents

- `google-cloud-cli-windows-x86_64.zip` - Google Cloud SDK for Windows (74MB)
  - Used for Google Cloud Platform deployments and management
  - Extract when needed for local development

## Usage Guidelines

- Large binary files and tools should be placed here to keep the root directory clean
- Include version information and source URLs in this README when adding new tools
- Consider using `.gitignore` patterns for very large files that can be downloaded as needed

## Tool Versions

- Google Cloud CLI: Latest stable release as of project setup
  - Download URL: https://cloud.google.com/sdk/docs/install
  - Purpose: GCP deployment and management automation 