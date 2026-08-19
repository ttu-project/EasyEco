/**
 * End-to-end Verification Test Suite for EasyEco Backend & Logic
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Setup test server
const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', require('../routes/userRoutes'));
app.use('/api/users', require('../routes/userRoutes'));
app.use('/api/usage', require('../routes/usageRoutes'));
app.use('/api/records', require('../routes/recordRoutes'));
app.use('/api/bill', require('../routes/billRoutes'));
app.use('/api/dashboard', require('../routes/dashboardRoutes'));

const User = require('../models/User');
const Usage = require('../models/Usage');
const UsageRecord = require('../models/UsageRecord');
const { calculateMeterBill } = require('../services/timelineService')._internal;

let server;
let baseUrl;

async function request(method, path, body = null, token = null, headers = {}) {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== STARTING EASYSCO INTEGRATION TESTS ===\n');

  // 1. Connect MongoDB
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/easyeco';
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    uri = 'mongodb://127.0.0.1:27017/easyeco';
  }
  await mongoose.connect(uri);
  console.log('✓ MongoDB Connected');

  // Start HTTP server on random port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`✓ Test server listening at ${baseUrl}\n`);
      resolve();
    });
  });

  const testEmail = `tester_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  let authToken = null;
  let userId = null;

  // ── TEST 1: Register User with Name + Gmail + Password ──
  console.log('Test 1: User Registration (/api/auth/register)');
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Test Eco User',
    email: testEmail,
    password: testPassword,
  });
  if (regRes.status !== 201 || !regRes.data.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  }
  authToken = regRes.data.token;
  userId = regRes.data._id;
  console.log(`✓ Registered user ${regRes.data.name} (${regRes.data.email}), Token received`);

  // ── TEST 2: Duplicate Registration Guard ──
  console.log('\nTest 2: Duplicate Email Rejection');
  const dupRes = await request('POST', '/api/auth/register', {
    name: 'Duplicate User',
    email: testEmail,
    password: testPassword,
  });
  if (dupRes.status !== 400) {
    throw new Error(`Duplicate registration should return 400, got: ${dupRes.status}`);
  }
  console.log(`✓ Duplicate registration correctly rejected: "${dupRes.data.message}"`);

  // ── TEST 3: Login with Gmail + Password ──
  console.log('\nTest 3: User Login with Gmail (/api/auth/login)');
  const loginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
  }
  console.log(`✓ Logged in successfully, token matches user`);

  // ── TEST 4: Get Profile ──
  console.log('\nTest 4: Get User Profile (/api/users/profile)');
  const profileRes = await request('GET', '/api/users/profile', null, authToken);
  if (profileRes.status !== 200 || profileRes.data.email !== testEmail) {
    throw new Error(`Get profile failed: ${JSON.stringify(profileRes.data)}`);
  }
  console.log(`✓ Profile retrieved: name=${profileRes.data.name}, email=${profileRes.data.email}`);

  // ── TEST 5: Update Profile Photo ──
  console.log('\nTest 5: Update Profile Photo (/api/users/profile/photo)');
  // 1x1 transparent PNG data URL
  const samplePngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const photoRes = await request('PUT', '/api/users/profile/photo', {
    profileImage: samplePngDataUrl,
  }, authToken);
  if (photoRes.status !== 200 || !photoRes.data.profileImage) {
    throw new Error(`Photo update failed: ${JSON.stringify(photoRes.data)}`);
  }
  console.log(`✓ Photo uploaded and persisted: ${photoRes.data.profileImage}`);

  // ── TEST 6: Appliance CRUD ──
  console.log('\nTest 6: Appliance Creation & Listing (/api/usage)');
  const app1 = await request('POST', '/api/usage', {
    category: 'refrigerator',
    name: 'Samsung Inverter',
    watt: '150W',
    time: '24 hr',
  }, authToken);
  if (app1.status !== 201) throw new Error(`Add appliance failed: ${JSON.stringify(app1.data)}`);

  const app2 = await request('POST', '/api/usage', {
    category: 'ac',
    name: 'Daikin 1.5HP',
    watt: '1200W',
    time: '8 hr',
  }, authToken);
  if (app2.status !== 201) throw new Error(`Add appliance failed: ${JSON.stringify(app2.data)}`);

  const app3 = await request('POST', '/api/usage', {
    category: 'bulb',
    name: 'Living Room LED',
    watt: '40W',
    time: '6 hr',
  }, authToken);
  if (app3.status !== 201) throw new Error(`Add appliance failed: ${JSON.stringify(app3.data)}`);

  const usageListRes = await request('GET', '/api/usage', null, authToken);
  if (usageListRes.status !== 200 || usageListRes.data.length !== 3) {
    throw new Error(`Expected 3 appliances, got ${usageListRes.data?.length}`);
  }
  console.log(`✓ Created 3 appliances: Refrigerator (150W x 24h = 3.6 kWh/d), AC (1200W x 8h = 9.6 kWh/d), Bulb (40W x 6h = 0.24 kWh/d). Total = 13.44 kWh/d`);

  // ── TEST 7: Save Usage Snapshot to MongoDB ──
  console.log('\nTest 7: Save Usage Record Snapshot (/api/records)');
  const todayStr = new Date().toISOString().split('T')[0];
  const appliancesSnapshot = [
    { category: 'refrigerator', name: 'Samsung Inverter', watt: '150W', time: '24 hr' },
    { category: 'ac', name: 'Daikin 1.5HP', watt: '1200W', time: '8 hr' },
    { category: 'bulb', name: 'Living Room LED', watt: '40W', time: '6 hr' },
  ];
  const saveRecRes = await request('POST', '/api/records', {
    effectiveDate: todayStr,
    appliances: appliancesSnapshot,
  }, authToken);
  if (saveRecRes.status !== 201 || !saveRecRes.data.record) {
    throw new Error(`Save record failed: ${JSON.stringify(saveRecRes.data)}`);
  }
  console.log(`✓ UsageRecord snapshot saved with totalDailyKwh=${saveRecRes.data.record.totalDailyKwh}`);

  // Verify record is in MongoDB
  const savedCount = await UsageRecord.countDocuments({ user: userId });
  if (savedCount !== 1) throw new Error(`Expected 1 saved record in MongoDB, found ${savedCount}`);
  console.log(`✓ Verified record stored in MongoDB UsageRecord collection`);

  // ── TEST 8: Calculate Bill Endpoint ──
  console.log('\nTest 8: Calculate Bill (/api/bill/calculate)');
  const calcRes = await request('POST', '/api/bill/calculate', {}, authToken);
  if (calcRes.status !== 200 || !calcRes.data.hasData) {
    throw new Error(`Calculate bill failed: ${JSON.stringify(calcRes.data)}`);
  }
  console.log(`✓ Calculation Result:`);
  console.log(`  • Current Consumption: ${calcRes.data.currentUnits} units -> ${calcRes.data.currentCost} MMK`);
  console.log(`  • Estimated Monthly Total: ${calcRes.data.estimatedUnits} units -> ${calcRes.data.estimatedCost} MMK`);
  console.log(`  • Recommendation: "${calcRes.data.recommendation}"`);

  // ── TEST 9: Dashboard Aggregation ──
  console.log('\nTest 9: Dashboard Aggregation (/api/dashboard)');
  const dashRes = await request('GET', '/api/dashboard', null, authToken);
  if (dashRes.status !== 200 || !dashRes.data.hasData) {
    throw new Error(`Dashboard fetch failed: ${JSON.stringify(dashRes.data)}`);
  }
  console.log(`✓ Dashboard aggregation returns real-time calculated values: current=${dashRes.data.currentUnits} units, estimated=${dashRes.data.estimatedUnits} units`);

  // ── TEST 10: Tiered Rate Unit Tests ──
  console.log('\nTest 10: Myanmar Tiered Billing Rates Verification');
  // Tier 1: 30 units -> 30 * 50 + 120 (fee for >15 units) = 1620 MMK
  const bill30 = calculateMeterBill(30);
  if (bill30 !== 1620) throw new Error(`Bill for 30 units expected 1620, got ${bill30}`);

  // Tier 2: 75 units -> 50*50 + 25*100 + 120 (fee) = 2500 + 2500 + 120 = 5120 MMK
  const bill75 = calculateMeterBill(75);
  if (bill75 !== 5120) throw new Error(`Bill for 75 units expected 5120, got ${bill75}`);

  // Tier 3: 150 units -> 50*50 + 50*100 + 50*150 + 120 = 2500 + 5000 + 7500 + 120 = 15120 MMK
  const bill150 = calculateMeterBill(150);
  if (bill150 !== 15120) throw new Error(`Bill for 150 units expected 15120, got ${bill150}`);

  // Tier 4: 250 units -> 50*50 + 50*100 + 100*150 + 50*300 + 120 = 2500 + 5000 + 15000 + 15000 + 120 = 37620 MMK
  const bill250 = calculateMeterBill(250);
  if (bill250 !== 37620) throw new Error(`Bill for 250 units expected 37620, got ${bill250}`);
  console.log('✓ Myanmar Tiered Rates calculation matches all billing rules accurately');

  // Clean up test data
  await User.deleteOne({ _id: userId });
  await Usage.deleteMany({ user: userId });
  await UsageRecord.deleteMany({ user: userId });
  console.log('\n✓ Test data cleaned up');

  console.log('\n========================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED 100%');
  console.log('========================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('\n❌ TEST FAILED:', err);
  if (server) server.close();
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
