// API Test Script
// Test all backend endpoints to ensure they're working

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing FuelEU Maritime APIs...\n');
  
  // Test endpoints
  const endpoints = [
    { method: 'GET', path: '/health', description: 'Health Check' },
    { method: 'GET', path: '/api/v1/routes', description: 'Get Routes' },
    { method: 'GET', path: '/api/v1/compliance', description: 'Get Compliance Data' },
    { method: 'GET', path: '/api/v1/banking', description: 'Get Banking Data' },
    { method: 'GET', path: '/api/v1/pools', description: 'Get Pools Data' },
    { method: 'GET', path: '/api/v1/database/tables', description: 'Database Schema' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.description}: Status ${response.status}`);
        
        if (data.count !== undefined) {
          console.log(`   📊 Records: ${data.count}`);
        }
        if (data.total_tables !== undefined) {
          console.log(`   📊 Tables: ${data.total_tables}`);
        }
        if (data.status) {
          console.log(`   🏥 Status: ${data.status}`);
        }
      } else {
        console.log(`❌ ${endpoint.description}: Status ${response.status}`);
        const errorData = await response.text();
        console.log(`   Error: ${errorData}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.description}: Connection Failed`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test POST endpoint
  try {
    console.log('Testing POST /api/v1/routes/sample - Create Sample Route');
    
    const response = await fetch(`${baseUrl}/api/v1/routes/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Create Sample Route: Status ${response.status}`);
      console.log(`   🚢 Ship ID: ${data.data?.ship_id}`);
      console.log(`   📍 Route: ${data.data?.departure_port} → ${data.data?.arrival_port}`);
      console.log(`   ⚖️ Carbon Balance: ${data.data?.calculated_cb} tCO2eq`);
    } else {
      console.log(`❌ Create Sample Route: Status ${response.status}`);
      const errorData = await response.text();
      console.log(`   Error: ${errorData}`);
    }
  } catch (error) {
    console.log(`❌ Create Sample Route: Connection Failed`);
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎉 API Testing Complete!');
}

// Check if running as main module
if (require.main === module) {
  testAPIs().catch(console.error);
}

export { testAPIs };
