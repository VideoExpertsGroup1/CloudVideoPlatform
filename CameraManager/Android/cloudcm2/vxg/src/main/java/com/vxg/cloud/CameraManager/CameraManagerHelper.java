//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

package com.vxg.cloud.CameraManager;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

public class CameraManagerHelper {
    private static final String TAG = CameraManagerHelper.class.getSimpleName();

    public static String getLocalIpAddress() {
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress() && inetAddress instanceof Inet4Address) {
                        return inetAddress.getHostAddress();
                    }
                }
            }
        } catch (SocketException ex) {
            Log.e(TAG, "getLocalIpAddress: ", ex);
        }
        return null;
    }

    public static String getMACAddress(String interfaceName) {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface intf : interfaces) {
                if (interfaceName != null) {
                    if (!intf.getName().equalsIgnoreCase(interfaceName)) continue;
                }
                byte[] mac = intf.getHardwareAddress();
                if (mac==null) return "";
                StringBuilder buf = new StringBuilder();
                for (int idx=0; idx<mac.length; idx++)
                    buf.append(String.format("%02X", mac[idx]));
                if (buf.length()>0) buf.deleteCharAt(buf.length()-1);
                return buf.toString();
            }
        } catch (Exception ex) {
            Log.e(TAG,"getMacAddress", ex);
        }
        return "";
    }

    public static boolean cropPreview(File preview, File previewCrop, int cropWidth, int cropHeight) {
        // preview saved to preview_fullscreen

        // crop image
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inPreferredConfig = Bitmap.Config.ARGB_8888;
        Log.i(TAG, "cropPreview: " + preview.getAbsolutePath());
        Log.i(TAG, "cropPreview: exists: " + preview.exists());
        Bitmap srcBmp = BitmapFactory.decodeFile(preview.getAbsolutePath(), options);
        Bitmap dstBmp = null;
        if(srcBmp == null){
            Log.e(TAG, "cropPreview failed: could not decode file " + preview.getAbsolutePath());
            return false;
        }
        Double bmpWidth = (double) srcBmp.getWidth();
        Double bmpHeight = (double) srcBmp.getHeight();
        Double previewWidth = (double) cropWidth;
        Double previewHeight = (double) cropHeight;
        // crop preview
        if (srcBmp.getWidth() <= srcBmp.getHeight()){
            Double kx = bmpWidth/previewWidth;
            int height = Double.valueOf(240*kx).intValue();
            Bitmap b = Bitmap.createBitmap(srcBmp, 0, srcBmp.getHeight()/2 - height/2, srcBmp.getWidth(), height);
            dstBmp = Bitmap.createScaledBitmap(b, cropWidth, cropHeight, false);
        }else{
            Double ky = bmpHeight/previewHeight;
            int width = Double.valueOf(320*ky).intValue();
            Bitmap b = Bitmap.createBitmap(srcBmp, srcBmp.getWidth()/2 - width/2, 0, width, srcBmp.getHeight());
            dstBmp = Bitmap.createScaledBitmap(b, cropWidth, cropHeight, false);
        }

        // save cropped preview
        try{
            FileOutputStream filePreviewOutputStream = new FileOutputStream(previewCrop);
            dstBmp.compress(Bitmap.CompressFormat.JPEG, 75, filePreviewOutputStream);
            filePreviewOutputStream.flush(); // Not really required
            filePreviewOutputStream.close(); // do not forget to close the stream
        }catch(FileNotFoundException e){
            Log.e(TAG, "File not found " + e.getMessage());
            e.printStackTrace();
            return false;
        }catch(IOException e){
            Log.e(TAG, "IOException " + e.getMessage());
            e.printStackTrace();
            return false;
        }
        return true;
    }
}
