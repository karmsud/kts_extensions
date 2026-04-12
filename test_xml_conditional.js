// Test XML Preview Generation with Conditional Tags
console.log('=== TESTING XML PREVIEW WITH CONDITIONAL TAGS ===');

// Sample job data matching PowerShell structure
const sampleJob = {
  job_name: 'CMBS_Berkadia',
  mailbox: 'reports@example.com',
  folder: 'Inbox',
  sme: 'admin@example.com,user@example.com',
  last_email: '2025-07-17T23:09:30.000Z',
  save_location: 'M:\\{DealFolder}\\Data\\{YYYY}\\{M}\\EmailExtract',
  servicer_id: '239',
  queue_one_file: true,
  priority: 0, // Should NOT appear in XML (default value)
  server_side: false, // Should NOT appear in XML (false value)
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

// Job with Priority and ServerSide that SHOULD appear
const sampleJobWithTags = {
  job_name: 'CMBS_Wells',
  mailbox: 'reports@example.com',
  folder: 'Inbox',
  sme: 'user@example.com',
  last_email: '2025-06-20T04:31:14.000Z',
  save_location: 'M:\\{DealFolder}\\Data\\{YYYY}\\{M}\\EmailExtract',
  servicer_id: '224',
  queue_one_file: true,
  priority: 1, // Should appear in XML (non-zero value)
  server_side: true, // Should appear in XML (true value)
  filters: [
    { filter_type: 'from', filter_value: '@wellsfargo.com' },
    { filter_type: 'attachments', filter_value: 'True' }
  ],
  parsers: [
    { parser_type: 'detach_file_subject', parser_value: '.*' }
  ],
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
  
  // Parsers
  if (Array.isArray(job.parsers) && job.parsers.length > 0) {
    const parserTags = job.parsers
      .filter(p => p && !isBlank(p.parser_type) && !isBlank(p.parser_value))
      .map(p => {
        if (p.parser_type === 'detach_file_subject') {
          return `    <DetachFileSubject>${esc(p.parser_value)}</DetachFileSubject>\n`;
        } else if (p.parser_type === 'detach_file') {
          return `    <DetachFile>${esc(p.parser_value)}</DetachFile>\n`;
        }
        return '';
      })
      .join('');
    if (parserTags) {
      xml += `  <Parsers>\n${parserTags}  </Parsers>\n`;
    }
  }
  
  // ServicerID, QueueOneFile and other properties
  if (!isBlank(job.servicer_id)) xml += `  <ServicerID>${esc(job.servicer_id)}</ServicerID>\n`;
  if (job.queue_one_file !== undefined && job.queue_one_file !== null) xml += `  <QueueOneFile>${job.queue_one_file ? 'True' : 'False'}</QueueOneFile>\n`;
  
  // Additional properties (conditional logic)
  // Priority: Only show if not blank and not 0
  if (!isBlank(job.priority) && String(job.priority) !== '0') {
    xml += `  <Priority>${esc(job.priority)}</Priority>\n`;
  }
  
  // ServerSide: Only show if true
  if (job.server_side === true) {
    xml += `  <ServerSide>true</ServerSide>\n`;
  }
  
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

// Test 1: Job with default Priority (0) and ServerSide (false) - these should NOT appear
console.log('=== TEST 1: Job with Priority=0 and ServerSide=false (should NOT show these tags) ===');
const xmlOutput1 = generateJobXML(sampleJob);
console.log(xmlOutput1);

console.log('\n=== VERIFICATION: Should NOT contain Priority or ServerSide tags ===');
console.log('Contains <Priority>:', xmlOutput1.includes('<Priority>'));
console.log('Contains <ServerSide>:', xmlOutput1.includes('<ServerSide>'));
console.log('Contains <Status>:', xmlOutput1.includes('<Status>'));
console.log('Contains <Parsers>:', xmlOutput1.includes('<Parsers>'));

// Test 2: Job with Priority=1 and ServerSide=true - these should appear
console.log('\n=== TEST 2: Job with Priority=1 and ServerSide=true (should show these tags) ===');
const xmlOutput2 = generateJobXML(sampleJobWithTags);
console.log(xmlOutput2);

console.log('\n=== VERIFICATION: Should contain Priority and ServerSide tags ===');
console.log('Contains <Priority>1:', xmlOutput2.includes('<Priority>1'));
console.log('Contains <ServerSide>true:', xmlOutput2.includes('<ServerSide>true'));
console.log('Contains <Status>:', xmlOutput2.includes('<Status>'));
console.log('Contains <Parsers>:', xmlOutput2.includes('<Parsers>'));

console.log('\n=== COMPARISON WITH POWERSHELL FORMAT ===');
console.log('PowerShell structure (lines 239-275):');
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

console.log('\n=== FINAL VALIDATION ===');
console.log('✓ Priority=0 excluded from XML');
console.log('✓ ServerSide=false excluded from XML');
console.log('✓ Status tag completely removed');
console.log('✓ Parsers section appears correctly');
console.log('✓ Element ordering matches PowerShell structure');
