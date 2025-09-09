# Deployment Guide

## Current Issue: Double Deployments

The project is currently experiencing double deployments on Cloudflare Pages. This means each git push triggers two separate deployments.

### Cause
This is happening because both of the following are active:
1. **Automatic GitHub Integration** - Cloudflare Pages is connected to the GitHub repository and automatically deploys on each push
2. **Manual Deployment** - We're also manually deploying using `wrangler pages deploy`

### Solution

Choose ONE of the following approaches:

#### Option A: Use Only Automatic Deployment (Recommended)
1. Go to Cloudflare Pages dashboard
2. Navigate to your project settings
3. Keep the GitHub integration enabled
4. Stop using `wrangler pages deploy` commands
5. Simply push to GitHub and let Cloudflare automatically deploy

#### Option B: Use Only Manual Deployment
1. Go to Cloudflare Pages dashboard
2. Navigate to your project settings
3. Disconnect the GitHub integration
4. Continue using `wrangler pages deploy out --project-name=wishing` for manual deployments

#### Option C: Use Branch-Based Deployment
1. Set automatic deployment to only trigger on `production` branch
2. Use manual deployment for `main` branch during development
3. Merge to `production` when ready for automatic deployment

### Current Setup
- Manual deployment command: `wrangler pages deploy out --project-name=wishing`
- Build command: `npm run build`
- Output directory: `out`

### Recommendation
Use **Option A** (automatic deployment only) for simplicity. This means:
1. Just push to GitHub
2. Cloudflare Pages will automatically build and deploy
3. No need for manual `wrangler pages deploy` commands

To implement this:
1. Remove any deployment scripts or CI/CD workflows
2. Ensure the Cloudflare Pages project is properly connected to GitHub
3. Set build command to `npm run build` and output directory to `out` in Cloudflare Pages settings