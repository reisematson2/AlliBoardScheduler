// AlliBoard Scheduler - Health Check Script
// This script verifies that the server is running and responding correctly

async function healthCheck() {
  console.log('🔍 Checking AlliBoard Scheduler health...\n');
  
  try {
    // Test server connectivity
    const response = await fetch('http://localhost:5000/api/test');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Server is running successfully!');
    console.log(`📊 Response: ${JSON.stringify(data, null, 2)}`);
    console.log('\n🌐 You can now access the application at: http://localhost:5000');
    
    return true;
  } catch (error) {
    console.log('❌ Server health check failed:');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure the server is running (npm run dev or npm start)');
    console.log('   2. Check that port 5000 is not blocked');
    console.log('   3. Verify the server started without errors');
    console.log('   4. Try running: npm run dev');
    
    return false;
  }
}

// Run health check
healthCheck().then(success => {
  process.exit(success ? 0 : 1);
});
