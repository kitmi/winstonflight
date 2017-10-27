'use strict';

/**
 * Module dependencies.
 */

const should = require('should');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const sh = require('shelljs');
const glob = require('glob');
const winston = require('winston');
const winstonFlight = require('../index.js');

describe('bvt', function () {
    it('file', function (done) {
        let errorLog = "./test/temp/error.log";
        let allLog = "./test/temp/all.log";

        const transports = [{
            "type": "file",
            "options": {
                "name": 'error-log-file',
                "level": "error",
                "filename": errorLog
            }
        }, {
            "type": "file",
            "options": {
                "name": 'all-log-file',
                "filename": allLog
            }
        }];

        const logger = new (winston.Logger)({
            level: 'info',
            transports: winstonFlight(transports)
        });

        sh.rm('-rf', './test/temp/*.log');

        logger.info('bla bla bla ...');
        logger.error('ala ala ala ...');

        setTimeout(() => {
            if (!fs.existsSync(path.resolve(errorLog))) {
                return done(errorLog + ' not exist!');
            }

            if (!fs.existsSync(path.resolve(allLog))) {
                return done(allLog + ' not exist!');
            }

            done();
        }, 100);
    });

    it('file', function (done) {
        let logFile = "./test/temp/_file.log";

        const transports = [{
            "type": "daily-rotate-file",
            "options": {
                level: 'info',
                filename: logFile,
                datePattern: 'yyyy-MM-dd',
                prepend: true
            }
        }];

        const logger = new (winston.Logger)({
            transports: winstonFlight(transports)
        });

        sh.rm('-rf', './test/temp/*.log');

        logger.info('bla bla bla ...');
        logger.error('ala ala ala ...');

        setTimeout(() => {
            glob('./test/temp/*_file.log', (err, files) => {
                if (err) return done(err);

                if (files.length > 0) return done();

                done('Log files not found!');
            });
        }, 100);
    });
});
