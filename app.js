var http = require('http'),
    Combo = require('./index'),
    config = require('./config');

var port = 8888; // default

if (process.argv.length > 2) {
    port = process.argv[2];
}

// 统一处理异常
process.on('uncaughtException', function(err) {
    console.error(err);
    if (err.res) {
        err.res.writeHead(err.code, {
            'Content-Type': 'text/html'
        });
        err.res.end('<h1 style="font-size:50px;">' + err.code + '</h1><p style="font-size:30px">' + err.msg + '</p>');
    }
});

console.log('Combo Service Start(port:' + port + ')');

http.createServer((new Combo()).handler).listen(port);
