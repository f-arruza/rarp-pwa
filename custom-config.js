'use strict';

module.exports = {

    extends: 'lighthouse:default',

    passes: [{
        passName: 'defaultPass',
        gatherers: [
            'card-gatherer',
            'api-gatherer'
        ]
    }],

    audits: [
        'card-audit',
        'api-audit'
    ],

    categories: {
        // El nombre de la propiedad "name" se reemplaza por "title"
        // El nombre de la propiedad "audits" se reemplaza por "auditRefs"
        ratp_pwa: {
            id: 'ratp_pwa',
            title: 'Ratp pwa metrics',
            description: 'Metrics for the ratp timetable site',
            auditRefs: [
                {id: 'card-audit', weight: 1}
            ]
        },
        ratp_api_pwa: {
            id: 'ratp_api_pwa',
            title: 'API metrics',
            description: 'Metrics for the API',
            auditRefs: [
                {id: 'api-audit', weight: 1}
            ]
        }
    }
};
