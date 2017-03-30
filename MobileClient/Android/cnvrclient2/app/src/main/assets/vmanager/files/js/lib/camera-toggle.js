define(['backbone','underscore', 'config'], function (bb,_, conf) {

    var application = {

        getSettings: function(camera){
            var NCamera = null;
            $.ajax({
                url : CloudAPI.config.url_cameras + camera['id'] + "/",
                type : "get",
                async: false,
                success : function(data){
                    NCamera = data;
                }});

            return NCamera;
        },

        setValue: function (camera, value, oldValue) {
            camera = this.getSettings(camera);
			// TODO: did not used argument value
			// TODO: redesign arguments value
			// camera.status / active/inactive/inactive_by_scheduler/offline
            if(camera != null){
				console.log("[CAMERA-TOGGLE] camera.status: " + camera.status);
				console.log("[CAMERA-TOGGLE] camera.mode:" + camera.mode);
				console.log("[CAMERA-TOGGLE] camera.rec_mode:" + camera.rec_mode);
				var new_mode = this.behaviorTable().camera(camera.status).mode(camera.mode).new_mode;

				if(new_mode == false){
                    return false;
                }

                console.log("[CAMERA-TOGGLE] Set camera mode (1 place) - (from [" + camera.mode + "] to [" + new_mode + "])");
				camera.mode = new_mode;

                $.ajax({
                    url: CloudAPI.config.url_cameras + camera['id'] + "/",
                    type: 'PUT',
                    success: function (data) {
                    },
                    data: JSON.stringify(camera),
                    contentType: 'application/json'
                });
                return camera;
            }
        },
		behaviorTable: function() {
			var tbl = {
				"camera_status_on" : {
					"current_mode_schedule" : { "new_mode" : "off_till_sched"},
					"current_mode_on_till_sched" : { "new_mode" : "off_till_sched"},
					"current_mode_off_till_sched" : { "new_mode" : false},
					"current_mode_on" : { "new_mode" : "off"},
					"current_mode_off" : { "new_mode" : false}
				},
				"camera_status_off" : {
					"current_mode_schedule" : { "new_mode" : "on_till_sched"},
					"current_mode_on_till_sched" : { "new_mode" : false},
					"current_mode_off_till_sched" : { "new_mode" : "on_till_sched"},
					"current_mode_on" : { "new_mode" : false},
					"current_mode_off" : { "new_mode" : "on"}
				},
				"camera_status_offline" : {
					"current_mode_schedule" : { "new_mode" : "on_till_sched"},
					"current_mode_on_till_sched" : { "new_mode" : "off_till_sched"},
					"current_mode_off_till_sched" : { "new_mode" : "on_till_sched"},
					"current_mode_on" : { "new_mode" : "off"},
					"current_mode_off" : { "new_mode" : "on"}
				},
				"camera_status_unauthorized" : {
					"current_mode_schedule" : { "new_mode" : false},
					"current_mode_on_till_sched" : { "new_mode" : false},
					"current_mode_off_till_sched" : { "new_mode" : false},
					"current_mode_on" : { "new_mode" : false},
					"current_mode_off" : { "new_mode" : false}
				}
			};

			return new (function(tbl){
				this.tbl = tbl;
				this.camera = function(val) {
					camera_status = "";
					if(val == "active"){
						camera_status = "on";
					} else if (val == "inactive" || val == "inactive_by_scheduler"){
						camera_status = "off";
					} else if (val == "offline") {
						camera_status = "offline";
					} else {
						camera_status = val;
						console.log("Unknown camera status: " + val);
					}
					return new (function(tbl2){
						this.tbl2 = tbl2;
						this.mode = function(val) {
							if (val != "schedule"
								&& val != "on_till_sched"
								&& val != "off_till_sched"
								&& val != "on" && val != "off") {
								console.log("Unknown camera mode: " + val);
							}
							return this.tbl2["current_mode_" + val]
						};
					})(this.tbl["camera_status_" + camera_status]);
				};
			})(tbl);
		},
    };

    //_.extend(application, bb.Events);
    return application;
});
