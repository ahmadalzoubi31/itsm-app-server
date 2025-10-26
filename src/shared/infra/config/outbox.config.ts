export default () => ({
  outbox: {
    pollingInterval: process.env.OUTBOX_POLLING_INTERVAL ?? 2000,
    batchSize: process.env.OUTBOX_BATCH_SIZE ?? 50,
  },
});

