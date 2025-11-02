const mongoose = require('mongoose');
const logger = require('../middleware/logger');

const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB', {
      uri: process.env.MONGODB_URI ? 'URI provided' : 'URI missing'
    });
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('MongoDB Connected Successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
      port: conn.connection.port
    });
    
    // Create master admin if it doesn't exist
    await createMasterAdmin();
    
  } catch (error) {
    logger.errorLog(error, { context: 'Database Connection' });
    process.exit(1);
  }
};

const createMasterAdmin = async () => {
  try {
    logger.info('Checking for Master Admin user');
    
    const User = require('../models/User');
    
    const masterAdmin = await User.findOne({ role: 'master_admin' });
    
    if (!masterAdmin) {
      logger.info('Creating Master Admin user');
      
      const newMasterAdmin = new User({
        name: 'Master Administrator',
        email: 'carelinkdesk@gmail.com',
        password: 'admin123',
        role: 'master_admin'
      });
      
      await newMasterAdmin.save();
      
      logger.info('Master Admin Created Successfully', {
        email: 'carelinkdesk@gmail.com',
        defaultPassword: 'admin123'
      });
    } else {
      logger.info('Master Admin already exists', {
        email: masterAdmin.email,
        hasLoggedIn: masterAdmin.hasLoggedIn
      });
    }
  } catch (error) {
    logger.errorLog(error, { context: 'Master Admin Creation' });
  }
};

module.exports = connectDB;
