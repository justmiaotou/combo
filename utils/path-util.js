var path = require('path'),
    config = require('../config'),
    batchConfig = require('../batch-config'),
    fileDep = batchConfig.fileDep,
    basePath = batchConfig.basePath;

exports.getFilePathArr = getFilePathArr;

function getFilePathArr(query) {
    var pathArr =  null;
    
    try {
        pathArr = query.split(config.delimiter).map(function(item, index, arr) {
            var divider = item.indexOf('/');
            // 路径不允许出现'..'，并且第一个字符不能是'/'（即不能指向根路径）
            if (~item.indexOf('..') || divider == 0) {
                throw Error('Path error:' + item);
            }
            switch (item.substring(0, 2)) {
                case 'a:':
                    var alias = config.alias[item.substring(2, divider)];
                    // 不能根路径，且alias路径必须存在
                    if (divider < 3 || !alias) {
                        throw Error('Alias path is invalid:' + item);
                    }
                    return path.resolve(alias, item.substring(divider + 1));
                case 'm:':
                    var modName = item.substring(2);
                    if (!fileDep[modName]) {
                        throw Error('Module "' + modName + '" is not found');
                    }
                    var deps = getDepInSeq(modName),
                        depUriArr = [],
                        uri;
                    for (var i = 0, l = deps.length; i < l; ++i) {
                        uri = fileDep[deps[i]];
                        Array.isArray(uri) && (uri = uri[0]);
                        !!uri && depUriArr.push(uri);
                    }
                    return getFilePathArr(depUriArr.join(','));
            }
            return path.resolve(config.basePath, item);
        });
    } catch(e) {
        return e;
    };

    return flatten(pathArr);
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
        if (Array.isArray(chain)) {
            root[mod].next = chain.slice(1);
            for (var i = 0, l = root[mod].next.length; i < l; ++i) {
                getDepTree(root[mod].next[i], root, level + 1);
            }
        }
    }
    return root;
}

function flatten(arr) {
    var tmp = [];
    arr.forEach(function(item) {
        if (Array.isArray(item)) {
            tmp = tmp.concat(flatten(item));
        } else {
            tmp.push(item);
        }
    });
    return tmp;
}
