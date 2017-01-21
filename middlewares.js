var jwt = require('jsonwebtoken')
var config = require('./config/config')
var debug  = require('./log_service').debug

module.exports = {
    validate_request: validate_request
}

function validate_request(req, res, next) {
    var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
    // var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
    if (token) {
        var decoded = jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.decoded = decoded
            }
        })
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        })
    }
}
