---
applyTo: ".github/workflows/**/*.yml"
---

# GitHub Actions Workflows

## Flat Data Pattern

This repository uses the `githubocto/flat@v3` action for data fetching.

## Required Setup Order

```yaml
steps:
  - name: Setup Deno
    uses: denoland/setup-deno@v1
    with:
      deno-version: v1.x
  
  - name: Check out repo
    uses: actions/checkout@v4
  
  - name: Fetch data
    uses: githubocto/flat@v3
    with:
      http_url: ${{ secrets.ENDPOINT_URL }}
      downloaded_filename: data/filename-raw.json
      postprocess: scripts/script-name.ts
```

**Important**: Deno setup MUST come before checkout when using postprocessing scripts.

## Secrets Management

- API URLs are stored as repository secrets
- Secret names: `CAREERSGOVSG_JOB_HEADER`, `CAREERSGOVSG_JOB_DETAILS`
- Never hardcode URLs in workflow files
- Use `${{ secrets.SECRET_NAME }}` syntax

## Flat Action Parameters

### Required for HTTP mode
- `http_url` - The endpoint URL (use secrets)
- `downloaded_filename` - Where to save fetched data (in `data/` directory)

### Optional
- `postprocess` - Path to Deno script for processing (relative to repo root)
- `authorization` - Auth header value (use secrets if needed)
- `axios_config` - Path to axios config JSON for complex requests

## Filename Conventions

- Raw fetched files: `data/{name}-raw.json`
- Processed files: `data/{name}.json` and `data/{name}.csv`
- Scripts transform `-raw.json` → `.json` + `.csv`

## Schedule

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at 00:00 UTC
  workflow_dispatch:      # Manual trigger
```

## Permissions

Always include:
```yaml
permissions:
  contents: write
```

Flat action auto-commits changes, so write access is required.

## Validation

- Workflow runs on schedule and manual dispatch
- Flat action only commits if data changes
- Check Actions tab for logs and errors
- Postprocessing errors prevent commits
