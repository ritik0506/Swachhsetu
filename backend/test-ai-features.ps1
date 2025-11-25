# AI Features Quick Test Script
# Run this after server is started to verify all features are working

Write-Host "🧪 SwachhSetu AI Features Test Suite" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testsPassed = 0
$testsFailed = 0

# Helper function to make API calls
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body,
        [string]$ExpectedField
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $headers -ErrorAction Stop
        } else {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $bodyJson -ErrorAction Stop
        }
        
        if ($ExpectedField) {
            $fieldExists = $null -ne ($response | Select-Object -ExpandProperty $ExpectedField -ErrorAction SilentlyContinue)
            if ($fieldExists) {
                Write-Host "  ✅ PASSED - Field '$ExpectedField' exists" -ForegroundColor Green
                return $true, $response
            } else {
                Write-Host "  ❌ FAILED - Field '$ExpectedField' not found" -ForegroundColor Red
                return $false, $response
            }
        } else {
            Write-Host "  ✅ PASSED" -ForegroundColor Green
            return $true, $response
        }
    } catch {
        Write-Host "  ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
        return $false, $null
    }
}

# Test 1: Server Health Check
Write-Host "`n🔹 Test 1: Server Health Check" -ForegroundColor Cyan
$result, $data = Test-Endpoint -Name "Server Status" -Method "GET" -Url "$baseUrl/api/reports" -ExpectedField "reports"
if ($result) { $testsPassed++ } else { $testsFailed++ }

# Test 2: AI Logs Endpoint
Write-Host "`n🔹 Test 2: AI Logs Endpoint" -ForegroundColor Cyan
$result, $data = Test-Endpoint -Name "AI Logs API" -Method "GET" -Url "$baseUrl/api/ai/logs?limit=5" -ExpectedField "logs"
if ($result) { 
    $testsPassed++
    if ($data.logs.Count -gt 0) {
        Write-Host "  📊 Found $($data.logs.Count) AI operations in logs" -ForegroundColor Gray
        $operations = $data.logs | Select-Object -ExpandProperty operation -Unique
        Write-Host "  📊 Operations: $($operations -join ', ')" -ForegroundColor Gray
    }
} else { 
    $testsFailed++ 
}

# Test 3: Follow-up Stats Endpoint
Write-Host "`n🔹 Test 3: Follow-up Statistics" -ForegroundColor Cyan
$result, $data = Test-Endpoint -Name "Follow-up Stats API" -Method "GET" -Url "$baseUrl/api/ai/followups/stats" -ExpectedField "total"
if ($result) { 
    $testsPassed++
    Write-Host "  📊 Total follow-ups: $($data.total)" -ForegroundColor Gray
    Write-Host "  📊 Pending: $($data.byStatus.pending), Sent: $($data.byStatus.sent), Failed: $($data.byStatus.failed)" -ForegroundColor Gray
} else { 
    $testsFailed++ 
}

# Test 4: Create Test Report (Requires User ID)
Write-Host "`n🔹 Test 4: Create Test Report with AI Triage" -ForegroundColor Cyan
Write-Host "  ⚠️  This test requires a valid user ID" -ForegroundColor Yellow
Write-Host "  💡 Tip: Create a user via /api/auth/register first or skip this test" -ForegroundColor Gray

# Ask user if they want to run this test
$runTest4 = Read-Host "`n  Run this test? (y/N)"
if ($runTest4 -eq 'y' -or $runTest4 -eq 'Y') {
    $userId = Read-Host "  Enter User ID"
    
    $testReport = @{
        title = "Test: Overflowing garbage bin"
        description = "Automated test report - Large garbage bin is overflowing with waste. Bad smell and flies everywhere."
        category = "Garbage Collection"
        location = @{
            type = "Point"
            coordinates = @(77.1025, 28.7041)
            address = "Connaught Place, New Delhi"
        }
        images = @()
        reportedBy = $userId
    }
    
    $result, $data = Test-Endpoint -Name "Create Report with AI Triage" -Method "POST" -Url "$baseUrl/api/reports" -Body $testReport -ExpectedField "aiAnalysis"
    
    if ($result) {
        $testsPassed++
        $reportId = $data._id
        Write-Host "  📊 Report ID: $reportId" -ForegroundColor Gray
        Write-Host "  📊 AI Category: $($data.aiAnalysis.category)" -ForegroundColor Gray
        Write-Host "  📊 Severity: $($data.aiAnalysis.severity)" -ForegroundColor Gray
        Write-Host "  📊 Confidence: $($data.aiAnalysis.confidence)" -ForegroundColor Gray
        
        # Test 5: AI Assignment (only if we have a report)
        Write-Host "`n🔹 Test 5: AI Inspector Assignment" -ForegroundColor Cyan
        $assignmentBody = @{ reportId = $reportId }
        $result2, $data2 = Test-Endpoint -Name "AI Inspector Assignment" -Method "POST" -Url "$baseUrl/api/ai/assign" -Body $assignmentBody -ExpectedField "assignedInspector"
        
        if ($result2) {
            $testsPassed++
            Write-Host "  📊 Assigned to: $($data2.assignedInspector.name)" -ForegroundColor Gray
            Write-Host "  📊 Assignment confidence: $($data2.assignmentConfidence)" -ForegroundColor Gray
            Write-Host "  💡 Check server logs for notification messages" -ForegroundColor Gray
        } else {
            $testsFailed++
        }
        
        # Test 6: Mark as Resolved (trigger follow-up)
        Write-Host "`n🔹 Test 6: Mark Report Resolved (Trigger Follow-up)" -ForegroundColor Cyan
        $resolveBody = @{
            status = "resolved"
            resolutionNotes = "Test resolution - Garbage bin emptied and area cleaned"
        }
        
        try {
            $headers = @{ "Content-Type" = "application/json" }
            $bodyJson = $resolveBody | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/$reportId" -Method Patch -Headers $headers -Body $bodyJson -ErrorAction Stop
            
            Write-Host "  ✅ PASSED - Report marked as resolved" -ForegroundColor Green
            Write-Host "  💡 Check server logs for 'Follow-up scheduled in 48 hours'" -ForegroundColor Gray
            $testsPassed++
        } catch {
            Write-Host "  ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
            $testsFailed++
        }
        
    } else {
        $testsFailed++
        Write-Host "  ⚠️  Skipping Tests 5 & 6 (require valid report)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⏭️  Skipped Test 4, 5, 6" -ForegroundColor Gray
}

# Test 7: Check for Geospatial Context in Logs
Write-Host "`n🔹 Test 7: Verify Geospatial Context in AI Logs" -ForegroundColor Cyan
try {
    $logsResponse = Invoke-RestMethod -Uri "$baseUrl/api/ai/logs?operation=triage&limit=10" -Method Get
    $logsWithGeo = $logsResponse.logs | Where-Object { $_.result.geoContext -ne $null }
    
    if ($logsWithGeo.Count -gt 0) {
        Write-Host "  ✅ PASSED - Found $($logsWithGeo.Count) triage logs with geospatial context" -ForegroundColor Green
        $sample = $logsWithGeo[0]
        if ($sample.result.geoContext) {
            Write-Host "  📊 Sample: Nearby reports = $($sample.result.geoContext.nearbyReports)" -ForegroundColor Gray
            Write-Host "  📊 Hotspot: $($sample.result.geoContext.isHotspot)" -ForegroundColor Gray
        }
        $testsPassed++
    } else {
        Write-Host "  ⚠️  No triage logs with geospatial context found yet" -ForegroundColor Yellow
        Write-Host "  💡 Create reports with coordinates to test this feature" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 8: Check Cron Job Status
Write-Host "`n🔹 Test 8: Follow-up Cron Job Status" -ForegroundColor Cyan
Write-Host "  💡 The cron job runs every 5 minutes" -ForegroundColor Gray
Write-Host "  💡 Check server logs for: '🔄 Checking for pending follow-ups...'" -ForegroundColor Gray
Write-Host "  💡 Last run should be within the last 5 minutes" -ForegroundColor Gray

# Read last few lines of server log if possible
$logCheck = Read-Host "`n  Have you seen cron job logs in server output? (y/N)"
if ($logCheck -eq 'y' -or $logCheck -eq 'Y') {
    Write-Host "  ✅ PASSED - Cron job is running" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  ⚠️  Manual verification needed" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $testsFailed" -ForegroundColor Red
Write-Host "📊 Total: $($testsPassed + $testsFailed)`n" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host "🎉 All tests passed! Your AI features are working correctly." -ForegroundColor Green
    Write-Host "💡 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Monitor server logs for 48 hours to see follow-up delivery" -ForegroundColor Gray
    Write-Host "   2. Test with real users and multiple reports" -ForegroundColor Gray
    Write-Host "   3. Configure Twilio/SendGrid for production notifications" -ForegroundColor Gray
    Write-Host "   4. Enable image analysis with: ollama pull llava:7b" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above and:" -ForegroundColor Yellow
    Write-Host "   1. Verify server is running: npm start" -ForegroundColor Gray
    Write-Host "   2. Check Redis is running: memurai.exe or redis-server" -ForegroundColor Gray
    Write-Host "   3. Verify Ollama is running: ollama ps" -ForegroundColor Gray
    Write-Host "   4. Check server logs for error messages" -ForegroundColor Gray
    Write-Host "   5. Review TESTING_GUIDE.md for detailed troubleshooting" -ForegroundColor Gray
}

Write-Host "`n📖 For detailed testing instructions, see: TESTING_GUIDE.md`n" -ForegroundColor Cyan
