# GitHub Deployment Checklist

Use this checklist to ensure your project is ready for GitHub deployment.

## Pre-Deployment Checklist

### Repository Setup
- [ ] Repository created on GitHub: `AutoBotSolutions/NEXUS-Support-Ticket-System`
- [ ] Repository is set to Public (or Private as required)
- [ ] No README, .gitignore, or license initialized in GitHub (use local files)
- [ ] Remote URL configured: `https://github.com/AutoBotSolutions/NEXUS-Support-Ticket-System.git`

### Code Preparation
- [ ] All sensitive data removed from code
- [ ] .env file exists in .gitignore
- [ ] .env.example contains all required environment variables
- [ ] No hardcoded credentials in source files
- [ ] Logs directory in .gitignore
- [ ] node_modules in .gitignore
- [ ] Local development files excluded

### Website Preparation
- [ ] All website files in `/website` directory
- [ ] GitHub Actions workflow created in `.github/workflows/deploy-website.yml`
- [ ] _config.yml updated with correct repository info
- [ ] All links in website use correct GitHub URLs
- [ ] All pages properly linked together
- [ ] Copyright year updated to 2026
- [ ] Emoji icons replaced with sci-fi symbols

### Documentation
- [ ] README.md is comprehensive and up-to-date
- [ ] SECURITY.md created with security features documented
- [ ] LICENSE file exists (or in licences directory)
- [ ] GITHUB-DEPLOYMENT.md created
- [ ] Installation guides updated

### Security
- [ ] JWT_SECRET is not hardcoded
- [ ] GITHUB_WEBHOOK_SECRET is not hardcoded
- [ ] GITHUB_TOKEN is not hardcoded
- [ ] MongoDB connection string is not hardcoded
- [ ] Security middleware implemented
- [ ] Rate limiting configured
- [ ] Password complexity rules implemented

## GitHub Pages Deployment Checklist

### GitHub Actions Setup
- [ ] Workflow file created: `.github/workflows/deploy-website.yml`
- [ ] Workflow permissions configured in repository settings
- [ ] Actions enabled for the repository
- [ ] Workflow uses correct path: `./website`

### GitHub Pages Settings
- [ ] Pages enabled in repository settings
- [ ] Source set to "GitHub Actions"
- [ ] Environment name: github-pages
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforced

### Website Verification
- [ ] All pages load correctly
- [ ] Navigation links work
- [ ] Footer links work
- [ ] GitHub repository links point to correct URL
- [ ] No broken images or assets
- [ ] Responsive design works on mobile
- [ ] JavaScript features work

## Post-Deployment Checklist

### Repository
- [ ] Initial commit pushed to main branch
- [ ] Branch set to main (not master)
- [ ] Repository description updated
- [ ] Repository topics added
- [ ] Website URL set in repository settings
- [ ] License selected in GitHub settings

### GitHub Actions
- [ ] Workflow runs successfully on push
- [ ] Website deploys without errors
- [ ] Deployment URL accessible
- [ ] No warnings in workflow logs

### Environment Variables (for production)
- [ ] MONGODB_URI set in GitHub Secrets
- [ ] JWT_SECRET set in GitHub Secrets
- [ ] GITHUB_WEBHOOK_SECRET set in GitHub Secrets
- [ ] GITHUB_TOKEN set in GitHub Secrets
- [ ] GITHUB_REPO_OWNER set to AutoBotSolutions
- [ ] GITHUB_REPO_NAME set to NEXUS-Support-Ticket-System
- [ ] NODE_ENV set to production
- [ ] CORS_ORIGIN set (if applicable)

### Final Verification
- [ ] Clone the repository to test fresh install
- [ ] Run installation script successfully
- [ ] Start application without errors
- [ ] Test all API endpoints
- [ ] Verify GitHub webhook integration
- [ ] Check security audit logs
- [ ] Test rate limiting
- [ ] Verify password complexity rules

## Quick Start Commands

```bash
# Initialize git (if not already done)
cd /home/robbie/Desktop/nexus
git init

# Add remote
git remote add origin https://github.com/AutoBotSolutions/NEXUS-Support-Ticket-System.git

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: NEXUS Support System"

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## Troubleshooting

### Push Fails
- Check remote URL: `git remote -v`
- Verify credentials are configured
- Check if repository exists on GitHub

### Actions Fails
- Check workflow file location: `.github/workflows/deploy-website.yml`
- Verify permissions in repository settings
- Check Actions tab for error logs

### Website Not Deploying
- Wait 5-10 minutes for deployment
- Check Actions tab for deployment status
- Verify Pages source is set to GitHub Actions
- Check if workflow completed successfully

### Links Broken
- Verify file names match exactly (case-sensitive)
- Check relative paths in HTML files
- Verify GitHub Pages URL in _config.yml
