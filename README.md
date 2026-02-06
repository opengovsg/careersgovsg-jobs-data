# careersgovsg-jobs-data
Job listings as found on jobs.careers.gov.sg

## Overview
This repository uses GitHub Actions to automatically fetch and update Singapore Government job listings from Careers@Gov public data endpoints.

## Setup

### Prerequisites
- [Deno](https://deno.land/) installed locally for development

### Environment Variables
The following environment variables are required:
- `CAREERSGOVSG_JOB_HEADER`: URL endpoint for job listings
- `CAREERSGOVSG_JOB_DETAILS`: URL endpoint for job details

For local development:
1. Copy `.env.example` to `.env.local`
2. Fill in the actual endpoint URLs

For GitHub Actions:
- Set these as repository secrets in Settings > Secrets and variables > Actions

## Development

### Running Locally
```bash
# process job data
deno task process

# Run in watch mode for development
deno task dev
```

### Project Structure
```
├── .github/
│   └── workflows/
│       └── fetch-jobs.yml    # GitHub Actions workflow
├── scripts/
│   └── fetch-jobs.ts         # Main data fetching script
├── data/                     # Generated data files (git-tracked)
├── deno.json                 # Deno configuration
└── .env.example              # Example environment variables
```

## Automated Updates
The GitHub Action can be triggered manually via workflow_dispatch.

## Data Files
Fetched data is saved in the `data/` directory:
- `job-listings-raw.json`: Raw job listings data (OData format)
- `job-listings.json`: Processed job listings
- `job-listings.csv`: Processed job listings in CSV format

## For AI Agents

This repository includes comprehensive context for AI coding assistants:

- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Repository-wide context including architecture, conventions, and build steps
- **[.github/instructions/](.github/instructions/)** - Path-specific guidance:
  - [job-listings.instructions.md](.github/instructions/job-listings.instructions.md) - Data schema for job listings
  - [scripts.instructions.md](.github/instructions/scripts.instructions.md) - Guidelines for Deno postprocessing scripts
  - [workflows.instructions.md](.github/instructions/workflows.instructions.md) - GitHub Actions workflow patterns

These files provide context about:
- OData response structures and how to process them
- Required patterns for Flat Data postprocessing scripts
- Conventions for handling API URLs and secrets
- Data transformation rules (date parsing, string cleaning, CSV generation)

## License
See [LICENSE](LICENSE) for details.
