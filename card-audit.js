'use strict';

const Audit = require('lighthouse').Audit;

const MAX_CARD_TIME = 2000;

class LoadAudit extends Audit {
    static get meta() {
        return {
            // Se agrega la propiedad "id"
            // El nombre de la propiedad "name" se reemplaza por "title"
            category: 'MyPerformance',
            id: 'card-audit',
            title: 'card-audit',
            description: 'Schedule card initialized and ready ',
            scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
            failureDescription: 'Schedule Card slow to initialize',
            helpText: 'Used to measure time from navigationStart to when the schedule' +
            ' card is shown.',

            requiredArtifacts: ['TimeToCard']
        };
    }

    static audit(artifacts) {
        const loadedTime = artifacts.TimeToCard;

        const belowThreshold = (MAX_CARD_TIME - loadedTime) / MAX_CARD_TIME;
        console.log(loadedTime);
        console.log(belowThreshold);

        return {
            rawValue: loadedTime,
            score: belowThreshold,
            displayValue: loadedTime.toFixed(2).toString(),
        };
    }
}

module.exports = LoadAudit;
