var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    config = require('./config'),
    FileMerger = require('./utils/FileMerger'),
    pathUtil = require('./utils/path-util');

// 配置信息初始化
!config.delimiter && (config.delimiter = ',');
!config.basePath && (config.basePath = path.resolve('./files/'));

exports.handler = function(req, res) {
    var query = url.parse(req.url, true).query;

    if (!query.path) {
        throw { res: res, code: 400, msg: '"path" argument is needed' };
    }

    var pathArr = pathUtil.getFilePathArr(query.path);
    if (pathArr instanceof Error) {
        throw { res: res, code: 400, msg: pathArr.message };
    }

    var merger = new FileMerger({
        paths: pathArr
    });

    merger.merge(function(err, result) {
        if (err) {
            throw {res: res, code:err.code, msg: err.msg}
        }
        res.writeHead(200, {
            'Content-Type': merger.MIME
        });
        res.end(result);
    });
};
