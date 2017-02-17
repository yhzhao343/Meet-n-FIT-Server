var morgan = require('morgan');
var config = require('./config/config');
var fs = require('fs');

var path = config.log_path;
var morgan_logger
var error_logger_gen
var debug
if (path) {
    var app_log_stream = fs.createWriteStream(path, {flags: 'a'});
    morgan_logger = morgan(config.morgan_mode, {stream: app_log_stream})
    error_logger_gen = function(type, err_handle, extra_msg) {
        return function(err) {
            var error_msg = ['@', type, ' ERROR :', extra_msg, '\n', JSON.stringify(err)].join('')
            app_log_stream.write(error_msg)
            throw err
        }
    }
    debug = function(type, debug_info) {
        if(typeof debug_info !== 'string') {
            debug_info = JSON.stringify(debug_info)
        }
        var debug_msg = ['@', type, ' DEBUG :', debug_info, '\n'].join('')
        app_log_stream.write(debug_msg)
    }
} else {
    morgan_logger = morgan(config.morgan_mode)
    error_logger_gen = function(type, err_handle, extra_msg) {
        return function(err) {
            err_handle(err)
            var error_msg = ['@', type, ' ERROR :', extra_msg, '\n', JSON.stringify(err)].join('')
            console.log(error_msg)
            throw err
        }
    }
    debug = function(type, debug_info) {
        if(typeof debug_info !== 'string') {
            debug_info = JSON.stringify(debug_info)
        }
        var debug_msg = ['@', type, ' DEBUG :', debug_info, '\n'].join('')
        console.log(debug_msg)
    }
}

module.exports = {
    morgan_logger : morgan_logger,
    error_logger_gen : error_logger_gen,
    debug : debug
}


