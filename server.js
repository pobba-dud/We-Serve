const express = require('express');
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
const SECRET_KEY = 'PuclYnXXSGKKCsxPOsrFYO4dx6yx'; // Replace with a secure key in a real app

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
  const token = req.cookies.auth_token; // Ensure you have the `cookie-parser` middleware
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user; // Attach user data to the request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;


function checkAdmin(req, res, next) {
  if (req.user && req.user.isadmin === 1) {
    next();
  } else {
    res.status(403).send('Access denied. Admins only.');
  }
}

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
    const { firstname, lastname, gender, birthday, email, phonenumber, password, isadmin = false, isorg } = req.body;

  
    // Validate input data (basic checks, feel free to extend it)
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        const phoneCheck = await pool.query('SELECT * FROM users WHERE phonenumber = $1', [phonenumber]);
        if (phonenumber!=null){
        if (phoneCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Phone number is already in use' });
        }
      }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert user into the database
      const result = await pool.query(
        'INSERT INTO users (firstname, lastname, gender, birthday, email, phonenumber, password, isadmin, isorg) ' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', 
        [firstname, lastname, gender, birthday, email, phonenumber, hashedPassword, isadmin, isorg]
      );
  
      console.log('Registration successful:', result.rows[0]); // Log success
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]

    }); }
   catch (err) {
    console.error('Error during registration:', error); // Log the error
    res.status(500).json({
      message: 'Error registering user.'
    });
    }
  });
  
    
  
  
  



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
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '168h' });
  
      // Send token as a cookie and respond with success
      res.cookie('auth_token', token, { httpOnly: true });
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
  




  // Fallback route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Redirects to homepage for undefined routes
});
// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
