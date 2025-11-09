const UAParser = require('ua-parser-js');

/**
 * Parse user agent string and extract device/browser information
 * @param {string} userAgentString - Raw user agent string
 * @returns {object} Parsed device and browser data
 */
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) {
    return {
      device_category: 'unknown',
      browser: 'unknown',
      browser_version: 'unknown',
      operating_system: 'unknown',
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Determine device category
  let deviceCategory = 'desktop';
  if (result.device.type) {
    if (result.device.type === 'mobile') {
      deviceCategory = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceCategory = 'tablet';
    }
  }

  // Get browser info
  const browser = result.browser.name || 'unknown';
  const browserVersion = result.browser.version || 'unknown';

  // Get OS info
  const os = result.os.name || 'unknown';
  const osVersion = result.os.version || '';
  const operatingSystem = osVersion ? `${os} ${osVersion}` : os;

  return {
    device_category: deviceCategory,
    browser: browser,
    browser_version: browserVersion,
    operating_system: operatingSystem,
  };
};

module.exports = {
  parseUserAgent,
};
