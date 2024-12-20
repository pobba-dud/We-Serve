const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // Import the database utility
const app = express();
require("dotenv").config();
const { Pool } = require('pg');

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

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
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
  



  // Fallback route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Redirects to homepage for undefined routes
});
// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.get('/users', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM users');
      res.json(result.rows); // Send the rows back as JSON
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
