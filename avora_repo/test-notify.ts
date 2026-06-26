import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch('https://ais-dev-326phljxkhqsn6o7rztqiv-1000159815049.asia-southeast1.run.app/api/cron/process-emails', { method: 'POST' });
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
}
run();
