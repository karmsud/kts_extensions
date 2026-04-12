// Test to debug missing Parsers section for ServicerID 239
console.log('=== DEBUGGING PARSERS SECTION FOR SERVICER ID 239 ===');

// Simulate job data that SHOULD have parsers (like ServicerID 239 based on PowerShell config)
const jobWithParsers = {
  job_name: 'CMBS_Berkadia',
  mailbox: 'reports@example.com',
  folder: 'Inbox',
  sme: 'admin@example.com,user@example.com',
  last_email: '2025-07-17T23:09:30.000Z',
  save_location: 'M:\\{DealFolder}\\Data\\{YYYY}\\{M}\\EmailExtract',
  servicer_id: '239',
  queue_one_file: true,
  filters: [
    { filter_type: 'from', filter_value: '@berkadia.com' },
    { filter_type: 'attachments', filter_value: 'True' }
  ],
  parsers: [
    { parser_type: 'detach_file_subject', parser_value: '.*' }
  ],
  templates: [
    { template_name: 'Main', template_value: 'QueueCMBS_Scrubber_x' }
  ]
};

// Simulate job data WITHOUT parsers (what might be coming from database)
const jobWithoutParsers = {
  job_name: 'CMBS_Berkadia',
  mailbox: 'reports@example.com',
  folder: 'Inbox',
  sme: 'admin@example.com,user@example.com',
  last_email: '2025-07-17T23:09:30.000Z',
  save_location: 'M:\\{DealFolder}\\Data\\{YYYY}\\{M}\\EmailExtract',
  servicer_id: '239',
  queue_one_file: true,
  filters: [
    { filter_type: 'from', filter_value: '@berkadia.com' },
    { filter_type: 'attachments', filter_value: 'True' }
  ],
  parsers: [], // Empty parsers array
  templates: [
    { template_name: 'Main', template_value: 'QueueCMBS_Scrubber_x' }
  ]
};

// Helper functions
function isBlank(value) {
  return value === null || value === undefined || value === '' || 
         (typeof value === 'string' && value.trim() === '');
}

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateJobXML(job) {
  if (!job || isBlank(job.job_name)) return '';
  
  const rootTag = esc(job.job_name);
  let xml = `<${rootTag}>\n`;
  
  // Core elements in correct order (matching PowerShell lines 239-275)
  if (!isBlank(job.mailbox)) xml += `  <Mailbox>${esc(job.mailbox)}</Mailbox>\n`;
  if (!isBlank(job.folder)) xml += `  <Folder>${esc(job.folder)}</Folder>\n`;
  if (!isBlank(job.sme)) xml += `  <SME>${esc(job.sme)}</SME>\n`;
  if (!isBlank(job.last_email)) xml += `  <LastEmail>${esc(job.last_email)}</LastEmail>\n`;
  if (!isBlank(job.save_location)) xml += `  <SaveLocation>${esc(job.save_location)}</SaveLocation>\n`;
  
  // Filters
  if (Array.isArray(job.filters) && job.filters.length > 0) {
    const filterTags = job.filters
      .filter(f => f && !isBlank(f.filter_type) && !isBlank(f.filter_value))
      .map(f => {
        if (f.filter_type === 'from') {
          return `    <From>${esc(f.filter_value)}</From>\n`;
        } else if (f.filter_type === 'attachments') {
          return `    <Attachments>${esc(f.filter_value)}</Attachments>\n`;
        } else if (f.filter_type === 'subject') {
          return `    <Subject>${esc(f.filter_value)}</Subject>\n`;
        }
        return '';
      })
      .join('');
    if (filterTags) {
      xml += `  <Filters>\n${filterTags}  </Filters>\n`;
    }
  }
  
  // Parsers - DEBUG THIS SECTION
  console.log('=== PARSER DEBUG INFO ===');
  console.log('job.parsers:', job.parsers);
  console.log('Array.isArray(job.parsers):', Array.isArray(job.parsers));
  console.log('job.parsers.length:', job.parsers?.length);
  
  if (Array.isArray(job.parsers) && job.parsers.length > 0) {
    console.log('Processing parsers...');
    const parserTags = job.parsers
      .filter(p => {
        console.log('Parser item:', p);
        console.log('Filter check - p exists:', !!p);
        console.log('Filter check - parser_type not blank:', !isBlank(p?.parser_type));
        console.log('Filter check - parser_value not blank:', !isBlank(p?.parser_value));
        return p && !isBlank(p.parser_type) && !isBlank(p.parser_value);
      })
      .map(p => {
        console.log('Mapping parser:', p);
        if (p.parser_type === 'detach_file_subject') {
          console.log('Creating DetachFileSubject tag');
          return `    <DetachFileSubject>${esc(p.parser_value)}</DetachFileSubject>\n`;
        } else if (p.parser_type === 'detach_file') {
          console.log('Creating DetachFile tag');
          return `    <DetachFile>${esc(p.parser_value)}</DetachFile>\n`;
        }
        console.log('Parser type not recognized:', p.parser_type);
        return '';
      })
      .join('');
    
    console.log('Final parserTags:', JSON.stringify(parserTags));
    
    if (parserTags) {
      xml += `  <Parsers>\n${parserTags}  </Parsers>\n`;
      console.log('Added Parsers section to XML');
    } else {
      console.log('No parserTags generated, skipping Parsers section');
    }
  } else {
    console.log('No parsers to process (empty array or null)');
  }
  
  // ServicerID, QueueOneFile and other properties
  if (!isBlank(job.servicer_id)) xml += `  <ServicerID>${esc(job.servicer_id)}</ServicerID>\n`;
  if (job.queue_one_file !== undefined && job.queue_one_file !== null) xml += `  <QueueOneFile>${job.queue_one_file ? 'True' : 'False'}</QueueOneFile>\n`;
  
  // Templates
  if (Array.isArray(job.templates) && job.templates.length > 0) {
    const templateTags = job.templates
      .filter(t => t && !isBlank(t.template_name) && !isBlank(t.template_value))
      .map(t => `    <${esc(t.template_name)}>${esc(t.template_value)}</${esc(t.template_name)}>\n`)
      .join('');
    if (templateTags) {
      xml += `  <Templates>\n${templateTags}  </Templates>\n`;
    }
  }
  xml += `</${rootTag}>`;
  return xml;
}

// Test 1: Job WITH parsers (how it should work)
console.log('\n=== TEST 1: Job WITH parsers (expected behavior) ===');
const xmlWithParsers = generateJobXML(jobWithParsers);
console.log(xmlWithParsers);

// Test 2: Job WITHOUT parsers (current problem)
console.log('\n=== TEST 2: Job WITHOUT parsers (current issue) ===');
const xmlWithoutParsers = generateJobXML(jobWithoutParsers);
console.log(xmlWithoutParsers);

// Test 3: Check specific PowerShell structure
console.log('\n=== TEST 3: PowerShell Expected Structure ===');
console.log(`<CMBS_Berkadia>
  <Mailbox>reports@example.com</Mailbox>
  <Folder>Inbox</Folder>
  <SME>admin@example.com,user@example.com</SME>
  <LastEmail>7/17/2025 4:09:30 PM</LastEmail>
  <SaveLocation>M:\\{DealFolder}\\Data\\{YYYY}\\{M}\\EmailExtract</SaveLocation>
  <Filters>
    <From>@berkadia.com</From>
    <Attachments>True</Attachments>
  </Filters>
  <Parsers>
    <DetachFileSubject>.*</DetachFileSubject>
  </Parsers>
  <ServicerID>239</ServicerID>
  <QueueOneFile>True</QueueOneFile>
  <Templates>
    <Main>QueueCMBS_Scrubber_x</Main>
  </Templates>
</CMBS_Berkadia>`);

console.log('\n=== CONCLUSION ===');
console.log('If Test 1 shows Parsers section and Test 2 does not, then the issue is:');
console.log('The job with ServicerID 239 has an empty parsers array in the database.');
console.log('This needs to be fixed by either:');
console.log('1. Adding the missing parser data to the database');
console.log('2. Or ensuring the data import/sync process includes parsers');
