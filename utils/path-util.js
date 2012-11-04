var path = require('path'),
    config = require('../config');

exports.getFilePathArr = function(query) {
    //query = query.charAt(0) === '?' ? query.substring(1) : query;
    return query.split(config.delimiter).map(function(item, index, arr) {
        if (item.substring(0, 2) == 'a:') {
            var divider = item.indexOf('/');
            divider < 2 && (divider = item.length);
            return path.resolve(config.alias[item.substring(2, divider)], item.substring(divider+1));
        }
        return path.resolve(config.basePath, item);
    });
}
