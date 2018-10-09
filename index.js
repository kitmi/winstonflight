"use strict";

const _ = require('lodash');

// from type to [ module classes ]
const CLASSES_MAPPING = {    
    'mongodb': [ 'winston-mongodb', 'MongoDB' ],
    'airbrake': [ 'winston-airbrake2', 'Airbrake' ],
    'dynamodb': [ 'winston-dynamodb', 'DynamoDB' ],
    'firehose': [ 'winston-firehose' ],
    'sns': [ 'winston-sns' ],
    'azure': [ 'winston-azuretable', 'AzureLogger' ],
    'spark': [ 'winston-spark', 'SparkLogger' ],
    'cloudant': [ 'winston-cloudant' ],
    'google-stackdriver': [ '@google-cloud/logging-winston' ],
    'graylog2': [ 'winston-graylog2' ],
    'fast-file-rotate': [ 'fast-file-rotate' ],
    'logzio': [ 'winston-logzio' ],
    'logsene': [ 'winston-logsene' ],
    'newrelic': [ 'newrelic-winston' ],
    'pusher': [ 'winston-pusher', 'PusherLogger' ],
    'simpledb': [ 'winston-simpledb', 'SimpleDB' ],
    'sumologic': [ 'winston-sumologic-transport', 'SumoLogic' ],
    'winlog2': [ 'winston-winlog2' ] 
};

const ALIAS = {
    'mongodb': [ 'mongo' ],
    'airbrake': [ 'airbrake2' ],
    'azure': [ 'azuretable' ],
    'google-stack-driver': [ 'stackdriver' ],
    'graylog2': [ 'graylog' ],
    'winlog2': [ 'winlog', 'windows-event-log' ]
};

(function mergeAlias() {
    _.forOwn(ALIAS, (aliases, key) => {
        aliases.forEach(alias => {
            CLASSES_MAPPING[alias] = CLASSES_MAPPING[key];
        })
    });
})();

/**
 * Converts an array of transports config to an array of winston transport objects
 * @function winstonFlight
 * @param {array} transports - transports config
 * @returns {array}
 *
 * @example
 * const winstonFlight = require('winstonflight');
 *
 * const transports = [{
 *     "type": "file",
 *     "options": {
 *         "level": "error",
 *         "filename": "error.log"
 *     }
 * }, {
 *     "type": "daily-rotate-file",
 *     "options": {
 *         "level": "verbose",
 *         "filename": "category2-%DATE%.log",
 *         "datePattern": "YYYYMMDD"
 *     }
 * }];
 * 
 * const logger = winston.createLogger({
 *     level: 'info',
 *     transports: winstonFlight(winston, transports)
 * });
 * 
 */
module.exports = function (winston, transports) {
    return transports.map(transport => {
        let transportModule, className, classObject;        

        if (CLASSES_MAPPING.hasOwnProperty(transport.type)) {
            //try get the transport class directly from predefined map
            let transportInfo = CLASSES_MAPPING[transport.type];
            transportModule = require(transportInfo[0]); 
            
            if (transportInfo.length > 1) {
                className = transportInfo[1];
                classObject = transportModule[className];
            } else {
                classObject = transportModule;
            }
            
        } else {
            className = _.upperFirst(_.camelCase(transport.type));        

            //try builtin transport
            if (!transport.moduleName && className in winston.transports) {
                classObject = winston.transports[className];
            }

            if (!classObject) {
                //try load customer transport
                let moduleName = transport.moduleName || ('winston-' + _.kebabCase(transport.type));
                transportModule = require(moduleName); 
                classObject = transportModule[className];
            }
        }              

        if (!classObject && className) {
            //try if it registers itself in transports
            classObject = winston.transports[className];            
        }     

        if (!classObject) {
            throw new Error(`Unsupported transport type: ${transport.type}`);            
        }    

        return new classObject(transport.options);
    })
};