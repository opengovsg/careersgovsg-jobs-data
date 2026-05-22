/**
 * Postprocessing script for Singapore Government job listings
 * 
 * This script processes the fetched job data from the Careers@Gov OData API.
 * It is invoked by the Flat Data GitHub Action after fetching data.
 * 
 * The script receives the downloaded filename as the first argument.
 */

import { readJSON, writeJSON } from 'https://deno.land/x/flat@0.0.15/mod.ts'
import { stringify } from 'https://deno.land/std@0.218.0/csv/stringify.ts'
import { unescape as unescapeHtml } from 'https://deno.land/std@0.218.0/html/entities.ts'
import { existsSync } from 'jsr:@std/fs/exists'

interface ODataMetadata {
  id: string
  uri: string
  type: string
}

interface JobListing {
  __metadata: ODataMetadata
  Agnid: string
  Isfav: boolean
  agencytitle: string
  PostingNo: string
  Endda: string // OData date format: /Date(timestamp)/
  RequestType: string
  Fract: string
  ClosingDate: string
  Frdes: string
  Idesc: string
  RemainingDays: string
  Begda: string // OData date format: /Date(timestamp)/
  Exper: string
  Extxt: string
  Farea: string
  Frexp: string
  Sort: string
  Field: string
  Toexp: string
  Fdesc: string
  Jobid: string
  Joblv: string
  Posid: string
  Compt: string
  Newjb: string
  Agncy: string
  Educa: string
  Categ: string
  Jobtitle: string
  EmpType: string
  EmpTypeTxt: string
  Locationid: string
  LocationTxt: string
  JobSearchToDetail?: {
    __deferred: {
      uri: string
    }
  }
}

interface ODataResponse {
  d: {
    results: JobListing[]
  }
}

interface JobDetails {
  __metadata: ODataMetadata
  Apcnt: string
  Appid: string
  Isexp: boolean
  Extxt: string
  Isldp: boolean
  Ismha: boolean
  Joblk: string
  Ismoe: boolean
  Reson: string
  Werks: string
  Isalt: boolean
  Isfav: boolean
  Isupd: boolean
  Isdup: boolean
  PostingNo: string
  Fract: string
  Hdesc: string
  Jobid: string
  Frdes: string
  Idesc: string
  Jobdesc: string
  Fdesc: string
  Jobres: string
  Reqid: string
  Jobreq: string
  compt: string
  categ: string
  emptype: string
  Location: string
  Closedate: string
  agncyid: string
  Remdays: string
  Jobtitle: string
  agencytitle: string
  agencydesc: string
  Conty: string
  Hierl: string
  Indus: string
  Farea: string
  Frexp: string
  Toexp: string
  CompTextSet?: {
    __deferred: {
      uri: string
    }
  }
}

interface JobDetailsResponse {
  d: JobDetails
}

interface GreenhouseMetadataItem {
  id: number
  name: string
  value: unknown
  value_type: string
}

interface GreenhouseJob {
  id: number
  internal_job_id: number
  requisition_id: string
  title: string
  company_name: string
  absolute_url: string
  first_published: string
  updated_at: string
  application_deadline: string | null
  language: string
  content: string
  education: string | null
  location: { name: string } | null
  metadata: GreenhouseMetadataItem[]
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
  meta?: { total: number }
}

interface ProcessedJob {
  platform: string
  postingNo: string
  jobId: string
  jobTitle: string
  agency: string
  agencyId: string
  agencyDescription: string
  startDate: string
  closingDate: string
  closingDateText: string
  remainingDays: string
  employmentType: string
  employmentTypeCode: string
  experienceRequired: string
  experienceYearsMin: number
  experienceYearsMax: number
  field: string
  fieldCode: string
  functionalArea: string
  functionalAreaCode: string
  industry: string
  educationCode: string
  isNew: boolean
  location: string
  jobDescription: string
  jobResponsibilities: string
  jobRequirements: string
  category: string
  workArrangement: string
}

/**
 * Extract epoch millis from OData date format
 * OData format: /Date(1768262400000)/
 */
function parseODataDate(odataDate: string): number {
  if (!odataDate || odataDate === '') return NaN
  
  const match = odataDate.match(/\/Date\((\d+)\)\//)
  if (!match) return NaN
  
  const timestamp = parseInt(match[1], 10)
  return timestamp
}

/**
 * Parse ISO 8601 date to epoch millis. Returns NaN for null/empty/invalid input.
 */
function parseISODate(iso: string | null | undefined): number {
  return iso ? Date.parse(iso) : NaN
}

/**
 * Clean string by trimming and removing non-breaking spaces
 */
function cleanString(str: string): string {
  return str.replace(/\u00a0/g, ' ').trim()
}

/**
 * Decode HTML entities, applied iteratively to handle double-encoded inputs
 * (e.g. Greenhouse content where `&` characters are encoded as `&amp;amp;`).
 * HTML tags are left intact.
 */
function decodeHtmlEntities(input: string): string {
  if (!input) return ''
  let prev = input
  let curr = unescapeHtml(prev)
  while (curr !== prev) {
    prev = curr
    curr = unescapeHtml(prev)
  }
  return curr
}

/**
 * Parse Greenhouse experience-level strings into a numeric range.
 * Inputs look like "0 - 1 year", "1 - 3 years", "> 10 years".
 * When multiple levels are selected, the range spans the union.
 */
function parseExperienceLevels(levels: string[]): { min: number; max: number } {
  let min = Infinity
  let max = 0
  for (const lvl of levels) {
    if (!lvl) continue
    const gt = lvl.match(/>\s*(\d+)/)
    if (gt) {
      const n = parseInt(gt[1], 10)
      min = Math.min(min, n)
      max = Math.max(max, n)
      continue
    }
    const range = lvl.match(/(\d+)\s*-\s*(\d+)/)
    if (range) {
      min = Math.min(min, parseInt(range[1], 10))
      max = Math.max(max, parseInt(range[2], 10))
    }
  }
  return { min: min === Infinity ? 0 : min, max }
}

/**
 * Fetch job details for a single job
 */
async function fetchJobDetails(postingNo: string, jobId: string): Promise<JobDetails | null> {
  const detailsBaseUrl = Deno.env.get('CAREERSGOVSG_JOB_DETAILS')
  
  if (!detailsBaseUrl) {
    console.warn('Warning: CAREERSGOVSG_JOB_DETAILS not set, skipping job details fetch')
    return null
  }

  const url = `${detailsBaseUrl}(PostingNo=guid'${postingNo}',Jobid='${jobId}')`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch details for job ${jobId} posting ${postingNo}: ${response.status}`)
      return null
    }
    
    const data = await response.json() as JobDetailsResponse
    return data.d
  } catch (error) {
    console.warn(`Error fetching details for job ${jobId} posting ${postingNo}:`, error)
    return null
  }
}

/**
 * Process a single job listing
 */
function processJobListing(job: JobListing, details: JobDetails | null, platform: string = 'hrp'): ProcessedJob {
  // Parse experience years
  let minExp = 0
  let maxExp = 0
  if (job.Frexp && job.Toexp) {
    minExp = parseInt(job.Frexp, 10) || 0
    maxExp = parseInt(job.Toexp, 10) || 0
  }

  return {
    platform,
    postingNo: job.PostingNo,
    jobId: job.Jobid,
    jobTitle: cleanString(job.Jobtitle),
    agency: cleanString(job.Agncy),
    agencyId: job.Agnid,
    agencyDescription: details ? cleanString(details.agencydesc) : '',
    startDate: parseODataDate(job.Begda),
    closingDate: parseODataDate(job.Endda),
    closingDateText: job.ClosingDate,
    remainingDays: job.RemainingDays,
    employmentType: job.EmpTypeTxt,
    employmentTypeCode: job.EmpType,
    experienceRequired: cleanString(job.Extxt),
    experienceYearsMin: minExp,
    experienceYearsMax: maxExp,
    field: cleanString(job.Fdesc),
    fieldCode: job.Field,
    functionalArea: cleanString(job.Fdesc),
    functionalAreaCode: job.Farea,
    industry: cleanString(job.Idesc),
    educationCode: job.Educa,
    isNew: job.Newjb === '1',
    location: details ? cleanString(details.Location) : cleanString(job.LocationTxt),
    jobDescription: details ? cleanString(details.Jobdesc) : '',
    jobResponsibilities: details ? cleanString(details.Jobres) : '',
    jobRequirements: details ? cleanString(details.Jobreq) : '',
    category: details ? cleanString(details.categ) : '',
    workArrangement: details ? cleanString(details.Frdes) : '',
  }
}

function getGreenhouseMeta(metadata: GreenhouseMetadataItem[], name: string): unknown {
  return metadata.find((m) => m.name === name)?.value
}

/**
 * Process a single Greenhouse job listing into the unified ProcessedJob shape.
 */
function processGreenhouseJob(job: GreenhouseJob): ProcessedJob {
  const meta = job.metadata ?? []
  const organisation = getGreenhouseMeta(meta, 'Careers@Gov Organisation') as string | null
  const jobFunction = getGreenhouseMeta(meta, 'Careers@Gov Job Function') as string | null
  const empValue = getGreenhouseMeta(meta, 'Careers@Gov Employment Type') as string | null
  const expLevels =
    (getGreenhouseMeta(meta, 'Careers@Gov Experience Level') as string[] | null) ?? []

  // Greenhouse conflates employment type and work arrangement in one field.
  // Route "Full-time"/"Part-time" to workArrangement, everything else to employmentType.
  const isArrangement = empValue === 'Full-time' || empValue === 'Part-time'
  const employmentType = !empValue ? '' : isArrangement ? '' : empValue
  const workArrangement = !empValue ? '' : isArrangement ? empValue : ''

  const { min, max } = parseExperienceLevels(expLevels)
  const experienceRequired = expLevels.length > 0 ? expLevels.join(', ') : ''

  return {
    platform: 'greenhouse',
    postingNo: '',
    jobId: String(job.id),
    jobTitle: cleanString(job.title ?? ''),
    agency: cleanString(organisation ?? job.company_name ?? ''),
    agencyId: '',
    agencyDescription: '',
    startDate: parseISODate(job.first_published),
    closingDate: parseISODate(job.application_deadline),
    closingDateText: '',
    remainingDays: '',
    employmentType,
    employmentTypeCode: '',
    experienceRequired,
    experienceYearsMin: min,
    experienceYearsMax: max,
    field: '',
    fieldCode: '',
    functionalArea: '',
    functionalAreaCode: '',
    industry: cleanString(jobFunction ?? ''),
    educationCode: job.education ?? '',
    isNew: false,
    location: cleanString(job.location?.name ?? ''),
    jobDescription: cleanString(decodeHtmlEntities(job.content ?? '')),
    jobResponsibilities: '',
    jobRequirements: '',
    category: '',
    workArrangement,
  }
}

/**
 * Fetch all jobs from a Greenhouse board's public API.
 * Throws on network or HTTP errors so the workflow fails loudly rather than
 * silently dropping the board's contribution from the committed output.
 * A legitimately empty `jobs` array is allowed.
 */
async function fetchGreenhouseBoard(board: string): Promise<GreenhouseJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`
  console.log(`Fetching Greenhouse board: ${board}`)
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Greenhouse fetch failed for ${board}: ${response.status} ${response.statusText}`)
  }
  const data = await response.json() as GreenhouseResponse
  return data.jobs ?? []
}

/**
 * Main processing function
 */
async function main() {
  // Get the filename from command line arguments
  const filename = Deno.args[0]
  
  if (!filename) {
    console.error('Error: No filename provided')
    Deno.exit(1)
  }

  console.log(`Processing: ${filename}`)

  try {
    // Read the fetched data
    const data = await readJSON(filename) as ODataResponse
    
    if (!data.d || !data.d.results) {
      console.error('Error: Invalid OData response structure')
      Deno.exit(1)
    }

    const jobs = data.d.results
    console.log(`Found ${jobs.length} job listings`)

    // Ensure temp directory exists
    const tmpPath = Deno.env.get('RUNNER_TEMP') || '/tmp'
    if (!existsSync(tmpPath)) {
      await Deno.mkdir(tmpPath, { recursive: true })
    }

    // Fetch details for each job and process
    console.log('Fetching job details...')
    const processedJobs: ProcessedJob[] = []
    
    for (const [i, job] of jobs.entries()) {
      if (i > 0 && i % 50 === 0) {
        console.log(`  Processed ${i}/${jobs.length} jobs...`)
      }
      
      // Fetch job details
      const details = await fetchJobDetails(job.PostingNo, job.Jobid)
      
      // Save individual job details to tmp directory
      if (details) {
        const detailsFilename = `${tmpPath}/job-${job.Jobid}.json`
        await writeJSON(detailsFilename, details)
      }
      
      // Process and merge
      const processed = processJobListing(job, details)
      processedJobs.push(processed)
      
      // Small delay to avoid overwhelming the server
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`✅ Fetched details for ${processedJobs.length} jobs`)

    // Fetch and merge Greenhouse-hosted boards (e.g. GovTech)
    const greenhouseBoards = ['govtech']
    for (const board of greenhouseBoards) {
      const greenhouseJobs = await fetchGreenhouseBoard(board)
      const processed = greenhouseJobs.map(processGreenhouseJob)
      processedJobs.push(...processed)
      console.log(`✅ Processed ${processed.length} Greenhouse jobs from ${board}`)
    }

    // Generate statistics
    const stats = {
      totalJobs: processedJobs.length,
      platforms: [...new Set(processedJobs.map(j => j.platform))].sort(),
      employmentTypes: [...new Set(processedJobs.map(j => j.employmentType))].sort(),
    }

    // Save processed data with metadata
    const outputFilename = filename.replace('-raw.json', '.json')
    await writeJSON(outputFilename, processedJobs, null, 2)

    // Also save as CSV
    const csvFilename = filename.replace('-raw.json', '.csv')
    const csv = stringify(processedJobs, { columns: Object.keys(processedJobs[0]) })
    await Deno.writeTextFile(csvFilename, csv)

    console.log(`✅ Processed data saved to: ${outputFilename}`)
    console.log(`✅ CSV data saved to: ${csvFilename}`)
    console.log(`   Total jobs: ${stats.totalJobs}`)
    console.log(`   Platforms: ${stats.platforms.join(', ')}`)
    console.log(`   Employment types: ${stats.employmentTypes.join(', ')}`)

  } catch (error) {
    console.error('❌ Error processing data:', error)
    Deno.exit(1)
  }
}

// Run the main function
if (import.meta.main) {
  main()
}
