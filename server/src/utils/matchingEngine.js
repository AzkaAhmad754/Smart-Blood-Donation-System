const donorModel = require('../models/donorModel');
const bloodBankModel = require('../models/bloodBankModel');

// Blood type compatibility map (who can donate to whom)
const COMPATIBLE_DONORS = {
  'A+':  ['A+', 'AB+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'O+':  ['A+', 'B+', 'O+', 'AB+'],
  'O-':  ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
};

/**
 * Find all available donors compatible with the requested blood type in the city
 */
const findMatchingDonors = async (blood_type, city) => {
  // For simplicity, match exact blood type — hospitals request specific type
  return donorModel.findNearby(blood_type, city);
};

/**
 * Find all blood banks in the city
 */
const findMatchingBanks = async (city) => {
  return bloodBankModel.findByCity(city);
};

module.exports = { findMatchingDonors, findMatchingBanks };
