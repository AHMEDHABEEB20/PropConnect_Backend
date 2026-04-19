require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { logger } = require('./shared/utils/logger');

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
