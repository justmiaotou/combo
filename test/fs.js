var fs = require('fs');

/*fs.stat('./tmp.file', function(err, stat) {
    console.log(stat);
});

fs.linkSync('./tmp.file', './tmp.link', function(e) { });

fs.lstat('./tmp.link', function(err, stat) {
    console.log(stat);
});*/

//fs.unlink('./tmp.file');

/*fs.readlink('./tmp.link', function(err, link) {
    console.log('1:'+link);
});
fs.realpath('./tmp.link', function(err, link) {
    console.log('2:'+link);
});
fs.readlink('./tmp.file', function(err, link) {
    console.log('3:'+link);
});
fs.realpath('./tmp.file', function(err, link) {
    console.log('4:'+link);
});*/

//fs.mkdir('fs-test');
//fs.stat('fs-test', function(err, stat) {console.log(stat)});
//fs.rmdir('fs-test', function(err) {});

//fs.readdir('../test', function(err, files) {console.log(files)});

//fs.open('tmp.file', 'a+', function(err, fd) {
//    if (!err) {
//        fs.write(fd, /*new Buffer('\nHello World')*/'\nHello World', null, null, null, function(err, written, buffer) {
//            console.log(written);
//        });
//    }
//});

/*fs.readFile('tmp.file', function(err, buffer) {
    console.log(buffer.toString());
});*/

//fs.writeFile('tmp.link', 'Hey Memo', function(err) {});
//fs.appendFile('tmp.link', '\nDon\'t cover!');

/*fs.open('6.jpg', 'r+', function(err, fd) {
    var buf = new Buffer(64000);
    fs.read(fd, buf, 0, fs.statSync('6.jpg').size, 0, function(err, bytesRead, buffer) {
        for (var i = 0; i < bytesRead; ++i) {
            buffer.writeUInt8(255 - buffer.readUInt8(i), i);
        }
        fs.write(fd, buffer, 0, bytesRead, 0, function(err, written, buffer) {
            console.log(written);
            fs.close(fd);
        });
    });
});*/

fs.readFile('D:\\nodejs\\combo\\README.md', function(err, data) {
    console.log(data.toString());
});
