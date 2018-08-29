'use strict';

const Gatherer = require('lighthouse').Gatherer;

class TimeToAPI extends Gatherer {
    afterPass(options) {
        const driver = options.driver;

        return driver.evaluateAsync('window.apiResponseTime')
            .then(apiResponseTime => {
                if (!apiResponseTime) {
                    throw new Error('Unable to find API response metrics');
                }
                return apiResponseTime;
            });
    }
}

module.exports = TimeToAPI;
