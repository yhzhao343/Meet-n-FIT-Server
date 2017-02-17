var express = require('express');
var db_service = require('./db_service');
var router = express.Router();
var config = require('./config/config')
var log_service = require('./log_service')
var jwt = require("jsonwebtoken")
var Promise = require('bluebird')
var realtime_serv = require('./oplog_realtime_service')
var crypto = require('crypto');
var debug = log_service.debug

router.post('/login', login_user)
router.post('/register', register_user)
router.post('/send_password', send_password)
router.post('/api/v1/add_friend', add_friend)
router.post('/api/v1/get_friends_info', get_friends_info)
router.post('/api/v1/add_conversation', add_conversation)
router.post('/change_password', change_password)
function get_friends_info(req, res) {
    db_service.user_find_many('_id', req.body, {friends:0, password:0})
    .then(friends => {
        res.json({success:true, friends: friends})
    })
    .catch(err => {
        res.json({success:false})
    })
}

function add_conversation(req, res) {
    var self_id = req.self._id
    var participants = req.body
    participants.push(self_id)
    var name = crypto.createHash('md5').update(participants.join('')).digest('hex')
    var new_conversation = {
        'name': name,
        'sentences':[],
        'participants':participants,
        'last_update': new Date()
    }
    new db_service.Conversation(new_conversation)
    .save()
    .catch(log_service.error_logger_gen('Insert new conversation', err => {
        res.json({ success: false, message: 'Server problem'});
    }))
    .then(result => {
        debug('add_conversation', result)
        res.json({
            name: result.name,
            success: true,
            sentences:[],
            participants:result.participants,
            last_update: result.last_update
        });
        db_service.User.update(
            {'_id': {'$in':result.participants}},
            {'$push': {'conversations': result.name}},
            function(err, raw) {
                if(err) {
                    debug('add_conversation_err', err)
                    debug('add_conversation_raw', raw)
                }
            }
        )
    })
}


function add_friend(req, res) {
    //TODO: maybe add update realtime_serv's friendlist
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
    }).catch(err => {
        res.json({success:false})
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
    .catch(err => {
        res.json({success:false})
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
                friends: [],
                conversations: []
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
                        friends: [],
                        conversations: []
                    }
                });
            })
        }
    })
    .catch(err => {
        debug('register_user_error', err)
        res.json({success:false})
    })
}

function change_password(req, res) {
  var user_info = {
	  name : req.body.name,
//	  password : req.body.password,
//	  new_password : req.body.new_password,
//	  confirm_password : req.body.confirm_password
  }
    db_service.user_findOne(user_info)
      .then(user => {
         user.compare_password(req.body.password)
           .then(function() {
		   console.log("updating password, server side")
		   res.json({ success: true, message: 'Updated password' });
	     user.update_field({password: req.body.new_password})
	    })
            .catch(function() {
		    console.log("wrong password, server side")
		   res.json({ success: false, message: 'password incorrect' });
	   })
    })
    .catch(err => {
      res.json({success:false})
    })
}
function login_user(req, res) {
    var user_info = {
        name : req.body.name,
    }
    console.log(user_info)
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
                        friends: user.friends,
                        conversations: user.conversations
                    }
                });
                realtime_serv.add_whom_to_notify(user._id, user.friends)
            })
            .catch(function() {
                res.json({ success: false, message: 'Incorrect password.' });
            })
        }
    })
    .catch(err => {
        res.json({success:false})
    })
}
module.exports = router
