// 配置文件
;
(function ($) {
    $.config = {
        swipeBack: false,
        preloadPages: [], //5+ lazyLoad webview
        preloadLimit: 10, //预加载窗口的数量限制(一旦超出，先进先出)
        show: {
            event: "loaded",
            autoShow: false,
            duration: 320,
            aniShow: 'pop-in',
            extras: {},
            delay: 900
        },
        waiting: {
            autoShow: false,
            title: '',
            modal: false
        },
        window: {
            scalable: false,
            bounce: "" //vertical
        },
        keyEventBind: {
            backbutton: true,
            menubutton: true
        },
        titleConfig: {
            height: "44px",
            backgroundColor: "#ffffff", //导航栏背景色
            bottomBorderColor: "#cccccc", //底部边线颜色
            title: { //标题配置
                text: "", //标题文字
                position: {
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%"
                },
                styles: {
                    color: "#000000",
                    align: "center",
                    family: "'Helvetica Neue',Helvetica,sans-serif",
                    size: "17px",
                    style: "normal",
                    weight: "normal",
                    fontSrc: ""
                }
            },
            back: {
                image: {
                    base64Data: '',
                    imgSrc: '',
                    sprite: {
                        top: '0px',
                        left: '0px',
                        width: '100%',
                        height: '100%'
                    },
                    position: {
                        top: "10px",
                        left: "10px",
                        width: "24px",
                        height: "24px"
                    }
                }
            }
        },
        pullrefresh: {
            down: {
                support: true,
                style: 'circle',
                color: '#000000',
                offset: $('.z-bar').height() + 'px',
                auto: false
            },
            up: {
                nonerText: '没有更多数据了',
                loadingText: '加载中...',
                tipText: '上拉加载更多数据',
                container: $('.z-content,.z-content-padding')[0]
            }
        },
        date: {
            prefixAgo: '',
            suffixAgo: '后',
            inPast: '快到了',
            seconds: "小于一分钟",
            minute: "一分钟",
            minutes: "%d分钟",
            hour: "一小时",
            hours: "%d小时",
            day: "一天",
            days: "%d天",
            month: "一个月",
            months: "%d月",
            year: "一年",
            years: "%d年",
            wordSeparator: "",
            numbers: ['', "\u4E00", "\u4e24", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4e03", "\u516b", "\u4e5d", "\u5341"],
            format: 'M月dd日 H:mm',
            coverTime: 24 * 60 * 60 * 1000
        },
        image: {
            width: '700px'
        },
        template: {
            path: '_www/tpl/'
        },
        ripples: ['.z-action-ripple', '.z-list .z-list-item', '.z-btn'],
        transTime: 150,
        beforeback: [],
        ajax: {
            errorToast: true
        }
    };
})(Zepto)