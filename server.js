const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware to parse incoming form and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database connection configuration
// When deploying to AWS, DB_HOST will be your RDS endpoint
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'movie_db'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.warn('Database connection warning (will connect once RDS/local MySQL is live):', err.message);
    } else {
        console.log('Connected successfully to the database.');
    }
});

// 1. Serve the Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. CREATE Booking (Write Operation)
app.post('/book', (req, res) => {
    const { movie_title, quantity } = req.body;
    const query = 'INSERT INTO bookings (movie_title, ticket_quantity) VALUES (?, ?)';
    
    db.query(query, [movie_title || 'Suzume', quantity || 1], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving booking.');
        }
        res.send(`<h1>Booking Confirmed!</h1><p>Reserved ${quantity || 1} ticket(s) for ${movie_title || 'Suzume'}.</p><a href="/">Back to Home</a>`);
    });
});

// 3. UPDATE User Profile (CRUD: Update)
app.post('/update-profile', (req, res) => {
    const { full_name, email } = req.body;
    const query = 'INSERT INTO users (full_name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE full_name = ?';
    
    db.query(query, [full_name, email, full_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating profile.');
        }
        res.send(`<h1>Profile Updated!</h1><p>Saved details for ${full_name} (${email}).</p><a href="/">Back to Home</a>`);
    });
});

// 4. DELETE User Profile (CRUD: Delete)
app.post('/delete-profile', (req, res) => {
    const { email } = req.body;
    const query = 'DELETE FROM users WHERE email = ?';
    
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting profile.');
        }
        res.send(`<h1>Profile Deleted</h1><p>Account associated with ${email} has been removed.</p><a href="/">Back to Home</a>`);
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});