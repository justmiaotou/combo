var http = require('http'),
    main = require('./index'),
    config = require('./config');

var server = http.createServer(main.handler);

/*server.once('connection', function(stream) {
    console.log('Once');
});

server.on('connection', function() {
    console.log('Every Time');
});
server.on('connection', function() {
    console.log('second Time');
});*/

var port = 3333; // default

if (process.argv.length > 1) {
    port = process.argv[2];
}

console.log(process.argv);

server.listen(port);
