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
                friends: [String]
            }, {capped: true, size: 4096});

user_schema.pre('save', function(next) {
    var user = this;
    user.password = hash_pwd(user.password);
    user.online = false;
    user.friends = []
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

user_schema.methods.add_friend = function(fiend_name) {
    var my_id = this._id
    return new Promise(function(resolve, reject) {
        User.update({_id:my_id},
                    {$push:{friends:fiend_name}},
                    (err, affected) => {
                        // debug('add_friend', this._id)
                        if (err) {
                            reject(err)
                        } else {
                            resolve()
                        }
                    })
    })


}

var User = mongoose.model('User', user_schema);

mongoose.connect(config.db_connect_string);

function user_findOne(obj) {
    if(obj.password) {
        obj.password = hash_pwd(obj.password)
    }
    var query = User.findOne(obj)
    debug('user_findOne', obj)
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
    user_findOne : user_findOne
}