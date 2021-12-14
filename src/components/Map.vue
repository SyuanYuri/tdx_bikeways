<template>
  <div class="overflow-hidden font-serif">
    <div id="mapContainer"></div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onBeforeUnmount, inject, watch } from "vue";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import Wkt from "wicket";
import L from "leaflet";
import axios from "axios";
import jsSHA from "jssha";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// 設定預設 Icon
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default {
  name: "Map",
  props: ["setStationMarker"],

  setup() {
    // API 驗證
    function getAuthorization() {
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

    let map = ref(null);
    let longitude = ref(null);
    let latitude = ref(null);
    let myLayer = ref(null);
    let data = reactive({ arr: [] });
    let filterData = reactive({ arr: [] });

    const availableStationList = inject("availableStation", []);
    const stationPosition = inject("stationPosition", []);
    const geometryValue = inject("geometry", []);

    const popupOptions = reactive({
      maxWidth: "500",
      className: "popupCustom",
    });

    onMounted(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            longitude = position.coords.longitude; // 經度
            latitude = position.coords.latitude; // 緯度

            map.value = L.map("mapContainer", {
              // 解決 _latLngToNewLayerPoint Error
              zoomAnimation: false,
            }).setView([latitude, longitude], 15);

            L.tileLayer(
              "https://api.mapbox.com/styles/v1/{username}/{style_id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
              {
                attribution:
                  'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 16,
                username: "syuanyuri",
                style_id: "ckwed0k4q6lv514mgqg7ag9bx",
                tileSize: 512,
                zoomOffset: -1,
                accessToken:
                  "pk.eyJ1Ijoic3l1YW55dXJpIiwiYSI6ImNrd2VjaXl3dTAzNDUyd211d24zdDA2aG0ifQ.drmQawAClWnVDMO16doFog",
              }
            ).addTo(map.value);

            getStationData(longitude, latitude);
          },
          // 錯誤訊息
          function errorCallback(error) {
            console.error(`ERROR ${error.code} : ${error.message}`);
          }
        );
      }

      // 附近站點
      async function getStationData(longitude, latitude) {
        try {
          const res = await axios({
            method: "get",
            url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
            headers: getAuthorization(),
          });
          data.arr = res.data;
          getAvailableData(longitude, latitude);
          setMarker();
        } catch (error) {
          console.log(error);
        }
      }

      // 即時車位
      async function getAvailableData(longitude, latitude) {
        try {
          const res = await axios({
            method: "get",
            url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
            headers: getAuthorization(),
          });
          const availableData = res.data;

          availableData.forEach((availableItem) => {
            data.arr.forEach((stationItem) => {
              if (availableItem.StationUID === stationItem.StationUID) {
                // 新增欄位
                availableItem.StationName = stationItem.StationName;
                availableItem.StationAddress = stationItem.StationAddress;
                availableItem.StationPosition = stationItem.StationPosition;
                filterData.arr.push(availableItem);
              }
            });
          });
          setMarker();
        } catch (error) {
          console.log(error);
        }
      }

      // Icon 樣式
      let gold = new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      function setMarker(item) {
        const markers = new L.markerClusterGroup();
        let list;

        item ? (list = item.list) : (list = filterData.arr);
        list.forEach((item) => {
          let popupContents = `
          <div class="flex">
            <div class="flex flex-col mr-2">
              <h5 class="text-xl font-medium">
              ${item.StationName.Zh_tw.substr(11)}
              </h5>
                <div class="flex text-sm">
                  <span class="text-success mr-1">● 正常營運</span>
                  <span class="text-gray">
                  ${item.StationName.Zh_tw.substr(0, 10)}
                  | 總數：${item.AvailableRentBikes + item.AvailableReturnBikes}
                  </span>
                </div>
              <h6 class="mt-auto text-sm text-gray">
                地址：${item.StationAddress.Zh_tw}
              </h6>
            </div>
            <div class="flex flex-col">
              <button class="bg-blue_100 text-white font-montserrat py-2 px-5 mb-2 font-medium rounded-xl duration-300">
                <div class="w-7 inline-block text-lg font-semibold text-primary" style="letter-spacing: 1px;">
                  ${item.AvailableRentBikes}
                </div>
                <span class="text-blue_400 text-sm">可租</span>
              </button>
              <button class="bg-blue_100 text-white font-montserrat py-2 px-5 font-medium rounded-xl duration-300">
                <div class="w-7 inline-block text-lg font-semibold" style="letter-spacing: 1px;">
                  ${item.AvailableReturnBikes}
                </div>
                <span class="text-blue_400 text-sm">可還</span>
              </button>
            </div>
          </div>`;
          markers.addTo(map.value);
          markers.addLayer(
            L.marker(
              [
                item.StationPosition.PositionLat,
                item.StationPosition.PositionLon,
              ],
              { icon: gold }
            ).bindPopup(popupContents, popupOptions)
          );
          map.value.addLayer(markers);
        });
      }

      function setLine(item) {
        // 避免重複繪製
        if (myLayer.value) {
          map.value.removeLayer(myLayer.value);
        }

        const wicket = new Wkt.Wkt();
        const geojsonFeature = wicket.read(item).toJson();

        const mapStyle = {
          color: "#FFCE65",
          weight: 5,
          opacity: 0.8,
        };
        myLayer.value = L.geoJSON(geojsonFeature, {
          style: mapStyle,
        }).addTo(map.value);

        myLayer.value.addData(geojsonFeature);
        map.value.fitBounds(myLayer.value.getBounds());
      }

      watch(geometryValue, () => {
        setLine(geometryValue.arr);
      });

      watch(availableStationList, (item) => {
        setMarker(item);
      });

      watch(stationPosition, (item) => {
        let popupContents = `
          <div class="flex">
            <div class="flex flex-col mr-2">
              <h5 class="text-xl font-medium">
              ${item.arr.StationName.Zh_tw.substr(11)}
              </h5>
                <div class="flex text-sm">
                  <span class="text-success mr-1">● 正常營運</span>
                  <span class="text-gray">
                  ${item.arr.StationName.Zh_tw.substr(0, 10)}
                  | 總數：${
                    item.arr.AvailableRentBikes + item.arr.AvailableReturnBikes
                  }
                  </span>
                </div>
              <h6 class="w-80 mt-auto text-sm text-gray">
                地址：${item.arr.StationAddress.Zh_tw}
              </h6>
            </div>
            <div class="flex flex-col ml-auto">
              <button class="bg-blue_100 text-white font-montserrat py-2 px-5 mb-2 font-medium rounded-xl duration-300">
                <div class="w-7 inline-block text-lg font-semibold text-primary" style="letter-spacing: 1px;">
                  ${item.arr.AvailableRentBikes}
                </div>
                <span class="text-blue_400 text-sm">可租</span>
              </button>
              <button class="bg-blue_100 text-white font-montserrat py-2 px-5 font-medium rounded-xl duration-300">
                <div class="w-7 inline-block text-lg font-semibold" style="letter-spacing: 1px;">
                  ${item.arr.AvailableReturnBikes}
                </div>
                <span class="text-blue_400 text-sm">可還</span>
              </button>
            </div>
          </div>`;

        map.value.setView(
          [
            item.arr.StationPosition.PositionLat,
            item.arr.StationPosition.PositionLon,
          ],
          18
        );
        L.marker(
          [
            item.arr.StationPosition.PositionLat,
            item.arr.StationPosition.PositionLon,
          ],
          { icon: gold }
        )
          .addTo(map.value)
          .bindPopup(popupContents, popupOptions)
          .openPopup();
      });
    });

    onBeforeUnmount(() => {
      if (map.value) {
        map.value.remove();
      }
    });
  },
};
</script>

<style lang="scss" scoped>
#mapContainer {
  width: 90%;
  height: 40vh;
  margin: auto;
  border: 3px solid #31506c;
  border-radius: 20px;
  font-family: "Noto Sans TC", "Nunito Sans", sans-serif;
}
</style>
