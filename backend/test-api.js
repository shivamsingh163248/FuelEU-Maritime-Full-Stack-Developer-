#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

const apiTests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: `${BASE_URL}/health`
  },
  {
    name: 'Get All Routes',
    method: 'GET',
    url: `${BASE_URL}/api/routes`
  },
  {
    name: 'Get Routes with Filters',
    method: 'GET',
    url: `${BASE_URL}/api/routes?vesselType=Container&fuelType=HFO`
  },
  {
    name: 'Create New Route',
    method: 'POST',
    url: `${BASE_URL}/api/routes`,
    data: {
      vesselName: 'Test Vessel',
      vesselType: 'Container',
      imoNumber: 'IMO9999999',
      departurePort: 'Test Port A',
      arrivalPort: 'Test Port B',
      departureDate: '2024-12-01T08:00:00Z',
      arrivalDate: '2024-12-05T16:00:00Z',
      distanceNm: 1000,
      fuelType: 'HFO',
      fuelConsumedTons: 50,
      ghgIntensity: 90.5
    }
  }
];

async function runTest(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📍 ${test.method} ${test.url}`);
    
    const config = {
      method: test.method.toLowerCase(),
      url: test.url,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (test.data) {
      config.data = test.data;
      console.log(`📦 Request Body:`, JSON.stringify(test.data, null, 2));
    }
    
    const response = await axios(config);
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
    console.log(`📄 Details:`, error.response?.data || error.message);
    
    return { 
      success: false, 
      status: error.response?.status || 0, 
      error: error.response?.data || error.message 
    };
  }
}

async function runAllTests() {
  console.log('🎯 FuelEU Maritime API Test Suite');
  console.log('================================\n');
  
  const results = [];
  
  for (const test of apiTests) {
    const result = await runTest(test);
    results.push({ ...test, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const passed = results.filter(r => r.result.success).length;
  const total = results.length;
  
  console.log(`\nPassed: ${passed}/${total} tests`);
  
  results.forEach((test, index) => {
    const status = test.result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the API endpoints.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, runTest };
