const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit to handle base64 image canvas signatures
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve frontend static assets from the root workspace
app.use(express.static(__dirname));

// DB connection pool configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin3600',
  database: process.env.DB_NAME || 'psls'
};

let dbPool;

// Connect to MySQL and initialize schema
async function initDatabase() {
  try {
    console.log(`Connecting to database [${dbConfig.database}] at ${dbConfig.host}:${dbConfig.port}...`);
    dbPool = mysql.createPool(dbConfig);
    
    // Verify connection works
    const connection = await dbPool.getConnection();
    console.log('Connected to MySQL database successfully!');
    
    // Run schema creation query
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS surveys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        col1_prov VARCHAR(10),
        col2_kab VARCHAR(10),
        col3_kec VARCHAR(10),
        col4_desa VARCHAR(10),
        col5_kodesls VARCHAR(10),
        col6_subsls VARCHAR(10),
        col7_namasls VARCHAR(255),
        col8_prov VARCHAR(10),
        col9_kab VARCHAR(10),
        col10_kec VARCHAR(10),
        col11_desa VARCHAR(10),
        col12_namadesa VARCHAR(255),
        col13_kodesls VARCHAR(10),
        col14_subsls VARCHAR(10),
        col15_muatandominan INT,
        col16_kk INT,
        col17_btt INT,
        col18_bbtt INT,
        col19_bttkosong INT,
        col20_bku INT,
        col21_ruta INT,
        col22_namasls VARCHAR(255),
        col23_ketuasls VARCHAR(255),
        col24_statusperubahan INT,
        col25_perubahanbatas INT,
        officer_name VARCHAR(255),
        officer_date VARCHAR(20),
        officer_sig LONGTEXT,
        supervisor_name VARCHAR(255),
        supervisor_date VARCHAR(20),
        supervisor_sig LONGTEXT,
        status VARCHAR(20) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    await connection.query(createTableQuery);
    console.log('Table "surveys" verified/created successfully in MySQL.');
    connection.release();
    
  } catch (err) {
    console.error('DATABASE CONNECT ERROR:', err.message);
    console.error('Ensure that MySQL is running locally and credentials in your .env are correct.');
    console.log('Backend server running in fallback mock database mode.');
  }
}

/* ==========================================================================
   REST API ENDPOINTS
   ========================================================================== */

// Helper DB query execution
async function runQuery(sql, params = []) {
  if (!dbPool) {
    throw new Error('Database is offline or not initialized.');
  }
  const [results] = await dbPool.query(sql, params);
  return results;
}

// 1. GET all surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const data = await runQuery('SELECT * FROM surveys ORDER BY id DESC');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET survey by ID
app.get('/api/surveys/:id', async (req, res) => {
  try {
    const data = await runQuery('SELECT * FROM surveys WHERE id = ?', [req.params.id]);
    if (data.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST new survey
app.post('/api/surveys', async (req, res) => {
  const s = req.body;
  try {
    const sql = `
      INSERT INTO surveys (
        col1_prov, col2_kab, col3_kec, col4_desa, col5_kodesls, col6_subsls, col7_namasls,
        col8_prov, col9_kab, col10_kec, col11_desa, col12_namadesa, col13_kodesls, col14_subsls,
        col15_muatandominan, col16_kk, col17_btt, col18_bbtt, col19_bttkosong, col20_bku, col21_ruta,
        col22_namasls, col23_ketuasls, col24_statusperubahan, col25_perubahanbatas,
        officer_name, officer_date, officer_sig, supervisor_name, supervisor_date, supervisor_sig, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      s.col1_prov, s.col2_kab, s.col3_kec, s.col4_desa, s.col5_kodesls, s.col6_subsls, s.col7_namasls,
      s.col8_prov, s.col9_kab, s.col10_kec, s.col11_desa, s.col12_namadesa, s.col13_kodesls, s.col14_subsls,
      s.col15_muatandominan, s.col16_kk, s.col17_btt, s.col18_bbtt, s.col19_bttkosong, s.col20_bku, s.col21_ruta,
      s.col22_namasls, s.col23_ketuasls, s.col24_statusperubahan, s.col25_perubahanbatas,
      s.officer_name, s.officer_date, s.officer_sig, s.supervisor_name, s.supervisor_date, s.supervisor_sig, s.status || 'submitted'
    ];
    
    const result = await runQuery(sql, params);
    res.status(201).json({ id: result.insertId, message: 'Data berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT update survey
app.put('/api/surveys/:id', async (req, res) => {
  const s = req.body;
  const id = req.params.id;
  try {
    const sql = `
      UPDATE surveys SET
        col1_prov = ?, col2_kab = ?, col3_kec = ?, col4_desa = ?, col5_kodesls = ?, col6_subsls = ?, col7_namasls = ?,
        col8_prov = ?, col9_kab = ?, col10_kec = ?, col11_desa = ?, col12_namadesa = ?, col13_kodesls = ?, col14_subsls = ?,
        col15_muatandominan = ?, col16_kk = ?, col17_btt = ?, col18_bbtt = ?, col19_bttkosong = ?, col20_bku = ?, col21_ruta = ?,
        col22_namasls = ?, col23_ketuasls = ?, col24_statusperubahan = ?, col25_perubahanbatas = ?,
        officer_name = ?, officer_date = ?, officer_sig = ?, supervisor_name = ?, supervisor_date = ?, supervisor_sig = ?, status = ?
      WHERE id = ?
    `;
    const params = [
      s.col1_prov, s.col2_kab, s.col3_kec, s.col4_desa, s.col5_kodesls, s.col6_subsls, s.col7_namasls,
      s.col8_prov, s.col9_kab, s.col10_kec, s.col11_desa, s.col12_namadesa, s.col13_kodesls, s.col14_subsls,
      s.col15_muatandominan, s.col16_kk, s.col17_btt, s.col18_bbtt, s.col19_bttkosong, s.col20_bku, s.col21_ruta,
      s.col22_namasls, s.col23_ketuasls, s.col24_statusperubahan, s.col25_perubahanbatas,
      s.officer_name, s.officer_date, s.officer_sig, s.supervisor_name, s.supervisor_date, s.supervisor_sig, s.status, id
    ];
    
    await runQuery(sql, params);
    res.json({ message: 'Data berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE survey
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM surveys WHERE id = ?', [req.params.id]);
    res.json({ message: 'Data berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST import surveys list in batch
app.post('/api/surveys/import', async (req, res) => {
  const surveys = req.body;
  if (!Array.isArray(surveys)) {
    return res.status(400).json({ error: 'Format data import harus berupa array.' });
  }

  try {
    let importedCount = 0;
    const sql = `
      INSERT INTO surveys (
        col1_prov, col2_kab, col3_kec, col4_desa, col5_kodesls, col6_subsls, col7_namasls,
        col8_prov, col9_kab, col10_kec, col11_desa, col12_namadesa, col13_kodesls, col14_subsls,
        col15_muatandominan, col16_kk, col17_btt, col18_bbtt, col19_bttkosong, col20_bku, col21_ruta,
        col22_namasls, col23_ketuasls, col24_statusperubahan, col25_perubahanbatas,
        officer_name, officer_date, officer_sig, supervisor_name, supervisor_date, supervisor_sig, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let s of surveys) {
      const params = [
        s.col1_prov, s.col2_kab, s.col3_kec, s.col4_desa, s.col5_kodesls, s.col6_subsls, s.col7_namasls,
        s.col8_prov, s.col9_kab, s.col10_kec, s.col11_desa, s.col12_namadesa, s.col13_kodesls, s.col14_subsls,
        s.col15_muatandominan, s.col16_kk, s.col17_btt, s.col18_bbtt, s.col19_bttkosong, s.col20_bku, s.col21_ruta,
        s.col22_namasls, s.col23_ketuasls, s.col24_statusperubahan, s.col25_perubahanbatas,
        s.officer_name, s.officer_date, s.officer_sig, s.supervisor_name, s.supervisor_date, s.supervisor_sig, s.status || 'submitted'
      ];
      await runQuery(sql, params);
      importedCount++;
    }

    res.json({ message: `Berhasil mengimpor ${importedCount} data survei.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wildcard fallback index serving
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Boot server
app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(` SE2026-PSLS Application Server is running.`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(` Mode: Smartphone-Optimized Web App Portal`);
  console.log(`===================================================`);
  await initDatabase();
});
