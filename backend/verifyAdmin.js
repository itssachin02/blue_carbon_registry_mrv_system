/**
 * Admin Dashboard Verification Script
 * Tests the complete admin authentication and data flow
 */

const API_BASE = "http://localhost:5000/api";

async function verifyAdminFlow() {
  console.log("🔄 Starting Admin Dashboard Verification...\n");

  try {
    // Step 1: Login as admin
    console.log("1️⃣  Attempting admin login...");
    const loginResponse = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@bluecarbon.com",
        password: "admin123",
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log("✅ Login successful!");
    console.log(`   Token: ${token.substring(0, 30)}...`);
    console.log(`   Admin: ${loginData.admin.name} (${loginData.admin.email})\n`);

    // Step 2: Fetch projects with token
    console.log("2️⃣  Fetching all projects...");
    const projectsResponse = await fetch(`${API_BASE}/admin/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Projects fetch failed with status ${projectsResponse.status}`);
    }

    const projectsData = await projectsResponse.json();
    const projects = Array.isArray(projectsData)
      ? projectsData
      : projectsData.projects || [];

    console.log("✅ Projects fetched!");
    console.log(`   Total projects: ${projects.length}`);
    projects.forEach((p, i) => {
      console.log(
        `   [${i + 1}] ${p.name} - Status: ${p.approvalStatus} - Credits: ${p.carbonCredits}`
      );
    });
    console.log();

    // Step 3: Fetch users
    console.log("3️⃣  Fetching all users...");
    const usersResponse = await fetch(`${API_BASE}/auth/users`);

    if (!usersResponse.ok) {
      throw new Error(`Users fetch failed with status ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    const developers = users.filter((u) => u.role === "developer");

    console.log("✅ Users fetched!");
    console.log(`   Total users: ${users.length}`);
    console.log(`   Developers: ${developers.length}`);
    console.log(`   Admins: ${users.filter((u) => u.role === "admin").length}\n`);

    // Step 4: Calculate dashboard stats
    console.log("4️⃣  Calculating dashboard statistics...");
    const pending = projects.filter((p) => p.approvalStatus === "pending").length;
    const credits = projects.reduce((sum, p) => sum + (p.carbonCredits || 0), 0);

    const stats = {
      totalProjects: projects.length,
      pendingApprovals: pending,
      creditsIssued: credits,
      activeUsers: developers.length,
    };

    console.log("✅ Dashboard Statistics:");
    console.log(`   Total Projects: ${stats.totalProjects}`);
    console.log(`   Pending Approvals: ${stats.pendingApprovals}`);
    console.log(`   Credits Issued: ${stats.creditsIssued}`);
    console.log(`   Active Users: ${stats.activeUsers}\n`);

    // Step 5: Verify against expected values
    console.log("5️⃣  Verification Results:");
    const checks = [
      ["Total Projects > 0", stats.totalProjects > 0],
      ["Pending Approvals >= 0", stats.pendingApprovals >= 0],
      ["Credits Issued > 0", stats.creditsIssued > 0],
      ["Active Users > 0", stats.activeUsers > 0],
    ];

    let allPassed = true;
    checks.forEach(([check, passed]) => {
      console.log(`   ${passed ? "✅" : "❌"} ${check}`);
      if (!passed) allPassed = false;
    });

    console.log();
    if (allPassed) {
      console.log("🎉 All checks passed! Admin dashboard is working correctly.\n");
      console.log("📝 Next Steps:");
      console.log(`   1. Go to: http://localhost:3000/admin/login`);
      console.log(`   2. Login with: admin@bluecarbon.com / admin123`);
      console.log(`   3. You should see the same stats on the dashboard\n`);
    } else {
      console.log("⚠️  Some checks failed. Investigate the results above.\n");
    }

    return {
      success: allPassed,
      stats,
      projects,
      users,
      token,
    };
  } catch (error) {
    console.error("❌ Error during verification:", error.message);
    console.log("\n⚠️  Troubleshooting:");
    console.log("   - Is backend running on port 5000?");
    console.log("   - Is MongoDB connected?");
    console.log("   - Does admin@bluecarbon.com user exist?");
    return null;
  }
}

// Run if executed directly
if (require.main === module) {
  verifyAdminFlow()
    .then((result) => {
      process.exit(result ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { verifyAdminFlow };
