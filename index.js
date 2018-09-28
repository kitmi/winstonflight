"use strict";

const _ = require('lodash');

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
 *         "level": "info",
 *         "filename": "-all.log"
 *         "datePattern": "yyyy-MM-dd",
 *         "prepend": true
 *     }
 * }];
 * 
 * const logger = new (winston.Logger)({
 *     level: 'info',
 *     transports: winstonFlight(winston, transports)
 * });
 * 
 */
module.exports = function (winston, transports) {
    return transports.map(transport => {
        let className = _.upperFirst(_.camelCase(transport.type));
        let classObject;

        //try builtin transport
        if (!transport.moduleName && className in winston.transports) {
            classObject = winston.transports[className];
        }

        if (!classObject) {
            //try load customer transport
            let moduleName = transport.moduleName || ('winston-' + _.kebabCase(transport.type));
            let transportModule = require(moduleName); 
            classObject = transportModule[className];

            if (!classObject) {
                //try if it registers itself in transports
                classObject = winston.transports[className];            
            }     

            if (!classObject) {
                throw new Error(`Unsupported transport type: ${transport.type}`);            
            }
        }

        return new classObject(transport.options);
    })
};