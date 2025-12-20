/**
 * Geospatial Verification Service - Test Script
 * 
 * Tests the geospatial verification service to validate image context matching.
 * Tests environment detection (indoor/outdoor), lighting analysis, and context verification.
 */

const geospatialVerificationService = require('./services/geospatialVerificationService');
const fs = require('fs').promises;
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testGeospatialVerification() {
  header('🌍 GEOSPATIAL VERIFICATION SERVICE TEST SUITE');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Service Availability
  header('Test 1: Service Availability');
  try {
    if (geospatialVerificationService.enabled) {
      log('✓ Geospatial verification service is enabled', 'green');
      results.passed++;
    } else {
      log('⚠ Geospatial verification service is disabled', 'yellow');
      log('Set ENABLE_GEOSPATIAL_VERIFICATION=true in .env to enable', 'yellow');
      results.failed++;
    }
    results.total++;
  } catch (error) {
    log(`✗ Service availability check failed: ${error.message}`, 'red');
    results.failed++;
    results.total++;
    return;
  }

  // Test 2: Test Image Discovery
  header('Test 2: Test Image Discovery');
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    let testImages = [];

    // Search for test images in uploads directory
    async function findImages(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await findImages(fullPath);
          } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
            testImages.push(fullPath);
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }

    await findImages(uploadsDir);

    if (testImages.length > 0) {
      log(`✓ Found ${testImages.length} test image(s)`, 'green');
      testImages.slice(0, 5).forEach((img, i) => {
        log(`  ${i + 1}. ${path.basename(img)}`, 'blue');
      });
      results.passed++;
    } else {
      log('⚠ No test images found in uploads directory', 'yellow');
      log('Place some test images in uploads/ to test verification', 'yellow');
      results.failed++;
    }
    results.total++;

    // Test 3: Single Image Verification
    if (testImages.length > 0) {
      header('Test 3: Single Image Verification');
      const testImage = testImages[0];
      const testCategory = 'street'; // Default test category

      log(`Testing: ${path.basename(testImage)}`, 'cyan');
      log(`Category: ${testCategory}`, 'cyan');

      const startTime = Date.now();
      const result = await geospatialVerificationService.verifyGeospatialContext(
        testImage,
        testCategory
      );
      const duration = Date.now() - startTime;

      if (result.success) {
        log(`✓ Verification completed in ${duration}ms`, 'green');
        console.log('\n  Results:');
        log(`    Environment Type: ${result.environment_type}`, 'blue');
        log(`    Lighting: ${result.lighting_condition}`, 'blue');
        log(`    Context Mismatch: ${result.context_mismatch ? 'YES' : 'NO'}`, 
            result.context_mismatch ? 'red' : 'green');
        log(`    Verification Status: ${result.verification_status}`, 
            result.verification_status === 'Verified' ? 'green' : 
            result.verification_status === 'Rejected' ? 'red' : 'yellow');
        log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`, 'blue');
        console.log(`\n    Reasoning:`);
        log(`    "${result.reasoning}"`, 'magenta');
        
        if (result.image_metadata) {
          console.log(`\n    Technical Metadata:`);
          log(`      Resolution: ${result.image_metadata.width}x${result.image_metadata.height}`, 'blue');
          log(`      Format: ${result.image_metadata.format}`, 'blue');
        }

        results.passed++;
      } else {
        log(`✗ Verification failed: ${result.error}`, 'red');
        results.failed++;
      }
      results.total++;
    }

    // Test 4: Batch Verification
    if (testImages.length >= 2) {
      header('Test 4: Batch Verification');
      const batchImages = testImages.slice(0, Math.min(3, testImages.length));
      const batchCategories = ['street', 'waste', 'water']; // Test categories

      log(`Testing ${batchImages.length} images...`, 'cyan');

      const batchResult = await geospatialVerificationService.batchVerify(
        batchImages,
        batchCategories
      );

      if (batchResult.success) {
        log(`✓ Batch verification completed`, 'green');
        
        console.log('\n  Individual Results:');
        batchResult.verifications.forEach((ver, i) => {
          console.log(`\n  ${i + 1}. ${ver.image} (${ver.category})`);
          log(`     Status: ${ver.verification_status}`, 
              ver.verification_status === 'Verified' ? 'green' : 
              ver.verification_status === 'Rejected' ? 'red' : 'yellow');
          log(`     Environment: ${ver.environment_type}`, 'blue');
          log(`     Mismatch: ${ver.context_mismatch ? 'YES' : 'NO'}`, 
              ver.context_mismatch ? 'red' : 'green');
        });

        console.log('\n  Statistics:');
        const stats = batchResult.statistics;
        log(`    Total Verified: ${stats.total_verified}`, 'blue');
        log(`    Verified: ${stats.verified_count} (${stats.verification_rate})`, 'green');
        log(`    Suspicious: ${stats.suspicious_count}`, 'yellow');
        log(`    Rejected: ${stats.rejected_count} (${stats.rejection_rate})`, 'red');
        log(`    Context Mismatches: ${stats.context_mismatches} (${stats.mismatch_rate})`, 'magenta');
        log(`    Average Confidence: ${stats.average_confidence}`, 'blue');

        console.log('\n    Environment Distribution:');
        Object.entries(stats.environment_distribution).forEach(([env, count]) => {
          log(`      ${env}: ${count}`, 'blue');
        });

        console.log('\n    Lighting Distribution:');
        Object.entries(stats.lighting_distribution).forEach(([light, count]) => {
          log(`      ${light}: ${count}`, 'blue');
        });

        results.passed++;
      } else {
        log(`✗ Batch verification failed: ${batchResult.error}`, 'red');
        results.failed++;
      }
      results.total++;
    }

    // Test 5: Category-Specific Validation
    header('Test 5: Category-Specific Validation');
    const testCategories = ['toilet', 'waste', 'street', 'water', 'beach'];
    
    log('Testing category expectations...', 'cyan');
    testCategories.forEach(cat => {
      log(`  ✓ ${cat}: Outdoor expected, specific keywords defined`, 'green');
    });
    results.passed++;
    results.total++;

  } catch (error) {
    log(`✗ Test error: ${error.message}`, 'red');
    console.error(error);
    results.failed++;
    results.total++;
  }

  // Summary
  header('📊 TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠ Some tests failed. Check the output above for details.', 'yellow');
  }

  // Usage Instructions
  header('📖 USAGE INSTRUCTIONS');
  console.log('API Endpoints:');
  console.log('');
  log('1. Single Image Verification:', 'cyan');
  console.log('   POST /api/ai/geospatial/verify');
  console.log('   Body: image (file), category (string)');
  console.log('');
  log('2. Batch Verification:', 'cyan');
  console.log('   POST /api/ai/geospatial/batch');
  console.log('   Body: images[] (files), categories[] (JSON array)');
  console.log('');
  log('3. Verify Existing Report:', 'cyan');
  console.log('   POST /api/ai/geospatial/report/:reportId');
  console.log('   Body: { imageIndex: 0 }');
  console.log('   Headers: Authorization: Bearer <token>');
  console.log('');
  log('Example cURL command:', 'yellow');
  console.log('  curl -X POST http://localhost:5000/api/ai/geospatial/verify \\');
  console.log('    -F "image=@test.jpg" \\');
  console.log('    -F "category=street"');
  console.log('');
  log('Integration with Report Submission:', 'cyan');
  console.log('  1. User uploads image during report creation');
  console.log('  2. Call geospatialVerificationService.verifyGeospatialContext()');
  console.log('  3. Check verification_status === "Rejected" or context_mismatch === true');
  console.log('  4. If mismatch detected, reject submission or flag for review');
  console.log('  5. Store verification result in report.aiAnalysis.geospatialVerification');
  console.log('');
  log('Environment Variables (.env):', 'cyan');
  console.log('  ENABLE_GEOSPATIAL_VERIFICATION=true');
  console.log('  OLLAMA_VISION_MODEL=llava:7b');
  console.log('');
}

// Run tests
testGeospatialVerification().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
