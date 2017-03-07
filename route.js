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
var update_field = db_service.update_field
var compare_password = db_service.compare_password

router.post('/login', login_user)
router.post('/register', register_user)
router.post('/send_password', send_password)
router.post('/api/v1/add_friend', add_friend)
router.post('/api/v1/delete_friend', delete_friend)

router.post('/api/v1/get_friends_info', get_friends_info)
router.post('/api/v1/cancel_friend_request', cancel_friend_request)
router.post('/api/v1/add_conversation', add_conversation)
router.post('/api/v1/comfirm_friend_request', comfirm_friend_request)
router.post('/api/v1/refuse_friend', refuse_friend)
// router.post('/api/v1/get_id_info', get_id_info)

router.post('/change_password', change_password)

function delete_friend(req, res) {
    var my_id = req.self._id
    var to_be_deleted_friend_id = req.body.friend_id
    var self_action = db_service.User.update(
        {_id:my_id},
        {
            '$pull': {friends: to_be_deleted_friend_id},
        }
    )
    var friend_action = db_service.User.update(
        {_id:to_be_deleted_friend_id},
        {
            '$pull': {friends:my_id},
            '$set': {_comment: JSON.stringify({event_name:"del_friend", content: {friend_id: my_id}})}

        }
    )
    Promise.all([
        self_action.lean().exec(),
        friend_action.lean().exec()
    ]).then(result => {
        res.json({success:true})
    }).catch(err => {
        res.json({success:false})
    })
}
function comfirm_friend_request(req, res) {
    var my_id = req.self._id
    var to_be_comfimed_friend_id = req.body.friend_id
    var self_action = db_service.User.update(
        {_id:my_id},
        {
          '$pull': {pending_friends:to_be_comfimed_friend_id},
          '$push': {friends: to_be_comfimed_friend_id},
        }
    )
    var friend_action = db_service.User.update(
        {_id:to_be_comfimed_friend_id},
        {
            '$pull': {friend_requests:my_id},
            '$push': {friends: my_id},
            '$set': {_comment: JSON.stringify({event_name:"add_friend", content:{friend_id: my_id}})}
        }
    )
    Promise.all([
        self_action.lean().exec(),
        friend_action.lean().exec(),
        db_service.user_findOne(
            {_id:to_be_comfimed_friend_id},
            {
                __v:0,
                friends:0,
                password:0,
                conversations:0,
                pending_friends: 0,
                friend_requests: 0
            }
        )
    ]).then(result => {
        debug('confirm_friend_request', result)
        // realtime_serv.add_whom_to_notify(req.self._id, [req.body.friend_id])
        // realtime_serv.add_whom_to_notify(req.body.friend_id, [req.self._id])
        res.json({success:true, friend_info:result[2]})
    }).catch(err => {
        res.json({success:false})
    })
}

function refuse_friend(req, res) {
    var my_id = req.self._id
    var to_be_refused_friend_id = req.body.friend_id
    var self_action = db_service.User.update(
        {_id:my_id},
        {
          '$pull': {pending_friends:to_be_refused_friend_id},
        }
    )
    var friend_action = db_service.User.update(
        {_id:to_be_refused_friend_id},
        {
            '$pull': {friend_requests:my_id},
            '$set': {_comment: JSON.stringify({event_name:"refuse_friend_request", content:{friend_id: my_id}})}
        }
    )
    Promise.all([
        self_action.lean().exec(),
        friend_action.lean().exec()
    ]).then(result => {
        res.json({success:true})
    }).catch(e => {
        res.json({success:false})
    })

}

function cancel_friend_request(req, res) {
    var my_id = req.self._id
    var to_be_canceled_friend_id = req.body.friend_id
    debug('cancel_friend_request', {my_id: my_id, to_be_cancel: to_be_canceled_friend_id})
    var self_delete = db_service.User.update(
        {_id:my_id},
        {
            '$pull': {friend_requests:to_be_canceled_friend_id}
        }
    )
    var friend_delete = db_service.User.update(
        {_id:to_be_canceled_friend_id},
        {
            '$pull': {pending_friends:my_id},
            '$set': {_comment: JSON.stringify({event_name:"del_pending_friends", content: {friend_id:my_id}})}

        }
    )
    Promise.all([
        self_delete.lean().exec(),
        friend_delete.lean().exec()
    ])
    .then(result => {
        // debug('cancel_friend_request_query_result', res)
        res.json({success:true})
    })
    .catch(e => {
        res.json({success:false})
        debug('cancel_friend_request_error', e)
    })

}
function get_friends_info(req, res) {
    db_service.user_find_many('_id', req.body.friends,
        {
            __v:0,
            friends:0,
            password:0,
            conversations:0,
            pending_friends: 0,
            friend_requests: 0
        }
    )
    .then(friends => {
        res.json({success:true, friends: friends})
    })
    .catch(err => {
        res.json({success:false})
    })
}

// function get_id_info(req, res) {
//     db_service.user_findOne({_id:req.body},
//         {
//             __v:0,
//             friends:0,
//             password:0,
//             conversations:0,
//             pending_friends: 0,
//             friend_requests: 0
//         }
//     ).then(user_info => {
//         if (user_info) {
//             res.json({success:true, user_info: user_info})
//         } else {
//             res.json({success:false})
//         }
//     })
// }

function add_conversation(req, res) {
    var self_id = req.self._id
    var participants = req.body
    participants.push(self_id)
    var name = crypto.createHash('md5').update(participants.sort().join('')).digest('hex')

    var query = db_service.Conversation.findOne({name:name})
    query.lean().exec()
    .then(conversation => {
        if (conversation) {
            res.json({success:false})
        } else {
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
    })
}


function add_friend(req, res) {
    Promise.all([
        db_service.user_findOne({_id:req.self._id},
            {
                __v:0,
                friends:0,
                password:0,
                conversations:0,
                pending_friends: 0,
                friend_requests: 0
            }
        ),
        db_service.user_findOne({name:req.body.name},
            {
                __v:0,
                friends:0,
                password:0,
                conversations:0,
                pending_friends: 0,
                friend_requests: 0
            }

        )
    ]).then(vals => {
        var user = vals[0]
        var to_be_friend = vals[1]
        if (!user || !to_be_friend) {
            //Should be impossible
            res.json({success: false, message: "you or your friend doesn not exist"})
        } else {
            user.add_friend(to_be_friend._id, user)
            .then(() => {
                res.json({success: true, to_be_friend: to_be_friend})
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
            // user.update_field({password: new_password})
            update_field(user, {password: new_password})
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
                        _id: result._id,
                        email: new_user.email,
                        first_name: new_user.first_name,
                        last_name: new_user.last_name,
                        name: new_user.name,
                        friends: [],
                        conversations: [],
                        pending_friends: [],
                        friend_requests: [],
                        token_allocation: result.token_allocation
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
        compare_password(user, req.body.password)
         // user.compare_password(req.body.password)
           .then(function() {
            debug('change_password', "updating password")
		    res.json({ success: true, message: 'Updated password' });
	     // user.update_field({password: req.body.new_password})
         update_field(user, {password: req.body.new_password})
	    })
        .catch(function() {
            debug('change_password', "wrong password")
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
    debug('login_user', user_info)
    db_service.user_findOne(user_info, {})
    .then(user => {
        debug('login_user', user)
        if (!user) {
            res.json({ success: false, message: 'User not found.' });
        } else {
            compare_password(user, req.body.password)
            // user.compare_password(req.body.password)
            .then(function() {
                var token = jwt.sign({_id:user._id}, config.secret, {
                    expiresIn: 172800
                })
                res.json({
                    success: true,
                    token: token,
                    user_info: {
                        _id: user._id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        name: user.name,
                        friends: user.friends,
                        conversations: user.conversations,
                        pending_friends: user.pending_friends,
                        friend_requests: user.friend_requests,
                        token_allocation: user.token_allocation
                    }
                });
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
