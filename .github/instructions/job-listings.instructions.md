---
applyTo: "data/job-listings.*"
---

# Job Listings Schema

Processed job listings data available in both JSON and CSV formats in the `data/` directory. This is the final output of the postprocessing pipeline, combining data from both the job listings and job details endpoints.

## Files

- `data/job-listings.json` - JSON array of processed jobs
- `data/job-listings.csv` - CSV export of the same data

## Data Structure

### JSON Format
```json
[
  {
    "platform": "hrp",
    "postingNo": "005056a3-d347-1fe1-83ab-e89b314c0286",
    "jobId": "17060737",
    "jobTitle": "Senior Lead Policy Analyst/Paired Product Manager, HR Innovations",
    // ... other fields
  }
]
```

### CSV Format
All fields exported as columns with headers matching the field names below.

## Schema Fields

### Core Identifiers
- **platform** (string) - Jobs platform identifier (e.g., "hrp", "workable", "greenhouse"). Identifies which platform the job is posted on.
- **jobId** (string) - Platform-dependent identifier. **Note**: Despite its name, this field's meaning varies by platform:
  - **hrp**: Numeric job identifier
  - **workable**: Workable account identifier (the hiring organization, e.g., `psd-sg`), not the per-posting id
  - **greenhouse**: Greenhouse public job id (used as `gh_jid`)
  - Format varies by platform (e.g., numeric string for hrp)
- **postingNo** (string) - Posting identifier. Format varies by platform (e.g., GUID for hrp, Workable `shortcode` such as `69C959EF15` for workable). May be empty string for platforms that don't use it (e.g., greenhouse).
- **agencyId** (string) - Agency identifier code (e.g., "0000001308"). May be empty string for platforms without an agency code (e.g., greenhouse).

> **Important**: The `jobId` field name is maintained for backward compatibility with existing data consumers, even though its semantic meaning differs across platforms.

Combined identifier: `platform` + `jobId` + `postingNo` uniquely identifies a job posting.
Job URL pattern for hrp: `https://jobs.careers.gov.sg/jobs/{platform}/{jobId}/{postingNo}` (e.g., https://jobs.careers.gov.sg/jobs/hrp/15219929/005056a3-d347-1fe1-80df-725f7689c286).
Job URL pattern for greenhouse: `https://jobs.careers.gov.sg/jobs/{platform}/{jobId}?gh_jid={jobId}` (e.g., https://jobs.careers.gov.sg/jobs/greenhouse/4001978201?gh_jid=4001978201).
Job URL pattern for workable: Use the Workable application URL `https://apply.workable.com/j/{postingNo}` (e.g., https://apply.workable.com/j/69C959EF15).

> **Note**: URL patterns and identifier roles may vary by platform. For hrp, both jobId and postingNo are required and used in URLs. For workable, `jobId` is the Workable account (currently only `psd-sg`) and `postingNo` is the per-posting `shortcode`. For greenhouse, only jobId is used.

### Job Information
- **jobTitle** (string) - Job title, cleaned and trimmed
- **agency** (string) - Agency name (e.g., "Public Service Division")
- **agencyDescription** (string) - Detailed agency description (multiline, markdown-formatted)

### Dates and Timing
- **startDate** (number) - Job posting start date as Unix timestamp in milliseconds (e.g., `1770681600000`)
- **closingDate** (number | null) - Job closing date as Unix timestamp in milliseconds (e.g., `1772928000000`). May be `null` for platforms that do not publish a deadline (e.g., greenhouse, workable).
- **closingDateText** (string) - Human-readable closing date (e.g., "Closing on 08 Mar 2026"). Empty string when not provided by the source platform.
- **remainingDays** (string) - Time remaining text (e.g., "Today", "Closing in 3 day(s)"). Empty string when not provided by the source platform.

> **Note**: Dates are stored as Unix timestamps (milliseconds since epoch). Convert with `new Date(timestamp)` or equivalent. Handle `closingDate === null` as "no published deadline".

### Employment Details
- **employmentType** (string) - Employment type description (e.g., "Permanent", "Contract", "Permanent/Contract", "Fixed Terms")
- **employmentTypeCode** (string) - Employment type code (e.g., "0001", "0002", "0003")
- **workArrangement** (string) - Work arrangement description. Values vary by platform: `"Full-time"` for hrp, `"hybrid"`/`"onsite"`/`"remote"` for workable, empty for greenhouse.

### Experience Requirements
- **experienceRequired** (string) - Human-readable experience requirement (e.g., "03-09 year(s)", "Entry level")
- **experienceYearsMin** (number) - Minimum years of experience required (e.g., 3)
- **experienceYearsMax** (number) - Maximum years in experience range (e.g., 9)

> **Note**: For entry-level positions, both min and max are typically 0.

### Categorization
- **field** (string) - Field description (e.g., "Human Resources", "Data Analysis & Data Mgt")
- **fieldCode** (string) - Field code (e.g., "0025", "0029")
- **functionalArea** (string) - Functional area description (e.g., "Human Resources", "Data Analysis & Data Mgt")
- **functionalAreaCode** (string) - Functional area code (e.g., "0006", "0013")
- **industry** (string) - Industry description (e.g., "Research and Analysis", "Healthcare")
- **educationCode** (string) - Education requirement code (e.g., "00", "03" for hrp; `education_optional` for greenhouse; free-text such as `"Bachelor's Degree"` for workable). Empty when not provided.
- **category** (string) - Job category (e.g., "Others")

> **Note**: `field` and `functionalArea` often contain the same value but come from different source fields.

### Job Content
- **jobDescription** (string) - Detailed job description (multiline, markdown-formatted)
- **jobResponsibilities** (string) - Job responsibilities (multiline, bullet points, markdown-formatted)
- **jobRequirements** (string) - Job requirements (multiline, bullet points, markdown-formatted)

> **Important**: These fields can be several paragraphs long and contain:
> - Newlines (`\n`)
> - Bullet points (•)
> - Rich text formatting
> - Non-breaking spaces (cleaned during processing)
> - **Raw HTML markup** (e.g., `<p>`, `<ul>`, `<span>`, inline attributes) — particularly in greenhouse `jobDescription`. Sanitize before rendering to avoid XSS in downstream consumers.

### Other Fields
- **isNew** (boolean) - Whether this is a newly posted job (`true` or `false`)
- **location** (string) - Work location (may be empty)

## Data Characteristics

### Data Types
- **Strings**: All text fields are cleaned (trimmed, non-breaking spaces removed)
- **Numbers**: Experience years stored as integers; `startDate` and `closingDate` stored as Unix timestamps in milliseconds
- **Booleans**: `isNew` stored as boolean `true`/`false`
- **Nullable**: `closingDate` may be `null` for platforms that do not publish a deadline

### Data Quality
- All fields are present in every record
- Text fields may be empty strings if no data available or not applicable for the platform
- `postingNo` may be empty string for platforms that don't use posting identifiers
- `closingDate` may be `null` for platforms that don't publish a deadline (e.g., greenhouse, workable)
- Long text fields (`agencyDescription`, `jobDescription`, `jobResponsibilities`, `jobRequirements`) sourced from job details API for hrp; for greenhouse the combined description lands in `jobDescription` (with HTML tags preserved) and the responsibilities/requirements fields are empty; for workable `jobDescription` and `jobRequirements` are populated from the per-job detail (HTML preserved) and `jobResponsibilities` is empty since Workable does not separate it
- If job details fetch fails, related fields will be empty strings

### Typical Dataset Size
- **~1,900+ records** (varies daily based on active postings)
- **JSON file**: ~10-15 MB (pretty-printed with 2-space indent)
- **CSV file**: ~5-8 MB

## Processing Pipeline

This data is generated by [scripts/fetch-jobs.ts](../../scripts/fetch-jobs.ts):

1. Fetches hrp job listings from OData endpoint → `data/job-listings-raw.json`
2. For each hrp job, fetches detailed information from job details endpoint
3. Fetches Greenhouse-hosted boards (e.g., `govtech`) inline via the public Greenhouse Job Board API
4. Fetches Workable accounts (e.g., `psd-sg`) inline — one listings call per account plus one detail call per posting (`https://apply.workable.com/api/v2/accounts/{account}/jobs/{shortcode}`)
5. Merges all sources into the flattened schema with a `platform` discriminator
6. Cleans all string fields (trim, remove `\u00a0`)
7. Converts OData dates (`/Date(timestamp)/`) and ISO 8601 dates to Unix timestamps
8. Decodes HTML entities in Greenhouse and Workable content while preserving HTML tags
9. Outputs both JSON and CSV formats

## Common Operations

### Filtering Jobs
```typescript
// Filter by platform
const hrpJobs = jobs.filter(j => j.platform === "hrp")
const workableJobs = jobs.filter(j => j.platform === "workable")
const greenhouseJobs = jobs.filter(j => j.platform === "greenhouse")

// Filter by jobId (note: meaning varies by platform)
// For hrp: filters by specific job ID
// For workable: filters by Workable account (e.g., "psd-sg")
// For greenhouse: filters by Greenhouse public job id
const specificJobId = jobs.filter(j => j.jobId === "17060737")
const psdJobs = jobs.filter(j => j.platform === "workable" && j.jobId === "psd-sg")

// Filter by agency
const moeJobs = jobs.filter(j => j.agency.includes("Education"))

// Filter by experience level
const entryLevel = jobs.filter(j => j.experienceYearsMin === 0)

// Filter by employment type
const permanent = jobs.filter(j => j.employmentType === "Permanent")
```

### Date Handling
```typescript
// Convert timestamp to Date object (closingDate may be null)
const closingDate = job.closingDate != null ? new Date(job.closingDate) : null

// Check if closing soon (within 7 days). Treat null as "no deadline" → never closing soon.
const now = Date.now()
const closingSoon = job.closingDate != null
  && (job.closingDate - now) / (1000 * 60 * 60 * 24) <= 7
```

### Text Processing
```typescript
// Split multiline fields
const responsibilities = job.jobResponsibilities.split('\n')

// Check for keywords in description
const hasTech = job.jobDescription.toLowerCase().includes('technology')
```

## Validation Rules

When working with this data:
- ✅ `platform` must be non-empty string (`"hrp"`, `"workable"`, `"greenhouse"`, ...)
- ✅ `jobId` format and meaning is platform-dependent (numeric string job ID for hrp; Workable account slug such as `psd-sg` for workable; Greenhouse public job id for greenhouse)
- ✅ `postingNo` format is platform-dependent (GUID for hrp; Workable `shortcode` for workable; empty string for greenhouse and other platforms without a posting concept)
- ✅ `startDate` must be a valid Unix timestamp; `closingDate` is a Unix timestamp or `null` (when the source platform does not publish a deadline)
- ✅ `experienceYearsMin` ≤ `experienceYearsMax`
- ✅ `isNew` must be boolean type (not string "true"/"false")
- ✅ Only `closingDate` may be `null`; all other absent values are empty strings

## Version Control

This data is committed to git and updated via GitHub Actions:
- Source data changes trigger automatic updates
- Git history preserves all changes over time
- Use `git log -- data/job-listings.json` to see update history
- Diffs show which jobs were added/removed/modified

## Related Files

- **Raw input**: [data/job-listings-raw.json](../../data/job-listings-raw.json) - OData response before processing
- **Processing script**: [scripts/fetch-jobs.ts](../../scripts/fetch-jobs.ts) - Transformation logic
- **Job details**: `data/tmp/job-{jobId}.json` - Individual job detail files (git-ignored)