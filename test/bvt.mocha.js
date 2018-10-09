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
            "type": "console",
            "options": {
                format: winston.format.combine(winston.format.colorize(), winston.format.simple())
            }
        }, {
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
                datePattern: 'YYYY-MM-DD',
                format: winston.format.simple()
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

                if (files.length > 0) {
                    sh.rm('-rf', path.resolve(__dirname, './temp/*.log'));
                    return done();
                }

                done('Log files not found!');
            });
        }, 500);
    });

    it('fast-file-rotate', function (done) {
        let logDir = path.resolve(__dirname, "temp");

        const transports = [{
            "type": "fast-file-rotate",
            "options": {
                level: 'info',
                fileName: path.join(logDir, "fast-%DATE%.log"),
                dateFormat: 'YYYY-MM-DD',
                format: winston.format.simple()
            }
        }];

        sh.rm('-rf', path.resolve(__dirname, './temp/*.log'));

        const logger = winston.createLogger({
            transports: winstonFlight(winston, transports)
        });        

        logger.info('bla bla bla ...');
        logger.error('ala ala ala ...');

        setTimeout(() => {
            glob(path.resolve(__dirname, './temp/fast-*.log'), (err, files) => {
                if (err) return done(err);

                if (files.length > 0) {
                    sh.rm('-rf', path.resolve(__dirname, './temp/*.log'));
                    return done();
                }

                done('Log files not found!');
            });
        }, 500);
    });

    it('mongodb', function (done) {
        let inTravis = process.env.TRAVIS;
        let mongoUrl = inTravis ? 'mongodb://travis:test@localhost:27017' : 'mongodb://root:root@localhost:27017';

        const transports = [{
            "type": "mongo",
            "options": {                
                db: mongoUrl + (inTravis ? '/mydb_test' : '/mydb_test?authSource=admin'),                
                format: winston.format.combine(
                    winston.format.splat(),
                    winston.format.json()
                ),               
            }
        }];        

        const logger = winston.createLogger({
            transports: winstonFlight(winston, transports)
        });        

        logger.info('message', { key1: 'value1', key2: 100 });
        logger.end();

        setTimeout(() => {            
            const MongoClient = require('mongodb').MongoClient;
            let url = mongoUrl;
            if (!inTravis) {
                url += '/?authSource=admin';
            }            
    
            // Database Name
            const dbName = 'mydb_test';
            let client = new MongoClient(url, { useNewUrlParser: true });

            // Use connect method to connect to the server
            client.connect(function(err) {
                assert.equal(null, err);
            
                let db = client.db(dbName);
                let collection = db.collection('log');

                collection.findOne({ "meta.key1": "value1" }, function(err, doc) {
                    assert.equal(err, null);
                    
                    doc.meta.key2.should.be.exactly(100);

                    collection.deleteOne({ _id: doc._id }, function (err2, res) {
                        assert.equal(err2, null);

                        res.deletedCount.should.be.exactly(1);

                        client.close(() => {                            
                            collection = null;
                            db = null;
                            client = null;                            
                            done();
                        });       
                    });         
                });            
            });
        }, 300);        
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
