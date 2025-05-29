const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// In-memory user store (for demo, use DB in real app)
const users = [];

// In-memory plans store (for demo, use DB in real app)
const submittedPlans = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your_secret_key_here', // Change to secure secret
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Set EJS views folder and engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static assets (css, images, client js)
app.use(express.static(path.join(__dirname, 'public_html')));

// Middleware to protect authenticated routes
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// Home page with dynamic username and success message
app.get('/', (req, res) => {
  const username = req.session.userId || null;
  const successMessage = req.session.successMessage || null;
  delete req.session.successMessage;
  res.render('index', { username, successMessage });
});

// Search page
app.get('/search', (req, res) => {
  const username = req.session.userId || null;
  res.render('search', { username });
});

// Contact page
app.get('/contact', (req, res) => {
  const username = req.session.userId || null;
  res.render('contact', { username });
});

// Plan page (protected)
app.get('/plan', requireLogin, (req, res) => {
  const username = req.session.userId;
  res.render('plan', { username });
});

// Submit custom plan (protected)
app.post('/submit-custom', requireLogin, (req, res) => {
  const { name, email, preference, date, people, duration, budget, notes } = req.body;

  // Basic validation (optional)
  if (!name || !email || !preference) {
    return res.status(400).send('Name, email and preference are required.');
  }

  // Store plan in memory (replace with DB logic)
  submittedPlans.push({ name, email, preference, date, people, duration, budget, notes });

  res.redirect('/plan');
});

// API endpoint for submitted plans (protected)
app.get('/api/plans', requireLogin, (req, res) => {
  res.json(submittedPlans);
});

// Registration routes
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('register', { error: 'All fields are required.' });
  }

  if (users.find(u => u.username === username)) {
    return res.render('register', { error: 'Username already taken.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ username, passwordHash });
    req.session.userId = username;
    req.session.successMessage = 'Registration successful! Welcome.';
    res.redirect('/');
  } catch (err) {
    console.error('Hashing error:', err);
    res.render('register', { error: 'Internal server error.' });
  }
});

// Login routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).render('login', { error: 'Invalid username or password.' });
  }

  try {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).render('login', { error: 'Invalid username or password.' });
    }
    req.session.userId = username;
    req.session.successMessage = 'Congratulations! Login successful.';
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Internal server error.' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
