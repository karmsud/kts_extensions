// Test the fixed XML parser for parsers section
console.log('=== TESTING FIXED XML PARSER FOR PARSERS ===');

// Simulate the parseParsers function with the fix
function parseParsers(parsers) {
  const result = [];
  if (!parsers) return result;

  // Mapping for parser type conversion from XML tags to database format
  const parserTypeMap = {
    'detachfilesubject': 'detach_file_subject',
    'detachfile': 'detach_file'
  };

  for (const [key, value] of Object.entries(parsers)) {
    if (typeof value === 'string') {
      const normalizedKey = key.toLowerCase();
      const parserType = parserTypeMap[normalizedKey] || normalizedKey;
      result.push({ parser_type: parserType, parser_value: value });
    }
  }
  return result;
}

// Simulate XML data from PowerShell outlook.ps1 (what the XML parser receives)
const simulatedXmlParsersData = {
  DetachFileSubject: '.*'
};

console.log('Input from XML:', simulatedXmlParsersData);

const parsedResult = parseParsers(simulatedXmlParsersData);
console.log('Parsed Result:', parsedResult);

// Check if this would work with our XML generation logic
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

// Test the XML generation with the fixed parsed data
function generateParsersXML(parsers) {
  if (!Array.isArray(parsers) || parsers.length === 0) {
    return 'NO PARSERS SECTION';
  }
  
  const parserTags = parsers
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
    return `  <Parsers>\n${parserTags}  </Parsers>\n`;
  }
  
  return 'NO PARSERS SECTION';
}

console.log('\nGenerated XML Parsers Section:');
console.log(generateParsersXML(parsedResult));

console.log('\n=== EXPECTED OUTPUT ===');
console.log('Should generate:');
console.log(`  <Parsers>
    <DetachFileSubject>.*</DetachFileSubject>
  </Parsers>`);

console.log('\n=== VERIFICATION ===');
const expectedParserType = 'detach_file_subject';
const actualParserType = parsedResult[0]?.parser_type;
console.log(`Expected parser_type: "${expectedParserType}"`);
console.log(`Actual parser_type: "${actualParserType}"`);
console.log(`Match: ${expectedParserType === actualParserType ? '✅ YES' : '❌ NO'}`);

console.log('\n=== CONCLUSION ===');
if (expectedParserType === actualParserType) {
  console.log('✅ FIX SUCCESSFUL: The parser type mapping is now correct!');
  console.log('After re-importing the XML data, ServicerID 239 should show the Parsers section.');
} else {
  console.log('❌ FIX FAILED: Parser type mapping still incorrect.');
}
