import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bloodStockRoutes from './routes/bloodStockRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', bloodStockRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation API is running.' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});