"use strict";
//var _roostSW = {version: 1, logging: true, appKey:"6ryd970rm3m3e2d7erxvbnktnkzbt62k", host: "http://localhost:8081", baseURL: "http://localhost:8081"};

var _roostSW = {
    version: 1,
    logging: true,
    appKey: "6ryd970rm3m3e2d7erxvbnktnkzbt62k",
    host: "https://go.goroost.com"
};

self.addEventListener('install', function(evt) {
    //Automatically take over the previous worker.
    evt.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(evt) {
    if (_roostSW.logging) console.log("Activated Roost ServiceWorker version: " + _roostSW.version);
});

//Handle the push received event.
self.addEventListener('push', function(evt) {
    if (_roostSW.logging) console.log("push listener", evt);
    evt.waitUntil(self.registration.pushManager.getSubscription().then(function(subscription) {
        return fetch(_roostSW.host + "/api/browser/notifications?version=" + _roostSW.version + "&appKey=" + _roostSW.appKey + "&deviceID=" + subscription.subscriptionId).then(function(response) {
            return response.json().then(function(json) {
                if (_roostSW.logging) console.log(json);
                var promises = [];
                for (var i = 0; i < json.notifications.length; i++) {
                    var note = json.notifications[i];
                    if (_roostSW.logging) console.log("Showing notification: " + note.body);
                    var url = "/roost.html?noteID=" + note.roost_note_id + "&sendID=" + note.roost_send_id + "&body=" + encodeURIComponent(note.body);
                    promises.push(showNotification(note.title, note.body, url, _roostSW.appKey));
                }
                return Promise.all(promises);
            });
        });
    }));
});

self.addEventListener('notificationclick', function(evt) {
    if (_roostSW.logging) console.log("notificationclick listener", evt);
    evt.waitUntil(handleNotificationClick(evt));
});

function parseQueryString(queryString) {
    var qd = {};
    queryString.split("&").forEach(function (item) {
        var parts = item.split("=");
        var k = parts[0];
        var v = decodeURIComponent(parts[1]);
        (k in qd) ? qd[k].push(v) : qd[k] = [v, ]
    });
    return qd;
}

//Utility function to handle the click
function handleNotificationClick(evt) {
    if (_roostSW.logging) console.log("Notification clicked: ", evt.notification);
    evt.notification.close();
    var iconURL = evt.notification.icon;
    if (iconURL.indexOf("?") > -1) {
        var queryString = iconURL.split("?")[1];
        var query = parseQueryString(queryString);
        if (query.url && query.url.length == 1) {
            if (_roostSW.logging) console.log("Opening URL: " + query.url[0]);
            return clients.openWindow(query.url[0]);
        }
    }
    console.log("Failed to redirect to notification for iconURL: " + iconURL);
}

//Utility function to actually show the notification.
function showNotification(title, body, url, appKey) {
    var options = {
        body: body,
        tag: "roost",
        icon: _roostSW.host + '/api/browser/logo?size=100&direct=true&appKey=' + _roostSW.appKey + '&url=' + encodeURIComponent(url)
    };
    return self.registration.showNotification(title, options);
}