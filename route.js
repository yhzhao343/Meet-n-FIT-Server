var express = require('express');
var db_service = require('./db_service');
var router = express.Router();
var config = require('./config/config')
var log_service = require('./log_service')
var jwt = require("jsonwebtoken")
var debug = log_service.debug

router.post('/login', login_user)
router.post('/register', register_user)
router.post('/send_password', send_password)


function send_password(req, res) {
    db_service.user_findOne({email:req.body.email})
    .then(user => {
        if (!user) {
            res.json({success: false, message: 'No account for this email found not found.'})
        } else {
            debug('send_password', user)
            user.update_field({password:"password123"})
            // .save()
            // console.log("updating password");
        }
    })
}

function register_user(req, res) {
    db_service.user_findOne({name:req.body.name})
    .then(user => {
        if(user) {
            res.json({ success: false, message: 'Username already exist.' });
        } else {
            var new_user = {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            }
            new db_service.User(new_user)
            .save()
            .catch(log_service.error_logger_gen('Insert new user', err => {
                res.json({ success: false, message: 'Server problem'});
            }))
            .then(result => {
                var token = jwt.sign({name:req.body.name}, config.secret, {
                        expiresIn: 172800 //2days
                    })
                res.json({
                    success: true,
                    token: token
                });
            })
        }
    })
}

function login_user(req, res) {
    var user_info = {
        name : req.body.name,
    }
    db_service.user_findOne(user_info)
    .then(user => {
        debug('login_user', user)
        if (!user) {
            res.json({ success: false, message: 'User not found.' });
        } else {
            user.compare_password(req.body.password)
            .then(function() {
                var token = jwt.sign(user_info, config.secret, {
                    expiresIn: 172800
                })
                res.json({
                    success: true,
                    token: token,
                    user_info: {
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        name: user.name
                    }
                });
            })
            .catch(function() {
                res.json({ success: false, message: 'Incorrect password.' });
            })
        }
    })
}
module.exports = router