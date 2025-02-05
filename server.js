const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
require("dotenv").config();
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isEmpty } = require('lodash');
const crypto = require('crypto');
const SECRET_KEY = process.env.SECRET_KEY;
const sanitizeHtml = require('sanitize-html');
const csrf = require('csurf'); 
const rateLimit = require('express-rate-limit');
const Email = process.env.EMAIL;
const Password = process.env.PASSWORD;

if (!SECRET_KEY) {
  throw new Error("Environment variable SECRET_KEY must be set.");
}
const csrfProtection = csrf({ cookie: true }); 
// Use cookie-parser middleware
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  message: 'Too many requests from this IP, please try again later.',
  headers: true, // Send rate limit info in the response headers
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Heroku provides this variable automatically
  ssl: {
    rejectUnauthorized: false, // Required for Heroku-managed databases
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params), // For running queries
};

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define the authenticate middleware

// Middleware to check if the user is authenticated 
const authenticate = (req, res, next) => {
  const token = req.cookies.auth_token; // Use consistent naming
  if (!token) {
    return res.redirect('/login'); // Redirect if no token
  }

  try {
    const user = jwt.verify(token, SECRET_KEY); // Validate token
    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error('Invalid token:', err);
    return res.redirect('/login'); // Handle token errors
  }
};

const checkAuthentication = (req, res, next) => {
  const token = req.cookies.auth_token; // Get token from cookie

  if (!token) {
    return res.redirect('/login'); // Redirect to login if no token
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Attach user data to the request
    next();
  } catch (err) {
    return res.redirect('/login'); // Redirect to login if token is invalid or expired
  }
};


// Middleware to check if the user is part of an organization
async function checkIsOrg(req, res, next) {
  const token = req.cookies.auth_token; // Get the token from the cookie

  if (!token) {
    return res.redirect('/'); // Handle token errors
    }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, SECRET_KEY); // Replace 'SECRET_KEY' with your actual key
    
    // Fetch user data from the database using the decoded email
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rowCount === 0) {
      return res.redirect('/'); // Handle token errors
      }

    const user = result.rows[0];

    // Check if the user is part of an organization
    if (!user.isorg) {
      return res.redirect('/'); // Handle token errors
    }

    // Attach user info to the request
    req.user = user;

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Error verifying token or fetching user from DB:', error);
    return res.redirect('/'); // Handle token errors
    }
}

async function checkAdmin(req, res, next) {
  const token = req.cookies.auth_token; // Get the token from the cookie

  if (!token) {
    return res.redirect('/'); // Handle token errors
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, SECRET_KEY); // Replace 'SECRET_KEY' with your actual key

    // Fetch user data from the database using the decoded user ID
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

    if (result.rowCount === 0) {
      return res.redirect('/'); // Handle token errors
    }

    const user = result.rows[0];

    // Check if the user is an admin
    if (!user.isadmin) {
      return res.redirect('/'); // Handle non-admin users
    }

    // Attach user info to the request
    req.user = user;

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Error verifying token or fetching user from DB:', error);
    return res.redirect('/'); // Handle token errors
  }
}




app.use((req, res, next) => {
  if (req.url.match(/\.html$/)) {
    return res.redirect('/');
    }
  next(); // Allow non-.html requests to proceed
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));



// Redirects
app.get('/index',limiter, (req, res) => {
    console.log('Redirecting /index.html to /');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard',limiter, checkAuthentication, (req, res) => {
    console.log('Redirecting /Dashboard.html to /');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/calendar',limiter, checkAuthentication, (req, res) => {
    console.log('Redirecting /Calendar.html to /');
    res.sendFile(path.join(__dirname, 'public', 'Calendar.html'));
});

app.get('/hours',limiter, checkAuthentication, (req, res) => {
    console.log('Redirecting /HourLog.html to /');
    res.sendFile(path.join(__dirname, 'public', 'hourLog.html'));
});
app.get('/discover',limiter, checkAuthentication, (req, res) => {
    console.log('Redirecting /DiscoverPage.html to /');
    res.sendFile(path.join(__dirname, 'public', 'DiscoverPage.html'));
});

app.get('/proof',limiter, checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Proof.html'));
});

app.get('/feedback',limiter,  (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Feedback.html'));
});

app.get('/account',limiter, checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/signup',limiter,  (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'SignUp.html'));
});

app.get('/organizationEvent',limiter,  checkIsOrg, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'organizationEvent.html'));
});
app.get('/test',limiter, checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});
app.get('/donation',limiter,  (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Donation.html'));
});
app.get('/login',limiter,  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/settings',limiter, checkAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Settings.html'));
});
app.get('/devHub',limiter, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'devHub.html'));
});
app.get('/Calendartest',limiter, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Calendartest.html'));
});
app.get('/template',limiter, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'template.html'));
});
app.get('/test',limiter, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});
app.get('/RemakeCalendar',limiter, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'RemakeCalendar.html'));
});
app.get('/askew',limiter,(req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'Askew.html'));
});
app.get('/brent',limiter,(req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'brent.html'));
  });
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server Error');
});
// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail)
  auth: {
      user: 'Email', // Your email
      pass: 'Password' // Your email password or app password
  }
});

// Route to handle form submission
const emailRateLimits = {}; // Key: email, Value: timestamp of the last request
app.post('/send-feedback', (req, res) => {
  const { email, name, feedback } = req.body;

  // Ensure all required fields are provided
  if (!email || !name || !feedback) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Get the current timestamp
  const currentTime = Date.now();

  // Check if the email exists in the rate-limiting object
  if (emailRateLimits[email] && currentTime - emailRateLimits[email] < 10 * 1000) {
    return res.status(429).json({ error: 'You can only send feedback once every 10 seconds.' });
  }

  // Update the timestamp for this email
  emailRateLimits[email] = currentTime;

  // Proceed to send the feedback email
  const mailOptions = {
    from: '"We-Serve" <your-email@we-serve.net>',
    to: 'ajbd47@gmail.com', // Your email where you want to receive feedback
    subject: `(WeServe) Feedback from ${name}`,
    text: `You have received feedback from ${name}, and their feedback is:\n"${feedback}"`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email. Please try again later.' });
    }
    res.status(200).json({ message: 'Sent successfully.' });
  });
});

const forgotPasswordRateLimits = {}; // To track requests for forgot-password
const resendVerificationRateLimits = {}; // To track requests for resend-verification

// Rate limit duration in milliseconds (10 seconds)
const RATE_LIMIT_DURATION = 10 * 1000;
function isRateLimited(email, rateLimits) {
  const currentTime = Date.now();

  if (rateLimits[email] && currentTime - rateLimits[email] < RATE_LIMIT_DURATION) {
    console.log(`Rate limit hit for ${email}. Time left: ${RATE_LIMIT_DURATION - (currentTime - rateLimits[email])}ms`);
    return true;
  }

  // Update the timestamp for this email
  rateLimits[email] = currentTime;
  console.log(`Rate limit set for ${email} at ${new Date(currentTime).toISOString()}`);
  return false;
}

setInterval(() => {
  const currentTime = Date.now();

  // Cleanup forgot-password rate limits
  for (const email in forgotPasswordRateLimits) {
    if (currentTime - forgotPasswordRateLimits[email] > 10 * 1000) {
      delete forgotPasswordRateLimits[email];
    }
  }

  // Cleanup resend-verification rate limits
  for (const email in resendVerificationRateLimits) {
    if (currentTime - resendVerificationRateLimits[email] > 10 * 1000) {
      delete resendVerificationRateLimits[email];
    }
  }

  // Cleanup email-related rate limits
  for (const email in emailRateLimits) {
    if (currentTime - emailRateLimits[email] > 10 * 1000) {
      delete emailRateLimits[email];
    }
  }

}, 60 * 1000);  // Cleanup every minute

  
app.post('/registerJS', limiter, csrfProtection, async (req, res) => {
    const { firstname, lastname, gender, birthday, email, phonenumber, password, isorg, org_name } = req.body;
  
    try {
      // Check if the email already exists
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      const phoneCheck = await pool.query('SELECT * FROM users WHERE phonenumber = $1', [phonenumber]);
      if(phonenumber!=""){
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Phone Number is already in use' });
      }
    }
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
      }

      const today = new Date();
    const userBirthday = new Date(birthday);

      if (isNaN(userBirthday)) {
        return res.status(400).json({ message: 'Invalid birthday format. Please use YYYY-MM-DD.' });
      }
  
      const ageInMilliseconds = today - userBirthday;
      const ageInYears = ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000);
  
      if (ageInYears < 13) {
        return res.status(400).json({ message: 'You must be at least 13 years old to register.' });
      }
  
      if (ageInYears > 100) {
        return res.status(400).json({ message: 'You must be younger than 100 years old to register.' });
      }
  
    
      // Generate a hashed password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Generate a unique verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1-hour expiration
  
      // Insert user data into the database
      const result = await pool.query(
        `INSERT INTO users (firstname, lastname, gender, birthday, email, phonenumber, password, isorg, org_name, verified, verification_token, verification_token_expires) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [firstname, lastname, gender, birthday, email.toLowerCase(), phonenumber, hashedPassword, isorg, org_name, false, verificationToken, verificationTokenExpires]
      );
      
      // Send a verification email
      
      const verificationLink = `https://www.we-serve.net/verify-email?token=${verificationToken}`;
      const sanitizedFirstname = sanitizeHtml(firstname, { allowedTags: [], allowedAttributes: {} });
      const sanitizedVerificationLink = encodeURI(verificationLink);
      await transporter.sendMail({
        from: '"We-Serve" <your-email@we-serve.net>',
        to: email,
        subject: 'Email Verification - We-Serve',
        text: `Hello ${sanitizedFirstname},\n\nThank you for registering with We-Serve. Please verify your email by clicking the link below:\n${sanitizedVerificationLink}\n\nIf you did not create an account, please ignore this email.\n\nBest regards,\nWe-Serve Team`,
        html: `
            <p>Hello ${sanitizedFirstname},</p>
            <p>Thank you for registering with We-Serve. Please verify your email by clicking the link below:</p>
            <p><a href="${sanitizedVerificationLink}" style="color: #007BFF; text-decoration: none;">Verify Email</a></p>
            <p>If you did not create an account, please ignore this email.</p>
            <p>Best regards,<br>We-Serve Team</p>
        `,
    });
  
      res.status(201).json({ message: 'User registered successfully. Please check your email for verification.' });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Error registering user.' });
    }
  });
  
  // Verification endpoint
  app.get('/verify-email',limiter,  async (req, res) => {
    const token = req.query.token;  // Get the token from query string
  
    if (!token) {
      console.log('No token provided');
      return res.status(400).send('Token not provided');  // Return a 400 error if no token is found
    }
  
    console.log('Received token:', token); // For debugging purposes
  
    try {
      const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
  
      if (result.rowCount === 0) {
        return res.status(400).send('Invalid or expired token');
      }
  
      const user = result.rows[0];
  
      // Check if the token has expired
      const currentTime = new Date();
      if (new Date(user.verification_token_expires) < currentTime) {
        return res.status(400).send('Token has expired');
      }
  
      // Update the user's verified status
      await pool.query('UPDATE users SET verified = true WHERE email = $1', [user.email.toLowerCase()]);
  
      // Send a success response
      res.send('Account successfully verified. You can now log in.');
  
    } catch (err) {
      console.error('Error verifying email:', err);
      res.status(500).send('Internal server error');
    }
  });
  
  
  
  
  const loginAttempts = {};

app.post('/loginJS', limiter, async (req, res) => {
  const { email, password } = req.body;

  // Check if the user has made a request in the last 5 seconds
  const now = Date.now();
  if (loginAttempts[email] && now - loginAttempts[email] < 8000) {
    return res.status(429).json({ message: 'Too many login attempts. Please wait a moment.' });
  }

  // Record the time of this attempt
  loginAttempts[email] = now;

  // Check if email and password are provided
  if (!email.toLowerCase() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Query the database for the user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    // If user doesn't exist, return a 401 response with a message
    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password is incorrect, return a 401 response with a message
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // If the user is not verified, resend the verification email
    if (!user.verified) {
      console.log('User is not verified:', email);

      // Check if the user already has a verification token
      if (user.verification_token && new Date(user.verification_token_expires) > new Date()) {
        // Resend the email with the existing token
        const verificationLink = `https://www.we-serve.net/verify-email?token=${user.verification_token}`;

        // Send the verification email
        await sendVerificationEmail(user.email.toLowerCase(), verificationLink);

        return res.status(400).json({ message: 'Account not verified. A verification link has been sent to your email. If you don\'t see it, check your spam folder.' });
      } else {
        // If no valid token exists, generate a new token and set expiration
        const crypto = require('crypto');
        const newToken = crypto.randomBytes(32).toString('hex');
        const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration

        // Update the database with the new token and expiration time
        await pool.query(
          'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE email = $3',
          [newToken, expirationDate, user.email]
        );

        // Send the new verification email with the updated token
        const verificationLink = `https://we-serve.net/verify-email?token=${newToken}`;
        await sendVerificationEmail(user.email, verificationLink);

        return res.status(400).json({ message: 'Account not verified. A new verification link has been sent to your email.' });
      }
    }

    // If the user is verified, generate a JWT token for login
    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });

    // Send a successful login response
    return res.status(200).json({ message: 'Login successful.' });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

  
  
  
  app.post('/profileJS',limiter, authenticate, async (req, res) => {
    try {
      const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (user.rowCount === 0) {
        return res.status(404).send('User not found');
      }
      res.json(user.rows[0]); // Send user data
    } catch (err) {
      console.error('Error fetching user data:', err);
      res.status(500).send('Server error');
    }
  });

  app.post('/logout',limiter, (req, res) => {
    res.clearCookie('auth_token', { httpOnly: true,sameSite: 'Strict'});
    res.redirect("/login")
  });

  app.post('/api/events',limiter, async (req, res) => {
    try {
        const { name, event_date, time_range, address, description, org_name } = req.body;

        // Validate input fields
        if (!name || !event_date || !time_range || !address || !description || !org_name) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate time range
        const [start_time, end_time] = time_range.split('-');
        if (!start_time || !end_time) {
            return res.status(400).json({ message: 'Invalid time range format. Use "HH:MM-HH:MM".' });
        }

        // Insert event into the database
        const result = await pool.query(
            `INSERT INTO events (name, description, event_date, start_time, end_time, address, org_name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, description, event_date, start_time.trim(), end_time.trim(), address, org_name]
        );

        res.status(201).json({ message: 'Event created successfully', event: result.rows[0] });
    } catch (err) {
        console.error('Error creating event:', err);

        // Return a meaningful error message to the client
        res.status(500).json({ message: 'Failed to create event. Please try again later.' });
    }
});

  app.post('/updateProfile',limiter, authenticate, async (req, res) => {
    try {
      const userId = req.user.id; // Get user ID from the authenticated user
      const { name,last, email, gender, phonenumber } = req.body; // Extract incoming fields

    
      // Retrieve the existing user data
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const existingData = result.rows[0];
  
      // Merge provided data with existing data
      const updatedData = {
        firstname: name || existingData.firstname,
        lastname: last || existingData.lastname,
        email: email || existingData.email,
        gender: gender || existingData.gender,
        phonenumber: phonenumber || existingData.phonenumber,
      };
  
      // Update the database with the merged data
      const updateQuery = `
        UPDATE users
        SET firstname = $1, lastname = $2, email = $3, gender = $4, phonenumber = $5
      WHERE id = $6
        RETURNING *;
      `;
      const updateResult = await pool.query(updateQuery, [
        updatedData.firstname,
        updatedData.lastname,
        updatedData.email,
        updatedData.gender,
        updatedData.phonenumber,
        userId,
      ]);
  
      // Respond with the updated user data
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: updateResult.rows[0],
      });
    } catch (error) {
      console.error('Error updating profile:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  });
  app.post('/change-password',limiter, authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    try {
        const userId = req.user.id; // Assumes `authenticate` middleware attaches user ID
        const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const hashedPassword = userResult.rows[0].password;

        // Verify the current password
        const isPasswordValid = await bcrypt.compare(currentPassword, hashedPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        // Hash the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHashedPassword, userId]);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


app.post('/resend-verification',limiter, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (isRateLimited(email, resendVerificationRateLimits)) {
    return res.status(429).json({ error: 'Too many requests. Please wait 10 seconds before trying again.' });
  }

  pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User with this email does not exist.' });
      }

      const user = result.rows[0];

      if (user.verified) {
        return res.status(400).json({ message: 'User is already verified.' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 3600 * 1000).toISOString();

      return pool.query(
        'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE email = $3',
        [verificationToken, tokenExpires, email.toLowerCase()]
      ).then(() => {
        const verificationLink = `https://www.we-serve.net/verify-email?token=${verificationToken}`;
        return transporter.sendMail({
          from: '"We-Serve" <your-email@we-serve.net>',
          to: email,
          subject: 'Email Verification - We-Serve',
          text: `Hello,\n\nThank you for registering with We-Serve. Please verify your email by clicking the link below:\n${verificationLink}\n\nIf you did not create an account, please ignore this email.\n\nBest regards,\nWe-Serve Team`,
          html: `
              <p>Hello,</p>
              <p>Thank you for registering with We-Serve. Please verify your email by clicking the link below:</p>
              <p><a href="${verificationLink}" style="color: #007BFF; text-decoration: none;">Verify Email</a></p>
              <p>If you did not create an account, please ignore this email.</p>
              <p>Best regards,<br>We-Serve Team</p>
          `,
      });
      });
    })
    .then(() => {
      console.log(`Verification email sent successfully to ${email}`);
      res.status(200).json({ message: 'Verification email sent successfully.' });
    })
    .catch((error) => {
      console.error('Error handling resend verification:', error);
      res.status(500).json({ message: 'Error processing request.' });
    });
});

  async function sendVerificationEmail(email, verificationLink) {
    const mailOptions = {
      from: '"We-Serve" <your-email@we-serve.net>',
      to: email,
      subject: 'Email Verification - We-Serve',
      text: `Hello,\n\nThank you for registering with We-Serve. Please verify your email by clicking the link below:\n${verificationLink}\n\nIf you did not create an account, please ignore this email.\n\nBest regards,\nWe-Serve Team`,
      html: `
          <p>Hello,</p>
          <p>Thank you for registering with We-Serve. Please verify your email by clicking the link below:</p>
          <p><a href="${verificationLink}" style="color: #007BFF; text-decoration: none;">Verify Email</a></p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>We-Serve Team</p>
      `,
  };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully.');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending email.');
    }
  }
    
  app.post('/forgot-password',limiter, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (isRateLimited(email, forgotPasswordRateLimits)) {
    return res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
  }

  // Proceed with forgot password logic
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date(Date.now() + 3600 * 1000).toISOString();

  pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
    [resetToken, tokenExpires, email.toLowerCase()]
  )
    .then(() => {
      const resetLink = `https://www.we-serve.net/reset-password?token=${resetToken}`;
      return transporter.sendMail({
        from: '"We-Serve" <your-email@we-serve.net>',
        to: email,
        subject: 'Password Reset Request - We-Serve',
        text: `Hello,\n\nYou have requested to reset your password. Please use the link below to proceed:\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nWe-Serve Team`,
        html: `
            <p>Hello,</p>
            <p>You have requested to reset your password. Please click the link below to proceed:</p>
            <p><a href="${resetLink}" style="color: #007BFF; text-decoration: none;">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best regards,<br>We-Serve Team</p>
        `,
    });
    })
    .then(() => {
      res.status(200).json({ message: 'Password reset link sent successfully.' });
    })
    .catch((error) => {
      console.error('Error handling forgot password:', error);
      res.status(500).json({ message: 'Error processing request.' });
    });
});

  
  app.post('/reset-passwordJS',limiter, async (req, res) => {
    const { token, newPassword } = req.body;

    try {
      const user = await pool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
        [token]
      );
  
      if (user.rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token." });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
        [hashedPassword, user.rows[0].id]
      );
  
      res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Error processing request." });
    }
  });
  
  app.get('/reset-password',limiter, (req, res) => {
  const { token } = req.query;

  // Check if the token is present in the URL
  if (!token) {
    return res.status(400).send('Invalid or missing reset token.');
  }

  // Serve the reset password HTML page
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});



  // Fallback route
app.get('*',limiter, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Redirects to homepage for undefined routes
});
// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
