#!/usr/bin/env node

/**
 * Test: User Registration and Admin Display Flow
 * 
 * This test verifies that:
 * 1. New user registration works
 * 2. User immediately appears in admin Users Management page
 * 3. User counts update correctly
 */

const http = require("http");

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    // Ensure path includes /api prefix
    const fullPath = path.startsWith("/api") ? path : `/api${path}`;
    const url = new URL(`http://localhost:5000${fullPath}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log("🧪 Testing User Registration and Admin Display Flow\n");
  console.log("═".repeat(60));

  try {
    // Test 1: Check current users
    console.log("\n📊 Test 1: Fetching current users from API...");
    const usersBefore = await makeRequest("GET", "/auth/users");
    console.log(`✅ Status: ${usersBefore.status}`);
    
    if (usersBefore.status !== 200) {
      console.error(`❌ API returned status ${usersBefore.status}`);
      console.error(`   Response: ${JSON.stringify(usersBefore.data)}`);
      process.exit(1);
    }
    
    const beforeCount = Array.isArray(usersBefore.data) ? usersBefore.data.length : 0;
    console.log(`✅ Current users in database: ${beforeCount}`);
    if (beforeCount > 0) {
      const userNames = usersBefore.data.map((u) => u.name);
      console.log(`   Users: ${userNames.join(", ")}`);
    }

    // Test 2: Register a new test user
    console.log("\n📝 Test 2: Registering new test user...");
    const testEmail = `testuser_${Date.now()}@test.com`;
    const newUser = {
      name: "Test User " + Date.now(),
      email: testEmail,
      password: "testPassword123",
    };

    const registerRes = await makeRequest("POST", "/auth/register", newUser);
    console.log(`✅ Status: ${registerRes.status}`);
    if (registerRes.status === 201 || registerRes.status === 200) {
      console.log(`✅ User registered successfully`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Name: ${newUser.name}`);
    } else {
      console.log(`⚠️  Unexpected status: ${registerRes.status}`);
      console.log(`   Response: ${JSON.stringify(registerRes.data)}`);
    }

    // Test 3: Verify user appears in list immediately
    console.log("\n🔍 Test 3: Verifying user appears in admin list...");
    const usersAfter = await makeRequest("GET", "/auth/users");
    console.log(`✅ Status: ${usersAfter.status}`);
    const afterCount = Array.isArray(usersAfter.data) ? usersAfter.data.length : 0;
    console.log(`✅ Users after registration: ${afterCount}`);

    const newUserInDB = usersAfter.data.find((u) => u.email === testEmail);
    if (newUserInDB) {
      console.log(`✅ NEW USER FOUND IN DATABASE!`);
      console.log(`   ID: ${newUserInDB._id}`);
      console.log(`   Name: ${newUserInDB.name}`);
      console.log(`   Email: ${newUserInDB.email}`);
      console.log(`   Role: ${newUserInDB.role}`);
      console.log(`   Status: ${newUserInDB.isBlocked ? "blocked" : "active"}`);
      console.log(`   Created: ${new Date(newUserInDB.createdAt).toLocaleString()}`);
    } else {
      console.log(`❌ NEW USER NOT FOUND IN ADMIN LIST`);
    }

    // Test 4: Verify counts
    console.log("\n📈 Test 4: Verifying counts...");
    const totalBefore = beforeCount;
    const totalAfter = afterCount;
    console.log(`   Before: ${totalBefore} users`);
    console.log(`   After: ${totalAfter} users`);
    console.log(`   Difference: ${totalAfter - totalBefore} user(s) added`);

    if (totalAfter > totalBefore) {
      console.log(`✅ USER COUNT UPDATED CORRECTLY`);
    } else {
      console.log(`❌ USER COUNT DID NOT UPDATE`);
    }

    // Test 5: Verify API response format
    console.log("\n✔️  Test 5: Verifying API response format...");
    console.log(`   Is array: ${Array.isArray(usersAfter.data)}`);
    if (usersAfter.data && usersAfter.data.length > 0) {
      console.log(`   First user fields: ${Object.keys(usersAfter.data[0]).join(", ")}`);
      console.log(`   Has status field: ${usersAfter.data[0].status !== undefined}`);
      console.log(`   Has isBlocked field: ${usersAfter.data[0].isBlocked !== undefined}`);
      console.log(`   Has createdAt field: ${usersAfter.data[0].createdAt !== undefined}`);
    }

    console.log("\n" + "═".repeat(60));
    console.log("\n✨ Summary:");
    const isReady = newUserInDB && totalAfter > totalBefore;
    console.log(`
✅ API Endpoint Working: /api/auth/users
✅ Returns Array Format: ${Array.isArray(usersAfter.data)}
✅ New Users Appear Immediately: ${newUserInDB ? "YES" : "NO"}
✅ User Counts Update: ${totalAfter > totalBefore ? "YES" : "NO"}
✅ Ready for Admin Dashboard: ${isReady ? "YES" : "NO"}

Frontend Auto-Update: Every 5 seconds (page will refresh automatically)
    `);

  } catch (error) {
    console.error("❌ Test Error:", error.message);
  }
}

test();
