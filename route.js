var express = require('express');
var db_service = require('./db_service');
var router = express.Router();
var config = require('./config/config')
var log_service = require('./log_service')
var jwt = require("jsonwebtoken")
var Promise = require('bluebird')
var debug = log_service.debug

router.post('/login', login_user)
router.post('/register', register_user)
router.post('/send_password', send_password)
router.post('/api/v1/add_friend', add_friend)
router.post('/api/v1/get_friends_info', get_friends_info)

function get_friends_info(req, res) {
    user_find_many.user_find_many('_id', req.body, {friends:0, password:0})
    .then(friends => {
        res.json(friends)
    })
}
function add_friend(req, res) {
    Promise.all([
        db_service.user_findOne({_id:req.self._id}),
        db_service.user_findOne({name:req.body.name})
    ]).then(vals => {
        var user = vals[0]
        var to_be_friend = vals[1]
        if (!user || !to_be_friend) {
            //Should be impossible
            res.json({success: false, message: "you or your friend doesn not exist"})
        } else {
            user.add_friend(to_be_friend._id)
            .then(() => {
                res.json({success: true})
            })
        }
    })
}

function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function send_password(req, res) {
    db_service.user_findOne({email:req.body.email})
    .then(user => {
        if (!user) {
            res.json({success: false, message: 'No account for this email found not found.'})
        } else {
            debug('send_password', user)
            var new_password = generatePassword();
            user.update_field({password: new_password})
            var email = require("emailjs");
            var server = email.server.connect({
                user: "meetnfit.noreply@gmail.com",
                password: "7FITpassword",
                host: "smtp.gmail.com",
                ssl: true
            });
            server.send({
                text: "Your password has been reset to the following:\n\n" + new_password,
                from: "Team FIT <meetnfit.noreply@gmail.com>",
                to: req.body.email,
                subject: "Password Reset"
                }, function(err, message) { console.log(err || message);
            });
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
                password: req.body.password,
                friends: []
            }
            new db_service.User(new_user)
            .save()
            .catch(log_service.error_logger_gen('Insert new user', err => {
                res.json({ success: false, message: 'Server problem'});
            }))
            .then(result => {
                debug('register_user', result)
                var token = jwt.sign({_id:result._id}, config.secret, {
                        expiresIn: 172800 //2days
                    })
                res.json({
                    success: true,
                    token: token,
                    user_info: {
                        email: new_user.email,
                        first_name: new_user.first_name,
                        last_name: new_user.last_name,
                        name: new_user.name,
                        friends: []
                    }
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
                var token = jwt.sign({_id:user._id}, config.secret, {
                    expiresIn: 172800
                })
                res.json({
                    success: true,
                    token: token,
                    user_info: {
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        name: user.name,
                        friends: user.friends
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