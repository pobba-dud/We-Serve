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
const sanitizeHtml = require('sanitize-html');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const databaseUrl = process.env.DATABASE_URL;
const SECRET_KEY = process.env.SECRET_KEY;
const Email = process.env.EMAIL;
const Password = process.env.PASSWORD;

if (!SECRET_KEY) {
  throw new Error("Environment variable SECRET_KEY must be set.");
}
// Use cookie-parser middleware
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  message: 'Too many requests from this IP, please try again later.',
  headers: true, // Send rate limit info in the response headers
});
cron.schedule('0 0 * * *', async () => {
  await pool.query('DELETE FROM events WHERE event_date < NOW() - INTERVAL \'30 days\'');
  console.log('Old events deleted.');
});
cron.schedule('0 0 * * *', async () => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
    const currentYear = currentDate.getFullYear();

    // Query to fetch all users and their last logged time
    const { rows: users } = await pool.query(
      'SELECT id, last_logged FROM users'
    );

    for (const user of users) {
      const lastLoggedTime = new Date(user.last_logged);
      const lastLoggedMonth = lastLoggedTime.getMonth();
      const lastLoggedYear = lastLoggedTime.getFullYear();

      // Reset monthly hours if the month has changed
      if (currentMonth !== lastLoggedMonth) {
        await pool.query(
          'UPDATE users SET monthly_hours = 0 WHERE id = $1',
          [user.id]
        );
      }

      // Reset yearly hours if the year has changed
      if (currentYear !== lastLoggedYear) {
        await pool.query(
          'UPDATE users SET yearly_hours = 0 WHERE id = $1',
          [user.id]
        );
      }
    }

    console.log('Monthly and yearly hours reset for users if necessary.');
  } catch (err) {
    console.error('Error resetting monthly and yearly hours:', err);
  }
}, {
  scheduled: true,
  timezone: 'UTC' // Make sure the cron job runs in UTC time
});

// Schedule the cron job to run every Monday at midnight UTC
cron.schedule('0 0 * * 1', async () => {
  try {
    // Get the current timestamp
    const currentTimestamp = new Date();

    // Calculate the start of the current calendar week (Monday)
    const startOfCurrentWeek = new Date(currentTimestamp);
    startOfCurrentWeek.setDate(currentTimestamp.getDate() - currentTimestamp.getDay() + 1); // Set to Monday
    startOfCurrentWeek.setHours(0, 0, 0, 0); // Set to midnight on Monday

    // Fetch all users and their last logged times
    const { rows: users } = await pool.query('SELECT id, last_logged, weekly_streak FROM users');

    for (const user of users) {
      const { id, last_logged, weekly_streak } = user;
      
      let newWeeklyStreak = 1; // Default to 1 if no previous streak
      let resetStreak = false;

      if (last_logged) {
        // Convert the last logged time to a date object
        const lastLoggedDate = new Date(last_logged);

        // Calculate the start of the last logged week
        const startOfLastLoggedWeek = new Date(lastLoggedDate);
        startOfLastLoggedWeek.setDate(lastLoggedDate.getDate() - lastLoggedDate.getDay() + 1); // Set to Monday

        // If the last log was in the previous calendar week, increment streak
        if (startOfLastLoggedWeek.getTime() < startOfCurrentWeek.getTime()) {
          newWeeklyStreak = weeklyStreak + 1; // Increment streak for consecutive weeks
        } else {
          resetStreak = true; // Reset streak if the user didn't log last week
        }
      }

      // Update the user's weekly streak, resetting or incrementing it
      await pool.query(
        'UPDATE users SET weekly_streak = $1 WHERE id = $2',
        [resetStreak ? 1 : newWeeklyStreak, id]
      );
    }

    console.log('Weekly streaks updated for all users.');
  } catch (err) {
    console.error('Error updating weekly streaks:', err);
  }
});

const pool = new Pool({
  connectionString: databaseUrl, // Heroku provides this variable automatically
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
app.get('/index', limiter, (req, res) => {
  console.log('Redirecting /index.html to /');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', limiter, checkAuthentication, (req, res) => {
  console.log('Redirecting /Dashboard.html to /');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/calendar', limiter, checkAuthentication, (req, res) => {
  console.log('Redirecting /Calendar.html to /');
  res.sendFile(path.join(__dirname, 'public', 'Calendar.html'));
});

app.get('/hours', limiter, checkAuthentication, (req, res) => {
  console.log('Redirecting /HourLog.html to /');
  res.sendFile(path.join(__dirname, 'public', 'hourLog.html'));
});
app.get('/discover', limiter, checkAuthentication, (req, res) => {
  console.log('Redirecting /DiscoverPage.html to /');
  res.sendFile(path.join(__dirname, 'public', 'DiscoverPage.html'));
});

app.get('/proof', limiter, checkAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Proof.html'));
});

app.get('/feedback', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Feedback.html'));
});

app.get('/account', limiter, checkAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/signup', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'SignUp.html'));
});

app.get('/organizationEvent', limiter, checkIsOrg, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'organizationEvent.html'));
});
app.get('/donation', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Donation.html'));
});
app.get('/login', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/settings', limiter, checkAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Settings.html'));
});
app.get('/devHub', limiter, checkAdmin, (req, res) => {
  console.log(`Admin page accessed by user ID: ${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  res.sendFile(path.join(__dirname, 'public', 'devHub.html'));
});
app.get('/template', limiter, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'template.html'));
});
app.get('/askew', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Askew.html'));
});
app.get('/brent', limiter, (req, res) => {
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
    user: Email, // Your email
    pass: Password // Your email password or app password
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


app.post('/registerJS', limiter, async (req, res) => {
  const { firstname, lastname, gender, birthday, email, phonenumber, password, isorg, org_name } = req.body;

  try {
    // Check if the email already exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    const phoneCheck = await pool.query('SELECT * FROM users WHERE phonenumber = $1', [phonenumber]);
    if (phonenumber != "") {
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
app.get('/verify-email', limiter, async (req, res) => {
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
    res.cookie('auth_token', token, {
      httpOnly: true,
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




app.post('/profileJS', limiter, authenticate, async (req, res) => {
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

app.post('/logout', limiter, (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'Strict' });
  res.redirect("/login")
});

app.post('/updateProfile', limiter, authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from the authenticated user
    const { name, last, email, gender, phonenumber } = req.body; // Extract incoming fields


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
app.post('/change-password', limiter, authenticate, async (req, res) => {
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


app.post('/resend-verification', limiter, (req, res) => {
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

app.post('/forgot-password', limiter, (req, res) => {
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


app.post('/reset-passwordJS', limiter, async (req, res) => {
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

app.get('/reset-password', limiter, (req, res) => {
  const { token } = req.query;

  // Check if the token is present in the URL
  if (!token) {
    return res.status(400).send('Invalid or missing reset token.');
  }

  // Serve the reset password HTML page
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});



//api for events
app.post('/api/events', limiter, async (req, res) => {
  try {
    const { name, description, event_date, time_range, address, org_name } = req.body;

    if (!time_range || !time_range.includes(' - ')) {
      return res.status(400).json({ error: 'Invalid or missing time range format' });
    }

    const [start_time, end_time] = time_range.split(' - ');

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    // Check if event already exists before inserting
    const existingEvent = await pool.query(
      `SELECT * FROM events WHERE name = $1 AND event_date = $2 AND start_time = $3 AND address = $4`,
      [name, event_date, start_time, address]
    );

    if (existingEvent.rows.length > 0) {
      return res.status(400).json({ error: 'An event with the same name, date, time, and address already exists!' });
    }

    // If no duplicate, insert the new event
    await pool.query(
      `INSERT INTO events (name, description, event_date, start_time, end_time, address, org_name) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, description, event_date, start_time, end_time, address, org_name]
    );

    res.status(201).json({ message: 'Event added successfully' });

  } catch (err) {
    console.error('Error saving event:', err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});



// Fetch all events
app.get('/api/events/display', limiter, async (req, res) => {
  const result = await pool.query('SELECT * FROM events');
  res.json(result.rows);
});

// Fetch events for a specific user
app.get('/api/events/user/:userId',limiter, authenticate, async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch event IDs from user_events
    const userEventsResult = await pool.query(
      'SELECT event_id FROM user_events WHERE user_id = $1',
      [userId]
    );

    if (userEventsResult.rows.length === 0) {
      return res.json([]); // No events found for the user
    }

    // Fetch event details for the event IDs
    const eventIds = userEventsResult.rows.map(row => row.event_id);
    const eventsResult = await pool.query(
      'SELECT * FROM events WHERE id = ANY($1)',
      [eventIds]
    );

    res.json(eventsResult.rows);
  } catch (err) {
    console.error('Error fetching user events:', err);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});
// Join an event
app.post('/api/events/join', limiter, authenticate, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  try {
    await pool.query('INSERT INTO user_events (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);
    res.status(200).json({ message: 'Successfully joined the event!' });
  } catch (err) {
    console.error('Error joining event:', err);
    res.status(500).json({ message: 'Failed to join the event.' });
  }
});
// Fetch events joined by the user
app.get('/api/events/joined', limiter, authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(
    'SELECT events.* FROM events JOIN user_events ON events.id = user_events.event_id WHERE user_events.user_id = $1',
    [userId]
  );
  res.json(result.rows);
});

// Fetch events hosted by the organization
app.get('/api/events/organization', limiter, checkIsOrg, async (req, res) => {
  const orgName = req.user.org_name;
  const result = await pool.query('SELECT * FROM events WHERE org_name = $1', [orgName]);
  res.json(result.rows);
});

// Fetch participants for a specific event
app.get('/api/events/:eventId/participants', limiter, checkIsOrg, async (req, res) => {
  console.log("/api/events/:eventId/participants loaded")
  const eventId = req.params.eventId;
  const result = await pool.query(
    'SELECT users.id, users.firstname, users.lastname, users.email FROM users JOIN user_events ON users.id = user_events.user_id WHERE user_events.event_id = $1',
    [eventId]
  );
  res.json(result.rows);
});

// Log volunteer hours (organization-only)
app.post('/api/events/log-hours', limiter, checkIsOrg, async (req, res) => {
  const { eventId, userId, hours } = req.body;

  if (hours >= 24) {
    return res.status(400).json({ message: 'Hours cannot be greater than 24.' });
  }

  try {
    // Check if the user is still in the user_events table for this event
    const { rowCount } = await pool.query(
      'SELECT 1 FROM user_events WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (rowCount === 0) {
      return res.status(400).json({ message: 'User is not registered for this event.' });
    }

    // Get the current timestamp
    const currentTimestamp = new Date();

    // Fetch user's last_logged and weekly_streak
    const { rows: userResult } = await pool.query(
      'SELECT last_logged, weekly_streak FROM users WHERE id = $1',
      [userId]
    );

    let lastLoggedTime = userResult[0]?.last_logged;
    let weeklyStreak = userResult[0]?.weekly_streak || 0; // Default to 0 if NULL

    // If last_logged is NULL, treat it as a first-time log
    if (!lastLoggedTime) {
      lastLoggedTime = currentTimestamp; // Set it to now
      weeklyStreak = 1; // Start streak at 1
    }

    // Ensure monthly_hours and yearly_hours update properly
    await pool.query(
      `UPDATE users SET 
        monthly_hours = monthly_hours + $1, 
        yearly_hours = yearly_hours + $1, 
        hourstotal = hourstotal + $1, 
        last_logged = $2, 
        weekly_streak = $3 
      WHERE id = $4`,
      [hours, currentTimestamp, weeklyStreak, userId]
    );

    // Remove the user from the user_events table for this event
    await pool.query(
      'DELETE FROM user_events WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    res.status(200).json({ message: 'Hours logged successfully.' });
  } catch (err) {
    console.error('Error logging hours:', err);
    res.status(500).json({ message: 'Failed to log hours.' });
  }
});


app.get('/api/events/fetch-hours', authenticate,limiter, async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from JWT token

    // Fetch user hours from the database
    const result = await pool.query(
      'SELECT hourstotal, weekly_streak, monthly_hours, yearly_hours FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Return the fetched hours
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user hours:', error);
    res.status(500).json({ message: 'Failed to retrieve hours.' });
  }
});
// API endpoint to get event details by eventId
app.get('/api/events/:eventId',authenticate,limiter, async (req, res) => {
  const eventId = req.params.eventId;  // Get eventId from the URL parameter

  try {
    // Query to get event details by eventId
    const result = await pool.query(
      'SELECT * FROM events WHERE id = $1', [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Send the event details as JSON
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/events/leave',authenticate,limiter, async (req, res) => {
  const { eventId } = req.body;  // The event ID user wants to leave
  const userId = req.user.id;  // Assuming user ID is attached to the request, maybe from a JWT token

  if (!eventId || !userId) {
    return res.status(400).json({ message: 'Event ID and User ID are required' });
  }

  try {
    // Query to delete the user's participation in the event
    const query = 'DELETE FROM user_events WHERE user_id = $1 AND event_id = $2 RETURNING *';
    const values = [userId, eventId];

    const result = await pool.query(query, values);

    if (result.rowCount > 0) {
      // Successfully deleted the event
      res.status(200).json({ message: 'Successfully left the event' });
    } else {
      // No matching event found
      res.status(404).json({ message: 'Event not found or already left' });
    }
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({ message: 'An error occurred while leaving the event' });
  }
});



//dev api
// Fetch all users
app.get('/api/admin/users', limiter, checkAdmin, async (req, res) => {
  console.log(`Users loaded by:${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});

// Fetch all events
app.get('/api/admin/events', limiter, checkAdmin, async (req, res) => {
  console.log(`Events loaded by:${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  const result = await pool.query('SELECT * FROM events');
  res.json(result.rows);
});

// Delete a user
app.delete('/api/admin/users/:id', limiter, checkAdmin, async (req, res) => {
  console.log(`User ${req.params.id} deleted by:${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.status(200).json({ message: 'User deleted successfully.' });
});

// Delete an event
app.delete('/api/admin/events/:id', limiter, checkAdmin, async (req, res) => {
  console.log(`Event ${req.params.id} deleted by:${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.status(200).json({ message: 'Event deleted successfully.' });
});
// Clear all events (for testing)
app.delete('/api/admin/clear-events', limiter, checkAdmin, async (req, res) => {
  console.log(`all events deleted by:${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  await pool.query('DELETE FROM events');
  res.status(200).json({ message: 'All events cleared.' });
});

// Create a test event (for testing)
app.post('/api/admin/create-test-event', limiter, checkAdmin, async (req, res) => {
  console.log(`test event created by:${req.user.id} ${req.user.firstname} ${req.user.lastname}`);
  try {
    const currentDate = new Date();
    const startTime = currentDate.toISOString().split('T')[0] + ' ' + currentDate.toTimeString().split(' ')[0]; // Current time as HH:MM:SS
    const endTime = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
    const endTimeFormatted = endTime.toISOString().split('T')[1].split('.')[0]; // Format to HH:MM:SS

    const testEvent = {
      name: 'Test Event',
      event_date: currentDate.toISOString().split('T')[0], // Current date
      start_time: startTime, // Set start time to current time
      end_time: endTimeFormatted, // Set end time to 2 hours later
      address: '123 Test St',
      description: 'This is a test event.',
      org_name: 'Test Org',
    };

    console.log(testEvent);

    await pool.query(
      'INSERT INTO events (name, event_date, start_time, end_time, address, description, org_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testEvent.name, testEvent.event_date, testEvent.start_time, testEvent.end_time, testEvent.address, testEvent.description, testEvent.org_name]
    );
    res.status(201).json({ message: 'Test event created.' });
  } catch (err) {
    if (err.code === '23505') {  // PostgreSQL duplicate key error code
      return res.status(400).json({ error: 'An event with the same name, date, time, and address already exists!' });
    }
    console.error('Error saving event:', err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});
// Fallback route
app.get('*', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Redirects to homepage for undefined routes
});
// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
