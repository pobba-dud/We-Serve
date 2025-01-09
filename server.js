const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // Import the database utility
const app = express();
require("dotenv").config();
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');

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

const authenticateAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).send('Access denied. No token provided.');

    // Verify the token
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;

    // Check if the user is an admin in the database
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount === 0 || !result.rows[0].is_admin) {
      return res.status(403).send('Access denied. Admin privileges required.');
    }

    next(); // User is authenticated and an admin
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(403).send('Invalid token or access denied.');
  }
};


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Redirects
app.get('/index', (req, res) => {
    console.log('Redirecting /index.html to /');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    console.log('Redirecting /Dashboard.html to /');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/calendar', (req, res) => {
    console.log('Redirecting /Calendar.html to /');
    res.sendFile(path.join(__dirname, 'public', 'Calendar.html'));
});

app.get('/hours', (req, res) => {
    console.log('Redirecting /HourLog.html to /');
    res.sendFile(path.join(__dirname, 'public', 'hourLog.html'));
});
app.get('/discover', (req, res) => {
    console.log('Redirecting /DiscoverPage.html to /');
    res.sendFile(path.join(__dirname, 'public', 'DiscoverPage.html'));
});

app.get('/proof', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Proof.html'));
});

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Feedback.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'SignUp.html'));
});

app.get('/organizationEvent', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'organizationEvent.html'));
});
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});
app.get('/donation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Donation.html'));
});
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
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
    res.status(200).send("Success")
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
  
  app.get('/users', authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, name, email FROM users');
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).send('Error fetching users.');
    }
  });
  
  app.get('/3cx97UyqIrwW4CHPQZYU7igifpq', authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM users');
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching user data:', err);
      res.status(500).send('Error fetching user data.');
    }
  });
  
  



const bcrypt = require('bcrypt');

app.post('/registerJS', async (req, res) => {
    const { name, email, password, isAdmin } = req.body;
  
    try {
      // Check if the email already exists
      const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (userExists.rowCount > 0) {
        return res.status(400).send('Email already exists.');
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the user into the database
      await pool.query(
        'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4)',
        [name, email, hashedPassword, isAdmin || false] // Default to false if isAdmin is not provided
      );
  
      res.status(201).send('User registered successfully.');
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).send('Error registering user.');
    }
  });
  

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; // Replace with a secure key in a real app

app.post('/loginJS', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rowCount === 0) {
      return res.status(401).send('Invalid credentials.');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Invalid credentials.');
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    // Send token as a cookie
    res.cookie('auth_token', token, { httpOnly: true }).send('Login successful.');
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Error logging in.');
  }
});





  // Fallback route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Redirects to homepage for undefined routes
});
// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
