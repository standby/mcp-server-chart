# Quick Start: Release to npm

## TL;DR

To publish version 0.9.9 to npm right now, run:

```bash
git tag v0.9.9
git push origin v0.9.9
```

This will trigger the GitHub Actions workflow that automatically publishes to npm.

---

## What's Happening?

1. The package is configured to publish to npm via GitHub Actions
2. The workflow is triggered when you push a tag starting with `v` (e.g., `v0.9.9`)
3. The workflow requires an `NPM_TOKEN` secret to be configured in your GitHub repository

## Current Situation

- Package version in `package.json`: **0.9.9**
- Status: **Not yet published to npm**
- Tag exists: `0.9.9` (without the 'v' prefix)
- Workflow expects: `v0.9.9` (with the 'v' prefix)

## Steps to Publish

### Option 1: Publish Current Version (0.9.9)

Since the version is already 0.9.9 in package.json, just create and push the tag with the 'v' prefix:

```bash
# Create the tag with 'v' prefix
git tag v0.9.9

# Push the tag to GitHub
git push origin v0.9.9
```

### Option 2: Publish a New Version (e.g., 0.9.10 or 1.0.0)

If you want to bump the version before publishing:

```bash
# For a patch release (0.9.9 -> 0.9.10)
npm version patch

# Or for a minor release (0.9.9 -> 0.10.0)
npm version minor

# Or for a major release (0.9.9 -> 1.0.0)
npm version major

# This creates a commit and a tag with 'v' prefix automatically
# Then push both the commit and tags
git push origin copilot/release-npm-package
git push origin --tags
```

## Verify the Release

After pushing the tag:

1. **Monitor GitHub Actions**: https://github.com/standby/mcp-server-chart/actions
2. **Watch for "Publish to npm" workflow** to complete
3. **Check npm**: https://www.npmjs.com/package/@standby/mcp-server-chart

## Prerequisites

⚠️ **Important**: The repository must have the `NPM_TOKEN` secret configured:

1. Go to: https://github.com/standby/mcp-server-chart/settings/secrets/actions
2. Ensure `NPM_TOKEN` exists and contains a valid npm authentication token
3. The token needs publish permissions for the `@standby` scope

If this secret is not configured, the workflow will fail at the publish step.

## Testing Before Release

Already done! ✅
- Dependencies installed
- Build successful
- All 44 tests passing

The package is ready to publish!

## What Gets Published

Only the `build/` directory gets published (as specified in `package.json`):
- Compiled JavaScript and TypeScript declarations
- 26+ chart generation tools
- MCP server implementation
- All utilities and dependencies

## Need Help?

See [RELEASE.md](./RELEASE.md) for detailed release documentation.
