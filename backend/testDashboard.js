#!/usr/bin/env node

/**
 * Quick Test: Admin Dashboard Complete Flow
 * Run this to verify everything is working
 */

const API_BASE = "http://localhost:5000/api";

async function testAdminDashboard() {
  console.log("\n════════════════════════════════════════════\n");
  console.log("🧪 ADMIN DASHBOARD - COMPLETE TEST\n");

  try {
    // 1. Login
    console.log("1️⃣  Logging in as admin...");
    const loginRes = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@bluecarbon.com",
        password: "admin123",
      }),
    });

    if (!loginRes.ok) throw new Error("Login failed");
    const { token } = await loginRes.json();
    console.log("   ✅ Login successful\n");

    // 2. Get projects
    console.log("2️⃣  Fetching projects from admin API...");
    const projRes = await fetch(`${API_BASE}/admin/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!projRes.ok) throw new Error("Projects fetch failed");
    const projData = await projRes.json();
    const projects = Array.isArray(projData) ? projData : projData.projects;
    console.log(`   ✅ Found ${projects.length} projects\n`);

    // 3. Get users
    console.log("3️⃣  Fetching users...");
    const usersRes = await fetch(`${API_BASE}/auth/users`);
    if (!usersRes.ok) throw new Error("Users fetch failed");
    const users = await usersRes.json();
    const developers = users.filter(u => u.role === "developer");
    console.log(`   ✅ Found ${developers.length} developers\n`);

    // 4. Calculate dashboard stats
    console.log("4️⃣  Calculating dashboard stats...\n");
    const stats = {
      totalProjects: projects.length,
      pendingApprovals: projects.filter(p => p.approvalStatus === "pending").length,
      creditsIssued: projects.reduce((sum, p) => sum + (p.carbonCredits || 0), 0),
      activeUsers: developers.length,
    };

    console.log("📊 DASHBOARD SHOULD SHOW:\n");
    console.log(
      `   📁 Total Projects:        ${stats.totalProjects}`.padEnd(35) +
      `${stats.totalProjects >= 2 ? "✅" : "❌"}`
    );
    console.log(
      `   ⏳ Pending Approvals:      ${stats.pendingApprovals}`.padEnd(35) +
      `${stats.pendingApprovals >= 2 ? "✅" : "❌"}`
    );
    console.log(
      `   🌱 Credits Issued:        ${stats.creditsIssued}`.padEnd(35) +
      `${stats.creditsIssued >= 15 ? "✅" : "❌"}`
    );
    console.log(
      `   👥 Active Users:          ${stats.activeUsers}`.padEnd(35) +
      `${stats.activeUsers >= 2 ? "✅" : "❌"}`
    );

    console.log("\n📋 PROJECT DETAILS:\n");
    projects.forEach((p, i) => {
      console.log(`   [${i + 1}] ${p.name}`);
      console.log(`       Creator: ${p.user.name}`);
      console.log(`       Status: ${p.approvalStatus}`);
      console.log(`       Credits: ${p.carbonCredits}\n`);
    });

    console.log("════════════════════════════════════════════\n");
    console.log("✅ If above stats match the dashboard, everything works!\n");
    console.log("🔗 Dashboard URL: http://localhost:3000/admin/login");
    console.log("🔑 Email: admin@bluecarbon.com");
    console.log("🔑 Password: admin123\n");
    console.log("════════════════════════════════════════════\n");

  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.log("\n⚠️  Check:");
    console.log("   - Is backend running? (port 5000)");
    console.log("   - Is MongoDB running?");
    console.log("   - Do projects exist in database?\n");
  }
}

testAdminDashboard();
