var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    config = require('./config'),
    pathUtil = require('./utils/path-util');

// 配置信息初始化
!config.delimiter && (config.delimiter = ',');
!config.basePath && (config.basePath = path.resolve('.'));

exports.handler = function(req, res) {
    var query = url.parse(req.url, true).query;

    if (!query.path) {
        res.writeHead(400); // 'Bad Request'
        res.end();
        return;
    }

    var pathArr = pathUtil.getFilePathArr(query.path);
    if (pathArr instanceof Error) {
        res.writeHead(400); // 'Bad Request'
        res.end();
        return;
    }

    res.writeHead(200);
    res.end('<h3>Combo Test</h3>');
};
