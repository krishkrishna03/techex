# Academic Management System

A comprehensive multi-level academic management system built with React, Node.js, Express, and MongoDB. The system supports role-based access control for Master Admins, College Admins, Faculty, and Students.

## Features

### Role-Based Access Control
- **Master Admin**: Manage colleges system-wide
- **College Admin**: Manage faculty and students within their college
- **Faculty**: Access college dashboard and profile management
- **Student**: Access college dashboard and profile management

### Core Functionality
- Automatic credential generation and email delivery
- Role-specific dashboards with relevant data
- User management with status tracking
- Profile management and password reset
- Login status monitoring
- Responsive design for all devices

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based route protection
- Email verification for password resets
- Rate limiting and security headers

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Lucide React** for icons
- Context API for state management
- Custom hooks and components

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email services
- **Helmet** for security headers
- **Rate limiting** for API protection

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Gmail account (for email services)

### Installation

1. **Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

2. **Configure Environment Variables**

Create `server/.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/academic_management

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

3. **Setup MongoDB**
- Install MongoDB locally or create a MongoDB Atlas cluster
- Update the `MONGODB_URI` in the `.env` file

4. **Configure Email Service**
- Use a Gmail account with App Password enabled
- Update `EMAIL_USER` and `EMAIL_PASS` in the `.env` file

### Running the Application

#### Development Mode (Both frontend and backend)
```bash
npm run full-dev
```

#### Or run separately:

**Backend Only:**
```bash
npm run server
# Server runs on http://localhost:5000
```

**Frontend Only:**
```bash
npm run dev  
# Frontend runs on http://localhost:3000
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start backend
npm run start-server
```

## Default Login Credentials

The system automatically creates a Master Admin account:

- **Email**: admin@academic.com
- **Password**: admin123

> **Important**: Change the default password immediately after first login.

## System Workflow

### 1. Master Admin Setup
1. Login with default credentials
2. Create college accounts with basic information
3. System automatically generates login credentials for College Admins
4. Credentials are sent via email to the college email address

### 2. College Admin Setup
1. College Admin receives login credentials via email
2. Login to access college dashboard
3. Create faculty and student accounts
4. System generates and emails credentials to each user

### 3. Faculty/Student Access
1. Receive login credentials via email
2. Login to access college-specific dashboard
3. Update profile information
4. View college information and colleagues

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Master Admin
- `POST /api/admin/colleges` - Create college
- `GET /api/admin/colleges` - Get all colleges
- `GET /api/admin/stats` - Get system statistics
- `PUT /api/admin/colleges/:id/toggle-status` - Toggle college status

### College Management
- `POST /api/college/users` - Create faculty/student
- `GET /api/college/users/:role` - Get users by role
- `GET /api/college/dashboard` - Get dashboard data
- `PUT /api/college/users/:id` - Update user
- `PUT /api/college/users/:id/toggle-status` - Toggle user status

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (master_admin, college_admin, faculty, student),
  collegeId: ObjectId,
  idNumber: String,
  branch: String,
  batch: String,
  section: String,
  phoneNumber: String,
  lastLogin: Date,
  hasLoggedIn: Boolean,
  isActive: Boolean
}
```

### Colleges Collection
```javascript
{
  name: String,
  code: String (unique),
  email: String (unique),
  address: String,
  adminId: ObjectId,
  totalFaculty: Number,
  totalStudents: Number,
  isActive: Boolean
}
```

## Email Templates

The system includes professional email templates for:
- Login credential delivery
- Password reset requests
- Account status notifications

## Security Features

- **Password Hashing**: Using bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **Role-based Access**: Strict permission checking
- **CORS Configuration**: Secure cross-origin requests

## Responsive Design

The application is fully responsive with breakpoints for:
- Mobile devices (< 768px)
- Tablets (768px - 1024px)
- Desktop (> 1024px)

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use secure JWT secrets
3. Configure production database
4. Set up SSL certificates
5. Configure proper CORS origins

### Build Process
```bash
npm run build
npm run start-server
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Email Not Sending**
   - Verify Gmail App Password
   - Check email configuration in `.env`

3. **Frontend Not Loading**
   - Ensure backend is running on port 5000
   - Check API URL configuration

4. **Login Issues**
   - Verify database connection
   - Check if master admin was created
   - Clear browser cache/localStorage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Version History

- **v1.0.0** - Initial release with full functionality
- Role-based authentication system
- Email integration
- Responsive UI design
- Complete CRUD operations
- Security implementations