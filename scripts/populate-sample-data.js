// Sample data population script for AlliBoard Scheduler
// Run this script to populate the application with realistic test data

const sampleData = {
  students: [
    { name: "Emma Johnson", color: "blue" },
    { name: "Liam Smith", color: "green" },
    { name: "Olivia Brown", color: "purple" },
    { name: "Noah Davis", color: "orange" },
    { name: "Ava Wilson", color: "teal" },
    { name: "William Miller", color: "indigo" },
    { name: "Sophia Garcia", color: "pink" },
    { name: "James Rodriguez", color: "yellow" },
    { name: "Isabella Martinez", color: "red" },
    { name: "Benjamin Anderson", color: "blue" }
  ],
  
  aides: [
    { name: "Sarah Thompson", color: "green" },
    { name: "Michael Chen", color: "purple" },
    { name: "Jennifer Lee", color: "orange" },
    { name: "David Kim", color: "teal" },
    { name: "Lisa Johnson", color: "indigo" },
    { name: "Robert Taylor", color: "pink" },
    { name: "Maria Garcia", color: "yellow" },
    { name: "Christopher Brown", color: "red" }
  ],
  
  activities: [
    { title: "Math Tutoring", color: "blue" },
    { title: "Reading Support", color: "green" },
    { title: "Speech Therapy", color: "purple" },
    { title: "Occupational Therapy", color: "orange" },
    { title: "Physical Therapy", color: "teal" },
    { title: "Social Skills Group", color: "indigo" },
    { title: "Art Therapy", color: "pink" },
    { title: "Music Therapy", color: "yellow" },
    { title: "Study Hall", color: "red" },
    { title: "Lunch Break", color: "blue" }
  ]
};

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

// Function to populate sample data
async function populateSampleData() {
  console.log('🚀 Starting to populate sample data...');
  
  try {
    // Create students
    console.log('📚 Creating students...');
    const createdStudents = [];
    for (const student of sampleData.students) {
      const created = await apiRequest('POST', '/api/students', student);
      createdStudents.push(created);
      console.log(`  ✅ Created student: ${student.name}`);
    }
    
    // Create aides
    console.log('👥 Creating aides...');
    const createdAides = [];
    for (const aide of sampleData.aides) {
      const created = await apiRequest('POST', '/api/aides', aide);
      createdAides.push(created);
      console.log(`  ✅ Created aide: ${aide.name}`);
    }
    
    // Create activities
    console.log('🎯 Creating activities...');
    const createdActivities = [];
    for (const activity of sampleData.activities) {
      const created = await apiRequest('POST', '/api/activities', activity);
      createdActivities.push(created);
      console.log(`  ✅ Created activity: ${activity.title}`);
    }
    
    // Create sample schedule blocks for today and tomorrow
    console.log('📅 Creating sample schedule blocks...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const sampleBlocks = [
      // Today's schedule
      {
        date: today,
        startTime: "09:00",
        endTime: "10:00",
        activityId: createdActivities[0].id, // Math Tutoring
        studentIds: [createdStudents[0].id, createdStudents[1].id],
        aideIds: [createdAides[0].id],
        notes: "Algebra review session",
        recurrence: '{"type":"none"}'
      },
      {
        date: today,
        startTime: "10:30",
        endTime: "11:30",
        activityId: createdActivities[1].id, // Reading Support
        studentIds: [createdStudents[2].id, createdStudents[3].id],
        aideIds: [createdAides[1].id],
        notes: "Comprehension practice",
        recurrence: '{"type":"none"}'
      },
      {
        date: today,
        startTime: "13:00",
        endTime: "14:00",
        activityId: createdActivities[2].id, // Speech Therapy
        studentIds: [createdStudents[4].id],
        aideIds: [createdAides[2].id],
        notes: "Individual speech session",
        recurrence: '{"type":"none"}'
      },
      {
        date: today,
        startTime: "14:30",
        endTime: "15:30",
        activityId: createdActivities[6].id, // Art Therapy
        studentIds: [createdStudents[5].id, createdStudents[6].id, createdStudents[7].id],
        aideIds: [createdAides[3].id, createdAides[4].id],
        notes: "Group art project",
        recurrence: '{"type":"none"}'
      },
      
      // Tomorrow's schedule
      {
        date: tomorrow,
        startTime: "09:00",
        endTime: "10:00",
        activityId: createdActivities[0].id, // Math Tutoring
        studentIds: [createdStudents[0].id, createdStudents[1].id],
        aideIds: [createdAides[0].id],
        notes: "Algebra review session",
        recurrence: '{"type":"none"}'
      },
      {
        date: tomorrow,
        startTime: "10:30",
        endTime: "11:30",
        activityId: createdActivities[3].id, // Occupational Therapy
        studentIds: [createdStudents[8].id],
        aideIds: [createdAides[5].id],
        notes: "Fine motor skills practice",
        recurrence: '{"type":"none"}'
      },
      {
        date: tomorrow,
        startTime: "13:00",
        endTime: "14:00",
        activityId: createdActivities[5].id, // Social Skills Group
        studentIds: [createdStudents[2].id, createdStudents[4].id, createdStudents[6].id],
        aideIds: [createdAides[6].id],
        notes: "Group interaction practice",
        recurrence: '{"type":"none"}'
      },
      
      // Recurring weekly block
      {
        date: today,
        startTime: "11:00",
        endTime: "12:00",
        activityId: createdActivities[8].id, // Study Hall
        studentIds: [createdStudents[1].id, createdStudents[3].id, createdStudents[5].id],
        aideIds: [createdAides[7].id],
        notes: "Weekly study hall - recurring",
        recurrence: '{"type":"weekly","interval":1}'
      }
    ];
    
    for (const block of sampleBlocks) {
      const created = await apiRequest('POST', '/api/blocks', block);
      console.log(`  ✅ Created block: ${block.activityId ? createdActivities.find(a => a.id === block.activityId)?.title : 'Unknown'} at ${block.startTime}-${block.endTime}`);
    }
    
    // Create a sample template
    console.log('📋 Creating sample template...');
    const templateData = {
      name: "Sample Weekly Template",
      blockData: sampleBlocks.slice(0, 4) // First 4 blocks as template
    };
    const template = await apiRequest('POST', '/api/templates', templateData);
    console.log(`  ✅ Created template: ${template.name}`);
    
    console.log('\n🎉 Sample data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${createdStudents.length} students created`);
    console.log(`  • ${createdAides.length} aides created`);
    console.log(`  • ${createdActivities.length} activities created`);
    console.log(`  • ${sampleBlocks.length} schedule blocks created`);
    console.log(`  • 1 template created`);
    console.log('\n🌐 You can now visit http://localhost:5000 to see the populated data!');
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    console.log('\n💡 Make sure the server is running on http://localhost:5000');
  }
}

// Run the population script
populateSampleData();
