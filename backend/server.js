// --- BACKEND API SERVER (Node.js/Express) ---
// This file connects the Frontend (index.html) to the MySQL Database.

const express = require('express');
const mysql = require('mysql2/promise'); 
// Removed 'cors' require to bypass persistent pathing issue

const app = express();
const port = 3000;

// Middleware setup
app.use(express.json()); 

// MANUAL CORS HEADER CONFIGURATION (Required for local development)
app.use((req, res, next) => {
    // This allows requests from any origin (*)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// --- 1. MySQL Connection Configuration ---
const dbConfig = {
    // IMPORTANT: REPLACE WITH YOUR NGROK HOST AND PORT
    host: 'YOUR_NGROK_HOST_HERE', // e.g., '0.tcp.ngrok.io'
    user: 'root', 
    password: '', 
    database: 'nexus_db', 
    port: NGROK_PORT_HERE, // e.g., 12345
    // ... (rest of the config is the same)
};

// Create a connection pool to manage database connections efficiently
const pool = mysql.createPool(dbConfig);

// Test the connection on startup
pool.getConnection()
    .then(connection => {
        console.log("SUCCESS: Connected to MySQL database!");
        connection.release();
    })
    .catch(err => {
        console.error("FAILURE: Cannot connect to MySQL.");
        console.error("Check 1: Is XAMPP/MAMP running?");
        console.error("Check 2: Are the database name ('nexus_db') and credentials correct?");
        console.error("Error Detail:", err.message);
    });

// --- 2. API Endpoint for Data Analysis (The Visualization Data) ---

app.get('/api/analysis', async (req, res) => {
    const metric = req.query.metric || 'temperature'; 

    const validMetrics = ['temperature', 'humidity', 'wind_speed'];
    if (!validMetrics.includes(metric)) {
        return res.status(400).json({ error: 'Invalid metric selected.' });
    }

    // SQL query to calculate the average of the selected metric grouped by city name.
    const sql = `
        SELECT 
            c.city_name, 
            AVG(w.${metric}) AS average_value
        FROM WeatherData w
        JOIN Cities c ON w.city_id = c.city_id
        GROUP BY c.city_name
        ORDER BY c.city_name;
    `;

    try {
        const [rows] = await pool.query(sql);
        res.json(rows); 
    } catch (error) {
        console.error('Error executing analysis query:', error);
        res.status(500).json({ error: 'Failed to retrieve analysis data.' });
    }
});

// --- 3. API Endpoint for Adding New Data ---

app.post('/api/data', async (req, res) => {
    const { city, date, temperature, humidity, windSpeed } = req.body;

    if (!city || !date || isNaN(temperature) || isNaN(humidity) || isNaN(windSpeed)) {
        return res.status(400).json({ error: 'Missing or invalid required fields.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Check if City exists, or insert it if new
        let [cityRows] = await connection.query('SELECT city_id FROM Cities WHERE city_name = ?', [city]);
        let cityId;

        if (cityRows.length === 0) {
            // City does not exist, insert it
            const [result] = await connection.query('INSERT INTO Cities (city_name) VALUES (?)', [city]);
            cityId = result.insertId;
        } else {
            cityId = cityRows[0].city_id;
        }

        // 2. Insert the weather data record
        const insertSql = `
            INSERT INTO WeatherData (city_id, record_date, temperature, humidity, wind_speed)
            VALUES (?, ?, ?, ?, ?);
        `;
        const insertValues = [cityId, date, temperature, humidity, windSpeed];

        await connection.query(insertSql, insertValues);

        await connection.commit();
        res.status(201).json({ message: 'Data successfully recorded.', cityId: cityId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error processing data insertion:', error);
        // Check for specific unique constraint error (city_id, record_date)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: 'Data for this city on this date already exists.' });
        }
        res.status(500).json({ error: 'Database transaction failed.' });
    } finally {
        if (connection) connection.release();
    }
});

// --- 4. API Endpoint for History Data (New) ---

app.get('/api/history', async (req, res) => {
    // SQL query to fetch the last 5 records, ordered by the recorded timestamp
    const sql = `
        SELECT 
            w.record_id, 
            c.city_name, 
            w.record_date, 
            w.temperature, 
            w.humidity, 
            w.wind_speed,
            w.recorded_at
        FROM WeatherData w
        JOIN Cities c ON w.city_id = c.city_id
        ORDER BY w.recorded_at DESC
        LIMIT 5;
    `;
    
    try {
        const [rows] = await pool.query(sql);
        res.json(rows); // Send the last 5 records
    } catch (error) {
        console.error('Error executing history query:', error);
        res.status(500).json({ error: 'Failed to retrieve history data.' });
    }
});

// --- 5. Start Server ---

app.listen(port, () => {
    console.log(`SERVER STATUS: Backend API running at http://localhost:${port}`);
});
