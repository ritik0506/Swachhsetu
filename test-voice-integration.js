/**
 * Test Script for Voice-to-Text Linguistic Analysis Integration
 * 
 * Tests the complete flow:
 * 1. Simulates a voice transcript (text input)
 * 2. Sends to linguistic analysis API
 * 3. Validates response structure
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/ai/linguistic/analyze';

// Test transcripts in different scenarios
const testCases = [
  {
    name: 'Hindi Mixed English',
    transcript: 'MG Road par bada gadha hai, please jaldi thik karwa do. Bohot problem ho raha hai.',
    expectedLanguage: 'Hindi',
    expectedUrgency: 'Medium'
  },
  {
    name: 'Pure English',
    transcript: 'There is a big pothole on Market Road near the bus stop. It is causing traffic problems.',
    expectedLanguage: 'English',
    expectedUrgency: 'Medium'
  },
  {
    name: 'Urgent Issue',
    transcript: 'Sewage overflow near school. Very dangerous for children. Emergency situation!',
    expectedLanguage: 'English',
    expectedUrgency: 'High'
  },
  {
    name: 'Short Transcript (Should fail)',
    transcript: 'Bad',
    shouldFail: true
  },
  {
    name: 'Empty Transcript (Should fail)',
    transcript: '',
    shouldFail: true
  }
];

async function testLinguisticAnalysis(testCase) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 Testing: ${testCase.name}`);
  console.log('='.repeat(60));
  console.log(`📝 Input: "${testCase.transcript}"`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(API_URL, {
      transcript: testCase.transcript
    }, {
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    
    if (testCase.shouldFail) {
      console.log('❌ TEST FAILED: Expected to fail but succeeded');
      return false;
    }
    
    const result = response.data;
    
    console.log(`\n✅ Response received in ${duration}ms`);
    console.log('\n📊 Analysis Results:');
    console.log('─'.repeat(60));
    console.log(`✓ Success: ${result.success}`);
    console.log(`✓ English Translation: ${result.english_translation}`);
    console.log(`✓ Summarized Complaint: ${result.summarized_complaint}`);
    console.log(`✓ Detected Language: ${result.detected_language}`);
    console.log(`✓ Sentiment: ${result.sentiment_tone}`);
    console.log(`✓ Urgency: ${result.urgency_rating}`);
    console.log(`✓ Location: ${result.extracted_location || 'Not mentioned'}`);
    console.log(`✓ Confidence: ${result.confidence}`);
    console.log(`✓ Processing Time: ${result.processing_time_ms}ms`);
    
    // Validate structure
    const requiredFields = [
      'success', 'english_translation', 'summarized_complaint',
      'detected_language', 'sentiment_tone', 'urgency_rating'
    ];
    
    const missingFields = requiredFields.filter(field => !result[field]);
    
    if (missingFields.length > 0) {
      console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate expected values
    if (testCase.expectedLanguage && !result.detected_language.includes(testCase.expectedLanguage)) {
      console.log(`\n⚠️  Expected language: ${testCase.expectedLanguage}, Got: ${result.detected_language}`);
    }
    
    if (testCase.expectedUrgency && result.urgency_rating !== testCase.expectedUrgency) {
      console.log(`\n⚠️  Expected urgency: ${testCase.expectedUrgency}, Got: ${result.urgency_rating}`);
    }
    
    console.log('\n✅ TEST PASSED');
    return true;
    
  } catch (error) {
    if (testCase.shouldFail) {
      console.log(`\n✅ TEST PASSED: Failed as expected`);
      console.log(`Error: ${error.response?.data?.error || error.message}`);
      return true;
    }
    
    console.log('\n❌ TEST FAILED');
    console.log(`Error: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Voice-to-Text Linguistic Analysis Integration Tests');
  console.log('⏰ ' + new Date().toLocaleString());
  
  // Check if backend is running
  try {
    await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
    console.log('✅ Backend server is running');
  } catch (error) {
    console.log('❌ Backend server is not running on port 5000');
    console.log('Please start the backend: cd backend && npm start');
    process.exit(1);
  }
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await testLinguisticAnalysis(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Voice integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
