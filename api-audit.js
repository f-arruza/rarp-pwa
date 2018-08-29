'use strict';

const Audit = require('lighthouse').Audit;

const MAX_API_RESPONSE_TIME = 3000;

class APIAudit extends Audit {
    static get meta() {
        return {
            // Se agrega la propiedad "id"
            // El nombre de la propiedad "name" se reemplaza por "title"
            category: 'MyPerformance',
            id: 'api-audit',
            title: 'api-audit',
            description: 'API initialized and ready ',
            scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
            failureDescription: 'API slow to initialize',
            helpText: 'Used to measure API response time.',

            requiredArtifacts: ['TimeToAPI']
        };
    }

    static audit(artifacts) {
        const apiResponseTime = artifacts.TimeToAPI;

        const belowThreshold = (MAX_API_RESPONSE_TIME - apiResponseTime) / MAX_API_RESPONSE_TIME;
        console.log(apiResponseTime);
        console.log(belowThreshold);

        return {
            rawValue: apiResponseTime,
            score: belowThreshold,
            displayValue: apiResponseTime.toFixed(2).toString(),
        };
    }
}

module.exports = APIAudit;
