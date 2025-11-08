// API Test Script - Test all endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(method: string, path: string, description: string) {
  try {
    console.log(`🧪 Testing ${method} ${path} - ${description}...`);
    
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description}: ${response.status} OK`);
      
      // Log relevant data
      if (data.count !== undefined) {
        console.log(`   📊 Records: ${data.count}`);
      }
      if (data.tables_count !== undefined) {
        console.log(`   📊 Tables: ${data.tables_count}`);
      }
      if (data.status) {
        console.log(`   🏥 Status: ${data.status}`);
      }
      if (data.database) {
        console.log(`   💾 Database: ${data.database}`);
      }
      
      return { success: true, status: response.status, data };
    } else {
      console.log(`❌ ${description}: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.log(`❌ ${description}: Connection Failed`);
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function runTests() {
  console.log('🚀 FuelEU Maritime API Test Suite\n');
  console.log('='.repeat(50));
  
  const tests = [
    { method: 'GET', path: '/', description: 'Root Endpoint' },
    { method: 'GET', path: '/health', description: 'Health Check' },
    { method: 'GET', path: '/api/v1/database', description: 'Database Status' },
    { method: 'GET', path: '/api/v1/routes', description: 'Routes API' },
    { method: 'GET', path: '/api/v1/compliance', description: 'Compliance API' },
    { method: 'GET', path: '/api/v1/banking', description: 'Banking API' },
    { method: 'GET', path: '/api/v1/pools', description: 'Pools API' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.method, test.path, test.description);
    results.push({ ...test, ...result });
    console.log(); // Empty line for readability
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('📋 TEST SUMMARY\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful tests: ${successful}`);
  console.log(`❌ Failed tests: ${failed}`);
  console.log(`📊 Total tests: ${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.method} ${result.path}: ${result.success ? result.status : 'FAILED'}`);
  });
  
  return { successful, failed, total: results.length };
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Wait a bit for server to start
  console.log('⏳ Waiting for server to start...\n');
  setTimeout(() => {
    runTests().catch(console.error);
  }, 2000);
}

export { runTests };
