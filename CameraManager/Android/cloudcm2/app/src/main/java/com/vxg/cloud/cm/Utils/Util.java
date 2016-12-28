package com.vxg.cloud.cm.Utils;

import android.os.Environment;
import android.util.Log;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Calendar;
import java.util.Enumeration;

public class Util {
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
            ex.printStackTrace();
        }
        return null;
    }

    public static int pingHost(String host) {
        Runtime runtime = Runtime.getRuntime();
        Process proc = null;
        try {
            proc = runtime.exec("ping -c 1 " + host);
        } catch (IOException e) {
            e.printStackTrace();
        }
        try {
            proc.waitFor();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        int exit = proc.exitValue();
        return exit;
    }

    public static void writeLog(String name, String tag) {
        String filePath = Environment.getExternalStorageDirectory() + "/" + name + "_logcat_" + Calendar.getInstance().getTimeInMillis() +".txt";
        try {
            Runtime.getRuntime().exec(new String[]{"logcat", "-v", "time", "-f", filePath, tag});
        } catch (IOException e) {
            Log.e("writeLog", "onSave logs: ",e );
        }
    }
}