// SETUP2

var http = require('http'),
    fs = require('fs');

var https = require('https');

var server = http.createServer(function (req, res) {
    console.log("Request for: ", req.url);
    switch (req.url) {
        case '/':
            fs.readFile('./index.html', function(error, data) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data, 'utf-8');
            });
            break;
        case '/css/index.css':
            fs.readFile('./index.css', function(error, data) {
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data, 'utf-8');
            });
            break;
    }

}).listen(3030, "127.0.0.1");

console.log('Server running at http://127.0.0.1:3030/');

// The above lines of code basically set up a local server for us to access.

var io = require('socket.io').listen(server);


var chat_history = '';
var users_connected = {};
var valid_credentials = {"wyatt":"me","alex":"jacket","andrew":"look"};

var connected_permissions = {}

// HERE'S THE RELEVANT STUFF...

// SECOND, we set a listener to see when someone connects to our web page...
io.sockets.on('connection', function(socket) {
    // logged_in = false;
    // console.log(logged_in);
    console.log('New connection made...');

    connected_permissions[socket.id] = false;
    console.log(connected_permissions);

    socket.emit('server_connected');

    socket.on('disconnect', function() {
        console.log(socket.id);
        var disconnecting_user = users_connected[socket.id];
        delete users_connected[socket.id]
        var allUsers = '';

        for (var key in users_connected) {
            console.log(users_connected[key]);
            allUsers += users_connected[key] + "<br>";
        }
        chat_history += "<b>" + "user " + disconnecting_user + " has disconnected." + "<b>" + "<br>";
        io.sockets.emit('user disconnected', chat_history);
        io.sockets.emit('usernames', allUsers);      

    });
    socket.on('new_message_sent', function(new_message) {
        if (connected_permissions[socket.id]) {
            console.log(new_message);
            chat_history += new_message + "<br>";

            // io.sockets.emit('message_update', new_message);
            console.log(connected_permissions);
            for (var id in connected_permissions) {
                if (connected_permissions[id]) {
                    io.to(id).emit('message_update', new_message);
                }
            }
        }
    });
    socket.on("username_set", function(credentials) {

        // credentials[0]
        // credentials[1]

        // credentials = ["wyatt", "me2"]

        var username = credentials[0];
        var password = credentials[1];

        if (valid_credentials[username] == password) {
            users_connected[socket.id] = username;
            var allUsers = '';

            for (var key in users_connected) {
                console.log(users_connected[key]);
                allUsers += users_connected[key] + "<br>";
            }

            socket.emit('history_found', chat_history);
            io.sockets.emit('usernames', allUsers);           
            socket.emit('loginsucces');
            connected_permissions[socket.id] = true;

            // console.log(socket.id);
            // console.log(logged_in);

        } else {

            socket.emit('login_failed');

        }

        // console.log(user_val);
        // console.log(socket.id);
        // console.log(users_connected);

    });
});