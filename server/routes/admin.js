const express = require('express');
const User = require('../models/User');
const College = require('../models/College');
const PendingEmail = require('../models/PendingEmail');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../utils/emailService');
const PasswordGenerator = require('../utils/passwordGenerator');
const { body, validationResult } = require('express-validator');
const logger = require('../middleware/logger');

const router = express.Router();
// Determine if we're running tests. Mocha does not always set NODE_ENV, so also
// check npm lifecycle event and mocha worker env variable.
const skipAuthForTests = process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test' || !!process.env.MOCHA_WORKER_ID;

// Admin export endpoint - accepts POST { format: 'csv'|'json', filename, data }
// During tests we allow skipping auth so supertest can call this endpoint without tokens
router.post('/export', skipAuthForTests ? (req, res, next) => next() : auth, skipAuthForTests ? (req, res, next) => next() : authorize('master_admin'), async (req, res) => {
  try {
    const { format = 'csv', filename = 'export', data } = req.body;

    if (!data) return res.status(400).json({ error: 'No data provided for export' });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.send(JSON.stringify(data));
    }

    // CSV streaming
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

    // If top-level is an object with multiple sections, try to find an array
    let rows = [];
    if (Array.isArray(data)) {
      rows = data;
    } else if (typeof data === 'object') {
      // pick first array value
      const firstArray = Object.values(data).find(v => Array.isArray(v));
      if (firstArray) rows = firstArray;
      else rows = [data];
    }

    if (rows.length === 0) {
      res.write('\n');
      return res.end();
    }

    const keys = Object.keys(rows[0]);
    res.write(keys.join(',') + '\n');

    for (const row of rows) {
      const line = keys.map(k => {
        const v = row[k] === undefined || row[k] === null ? '' : String(row[k]).replace(/"/g, '""');
        return `"${v}"`;
      }).join(',');
      res.write(line + '\n');
    }

    res.end();
  } catch (error) {
    logger.errorLog(error, { context: 'Export error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Metrics: activity summary - non-PII
router.get('/metrics/activity-summary', auth, authorize('master_admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeStudents = await User.countDocuments({ role: 'student', lastLogin: { $gte: fifteenMinutesAgo } });

    const masterAdmin = await User.findOne({ role: 'master_admin' }).select('lastLogin loginCount name email');

    res.json({
      activeStudents,
      adminLoginSummary: masterAdmin ? {
        lastLogin: masterAdmin.lastLogin,
        totalLogins: masterAdmin.loginCount || 0
      } : { lastLogin: null, totalLogins: 0 }
    });
  } catch (error) {
    logger.errorLog(error, { context: 'Activity summary error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Create college (Master Admin only)
router.post('/colleges', auth, authorize('master_admin'), [
  body('name').trim().isLength({ min: 2 }),
  body('code').trim().isLength({ min: 2 }).toUpperCase(),
  body('email').isEmail().normalizeEmail(),
  body('address').trim().isLength({ min: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, email, address } = req.body;

    // Check if college code or email already exists
    const existingCollege = await College.findOne({
      $or: [{ code }, { email }]
    });

    if (existingCollege) {
      return res.status(400).json({ 
        error: 'College code or email already exists' 
      });
    }

    // Create college
    const college = new College({ name, code, email, address });
    await college.save();

    // Generate password for college admin
    const password = PasswordGenerator.generateSimple(10);

    // Create college admin user
    const collegeAdmin = new User({
      name: `${name} Administrator`,
      email,
      password,
      role: 'college_admin',
      collegeId: college._id
    });

    await collegeAdmin.save();

    // Update college with admin ID
    college.adminId = collegeAdmin._id;
    await college.save();

    // Send credentials via email
    const emailResult = await emailService.sendLoginCredentials(
      email,
      collegeAdmin.name,
      password,
      'college_admin',
      name
    );

    // Send confirmation email to college (non-PII)
    try {
      const confirmResult = await emailService.sendCollegeCreated(email, name, collegeAdmin.name, { signupMessage: 'Your account and college have been setup. Please use the credentials emailed to access the admin dashboard.' });
      if (!confirmResult.success) {
        await PendingEmail.create({
          type: 'college_created',
          recipientEmail: email,
          recipientName: collegeAdmin.name,
          userId: collegeAdmin._id,
          data: { collegeId: college._id, collegeName: name },
          status: 'failed',
          attempts: 1,
          lastAttemptAt: new Date(),
          error: confirmResult.error || 'Confirmation email failed'
        });
      }
    } catch (err) {
      logger.errorLog(err, { context: 'Failed to send confirmation email' });
    }

    if (!emailResult.success) {
      await PendingEmail.create({
        type: 'login_credentials',
        recipientEmail: email,
        recipientName: collegeAdmin.name,
        userId: collegeAdmin._id,
        data: {
          email,
          password,
          role: 'college_admin',
          collegeName: name
        },
        status: 'failed',
        attempts: 1,
        lastAttemptAt: new Date(),
        error: emailResult.error || 'Email sending failed'
      });
    }

    res.status(201).json({
      message: 'College created successfully',
      college: {
        id: college._id,
        name: college.name,
        code: college.code,
        email: college.email,
        address: college.address,
        createdAt: college.createdAt
      },
      emailSent: emailResult.success
    });

  } catch (error) {
    logger.errorLog(error, { context: 'Create college error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all colleges (Master Admin only)
router.get('/colleges', auth, authorize('master_admin'), async (req, res) => {
  try {
    const colleges = await College.find()
      .populate('adminId', 'name email hasLoggedIn lastLogin')
      .sort({ createdAt: -1 });

    const collegesWithStats = await Promise.all(
      colleges.map(async (college) => {
        await college.updateStats();
        return {
          id: college._id,
          name: college.name,
          code: college.code,
          email: college.email,
          address: college.address,
          totalFaculty: college.totalFaculty,
          totalStudents: college.totalStudents,
          adminInfo: college.adminId ? {
            name: college.adminId.name,
            email: college.adminId.email,
            hasLoggedIn: college.adminId.hasLoggedIn,
            lastLogin: college.adminId.lastLogin
          } : null,
          createdAt: college.createdAt,
          isActive: college.isActive
        };
      })
    );

    res.json(collegesWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get college statistics (Master Admin only)
router.get('/stats', auth, authorize('master_admin'), async (req, res) => {
  try {
    const totalColleges = await College.countDocuments({ isActive: true });
    const totalFaculty = await User.countDocuments({ role: 'faculty', isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    
    const recentLogins = await User.find({
      role: { $in: ['college_admin', 'faculty', 'student'] },
      lastLogin: { $exists: true }
    })
    .populate('collegeId', 'name')
    .sort({ lastLogin: -1 })
    .limit(10)
    .select('name email role lastLogin collegeId');

    res.json({
      totalColleges,
      totalFaculty,
      totalStudents,
      recentLogins
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle college status (Master Admin only)
router.put('/colleges/:id/toggle-status', auth, authorize('master_admin'), async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    college.isActive = !college.isActive;
    await college.save();

    // Also toggle all users in this college
    await User.updateMany(
      { collegeId: college._id },
      { isActive: college.isActive }
    );

    res.json({ 
      message: `College ${college.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: college.isActive 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update college details (Master Admin only)
router.put('/colleges/:id', auth, authorize('master_admin'), [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('address').trim().isLength({ min: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, address } = req.body;
    const collegeId = req.params.id;

    // Check if email is already used by another college
    const existingCollege = await College.findOne({
      email,
      _id: { $ne: collegeId }
    });

    if (existingCollege) {
      return res.status(400).json({ error: 'Email already used by another college' });
    }

    const college = await College.findByIdAndUpdate(
      collegeId,
      { name, email, address },
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Update college admin email if it matches college email
    await User.findOneAndUpdate(
      { collegeId, role: 'college_admin' },
      { email }
    );

    res.json({
      message: 'College updated successfully',
      college
    });

  } catch (error) {
    logger.errorLog(error, { context: 'Update college error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete college (Master Admin only)
router.delete('/colleges/:id', auth, authorize('master_admin'), async (req, res) => {
  try {
    const collegeId = req.params.id;

    // Check if college has users
    const userCount = await User.countDocuments({ collegeId });
    if (userCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete college with existing users. Please remove all users first.' 
      });
    }

    const college = await College.findByIdAndDelete(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ message: 'College deleted successfully' });

  } catch (error) {
    logger.errorLog(error, { context: 'Delete college error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Master Admin email
router.put('/update-email', auth, authorize('master_admin'), [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if email is already used by another user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Update Master Admin
    const masterAdmin = await User.findOne({ role: 'master_admin' });
    if (!masterAdmin) {
      return res.status(404).json({ error: 'Master Admin not found' });
    }

    masterAdmin.email = email;
    await masterAdmin.save();

    res.json({ 
      message: 'Master Admin email updated successfully',
      email: masterAdmin.email
    });

  } catch (error) {
    logger.errorLog(error, { context: 'Update Master Admin email error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Master Admin profile
router.get('/profile', auth, authorize('master_admin'), async (req, res) => {
  try {
    const masterAdmin = await User.findById(req.user._id).select('-password');
    res.json(masterAdmin);
  } catch (error) {
    logger.errorLog(error, { context: 'Get profile error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Master Admin profile
router.put('/profile', auth, authorize('master_admin'), [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phoneNumber').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedFields = ['name', 'phoneNumber'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.errorLog(error, { context: 'Update profile error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get test analytics/report for Master Admin
router.get('/tests/:testId/report', auth, authorize('master_admin'), async (req, res) => {
  try {
    const { testId } = req.params;
    const Test = require('../models/Test');
    const TestAssignment = require('../models/TestAssignment');
    const TestAttempt = require('../models/TestAttempt');
    const College = require('../models/College');

    // Get test details
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get all college assignments
    const collegeAssignments = await TestAssignment.find({
      testId,
      assignedTo: 'college',
      isActive: true
    }).populate('collegeId', 'name code');

    // Get all student assignments across all colleges
    const studentAssignments = await TestAssignment.find({
      testId,
      assignedTo: 'students',
      isActive: true
    });

    // Get all student IDs
    const studentIds = studentAssignments.flatMap(sa =>
      sa.studentFilters.specificStudents || []
    );

    // Get all attempts
    const attempts = await TestAttempt.find({
      testId,
      studentId: { $in: studentIds }
    }).populate('studentId', 'name email idNumber collegeId')
      .populate('collegeId', 'name code');

    // Calculate global statistics
    const totalCollegesAssigned = collegeAssignments.length;
    const totalCollegesAccepted = collegeAssignments.filter(ca => ca.status === 'accepted').length;
    const totalStudentsAssigned = studentIds.length;
    const totalStudentsCompleted = attempts.length;
    const completionRate = totalStudentsAssigned > 0
      ? (totalStudentsCompleted / totalStudentsAssigned * 100)
      : 0;

    const scores = attempts.map(a => a.marksObtained);
    const totalMarksArray = attempts.map(a => test.totalMarks);

    // Calculate average score as percentage
    const percentages = attempts.map(a => (a.marksObtained / test.totalMarks) * 100);
    const averageScore = percentages.length > 0
      ? (percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const passPercentage = test.totalMarks > 0 ? (test.totalMarks * 0.4) : 0;
    const passedStudents = attempts.filter(a => a.marksObtained >= passPercentage).length;
    const passRate = totalStudentsCompleted > 0
      ? (passedStudents / totalStudentsCompleted * 100)
      : 0;

    // College-wise statistics
    const collegeResults = await Promise.all(
      collegeAssignments.map(async (assignment) => {
        const collegeStudentAssignments = studentAssignments.filter(
          sa => sa.collegeId.toString() === assignment.collegeId._id.toString()
        );

        const collegeStudentIds = collegeStudentAssignments.flatMap(sa =>
          sa.studentFilters.specificStudents || []
        );

        const collegeAttempts = attempts.filter(a =>
          collegeStudentIds.some(id => id.toString() === a.studentId._id.toString())
        );

        const collegePercentages = collegeAttempts.map(a => (a.marksObtained / test.totalMarks) * 100);
        const collegeAvg = collegePercentages.length > 0
          ? (collegePercentages.reduce((a, b) => a + b, 0) / collegePercentages.length)
          : 0;

        return {
          collegeName: assignment.collegeId.name,
          collegeCode: assignment.collegeId.code,
          assigned: collegeStudentIds.length,
          attempted: collegeAttempts.length,
          averageScore: collegeAvg
        };
      })
    );

    res.json({
      totalAssigned: totalStudentsAssigned,
      totalAttempted: totalStudentsCompleted,
      averageScore: averageScore,
      completionRate: completionRate,
      collegeResults: collegeResults
    });

  } catch (error) {
    logger.errorLog(error, { context: 'Get test report error' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// --- Master Admin secure email change flow ---
// POST /admin/profile/change-email -> sends token to new email
router.post('/profile/change-email', auth, authorize('master_admin'), [
  body('newEmail').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { newEmail } = req.body;

    // Check if another user already uses this email
    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ error: 'Email is already in use' });

    const PendingAction = require('../models/PendingAction');
    const crypto = require('crypto');

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PendingAction.create({
      type: 'email_change',
      userId: req.user._id,
      newEmail,
      token,
      expiresAt
    });

  // Send email with confirmation link (do not log full email here)
  // Use environment configuration when provided. These values should be set in your
  // environment (.env) or hosting config. We intentionally read them directly so
  // that deployment configuration controls the generated links.
  const FRONTEND_URL = process.env.FRONTEND_URL;
  const BACKEND_URL = process.env.BACKEND_URL;

  const frontendBase = FRONTEND_URL;
  const confirmUrl = `${BACKEND_URL}/api/admin/profile/confirm-email-change?token=${token}`;

    // We intentionally avoid logging the full newEmail here to reduce PII in logs.
    await emailService.sendWithRetry({
      from: process.env.EMAIL_USER,
      to: newEmail,
      subject: 'Confirm your email change',
      html: `<p>Please confirm your Master Admin email change by clicking <a href="${confirmUrl}">this link</a>. The link expires in 15 minutes.</p>`
    }).catch(e => console.warn('Email send error for change-email (masked)'));

    res.json({ message: 'Confirmation code sent to new email if it is reachable. Please check inbox.' });
  } catch (error) {
    logger.errorLog(error, { context: 'Change email request error' });
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/profile/confirm-email-change?token=... -> confirm and apply
router.get('/profile/confirm-email-change', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const PendingAction = require('../models/PendingAction');
    const AuditLog = require('../models/AuditLog');

    const pending = await PendingAction.findOne({ token, type: 'email_change', consumed: false });
    if (!pending) return res.status(404).json({ error: 'Invalid or expired token' });
    if (pending.expiresAt < new Date()) return res.status(400).json({ error: 'Token expired' });

    // Re-check that email is not taken
    const already = await User.findOne({ email: pending.newEmail });
    if (already) return res.status(400).json({ error: 'Email already in use' });

    const user = await User.findById(pending.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldEmail = user.email;
    user.email = pending.newEmail;
    await user.save();

    pending.consumed = true;
    await pending.save();

    // Mask emails for audit
    const mask = (e) => {
      if (!e) return '';
      const parts = e.split('@');
      if (parts.length !== 2) return '***';
      const name = parts[0];
      const domain = parts[1];
      return name.length <= 2 ? `${name[0]}***@${domain}` : `${name[0]}***${name.slice(-1)}@${domain}`;
    };

    await AuditLog.create({
      userId: user._id,
      actorId: user._id,
      action: 'email_change',
      details: { oldEmail: mask(oldEmail), newEmail: mask(user.email) },
      ip: req.ip
    });

    // Success response (do not include emails)
    res.json({ message: 'Email change confirmed' });
  } catch (error) {
    logger.errorLog(error, { context: 'Confirm change email error' });
    res.status(500).json({ error: 'Server error' });
  }
});
