import jsSHA from "jssha";
// API 驗證
export function getAuthorization() {
  const AppID = "79a73afeb9e64372a7efd89b14614c71";
  const AppKey = "aviwq5lx9v2Ot5mHWwZLb4mJRw0";
  const GMTString = new Date().toGMTString();
  const ShaObj = new jsSHA("SHA-1", "TEXT");
  ShaObj.setHMACKey(AppKey, "TEXT");
  ShaObj.update("x-date: " + GMTString);
  const HMAC = ShaObj.getHMAC("B64");
  let Authorization = `hmac username="${AppID}", algorithm="hmac-sha1", headers="x-date", signature="${HMAC}"`;

  return {
    Authorization: Authorization,
    "X-Date": GMTString,
  };
}