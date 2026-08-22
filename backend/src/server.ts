import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

export const prisma = new PrismaClient();

app.use(cors({ origin: '*' }));
app.use(express.json());

import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import categoryRoutes from './routes/category';
import customerRoutes from './routes/customer';
import supplierRoutes from './routes/supplier';
import saleRoutes from './routes/sale';
import dashboardRoutes from './routes/dashboard';
import inventoryRoutes from './routes/inventory';
import expenseRoutes from './routes/expense';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'POS API is running' });
});

// Add root route to prevent 404 when navigating directly to the backend
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>POS API</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #334155; }
          .container { text-align: center; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          h1 { color: #0f172a; margin-bottom: 1rem; }
          p { margin-bottom: 1rem; }
          a { display: inline-block; background: #4f46e5; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 500; }
          a:hover { background: #4338ca; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>POS Backend API</h1>
          <p>The API server is running successfully.</p>
          <p>Please access the frontend application instead.</p>
          <a href="http://localhost:5173">Go to Frontend (http://localhost:5173)</a>
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
