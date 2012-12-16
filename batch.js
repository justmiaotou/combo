var fs = require('fs'),
    path = require('path'),
    config = require('./config'),
    batchConfig = require('./batch-config'),
    FileMerger = require('./utils/FileMerger'),
    pathUtil = require('./utils/path-util'),
    dirStructure = batchConfig.dirStructure;

// 配置compressor
for (var i in batchConfig.compressorConfig) {
    if (i in config) {
        config[i] = batchConfig.compressorConfig[i];
    }
}

build(dirStructure, batchConfig.DES_PATH);

function build(target, p) {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p);
    }
    if (!fs.existsSync(path.resolve(p, 'debug'))) {
        fs.mkdirSync(path.resolve(p, 'debug')); // 保存debug版本的目录
    }
    for (var key in target) {
        if (isObject(target[key])) {
            build(target[key], path.resolve(p, key));
        } else {
            compress(target[key], key, p);
        }
    }
}

function compress(mod, fileName, des) {
    var pathArr,
        merger;
    pathArr = pathUtil.getFilePathArr('m:' + mod);
    merger = new FileMerger({
        paths: pathArr,
    });
    console.log('==> 开始压缩' + fileName + '.js');
    merger.merge(function(err, result, debugResult) {
        if (err) {
            console.error(err);
        }
        fs.exists(des, function(exists) {
            if (exists) {
                // 压缩版
                fs.writeFile(path.resolve(des , fileName + '.js'), result, 'utf-8', function (err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('==> ' + path.resolve(des, fileName) + '.js 输出完成');
                    }
                });
                // debug版，即合并非压缩版
                fs.writeFile(path.resolve(des, 'debug', fileName + '.js'), debugResult, 'utf-8', function(err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('==> ' + path.resolve(des, 'debug', fileName) + '.js 输出完成');
                    }
                });
            } else {
                console.error('path:"' + des + '" is not exists');
            }
        });
    });
}

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
