---
applyTo: "data/job-listings-raw.json"
---

# Job Listings Raw Data Schema

This file contains raw job listing data from Singapore Government agencies fetched via an OData service.

## Data Structure

The file follows OData v2 conventions:

```json
{
  "d": {
    "results": [
      // Array of job listing objects
    ]
  }
}
```

## Job Listing Object Schema

Each object in the `results` array has these fields:

### Core Identifiers
- `PostingNo` (string) - Unique GUID for the posting (e.g., "005056a3-d347-1fe1-80df-725f7689c286")
- `Jobid` (string) - Numeric job ID (e.g., "15219929")
- `Agnid` (string) - Agency ID code (e.g., "0000009145")

### Job Information
- `Jobtitle` (string) - Job title
- `Agncy` (string) - Agency name (e.g., "Sport Singapore")
- `agencytitle` (string) - Additional agency title (often empty)

### Dates (OData format: `/Date(milliseconds)/`)
- `Begda` (string) - Start date (e.g., `/Date(1768262400000)/`)
- `Endda` (string) - End date/closing date
- `ClosingDate` (string) - Human-readable (e.g., "Closing on 19 Feb 2026")
- `RemainingDays` (string) - Time remaining (e.g., "Today", "Closing in 3 day(s)")

### Experience
- `Exper` (string) - Experience code
- `Extxt` (string) - Human-readable (e.g., "05-10 year(s)", "Entry level")
- `Frexp` (string) - Minimum experience years (e.g., "05")
- `Toexp` (string) - Maximum experience years (e.g., "10")

### Categorization
- `Field` (string) - Field code (e.g., "0032")
- `Fdesc` (string) - Field description (e.g., "Community Development, Partnership & Eng")
- `Farea` (string) - Functional area code (e.g., "0012")
- `Idesc` (string) - Industry description (may contain trailing spaces/`\u00a0`)
- `Categ` (string) - Category code

### Employment
- `EmpType` (string) - Code (e.g., "0003", "0006")
- `EmpTypeTxt` (string) - Description (e.g., "Permanent/Contract", "Fixed Terms")

### Other Fields
- `Educa` (string) - Education requirement code
- `Fract`, `Frdes`, `Joblv`, `Posid`, `Compt`, `Sort`, `RequestType` - Various codes
- `Newjb` (string) - "1" if new job
- `Locationid`, `LocationTxt` (string) - Location (often empty)
- `Isfav` (boolean) - Favorite flag (always false in raw data)

### OData Metadata
- `__metadata` (object) - Contains `id`, `uri`, `type` fields
- `JobSearchToDetail` (object) - Deferred navigation property with URI to full details

## Data Characteristics

- **Total records**: ~1,900+ active listings (varies daily)
- **Date format**: Must be parsed with regex `/\/Date\((\d+)\)\//`
- **String cleaning**: Some fields contain `\u00a0` (non-breaking space) - should be trimmed
- **Empty fields**: Many optional fields are empty strings
- **Encoding**: UTF-8

## Processing Notes

When working with this file:
1. Parse OData dates by extracting milliseconds: `/Date(1768262400000)/ → 1768262400000`
2. Clean strings with `.replace(/\u00a0/g, ' ').trim()`
3. Parse experience ranges from `Frexp` and `Toexp` fields
4. The `__metadata` object can be excluded in processed output
5. Boolean `Isfav` is not meaningful in raw fetched data
