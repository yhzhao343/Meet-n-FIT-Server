var jwt = require('jsonwebtoken')
var config = require('./config/config')
var debug  = require('./log_service').debug

module.exports = {
    validate_request: validate_request,
    validate_socket_connection: validate_socket_connection
}

function validate_request(req, res, next) {
    debug('validate_request', req.query)
    var token = req.query['x-access-token']
    // var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
    debug('validate_request', token)
    if (token) {
        var decoded = jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                debug('validate_request', 'failed to validate')
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                debug('validate_request_pass', decoded)
                req.self = decoded,
                next();
            }
        })
    } else {
        debug('validate_request', 'no token')
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        })
    }
}

function validate_socket_connection(socket, next) {
    var token = socket.handshake.query['x-access-token']
    if (token) {
        var decoded = jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                debug('validate_socket_connection', 'no token provided')
                return next(new Error('Authentication error'));
            } else {
                socket._id = decoded._id
                debug('validate_socket_connection', decoded)
                return next();
            }
        })
    } else {
        debug('validate_socket_connection', 'no token provided')
        return next(new Error('No token provided'));
    }
}

