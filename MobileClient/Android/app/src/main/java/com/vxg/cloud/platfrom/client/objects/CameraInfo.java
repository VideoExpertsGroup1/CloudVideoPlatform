package com.vxg.cloud.platfrom.client.objects;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class CameraInfo {

    private boolean hosted;
    private int id;
    private String cameraName;
    private String uuid;

    public static CameraInfo fromJson(JSONObject obj){
        CameraInfo cam = new CameraInfo();

        /* {"meta": {"limit": 20, "next": null, "offset": 0, "previous": null, "total_count": 1},
        "objects": [{"access": ["all"], "cmngrid": 1764, "id": 1768, "mode": "on", "name": "S5", "rec_mode": "on", "rec_status": "on", "status": "active",
            "timezone": "Etc/GMT-7", "uuid": "c9e81779-34c2-4a3d-8c09-710c5729c3d9"}]}*/

        try {

            if(obj.has("id")){
                cam.setId(obj.getInt("id"));
            }
            if(obj.has("name")){
                String name = obj.getString("name");
                Log.i("CameraInfo", name);
                cam.setCameraName(name);
            }

            if(obj.has("uuid")){
                cam.setUuid(obj.getString("uuid"));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return cam;
    }

    public void setHosted(boolean hosted) {
        this.hosted = hosted;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getCameraName() {
        return cameraName;
    }

    public void setCameraName(String cameraName) {
        this.cameraName = cameraName;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}
