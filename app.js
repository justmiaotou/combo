var fs = require('fs'),
    http = require('http'),
    path;

var server = http.createServer(function(req, res) {
    res.end('<h1>Hello World</h1>');
});

/*server.once('connection', function(stream) {
    console.log('Once');
});*/

server.on('connection', function() {
    console.log('Every Time');
});
server.on('connection', function() {
    console.log('second Time');
});

server.listen(3000);
