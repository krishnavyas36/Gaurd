/**
 * Test Script: Demonstrate Plaid Security Monitoring
 * This script shows how the security monitoring works with simulated Plaid data
 */

// Using built-in fetch (Node.js 18+) or fallback

const SECURITY_AGENT_URL = 'http://localhost:5000';

// Simulate different types of Plaid API calls with security monitoring
async function testPlaidMonitoring() {
  console.log('🔒 Testing Plaid Security Monitoring Integration');
  console.log('================================================\n');

  // Test 1: Monitor account data (safe)
  await testAccountsGet();
  
  // Test 2: Monitor transactions with PII (should trigger alerts)
  await testTransactionsWithPII();
  
  // Test 3: Monitor identity data (high sensitivity)
  await testIdentityData();
  
  // Test 4: Monitor error handling
  await testPlaidError();
  
  console.log('\n✅ All tests completed! Check your Security Agent dashboard.');
}

async function testAccountsGet() {
  console.log('1. Testing accounts/get monitoring...');
  
  const monitoringData = {
    source: 'plaid-api',
    endpoint: 'accounts/get',
    method: 'POST',
    requestData: {
      // Sanitized request (no access_token)
      count: 10,
      offset: 0
    },
    responseData: {
      status: 'success',
      recordCount: 3
    },
    responseTime: 250,
    timestamp: new Date().toISOString(),
    metadata: {
      plaidMethod: 'accountsGet',
      recordCount: 3
    }
  };
  
  try {
    const response = await fetch(`${SECURITY_AGENT_URL}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monitoringData)
    });
    
    const result = await response.json();
    console.log('   ✅ Account monitoring successful');
    console.log(`   📊 Risk Score: ${result.result?.riskScore || 0}`);
    console.log(`   🎯 Compliance: ${result.compliance?.compliant ? 'PASS' : 'VIOLATIONS DETECTED'}\n`);
  } catch (error) {
    console.error('   ❌ Account monitoring failed:', error.message);
  }
}

async function testTransactionsWithPII() {
  console.log('2. Testing transactions with PII detection...');
  
  const monitoringData = {
    source: 'plaid-api',
    endpoint: 'transactions/get',
    method: 'POST',
    requestData: {
      start_date: '2023-01-01',
      end_date: '2023-12-31',
      count: 100
    },
    responseData: {
      status: 'success',
      recordCount: 25
    },
    responseTime: 450,
    timestamp: new Date().toISOString(),
    metadata: {
      plaidMethod: 'transactionsGet',
      recordCount: 25,
      // Simulated transaction data that contains PII
      sampleData: [
        'Payment to John Doe - Account ending in 1234',
        'Transfer from checking account 987654321',
        'Purchase at Starbucks - john.doe@email.com'
      ]
    }
  };
  
  try {
    const response = await fetch(`${SECURITY_AGENT_URL}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monitoringData)
    });
    
    const result = await response.json();
    console.log('   ✅ Transaction monitoring successful');
    console.log(`   📊 Risk Score: ${result.result?.riskScore || 0}`);
    console.log(`   🎯 Compliance: ${result.compliance?.compliant ? 'PASS' : 'VIOLATIONS DETECTED'}`);
    
    if (result.compliance?.violations?.length > 0) {
      console.log('   🚨 Violations found:');
      result.compliance.violations.forEach((violation, index) => {
        console.log(`      ${index + 1}. ${violation.type}: ${violation.description} (${violation.severity})`);
      });
    }
    console.log();
  } catch (error) {
    console.error('   ❌ Transaction monitoring failed:', error.message);
  }
}

async function testIdentityData() {
  console.log('3. Testing identity data monitoring...');
  
  const monitoringData = {
    source: 'plaid-api',
    endpoint: 'identity/get',
    method: 'POST',
    requestData: {},
    responseData: {
      status: 'success',
      recordCount: 1
    },
    responseTime: 300,
    timestamp: new Date().toISOString(),
    metadata: {
      plaidMethod: 'identityGet',
      recordCount: 1,
      // Simulated identity data with high PII
      sampleData: [
        'Name: Jane Smith, SSN: 123-45-6789',
        'Email: jane.smith@example.com',
        'Phone: (555) 123-4567',
        'Address: 123 Main St, Anytown, ST 12345'
      ]
    }
  };
  
  try {
    const response = await fetch(`${SECURITY_AGENT_URL}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monitoringData)
    });
    
    const result = await response.json();
    console.log('   ✅ Identity monitoring successful');
    console.log(`   📊 Risk Score: ${result.result?.riskScore || 0}`);
    console.log(`   🎯 Compliance: ${result.compliance?.compliant ? 'PASS' : 'VIOLATIONS DETECTED'}`);
    
    if (result.compliance?.violations?.length > 0) {
      console.log('   🚨 Violations found:');
      result.compliance.violations.forEach((violation, index) => {
        console.log(`      ${index + 1}. ${violation.type}: ${violation.description} (${violation.severity})`);
      });
    }
    console.log();
  } catch (error) {
    console.error('   ❌ Identity monitoring failed:', error.message);
  }
}

async function testPlaidError() {
  console.log('4. Testing error monitoring...');
  
  // First, simulate monitoring of a failed API call
  const errorData = {
    source: 'plaid-api',
    endpoint: 'transactions/get',
    method: 'POST',
    requestData: {},
    responseData: {
      status: 'error',
      error: 'INVALID_ACCESS_TOKEN'
    },
    responseTime: 150,
    timestamp: new Date().toISOString(),
    metadata: {
      plaidMethod: 'transactionsGet',
      error: true,
      errorCode: 'INVALID_ACCESS_TOKEN'
    }
  };
  
  try {
    const response = await fetch(`${SECURITY_AGENT_URL}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });
    
    const result = await response.json();
    console.log('   ✅ Error monitoring successful');
    console.log(`   📊 Risk Score: ${result.result?.riskScore || 0}`);
    
    // Now create a security incident for the error
    const incidentData = {
      title: 'Plaid API Error: transactionsGet',
      description: 'Error in Plaid transactionsGet: INVALID_ACCESS_TOKEN',
      severity: 'medium',
      source: 'plaid-integration',
      metadata: {
        plaidMethod: 'transactionsGet',
        errorCode: 'INVALID_ACCESS_TOKEN',
        errorType: 'authentication'
      }
    };
    
    const incidentResponse = await fetch(`${SECURITY_AGENT_URL}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    });
    
    if (incidentResponse.ok) {
      console.log('   ✅ Security incident created for error');
    }
    console.log();
  } catch (error) {
    console.error('   ❌ Error monitoring failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPlaidMonitoring().catch(console.error);
}

module.exports = { testPlaidMonitoring };