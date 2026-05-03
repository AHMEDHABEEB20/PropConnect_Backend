const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const { notFoundHandler, errorHandler } = require('./shared/middlewares/error.middleware');
const { success } = require('./shared/utils/apiResponse');

const app = express();

// Collapse accidental double slashes (e.g. base URL + path) so routes still match.
app.use((req, _res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  if (req.originalUrl.startsWith('//')) {
    req.originalUrl = req.originalUrl.replace(/^\/+/, '/');
  }
  next();
});

const trust = process.env.TRUST_PROXY;
if (trust === 'true' || trust === '1') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions =
  !corsOrigin || corsOrigin === '*'
    ? { origin: true, credentials: true }
    : {
        origin: corsOrigin.split(',').map((o) => o.trim()),
        credentials: true,
      };

app.use(cors(corsOptions));

const v1Router = express.Router();

v1Router.get('/health', (req, res) => {
  success(res, 'OK', { uptime: process.uptime() });
});

v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);

app.use('/api/v1', v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
