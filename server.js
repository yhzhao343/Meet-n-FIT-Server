var express       = require('express');
var https         = require('https');
var fs            = require('fs')

var bodyParser    = require('body-parser');
var config        = require('./config/config')
var db_service    = require('./db_service');

var User          = db_service.User
var port          = process.env.PORT || config.port || 8080;
var app           = express();
var logger        = require('./log_service')
var morgan_logger = logger.morgan_logger

var debug         = require('./log_service').debug


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan_logger);
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    next();
});

//Validate tokens for path that looks like: '/api/v1/*'
app.all('/api/v1/*', [require('./middlewares').validate_request])
app.use('/', require('./route'))

app.use(function (err, req, res, next) {
  res.status(500).send('Something broke!')
  logger.error_logger_gen('general')(err)
})

// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
  res.status(404).send("This is not the address you are looking for!")
});

// https.createServer({
//   key: fs.readFileSync('./config/key.pem'),
//   cert: fs.readFileSync('./config/cert.pem'),
//   passphrase: config.passphrase
// }, app).listen(port);

https.createServer(require('localhost.daplie.com-certificates').merge({}),
 app).listen(port, ()=>{
  debug('Server', ["FIT server running on port: ", port].join(''))
 });

