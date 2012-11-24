var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    compressor = require('yuicompressor'),
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
        MIMES = {
            'js': 'application/javascript',
            'css': 'text/css'
        },
        status = null,
        proxy = new EventProxy();

    var paths = option.paths || [],
        files = []; // [{hasCompressed: Boolean, data: Buffer}]

    this.MIME = null;
    this.getStatus = function() {
        return status;
    };

    this.add = function(path) {
        if (status <= STATUS_FLAG.ADD) {
            if (typeof path == 'string') {
                paths.push(path);
            } else {
                paths = paths.concat(path);
            }
        } else {
            //status = STATUS_FLAG.ERROR;
            //throw Error('File can not be added now.');
        }
    };

    var _this = this;
    this.merge = function(toCompress, callback) {
        if (typeof toCompress == 'function') {
            callback = toCompress;
            toCompress = option.compress;
        }

        if (option.ext) {
            _this.MIME = MIMES[option.ext];
        } else {
            // 根据第一个文件的后缀决定文件类型
            _this.MIME = MIMES[paths[0].substring(paths[0].lastIndexOf('.') + 1)];
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

        // 压缩 这里会压缩已经读取到内存的那些文件
        if (toCompress) {
            proxy.after('fileCompress', paths.length, function () {
                proxy.emit('compressReady');
            });

            for (var i in files) {
                if (files[i].hasCompressed) {
                    proxy.emit('fileCompress');
                } else {
                    (function(index) {
                        compressor.compress(files[index].data.toString(), function(err, data) {
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
                            files[index] = {
                                hasCompressed: false,
                                data: data // [object Buffer]
                            };
                            // 压缩 这里压缩刚读取到内存的文件
                            if (toCompress) {
                                compressor.compress(files[index].data.toString(), function(err, data) {
                                    files[index].data = data;
                                    files[index].hasCompressed = true;
                                    proxy.emit('fileCompress');
                                });
                            }
                            proxy.emit('fileRead');
                        } else {
                            callback({ code: 404, msg: 'File not found'});
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
