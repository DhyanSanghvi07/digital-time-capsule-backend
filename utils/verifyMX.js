const dns = require("dns").promises;

const verifyMX = async (email) => {
  try {
    const parts = email.split("@");

    if (parts.length !== 2) {
      return false;
    }

    const domain = parts[1];

    const records = await dns.resolveMx(domain);

    if (!records || records.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = verifyMX;