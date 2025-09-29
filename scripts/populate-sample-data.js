// Sample data population script for AlliBoard Scheduler
// Run this script to populate the application with realistic test data

const sampleData = {
  students: [
    { name: "Emma Johnson", color: "blue" },
    { name: "Liam Smith", color: "green" },
    { name: "Olivia Brown", color: "purple" },
    { name: "Noah Davis", color: "orange" },
    { name: "Ava Wilson", color: "teal" },
    { name: "William Miller", color: "indigo" }
  ],
  
  aides: [
    { name: "Sarah Thompson", color: "green" },
    { name: "Michael Chen", color: "purple" },
    { name: "Jennifer Lee", color: "orange" },
    { name: "David Kim", color: "teal" },
    { name: "Lisa Johnson", color: "indigo" },
    { name: "Robert Taylor", color: "pink" }
  ],
  
  activities: [
    { title: "Morning Circle", color: "blue" },
    { title: "Math Centers", color: "green" },
    { title: "Reading Groups", color: "purple" },
    { title: "Speech Therapy", color: "orange" },
    { title: "Occupational Therapy", color: "teal" },
    { title: "Physical Therapy", color: "indigo" },
    { title: "Art & Crafts", color: "pink" },
    { title: "Music & Movement", color: "yellow" },
    { title: "Social Skills", color: "red" },
    { title: "Lunch & Recess", color: "blue" },
    { title: "Quiet Time", color: "gray" },
    { title: "Science Discovery", color: "green" },
    { title: "Free Play", color: "purple" },
    { title: "Story Time", color: "orange" },
    { title: "Closing Circle", color: "teal" }
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
    
    // Create comprehensive week schedule (8am-3pm)
    console.log('📅 Creating comprehensive school week schedule...');
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeekStart.setDate(today.getDate() + daysToMonday);
    
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    const sampleBlocks = [];
    
    // Create varied daily schedules for each day of the week
    weekDates.forEach((date, dayIndex) => {
      let dayBlocks = [];
      
      // Common recurring events (every day)
      const recurringBlocks = [
        // 8:00-8:30 - Morning Circle (Recurring daily)
        {
          date: date,
          startTime: "08:00",
          endTime: "08:30",
          activityId: createdActivities[0].id, // Morning Circle
          studentIds: createdStudents.map(s => s.id),
          aideIds: [createdAides[0].id, createdAides[1].id],
          notes: "Daily morning circle with calendar and weather",
          recurrence: '{"type":"daily","interval":1}'
        },
        
        // 11:45-12:30 - Lunch & Recess (Recurring daily)
        {
          date: date,
          startTime: "11:45",
          endTime: "12:30",
          activityId: createdActivities[9].id, // Lunch & Recess
          studentIds: createdStudents.map(s => s.id),
          aideIds: createdAides.map(a => a.id),
          notes: "Lunch and outdoor play",
          recurrence: '{"type":"daily","interval":1}'
        },
        
        // 2:30-3:00 - Story Time & Closing Circle (Recurring daily)
        {
          date: date,
          startTime: "14:30",
          endTime: "15:00",
          activityId: createdActivities[13].id, // Story Time
          studentIds: createdStudents.map(s => s.id),
          aideIds: [createdAides[0].id, createdAides[1].id],
          notes: "Daily story and closing circle",
          recurrence: '{"type":"daily","interval":1}'
        }
      ];
      
      // Day-specific schedules
      if (dayIndex === 0) { // Monday - Math Focus Day
        dayBlocks = [
          ...recurringBlocks,
          // 8:30-9:30 - Extended Math Centers
          {
            date: date,
            startTime: "08:30",
            endTime: "09:30",
            activityId: createdActivities[1].id, // Math Centers
            studentIds: [createdStudents[0].id, createdStudents[1].id, createdStudents[2].id],
            aideIds: [createdAides[0].id, createdAides[2].id],
            notes: "Monday Math Focus - Number recognition and counting",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[1]}'
          },
          {
            date: date,
            startTime: "08:30",
            endTime: "09:30",
            activityId: createdActivities[1].id, // Math Centers
            studentIds: [createdStudents[3].id, createdStudents[4].id, createdStudents[5].id],
            aideIds: [createdAides[1].id, createdAides[3].id],
            notes: "Monday Math Focus - Shape sorting and patterns",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[1]}'
          },
          
          // 9:30-10:15 - Reading Groups
          {
            date: date,
            startTime: "09:30",
            endTime: "10:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[0].id, createdStudents[3].id],
            aideIds: [createdAides[0].id],
            notes: "Monday reading - Letter sounds and phonics",
            recurrence: '{"type":"none"}'
          },
          {
            date: date,
            startTime: "09:30",
            endTime: "10:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[1].id, createdStudents[4].id],
            aideIds: [createdAides[1].id],
            notes: "Monday reading - Sight words practice",
            recurrence: '{"type":"none"}'
          },
          
          // 10:15-10:30 - Snack
          {
            date: date,
            startTime: "10:15",
            endTime: "10:30",
            activityId: createdActivities[9].id, // Lunch & Recess
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Morning snack time",
            recurrence: '{"type":"none"}'
          },
          
          // 10:30-11:15 - Individual Therapy
          {
            date: date,
            startTime: "10:30",
            endTime: "11:15",
            activityId: createdActivities[3].id, // Speech Therapy
            studentIds: [createdStudents[0].id],
            aideIds: [createdAides[3].id],
            notes: "Monday speech therapy - Articulation practice",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[1]}'
          },
          {
            date: date,
            startTime: "10:30",
            endTime: "11:15",
            activityId: createdActivities[4].id, // Occupational Therapy
            studentIds: [createdStudents[1].id],
            aideIds: [createdAides[4].id],
            notes: "Monday OT - Handwriting and fine motor",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[1]}'
          },
          
          // 11:15-12:00 - Art & Crafts
          {
            date: date,
            startTime: "11:15",
            endTime: "12:00",
            activityId: createdActivities[6].id, // Art & Crafts
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id, createdAides[2].id],
            notes: "Monday art - Math-themed crafts and counting",
            recurrence: '{"type":"none"}'
          },
          
          // 12:30-1:15 - Quiet Time
          {
            date: date,
            startTime: "12:30",
            endTime: "13:15",
            activityId: createdActivities[10].id, // Quiet Time
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id],
            notes: "Extended quiet time after math focus",
            recurrence: '{"type":"none"}'
          },
          
          // 1:15-2:00 - Free Play
          {
            date: date,
            startTime: "13:15",
            endTime: "14:00",
            activityId: createdActivities[12].id, // Free Play
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Structured free play with math manipulatives",
            recurrence: '{"type":"none"}'
          }
        ];
      } else if (dayIndex === 1) { // Tuesday - Reading Focus Day
        dayBlocks = [
          ...recurringBlocks,
          // 8:30-9:15 - Reading Groups
          {
            date: date,
            startTime: "08:30",
            endTime: "09:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[0].id, createdStudents[3].id],
            aideIds: [createdAides[0].id],
            notes: "Tuesday reading - Story comprehension",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[2]}'
          },
          {
            date: date,
            startTime: "08:30",
            endTime: "09:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[1].id, createdStudents[4].id],
            aideIds: [createdAides[1].id],
            notes: "Tuesday reading - Vocabulary building",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[2]}'
          },
          
          // 9:15-10:00 - Math Centers
          {
            date: date,
            startTime: "09:15",
            endTime: "10:00",
            activityId: createdActivities[1].id, // Math Centers
            studentIds: [createdStudents[0].id, createdStudents[1].id, createdStudents[2].id],
            aideIds: [createdAides[0].id, createdAides[2].id],
            notes: "Tuesday math - Addition and subtraction basics",
            recurrence: '{"type":"none"}'
          },
          
          // 10:00-10:15 - Snack
          {
            date: date,
            startTime: "10:00",
            endTime: "10:15",
            activityId: createdActivities[9].id, // Lunch & Recess
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Morning snack time",
            recurrence: '{"type":"none"}'
          },
          
          // 10:15-11:00 - Physical Therapy
          {
            date: date,
            startTime: "10:15",
            endTime: "11:00",
            activityId: createdActivities[5].id, // Physical Therapy
            studentIds: [createdStudents[2].id],
            aideIds: [createdAides[5].id],
            notes: "Tuesday PT - Balance and coordination",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[2]}'
          },
          
          // 11:00-11:45 - Music & Movement
          {
            date: date,
            startTime: "11:00",
            endTime: "11:45",
            activityId: createdActivities[7].id, // Music & Movement
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[2].id, createdAides[3].id, createdAides[4].id],
            notes: "Tuesday music - Reading-themed songs and movement",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[2]}'
          },
          
          // 12:30-1:15 - Science Discovery
          {
            date: date,
            startTime: "12:30",
            endTime: "13:15",
            activityId: createdActivities[11].id, // Science Discovery
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[2].id, createdAides[3].id, createdAides[4].id],
            notes: "Tuesday science - Weather and seasons exploration",
            recurrence: '{"type":"none"}'
          },
          
          // 1:15-2:00 - Social Skills
          {
            date: date,
            startTime: "13:15",
            endTime: "14:00",
            activityId: createdActivities[8].id, // Social Skills
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id],
            notes: "Tuesday social skills - Sharing and taking turns",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[2]}'
          }
        ];
      } else if (dayIndex === 2) { // Wednesday - Science & Discovery Day
        dayBlocks = [
          ...recurringBlocks,
          // 8:30-9:30 - Extended Science Discovery
          {
            date: date,
            startTime: "08:30",
            endTime: "09:30",
            activityId: createdActivities[11].id, // Science Discovery
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[2].id, createdAides[3].id, createdAides[4].id],
            notes: "Wednesday science - Hands-on experiments and observations",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[3]}'
          },
          
          // 9:30-10:15 - Math Centers
          {
            date: date,
            startTime: "09:30",
            endTime: "10:15",
            activityId: createdActivities[1].id, // Math Centers
            studentIds: [createdStudents[3].id, createdStudents[4].id, createdStudents[5].id],
            aideIds: [createdAides[1].id, createdAides[3].id],
            notes: "Wednesday math - Measurement and comparison",
            recurrence: '{"type":"none"}'
          },
          
          // 10:15-10:30 - Snack
          {
            date: date,
            startTime: "10:15",
            endTime: "10:30",
            activityId: createdActivities[9].id, // Lunch & Recess
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Morning snack time",
            recurrence: '{"type":"none"}'
          },
          
          // 10:30-11:15 - Individual Therapy
          {
            date: date,
            startTime: "10:30",
            endTime: "11:15",
            activityId: createdActivities[3].id, // Speech Therapy
            studentIds: [createdStudents[2].id],
            aideIds: [createdAides[3].id],
            notes: "Wednesday speech therapy - Language development",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[3]}'
          },
          {
            date: date,
            startTime: "10:30",
            endTime: "11:15",
            activityId: createdActivities[4].id, // Occupational Therapy
            studentIds: [createdStudents[3].id],
            aideIds: [createdAides[4].id],
            notes: "Wednesday OT - Sensory activities and self-care",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[3]}'
          },
          
          // 11:15-12:00 - Art & Crafts
          {
            date: date,
            startTime: "11:15",
            endTime: "12:00",
            activityId: createdActivities[6].id, // Art & Crafts
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id, createdAides[2].id],
            notes: "Wednesday art - Science-themed crafts and experiments",
            recurrence: '{"type":"none"}'
          },
          
          // 12:30-1:15 - Reading Groups
          {
            date: date,
            startTime: "12:30",
            endTime: "13:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[2].id, createdStudents[5].id],
            aideIds: [createdAides[2].id],
            notes: "Wednesday reading - Non-fiction and informational texts",
            recurrence: '{"type":"none"}'
          },
          
          // 1:15-2:00 - Free Play
          {
            date: date,
            startTime: "13:15",
            endTime: "14:00",
            activityId: createdActivities[12].id, // Free Play
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Structured free play with science materials",
            recurrence: '{"type":"none"}'
          }
        ];
      } else if (dayIndex === 3) { // Thursday - Art & Creativity Day
        dayBlocks = [
          ...recurringBlocks,
          // 8:30-9:30 - Extended Art & Crafts
          {
            date: date,
            startTime: "08:30",
            endTime: "09:30",
            activityId: createdActivities[6].id, // Art & Crafts
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id, createdAides[2].id],
            notes: "Thursday art - Creative expression and fine motor development",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[4]}'
          },
          
          // 9:30-10:15 - Reading Groups
          {
            date: date,
            startTime: "09:30",
            endTime: "10:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[0].id, createdStudents[3].id],
            aideIds: [createdAides[0].id],
            notes: "Thursday reading - Creative writing and storytelling",
            recurrence: '{"type":"none"}'
          },
          {
            date: date,
            startTime: "09:30",
            endTime: "10:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[1].id, createdStudents[4].id],
            aideIds: [createdAides[1].id],
            notes: "Thursday reading - Poetry and rhymes",
            recurrence: '{"type":"none"}'
          },
          
          // 10:15-10:30 - Snack
          {
            date: date,
            startTime: "10:15",
            endTime: "10:30",
            activityId: createdActivities[9].id, // Lunch & Recess
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Morning snack time",
            recurrence: '{"type":"none"}'
          },
          
          // 10:30-11:15 - Individual Therapy
          {
            date: date,
            startTime: "10:30",
            endTime: "11:15",
            activityId: createdActivities[3].id, // Speech Therapy
            studentIds: [createdStudents[4].id],
            aideIds: [createdAides[3].id],
            notes: "Thursday speech therapy - Communication and expression",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[4]}'
          },
          {
            date: date,
            startTime: "10:30",
            endTime: "11:15",
            activityId: createdActivities[5].id, // Physical Therapy
            studentIds: [createdStudents[5].id],
            aideIds: [createdAides[5].id],
            notes: "Thursday PT - Gross motor skills and movement",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[4]}'
          },
          
          // 11:15-12:00 - Music & Movement
          {
            date: date,
            startTime: "11:15",
            endTime: "12:00",
            activityId: createdActivities[7].id, // Music & Movement
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[2].id, createdAides[3].id, createdAides[4].id],
            notes: "Thursday music - Creative movement and dance",
            recurrence: '{"type":"none"}'
          },
          
          // 12:30-1:15 - Math Centers
          {
            date: date,
            startTime: "12:30",
            endTime: "13:15",
            activityId: createdActivities[1].id, // Math Centers
            studentIds: [createdStudents[0].id, createdStudents[1].id, createdStudents[2].id],
            aideIds: [createdAides[0].id, createdAides[2].id],
            notes: "Thursday math - Geometry and spatial awareness",
            recurrence: '{"type":"none"}'
          },
          
          // 1:15-2:00 - Social Skills
          {
            date: date,
            startTime: "13:15",
            endTime: "14:00",
            activityId: createdActivities[8].id, // Social Skills
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id],
            notes: "Thursday social skills - Collaboration and teamwork",
            recurrence: '{"type":"none"}'
          }
        ];
      } else { // Friday - Fun & Review Day
        dayBlocks = [
          ...recurringBlocks,
          // 8:30-9:15 - Review Activities
          {
            date: date,
            startTime: "08:30",
            endTime: "09:15",
            activityId: createdActivities[1].id, // Math Centers
            studentIds: [createdStudents[0].id, createdStudents[1].id, createdStudents[2].id],
            aideIds: [createdAides[0].id, createdAides[2].id],
            notes: "Friday review - Math games and activities",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[5]}'
          },
          {
            date: date,
            startTime: "08:30",
            endTime: "09:15",
            activityId: createdActivities[2].id, // Reading Groups
            studentIds: [createdStudents[3].id, createdStudents[4].id, createdStudents[5].id],
            aideIds: [createdAides[1].id, createdAides[3].id],
            notes: "Friday review - Reading games and activities",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[5]}'
          },
          
          // 9:15-10:00 - Music & Movement
          {
            date: date,
            startTime: "09:15",
            endTime: "10:00",
            activityId: createdActivities[7].id, // Music & Movement
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[2].id, createdAides[3].id, createdAides[4].id],
            notes: "Friday music - Celebration songs and movement",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[5]}'
          },
          
          // 10:00-10:15 - Snack
          {
            date: date,
            startTime: "10:00",
            endTime: "10:15",
            activityId: createdActivities[9].id, // Lunch & Recess
            studentIds: createdStudents.map(s => s.id),
            aideIds: createdAides.map(a => a.id),
            notes: "Morning snack time",
            recurrence: '{"type":"none"}'
          },
          
          // 10:15-11:00 - Individual Therapy
          {
            date: date,
            startTime: "10:15",
            endTime: "11:00",
            activityId: createdActivities[3].id, // Speech Therapy
            studentIds: [createdStudents[5].id],
            aideIds: [createdAides[3].id],
            notes: "Friday speech therapy - Social communication",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[5]}'
          },
          {
            date: date,
            startTime: "10:15",
            endTime: "11:00",
            activityId: createdActivities[4].id, // Occupational Therapy
            studentIds: [createdStudents[0].id],
            aideIds: [createdAides[4].id],
            notes: "Friday OT - Life skills and independence",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[5]}'
          },
          
          // 11:00-11:45 - Art & Crafts
          {
            date: date,
            startTime: "11:00",
            endTime: "11:45",
            activityId: createdActivities[6].id, // Art & Crafts
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id, createdAides[2].id],
            notes: "Friday art - Free choice creative activities",
            recurrence: '{"type":"none"}'
          },
          
          // 12:30-1:15 - Science Discovery
          {
            date: date,
            startTime: "12:30",
            endTime: "13:15",
            activityId: createdActivities[11].id, // Science Discovery
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[2].id, createdAides[3].id, createdAides[4].id],
            notes: "Friday science - Fun experiments and exploration",
            recurrence: '{"type":"none"}'
          },
          
          // 1:15-2:00 - Social Skills
          {
            date: date,
            startTime: "13:15",
            endTime: "14:00",
            activityId: createdActivities[8].id, // Social Skills
            studentIds: createdStudents.map(s => s.id),
            aideIds: [createdAides[0].id, createdAides[1].id],
            notes: "Friday social skills - Friendship and community building",
            recurrence: '{"type":"weekly","interval":1,"daysOfWeek":[5]}'
          }
        ];
      }
      
      sampleBlocks.push(...dayBlocks);
    });
    
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
    
    console.log('\n🎉 Varied school week data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${createdStudents.length} students created`);
    console.log(`  • ${createdAides.length} aides created`);
    console.log(`  • ${createdActivities.length} activities created`);
    console.log(`  • ${sampleBlocks.length} schedule blocks created (varied daily schedules)`);
    console.log('\n📅 Daily Themes:');
    console.log('  • Monday: Math Focus Day');
    console.log('  • Tuesday: Reading Focus Day');
    console.log('  • Wednesday: Science & Discovery Day');
    console.log('  • Thursday: Art & Creativity Day');
    console.log('  • Friday: Fun & Review Day');
    console.log('\n🔄 Recurring Events:');
    console.log('  • Morning Circle, Lunch & Recess, Story Time (Daily)');
    console.log('  • Weekly therapy sessions and themed activities');
    console.log('\n🌐 You can now visit http://localhost:5000 to see the varied schedule!');
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    console.log('\n💡 Make sure the server is running on http://localhost:5000');
  }
}

// Run the population script
populateSampleData();
