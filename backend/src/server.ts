import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/*
 * CORS
 *
 * During development:
 * FRONTEND_URL=http://localhost:5173
 *
 * During production:
 * FRONTEND_URL=https://your-frontend.vercel.app
 */
const allowedOrigin = process.env.FRONTEND_URL || "*";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

/*
 * Middleware
 */
app.use(express.json());

/*
 * Routes
 */
import path from "path";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/product";
import categoryRoutes from "./routes/category";
import customerRoutes from "./routes/customer";
import supplierRoutes from "./routes/supplier";
import saleRoutes from "./routes/sale";
import dashboardRoutes from "./routes/dashboard";
import inventoryRoutes from "./routes/inventory";
import expenseRoutes from "./routes/expense";
import uploadRoutes from "./routes/upload";

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/upload", uploadRoutes);

/*
 * Health Check
 */
app.get("/api/health", async (req, res) => {
  res.status(200).json({ status: "ok", message: "POS API is running" });
});

/*
 * Root Route
 */
app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>POS API</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;

            background: #f8fafc;
            color: #334155;

            min-height: 100vh;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .container {
            width: 90%;
            max-width: 500px;

            background: white;

            padding: 40px;

            border-radius: 16px;

            text-align: center;

            box-shadow:
              0 10px 25px rgba(0, 0, 0, 0.08);
          }

          h1 {
            margin: 0 0 12px;

            color: #0f172a;

            font-size: 28px;
          }

          p {
            margin: 8px 0;

            line-height: 1.6;
          }

          .status {
            display: inline-block;

            margin-top: 20px;

            padding: 8px 16px;

            border-radius: 999px;

            background: #dcfce7;

            color: #166534;

            font-weight: 600;

            font-size: 14px;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <h1>POS Backend API</h1>

          <p>
            The API server is running successfully.
          </p>

          <p>
            This is the backend API for the POS system.
          </p>

          <div class="status">
            API Online
          </div>
        </div>
      </body>
    </html>
  `);
});

/*
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/*
 * Error Handler
 */
app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled server error:", error);

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

/*
 * Start Server
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});