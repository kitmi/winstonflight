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

sh.mkdir('-p', path.resolve(__dirname, "./temp"));

describe('bvt', function () {
    it('file', function (done) {
        let errorLog = path.resolve(__dirname, "./temp/error.log");
        let allLog = path.resolve(__dirname, "./temp/all.log");

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

        sh.rm('-rf', path.resolve(__dirname, './temp/*.log'));

        const logger = winston.createLogger({
            level: 'info',
            transports: winstonFlight(winston, transports)
        });        

        logger.info('bla bla bla ...');
        logger.error('ala ala ala ...');

        setTimeout(() => {
            if (!fs.existsSync(errorLog)) {
                return done(errorLog + ' not exist!');
            }

            if (!fs.existsSync(allLog)) {
                return done(allLog + ' not exist!');
            }

            done();
        }, 500);
    });

    it('daily-rotate-file', function (done) {
        let logDir = path.resolve(__dirname, "temp");

        const transports = [{
            "type": "daily-rotate-file",
            "options": {
                level: 'info',
                dirname: logDir,
                filename: "file-%DATE%.log",
                datePattern: 'YYYY-MM-DD'
            }
        }];

        sh.rm('-rf', path.resolve(__dirname, './temp/*.log'));

        const logger = winston.createLogger({
            transports: winstonFlight(winston, transports)
        });        

        logger.info('bla bla bla ...');
        logger.error('ala ala ala ...');

        setTimeout(() => {
            glob(path.resolve(__dirname, './temp/file-*.log'), (err, files) => {
                if (err) return done(err);

                if (files.length > 0) return done();

                done('Log files not found!');
            });
        }, 500);
    });

    it('throw error', function () {
        const transports = [{
            "type": "unknown-transport-type",
            "options": {
            }
        }];

        (() => winstonFlight(winston, transports)).should.throw("Cannot find module 'winston-unknown-transport-type'");
    });
});
