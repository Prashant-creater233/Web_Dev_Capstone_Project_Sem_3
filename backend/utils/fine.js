const config = require('../config');

const DAY_MS = 24 * 60 * 60 * 1000;

// Number of full or partial days after the due date
const daysLate = (dueDate, endDate = new Date()) =>
  Math.max(0, Math.ceil((new Date(endDate) - new Date(dueDate)) / DAY_MS));

// Late fee = days late x fine per day
const calcFine = (dueDate, endDate = new Date()) => daysLate(dueDate, endDate) * config.finePerDay;

module.exports = { daysLate, calcFine, DAY_MS };
