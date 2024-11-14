const express = require('express');
const app = express();

// Serve static files
app.use(express.static('public'));

// Set up a basic route for your homepage
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Make the app listen on the port provided by Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
