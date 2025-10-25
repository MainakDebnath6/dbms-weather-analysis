// --- BACKEND API SERVER (Node.js/Express) ---
// This file connects the Frontend (index.html) to the MySQL Database.

const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based client

const app = express();
const port = 3000;

// Middleware setup to allow frontend (index.html) to talk to this server
// We use manual headers instead of the 'cors' module to fix local installation issues.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for this project
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.json()); // To parse JSON bodies

// --- 1. MySQL Connection Configuration ---
const dbConfig = {
    // !!! IMPORTANT: NGROK ADDRESS - Updated with your live tunnel (0.tcp.in.ngrok.io:15508) !!!
    host: '0.tcp.in.ngrok.io', 
    user: 'root', 
    password: '', 
    database: 'nexus_db', 
    port: 15508, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
        console.error("Check 2: Is the ngrok tunnel running (`ngrok tcp 3306`)?");
        console.error("Check 3: Are the HOST and PORT in server.js updated to the NEW ngrok address?");
        console.error("Error Detail:", err.message);
    });

// --- 2. API Endpoint for Data Analysis (The Visualization Data) ---

app.get('/api/analysis', async (req, res) => {
    // Determine which metric to analyze based on the query parameter
    const metric = req.query.metric || 'temperature'; // Default to temperature

    // Sanitize the metric input to prevent SQL injection and ensure it's a valid column
    // The names here MUST match the database columns exactly (case sensitive on some OS/configs)
    const validMetrics = ['temperature', 'humidity', 'wind_speed']; 
    if (!validMetrics.includes(metric)) {
        return res.status(400).json({ error: 'Invalid metric selected.' });
    }

    // SQL query to calculate the average of the selected metric grouped by city name.
    // Use CAST to ensure the average result is treated as a DECIMAL, preventing possible type errors.
    const sql = `
        SELECT 
            c.city_name, 
            CAST(AVG(w.${metric}) AS DECIMAL(10, 2)) AS average_value
        FROM WeatherData w
        JOIN Cities c ON w.city_id = c.city_id
        GROUP BY c.city_name
        ORDER BY c.city_name;
    `;

    try {
        const [rows] = await pool.query(sql);
        res.json(rows); // Send the results back to the frontend
    } catch (error) {
        console.error('Error executing analysis query:', error);
        // Log the actual SQL error details to help debug the 500 error
        console.error('SQL Error Code:', error.code);
        console.error('SQL Message:', error.sqlMessage);
        res.status(500).json({ error: 'Failed to retrieve analysis data due to database error.' });
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
        // The column names here MUST match the database exactly (temperature, humidity, wind_speed)
        const insertSql = `
            INSERT INTO WeatherData (city_id, record_date, temperature, humidity, wind_speed)
            VALUES (?, ?, ?, ?, ?);
        `;
        // Note: windSpeed from request body must map to wind_speed column in DB
        const insertValues = [cityId, date, temperature, humidity, windSpeed];

        await connection.query(insertSql, insertValues);

        await connection.commit();
        res.status(201).json({ message: 'Data successfully recorded.', cityId: cityId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error processing data insertion:', error);
        // Log the actual SQL error details to help debug the 500 error
        console.error('SQL Error Code:', error.code);
        console.error('SQL Message:', error.sqlMessage);
        
        // Check for specific unique constraint error (city_id, record_date)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: 'Data for this city on this date already exists.' });
        }
        res.status(500).json({ error: 'Database transaction failed.' });
    } finally {
        if (connection) connection.release();
    }
});

// --- 4. API Endpoint for Recent History ---

app.get('/api/history', async (req, res) => {
    // SQL query to fetch the last 10 records, ordered by newest first, joining city names.
    // Ensure the table names (WeatherData, Cities) match the database exactly!
    const sql = `
        SELECT 
            w.record_date, 
            w.temperature, 
            w.humidity, 
            w.wind_speed,
            w.recorded_at,
            c.city_name
        FROM WeatherData w
        JOIN Cities c ON w.city_id = c.city_id
        ORDER BY w.recorded_at DESC
        LIMIT 10;
    `;

    try {
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error executing history query:', error);
        // Log the actual SQL error details to help debug the 500 error
        console.error('SQL Error Code:', error.code);
        console.error('SQL Message:', error.sqlMessage);
        res.status(500).json({ error: 'Failed to retrieve history data due to database error.' });
    }
});


// --- 5. Start Server ---

app.listen(port, () => {
    console.log(`SERVER STATUS: Backend API running at http://localhost:${port}`);
    console.log(`Ready to serve requests.`);
});
