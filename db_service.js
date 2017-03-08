var mongoose        = require('mongoose');
var Promise         = require('bluebird')
mongoose.Promise    = Promise
var config          = require('./config/config');
var db_error_logger = require('./log_service').error_logger_gen('DB')
var crypto          = require('crypto')
var debug           = require('./log_service').debug


var Schema = mongoose.Schema;
var user_schema = new Schema({
                first_name: String,
                last_name: String,
                name: {type : String, unique: true},
                email: String,
                password: String,
                online: Boolean,
                //Your friend list
                friends: [String],
                //Friend requests pending your approval
                pending_friends:[String],
                //Your friend request
                friend_requests:[String],
                conversations: [String],

                //ugly cheating way of monitoring changes
                _comment: String,

        		token_allocation: {
        			strength: Number,
            		outdoors: Number,
            		flexibility: Number,
            		nutrition: Number,
            		endurance: Number
        		}
            })

var conversation = new Schema({
                name: {type : String, unique: true},
                // name: sort all participant's id, then concat. You
                // can only have one conversation with one group of people
                sentences :[{
                    sender: String,
                    content: String,
                    timestamp: Date
                }],
                participants: [String],
                last_update: Date,
                //ugly cheating way of monitoring changes
                _comment: String
})

var User = mongoose.model('User', user_schema);
var Conversation = mongoose.model('Conversation', conversation);
mongoose.connect(config.db_connect_string);

user_schema.pre('save', function(next) {
    var user = this;
    user.password = hash_pwd(user.password);
    user.online = false;
    user.friends = [];
    user.conversations = [];
    user.token_allocation.strength = 0
    user.token_allocation.outdoors = 0
    user.token_allocation.flexibility = 0
    user.token_allocation.nutrition = 0
    user.token_allocation.endurance = 0
    user._comment = ''
    next();
})

function compare_password(user, candidate) {
    match = hash_pwd(candidate) == user.password;
    if (match) {
        return Promise.resolve(match);
    }
    return Promise.reject(match);
}

function update_field(user, key_value_pair) {
    if(key_value_pair.password) {
        key_value_pair.password = hash_pwd(key_value_pair.password)
    }
    var query = User.update({_id:user._id}, key_value_pair)
    query.then((err, affected) => {
        debug(["update_field", JSON.stringify(key_value_pair)].join(' '), err)
    })
}

function add_friend_request(user, friend_id) {
    debug("add_friend_request called", {user:user, f_id:friend_id})
    var my_id = user._id
    var add_self_friend_request = User.update(
            {_id: my_id},
            {$push:{friend_requests:fiend_id}})

    var add_friend_pending = User.update(
            {_id:fiend_id},
            {
                $set: {
                    _comment: JSON.stringify({
                        event_name:"new_friend_request",
                        content:{friend_id: my_id, friend_info: user}
                    })
                },
                $push:{pending_friends:my_id}
            })
    debug("add friend request", {q1:add_self_friend_request, q2:add_friend_pending})
    return Promise.all([
        add_self_friend_request.exec(),
        add_friend_pending.exec()
    ])
}


function user_findOne(obj, settings) {
    if(obj.password) {
        obj.password = hash_pwd(obj.password)
    }
    var query = User.findOne(obj, settings || {})
    debug('user_findOne', obj)
    return query.lean().exec().catch(db_error_logger)
}

function user_find_many(field, vals, settings) {
    var query_json = {}
    query_json[field] = {$in:vals}
    var query = User.find(query_json, settings || {})
    return query.lean().exec().catch(db_error_logger)
}


function hash_pwd(pwd) {
    return crypto.createHmac('sha256', config.salt)
                 .update(pwd)
                 .digest('Base64')
}

module.exports = {
    // mongoose : mongoose,
    User : User,
    user_findOne : user_findOne,
    user_find_many: user_find_many,
    Conversation: Conversation,
    compare_password: compare_password,
    update_field: update_field,
}
