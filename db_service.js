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
                conversations: [String]
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
                last_update: Date
})

user_schema.pre('save', function(next) {
    var user = this;
    user.password = hash_pwd(user.password);
    user.online = false;
    user.friends = [];
    user.conversations = [];
    next();
})

user_schema.methods.compare_password = function(candidate) {
    match = hash_pwd(candidate) == this.password;
    if (match) {
        return Promise.resolve(match);
    }
    return Promise.reject(match);

}

user_schema.methods.update_field = function(key_value_pair) {
    if (key_value_pair.password) {
        key_value_pair.password = hash_pwd(key_value_pair.password)
    }
    User.update({_id:this._id}, key_value_pair, (err, affected) => {
        debug(["update_field", JSON.stringify(key_value_pair)].join(' '), err)
    })
}

user_schema.methods.add_friend = function(fiend_id) {
    var my_id = this._id
    var add_self_friend_request = User.update({_id:my_id},
                {$push:{friend_requests:fiend_id}})
    var add_friend_pending = User.update({_id:fiend_id},
                {$push:{pending_friends:my_id}})
    return Promise.all([
        add_self_friend_request.exec(),
        add_friend_pending.exec()
    ])


}

var User = mongoose.model('User', user_schema);
var Conversation = mongoose.model('Conversation', conversation);

mongoose.connect(config.db_connect_string);

//TODO: add settings to user_findOne to limit the return field
function user_findOne(obj, settings) {
    if(obj.password) {
        obj.password = hash_pwd(obj.password)
    }
    var query = User.findOne(obj, settings || {})
    debug('user_findOne', obj)
    return query.exec().catch(db_error_logger)
}

function user_find_many(field, vals, settings) {
    var query_json = {}
    query_json[field] = {$in:vals}
    var query = User.find(query_json, settings || {})
    return query.exec().catch(db_error_logger)
}


function hash_pwd(pwd) {
    return crypto.createHmac('sha256', config.salt)
                 .update(pwd)
                 .digest('Base64')
}

module.exports = {
    mongoose : mongoose,
    User : User,
    user_findOne : user_findOne,
    user_find_many: user_find_many,
    Conversation: Conversation
}