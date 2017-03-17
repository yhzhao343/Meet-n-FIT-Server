var config        = require('./config/config')
var MongoOplog    = require('mongo-oplog')
var debug         = require('./log_service').debug

var user_oplog    = MongoOplog(config.oplog_connect_string, {ns: 'team_fit_test.users'})
var event_oplog    = MongoOplog(config.oplog_connect_string, {ns: 'team_fit_test.events'})

//dictionary of sockets
var client_sock_list = {}
var client_friend_list = {}

// Right now I cannot find a satisfying way for monitering this whom_to_notify
// dict
var whom_to_notify = {}

// oplog.tail()

user_oplog.on('update', doc => {
    debug('user-oplog', doc)
    //This is for one-on-one actions (e.g. add,delete friend)
    if (doc.o2) {
        var to_notify = whom_to_notify[doc.o2._id]
        if(to_notify) {
            //THere are people on this server who wants to get notified when stuff happens to doc.o2._id
            var event_info = event_extractor(doc)
            to_notify.forEach(to_be_notified_user => {
                if (to_be_notified_user in client_sock_list) {
                    if (event_info) {
                        client_sock_list[to_be_notified_user].emit(event_info.event_name, event_info.content)
                    }
                }
            })
        }
    }
})

event_oplog.on('insert', doc => {
    debug('event-oplog', doc)
    var my_event = doc.o
    if (my_event) {
        var target_user_id = my_event.target_user_id
        var self_sock = client_sock_list[target_user_id]
        if (self_sock) {
            var origin_id = my_event.origin_id
            var event_name = my_event.name
            var content = JSON.parse(my_event.content)
            if (event_name == 'del_friend') {
                delete_whom_to_notify(target_user_id, [content.friend_id])
                delete_whom_to_notify(content.friend_id, [target_user_id])
            } else if (event_name == 'add_friend') {
                add_whom_to_notify(target_user_id, [content.friend_id])
                add_whom_to_notify(content.friend_id, [target_user_id])
            }
            debug('event-oplog-content', {name: event_name, origin_id: origin_id, content:content, target_user_id:target_user_id})
            self_sock.emit(my_event.name, content)
        }
    }
})

function self_event_extractor(doc) {
    var o = doc.o
    if (doc.ns === "team_fit_test.users") {
        if(o) {
            var set = o['$set']
            debug('oplog-self-action', set)
            if (set) {
               var raw_event = set['_comment']
               if(raw_event) {
                   return JSON.parse(raw_event)
               }
            }
        }
    }
}

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
    if (!client_friend_list[name]) {
        client_friend_list[name] = new Set()
    }
    (friends || []).forEach(friend => {
        client_friend_list[name].add(friend)
        if (whom_to_notify[friend]) {
            whom_to_notify[friend].add(name)
        } else {
            whom_to_notify[friend] = new Set()
            whom_to_notify[friend].add(name)
        }
    })
    // debug('add_whom_to_notify_notify', whom_to_notify)
}

function delete_whom_to_notify(name, friends) {
    (friends||[]).forEach(friend => {
        if (client_friend_list[name]) {
            client_friend_list[name].delete(friend)
        }
        if ( whom_to_notify[friend]) {
            whom_to_notify[friend].delete(name)
        }
    })
}

function start_watching() {
    user_oplog.tail()
    event_oplog.tail()
}
module.exports = {
    add_to_watch_list: add_to_watch_list,
    delete_user_from_watch: delete_user_from_watch,
    add_whom_to_notify: add_whom_to_notify,
    start_watching: start_watching
}

