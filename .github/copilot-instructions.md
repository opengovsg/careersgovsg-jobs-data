# Repository Instructions

## What this repository does

This is a GitHub flat-data repository that automatically fetches Singapore Government job listings from public OData endpoints and commits them as versioned data files.

## Project structure

- **scripts/** - Deno TypeScript postprocessing scripts
- **data/** - Fetched and processed job data (JSON and CSV)
- **.github/workflows/** - GitHub Actions workflows using flat-data action
- **.github/instructions/** - Path-specific custom instructions
- **docs/** - API and schema documentation

## Key technologies

- **Deno** (v1.x) - Runtime for postprocessing scripts
- **GitHub Actions** - Automation via flat-data action
- **OData** - API format for source data

## Build and validation

### Local development
```bash
# Fetch and process data (requires env vars)
deno task fetch

# Watch mode for development
deno task dev
```

### Environment setup
- Copy `.env.example` to `.env.local` and populate with actual endpoint URLs
- Required: `CAREERSGOVSG_JOB_HEADER` and `CAREERSGOVSG_JOB_DETAILS`

### Testing changes
1. Set environment variables in `.env.local`
2. Run `deno task fetch` to test locally
3. Check `data/` directory for output files

## Important conventions

- **Never hardcode API URLs** - Use environment variables or GitHub secrets
- **API URLs are confidential** - Don't commit them to code or documentation
- **Use Flat Data helpers** - Import from `https://deno.land/x/flat/mod.ts`
- **Output both JSON and CSV** - For maximum data accessibility
- **OData dates** - Format is `/Date(timestamp)/` and must be parsed

## GitHub Actions workflow

The workflow uses `githubocto/flat@v3` action:
1. Fetches data from endpoints (stored in GitHub secrets)
2. Runs postprocessing script on fetched data
3. Auto-commits changes if data differs

## Validation

- Scripts should handle OData response structure: `{ d: { results: [...] } }`
- Clean strings (trim, remove non-breaking spaces)
- Parse dates from OData format to timestamps or ISO strings
- Generate both processed JSON and CSV outputs
