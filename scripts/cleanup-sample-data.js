// Cleanup script for AlliBoard Scheduler sample data
// Run this script to remove all sample data from the application

// Function to make API requests
async function apiRequest(method, endpoint, data = null) {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Function to cleanup all sample data
async function cleanupSampleData() {
  console.log('🧹 Starting cleanup of sample data...');
  
  try {
    // Get all existing data
    const [students, aides, activities, blocks, templates] = await Promise.all([
      apiRequest('GET', '/api/students'),
      apiRequest('GET', '/api/aides'),
      apiRequest('GET', '/api/activities'),
      apiRequest('GET', '/api/blocks'),
      apiRequest('GET', '/api/templates')
    ]);
    
    console.log(`📊 Found existing data:`);
    console.log(`  • ${students.length} students`);
    console.log(`  • ${aides.length} aides`);
    console.log(`  • ${activities.length} activities`);
    console.log(`  • ${blocks.length} blocks`);
    console.log(`  • ${templates.length} templates`);
    
    // Delete all blocks
    console.log('\n🗑️  Deleting schedule blocks...');
    for (const block of blocks) {
      await apiRequest('DELETE', `/api/blocks/${block.id}`);
      console.log(`  ✅ Deleted block: ${block.id}`);
    }
    
    // Delete all templates
    console.log('\n🗑️  Deleting templates...');
    for (const template of templates) {
      await apiRequest('DELETE', `/api/templates/${template.id}`);
      console.log(`  ✅ Deleted template: ${template.name}`);
    }
    
    // Delete all activities
    console.log('\n🗑️  Deleting activities...');
    for (const activity of activities) {
      await apiRequest('DELETE', `/api/activities/${activity.id}`);
      console.log(`  ✅ Deleted activity: ${activity.title}`);
    }
    
    // Delete all aides
    console.log('\n🗑️  Deleting aides...');
    for (const aide of aides) {
      await apiRequest('DELETE', `/api/aides/${aide.id}`);
      console.log(`  ✅ Deleted aide: ${aide.name}`);
    }
    
    // Delete all students
    console.log('\n🗑️  Deleting students...');
    for (const student of students) {
      await apiRequest('DELETE', `/api/students/${student.id}`);
      console.log(`  ✅ Deleted student: ${student.name}`);
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('✨ All sample data has been removed from the application.');
    console.log('\n🌐 You can now visit http://localhost:5000 to see the clean application!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.log('\n💡 Make sure the server is running on http://localhost:5000');
  }
}

// Run the cleanup script
cleanupSampleData();
