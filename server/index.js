require('dotenv').config({ path: '../.env' }); // Go up one level
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001; // Use .env or default to 3001

app.use(bodyParser.json());

// MySQL connection using .env variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

// API to check username and password
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM test WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            // Only return success message if login is successful
            return res.json({ success: true, message: 'Login successful' });
        } else {
            // Only return error message if credentials are invalid
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});


// My Code Start Here

// Patient API
// Route to handle doctor login
app.post('/patient/login', (req, res) => {
  const { aadhar, password } = req.body;
  
  if (!aadhar || !password) {
    return res.status(400).json({ error: 'Aadhar number and password are required' });
  }

  const sql = 'SELECT * FROM patients WHERE aadhar = ? AND password = ?';
  db.query(sql, [aadhar, password], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Changed from doctor to patient in the response
      return res.json({ 
        success: true, 
        message: 'Login successful', 
        patient: results[0]  // Changed from doctor to patient
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  });
});

// Doctor API
// Route to handle patient login
app.post('/patient/check', (req, res) => {
  const { aadhar } = req.body;  // Only need aadhar for checking
  
  if (!aadhar) {
    return res.status(400).json({ error: 'Aadhar number is required' });
  }

  const sql = 'SELECT * FROM patients WHERE aadhar = ?';
  db.query(sql, [aadhar], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Patient found', 
        patient: results[0]
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }
  });
});

// Route to handle doctor login
app.post('/doctor/login', (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  const sql = 'SELECT * FROM doctors WHERE mobile = ? AND password = ?';
  db.query(sql, [mobile, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Assuming you want to return some user data
      return res.json({ success: true, message: 'Login successful', doctor: results[0] });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Create Report For Doctor
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'server/reports');
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// CreateReport API
app.post('/CreateReport', upload.single('File'), [
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('caseID').isNumeric().withMessage('Case ID is required')
], (req, res) => {
    console.log('Uploaded File:', req.file); // Log the uploaded file
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { description, caseID } = req.body;
    const reportFile = req.file ? req.file.filename : null; // Ensure this is set correctly
    const doctorData = JSON.parse(req.headers['doctor-session']);
    const doctorID = doctorData.id; // Extract just the ID

    if (!doctorID) {
        return res.status(400).json({ error: 'Doctor ID is required' });
    }

    // Query to find the disease associated with the caseID (if needed for other purposes)
    const caseQuery = 'SELECT disease FROM cases WHERE id = ?';
    db.query(caseQuery, [caseID], (err, results) => {
        if (err) {
            console.error('Error fetching disease:', err);
            return res.status(500).json({ message: 'Error fetching disease.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Case not found.' });
        }

        // Insert into the reports table without the disease field
        const sql = 'INSERT INTO reports (case_id, doc_id, description, report_file, date_time, type) VALUES (?, ?, ?, ?, NOW(), ?)';
        const reportType = 'Your Report Type'; // Set the report type as needed
        const values = [caseID, doctorID, description, reportFile, reportType]; // Use the correct fields

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error creating report:', err);
                return res.status(500).json({ message: 'Error creating report.' });
            }

            res.status(201).json({
                id: result.insertId,
                message: 'Report created successfully',
                reportFile
            });
        });
    });
});

app.get('/getCase', (req, res) => {
  const sql = 'SELECT id, disease FROM cases';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching medicines:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/createAllergies', [
  body('allergiename').isLength({ min: 3, max: 50 }).withMessage('AllergieName must be between 3 and 50 characters long.').notEmpty().withMessage('AllergieName is required.'),
  body('description').notEmpty().withMessage('Description is required.'),
  body('pid').notEmpty().withMessage('Patient ID is required.'),
], (req, res) => {
  console.log(req);
  
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }
  console.log(errors);
  
  const { allergiename, description, pid } = req.body;

  // SQL query updated to include pid
  const sql = 'INSERT INTO allergies (allergie, description, pid) VALUES (?, ?, ?)';
  const values = [allergiename, description, pid];

  db.query(sql, values, (err, result) => {
      if (err) {
          console.error('Error inserting allergie:', err);
          return res.status(500).json({ message: 'Error inserting allergie.' });
      }

      res.status(201).json({ 
        id: result.insertId,
        allergiename,
        description,
        patient_id: pid
      });
  });
});

app.post('/createCase', [
  body('disease').isLength({ min: 3 }).withMessage('Disease name must be at least 3 characters long'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('pid').isNumeric().withMessage('Patient ID is required'),
  body('did').isNumeric().withMessage('Doctor ID is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { disease, description, date, pid, did } = req.body;

  const sql = 'INSERT INTO cases (disease, description, date, p_id, doc_id) VALUES (?, ?, ?, ?, ?)';
  const values = [disease, description, date, pid, did];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating case:', err);
      return res.status(500).json({ message: 'Error creating case.' });
    }

    // Return the case_id in the response
    res.status(201).json({
      id: result.insertId,
      case_id: result.insertId,
      disease,
      description,
      date,
      patient_id: pid,
      doctor_id: did
    });
  });
});

app.post('/createVaccine', [
  body('vaccinename').trim().isLength({ min: 2, max: 50 }).withMessage('Vaccine name must be between 2 and 50 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('pid').isNumeric().withMessage('Patient ID is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { vaccinename, description, date, pid, did } = req.body;
  const sql = 'INSERT INTO vaccines (vaccine_name, description, date_of_vaccine , p_id) VALUES (?, ?, ?, ?)';
  const values = [vaccinename, description, date, pid];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating vaccine record:', err);
      return res.status(500).json({ message: 'Error creating vaccine record.' });
    }
    res.status(201).json({
      id: result.insertId,
      vaccinename,
      description,
      date,
      patient_id: pid,
    });
  });
});

// Add this endpoint to fetch medicines
app.get('/medicines', (req, res) => {
  const sql = 'SELECT id, medicinename, medicine_price FROM medicines';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching medicines:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Add this after your other endpoints
app.post('/createBill', [
  body('medicine').notEmpty().withMessage('Medicine is required'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  body('from_date')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('to_date')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('total_amount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be positive'),
  body('pid').isNumeric().withMessage('Patient ID is required'),
  body('case_id').isNumeric().withMessage('Case ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    medicine, 
    quantity, 
    from_date, 
    to_date, 
    timing, 
    total_amount,
    pid,
    case_id
  } = req.body;

  try {
    // First, insert into bills table
    const billSql = `
      INSERT INTO bills (
        medicine_id, 
        qty, 
        from_medicine, 
        to_medicine, 
        M,
        A,
        N,
        amount,
        p_id,
        case_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const billValues = [
      medicine,
      quantity,
      from_date,
      to_date,
      timing.morning,
      timing.afternoon,
      timing.night,
      total_amount,
      pid,
      case_id
    ];

    db.query(billSql, billValues, (err, result) => {
      if (err) {
        console.error('Error creating bill:', err);
        return res.status(500).json({ message: 'Error creating bill.' });
      }

      res.status(201).json({
        id: result.insertId,
        message: 'Bill created successfully',
        bill: {
          id: result.insertId,
          medicine_id: medicine,
          quantity,
          from_date,
          to_date,
          timing,
          total_amount,
          patient_id: pid,
          case_id: case_id
        }
      });
    });
  } catch (err) {
    console.error('Error in bill creation:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin API
// Route to fetch all doctors
app.get('/doctors', (req, res) => {
  const sql = `SELECT doctors.*, hospitals.hospitalname 
                FROM doctors 
                LEFT JOIN hospitals ON doctors.hospital_id = hospitals.id`; // Adjust the query as needed
  db.query(sql, (err, results) => {
    console.log(err);
    
      if (err) {
          return res.status(500).json({ error: 'Database error' });
      }
      res.json(results); // Assuming results is an array of doctor objects
  });
});

app.get('/check-aadhar', (req, res) => {
    const { number } = req.query;
    const sql = 'SELECT COUNT(*) as count FROM patients WHERE aadhar = ?';
    
    db.query(sql, [number], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const isUnique = results[0].count === 0; // If count is 0, Aadhar is unique
      res.json({ isUnique });
    });
  });

app.get('/check-mobile', (req, res) => {
  const { number } = req.query;
  const sql = 'SELECT COUNT(*) as count FROM hospitals WHERE mobile = ?';
  
  db.query(sql, [number], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const isUnique = results[0].count === 0; // If count is 0, mobile is unique
    res.json({ isUnique });
  });
});

// Route to fetch hospitals
app.get('/hospitals', (req, res) => {
    const sql = 'SELECT id, hospitalname FROM hospitals'; // Adjust the query as needed
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results); // Assuming results is an array of hospital objects
    });
  });

app.post('/CreatePatient', [
    body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters long.').notEmpty().withMessage('Username is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.').notEmpty().withMessage('Password is required.'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits.').isNumeric().withMessage('Mobile number must be numeric.').notEmpty().withMessage('Mobile number is required.'),
    body('aadhar').isLength({ min: 12, max: 12 }).withMessage('Aadhar number must be exactly 12 digits.').isNumeric().withMessage('Aadhar number must be numeric.').notEmpty().withMessage('Aadhar number is required.'),
    body('email').isEmail().withMessage('Invalid email address format.').notEmpty().withMessage('Email is required.'),
    body('address').notEmpty().withMessage('Address is required.'),
], (req, res) => {
    // Validate the request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, mobile, aadhar, email, address } = req.body;

    // SQL query to insert the new user into the users table
    const sql = 'INSERT INTO patients (username, password, mobile, aadhar, email, address) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [username, password, mobile, aadhar, email, address];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ message: 'Error inserting user.' });
        }

        // Respond with the created user
        res.status(201).json({ id: result.insertId, username, mobile, aadhar, email, address });
    });
});

app.post('/CreateHospital', [
    body('hospitalname').isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters long.').notEmpty().withMessage('Username is required.'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits.').isNumeric().withMessage('Mobile number must be numeric.').notEmpty().withMessage('Mobile number is required.'),
    body('email').isEmail().withMessage('Invalid email address format.').notEmpty().withMessage('Email is required.'),
    body('address').notEmpty().withMessage('Address is required.'),
], (req, res) => {
    // Validate the request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { hospitalname, mobile, email, address } = req.body;

    // SQL query to insert the new user into the users table
    const sql = 'INSERT INTO hospitals (hospitalname, mobile, email, address) VALUES (?, ?, ?, ?)';
    const values = [hospitalname, mobile, email, address];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting hospital:', err);
            return res.status(500).json({ message: 'Error inserting hospital.' });
        }

        // Respond with the created user
        res.status(201).json({ id: result.insertId, hospitalname, mobile, email, address });
    });
});

// Route to create a doctor with validation
app.post('/CreateDoctor', [
    body('doctorname').isString().isLength({ min: 3 }).withMessage('Name must be a string with at least 3 characters'),
    body('specialty').isString().isLength({ min: 3 }).withMessage('Specialty must be a string with at least 3 characters'),
    body('mobile').isString().matches(/^\d{10}$/).withMessage('Mobile number must be exactly 10 digits'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('address').isString().notEmpty().withMessage('Address is required.'),
    body('hospital_id').isNumeric().withMessage('Hospital ID must be a valid number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.').notEmpty().withMessage('Password is required.'),
  ], (req, res) => {
    // Validate the request
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { doctorname, specialty, mobile, email, address, hospital_id, password } = req.body;
  
    const sql = 'INSERT INTO doctors (doctorname, speciality, mobile, email, address, hospital_id, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [doctorname, specialty, mobile, email, address, hospital_id, password], (err, result) => {
      if (err) {
        console.log('Error creating doctor:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Doctor created successfully', doctorId: result.insertId });
    });
  });

app.post('/CreateMedicine', [
  body('medicinename')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Medicine name must be at least 3 characters long'),
  body('medicineprice')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { medicinename, medicineprice, description } = req.body;

  const sql = 'INSERT INTO medicines (medicinename, medicine_price, description) VALUES (?, ?, ?)';
  const values = [medicinename, medicineprice, description];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating medicine:', err);
      return res.status(500).json({ message: 'Error creating medicine.' });
    }

    res.status(201).json({
      id: result.insertId,
      message: 'Medicine created successfully'
    });
  });
});

// Route to create a doctor with validation
app.post('/adminDashboard', [
  body('doctorname').isString().isLength({ min: 3 }).withMessage('Name must be a string with at least 3 characters'),
  body('specialty').isString().isLength({ min: 3 }).withMessage('Specialty must be a string with at least 3 characters'),
  body('mobile').isString().matches(/^\d{10}$/).withMessage('Mobile number must be exactly 10 digits'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('address').isString().notEmpty().withMessage('Address is required.'),
  body('hospital_id').isNumeric().withMessage('Hospital ID must be a valid number'),
], (req, res) => {
  // Validate the request
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    
    return res.status(400).json({ errors: errors.array() });
  }

  const { doctorname, specialty, mobile, email, address, hospital_id } = req.body;

  const sql = 'INSERT INTO doctors (doctorname, speciality, mobile, email, address, hospital_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [doctorname, specialty, mobile, email, address, hospital_id], (err, result) => {
    if (err) {
      console.log('Error creating doctor:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Doctor created successfully', doctorId: result.insertId });
  });
});


// My Code Ends here

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
