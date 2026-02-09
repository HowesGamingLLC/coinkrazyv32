import express from "express";
import databaseService from "../services/database.js";

const router = express.Router();

// Initialize admin user endpoint
router.post("/init-admin", async (req, res) => {
  try {
    // Use the correct admin credentials from seed data
    const adminEmail = "coinkrazy00@gmail.com";
    const adminPassword = "Woot6969!";

    // Check if admin already exists
    let existingAdmin = await databaseService.getUserByEmail(adminEmail);

    if (!existingAdmin) {
      // Check if admin username exists
      existingAdmin = await databaseService.getUserByUsername("admin");
    }

    if (existingAdmin) {
      // Update existing admin to ensure it's verified and active
      await databaseService.query(
        `UPDATE users
         SET role = 'admin',
             is_email_verified = TRUE,
             email_verification_token = NULL,
             status = 'active'
         WHERE id = $1`,
        [existingAdmin.id],
      );

      return res.json({
        success: true,
        message: "Admin user verified",
        user: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          role: "admin",
        },
      });
    }

    // Create admin user if it doesn't exist
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(adminPassword, 12);

    const adminUser = await databaseService.createUser({
      email: adminEmail,
      password_hash: passwordHash,
      username: "admin",
      first_name: "Admin",
      last_name: "User",
    });

    // Update user to admin role and verify email
    await databaseService.query(
      `UPDATE users
       SET role = 'admin',
           is_email_verified = TRUE,
           email_verification_token = NULL,
           status = 'active'
       WHERE id = $1`,
      [adminUser.id],
    );

    res.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        email: adminUser.email,
        username: adminUser.username,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create admin user",
      details: error.message,
    });
  }
});

export default router;
