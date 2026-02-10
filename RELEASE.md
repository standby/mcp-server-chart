# Release Guide

This document describes how to publish a new version of `@standby/mcp-server-chart` to npm.

## Prerequisites

- Write access to the GitHub repository
- npm credentials configured as `NPM_TOKEN` secret in GitHub repository settings
- All tests passing
- Changes committed and pushed to the main branch

## Automated Release Process

This package uses GitHub Actions for automated releases. The workflow is triggered by creating and pushing a git tag with the format `v*`.

### Step-by-Step Release

1. **Update the version in package.json** (if not already done)
   ```bash
   npm version patch  # for patch release (0.9.9 -> 0.9.10)
   # or
   npm version minor  # for minor release (0.9.9 -> 0.10.0)
   # or
   npm version major  # for major release (0.9.9 -> 1.0.0)
   ```
   This command will:
   - Update the version in `package.json`
   - Create a git commit
   - Create a git tag with the format `v<version>`

2. **Push the changes and tag**
   ```bash
   git push origin main
   git push origin --tags
   ```

3. **Monitor the GitHub Actions workflow**
   - Go to https://github.com/standby/mcp-server-chart/actions
   - Watch the "Publish to npm" workflow
   - The workflow will automatically:
     - Install dependencies
     - Build the project
     - Publish to npm with provenance

4. **Verify the release**
   - Check npm: https://www.npmjs.com/package/@standby/mcp-server-chart
   - Verify the version number matches your release

## Manual Release (Not Recommended)

If the automated workflow is not available, you can manually publish:

1. **Ensure you're on the main branch and have the latest changes**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Update version**
   ```bash
   npm version <patch|minor|major>
   ```

3. **Build the package**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test -- --run
   ```

5. **Login to npm** (one-time setup)
   ```bash
   npm login
   ```

6. **Publish to npm**
   ```bash
   npm publish --access public
   ```

## What Gets Published

The package includes only the `build/` directory (as specified in `package.json` files array), which contains:
- Compiled JavaScript files
- TypeScript declaration files (.d.ts)
- All chart definitions
- Server implementation
- Utility functions

## Version Strategy

This package follows [Semantic Versioning (semver)](https://semver.org/):

- **MAJOR** version (X.0.0): Breaking changes
- **MINOR** version (0.X.0): New features (backward compatible)
- **PATCH** version (0.0.X): Bug fixes (backward compatible)

## Current Release Status

- Current version: **0.9.9**
- This is a pre-1.0 version, indicating the API is still stabilizing
- Once the API is stable and production-ready, bump to 1.0.0

## Troubleshooting

### Workflow Fails with "need auth"
- Ensure `NPM_TOKEN` secret is configured in GitHub repository settings
- The token should have publish permissions for the `@standby` scope

### Tag Already Exists
- Delete the tag locally: `git tag -d v<version>`
- Delete the tag remotely: `git push origin :refs/tags/v<version>`
- Re-create the tag with the correct version

### Build Fails
- Run `npm run build` locally to identify the issue
- Ensure all dependencies are correctly specified in `package.json`
- Check TypeScript compilation errors

### Tests Fail
- Run `npm test` locally to identify failing tests
- Fix the tests before releasing
- Ensure all chart types are working correctly
