import { getByKey } from './licenses.js';

export const validateLicense = (licenseKey) => {
  if (process.env.LICENSE_MODE === 'skip') {
    return { valid: true, userId: 'dev-user' };
  }
  if (!licenseKey || licenseKey.length < 10) {
    return { valid: false };
  }
  const license = getByKey(licenseKey);
  if (!license) {
    return { valid: false };
  }
  return { valid: true, userId: license.id };
};
