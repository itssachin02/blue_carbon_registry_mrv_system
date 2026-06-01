#!/usr/bin/env node

/**
 * Create Test MRV Data for Admin Dashboard Testing
 */

const mongoose = require('mongoose');
const Measurement = require('./models/Measurement');
const MRVReport = require('./models/MRVReport');
const Project = require('./models/Project');
const User = require('./models/user');

async function createTestData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/bluecarbon');
    console.log('✅ Connected to MongoDB');

    // Get existing user and project
    const admin = await User.findOne({ email: 'admin@bluecarbon.com' });
    const project = await Project.findOne();

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    if (!project) {
      console.error('❌ No projects found');
      process.exit(1);
    }

    console.log(`📝 Creating MRV data for project: ${project.name}`);

    // Create test measurements
    const measurements = [];
    for (let i = 1; i <= 3; i++) {
      const measurement = await Measurement.create({
        projectId: project._id,
        projectName: project.name,
        user: admin._id,
        measurementDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)),
        areaMonitored: project.area || 100,
        growthRate: 5 + i,
        co2AbsorptionRate: 2.5 + (i * 0.1),
        dataSource: ['satellite', 'sensor', 'manual'][i % 3],
        calculatedCO2Absorbed: (100 + (i * 15)).toFixed(2),
        carbonCreditsGenerated: Math.floor(100 + (i * 15)),
        status: ['calculated', 'calculated', 'submitted'][i - 1],
        sensorData: {
          temperature: 25 + i,
          humidity: 60 + i,
          timestamp: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000))
        },
        satelliteImagery: {
          source: 'Sentinel-2',
          resolution: '10m',
          captureDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000))
        }
      });
      measurements.push(measurement);
      console.log(`✅ Created measurement ${i}: ${measurement.calculatedCO2Absorbed} tCO2e`);
    }

    // Create test MRV reports
    const reports = [];
    for (let i = 1; i <= 2; i++) {
      const report = await MRVReport.create({
        projectId: project._id,
        projectName: project.name,
        user: admin._id,
        reportType: ['monitoring', 'verification'][i - 1],
        methodology: i === 1 ? 'Satellite imagery analysis' : 'Ground verification',
        carbonSequestered: (150 + (i * 20)).toFixed(2),
        status: ['under-review', 'approved'][i - 1],
        notes: `MRV Report ${i}: Verified and ready for carbon credit issuance`,
        createdAt: new Date(Date.now() - (i * 3 * 24 * 60 * 60 * 1000))
      });
      reports.push(report);
      console.log(`✅ Created report ${i}: ${report.carbonSequestered} tCO2e - Status: ${report.status}`);
    }

    console.log('\n✨ Test Data Summary:');
    console.log(`📊 Measurements created: ${measurements.length}`);
    console.log(`📋 Reports created: ${reports.length}`);
    console.log(`💧 Total CO2 data: ${(measurements.reduce((sum, m) => sum + parseFloat(m.calculatedCO2Absorbed), 0) + reports.reduce((sum, r) => sum + parseFloat(r.carbonSequestered), 0)).toFixed(2)} tCO2e`);
    console.log('\n🎯 Now you should see data in the MRV dashboard!');
    console.log('📍 Visit: http://localhost:3000/admin/mrv');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestData();
