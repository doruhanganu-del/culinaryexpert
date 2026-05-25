require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes       = require('./src/routes/auth');
const userRoutes       = require('./src/routes/users');
const mealPlanRoutes   = require('./src/routes/mealplans');
const groceryRoutes    = require('./src/routes/groceries');
const ingredientRoutes = require('./src/routes/ingredients');
const syncRoutes       = require('./src/routes/sync');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/meal-plans',  mealPlanRoutes);
app.use('/api/groceries',   groceryRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/sync',        syncRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CulinaryExpert API running on port ${PORT}`));

module.exports = app;
