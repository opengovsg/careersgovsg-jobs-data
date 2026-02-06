---
applyTo: "scripts/**/*.ts"
---

# Scripts Guidelines

## Purpose

Scripts in this directory are Deno TypeScript postprocessing scripts invoked by the Flat Data GitHub Action.

## Invocation

Scripts are called with:
```bash
deno run -q -A --unstable {script} {downloaded_filename}
```

- The first argument (`Deno.args[0]`) is the path to the fetched data file
- Full permissions granted (`-A`) - be cautious with dependencies

## Required Patterns

### Import Flat Data helpers
```typescript
import { readJSON, writeJSON } from 'https://deno.land/x/flat@0.0.15/mod.ts';
```

### Get input filename
```typescript
const filename = Deno.args[0];
if (!filename) {
  console.error('Error: No filename provided');
  Deno.exit(1);
}
```

### Read fetched data
```typescript
const data = await readJSON(filename) as ODataResponse;
```

### Save processed output
```typescript
// Replace -raw.json with .json
const outputFilename = filename.replace('-raw.json', '.json');
await writeJSON(outputFilename, processedData, null, 2);

// Also save CSV
const csvFilename = filename.replace('-raw.json', '.csv');
const csv = stringify(processedData, { columns: Object.keys(processedData[0]) });
await Deno.writeTextFile(csvFilename, csv);
```

## Data Processing Rules

### OData Date Parsing
```typescript
function parseODataDate(odataDate: string): number {
  const match = odataDate.match(/\/Date\((\d+)\)\//);
  if (!match) return NaN;
  return parseInt(match[1], 10);
}
```

### String Cleaning
```typescript
function cleanString(str: string): string {
  return str.replace(/\u00a0/g, ' ').trim();
}
```

### Always validate structure
```typescript
if (!data.d || !data.d.results) {
  console.error('Error: Invalid OData response structure');
  Deno.exit(1);
}
```

## Important Constraints

- **Never hardcode API URLs** - URLs should only exist in GitHub secrets
- **No API credentials in code** - Use environment variables if needed
- **Output both JSON and CSV** - For accessibility
- **Use console.log for visibility** - Logs appear in GitHub Actions
- **Exit with code 1 on errors** - Prevents bad data commits
- **Type all interfaces** - Improves maintainability

## Testing Locally

```bash
# Set env vars
export CAREERSGOVSG_JOB_HEADER="..."
export CAREERSGOVSG_JOB_DETAILS="..."

# Run task
deno task fetch

# Or directly with downloaded file
deno run -A scripts/fetch-jobs.ts data/job-listings-raw.json
```
