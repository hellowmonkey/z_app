;
(function ($) {
    if (!$.os.plus) return
    var fileDoc = '_doc/',
        fileExt = '.txt',
        fileErr = ['文件写入失败: ', '文件创建失败: ', '文件获取失败: ']
        
    $.readFile = function (filename, success, error) {
        plus.io.resolveLocalFileSystemURL(filename, function (entry) {
            entry.file(function (file) {
                var fileReader = new plus.io.FileReader();
                fileReader.readAsText(file, 'utf-8');
                fileReader.onloadend = function (evt) {
                    evt.fileSize = file.size
                    evt.fileName = file.name
                    success && success(evt.target.result)
                }
            });
        }, function (e) {
            if (error) {
                error(e)
            } else {
                $.toast(fileErr[2] + e.message)
            }
        })
    }

    $.writeFile = function (path, data, cover, cb) {
        if ('function' === $.type(cover)) {
            cb = cover
            cover = true
        } else if ($.type(cover) === 'undefined') cover = true
        var paths = path.split('/')
        var filepath = ''
        var filename = ''
        for (var i = 0; i < paths.length; i++) {
            if (i < paths.length - 1) {
                filepath += paths[i] + "/"
            } else {
                filename = paths[i] + fileExt
            }
        }
        plus.io.resolveLocalFileSystemURL(fileDoc + filepath, function (entry) {
            if (entry.isDirectory) {
                entry.getFile(filename, {
                    create: true
                }, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        writer.onerror = function (e) {
                            $.toast(fileErr[0] + e.message)
                        };
                        writer.onwriteend = function () {
                            cb && cb()
                        };
                        writer.seek(cover ? 0 : writer.length);
                        writer.write(data);
                    }, function (e) {
                        $.toast(fileErr[1] + e.message);
                    });
                }, function (e) {
                    $.toast(fileErr[2] + e.message);
                });
            }
        }, function (e) {
            $.toast(fileErr[2] + e.message)
        });
    }

    $.uploadFile = function (files, url, cb, filename) {
        filename = filename || 'pic'
        var task = plus.uploader.createUpload(url, {
                method: "POST"
            },
            function (t, status) {
                if (status == 200) {
                    t.responseText = t.responseText.trim()
                    cb($.parseJSON(t.responseText));
                } else {
                    console.error("上传失败：" + status);
                }
            }
        );
        $.each(files, function (k, f) {
            var key = filename.replace('[]', '[' + k + ']')
            task.addFile(f, {
                key: key
            });
        })
        task.start();
    }
})(Zepto)