package com.vxg.AccoutProvider;

import org.json.JSONException;
import org.json.JSONObject;


public class AccountProviderUserProfile {
    private String m_sEmail = "";
    private String m_sFirstName = "";
    private String m_sLastName = "";
    private String m_sCountry = "";
    private String m_sRegion = "";
    private String m_sCity = "";
    private String m_sAddress = "";
    private String m_sPostcode = "";
    private String m_sPhone = "";
    private String m_sContactWay = "";

    public AccountProviderUserProfile(){

    }

    public AccountProviderUserProfile(JSONObject obj){
        m_sEmail = getValue(obj, "email");
        m_sFirstName = getValue(obj, "first_name");
        m_sLastName = getValue(obj, "last_name");
        m_sCountry = getValue(obj, "country");
        m_sRegion = getValue(obj, "region");
        m_sCity = getValue(obj, "city");
        m_sAddress = getValue(obj, "address");
        m_sPostcode = getValue(obj, "postcode");
        m_sPhone = getValue(obj, "phone");
        m_sContactWay = getValue(obj, "contact_way");
    }

    private String getValue(JSONObject obj, String key){
        String val = "";
        if(obj.has(key)){
            try {
                val = obj.getString(key);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return val;
    }

    public String getEmail() { return m_sEmail; }
    public String getFirstName() { return m_sFirstName; }
    public String getLastName() { return m_sLastName; }
    public String getCountry() { return m_sCountry; }
    public String getRegion() { return m_sRegion; }
    public String getCity() { return m_sCity; }
    public String getAddress() { return m_sAddress; }
    public String getPostcode() { return m_sPostcode; }
    public String getPhone() { return m_sPhone; }
    public String getContactWay() { return m_sContactWay; }

    public void setEmail(String newVal) { m_sEmail = newVal; }
    public void setFirstName(String newVal) { m_sFirstName = newVal; }
    public void setLastName(String newVal) { m_sLastName = newVal; }
    public void setCountry(String newVal) { m_sCountry = newVal; }
    public void setRegion(String newVal) { m_sRegion = newVal; }
    public void setCity(String newVal) { m_sCity = newVal; }
    public void setAddress(String newVal) { m_sAddress = newVal; }
    public void setPostcode(String newVal) { m_sPostcode = newVal; }
    public void setPhone(String newVal) { m_sPhone = newVal; }
    public void setContactWay(String newVal) { m_sContactWay = newVal; }
}
