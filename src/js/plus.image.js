;
(function ($) {
    // if (!$.os.plus) return

    $.compressImage = function (images, cb) {
        if (!$.os.plus) return
        if ($.type(images) === 'string') {
            images = [{
                src: images
            }]
        }
        var count = images.length
        var ret_imgs = []
        $.each(images, function (k, item) {
            if ($.type(item) === 'string') {
                item = {
                    src: item
                }
            }
            var filename = Math.floor(Math.random() * 1000000)
            var sufarr = item.src.split('.')
            var suf = sufarr[sufarr.length - 1]
            filename = filename + '.' + suf
            var opts = {
                src: item.src,
                dst: '_doc/' + filename,
                width: $.config.image.width || '700px',
                overwrite: true
            }
            if (item.rotate) opts.rotate = item.rotate
            plus.zip.compressImage(opts, function (e) {
                ret_imgs.push(e.target)
                if (ret_imgs.length === count) {
                    cb(ret_imgs)
                }
            }, function (e) {
                console.error(e.message);
                --count
            })
        });
    }

    $.useCamera = function (cb, opts) {
        if (!$.os.plus) return
        opts = $.extend({
            multiple: true,
            filter: 'image'
        }, opts || {})
        var bts = [{
            title: "现在拍摄"
        }, {
            title: "相册选取"
        }];
        plus.nativeUI.actionSheet({
                title: opts.filter === 'image' ? '选择图片' : '选择视频',
                cancel: "取消",
                buttons: bts
            },
            function (e) {
                if (1 === e.index) {
                    //拍照
                    var cmr = plus.camera.getCamera()
                    cmr[opts.filter === 'image' ? 'captureImage' : 'startVideoCapture'](function (file) {
                        plus.io.resolveLocalFileSystemURL(file, function (entry) {
                            plus.gallery.save(file);
                            cb(entry.toLocalURL())
                        }, function (e) {
                            console.log("读取拍照文件错误：" + e.message);
                        });
                    }, function (e) {
                        console.log(e.message)
                    }, {
                        filename: '_doc/gallery/'
                    })
                } else if (2 === e.index) {
                    //相册选取
                    plus.gallery.pick(function (e) {
                        if (opts.multiple) {
                            $.each(e.files, function (k, f) {
                                cb(f);
                            })
                        } else {
                            cb(e)
                        }
                    }, function (e) {
                        console.log(e.message)
                    }, {
                        filter: opts.filter,
                        multiple: opts.multiple
                    });
                }
            }
        );
    }
})(Zepto)