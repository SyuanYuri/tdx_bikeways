<script>
import { ref, reactive, onMounted, onBeforeUnmount, inject, watch } from "vue";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import Wkt from "wicket";
import L from "leaflet";
import axios from "axios";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { getAuthorization } from '@/utils/authorization.js';

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
    let map = ref(null);
    let longitude = ref(null);
    let latitude = ref(null);
    let myLayer = ref(null);
    let data = reactive({ arr: [] });
    let filterData = reactive({ arr: [] });

    const availableStationList = inject("availableStation", []);
    const stationPosition = inject("stationPosition", []);
    const geometryValue = inject("geometry", []);
    const createPopupTemplate = require("@/utils/popupTemplate.js");

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
          markers.addTo(map.value);
          markers.addLayer(
            L.marker(
              [
                item.StationPosition.PositionLat,
                item.StationPosition.PositionLon,
              ],
              { icon: gold }
            ).bindPopup(createPopupTemplate(item), popupOptions)
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
        map.value.setView(
          [
            item.arr.StationPosition.PositionLat,
            item.arr.StationPosition.PositionLon,
          ],
          18
        );

        L.popup({
          maxWidth: "500",
          className: "popupCustom",
        })
          .setLatLng([
            item.arr.StationPosition.PositionLat,
            item.arr.StationPosition.PositionLon,
          ])
          .setContent(createPopupTemplate(item.arr))
          .openOn(map.value);
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

<template>
  <div class="overflow-hidden font-serif">
    <div id="mapContainer"></div>
  </div>
</template>

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
