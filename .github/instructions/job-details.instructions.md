---
applyTo: "data/tmp/job-*.json"
---

# Job Details Schema

Individual job detail files stored in `data/tmp/` for temporary processing. These files are fetched from the OData JobDetailsSet endpoint and are git-ignored.

## Data Structure

Each file contains a single job's detailed information:

```json
{
  "__metadata": {
    "id": "...",
    "uri": "...",
    "type": "ZGERCGS001_SRV.JobDetails"
  },
  // Job detail fields...
}
```

## Job Details Fields

### Identifiers
- `PostingNo` (string) - Unique posting GUID
- `Jobid` (string) - Job ID
- `agncyid` (string) - Agency ID

### Content Fields
- `Jobtitle` (string) - Job title
- `agencytitle` (string) - Agency name
- `agencydesc` (string) - Agency description (markdown/multiline text)
- `Jobdesc` (string) - Job description (markdown/multiline text)
- `Jobres` (string) - Job responsibilities (markdown/multiline text, bullet points)
- `Jobreq` (string) - Job requirements (markdown/multiline text, bullet points)

### Categorization
- `categ` (string) - Category (e.g., "Others")
- `Fdesc` (string) - Field description
- `Idesc` (string) - Industry description (may contain `\u00a0`)
- `Farea` (string) - Functional area code
- `Indus` (string) - Industry code

### Employment Details
- `emptype` (string) - Employment type text (e.g., "Permanent/Contract")
- `Conty` (string) - Contract type code (e.g., "0003")
- `Fract` (string) - Work arrangement code (e.g., "01")
- `Frdes` (string) - Work arrangement description (e.g., "Full-time")
- `Location` (string) - Location text

### Experience & Education
- `Extxt` (string) - Experience requirement text (e.g., "05-10 year(s)")
- `Frexp` (string) - Minimum experience years
- `Toexp` (string) - Maximum experience years
- `Hierl` (string) - Hierarchy level code

### Dates
- `Closedate` (string) - Human-readable closing date (e.g., "Closing on 19 Feb 2026")
- `Remdays` (string) - Remaining days text (e.g., "Today")

### Flags (boolean)
- `Isfav` - Is favorite
- `Isexp` - Is experienced
- `Isldp` - Leadership development program flag
- `Ismha` - Mental health awareness flag
- `Ismoe` - Ministry of Education flag
- `Isalt` - Alternative flag
- `Isupd` - Is updated
- `Isdup` - Is duplicate

### Other Fields
- `Apcnt` (string) - Application count
- `Appid` (string) - Application ID
- `Werks` (string) - Work center code
- `Reson` (string) - Reason code
- `Joblk` (string) - Job link
- `Hdesc` (string) - Heading description
- `Reqid` (string) - Requisition ID
- `compt` (string) - Competency

### Deferred Navigation
- `CompTextSet` (object) - Competency text set (deferred)

## Data Characteristics

- **Format**: Single OData entity (not wrapped in results array)
- **Text fields**: Contain rich text with `\n` newlines and bullet points (`\u2022`)
- **Encoding**: UTF-8 (watch for `\u00a0` non-breaking spaces)
- **Long text**: `Jobdesc`, `Jobres`, `Jobreq`, `agencydesc` can be several paragraphs

## Processing Notes

1. Clean all string fields with `.replace(/\u00a0/g, ' ').trim()`
2. Text fields use `\n` for line breaks - preserve or convert as needed
3. Bullet points use Unicode character `\u2022`
4. These files are temporary - saved to `data/tmp/` and git-ignored
5. Boolean flags provide metadata about job characteristics
6. Experience fields (`Frexp`, `Toexp`) match those in job listings
