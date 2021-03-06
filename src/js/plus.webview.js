/**
 * mui.init 5+
 * @param {type} $
 * @returns {undefined}
 */
;
(function ($, window) {
    // if (!$.os.plus) return
    //默认页面动画
    var defaultShow = $.config.show;

    var currentWebview = {};
    $.currentWebview = currentWebview;

    /**
     * 5+ event(5+没提供之前我自己实现)
     * @param {type} webview
     * @param {type} eventType
     * @param {type} data
     * @returns {undefined}
     */
    $.fire = function (webview, eventType, data) {
        if (!$.os.plus) return
        if ($.type(webview) === 'string') webview = plus.webview.getWebviewById(webview)
        if (webview) {
            if (typeof data === 'undefined') {
                data = '';
            } else if (typeof data === 'boolean' || typeof data === 'number') {
                webview.evalJS("typeof $!=='undefined'&&$.receive('" + eventType + "'," + data + ")");
                return;
            } else if ($.isPlainObject(data) || $.isArray(data)) {
                data = JSON.stringify(data || {}).replace(/\'/g, "\\u0027").replace(/\\/g, "\\u005c");
            }
            webview.evalJS("typeof $!=='undefined'&&$.receive('" + eventType + "','" + data + "')");
        }
    };
    /**
     * 5+ event(5+没提供之前我自己实现)
     * @param {type} eventType
     * @param {type} data
     * @returns {undefined}
     */
    $.receive = function (eventType, data) {
        if (!$.os.plus) return
        if (eventType) {
            try {
                if (data && typeof data === 'string') {
                    data = JSON.parse(data);
                }
            } catch (e) {}
            $(document).trigger(eventType, data);
        }
    };
    var triggerPreload = function (webview) {
        if (!webview.preloaded) { //保证仅触发一次
            $.fire(webview, 'preload');
            var list = webview.children();
            for (var i = 0; i < list.length; i++) {
                $.fire(list[i], 'preload');
            }
            webview.preloaded = true;
        }
    };
    var trigger = function (webview, eventType, timeChecked) {
        if (timeChecked) {
            if (!webview[eventType + 'ed']) {
                $.fire(webview, eventType);
                var list = webview.children();
                for (var i = 0; i < list.length; i++) {
                    $.fire(list[i], eventType);
                }
                webview[eventType + 'ed'] = true;
            }
        } else {
            $.fire(webview, eventType);
            var list = webview.children();
            for (var i = 0; i < list.length; i++) {
                $.fire(list[i], eventType);
            }
        }

    };
    /**
     * 打开新窗口
     * @param {string} url 要打开的页面地址
     * @param {string} id 指定页面ID
     * @param {object} options 可选:参数,等待,窗口,显示配置{params:{},waiting:{},styles:{},show:{}}
     */
    $.openWindow = function (url, id, options) {
        var suf = '.html',
            ids;
        if (typeof url === 'object') {
            options = url;
            url = options.url;
            id = options.id || url;
        } else {
            if (typeof id === 'object') {
                options = id;
                id = options.id || url;
            } else {
                id = id || url;
            }
        }
        if (url.indexOf(suf) === -1) url = url + suf
        if (!$.os.plus) {
            //TODO 先临时这么处理：手机上顶层跳，PC上parent跳
            if ($.os.ios || $.os.android) {
                window.top.location.href = url;
            } else {
                window.parent.location.href = url;
            }
            return;
        }

        id = id.replace(suf, '')
        ids = id.split('/')
        id = ids[ids.length - 1]

        options = options || {};
        var params = options.params || {};
        var webview = null,
            webviewCache = null,
            nShow, nWaiting;

        if ($.webviews[id]) {
            webviewCache = $.webviews[id];
            //webview真实存在，才能获取
            if (plus.webview.getWebviewById(id)) {
                webview = webviewCache.webview;
            }
        } else if (!options.createNew) {
            webview = plus.webview.getWebviewById(id);
        }

        if (webview) { //已缓存
            //每次show都需要传递动画参数；
            //预加载的动画参数优先级：openWindow配置>preloadPages配置>mui默认配置；
            nShow = webviewCache ? webviewCache.show : defaultShow;
            nShow = options.show ? $.extend(nShow, options.show) : nShow;
            nShow.autoShow && webview.show(nShow.aniShow, nShow.duration, function () {
                triggerPreload(webview);
                trigger(webview, 'pagebeforeshow', false);
            });
            if (webviewCache) {
                webviewCache.afterShowMethodName && webview.evalJS(webviewCache.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
            }
            return webview;
        } else { //新窗口
            if (!url) {
                throw new Error('webview[' + id + '] does not exist');
            }

            //显示waiting
            var waitingConfig = $.extend(true, $.config.waiting, options.waiting)
            if (waitingConfig.autoShow) {
                nWaiting = plus.nativeUI.showWaiting(waitingConfig.title, waitingConfig.options);
            }

            //创建页面
            options = $.extend(options, {
                id: id,
                url: url
            });

            webview = $.createWindow(options);

            //显示
            nShow = $.extend(true, $.config.show, options.show);
            if (nShow.autoShow) {
                var showWebview = function () {
                    //关闭等待框
                    if (nWaiting) {
                        nWaiting.close();
                    }
                    //显示页面
                    webview.show(nShow.aniShow, nShow.duration, function () {}, nShow.extras);
                    options.afterShowMethodName && webview.evalJS(options.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
                };
                //titleUpdate触发时机早于loaded，更换为titleUpdate后，可以更早的显示webview
                webview.addEventListener(nShow.event, showWebview, false);
                //loaded事件发生后，触发预加载和pagebeforeshow事件
                webview.addEventListener("loaded", function () {
                    triggerPreload(webview);
                    trigger(webview, 'pagebeforeshow', false);
                }, false);
            }
        }
        webview.nShow = nShow
        setTimeout(function () {
            !webview.isVisible() && $.showView(webview)
        }, nShow.delay)
        return webview;
    };

    $.openWindowWithTitle = function (options, titleConfig) {
        options = options || {};
        var url = options.url;
        var id = options.id || url;

        if (!$.os.plus) {
            //TODO 先临时这么处理：手机上顶层跳，PC上parent跳
            if ($.os.ios || $.os.android) {
                window.top.location.href = url;
            } else {
                window.parent.location.href = url;
            }
            return;
        }

        var params = options.params || {};
        var webview = null,
            webviewCache = null,
            nShow, nWaiting;

        if ($.webviews[id]) {
            webviewCache = $.webviews[id];
            //webview真实存在，才能获取
            if (plus.webview.getWebviewById(id)) {
                webview = webviewCache.webview;
            }
        } else if (options.createNew !== true) {
            webview = plus.webview.getWebviewById(id);
        }

        if (webview) { //已缓存
            //每次show都需要传递动画参数；
            //预加载的动画参数优先级：openWindow配置>preloadPages配置>mui默认配置；
            nShow = webviewCache ? webviewCache.show : defaultShow;
            nShow = options.show ? $.extend(nShow, options.show) : nShow;
            nShow.autoShow && webview.show(nShow.aniShow, nShow.duration, function () {
                triggerPreload(webview);
                trigger(webview, 'pagebeforeshow', false);
            });
            if (webviewCache) {
                webviewCache.afterShowMethodName && webview.evalJS(webviewCache.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
            }
            return webview;
        } else { //新窗口
            if (!url) {
                throw new Error('webview[' + id + '] does not exist');
            }

            //显示waiting
            var waitingConfig = $.extend(true, $.config.waiting, options.waiting);
            if (waitingConfig.autoShow) {
                nWaiting = plus.nativeUI.showWaiting(waitingConfig.title, waitingConfig.options);
            }

            //创建页面
            options = $.extend(options, {
                id: id,
                url: url
            });

            webview = $.createWindow(options);

            if (titleConfig) { //处理原生头
                $.extend(true, $.config.titleConfig, titleConfig);
                var tid = $.config.titleConfig.id ? $.config.titleConfig.id : id + "_title";
                var view = new plus.nativeObj.View(tid, {
                    top: 0,
                    height: $.config.titleConfig.height,
                    width: "100%",
                    dock: "top",
                    position: "dock"
                });
                view.drawRect($.config.titleConfig.backgroundColor); //绘制背景色
                var _b = parseInt($.config.titleConfig.height) - 1;
                view.drawRect($.config.titleConfig.bottomBorderColor, {
                    top: _b + "px",
                    left: "0px"
                }); //绘制底部边线

                //绘制文字
                if ($.config.titleConfig.title.text) {
                    var _title = $.config.titleConfig.title;
                    view.drawText(_title.text, _title.position, _title.styles);
                }

                //返回图标绘制
                var _back = $.config.titleConfig.back;
                var backClick = null;
                //优先字体

                //其次是图片
                var _backImage = _back.image;
                if (_backImage.base64Data || _backImage.imgSrc) {
                    //TODO 此处需要处理百分比的情况
                    backClick = {
                        left: parseInt(_backImage.position.left),
                        right: parseInt(_backImage.position.left) + parseInt(_backImage.position.width)
                    };
                    var bitmap = new plus.nativeObj.Bitmap(id + "_back");
                    if (_backImage.base64Data) { //优先base64编码字符串
                        bitmap.loadBase64Data(_backImage.base64Data);
                    } else { //其次加载图片文件
                        bitmap.load(_backImage.imgSrc);
                    }
                    view.drawBitmap(bitmap, _backImage.sprite, _backImage.position);
                }

                //处理点击事件
                view.setTouchEventRect({
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%"
                });
                view.interceptTouchEvent(true);
                view.addEventListener("click", function (e) {
                    var x = e.clientX;

                    //返回按钮点击
                    if (backClick && x > backClick.left && x < backClick.right) {
                        if (_back.click && $.isFunction(_back.click)) {
                            _back.click();
                        } else {
                            webview.evalJS("window.$&&$.back();");
                        }
                    }
                }, false);
                webview.append(view);

            }

            //显示
            nShow = $.extend(true, $.config.show, options.show);
            if (nShow.autoShow) {
                //titleUpdate触发时机早于loaded，更换为titleUpdate后，可以更早的显示webview
                webview.addEventListener(nShow.event, function () {
                    //关闭等待框
                    if (nWaiting) {
                        nWaiting.close();
                    }
                    //显示页面
                    webview.show(nShow.aniShow, nShow.duration, function () {}, nShow.extras);
                }, false);
            }
        }
        return webview;
    };

    /**
     * 根据配置信息创建一个webview
     * @param {type} options
     * @param {type} isCreate
     * @returns {webview}
     */
    $.createWindow = function (options, isCreate) {
        if (!$.os.plus) {
            return;
        }
        var id = options.id || options.url;
        var webview;
        if (options.preload) {
            if ($.webviews[id] && $.webviews[id].webview.getURL()) { //已经cache
                webview = $.webviews[id].webview;
            } else { //新增预加载窗口
                //判断是否携带createNew参数，默认为false
                if (options.createNew !== true) {
                    webview = plus.webview.getWebviewById(id);
                }

                //之前没有，那就新创建	
                if (!webview) {
                    webview = plus.webview.create(options.url, id, $.extend(true, $.config.window, options.styles), $.extend({
                        preload: true
                    }, options.extras));
                    if (options.subpages) {
                        $.each(options.subpages, function (index, subpage) {
                            var subpageId = subpage.id || subpage.url;
                            if (subpageId) { //过滤空对象
                                var subWebview = plus.webview.getWebviewById(subpageId);
                                if (!subWebview) { //如果该webview不存在，则创建
                                    subWebview = plus.webview.create(subpage.url, subpageId, $.extend(true, $.config.window, subpage.styles), $.extend({
                                        preload: true
                                    }, subpage.extras));
                                }
                                webview.append(subWebview);
                            }
                        });
                    }
                }
            }

            //TODO 理论上，子webview也应该计算到预加载队列中，但这样就麻烦了，要退必须退整体，否则可能出现问题；
            $.webviews[id] = {
                webview: webview, //目前仅preload的缓存webview
                preload: true,
                show: $.extend(true, $.config.show, options.show),
                afterShowMethodName: options.afterShowMethodName //就不应该用evalJS。应该是通过事件消息通讯
            };
            //索引该预加载窗口
            var preloads = $.data.preloads;
            var index = preloads.indexOf(id);
            if (~index) { //删除已存在的(变相调整插入位置)
                preloads.splice(index, 1);
            }
            preloads.push(id);
            if (preloads.length > $.config.preloadLimit) {
                //先进先出
                var first = $.data.preloads.shift();
                var webviewCache = $.webviews[first];
                if (webviewCache && webviewCache.webview) {
                    //需要将自己打开的所有页面，全部close；
                    //关闭该预加载webview	
                    $.closeAll(webviewCache.webview);
                }
                //删除缓存
                delete $.webviews[first];
            }
        } else {
            if (isCreate !== false) { //直接创建非预加载窗口
                webview = plus.webview.create(options.url, id, $.extend(true, $.config.window, options.styles), options.extras);
                if (options.subpages) {
                    $.each(options.subpages, function (index, subpage) {
                        var subpageId = subpage.id || subpage.url;
                        var subWebview = plus.webview.getWebviewById(subpageId);
                        if (!subWebview) {
                            subWebview = plus.webview.create(subpage.url, subpageId, $.extend(true, $.config.window, subpage.styles), subpage.extras);
                        }
                        webview.append(subWebview);
                    });
                }
            }
        }
        return webview;
    };

    /**
     * 预加载
     */
    $.preload = function (options) {
        //调用预加载函数，不管是否传递preload参数，强制变为true
        if (!options.preload) {
            options.preload = true;
        }
        return $.createWindow(options);
    };

    /**
     *关闭当前webview打开的所有webview；
     */
    $.closeOpened = function (webview) {
        if (!$.os.plus) return
        var opened = webview.opened();
        if (opened) {
            for (var i = 0, len = opened.length; i < len; i++) {
                var openedWebview = opened[i];
                var open_open = openedWebview.opened();
                if (open_open && open_open.length > 0) {
                    //关闭打开的webview
                    $.closeOpened(openedWebview);
                    //关闭自己
                    openedWebview.close("none");
                } else {
                    //如果直接孩子节点，就不用关闭了，因为父关闭的时候，会自动关闭子；
                    if (openedWebview.parent() !== webview) {
                        openedWebview.close('none');
                    }
                }
            }
        }
    };
    $.closeAll = function (webview, aniShow) {
        if (!$.os.plus) return
        $.closeOpened(webview);
        if (aniShow) {
            webview.close(aniShow);
        } else {
            webview.close();
        }
    };

    /**
     * 批量创建webview
     * @param {type} options
     * @returns {undefined}
     */
    $.createWindows = function (options) {
        $.each(options, function (index, option) {
            //初始化预加载窗口(创建)和非预加载窗口(仅配置，不创建)
            $.createWindow(option, false);
        });
    };
    /**
     * 创建当前页面的子webview
     * @param {type} options
     * @returns {webview}
     */
    $.appendWebview = function (options) {
        if (!$.os.plus) return
        var id = options.id || options.url;
        var webview;
        if (!$.webviews[id]) { //保证执行一遍
            //TODO 这里也有隐患，比如某个webview不是作为subpage创建的，而是作为target webview的话；
            if (!plus.webview.getWebviewById(id)) {
                webview = plus.webview.create(options.url, id, options.styles, options.extras);
            }
            //之前的实现方案：子窗口loaded之后再append到父窗口中；
            //问题：部分子窗口loaded事件发生较晚，此时执行父窗口的children方法会返回空，导致父子通讯失败；
            //     比如父页面执行完preload事件后，需触发子页面的preload事件，此时未append的话，就无法触发；
            //修改方式：不再监控loaded事件，直接append
            //by chb@20150521
            // webview.addEventListener('loaded', function() {
            currentWebview.append(webview);
            // });
            $.webviews[id] = options;

        }
        return webview;
    };

    $.showView = function (view) {
        if (!$.os.plus) return
        view = view || currentWebview
        var opts = $.extend(true, defaultShow, view.nShow)
        view.show.apply(view, [opts.aniShow, opts.duration])
        return view
    }

    //全局webviews
    $.webviews = {};
    //预加载窗口索引
    $.data.preloads = [];
    //$.currentWebview
    $.plusReady(function () {
        currentWebview = plus.webview.currentWebview();
        $.currentWebview = currentWebview
    });
    window.addEventListener('preload', function () {
        //处理预加载部分
        var webviews = $.config.preloadPages || [];
        $.plusReady(function () {
            $.each(webviews, function (index, webview) {
                $.createWindow($.extend(webview, {
                    preload: true
                }));
            });

        });
    });
    $.supportStatusbarOffset = function () {
        return $.os.plus && $.os.ios && parseFloat($.os.version) >= 7;
    };
})(Zepto, window);