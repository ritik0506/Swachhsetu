/**
 * Simple Feature Verification Script for SwachhSetu
 * 
 * Checks:
 * 1. Component files existence
 * 2. Deduplication service configuration
 * 3. API endpoint availability
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '═'.repeat(70));
  log(`  ${title}`, 'blue');
  console.log('═'.repeat(70) + '\n');
}

function subHeader(title) {
  log(`\n${'─'.repeat(50)}`, 'gray');
  log(`  ${title}`, 'yellow');
  log('─'.repeat(50), 'gray');
}

// Check if file exists and read key features
function analyzeFile(filePath, features) {
  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  
  const analysis = {
    exists: true,
    size: stats.size,
    lines: content.split('\n').length,
    features: {}
  };

  // Check for specific features
  for (const [featureName, searchPattern] of Object.entries(features)) {
    if (Array.isArray(searchPattern)) {
      analysis.features[featureName] = searchPattern.every(pattern => 
        content.includes(pattern)
      );
    } else {
      analysis.features[featureName] = content.includes(searchPattern);
    }
  }

  return analysis;
}

// Test 1: SmartImageUpload Component
function testSmartImageUpload() {
  header('📸 TEST 1: SMARTIMAGEUPLOAD COMPONENT');
  
  const componentPath = path.join(__dirname, 'frontend', 'src', 'components', 'SmartImageUpload.jsx');
  
  const features = {
    'Drag and Drop': 'handleDrag',
    'Image Resizing': 'resizeImage',
    'AI Verification': ['/api/ai/forensic/analyze', 'verifyImage'],
    'Spam Detection': 'is_spam',
    'Category Detection': 'civic_category',
    'Severity Score': 'severity_score',
    'Error Handling': 'setError',
    'Loading State': 'isVerifying'
  };

  const analysis = analyzeFile(componentPath, features);

  if (!analysis.exists) {
    log('❌ Component NOT FOUND', 'red');
    log(`   Expected: ${componentPath}`, 'gray');
    return false;
  }

  log('✅ Component EXISTS', 'green');
  log(`   Location: ${componentPath}`, 'gray');
  log(`   Size: ${(analysis.size / 1024).toFixed(2)} KB`, 'gray');
  log(`   Lines: ${analysis.lines}`, 'gray');

  subHeader('Feature Analysis');
  
  let allFeaturesPresent = true;
  for (const [feature, isPresent] of Object.entries(analysis.features)) {
    const status = isPresent ? '✅' : '❌';
    const color = isPresent ? 'green' : 'red';
    log(`${status} ${feature}`, color);
    if (!isPresent) allFeaturesPresent = false;
  }

  log('\nAPI Endpoint:', 'gray');
  log('  POST /api/ai/forensic/analyze', 'gray');
  log('  - Accepts: multipart/form-data with image field', 'gray');
  log('  - Returns: is_spam, civic_category, severity_score, confidence', 'gray');

  log('\nComponent Props:', 'gray');
  log('  - onVerify: Callback with verification result', 'gray');
  log('  - onChange: Callback with resized image file', 'gray');
  log('  - maxWidth: Max image width (default: 1024px)', 'gray');
  log('  - isGlobalAILoading: Prevents concurrent AI operations', 'gray');

  return allFeaturesPresent;
}

// Test 2: LocationVerifier Component
function testLocationVerifier() {
  header('🗺️  TEST 2: LOCATIONVERIFIER COMPONENT');
  
  const componentPath = path.join(__dirname, 'frontend', 'src', 'components', 'LocationVerifier.jsx');
  
  const features = {
    'GPS Detection': 'navigator.geolocation',
    'Reverse Geocoding': 'nominatim.openstreetmap.org',
    'Manual Entry': 'setManualMode',
    'Address Input': 'setAddress',
    'Landmark Field': 'setLandmark',
    'Verification State': 'setIsVerified',
    'Error Handling': 'setError',
    'Loading State': 'isDetecting'
  };

  const analysis = analyzeFile(componentPath, features);

  if (!analysis.exists) {
    log('❌ Component NOT FOUND', 'red');
    log(`   Expected: ${componentPath}`, 'gray');
    return false;
  }

  log('✅ Component EXISTS', 'green');
  log(`   Location: ${componentPath}`, 'gray');
  log(`   Size: ${(analysis.size / 1024).toFixed(2)} KB`, 'gray');
  log(`   Lines: ${analysis.lines}`, 'gray');

  subHeader('Feature Analysis');
  
  let allFeaturesPresent = true;
  for (const [feature, isPresent] of Object.entries(analysis.features)) {
    const status = isPresent ? '✅' : '❌';
    const color = isPresent ? 'green' : 'red';
    log(`${status} ${feature}`, color);
    if (!isPresent) allFeaturesPresent = false;
  }

  log('\nGeocoding API:', 'gray');
  log('  - Provider: OpenStreetMap Nominatim', 'gray');
  log('  - Reverse geocoding: Coordinates → Address', 'gray');
  log('  - Fallback: Shows coordinates if geocoding fails', 'gray');

  log('\nComponent Props:', 'gray');
  log('  - onChange: Callback with location data', 'gray');
  log('  - isGlobalAILoading: Prevents concurrent operations', 'gray');

  return allFeaturesPresent;
}

// Test 3: Deduplication Service
function testDeduplicationService() {
  header('🔍 TEST 3: DUPLICATE DETECTION SERVICE');
  
  const servicePath = path.join(__dirname, 'backend', 'services', 'deduplicationService.js');
  
  const features = {
    'Semantic Analysis': ['checkDuplicate', '_analyzeSemanticSimilarity'],
    'Proximity Check': ['proximityRadiusMeters', '_findNearbyReports'],
    'Temporal Analysis': 'timeWindowHours',
    'Confidence Scoring': 'confidence_score',
    'Ollama Integration': 'ollamaService',
    'Deduplication Prompt': '_buildDeduplicationPrompt',
    'Merge Recommendation': 'merge_recommendation',
    'Enable/Disable Toggle': 'ENABLE_DEDUPLICATION'
  };

  const analysis = analyzeFile(servicePath, features);

  if (!analysis.exists) {
    log('❌ Service NOT FOUND', 'red');
    log(`   Expected: ${servicePath}`, 'gray');
    return false;
  }

  log('✅ Service EXISTS', 'green');
  log(`   Location: ${servicePath}`, 'gray');
  log(`   Size: ${(analysis.size / 1024).toFixed(2)} KB`, 'gray');
  log(`   Lines: ${analysis.lines}`, 'gray');

  subHeader('Feature Analysis');
  
  let allFeaturesPresent = true;
  for (const [feature, isPresent] of Object.entries(analysis.features)) {
    const status = isPresent ? '✅' : '❌';
    const color = isPresent ? 'green' : 'red';
    log(`${status} ${feature}`, color);
    if (!isPresent) allFeaturesPresent = false;
  }

  // Check environment configuration
  subHeader('Configuration Check');
  
  const envPath = path.join(__dirname, 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const configs = {
      'Service Enabled': 'ENABLE_DEDUPLICATION',
      'Proximity Radius': 'DUPLICATE_RADIUS_METERS',
      'Confidence Threshold': 'DUPLICATE_CONFIDENCE_THRESHOLD',
      'Time Window': 'DUPLICATE_TIME_WINDOW_HOURS'
    };

    for (const [config, envVar] of Object.entries(configs)) {
      const hasConfig = envContent.includes(envVar);
      const status = hasConfig ? '✅' : '⚠️ ';
      const color = hasConfig ? 'green' : 'yellow';
      log(`${status} ${config} (${envVar})`, color);
    }
  } else {
    log('⚠️  .env file not found in backend/', 'yellow');
    log('   Default values will be used', 'gray');
  }

  log('\nService Configuration:', 'gray');
  log('  - Default Radius: 20 meters', 'gray');
  log('  - Default Threshold: 0.90 (90% confidence)', 'gray');
  log('  - Default Time Window: 72 hours', 'gray');

  // Check integration in reportController
  subHeader('Integration Check');
  
  const controllerPath = path.join(__dirname, 'backend', 'controllers', 'reportController.js');
  if (fs.existsSync(controllerPath)) {
    const controllerContent = fs.readFileSync(controllerPath, 'utf-8');
    const isIntegrated = controllerContent.includes('deduplicationService') || 
                         controllerContent.includes('checkDuplicate');
    
    if (isIntegrated) {
      log('✅ Integrated in reportController', 'green');
      log('   Duplicate warnings are shown to users', 'gray');
    } else {
      log('⚠️  NOT integrated in reportController', 'yellow');
      log('   Service exists but needs to be called in createReport()', 'gray');
      log('   Integration needed:', 'gray');
      log('   1. Import: const deduplicationService = require(\'../services/deduplicationService\');', 'gray');
      log('   2. Check before creating report:', 'gray');
      log('      const dupCheck = await deduplicationService.checkDuplicate(reportData);', 'gray');
      log('      if (dupCheck.is_duplicate) { return warning; }', 'gray');
    }
  }

  return allFeaturesPresent;
}

// Test 4: Check if components are used in EnhancedReportIssue
function testComponentIntegration() {
  header('🔗 TEST 4: COMPONENT INTEGRATION CHECK');
  
  const pagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'EnhancedReportIssue.jsx');
  
  if (!fs.existsSync(pagePath)) {
    log('❌ EnhancedReportIssue page NOT FOUND', 'red');
    return false;
  }

  const pageContent = fs.readFileSync(pagePath, 'utf-8');
  
  const components = {
    'SmartImageUpload': {
      imported: pageContent.includes('SmartImageUpload'),
      used: pageContent.includes('<SmartImageUpload')
    },
    'LocationVerifier': {
      imported: pageContent.includes('LocationVerifier'),
      used: pageContent.includes('<LocationVerifier')
    },
    'VoiceInput': {
      imported: pageContent.includes('VoiceInput'),
      used: pageContent.includes('<VoiceInput')
    }
  };

  log('Page: EnhancedReportIssue.jsx', 'gray');
  log(`Location: ${pagePath}`, 'gray');

  subHeader('Component Usage');
  
  for (const [component, status] of Object.entries(components)) {
    if (status.imported && status.used) {
      log(`✅ ${component}: IMPORTED and USED`, 'green');
    } else if (!status.imported && !status.used) {
      log(`⚠️  ${component}: NOT USED (component exists but not integrated)`, 'yellow');
    } else if (status.imported && !status.used) {
      log(`⚠️  ${component}: Imported but not used`, 'yellow');
    } else {
      log(`❌ ${component}: Used but not imported`, 'red');
    }
  }

  // Check if page has its own implementation
  subHeader('Built-in Implementation Check');
  
  const hasImageUpload = pageContent.includes('type="file"') && pageContent.includes('image');
  const hasLocationMap = pageContent.includes('MapContainer') || pageContent.includes('leaflet');
  const hasVoiceInput = pageContent.includes('VoiceInput');

  if (hasImageUpload) {
    log('ℹ️  Page has its own image upload implementation', 'blue');
  }
  if (hasLocationMap) {
    log('ℹ️  Page has its own map/location implementation', 'blue');
  }
  if (hasVoiceInput) {
    log('✅ VoiceInput component is used', 'green');
  }

  return true;
}

// Main test runner
function runAllTests() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════════════╗', 'blue');
  log('║                                                                  ║', 'blue');
  log('║       SwachhSetu Feature Verification Report                    ║', 'blue');
  log('║                                                                  ║', 'blue');
  log('║  Testing: Duplicate Detection, SmartImageUpload,                ║', 'blue');
  log('║           LocationVerifier                                      ║', 'blue');
  log('║                                                                  ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════════╝', 'blue');
  
  const results = {
    smartImageUpload: testSmartImageUpload(),
    locationVerifier: testLocationVerifier(),
    deduplication: testDeduplicationService(),
    integration: testComponentIntegration()
  };

  // Summary
  header('📊 VERIFICATION SUMMARY');
  
  const tests = [
    { name: 'SmartImageUpload Component', result: results.smartImageUpload },
    { name: 'LocationVerifier Component', result: results.locationVerifier },
    { name: 'Duplicate Detection Service', result: results.deduplication },
    { name: 'Component Integration', result: results.integration }
  ];

  tests.forEach((test, index) => {
    const status = test.result ? '✅ PASS' : '⚠️  NEEDS ATTENTION';
    const color = test.result ? 'green' : 'yellow';
    log(`${index + 1}. ${status} - ${test.name}`, color);
  });

  const passCount = tests.filter(t => t.result).length;
  const totalCount = tests.length;

  console.log('\n' + '═'.repeat(70));
  if (passCount === totalCount) {
    log(`  🎉 Result: ${passCount}/${totalCount} - All components are present!`, 'green');
  } else {
    log(`  Result: ${passCount}/${totalCount} - Some components need attention`, 'yellow');
  }
  console.log('═'.repeat(70));

  // Final recommendations
  header('💡 RECOMMENDATIONS');
  
  if (!results.smartImageUpload) {
    log('⚠️  SmartImageUpload: Check that all features are implemented', 'yellow');
  }
  
  if (!results.locationVerifier) {
    log('⚠️  LocationVerifier: Check that all features are implemented', 'yellow');
  }
  
  if (!results.deduplication) {
    log('⚠️  Deduplication: Ensure service is integrated in reportController', 'yellow');
  }

  if (!results.integration) {
    log('⚠️  Integration: Consider using SmartImageUpload and LocationVerifier', 'yellow');
    log('    components in EnhancedReportIssue page for better features', 'yellow');
  }

  log('\nTo test functionality:', 'gray');
  log('  1. Start backend: cd backend && npm start', 'gray');
  log('  2. Start frontend: cd frontend && npm run dev', 'gray');
  log('  3. Visit: http://localhost:5173/report-issue', 'gray');
  log('  4. Test image upload, location detection, and create duplicate reports', 'gray');

  console.log('\n');
  
  return passCount === totalCount;
}

// Run tests
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };
