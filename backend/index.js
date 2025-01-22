const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'upload')));

// Config for SQL Server
const dbConfig = {
    user: 'sa',
    password: 'Sql4116!',
    server: 'PROGRAMMONS',
    database: 'Production',
    options: {
        encrypt: false, // ปิดการเข้ารหัส SSL
        enableArithAbort: true,
        trustServerCertificate: true, // ใช้ self-signed certificate ได้
    },
};

// Multer Config
const upload = multer({ dest: 'upload/' });

// API: Import Excel File
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
    
        // Read Excel
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
        // Insert Data into SQL Server
        const pool = await sql.connect(dbConfig);
        for (const record of data) {
            const query = `
            INSERT INTO generate_barcode (order_number, product_code, batch_no, order_qty, size, sku, print_qty, created_at)
            VALUES (@order_number, @product_code, @batch_no, @order_qty, @size, @sku, @print_qty, GETDATE())`;
    
            const request = pool.request();
            request.input('order_number', sql.VarChar, record["Order"]);
            request.input('product_code', sql.VarChar, record["Product Code"]);
            request.input('batch_no', sql.VarChar, record["Batch No"]);
            request.input('order_qty', sql.Float, parseFloat(record["Order Qty"] || 0));
            request.input('size', sql.VarChar, record["Size"]);
            request.input('sku', sql.VarChar, record["SKU"]);
            request.input('print_qty', sql.Int, parseInt(record["Print Qty"] || 0));
    
            await request.query(query);
        }
        res.status(200).send({ message: 'Data imported successfully' });
        // แจ้ง WebSocket Clients
        broadcastData();
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to import data' });
    }
});

app.get('/data', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM generate_barcode');
        res.status(200).json(result.recordset); // ส่งข้อมูลทั้งหมดในรูปแบบ JSON
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fetch data' });
    }
});

// สร้าง WebSocket Server
const wss = new WebSocket.Server({ port: 5001 });

// ส่งข้อมูลให้ทุก Client ที่เชื่อมต่อ
const broadcastData = async () => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query("SELECT * FROM generate_barcode WHERE status IS NULL OR status <> 'success'");
        const data = JSON.stringify(result.recordset);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data); // ส่งข้อมูลให้ Client
            }
        });
    } catch (error) {
        console.error('Error broadcasting data:', error);
    }
};

// เมื่อมี Client เชื่อมต่อ
wss.on('connection', (ws) => {
    console.log('Client connected');
  
    // ส่งข้อมูลเริ่มต้นให้ Client
    broadcastData();
  
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`WebSocket running at ws://localhost:5001`);
});