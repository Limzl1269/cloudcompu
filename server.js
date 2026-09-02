const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'movie_db'
});

db.connect((err) => {
    if (err) console.warn('Database warning:', err.message);
    else console.log('Connected successfully to the database.');
});

// Helper function to create beautiful confirmation pages
const styledResponse = (title, message) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white font-sans antialiased flex items-center justify-center h-screen">
    <div class="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-700">
        <h1 class="text-3xl font-bold text-purple-400 mb-4">${title}</h1>
        <p class="text-gray-300 mb-8 text-lg">${message}</p>
        <a href="/" class="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded font-bold transition duration-200">← Back to Cinema</a>
    </div>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/book', (req, res) => {
    const { movie_title, quantity, email } = req.body;
    
    // Generate a random 6-character alphanumeric ticket ID
    const ticket_id = 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    db.query('INSERT INTO bookings (ticket_id, email, movie_title, ticket_quantity) VALUES (?, ?, ?, ?)', 
    [ticket_id, email, movie_title, quantity], (err) => {
        if (err) return res.status(500).send(styledResponse('Error', 'Could not process your booking.'));
        
        res.send(styledResponse(
            '🎫 Booking Confirmed!', 
            `Thank you! Your receipt ID is <strong>${ticket_id}</strong>.<br><br>
             We have reserved <strong>${quantity}</strong> ticket(s) for <strong>${movie_title}</strong> under the email <strong>${email}</strong>.`
        ));
    });
});

app.post('/update-profile', (req, res) => {
    const { full_name, email, phone } = req.body;
    const query = 'INSERT INTO users (full_name, email, phone) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name = ?, phone = ?';
    
    db.query(query, [full_name, email, phone, full_name, phone], (err) => {
        if (err) return res.status(500).send(styledResponse('Error', 'Could not update profile.'));
        res.send(styledResponse('✅ Profile Saved!', `Details updated for <strong>${full_name}</strong>.<br><br>Email: ${email}<br>Phone: ${phone}`));
    });
});

app.post('/delete-profile', (req, res) => {
    const { email } = req.body;
    db.query('DELETE FROM users WHERE email = ?', [email], (err) => {
        if (err) return res.status(500).send(styledResponse('Error', 'Could not delete profile.'));
        res.send(styledResponse('🗑️ Account Deleted', `The profile associated with <strong>${email}</strong> has been removed.`));
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});