# GitHub Deployment Guide

This guide explains how to deploy the NEXUS Support System to GitHub and set up GitHub Pages for the website.

## Prerequisites

- GitHub account
- Git installed locally
- Node.js 14.0.0 or higher
- MongoDB 4.4 or higher (for local development)

## Step 1: Initialize Git Repository

If you haven't already initialized the repository:

```bash
cd /home/robbie/Desktop/nexus
git init
git add .
git commit -m "Initial commit: NEXUS Support System"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `NEXUS-Support-Ticket-System`
3. Owner: `AutoBotSolutions`
4. Set to Public or Private based on your needs
5. Do NOT initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 3: Push to GitHub

```bash
git remote add origin https://github.com/AutoBotSolutions/NEXUS-Support-Ticket-System.git
git branch -M main
git push -u origin main
```

## Step 4: Set Up GitHub Pages for Website

### Option A: Using GitHub Actions (Recommended)

Create `.github/workflows/deploy-website.yml`:

```yaml
name: Deploy Website to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Option B: Using gh-pages Branch

1. Install gh-pages package:
```bash
npm install --save-dev gh-pages
```

2. Add deploy script to package.json:
```json
"scripts": {
  "deploy": "gh-pages -d website"
}
```

3. Deploy:
```bash
npm run deploy
```

## Step 5: Configure GitHub Pages Settings

1. Go to repository Settings → Pages
2. Source: Select "GitHub Actions" (if using Option A) or "Deploy from a branch" (if using Option B)
3. If using branch deploy:
   - Branch: `gh-pages`
   - Folder: `/root`
4. Click Save

## Step 6: Enable GitHub Actions (if using Option A)

1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Click Save

## Step 7: Push and Deploy

```bash
git add .
git commit -m "Add GitHub Actions for website deployment"
git push origin main
```

The website will automatically deploy to:
```
https://autobotsolutions.github.io/NEXUS-Support-Ticket-System/
```

## Environment Variables for Production

Set these in GitHub repository Settings → Secrets and variables → Actions:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secure random string for JWT signing
- `GITHUB_WEBHOOK_SECRET`: Your GitHub webhook secret
- `GITHUB_TOKEN`: GitHub personal access token
- `GITHUB_REPO_OWNER`: AutoBotSolutions
- `GITHUB_REPO_NAME`: NEXUS-Support-Ticket-System
- `NODE_ENV`: production
- `CORS_ORIGIN`: Your domain (if applicable)

## Custom Domain (Optional)

1. Go to Settings → Pages
2. Under "Custom domain", enter your domain
3. Update DNS settings with your domain provider
4. Enable "Enforce HTTPS"

## Verification

1. Check Actions tab to see deployment status
2. Visit your GitHub Pages URL
3. Verify all pages load correctly
4. Test navigation between pages

## Troubleshooting

### Website Not Deploying
- Check Actions tab for error logs
- Verify workflow file is in `.github/workflows/` directory
- Ensure permissions are set correctly

### 404 Errors
- Wait a few minutes for DNS propagation
- Check branch name matches deployment settings
- Verify file paths in workflow configuration

### Links Not Working
- Ensure all links use relative paths
- Check file names match exactly (case-sensitive)
- Verify GitHub Pages URL in _config.yml

## Next Steps

1. Set up CI/CD for the main application
2. Configure automated testing
3. Set up monitoring and logging
4. Configure backup strategies
