var fs = require('fs'),
    path = require('path'),
    EventProxy = require('eventproxy');

module.exports = FileMerger;

/**
 * option = {
 *      paths: [],
 *      compress: Boolean,
 *      ext: 'js' || 'css'
 * }
 *
 * this.add()
 * this.compress()
 * this.merge()
 * this.end()
 *
 * this.auto() // add -> compress -> merge -> end
 */
function FileMerger(option) {
    !option && (option = {});
    var STATUS_FLAG = {
            INIT: 1,
            ADD: 2,
            COMPRESSING: 3,
            COMPRESS_FINISHED:4,
            MERGING: 5,
            MERGE_FINISHED: 6,
            ERROR: 0
        },
        status = null,
        proxy = new EventProxy();

    var paths = option.paths || [],
        files = []; // [{hasCompressed: Boolean, data: Buffer}]

    this.getStatus = function() {
        return status;
    };

    this.add = function(path) {
        if (status <= STATUS_FLAG.ADD) {
            if (typeof path == 'string') {
                paths.push(path);
            } else {
                console.log(path);
                paths = paths.concat(path);
                console.log(paths);
            }
        } else {
            //status = STATUS_FLAG.ERROR;
            throw Error('File can not be added now.');
        }
    };

    this.compress = function() {};

    this.merge = function(toCompress, callback) {
        var _this = this;

        if (typeof toCompress == 'function') {
            callback = toCompress;
            toCompress = false;
        }

        // 状态
        status = STATUS_FLAG.MERGING;

        // 文件读取、压缩完毕，可以进行合并
        proxy.assign('filesReady', 'compressReady', function() {
            var result = '';
            for (var i = 0, l = files.length; i < l; ++i) {
                result += files[i].data.toString();
            }

            callback(null, result);
        });

        // 压缩
        if (toCompress) {
            proxy.after('fileCompress', paths.length, function () {
                proxy.emit('compressReady');
            });

            for (var i in files) {
                if (files[i].hasCompressed) {
                    proxy.emit('fileCompress');
                } else {
                    (function(index) {
                        _this.compress(files[index].data, function(err, data) {
                            files[index].data = data;
                            files[index].hasCompressed = true;
                            proxy.emit('fileCompress');
                        });
                    })(i);
                }
            }
        } else {
            proxy.emit('compressReady');
        }

        // 文件全部读取到内存，并触发filesReady事件
        if (files.length != paths.length) {
            proxy.after('fileRead', paths.length - files.length, function () {
                proxy.emit('filesReady');
            })
            for (var s = files.length, e = paths.length; s < e; ++s) {
                (function(index) {
                    fs.readFile(paths[index], function(err, data) {
                        if (!err) {
                            proxy.emit('fileRead');
                            files[index] = {
                                hasCompressed: false,
                                data: data // [object Buffer]
                            };
                            if (toCompress) {
                                _this.compress(files[index].data, function(err, data) {
                                    files[index].data = data;
                                    files[index].hasCompressed = true;
                                    proxy.emit('fileCompress');
                                });
                            }
                        }
                    });
                })(s);
            }
        } else {
            proxy.emit('filesReady');
        }

    }

    this.auto = function() {};
}