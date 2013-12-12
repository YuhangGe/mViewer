/**
 * User: xiaoge
 * At: 13-7-25 12:21
 * Email: abraham1@163.com
 */
if(typeof $ === 'undefined') {
    //if no jquery
    $ = function(id) {
        return document.getElementById(id);
    };

    $.extend =  function(a, b) {
        for(var i in b) {
            if(typeof a[i] !== 'undefined') {
                throw "bad extend";
            } else {
                a[i] = b[i];
            }
        }
    };

}

(function() {
    //检测是否是触屏。对于ie浏览器目前是单独的判断。
    if(('ontouchstart' in window) || window.navigator.msMaxTouchPoints) {
        $.touchable = true;
    } else {
        $.touchable = false;
    }
//    $.touchable = true;
    $.touchEvent = {
        'start' : window.navigator.msPointerEnabled ? 'MSPointerDown' : 'touchstart',
        'move' : window.navigator.msPointerEnabled ? 'MSPointerMove' : 'touchmove',
        'end' : window.navigator.msPointerEnabled ? 'MSPointerUp' : 'touchend'
    };

})();

$.fn.extend({
    addMouseEvent : function(type, element, handler) {
        var _h = typeof element === 'function' ? element
            : (typeof handler==='function' ? handler : function() {
            //do nothing
        });
        var pre_timestamp = 0;

        var _f_touch = function(e) {
//                $.log('t')
            _h.apply(this, arguments);
            pre_timestamp = e.timeStamp;
        };
        var _f2 = function(e) {
//                $.log('d')
            if(pre_timestamp > 0 && e.timeStamp - pre_timestamp > 800) {
//                    $.log("skip md");
                return;
            }
            _h.apply(this, arguments);
        }
        var type_touch = type === 'mousedown' ? $.touchEvent.start : (type === 'mousemove' ? $.touchEvent.move : $.touchEvent.end);
        if($.touchable && (['mousedown','mousemove','mouseup'].indexOf(type)>=0)) {
            if(typeof element === "function") {
//                    this.on(type_touch, _f_touch);
//                    this.on(type, _f2);
                this.on(type_touch, element);
            } else {
//                    this.on(type_touch, element, _f_touch);
//                    this.on(type, element, _f2);
                this.on(type_touch, element, handler);
            }

        } else {
            if(typeof element === "function") {
                this.on(type, element);
            } else {
                this.on(type, element, handler);
            }
        }
        return this;
    },

    addMouseDownEvent : function(element, handler) {
        return this.addMouseEvent("mousedown", element, handler);
    },
    addMouseMoveEvent : function(element, handler) {
        return this.addMouseEvent("mousemove", element, handler);
    },
    addMouseUpEvent : function(element, handler) {
        return this.addMouseEvent("mouseup", element, handler);
    },
    addMouseTagEvent : function(element, handler) {
        var _b = true,  ts_n = $.touchEvent.start, te_n = $.touchEvent.end;
        if(typeof element === 'function') {
            handler = element;
            _b = false;
        }
        if(_b) {
            this.on("mousedown", element, handler);
        } else {
            this.on("mousedown", handler);
        }
        var pre = {
            x : 0,
            y : 0
        };
        var _ts = function(e) {
//                $.log(e);
            e = e.originalEvent || e;
            if(e.touches && e.touches.length>0) {
                pre.x = e.touches[0].pageX;
                pre.y = e.touches[0].pageY;
            }
            e.fii_no_stop = true;
        };
        var _te = function(e) {
//                $.log(e);
            e = e.originalEvent || e;
            if(e.changedTouches && e.changedTouches.length>0) {
                var x = e.changedTouches[0].pageX;
                var y = e.changedTouches[0].pageY;
                if(Math.sqrt(Math.pow(pre.x - x, 2) + Math.pow(pre.y - y, 2)<20)) {
                    handler.apply(this, arguments);
                }
            }
        }
        if($.touchable) {
            if(_b) {
                this.on(ts_n, element, _ts);
                this.on(te_n, element, _te);
            } else {
                this.on(ts_n, _ts);
                this.on(te_n, _te);
            }
        }

        return this;
    }

});

$.extend($, {

    log : function(msg) {
        console.log(msg);
    },
    log2 : function(msg) {
        console.log(msg);
        $("#debug-panel").append("<p>"+msg+"</p>");
    },
    /**
     * 将src_arr中的每个点的数据复制到dst_arr中的每个点
     * @param dst_arr
     * @param src_arr
     */
    setPoints : function(dst_arr, src_arr) {
        for(var i=0;i<dst_arr.length;i++) {
            dst_arr[i].x = src_arr[i].x;
            dst_arr[i].y = src_arr[i].y;
        }
    },
    stopEvent : function(e) {
        if(!e) {
            return;
        }
        if(e.originalEvent) {
            e = e.originalEvent;
        }
        e.preventDefault();
        e.stopPropagation();
    },
    getPTPRange : function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
    },

    /**
     *
     * @param src
     * @param dest
     * @param width
     * @param height
     * @param success
     * @param fail
     */
    saveThumbnailBySize : function(src, dest, width, height, success, fail) {
        cordova.exec(success, fail, "Thumbnail", "saveBySize", [src, dest, width, height]);
    },
    /**
     *
     */
    getAllGroups : function(success, fail) {
        cordova.exec(success, fail, "Asset", "getAllGroups", []);
    },
    getAllAssetsByGroupName : function(name, success, fail) {
        cordova.exec(success, fail, "Asset", "getAllAssetsByGroupName", [name]);
    },
    saveAssets : function(url_arr, file_name, path, success, fail) {
        cordova.exec(success, fail, "Asset", "saveAssets", [url_arr, file_name, path]);
    },
    deleteAssets : function(file_arr, root_path, success, fail) {
        cordova.exec(success, fail, "Asset", "deleteAssets", [file_arr, root_path]);
    },
    renameAssets : function(new_name, file_arr, root_path, success, fail) {
        cordova.exec(success, fail, "Asset", "renameAssets", [new_name, file_arr, root_path]);
    },
    keepScreen : function(success, fail) {
        $.log2("keep screen");
        cordova.exec(success, fail, "Asset", "setScreenLock", [1]);
    },
    freeScreen : function(success, fail) {
        $.log2("free screen");
        cordova.exec(success, fail, "Asset", "setScreenLock", [0]);
    },
    hideStatusBar : function(success, fail) {
        cordova.exec(success, fail, "Asset", "setStatusBar", [0]);
    },
    showStatusBar : function(success, fail) {
        cordova.exec(success, fail, "Asset", "setStatusBar", [1]);

    }
});