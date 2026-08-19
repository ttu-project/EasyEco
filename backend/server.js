const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { startDailyTipScheduler } = require('./notification');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API Running');
});

app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const usageRoutes = require('./routes/usageRoutes');
app.use('/api/usage', usageRoutes);

// Usage Records — immutable snapshots for monthly estimation
const recordRoutes = require('./routes/recordRoutes');
app.use('/api/records', recordRoutes);

const billRoutes = require('./routes/billRoutes');
app.use('/api/bill', billRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

app.use('/api/chat', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  startDailyTipScheduler();
});
