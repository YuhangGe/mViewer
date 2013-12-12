(function() {
    if(typeof app === 'undefined') {
        app = {};
    }

    $.extend(app, {
        initEditMode : function() {
            select_photo_list.length = 0;
            app.setTitle("已选择(0)张照片");
        },
        bindEditEvents : function() {
            $("#btn-edit").addMouseDownEvent(function() {
                app.switchMode("edit");
            });


            $("#btn-cancel").addMouseDownEvent(function(){
                app.switchMode("gallery");
            });

            $("#btn-delete").addMouseDownEvent(function() {
                if(select_photo_list.length===0) {
                    alert("请先选择图片！");
                    return;
                }
                if(confirm("确认删除"+select_photo_list.length+"个图片？")) {
                    deletePhotoList();
                }
            });

            $("#btn-rename").addMouseDownEvent(function() {
                if(select_photo_list.length===0) {
                    alert("请先选择图片！");
                    return;
                };
                var name = prompt("请输入照片名称：", "");
                if(name===null || name.trim()==="") {
                    alert("名称不能为空！");
                    return;
                }
                renamePhotoList(name.trim());
            })
        },
        selectEditPhoto : function(fn, remove) {
            if(remove===true) {
                var idx = select_photo_list.indexOf(fn);
                if(idx<0) {
                    alert("wrong! at select edit phone.");
                    return;
                }
                select_photo_list.splice(idx, 1);
            } else {
                select_photo_list.push(fn);
            }
            app.setTitle("已选择("+select_photo_list.length+")张照片");
        }
    });

    function _error(err) {
        select_photo_list.length = 0;
        $("#image_list .image-div[idx="+idx+"]").removeClass("select-image");
        alert("系统错误。操作失败。请重新打开软件。");

        $.log2(err);
    }

    var select_photo_list = [];

    function deletePhotoList() {
        var arr = [];
        for(var i=0;i<select_photo_list.length;i++) {
            var p = select_photo_list[i];
            arr.push(p.name+ p.post)
        }
        $.deleteAssets(arr, app.ROOT_PATH, function() {
            for(var i=0;i<select_photo_list.length;i++) {
                var idx = app.getImageIndex(select_photo_list[i]);
                $("#image_list .image-div[idx="+idx+"]").remove();
            }
        }, _error);
    }

    function renamePhotoList(new_name) {
        var arr = [];
        for(var i=0;i<select_photo_list.length;i++) {
            var p = select_photo_list[i];
            arr.push(p.name+ p.post)
        }
        $.renameAssets(new_name, arr, app.ROOT_PATH, function() {
            for(var i=0;i<select_photo_list.length;i++) {
                var _n = new_name + "("+(i+1)+")", _p = select_photo_list[i];
                var idx = app.getImageIndex(_p);
                $("#image_list .image-div[idx="+idx+"]").removeClass("select-image").find(".title").text(_n);
                _p.name = _n;
            }
            select_photo_list.length = 0;
        }, _error);
    }
})();