package com.vxg.ServiceProvider;

import android.util.Log;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.TimeZone;

public class ServiceProviderHelper {
    private static String TAG = "ServiceProviderHelper";
    public static long SERVER_TIME_DIFF = 0;

    public static long parseTime(String time){
        Calendar cal = Calendar.getInstance();
        String format1 = "yyyy-MM-dd'T'HH:mm:ss";
        String format2 = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS";
        String format = null;
        if(time.length() == 19){
            format = format1;
        }else if(time.length() == 26){
            format = format2;
        }
        if(format == null)
            return 0;
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        try {
            cal.setTime(sdf.parse(time));
        } catch (ParseException e) {
            Log.e(TAG, "parseTime", e);
        }
        return cal.getTime().getTime();
    }

    public static String formatTime(long time){
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(time);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(cal.getTime());
    }

    public static String formatTime_withSSSSSS(long time){
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(time);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSS");
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(cal.getTime());
    }

    public static long currentTimestampUTC(){
        Calendar cal = Calendar.getInstance();
        return cal.getTime().getTime() - SERVER_TIME_DIFF;
    }

    public static String formatCurrentTimestampUTC(){
        return formatTime(currentTimestampUTC());
    }

    public static String formatCurrentTimestampUTC_SSSSSS(){
        return formatTime_withSSSSSS(currentTimestampUTC());
    }
}
