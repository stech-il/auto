export const validateLicense = (licenseKey) => {
  if (process.env.LICENSE_MODE === 'skip') {
    return { valid: true, userId: 'dev-user' };
  }
  if (!licenseKey || licenseKey.length < 10) {
    return { valid: false };
  }
  return { valid: true, userId: licenseKey };
};
