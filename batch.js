var fs = require('fs'),
    path = require('path'),
    config = require('./config'),
    batchConfig = require('./batch-config'),
    FileMerger = require('./utils/FileMerger'),
    pathUtil = require('./utils/path-util'),
    fileDep = batchConfig.fileDep,
    basePath = batchConfig.basePath,
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
    var deps = getDepInSeq(mod),
        depUriArr = [],
        uri,
        pathArr,
        merger;
    for (var i = 0, l = deps.length; i < l; ++i) {
        uri = fileDep[deps[i]];
        isArray(uri) && (uri = uri[0]);
        !!uri && depUriArr.push(uri);
    }
    pathArr = pathUtil.getFilePathArr(depUriArr.join(','));
    merger = new FileMerger({
        paths: pathArr,
    });
    console.log('==> 开始压缩' + fileName + '.js，依赖：' + deps.toString());
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

/**
 * 获得模块依赖数组
 * 优先级越高序号越小
 */
function getDepInSeq(mod) {
    var depTree = getDepTree(mod),
        arrSort = [],
        level,
        result = [];
    for (var i in depTree) {
        level = depTree[i].level - 1;
        arrSort[level] || (arrSort[level] = []);
        arrSort[level].push(i);
    }
    for (var l = arrSort.length - 1; l >= 0; l--) {
        result = result.concat(arrSort[l]);
    }
    return result;
}

/**
 * 1、根节点，设置level为1
 * 2、进入下个节点，如果之前已经访问过该节点且节点level比过来的节点level小，则重设level为过来节点level加1；没访问过，则直接过来节点level加1
 *  root = {
 *      mod1Name: {
 *          level: 1,
 *          next: ['mod2Name', 'mod3Name']
 *      },
 *      mod2Name: {
 *          level: 2
 *      },
 *      mod3Name: {
 *          level: 2
 *      }
 *  }
 */
function getDepTree(mod, root, level) {
    var chain = fileDep[mod];
    if (!chain) {
        console.error('ERROR: module "' + mod + '" not found');
        return;
    }
    root = root || {};
    level = level || 1;
    // 如果该模块之前已访问过，则视情况调整其level，并递归调整其之后的节点
    if (root[mod] && root[mod].level < level) {
        root[mod].level = level;
        if (root[mod].next) {
            for (var i = 0, l = root[mod].next.length; i < l; ++i) {
                getDepTree(root[mod].next[i], root, level + 1);
            }
        }
    } else {
        root[mod] = {
            level: level
        };
        if (isArray(chain)) {
            root[mod].next = chain.slice(1);
            for (var i = 0, l = root[mod].next.length; i < l; ++i) {
                getDepTree(root[mod].next[i], root, level + 1);
            }
        }
    }
    return root;
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
