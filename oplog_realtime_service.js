var config        = require('./config/config')
var MongoOplog    = require('mongo-oplog')
var oplog         = MongoOplog(config.oplog_connect_string)
var debug         = require('./log_service').debug


//dictionary of sockets
var client_sock_list = {}
var client_friend_list = {}

// Right now I cannot find a satisfying way for monitering this whom_to_notify
// dict
var whom_to_notify = {}

// oplog.tail()

oplog.on('update', doc => {
    debug('oplog-update', doc)
    to_notify = whom_to_notify[doc.o2._id]
    debug('oplog-update-to_notify', to_notify)
    debug('oplog-update-client_socket_list', Object.keys(client_sock_list))

    if(to_notify) {
        //THere are people on this server that is worth getting notified when shit happens to doc.o2._id
        var event_info = event_extractor(doc)
        to_notify.forEach(to_be_notified_user => {
            if (to_be_notified_user in client_sock_list) {
                client_sock_list[to_be_notified_user].emit(event_info.event_name, event_info.content)
            }
        })
    }
})

function event_extractor(doc) {
    var o = doc.o
    if (doc.ns === "team_fit_test.users") {
        if (o) {
            var set = doc.o['$set']
            if(set) {
                if ('online' in set) {
                    return {event_name: 'friends_on_off_line', content: {_id:doc.o2._id, online:set.online}}
                }
            }
        }
    } else if (doc.ns === "team_fit_test.conversations") {
        if (o) {
            // debug('conversations', doc)
        }
    }

}

function add_to_watch_list(name, socket) {
    client_sock_list[name] = socket
}
function delete_user_from_watch(name) {
    delete client_sock_list[name]
    if (name in client_friend_list) {
        client_friend_list[name].forEach(friend => {
            if (whom_to_notify[friend]) {
                whom_to_notify[friend].delete(name)
            }
        })
    }
    delete client_friend_list[name]
}

function add_whom_to_notify(name, friends) {
    client_friend_list[name] = friends || []
    friends.forEach(friend => {
        if (whom_to_notify[friend]) {
            whom_to_notify[friend].add(name)
        } else {
            whom_to_notify[friend] = new Set()
            whom_to_notify[friend].add(name)
        }
    })
    debug('add_whom_to_notify_notify', whom_to_notify)
}

function start_watching() {
    oplog.tail()
}
module.exports = {
    add_to_watch_list: add_to_watch_list,
    delete_user_from_watch: delete_user_from_watch,
    add_whom_to_notify: add_whom_to_notify,
    start_watching: start_watching
}

