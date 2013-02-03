var fs = require('fs'),
    path = require('path'),
    config = require('./config'),
    batchConfig = require('./batch-config'),
    FileMerger = require('./utils/FileMerger'),
    fileUtil = require('./utils/file-util'),
    debug = require('./utils/debug'),
    dirStructure = batchConfig.dirStructure,
    timeStamp, // 时间戳，记录各个文件上次编辑时间以及压缩模式
    tsPath = path.resolve(batchConfig.DES_PATH, 'timestamp'), // 时间戳完整文件名
    modFilePath, // 与时间戳文件比较后获得的修改过的文件地址
    compressMode;

var hasFileChanged = false;

// 配置compressor
for (var i in batchConfig.compressorConfig) {
    if (i in config) {
        config[i] = batchConfig.compressorConfig[i];
    }
}

// 设置压缩文件时使用的编码
!batchConfig.charset && (batchConfig.charset = 'utf-8');

// 如果目标路径不存在，创建之
if (!fs.existsSync(batchConfig.DES_PATH)) {
    fs.mkdirSync(batchConfig.DES_PATH);
}

// 获得时间戳对象
getTimeStamp();

compressMode = timeStamp.compress;
console.log(compressMode + ':' + config.compress);
modFilePath = getModFilePath();

for (var tmp in modFilePath) {
    hasFileChanged = true;
    break;
}

// 压缩模式不变且无文件修改，则终止
if (compressMode == config.compress && !hasFileChanged) {
    console.log('No file was changed!');
    return;
}

build(dirStructure, batchConfig.DES_PATH);

function getTimeStamp() {
    if (!fs.existsSync(tsPath)) {
        timeStamp = {};
    } else {
        try {
            timeStamp = JSON.parse(fs.readFileSync(tsPath));
            debug.log(timeStamp);
        } catch(e) {
            debug.log('no timestamp');
            timeStamp = {};
        }
    }
}

/**
 * 获得已修改过的模块数组
 */
function getModFilePath() {
    var url, stat, modTime,
        dep = batchConfig.fileDep,
        modList = {};
    for (var modName in dep) {
        if (typeof dep[modName] == 'string') {
            url = fileUtil.getFilePath(dep[modName]);
        } else {
            url = fileUtil.getFilePath(dep[modName][0]);
        }
        if (url) {
            stat = fs.statSync(url);
            modTime = (new Date(stat.mtime)).getTime();
            debug.log(modName + '\t[last mtime]:\t' + timeStamp[url] + ';\t[mtime]:\t' + modTime);
            // 1、timeStamp中存在当前文件的修改记录，且目前的修改记录比保存的要新
            // 2、不存在当前文件的修改记录
            // 这两种情况将视该文件为已修改
            if (timeStamp[url] && modTime > timeStamp[url] || !timeStamp[url]) {
                modList[url] = modTime;
                console.log('[' + url + '] has been changed at ' + (new Date(modTime)).toLocaleString());
            }
            // 修改时间戳
            timeStamp[url] = modTime;
        }
    }

    // 将修改过后的时间戳保存至文件
    timeStamp.compress = config.compress;
    fs.writeFile(tsPath, JSON.stringify(timeStamp), function(e) {
        console.error(e);
    });
    return modList;
}

function build(target, p) {
    if (!fs.existsSync(path.resolve(p, 'debug'))) {
        config.compress && fs.mkdirSync(path.resolve(p, 'debug')); // 保存debug版本的目录
    } else {
        // 若不需要压缩且残留debug文件，则删除
        !config.compress && fileUtil.rmdirSync(path.resolve(p, 'debug'));
    }

    for (var key in target) {
        // 为对象则该对象代表一个文件夹
        if (isObject(target[key])) {
            build(target[key], path.resolve(p, key));
        } else {
            // 否则为字符串，即为一个文件
            compress(target[key], key, p);
        }
    }
}

function compress(mod, fileName, des) {
    var pathArr,
        merger;
    pathArr = fileUtil.getFilePathArr('m:' + mod);
    if (compressMode == config.compress && !hasFileMod(pathArr)) {
        debug.log(mod + ' has not been modified');
        return;
    }
    merger = new FileMerger({
        paths: pathArr,
    });
    console.log('开始压缩[' + mod + ']:\t' + fileName + '.js');
    merger.merge(function(err, result, debugResult) {
        if (err) {
            console.error(err);
        }
        fs.exists(des, function(exists) {
            if (exists) {
                // 压缩版
                fs.writeFile(path.resolve(des , fileName + '.js'), result, batchConfig.charset, function (err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('==> ' + path.resolve(des, fileName) + '.js 输出完成');
                    }
                });
                // 如果没有对合并文件进行压缩，则不需要再生成debug文件
                if (config.compress !== false) {
                    // debug版，即合并非压缩版
                    fs.writeFile(path.resolve(des, 'debug', fileName + '.js'), debugResult, batchConfig.charset, function(err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('==> ' + path.resolve(des, 'debug', fileName) + '.js 输出完成');
                        }
                    });
                }
            } else {
                console.error('path:"' + des + '" is not exists');
            }
        });
    });
}

/**
 * 判断所给文件路径中是否有文件修改过
 */
function hasFileMod(pathArr){
    for (var i = 0, l = pathArr.length; i < l; i++) {
        if (pathArr[i] in modFilePath) {
            return true;
        }
    }
    return false;
}

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
