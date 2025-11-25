/**
 * AI Services Test Script
 * Run with: node test-ai.js
 */

require('dotenv').config();
const ollamaService = require('./services/ollamaService');
const aiTriageService = require('./services/aiTriageService');
const aiTranslationService = require('./services/aiTranslationService');
const aiFollowupService = require('./services/aiFollowupService');
const aiAssignmentService = require('./services/aiAssignmentService');

// Test data
const testReport = {
  category: 'toilet',
  title: 'गंदा शौचालय',
  description: 'मरीन ड्राइव के पास सार्वजनिक शौचालय बहुत गंदा है। पानी नहीं है और बदबू आ रही है।',
  location: {
    type: 'Point',
    coordinates: [72.8234, 18.9432],
    address: 'Marine Drive, Mumbai'
  },
  severity: 'medium'
};

const testInspectors = [
  {
    _id: '1',
    name: 'Rajesh Kumar',
    skills: ['toilet', 'plumbing'],
    activeTickets: 3,
    maxCapacity: 10,
    isAvailable: true,
    status: 'active',
    currentLocation: {
      coordinates: [72.8250, 18.9450]
    },
    successRate: 92
  },
  {
    _id: '2',
    name: 'Priya Sharma',
    skills: ['waste', 'general'],
    activeTickets: 8,
    maxCapacity: 10,
    isAvailable: true,
    status: 'active',
    currentLocation: {
      coordinates: [72.8400, 18.9600]
    },
    successRate: 88
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function testOllamaConnection() {
  section('Test 1: Ollama Connection');
  
  try {
    log('Checking Ollama health...', 'cyan');
    const health = await ollamaService.healthCheck();
    
    if (health.status === 'healthy') {
      log('✓ Ollama is running', 'green');
      log(`Available models: ${health.models.join(', ')}`, 'blue');
      return true;
    } else {
      log('✗ Ollama is not healthy', 'red');
      log(`Error: ${health.message}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to connect to Ollama', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testReportTriage() {
  section('Test 2: Report Triage');
  
  try {
    log('Triaging test report...', 'cyan');
    log(`Report: "${testReport.title}"`, 'blue');
    
    const startTime = Date.now();
    const result = await aiTriageService.triageReport(testReport);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✓ Triage completed in ${duration}s`, 'green');
      console.log('\nTriage Results:');
      console.log(JSON.stringify(result.analysis, null, 2));
      
      log(`\nDetected Language: ${result.analysis.language?.name || 'Unknown'}`, 'yellow');
      log(`Confidence: ${(result.analysis.confidence * 100).toFixed(1)}%`, 'yellow');
      log(`Severity: ${result.analysis.severity}`, 'yellow');
      log(`Priority: ${result.analysis.priority}/5`, 'yellow');
      
      return true;
    } else {
      log('✗ Triage failed', 'red');
      log(`Error: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Triage test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testTranslation() {
  section('Test 3: Translation');
  
  try {
    log('Testing Hindi to English translation...', 'cyan');
    
    const hindiText = 'यह शौचालय बहुत गंदा है और इसे तुरंत साफ करने की आवश्यकता है।';
    log(`Original: ${hindiText}`, 'blue');
    
    const startTime = Date.now();
    const result = await aiTranslationService.translateToEnglish(hindiText);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✓ Translation completed in ${duration}s`, 'green');
      log(`Translated: ${result.translatedText}`, 'yellow');
      log(`Detected Language: ${result.detectedLanguage?.name}`, 'yellow');
      
      // Test reverse translation
      log('\nTesting English to Hindi translation...', 'cyan');
      const englishText = 'The toilet has been cleaned and is now functional.';
      log(`Original: ${englishText}`, 'blue');
      
      const reverseResult = await aiTranslationService.translate(englishText, 'hi');
      if (reverseResult.success) {
        log(`✓ Reverse translation successful`, 'green');
        log(`Translated: ${reverseResult.translatedText}`, 'yellow');
      }
      
      return true;
    } else {
      log('✗ Translation failed', 'red');
      log(`Error: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Translation test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testFollowupGeneration() {
  section('Test 4: Follow-up Message Generation');
  
  try {
    log('Generating follow-up message...', 'cyan');
    
    const followupData = {
      userName: 'राज पाटिल',
      reportTitle: 'गंदा शौचालय',
      reportCategory: 'toilet',
      resolutionDetails: 'शौचालय की सफाई की गई और पानी की आपूर्ति बहाल की गई',
      resolutionDate: new Date().toISOString(),
      actionTaken: 'सफाई कर्मचारी भेजे गए',
      userLanguage: 'hi',
      tone: 'friendly'
    };
    
    const startTime = Date.now();
    const result = await aiFollowupService.generateFollowup(followupData);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✓ Follow-up generated in ${duration}s`, 'green');
      log('\nGenerated Message:', 'yellow');
      console.log(result.message);
      log(`\nCharacter count: ${result.message.length}`, 'blue');
      
      return true;
    } else {
      log('✗ Follow-up generation failed', 'red');
      log(`Error: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Follow-up test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testInspectorAssignment() {
  section('Test 5: Inspector Assignment');
  
  try {
    log('Finding best inspector for report...', 'cyan');
    log(`Report location: ${testReport.location.address}`, 'blue');
    log(`Available inspectors: ${testInspectors.length}`, 'blue');
    
    const startTime = Date.now();
    const result = await aiAssignmentService.suggestInspector(testReport, testInspectors);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✓ Assignment completed in ${duration}s`, 'green');
      log(`\nRecommended Inspector: ${result.recommendedInspector.name}`, 'yellow');
      log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, 'yellow');
      log(`Reason: ${result.reason}`, 'yellow');
      
      if (result.allScores && result.allScores.length > 0) {
        log('\nAll Inspector Scores:', 'blue');
        result.allScores.forEach((score, idx) => {
          const inspector = score.inspector || testInspectors[idx];
          console.log(`  ${inspector.name}: ${typeof score.score === 'number' ? score.score.toFixed(2) : score.totalScore}`);
        });
      }
      
      return true;
    } else {
      log('✗ Assignment failed', 'red');
      log(`Error: ${result.message || result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Assignment test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('AI Services Test Suite', 'bright');
  log('Testing all AI features for SwachhSetu', 'cyan');
  
  const results = {
    ollama: false,
    triage: false,
    translation: false,
    followup: false,
    assignment: false
  };
  
  // Test 1: Ollama Connection
  results.ollama = await testOllamaConnection();
  
  if (!results.ollama) {
    log('\n⚠️  Ollama connection failed. Cannot proceed with other tests.', 'red');
    log('Please ensure:', 'yellow');
    log('  1. Ollama is installed and running', 'yellow');
    log('  2. Models are downloaded (llama3:8b, mistral:7b)', 'yellow');
    log('  3. OLLAMA_HOST in .env is correct', 'yellow');
    process.exit(1);
  }
  
  // Test 2: Report Triage
  results.triage = await testReportTriage();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
  
  // Test 3: Translation
  results.translation = await testTranslation();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Follow-up Generation
  results.followup = await testFollowupGeneration();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 5: Inspector Assignment
  results.assignment = await testInspectorAssignment();
  
  // Summary
  section('Test Summary');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test.charAt(0).toUpperCase() + test.slice(1)}`, color);
  });
  
  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All tests passed! AI integration is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log('\n✗ Test suite failed with error:', 'red');
  console.error(error);
  process.exit(1);
});
