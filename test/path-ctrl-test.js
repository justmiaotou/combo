var pathCtrl = require('../utils/path-util');

console.log(pathCtrl.getFilePathArr('?a/a.js,b/b.js,a:s/haha/a.js'));
console.log(pathCtrl.getFilePathArr('?/home/a/a.js,../b/b.js,a:s/haha/a.js'));
