var pathCtrl = require('../utils/path-util'),
    path = require('path'),
    FileMerger = require('../utils/FileMerger'),
    config = require('../config');

// 配置信息初始化
!config.delimiter && (config.delimiter = ',');
!config.basePath && (config.basePath = path.resolve('.'));

console.log(config);

console.log(pathCtrl.getFilePathArr('a/a.js,b/b.js,a:s/haha/a.js'));
console.log(pathCtrl.getFilePathArr('/home/a/a.js,b/b.js,s/haha/a.js'));
console.log(pathCtrl.getFilePathArr('a/a.js,../b/b.js,s/haha/a.js'));
console.log(pathCtrl.getFilePathArr('a/a.js,b/b.js,s/haha/a.js,test'));

var merger = new FileMerger();
merger.add(pathCtrl.getFilePathArr('README.md,utils/path-util.js'));
merger.merge(function(err, result) {
    console.log(result);
});
