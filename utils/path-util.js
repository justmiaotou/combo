var path = require('path'),
    config = require('../config'),
    error = require('./static').error;

exports.getFilePathArr = function(query) {
    var pathArr =  null;
    
    try {
        pathArr = query.split(config.delimiter).map(function(item, index, arr) {
            var divider = item.indexOf('/');
            // 路径不允许出现'..'，并且第一个字符不能是'/'（即不能指向根路径）
            if (~item.indexOf('..') || divider == 0) {
                throw Error({type: error.PATH_ERROR, msg: item});
            }
            if (item.substring(0, 2) == 'a:') {
                var alias = config.alias[item.substring(2, divider)];
                // 不能根路径，且alias路径必须存在
                if (divider < 3 || !alias) {
                    throw Error({type: error.PATH_ERROR, msg:item});
                }
                return path.resolve(alias, item.substring(divider + 1));
            }
            return path.resolve(config.basePath, item);
        });
    } catch(e) {
        return e;
    };

    return pathArr;
}
