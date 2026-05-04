const { sendEmail } = require('./sendEmail');
const { logger } = require('./logger');

const queue = [];
let activeWorkers = 0;
const MAX_CONCURRENCY = Math.max(1, Number(process.env.EMAIL_QUEUE_CONCURRENCY) || 1);

function processQueue() {
  while (activeWorkers < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    activeWorkers += 1;

    sendEmail(job)
      .catch((err) => {
        logger.error('Failed to send queued email', {
          to: job.to,
          subject: job.subject,
          message: err.message,
        });
      })
      .finally(() => {
        activeWorkers -= 1;
        if (queue.length > 0) {
          setImmediate(processQueue);
        }
      });
  }
}

function enqueueEmail(payload) {
  queue.push(payload);
  setImmediate(processQueue);
}

module.exports = { enqueueEmail };
