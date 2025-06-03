// index.js

const express = require('express')
const session = require('express-session')
const bcrypt = require('bcrypt')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const client = require('prom-client');

const app = express()
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');

const dbPath = path.join(__dirname, 'customdate.db');
const db     = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

// Immediately after opening the DB, ensure the tables exist:
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS custom_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      preference TEXT,
      date TEXT,
      people INTEGER,
      duration TEXT,
      budget TEXT,
      notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
});


// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Configure session handling
app.use(
  session({
    secret: 'replace_this_with_a_secure_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
  })
)

// Serve static files from public_html folder
app.use(express.static(path.join(__dirname, 'public_html')))

// Middleware to require login for certain routes
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login')
  }
  next()
}

// Health check endpoint for CI CD monitoring
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'UP' })
})

// Home page
app.get('/', (req, res) => {
  const username = req.session.userId || null
  const successMessage = req.session.successMessage || null
  delete req.session.successMessage
  res.render('index', { username, successMessage })
})

// Search page
app.get('/search', (req, res) => {
  res.render('search')
})

// Plan page (display submitted plans for logged in user)
app.get('/plan', requireLogin, (req, res) => {
  res.render('plan')
})

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact')
})

// Submit custom plan (only for logged in users)
app.post('/submit-custom', requireLogin, (req, res) => {
  const { preference, date, people, duration, budget, notes } = req.body

  // Get the current user’s database id
  db.get(
    `SELECT id FROM users WHERE username = ?`,
    [req.session.userId],
    (err, row) => {
      if (err) {
        console.error('Database error looking up user:', err)
        return res.status(500).send('Internal server error')
      }
      if (!row) {
        return res.status(401).send('User not found')
      }
      const userId = row.id

      // Insert the new custom plan into the table
      db.run(
        `
        INSERT INTO custom_plans
          (user_id, preference, date, people, duration, budget, notes)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)
        `,
        [userId, preference, date, people, duration, budget, notes],
        function (insertErr) {
          if (insertErr) {
            console.error('Database error inserting plan:', insertErr)
            return res.status(500).send('Internal server error')
          }
          return res.redirect('/plan')
        }
      )
    }
  )
})

// API endpoint to return submitted plans for the logged in user
app.get('/api/plans', requireLogin, (req, res) => {
  db.all(
    `
    SELECT
      cp.id,
      u.username AS name,
      cp.preference,
      cp.date,
      cp.people,
      cp.duration,
      cp.budget,
      cp.notes
    FROM custom_plans cp
    JOIN users u ON cp.user_id = u.id
    WHERE u.username = ?
    `,
    [req.session.userId],
    (err, rows) => {
      if (err) {
        console.error('Database error retrieving plans:', err)
        return res.status(500).json([])
      }
      return res.json(rows)
    }
  )
})

// Registration form page
app.get('/register', (req, res) => {
  res.render('register', { error: null })
})

// Handle registration form submission
app.post('/register', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.render('register', { error: 'All fields are required.' })
  }

  // Check if username already exists in database
  db.get(
    `SELECT id FROM users WHERE username = ?`,
    [username],
    async (err, row) => {
      if (err) {
        console.error('Database error checking username:', err)
        return res.render('register', { error: 'Internal server error.' })
      }
      if (row) {
        return res.render('register', { error: 'Username already taken.' })
      }

      // Hash password and insert new user
      try {
        const passwordHash = await bcrypt.hash(password, 10)
        db.run(
          `
          INSERT INTO users (username, passwordHash)
          VALUES (?, ?)
          `,
          [username, passwordHash],
          function (insertErr) {
            if (insertErr) {
              console.error('Database error inserting user:', insertErr)
              return res.render('register', { error: 'Internal server error.' })
            }
            req.session.userId = username
            req.session.successMessage = 'Registration successful! Welcome.'
            return res.redirect('/')
          }
        )
      } catch (hashErr) {
        console.error('Error hashing password:', hashErr)
        return res.render('register', { error: 'Internal server error.' })
      }
    }
  )
})

// Login form page
app.get('/login', (req, res) => {
  res.render('login', { error: null })
})

// Handle login form submission
app.post('/login', async (req, res) => {
  const { username, password } = req.body

  // Retrieve user from database by username
  db.get(
    `SELECT id, username, passwordHash FROM users WHERE username = ?`,
    [username],
    async (err, row) => {
      if (err) {
        console.error('Database error retrieving user:', err)
        return res.render('login', { error: 'Internal server error.' })
      }
      if (!row) {
        return res.render('login', { error: 'Invalid username or password.' })
      }

      // Compare submitted password with stored hash
      try {
        const match = await bcrypt.compare(password, row.passwordHash)
        if (!match) {
          return res.render('login', { error: 'Invalid username or password.' })
        }
        req.session.userId = username
        req.session.successMessage = 'Congratulations! Login successful.'
        return res.redirect('/')
      } catch (compareErr) {
        console.error('Error comparing passwords:', compareErr)
        return res.render('login', { error: 'Internal server error.' })
      }
    }
  )
})

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login')
  })
})

// Start server if run directly

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

// Export app for testing (Jest)
module.exports = app
