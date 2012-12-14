var fs = require('fs'),
    config = require('./config'),
    FileMerger = require('./utils/FileMerger'),
    pathUtil = require('./utils/path-util'),
    fileDep,
    dirStructure;

var LIB_PATH = 'E:\\svn\\FE\\xm\\faxmail\\electronic-signature\\js\\',
    DES_PATH = '';

config.alias = {
    'q': LIB_PATH + 'qunit',
    'b': LIB_PATH + 'base',
    'c': LIB_PATH + 'core',
    'p': LIB_PATH + 'pages',
    'w': LIB_PATH + 'widget',
    'm': LIB_PATH + 'modules'
};
config.compress = true;

// 文件路径极其依赖
// 若值为数组，则第一个元素为路径，之后的元素为依赖
fileDep = {
    /* ============ core ===========
     *  此部分模块页面默认加载，无需声明为其它模块的依赖
     */
    'core': [
        '',
        'seajs', 'sizzle', 'underscore', 'util', 'event', 'dom', 'ajax'
    ],
    'seajs': 'a:c/core-debug/sea.js',
    'sizzle': 'a:c/core-debug/sizzle.js',
    'underscore': 'a:c/core-debug/underscore.js',
    'util': 'a:c/util.js',
    'event': 'a:c/event.js',
    'dom': 'a:c/dom.js',
    'ajax': 'a:c/ajax.js',
    /* ============ widget =========== */
    'mask': 'a:w/mask.js',
    'placeholder': 'a:w/placeholder.js',
    'fileupload': 'a:w/fileupload.js',
    'pop': [
        'a:w/pop.js',
        'mask'
    ],
    /* ============ page:efax =========== */
    'efax-send': [
        'a:p/efax/send.js', 
        'efax-helper-sign-pops'
    ],
    'efax-setting': [
        'a:p/efax/setting.js', 
        'efax-helper-sign-pops'
    ],
    'efax-sign-setting': [
        'a:p/efax/sign-setting.js', 
        'efax-helper-sign-pops'
    ],
    'efax-helper-sign-pops': [
        'a:p/efax/helper/sign-pops.js',
        'pop', 'fileupload', 'placeholder'
    ]
};

// 目录结构
// 值为数组或字符串，则键为文件名，值即为其依赖的模块
// 值为字面量对象，则键为目录名
dirStructure = {
    'core': 'core',
    'efax': {
        'send': 'efax-send',
        'sign-setting': 'efax-sign-setting',
        'setting': 'efax-setting'
    }
};

compress('core', 'd:\\');

function compress(mod, des) {
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
        compress: true
    });
    merger.merge(function(err, result) {
        if (err) {
            console.error(err);
        }
        fs.exists(des, function(exists) {
            if (exists) {
                fs.writeFile(des + '/' + mod + '.js', result, 'utf-8', function (err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('==> ' + des + '/' + mod + '.js 输出完成');
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
