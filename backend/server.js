const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Running');
});

app.use('/api/users', require('./routes/userRoutes'));

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// const PORT = process.env.PORT || 5000;

app.listen(5000, '0.0.0.0', () => {
  console.log(`Server running on port 5000`);
});