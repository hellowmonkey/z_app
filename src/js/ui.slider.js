/* 轮播组件 */ ;
(function ($, window, document) {
    var cssPrefix = $.fx.cssPrefix
    var active = 'z-active'

    $.fn.slider = function (opts) {
        if (!this.length) return this
        var _this = this.eq(0)
        var eventMap = $.eventMap
        var lock,
            startTime,
            startX,
            startY,
            moveDist,
            activeDist = 0,
            activeDot = 0,
            critical = 0,
            targetDot,
            timer

        opts = $.orderOpts(_this, $.config.slider, opts, 'slider-')

        var handler, items, itemWidth, itemHeight, itemLength, itemSize, indicator, sliderWidth
        var indicatorType, interval

        init()

        _this.on(eventMap.down, startHandler)
        _this.on(eventMap.move, moveHandler)
        _this.on(eventMap.up, endHandler)
        _this.on(eventMap.cancel, endHandler)
        _this.on(eventMap.cancel, endHandler)

        _this.on('slideMove', function (event) {
            anim()
        })

        _this.init = init
        _this.nextItem = nextItem
        _this.prevItem = prevItem
        _this.gotoItem = gotoItem

        return _this

        function init() {
            indicatorType = opts.indicator
            interval = opts.interval
            handler = _this.find(opts.handler)
            items = _this.find(opts.items)
            itemWidth = items.width()
            itemHeight = items.height()
            itemLength = items.length
            itemSize = itemLength
            activeDot = targetDot = opts.activeDot || 0
            if (opts.loop && itemLength > 1) {
                var pre = items.first().clone()
                var next = items.last().clone()
                handler.prepend(next).append(pre)
                critical = -itemWidth
                itemSize += 2
            }
            sliderWidth = (itemLength - 1) * itemWidth
            activeDist = moveDist = -(activeDot * itemWidth) + critical
            anim()
            initIndicator()
            setLoop()
        }

        function setLoop(clear) {
            if (clear) timer && clearInterval(timer)
            else if (interval > 0) timer = setInterval(function () {
                nextItem()
            }, interval)
        }

        function initIndicator() {
            if (!indicatorType) return
            if (indicatorType === 'dots') {
                indicator = _this.find('.z-slider-indicator-group')
                if (!indicator.length) {
                    indicator = $('<ul class="z-slider-indicator-group"></ul>')
                    _this.append(indicator)
                }
                var html = ''
                for (var i = 0; i < itemLength; i++) {
                    html += '<li class="z-slider-indicator"></li>'
                }
                indicator.html(html)
            } else if (indicatorType === 'number') {
                indicator = _this.find('.z-slider-indicator-number')
                if (!indicator.length) {
                    indicator = $('<div class="z-slider-indicator-number"></div>')
                    _this.append(indicator)
                }
            }
            updateIndicator()
        }

        function updateIndicator() {
            if (!indicatorType) return
            if (indicatorType === 'dots') {
                var list = indicator.find('.z-slider-indicator')
                list.removeClass(active)
                list.eq(activeDot).addClass(active)
            } else if (indicatorType === 'number') {
                indicator.html((activeDot + 1) + ' / ' + itemLength)
            }
        }

        function anim(duration, cb) {
            var cssOpts = {}
            duration = duration || 0
            if (!opts.spring && !opts.loop && (moveDist > 0 || moveDist < -(itemSize - 1) * itemWidth)) return
            cssOpts[cssPrefix + 'transform'] = 'translate3d(' + moveDist + 'px,0,0)'
            cssOpts[cssPrefix + 'transition-duration'] = duration + 'ms'
            handler.css(cssOpts)
            if (duration > 0) {
                setTimeout(function () {
                    cb && cb(cssOpts)
                }, duration)
            } else {
                cb && cb(cssOpts)
            }
        }

        function startHandler(event) {
            if (lock) return
            var pos = getPosition(event)
            startTime = new Date().getTime()
            startX = pos.x
            startY = pos.y
            setLoop(true)
            trigger('slideStart')
        }

        function moveHandler(event) {
            if (lock || startTime <= 0) return
            var pos = getPosition(event)
            var moveX = pos.x - startX
            var moveY = pos.y - startY
            setLoop(true)
            if (opts.checkY && (Math.abs(moveY) * 5) > Math.abs(moveX)) return
            moveDist = activeDist + moveX
            trigger('slideMove')
            trigger('slide')
        }

        function endHandler(event) {
            if (lock) return
            activeDist = moveDist
            var offset = itemWidth * opts.offset
            var activeLeft = targetDot * itemWidth - critical
            if (activeDist > 0) {
                targetDot = 0
            } else if (activeDist < -((itemSize - 1) * itemWidth)) {
                targetDot = itemLength - 1
            } else if (Math.abs(activeDist) > activeLeft + offset) {
                targetDot = activeDot + 1
            } else if (Math.abs(activeDist) < activeLeft - offset) {
                targetDot = activeDot - 1
            } else {
                targetDot = activeDot
            }
            setLoop()
            move()
        }

        function move() {
            var duration = opts.duration
            moveDist = -(targetDot * itemWidth) + critical
            lock = true
            startTime = 0
            anim(duration, function () {
                lock = false
                if (critical !== 0) {
                    if (targetDot < 0) {
                        targetDot = itemLength - 1
                        moveDist = -(itemLength * itemWidth)
                        anim()
                    } else if (targetDot > itemLength - 1) {
                        targetDot = 0
                        moveDist = critical
                        anim()
                    }
                }
                activeDot = targetDot
                activeDist = moveDist
                if (opts.resetHeight) {
                    _this.height(items.eq(activeDot).height())
                }
                updateIndicator()
                trigger('slideEnd', duration)
                trigger('slide', duration)
            })
        }

        function nextItem() {
            ++targetDot
            if (targetDot > (itemSize - 1)) {
                if (critical !== 0) targetDot = 0
                else return
            }
            move()
        }

        function prevItem() {
            --targetDot
            if (targetDot < 0) {
                if (critical !== 0) targetDot = itemLength - 1
                else return
            }
            move()
        }

        function gotoItem(number) {
            number = number - 1
            if (number >= 0 && number <= itemLength - 1) {
                targetDot = number
                move()
            }
        }

        function trigger(name, duration) {
            var percent = -moveDist / sliderWidth
            duration = duration || 0
            _this.trigger(name, {
                move: moveDist,
                active: activeDot,
                percent: percent,
                duration: duration
            })
        }
    }

    function getPosition(e) {
        return {
            x: e.targetTouches ? e.targetTouches[0].pageX : e.pageX,
            y: e.targetTouches ? e.targetTouches[0].pageY : e.pageY
        }
    }

})(Zepto, window, document)