# Configuration Files

This directory contains all configuration files for the project, organized by purpose.

## Directory Structure

```
config/
├── README.md (this file)
├── cloudflare-dns-import.txt - DNS records for custom domain setup
└── deployment/
    ├── nginx.conf - Nginx server configuration
    ├── Dockerfile.frontend - Frontend Docker configuration
    ├── docker-compose.yml - Multi-container Docker setup
    ├── app.yaml - Google App Engine configuration
    ├── .gcloudignore - Google Cloud deployment ignore rules
    └── _redirects - URL redirect rules
```

## File Descriptions

### DNS Configuration
- `cloudflare-dns-import.txt` - DNS A records for Firebase Hosting custom domain

### Deployment Configuration
- `nginx.conf` - Web server configuration for production deployment
- `Dockerfile.frontend` - Container configuration for frontend application
- `docker-compose.yml` - Multi-service container orchestration
- `app.yaml` - Google App Engine deployment settings
- `.gcloudignore` - Files to exclude from Google Cloud deployments
- `_redirects` - URL rewriting and redirect rules for hosting

## Usage

These configuration files are referenced by deployment scripts and CI/CD pipelines. Modify with caution and test changes in development environments first. 