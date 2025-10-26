const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.json());

const dbConfig = {
    host: 'sql12.freesqldatabase.com',
    user: 'sql12804470',
    password: 'fiKzxrFlYh',
    database: 'sql12804470',
    port: 3306,
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

pool.getConnection()
    .then(connection => {
        console.log("SUCCESS: Connected to MySQL database!");
        connection.release();
    })
    .catch(err => {
        console.error("FAILURE: Cannot connect to MySQL.");
        console.error("Error Detail:", err.message);
    });

app.get('/api/analysis', async (req, res) => {
    const metric = req.query.metric || 'temperature';
    const validMetrics = ['temperature', 'humidity', 'wind_speed'];
    if (!validMetrics.includes(metric)) {
        return res.status(400).json({ error: 'Invalid metric selected.' });
    }

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
        res.json(rows);
    } catch (error) {
        console.error('Error executing analysis query:', error);
        res.status(500).json({ error: 'Failed to retrieve analysis data due to database error.' });
    }
});

app.post('/api/data', async (req, res) => {
    const { city, date, temperature, humidity, windSpeed } = req.body;

    if (!city || !date || isNaN(temperature) || isNaN(humidity) || isNaN(windSpeed)) {
        return res.status(400).json({ error: 'Missing or invalid required fields.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let [cityRows] = await connection.query('SELECT city_id FROM Cities WHERE city_name = ?', [city]);
        let cityId;

        if (cityRows.length === 0) {
            const [result] = await connection.query('INSERT INTO Cities (city_name) VALUES (?)', [city]);
            cityId = result.insertId;
        } else {
            cityId = cityRows[0].city_id;
        }

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
        
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: 'Data for this city on this date already exists.' });
        }
        res.status(500).json({ error: 'Database transaction failed.' });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/history', async (req, res) => {
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
        res.status(500).json({ error: 'Failed to retrieve history data due to database error.' });
    }
});


app.listen(port, () => {
    console.log(`SERVER STATUS: Backend API running at http://localhost:${port}`);
    console.log(`Ready to serve requests.`);
});
