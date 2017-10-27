# winstonflight
![Build Status](https://travis-ci.org/kitmi/winstonflight.svg?branch=master) ![Coverage Status](https://coveralls.io/repos/github/kitmi/winstonflight/badge.svg?branch=master)

A winston wrapper to enable adding transports by config

## Example

```
const transports = [{
    "type": "file",
    "options": {
        "level": "error",
        "filename": "error.log"
    }
}, {
    "type": "daily-rotate-file",
    "options": {
        "level": "info",
        "filename": "-all.log"
        "datePattern": "yyyy-MM-dd",
        "prepend": true
    }
}];

const logger = new (winston.Logger)({
    level: 'info',
    transports: winstonFlight(transports)
});

```


## License

  MIT
