const cron = require('node-cron');
const lithuania = require('./plateform/lithuania');
const schedule = async () => {
    console.log('cron start time-------', new Date());
    lithuania()
    // cron.schedule('* * * * *', () => {
    //     console.log("Schedule started.............................................................", new Date());
    //     lithuania()
    //     console.log('Cron stop time-------', new Date());
    // });
}
module.exports = schedule;