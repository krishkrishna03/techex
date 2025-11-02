const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');

class EmailService {
  constructor() {
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const isSecure = emailPort === 465;
    const environment = process.env.NODE_ENV || 'development';

    logger.info('Initializing Email Service', {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: emailPort,
      secure: isSecure,
      environment,
      user: process.env.EMAIL_USER ? 'Configured' : 'Not configured'
    });

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: emailPort,
      secure: isSecure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      requireTLS: !isSecure,
      tls: {
        rejectUnauthorized: environment === 'production',
        minVersion: 'TLSv1.2'
      },
      debug: environment === 'development',
      logger: environment === 'development'
    });

    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (this.isConfigured) {
      this.verifyConnection();
    } else {
      logger.warn('Email service not configured - missing EMAIL_USER or EMAIL_PASS environment variables');
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('✓ Email service connection verified successfully');
    } catch (error) {
      logger.errorLog(error, {
        context: 'Email Service Connection Verification',
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT
      });
    }
  }

  async sendWithRetry(mailOptions, retries = this.maxRetries) {
    if (!this.isConfigured) {
      logger.warn('Email service not configured - skipping email send', {
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      return {
        success: false,
        error: 'Email service not configured',
        attempts: 0
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        logger.info('✓ Email sent successfully', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          attempt,
          messageId: info.messageId
        });
        return { success: true, attempt, messageId: info.messageId };
      } catch (error) {
        logger.errorLog(error, {
          context: 'Email send attempt',
          attempt,
          maxRetries: retries,
          to: mailOptions.to,
          subject: mailOptions.subject,
          errorCode: error.code,
          command: error.command
        });

        if (attempt < retries) {
          const delay = this.retryDelay * attempt;
          logger.info(`Retrying email send in ${delay}ms...`, {
            attempt: attempt + 1,
            maxRetries: retries
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          return {
            success: false,
            error: error.message,
            attempts: retries,
            errorCode: error.code
          };
        }
      }
    }
    return { success: false, error: 'Max retries exceeded', attempts: retries };
  }

  async sendLoginCredentials(userEmail, userName, password, role, collegeName = null) {
    logger.info('Sending login credentials email', {
      to: userEmail,
      role,
      collegeName
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.errorLog(new Error('Email configuration missing'), {
        context: 'Send Login Credentials'
      });
      return { success: false, error: 'Email not configured', email: userEmail, password, role };
    }

    const roleText = this.getRoleDisplayName(role);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Login Credentials - ${roleText} Account Created`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>Academic Management System</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Welcome, ${userName}!</h2>
            <p>Your ${roleText} account has been created successfully.</p>
            ${collegeName ? `<p><strong>College:</strong> ${collegeName}</p>` : ''}
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <h3>Login Credentials:</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">
              ⚠️ Please change your password after first login for security reasons.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login Now
              </a>
            </div>
          </div>
          <div style="background-color: #374151; color: white; text-align: center; padding: 10px;">
            <p>Academic Management System © 2025</p>
          </div>
        </div>
      `
    };

    const result = await this.sendWithRetry(mailOptions);

    if (result.success) {
      return { success: true };
    } else {
      logger.errorLog(new Error(result.error), {
        context: 'Send Login Credentials Email',
        to: userEmail,
        attempts: result.attempts
      });
      return {
        success: false,
        error: result.error,
        email: userEmail,
        password,
        role,
        collegeName
      };
    }
  }

  async sendPasswordReset(userEmail, userName, resetToken) {
    logger.info('Sending password reset email', { to: userEmail });
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Password Reset Request - Academic Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>Password Reset Request</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello, ${userName}!</h2>
            <p>You requested a password reset for your Academic Management System account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 10 minutes. If you didn't request this reset, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    const result = await this.sendWithRetry(mailOptions);

    if (result.success) {
      return { success: true };
    } else {
      logger.errorLog(new Error(result.error), {
        context: 'Send Password Reset Email',
        to: userEmail,
        attempts: result.attempts
      });
      return { success: false, error: result.error };
    }
  }

  getRoleDisplayName(role) {
    const roleNames = {
      master_admin: 'Master Administrator',
      college_admin: 'College Administrator',
      faculty: 'Faculty',
      student: 'Student'
    };
    return roleNames[role] || role;
  }

  async sendTestAssignmentNotification(collegeEmail, collegeAdminName, testName, collegeName, startDateTime, endDateTime) {
    logger.info('Sending test assignment notification', {
      to: collegeEmail,
      testName,
      collegeName
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: collegeEmail,
      subject: `New Test Assignment - ${testName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>Test Assignment Notification</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello, ${collegeAdminName}!</h2>
            <p>A new test has been assigned to your college: <strong>${collegeName}</strong></p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <h3>Test Details:</h3>
              <p><strong>Test Name:</strong> ${testName}</p>
              <p><strong>Start Date:</strong> ${new Date(startDateTime).toLocaleString()}</p>
              <p><strong>End Date:</strong> ${new Date(endDateTime).toLocaleString()}</p>
            </div>
            
            <p>Please log in to your dashboard to accept or reject this test assignment.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          <div style="background-color: #374151; color: white; text-align: center; padding: 10px;">
            <p>Academic Management System © 2025</p>
          </div>
        </div>
      `
    };

    const result = await this.sendWithRetry(mailOptions);

    if (result.success) {
      return { success: true };
    } else {
      logger.errorLog(new Error(result.error), {
        context: 'Send Test Assignment Email',
        to: collegeEmail,
        attempts: result.attempts
      });
      return { success: false, error: result.error };
    }
  }

  async sendTestAssignmentToStudent(studentEmail, studentName, testName, startDateTime, endDateTime, duration) {
    logger.info('Sending test assignment to student', {
      to: studentEmail,
      testName
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Test Assignment - ${testName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>Test Assignment</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello, ${studentName}!</h2>
            <p>You have been assigned a new test to complete.</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <h3>Test Details:</h3>
              <p><strong>Test Name:</strong> ${testName}</p>
              <p><strong>Duration:</strong> ${duration} minutes</p>
              <p><strong>Available From:</strong> ${new Date(startDateTime).toLocaleString()}</p>
              <p><strong>Available Until:</strong> ${new Date(endDateTime).toLocaleString()}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">
              ⚠️ Make sure you have a stable internet connection and sufficient time before starting the test.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Take Test
              </a>
            </div>
          </div>
          <div style="background-color: #374151; color: white; text-align: center; padding: 10px;">
            <p>Academic Management System © 2025</p>
          </div>
        </div>
      `
    };

    const result = await this.sendWithRetry(mailOptions);

    if (result.success) {
      return { success: true };
    } else {
      logger.errorLog(new Error(result.error), {
        context: 'Send Student Test Assignment Email',
        to: studentEmail,
        attempts: result.attempts
      });
      return { success: false, error: result.error };
    }
  }

  async sendNotificationEmail(userEmail, userName, title, message, type = 'general', priority = 'medium') {
    logger.info('Sending notification email', {
      to: userEmail,
      title,
      type,
      priority
    });
    
    const priorityColors = {
      low: '#10B981',
      medium: '#3B82F6', 
      high: '#EF4444'
    };
    
    const typeIcons = {
      general: '📢',
      urgent: '🚨',
      announcement: '📣',
      reminder: '⏰'
    };
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `${typeIcons[type] || '📢'} ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${priorityColors[priority]}; color: white; padding: 20px; text-align: center;">
            <h1>${typeIcons[type] || '📢'} Notification</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello, ${userName}!</h2>
            <div style="background-color: white; padding: 15px; border-left: 4px solid ${priorityColors[priority]}; margin: 20px 0;">
              <h3 style="margin-top: 0; color: ${priorityColors[priority]};">${title}</h3>
              <div style="line-height: 1.6; color: #374151;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} | 
                <strong>Priority:</strong> ${priority.charAt(0).toUpperCase() + priority.slice(1)}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: ${priorityColors[priority]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View in Dashboard
              </a>
            </div>
          </div>
          <div style="background-color: #374151; color: white; text-align: center; padding: 10px;">
            <p>Academic Management System © 2025</p>
          </div>
        </div>
      `
    };

    const result = await this.sendWithRetry(mailOptions);

    if (result.success) {
      return { success: true };
    } else {
      logger.errorLog(new Error(result.error), {
        context: 'Send Notification Email',
        to: userEmail,
        attempts: result.attempts
      });
      return { success: false, error: result.error };
    }
  }
}

module.exports = new EmailService();
