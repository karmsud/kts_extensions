const axios = require('axios');

async function testJobConfigAPI() {
  const BASE_URL = 'http://localhost:5000/api/v1';
  
  try {
    console.log('🔍 Testing Job Configuration API fixes...\n');
    
    // First, get all jobs
    console.log('1. Fetching all jobs...');
    const jobsResponse = await axios.get(`${BASE_URL}/jobs`);
    
    if (!jobsResponse.data.success || !jobsResponse.data.data.length) {
      console.log('❌ No jobs found. Please import some jobs first.');
      return;
    }
    
    const jobs = jobsResponse.data.data;
    console.log(`✅ Found ${jobs.length} jobs`);
    
    // Test with the first job
    const testJob = jobs[0];
    console.log(`\n2. Testing job configuration for: "${testJob.job_name}" (ID: ${testJob.id})`);
    
    // Test the job config endpoint
    console.log('\n3. Fetching job configuration...');
    const configResponse = await axios.get(`${BASE_URL}/jobs/${testJob.id}/config`);
    
    console.log('📊 Configuration Response:');
    console.log(JSON.stringify(configResponse.data, null, 2));
    
    // Check for the specific fields we fixed
    const config = configResponse.data;
    
    console.log('\n4. Checking for fixed fields:');
    console.log(`   📧 From Filter: ${config.filters?.from || 'Not set'}`);
    console.log(`   🏢 Servicer ID: ${config.servicer_id || 'Not set'}`);
    console.log(`   ⚙️ Priority: ${config.priority || 'Not set'}`);
    console.log(`   🔧 Server Side: ${config.server_side ? 'Enabled' : 'Disabled'}`);
    console.log(`   📁 Queue One File: ${config.queue_one_file ? 'Enabled' : 'Disabled'}`);
    
    // Test saving a configuration (update test)
    console.log('\n5. Testing configuration update...');
    const testConfig = {
      ...config,
      filters: {
        ...config.filters,
        from: '@test.com',
        subject: 'Test Update'
      },
      servicer_id: 999,
      priority: 5
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/jobs/${testJob.id}/config`, testConfig);
    console.log('✅ Configuration update successful');
    
    // Verify the update worked
    console.log('\n6. Verifying update...');
    const verifyResponse = await axios.get(`${BASE_URL}/jobs/${testJob.id}/config`);
    const updatedConfig = verifyResponse.data;
    
    console.log('📊 Updated Configuration:');
    console.log(`   📧 From Filter: ${updatedConfig.filters?.from}`);
    console.log(`   🏢 Servicer ID: ${updatedConfig.servicer_id}`);
    console.log(`   ⚙️ Priority: ${updatedConfig.priority}`);
    
    // Verify the changes
    if (updatedConfig.filters?.from === '@test.com' && 
        updatedConfig.servicer_id === 999 && 
        updatedConfig.priority === 5) {
      console.log('\n✅ SUCCESS: All fields are properly stored and retrieved!');
    } else {
      console.log('\n❌ FAILURE: Some fields were not properly saved');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testJobConfigAPI(); 