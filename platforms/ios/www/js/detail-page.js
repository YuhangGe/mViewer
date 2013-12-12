/**
 * User: xiaoge
 * At: 13-7-25 12:14
 * Email: abraham1@163.com
 */
(function() {
    if(typeof app === 'undefined') {
        app = {};
    }

    $.extend(app, {

        bindDetailPageEvents : function() {
            $("#panel-detail").addMouseDownEvent(onImageTouchStart).addMouseMoveEvent(onImageTouchMove).addMouseUpEvent(onImageTouchEnd);
        },
        resetDetailPage : function() {
            __cur_scale__ = 1.0;
            for(var i=0;i<__cur_pos_arr__.length;i++) {
                __cur_pos_arr__[i].x = __cur_pos_arr__[i].y = 0;
            }
            layoutCenterImage();
            loadLeftRightImage();
        },
        resetCurrentImageIndex : function() {
            cur_image_idx = -1;
        },
        showImage : function(idx) {
            image_list = app.CUR_IMAGE_LIST;
            showImage(idx);
        }
    });

    var $cur_image = null;
    var $left_image = null;
    var $right_image = null;

    var image_list = null;
    var cur_image_idx = -1;
//    var cur_image_first = false;
//    var cur_image_last = false;
    var image_loaded_count = 0;

    var __pre_point__ = {x: 0, y: 0};
    var __m_down__ = false;
    var __moved__ = false;
    var __cur_scale__ = 1.0;
    var __pre_scale__ = 1.0;
    var __org_size_arr__ = [{w: 0, h: 0},{w:0,h:0},{w:0,h:0}];
    //保存三个图片当前的位置
    var __cur_pos_arr__ = [{x : 0, y: 0}, {x:0, y: 0}, {x:0, y: 0}];
    //保存三个图片移动之前的位置
    var __pre_pos_arr__ = [{x: 0, y: 0},{x:0,y:0},{x:0,y:0}];

    var __cur_center__ = {x : 0, y: 0};

    var __d_down__ = false;
    var __pre_distance__ = 0;

    var __busy__ = 0;


    function onImageTouchStart(ev) {
        if(__busy__>0) {
            //如果当前上一个操作还没有结束（比如自动调整位置的动画），不响应新的事件
            return;
        }
        var e = ev.originalEvent, ts = e.touches;
        if(ts.length === 1) {
            __pre_point__.x = ts[0].pageX;
            __pre_point__.y = ts[0].pageY;
            $.setPoints(__pre_pos_arr__, __cur_pos_arr__);
            __m_down__ = true;
            __d_down__ = false;
            __moved__ = false;
            $.stopEvent(e);
        } else if(ts.length===2) {
            __cur_center__.x = Math.round((ts[0].pageX+ts[1].pageX)/2);
            __cur_center__.y = Math.round((ts[0].pageY+ts[1].pageY)/2);
            __pre_distance__ = $.getPTPRange(ts[0].pageX, ts[0].pageY, ts[1].pageX, ts[1].pageY);
            __pre_scale__ = __cur_scale__;
            $.setPoints(__pre_pos_arr__, __cur_pos_arr__);

            __d_down__ = true;
            __m_down__ = false;
            __moved__ = false;
            $.stopEvent(e);
        }

    }

    function onImageTouchMove(ev) {
        if(__busy__>0) {
            return;
        }
        var e = ev.originalEvent, ts = e.touches;
        if(__m_down__ && ts.length===1) {
            var _x = ts[0].pageX - __pre_point__.x, _y = ts[0].pageY - __pre_point__.y;

            //如果移动的距离很小，则不处理
            if(Math.round(Math.sqrt(_x*_x+_y*_y))>20 || __moved__===true) {
                var cps = __cur_pos_arr__, pps = __pre_pos_arr__;
                for(var i=0;i<cps.length;i++) {
                    cps[i].x = pps[i].x + _x;
                }
                /*
                 * 中间的图片需要把x,y 都移动，而左右的图片只需要移动x让用户可以看到
                 */
                cps[1].y = pps[1].y + _y;
                $cur_image.css({
                    left : cps[1].x,
                    top : cps[1].y
                });
                $left_image.css({
                    left : cps[0].x
                });
                $right_image.css({
                    left : cps[2].x
                });
                __moved__ = true;
            }


            $.stopEvent(e);
        } else if(__d_down__ && ts.length===2) {
            var c_dis = $.getPTPRange(ts[0].pageX, ts[0].pageY, ts[1].pageX, ts[1].pageY);
            var n_s = c_dis / __pre_distance__, n_s2 = __pre_distance__ / c_dis;
            if(n_s > 1.1) {
                __cur_scale__ = __pre_scale__ * n_s;
                scaleImage();
            } else if(n_s2>1.1) {
                __cur_scale__ = __pre_scale__ / n_s2;
                scaleImage();
            }

            $.stopEvent(e);

        }
    }

    function onImageTouchEnd() {
        if(__busy__>0) {
            return;
        }
        if(__m_down__ && __moved__ === false) {
            //如果没有移动，只是轻触，显示或隐藏header
            app.toggleHead();
        } else if(__m_down__) {
            adjustPosition();
        }
        else if(__d_down__) {
            adjustScale();
        }
        __m_down__ = false;
        __d_down__ = false;

        //不论怎样只要点了屏幕都要把counter重置
        app.resetHeadCounter();

    }

    function adjustPosition() {
        var PW = 1024, PH = 748;
        if(app.CUR_ORIENTATION==='portrait') {
            PW = 768;
            PH = 1004;
        }
        var cs, cp;

        cs = __org_size_arr__[1];
        cp = __cur_pos_arr__[1];
        var w = cs.w * __cur_scale__,
            h = cs.h * __cur_scale__,
            m_x = 0,
            m_y = 0;
        if(w<PW) {
            m_x = Math.round((PW-w)/2);
        }
        if(h<PH) {
            m_y = Math.round((PH-h)/2);
        }
        var left = cp.x, top = cp.y;
        var right = PW - (left + w), bottom = PH - (top+h);
        var _style = {};
        var _adjust = false;
        var new_cur_p = {x: cp.x, y: cp.y};

        if(left>m_x || right>m_x) {
            _adjust = true;
            if(left>m_x) {
                new_cur_p.x = m_x;
            } else {
                new_cur_p.x = PW - m_x - w;
            }
            _style['left'] = new_cur_p.x;
        }
        if(top>m_y || bottom>m_y) {
            _adjust = true;
            if(top>m_y) {
                new_cur_p.y = m_y;
            } else {
                new_cur_p.y = PH - m_y - h;
            }
            _style['top'] = new_cur_p.y;
        }

        var l_s={}, l_a = false, r_s = {}, r_a = false;
        if(cur_image_idx>0) {
            //如果当前不是第一张图片，检测左边的图片
            cs = __org_size_arr__[0];
            cp = __cur_pos_arr__[0];
            if(cp.x + cs.w / 2 > 0) {
                //如果左边的图上已经拖动来一半到了当前屏幕，则认为要切换左边图片
                switchLeftImage();
                return;
            } else if(cp.x+cs.w>0) {
                //如果左边图片已经显示出来了，则需要用动画把它退回去。否则不需要动画，以提高性能
                l_a = true;
            }
            l_s['left'] =cp.x = Math.round((PW - cs.w) / 2 - (PW + 20 - Math.min(0, new_cur_p.x)));
        }

        if(cur_image_idx<image_list.length-1) {
            //如果当前不是最后一张
            cs = __org_size_arr__[2];
            cp = __cur_pos_arr__[2];
            if(cp.x + cs.w / 2 < PW) {
                //如果右边的图片已经拖到了一半
                switchRightImage();
                return;
            } else if(cp.x<PW) {
                r_a = true;
            }
            r_s['left'] = cp.x = Math.round((PW-cs.w)/2 + (PW + 20 + Math.max(0, new_cur_p.x+w-PW)));
        }


        if(_adjust) {
            __cur_pos_arr__[1].x = new_cur_p.x;
            __cur_pos_arr__[1].y = new_cur_p.y;
            __busy__++;
            $cur_image.animate(_style, 300, function() {
                __busy__--;
            });
        }
        if(l_a) {
            __busy__++;
            $left_image.animate(l_s, 300, function() {
                __busy__--;
            });
        } else {
            $left_image.css(l_s);
        }
        if(r_a) {
            __busy__++;
            $right_image.animate(r_s, 300, function() {
                __busy__--;
            });
        } else {
            $right_image.css(r_s);
        }
    }

    function showImage(idx) {
        __cur_scale__ = 1.0;
        for(var i=0;i<__cur_pos_arr__.length;i++) {
            __cur_pos_arr__[i].x = __cur_pos_arr__[i].y = 0;
        }
        image_loaded_count = 0;
        cur_image_idx = idx;
        var $i_arr = $(".image-detail"), pi = $i_arr[0], ci = $i_arr[1], ni=$i_arr[2];
        var fn = image_list[idx];
        $cur_image = $(ci);
        $left_image = $(pi);
        $right_image = $(ni);
        setImgFile(ci, fn.name+fn.post, function() {
            layoutCenterImage();
            loadLeftRightImage();
            app.togglePanel();
        });
        app.setTitle(fn.name);
    }

    /**
     * 计算图片在第idx个屏幕上的位置。如果idx===-1则是计算左边图片，0是计算当前图片，1是计算右边图片
     * @param img
     * @param idx
     * @returns {{left: number, top: number, width: number, height: number}}
     */
    function calcImageOutline(img, idx) {
        idx = typeof idx === 'number' ? idx : 0;
        var nw = img.naturalWidth, nh = img.naturalHeight;
        var pw = 1024, ph = 748;
        if(app.CUR_ORIENTATION==='portrait') {
            pw = 768;
            ph = 1004;
        }

        var _w = nw, _h = nh;
        var _bx = nw / pw, _by = nh / ph;
        if(_bx>1 || _by >1) {
            if(_bx>_by) {
                _w = pw;
                _h = nh / _bx;
            } else {
                _h = ph;
                _w = nw / _by;
            }
        }

        var left_offset = 0;//, cx = __cur_pos_arr__[1].x;
        if(idx===-1) {
            left_offset = -(pw + 20);// + Math.min(cx, 0);
        } else if(idx===1) {
            left_offset = pw + 20;// + Math.max(0, cx + __org_size_arr__[1].w * __cur_scale__ - pw);
        }

        return {
            left : Math.round((pw-_w)/2+left_offset),
            top : Math.round((ph - _h) / 2),
            width : Math.round(_w),
            height : Math.round(_h)
        }
    }
    function layoutCenterImage() {
        var out = calcImageOutline($cur_image[0],0);
        $cur_image.css({
            left : (__cur_pos_arr__[1].x = out.left),
            top : (__cur_pos_arr__[1].y = out.top),
            width : (__org_size_arr__[1].w = out.width),
            height : (__org_size_arr__[1].h = out.height)
        });

//        $.log(__cur_pos__);
    }

    function loadLeftRightImage() {
        loadLeftImage();
        loadRightImage();
    }

    function loadLeftImage() {
        if(cur_image_idx>0) {
            var fn = image_list[cur_image_idx-1];
            setImgFile($left_image[0], fn.name+fn.post, function() {
                layoutLeftImage(true);
            });
        } else {
            layoutLeftImage(false);
        }
    }

    function loadRightImage() {
        if(cur_image_idx<image_list.length-1) {
            var fn = image_list[cur_image_idx+1];
            setImgFile($right_image[0], fn.name+fn.post, function() {
                layoutRightImage(true);
            });
        } else {
            layoutRightImage(false);
        }
    }
    function layoutLeftImage(show) {
        if(show===false) {
            $left_image.hide();
        } else {
            var out = calcImageOutline($left_image[0], -1);
            $left_image.css({
                left : (__cur_pos_arr__[0].x = out.left),
                top : (__cur_pos_arr__[0].y = out.top),
                width : (__org_size_arr__[0].w = out.width),
                height : (__org_size_arr__[0].h = out.height)
            }).show();
        }
    }
    function layoutRightImage(show) {
        if(show===false) {
            $right_image.hide();
        } else {
            var out = calcImageOutline($right_image[0], 1);
            $right_image.css({
                left : (__cur_pos_arr__[2].x = out.left),
                top : (__cur_pos_arr__[2].y = out.top),
                width : (__org_size_arr__[2].w = out.width),
                height : (__org_size_arr__[2].h = out.height)
            }).show();
        }
    }
    function scaleImage() {
        var pp = __pre_pos_arr__[1];
        var _ox = (- pp.x + __cur_center__.x) / __pre_scale__;
        var _oy = (- pp.y + __cur_center__.y) / __pre_scale__;
        var _nox = _ox * __cur_scale__, _noy = _oy * __cur_scale__;
        var cp = __cur_pos_arr__[1];
        cp.x = Math.round(__cur_center__.x - _nox);
        cp.y = Math.round(__cur_center__.y - _noy);
        $cur_image.css({
            left : cp.x,
            top : cp.y,
            width : Math.round(__org_size_arr__[1].w * __cur_scale__),
            height : Math.round(__org_size_arr__[1].h * __cur_scale__)
        });

    }

    function adjustScale() {
        if(__org_size_arr__[1].w*__cur_scale__<350 && __org_size_arr__[1].h*__cur_scale__<350) {
            //如果图片被缩小到一定程度（宽高都小于400），那么认为用户想要退回到主页面
            app.showMainPanel();
            return;
        }
        adjustPosition();

//        if(__cur_scale__<0.8) {
//            //如果缩小到小于0.8，不认为是合理的想法，重新恢复到0.8的大小。
//            //ipad原生图片浏览器完全不能缩小图片，我认为这个也不够合理。
//
//        } else if(__cur_scale__>2.5) {
//            //如果放大到2.5倍以上，不认为是合理的想法，重新恢复到0.8的大小。
//            //ipad原生应用也是这样的，但是具体是多少倍不清楚。2.5是自己随便试的。
//
//        }
    }

    function switchLeftImage() {
        var p_arr = __cur_pos_arr__, cp0 = p_arr[0], cp1 = p_arr[1], cp2 = p_arr[2];
        var s_arr = __org_size_arr__, cs0 = s_arr[0], cs1 = s_arr[1], cs2 = s_arr[2];
        p_arr[0] = cp2;
        p_arr[1] = cp0;
        p_arr[2] = cp1;
        s_arr[0] = cs2;
        s_arr[1] = cs0;
        s_arr[2] = cs1;

        var PW = 1024, PH = 748;
        if(app.CUR_ORIENTATION==='portrait') {
            PW = 768;
            PH = 1004;
        }

        var pre_x0 = cp0.x;
        cp0.x = Math.round((PW-cs0.w)/2);
        __busy__++;
        __cur_scale__ = 1.0;
        cur_image_idx--;
        var $tmp = $cur_image;
        $cur_image = $left_image;
        $left_image = $right_image.remove().prependTo($("#panel-detail"));
        $right_image = $tmp;
        //已经交换了
        $cur_image.animate({
            left : cp0.x
        }, 300, function() {
            __busy__--;
        });
        __busy__++;
        $right_image.animate({
            left: cp1.x + cp0.x - pre_x0
        }, 300, function() {
            __busy__--;
            layoutRightImage(true);
            loadLeftImage();
        });
        app.setTitle(image_list[cur_image_idx].name);
    }

    function switchRightImage() {
        var p_arr = __cur_pos_arr__, cp0 = p_arr[0], cp1 = p_arr[1], cp2 = p_arr[2];
        var s_arr = __org_size_arr__, cs0 = s_arr[0], cs1 = s_arr[1], cs2 = s_arr[2];
        p_arr[0] = cp1;
        p_arr[1] = cp2;
        p_arr[2] = cp0;
        s_arr[0] = cs1;
        s_arr[1] = cs2;
        s_arr[2] = cs0;

        var PW = 1024, PH = 748;
        if(app.CUR_ORIENTATION==='portrait') {
            PW = 768;
            PH = 1004;
        }

        var pre_x2 = cp2.x;
        cp2.x = Math.round((PW-cs2.w)/2);
        __busy__++;
        __cur_scale__ = 1.0;
        cur_image_idx++;
        var $tmp = $cur_image;
        $cur_image = $right_image;
        $right_image = $left_image.remove().appendTo($("#panel-detail"));
        $left_image = $tmp;
        //已经交换了
        $cur_image.animate({
            left : cp2.x
        }, 300, function() {
            __busy__--;
        });
        __busy__++;
        $left_image.animate({
            left: cp1.x + cp2.x - pre_x2
        }, 300, function() {
            __busy__--;
            layoutLeftImage(true);
            loadRightImage();
        });
        app.setTitle(image_list[cur_image_idx].name);
    }

    function setImgFile(img, file_name, onload) {
        var new_src = true, p_src = img.src, idx = p_src==null ? -1 : p_src.lastIndexOf("/");
        if(idx>=0) {
            var p_name = decodeURIComponent(p_src.substr(idx+1));
            if(p_name===file_name) {
                new_src = false;
            }
        }
        if(new_src) {
            img.onload = onload;
            img.src = app.ROOT_URL + "/" + file_name;
        } else {
            onload.call(img);
        }
    }
})();
