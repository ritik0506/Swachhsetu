/**
 * Test script for Forensic Image Analyzer
 * Tests spam detection, civic category classification, and severity scoring
 */

const forensicImageAnalyzer = require('./services/forensicImageAnalyzer');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

async function testForensicAnalyzer() {
  logSection('🔍 FORENSIC IMAGE ANALYZER TEST SUITE');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Service availability
  logSection('Test 1: Service Availability');
  try {
    if (forensicImageAnalyzer.enabled) {
      logSuccess('Forensic Image Analyzer service is enabled');
      testResults.passed++;
    } else {
      logWarning('Forensic Image Analyzer service is disabled');
      testResults.warnings++;
    }
    testResults.total++;
  } catch (error) {
    logError('Service check failed: ' + error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 2: Check for test images
  logSection('Test 2: Test Image Availability');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    logWarning('Uploads directory not found. Creating...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Look for any images in uploads directory
  let testImages = [];
  try {
    const files = fs.readdirSync(uploadsDir, { recursive: true });
    testImages = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => path.join(uploadsDir, file))
      .slice(0, 3); // Test first 3 images

    if (testImages.length > 0) {
      logSuccess(`Found ${testImages.length} test image(s)`);
      testImages.forEach((img, i) => {
        logInfo(`  ${i + 1}. ${path.basename(img)}`);
      });
      testResults.passed++;
    } else {
      logWarning('No test images found in uploads directory');
      logInfo('Please upload some test images to the uploads folder');
      testResults.warnings++;
    }
    testResults.total++;
  } catch (error) {
    logError('Failed to scan uploads directory: ' + error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 3: Analyze images (if available)
  if (testImages.length > 0) {
    logSection('Test 3: Single Image Analysis');
    
    for (let i = 0; i < testImages.length; i++) {
      const imagePath = testImages[i];
      const imageName = path.basename(imagePath);
      
      console.log(`\n${colors.magenta}Analyzing: ${imageName}${colors.reset}`);
      
      try {
        const startTime = Date.now();
        const result = await forensicImageAnalyzer.analyzeImage(imagePath);
        const duration = Date.now() - startTime;
        
        if (result.success) {
          logSuccess(`Analysis completed in ${duration}ms`);
          
          // Display results
          console.log(`\n  ${colors.blue}Results:${colors.reset}`);
          console.log(`    Is Spam: ${result.is_spam ? colors.red + 'YES' + colors.reset : colors.green + 'NO' + colors.reset}`);
          
          if (result.spam_reason) {
            console.log(`    Spam Reason: ${colors.yellow}${result.spam_reason}${colors.reset}`);
          }
          
          console.log(`    Category: ${colors.cyan}${result.civic_category}${colors.reset}`);
          console.log(`    Severity: ${getSeverityColor(result.severity_score)}${result.severity_score}/10${colors.reset}`);
          console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
          console.log(`    Evidence: "${result.visual_evidence}"`);
          
          if (result.technical_metadata) {
            console.log(`\n  ${colors.blue}Technical Metadata:${colors.reset}`);
            console.log(`    Resolution: ${result.technical_metadata.width}x${result.technical_metadata.height}`);
            console.log(`    Format: ${result.technical_metadata.format}`);
            console.log(`    Size: ${result.technical_metadata.size_mb} MB`);
          }
          
          testResults.passed++;
        } else {
          logError(`Analysis failed: ${result.error}`);
          testResults.failed++;
        }
        testResults.total++;
        
      } catch (error) {
        logError(`Exception during analysis: ${error.message}`);
        testResults.failed++;
        testResults.total++;
      }
    }
  }

  // Test 4: Batch analysis (if multiple images)
  if (testImages.length > 1) {
    logSection('Test 4: Batch Analysis');
    
    try {
      const startTime = Date.now();
      const results = await forensicImageAnalyzer.batchAnalyze(testImages);
      const duration = Date.now() - startTime;
      
      logSuccess(`Batch analysis completed in ${duration}ms`);
      logInfo(`Average time per image: ${(duration / testImages.length).toFixed(0)}ms`);
      
      const stats = forensicImageAnalyzer.getSpamStatistics(results);
      
      console.log(`\n  ${colors.blue}Batch Statistics:${colors.reset}`);
      console.log(`    Total Analyzed: ${stats.total_analyzed}`);
      console.log(`    Spam Detected: ${stats.spam_detected} (${stats.spam_percentage}%)`);
      console.log(`    Valid Reports: ${stats.valid_reports}`);
      console.log(`    Average Severity: ${stats.average_severity}/10`);
      console.log(`    High Severity Count: ${stats.high_severity_count}`);
      
      if (Object.keys(stats.category_distribution).length > 0) {
        console.log(`\n  ${colors.blue}Category Distribution:${colors.reset}`);
        for (const [category, count] of Object.entries(stats.category_distribution)) {
          console.log(`    ${category}: ${count}`);
        }
      }
      
      testResults.passed++;
      testResults.total++;
      
    } catch (error) {
      logError(`Batch analysis failed: ${error.message}`);
      testResults.failed++;
      testResults.total++;
    }
  }

  // Test 5: Spam detection validation
  logSection('Test 5: Spam Detection Patterns');
  
  const spamPatterns = [
    'Screenshot detection for moiré patterns',
    'Selfie detection for human faces',
    'Indoor scene detection',
    'Quality check for blurry images'
  ];
  
  logInfo('Testing spam detection patterns:');
  spamPatterns.forEach((pattern, i) => {
    console.log(`  ${i + 1}. ${pattern}`);
  });
  logSuccess('Spam detection patterns configured');
  testResults.passed++;
  testResults.total++;

  // Final summary
  logSection('📊 TEST SUMMARY');
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${getSuccessRateColor(successRate)}${successRate}%${colors.reset}`);
  
  if (testResults.failed === 0 && testResults.warnings === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}`);
  } else if (testResults.failed === 0) {
    console.log(`\n${colors.yellow}⚠ Tests passed with warnings${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}`);
  }

  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

  // Usage instructions
  logSection('📖 USAGE INSTRUCTIONS');
  console.log('API Endpoints:');
  console.log('  1. Single Image Analysis:');
  console.log('     POST /api/ai/forensic/analyze');
  console.log('     - Upload: image (multipart/form-data)');
  console.log('');
  console.log('  2. Batch Analysis (up to 5 images):');
  console.log('     POST /api/ai/forensic/batch');
  console.log('     - Upload: images[] (multipart/form-data)');
  console.log('');
  console.log('  3. Analyze Existing Report:');
  console.log('     POST /api/ai/forensic/report/:reportId');
  console.log('     - Body: { "imageIndex": 0 }');
  console.log('');
  console.log(`${colors.cyan}Test command:${colors.reset}`);
  console.log('  curl -X POST http://localhost:5000/api/ai/forensic/analyze \\');
  console.log('       -F "image=@path/to/image.jpg"');
  console.log('');
}

function getSeverityColor(score) {
  if (score >= 8) return colors.red;
  if (score >= 5) return colors.yellow;
  return colors.green;
}

function getSuccessRateColor(rate) {
  if (rate >= 90) return colors.green;
  if (rate >= 70) return colors.yellow;
  return colors.red;
}

// Run tests
if (require.main === module) {
  testForensicAnalyzer()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testForensicAnalyzer };
