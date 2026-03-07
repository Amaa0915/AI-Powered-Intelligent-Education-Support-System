require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/anomalies', require('./routes/anomalies'));
app.use('/api/forecast', require('./routes/forecast'));
app.use('/api/contextual', require('./routes/contextual'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🤖 ML Service URL: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

app.get('/', (req, res) => res.json({ message: 'Student Attendance API is running' }));
