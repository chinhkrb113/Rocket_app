#!/usr/bin/env node

// Database seeding script for Rocket Training System
// Run with: node src/scripts/seedDatabase.js

const mongoose = require('mongoose');
const { seedDatabase, testCredentials } = require('../data/seedData');
require('dotenv').config();

// Import models (assuming they exist)
const User = require('../models/User');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Review = require('../models/Review');

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rocket_training';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔗 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing existing data...');
    
    // Clear collections in order (to avoid foreign key constraints)
    await Review.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Seed data into database
const seedData = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');
    
    // Get prepared seed data
    const data = await seedDatabase();
    
    // Insert data in order
    console.log('📝 Inserting categories...');
    await Category.insertMany(data.categories);
    
    console.log('👥 Inserting users...');
    await User.insertMany(data.users);
    
    console.log('📚 Inserting courses...');
    await Course.insertMany(data.courses);
    
    console.log('📖 Inserting lessons...');
    await Lesson.insertMany(data.lessons);
    
    console.log('🎓 Inserting enrollments...');
    await Enrollment.insertMany(data.enrollments);
    
    console.log('⭐ Inserting reviews...');
    await Review.insertMany(data.reviews);
    
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Display test credentials
const displayCredentials = () => {
  console.log('\n🔑 Test Credentials:');
  console.log('==========================================');
  
  Object.entries(testCredentials).forEach(([role, creds]) => {
    console.log(`\n${role.toUpperCase()}:`);
    console.log(`  Email: ${creds.email}`);
    console.log(`  Password: ${creds.password}`);
    console.log(`  Role: ${creds.role}`);
  });
  
  console.log('\n==========================================');
  console.log('💡 Use these credentials to test different user roles');
  console.log('🌐 Frontend URL: http://localhost:3000');
  console.log('🔧 Backend URL: http://localhost:5000');
};

// Main execution function
const main = async () => {
  try {
    console.log('🚀 Rocket Training System - Database Seeding');
    console.log('============================================\n');
    
    // Connect to database
    await connectDB();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');
    const shouldSeed = args.includes('--seed') || args.includes('-s') || args.length === 0;
    
    if (shouldClear) {
      await clearDatabase();
    }
    
    if (shouldSeed) {
      await seedData();
    }
    
    // Display test credentials
    displayCredentials();
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  connectDB,
  clearDatabase,
  seedData,
  displayCredentials
};