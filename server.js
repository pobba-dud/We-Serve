const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // Import the database utility
const app = express();
require("dotenv").config();
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isEmpty } = require('lodash');
const crypto = require('crypto');
const SECRET_KEY = process.env.SECRET_KEY || 'fallback_secret';

// Use cookie-parser middleware
app.use(cookieParser());

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [decoded.email.toLowerCase()]);
    
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
    
    // Fetch user data from the database using the decoded email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [decoded.email.toLowerCase()]);
    
    if (result.rowCount === 0) {
      return res.redirect('/'); // Handle token errors
      }

    const user = result.rows[0];

    // Check if the user is part of an organization
    if (!user.isadmin) {
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



app.use((req, res, next) => {
  if (req.url.match(/\.html$/)) {
    return res.redirect('/');
    }
  next(); // Allow non-.html requests to proceed
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));



// Redirects
app.get('/index', (req, res) => {
    console.log('Redirecting /index.html to /');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard',checkAuthentication, (req, res) => {
    console.log('Redirecting /Dashboard.html to /');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/calendar',checkAuthentication, (req, res) => {
    console.log('Redirecting /Calendar.html to /');
    res.sendFile(path.join(__dirname, 'public', 'Calendar.html'));
});

app.get('/hours',checkAuthentication, (req, res) => {
    console.log('Redirecting /HourLog.html to /');
    res.sendFile(path.join(__dirname, 'public', 'hourLog.html'));
});
app.get('/discover',checkAuthentication, (req, res) => {
    console.log('Redirecting /DiscoverPage.html to /');
    res.sendFile(path.join(__dirname, 'public', 'DiscoverPage.html'));
});

app.get('/proof',checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Proof.html'));
});

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Feedback.html'));
});

app.get('/account',checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'SignUp.html'));
});

app.get('/organizationEvent', checkIsOrg, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'organizationEvent.html'));
});
app.get('/test',checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});
app.get('/donation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Donation.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/settings',checkAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Settings.html'));
});
app.get('/devHub',checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'devHub.html'));
});
app.get('/Calendartest',checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Calendartest.html'));
});
app.get('/template',checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'template.html'));
});
app.get('/test',checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});
app.get('/RemakeCalendar',checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'RemakeCalendar.html'));
});
// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail)
  auth: {
      user: 'b89451436@gmail.com', // Your email
      pass: 'xlya jnqx mnqv tenv' // Your email password or app password
  }
});

// Route to handle form submission
app.post('/send-feedback', (req, res) => {
  const { name, email, feedback } = req.body;

  const mailOptions = {
      from: email,
      to: 'ajbd47@gmail.com', // Your email where you want to receive feedback
      subject: `(WeServe) Feedback from ${name}`,
      text: 'You have recieved feedback from '+ name + " and their feedback is: \n" + '"'+feedback+'"',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error); // Log the error
        return res.status(500).json({ error: 'Error sending email: ' + error.message }); // Send detailed error message
    }
    console.log('Email sent: ' + info.response);
    res.redirect('/');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
});


app.get('/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({
        message: 'Database connection successful!',
        serverTime: result.rows[0].now,
      });
    } catch (err) {
      console.error('Database connection error:', err);
      res.status(500).json({ error: 'Failed to connect to the database.' });
    }
  });
  
  app.get('/test-env', (req, res) => {
    res.json({
      message: 'Environment variables loaded!',
      databaseUrl: process.env.DATABASE_URL ? 'Loaded' : 'Not loaded',
    });
  });
  
  


  
  app.post('/registerJS', async (req, res) => {
    const { firstname, lastname, gender, birthday, email, phonenumber, password, isorg, org_name } = req.body;
  
    try {
      // Check if the email already exists
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' });
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
      await transporter.sendMail({
        from: '"We-Serve" <your-email@we-serve.net>',
        to: email,
        subject: 'Email Verification - We-Serve',
        text: `Hello ${firstname}, please verify your email by clicking the link below: ${verificationLink}`,
        html: `<p>Hello ${firstname},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">${verificationLink}</a>`,
      });
  
      res.status(201).json({ message: 'User registered successfully. Please check your email for verification.' });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Error registering user.' });
    }
  });
  
  // Verification endpoint
  app.get('/verify-email', async (req, res) => {
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
  
  
  
  
  
  
  app.post('/loginJS', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email.toLowerCase() || !password) {
      return res.status(400).send('Email and password are required.');
    }
  
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      
      if (result.rowCount === 0) {
        return res.status(401).send('Invalid credentials.');
      }
  
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).send('Invalid credentials.');
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
  
          return res.status(400).send('Account not verified. A verification link has been sent to your email. If you dont see it check your spam');
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
  
          return res.status(400).send('Account not verified. A new verification link has been sent to your email.');
        }
      }
  
      // If user is verified, continue with login
      const token = jwt.sign({ id: user.id, email: user.email.toLowerCase() }, SECRET_KEY, { expiresIn: '168h' });
      res.cookie('auth_token', token, { httpOnly: true, sameSite: 'Strict' });
      res.status(200).send('Login successful.');
  
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).send('Error logging in.');
    }
  });
  
  
  
  
  app.post('/profileJS', authenticate, async (req, res) => {
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

  app.post('/logout', (req, res) => {
    res.clearCookie('auth_token', { httpOnly: true,sameSite: 'Strict'});
    res.redirect("/login")
  });

  app.post('/api/events', async (req, res) => {
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

  app.post('/updateProfile', authenticate, async (req, res) => {
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
        lastname: last || existingData.lastnamem,
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

  app.post('/resend-verification', async (req, res) => {
    const { email } = req.body; // Get email from request body
  
    try {
      // Check if the user exists and is not verified
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      const user = result.rows[0];
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // If the user is already verified, return a message
      if (user.verified) {
        return res.status(400).json({ message: 'Your email is already verified.' });
      }
  
      // If the user has an active verification token, resend the verification email
      if (user.verification_token && new Date(user.verification_token_expires) > new Date()) {
        const verificationLink = `https://we-serve.net/verify-email?token=${user.verification_token}`;
        
        // Send the verification email with the existing token
        await sendVerificationEmail(email, verificationLink);
  
        return res.status(200).json({ message: 'Verification email resent.' });
      }
  
      // If no active token exists, generate a new one
      const crypto = require('crypto');
      const newToken = crypto.randomBytes(32).toString('hex');
      const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration
  
      // Update the database with the new token and expiration time
      await pool.query(
        'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE email = $3',
        [newToken, expirationDate, email]
      );
  
      const verificationLink = `https://we-serve.net/verify-email?token=${newToken}`;
      
      // Send the verification email with the new token
      await sendVerificationEmail(email, verificationLink);
  
      return res.status(200).json({ message: 'Verification email sent.' });
    } catch (error) {
      console.error('Error sending verification email:', error);
      return res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
  });
  async function sendVerificationEmail(email, verificationLink) {
      const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Email Verification for We Serve',
      text: `Please verify your email by clicking on the following link: ${verificationLink}`,
      html: `<p>Please verify your email by clicking on the following link:</p>
             <p><a href="${verificationLink}">${verificationLink}</a></p>`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully.');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending email.');
    }
  }
    
  
  


  // Fallback route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Redirects to homepage for undefined routes
});
// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
