var express       = require('express');
var https         = require('https');
var fs            = require('fs')

var bodyParser    = require('body-parser');
var config        = require('./config/config')
var db_service    = require('./db_service');
var middlewares   = require('./middlewares')

var User          = db_service.User
var port          = process.env.PORT || config.port || 8080;
var app           = express();
var logger        = require('./log_service')
var morgan_logger = logger.morgan_logger

var debug         = require('./log_service').debug
var realtime_serv = require('./oplog_realtime_service')
// var MongoOplog    = require('mongo-oplog')
// var user_oplog         = MongoOplog(config.oplog_connect_string, {ns:'team_fit_test.users'})
var update_field = db_service.update_field
var compare_password = db_service.compare_password

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
app.all('/api/v1/*', [middlewares.validate_request])
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

var https_serv = https.createServer(require('localhost.daplie.com-certificates').merge({}),
 app)

var sio_serv = require('socket.io')(https_serv)

sio_serv.use(middlewares.validate_socket_connection)
// var all_clients = {}

sio_serv.on('connection', socket => {
    debug('socketio on connection', socket.id)
    var _id = socket._id;
    realtime_serv.add_to_watch_list(_id, socket)
    db_service.user_findOne({_id, _id}, {friends:1})
    .then(user => {
        realtime_serv.add_whom_to_notify(user._id, user.friends)
    })


    socket.on('disconnect', function() {
        debug('socketio on disconnect', _id)
        // delete all_clients[_id]
        realtime_serv.delete_user_from_watch(_id)
        db_service.user_findOne({_id:_id})
        .then(user => {
            if(user) {
                update_field(user, {online: false})
            }
        })
    })

    db_service.user_findOne({_id:socket._id})
    .then(user => {
        if(user) {
            update_field(user, {online: true})
        }
    })
})


https_serv.listen(port, ()=>{
  debug('Server', ["FIT server running on port: ", port].join(''))
 });
realtime_serv.start_watching()


