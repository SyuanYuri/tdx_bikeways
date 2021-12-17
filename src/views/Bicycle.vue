<script>
export default {
  name: "Bicycle",
};
</script>

<script setup>
import { ref, reactive } from "vue";
import Spinner from "@/components/Spinner.vue";
import axios from "axios";
import moment from "moment";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getAuthorization } from '@/utils/authorization.js';

let map = ref(null);
let longitude = ref(null);
let latitude = ref(null);
let dataState = ref(false);
let disabledState = ref(false);
let zoomSize = ref(15);
const createPopupTemplate = require("@/utils/popupTemplate.js");

function getGeolocation(state) {
  dataState.value = state;
  disabledState.value = state;
  // 避免連續點擊
  if (state === true) {
    setTimeout(() => {
      disabledState.value = false;
    }, 5000);
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        longitude = position.coords.longitude; // 經度
        latitude = position.coords.latitude; // 緯度

        if (!dataState.value) {
          map.value = L.map("mapContainer", {
            // 解決 _latLngToNewLayerPoint Error
            zoomAnimation: false,
          }).setView([latitude, longitude], zoomSize.value);

          L.tileLayer(
            "https://api.mapbox.com/styles/v1/{username}/{style_id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
            {
              attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
              maxZoom: 18,
              username: "syuanyuri",
              style_id: "ckwed0k4q6lv514mgqg7ag9bx",
              tileSize: 512,
              zoomOffset: -1,
              accessToken:
                "pk.eyJ1Ijoic3l1YW55dXJpIiwiYSI6ImNrd2VjaXl3dTAzNDUyd211d24zdDA2aG0ifQ.drmQawAClWnVDMO16doFog",
            }
          ).addTo(map.value);
        }
        getStationData(longitude, latitude);
      },
      // 錯誤訊息
      function errorCallback(error) {
        console.error(`ERROR ${error.code} : ${error.message}`);
      }
    );
  }
}

getGeolocation();

function setZoom(value) {
  if (value === "plus") {
    zoomSize.value < 18 ? zoomSize.value++ : zoomSize.value;
  } else {
    zoomSize.value > 1 ? zoomSize.value-- : zoomSize.value;
  }
  map.value.setZoom(zoomSize.value);
}

const data = reactive({ arr: [] });
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
    // 避免刷新時重複設置
    if (!dataState.value) {
      setMarker();
    }
  } catch (error) {
    console.log("處理錯誤訊息", error);
  }
}

let lastTime = ref(null);
const filterList = reactive({ arr: [] });
const stationList = reactive({ list: [] });

// 即時車位
async function getAvailableData(longitude, latitude) {
  try {
    const res = await axios({
      method: "get",
      url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/NearBy?$spatialFilter=nearby(${latitude},${longitude},1000)`,
      headers: getAuthorization(),
    });
    const availableData = res.data;

    filterList.arr = [];

    availableData.forEach((availableItem) => {
      data.arr.forEach((stationItem) => {
        if (availableItem.StationUID === stationItem.StationUID) {
          // 新增欄位
          availableItem.StationName = stationItem.StationName;
          availableItem.StationAddress = stationItem.StationAddress;
          availableItem.StationPosition = stationItem.StationPosition;
          filterList.arr.push(availableItem);
        }
      });
    });

    moment.locale("zh-cn");
    lastTime.value = moment(filterList.arr[0].SrcUpdateTime).format("lll");

    stationList.list = filterList.arr;
    // 避免刷新時重複設置
    if (!dataState.value) {
      setMarker();
    }
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

function setMarker() {
  const markers = new L.markerClusterGroup();
  filterList.arr.forEach((item) => {
    const popupOptions = {
      maxWidth: "500",
      className: "popupCustom",
    };
    markers.addTo(map.value);
    markers.addLayer(
      L.marker(
        [item.StationPosition.PositionLat, item.StationPosition.PositionLon],
        { icon: gold }
      ).bindPopup(createPopupTemplate(item), popupOptions)
    );
    map.value.addLayer(markers);
  });
}

let loading = ref(false);
let noData = ref(false);
let inputValue = ref("");

function getNearByStation() {
  loading.value = true;
  if (inputValue.value === "") {
    filterList.arr = stationList.list;
  } else {
    filterList.arr = filterList.arr.filter((item) =>
      item.StationName.Zh_tw.match(inputValue.value)
    );
  }
  filterList.arr.length ? (noData.value = false) : (noData.value = true);
  loading.value = false;
}

function filterTab(item) {
  inputValue.value = "";
  getNearByStation();

  if (item === "return") {
    filterList.arr = filterList.arr.filter((e) => e.AvailableReturnBikes !== 0);
  } else if (item === "rent") {
    filterList.arr = filterList.arr.filter((e) => e.AvailableRentBikes !== 0);
  } else {
    filterList.arr = stationList.list;
  }
}

function getPosition(item) {
  map.value.setView(
    [item.StationPosition.PositionLat, item.StationPosition.PositionLon],
    17
  );

  L.popup({
    maxWidth: "500",
    className: "popupCustom",
  })
    .setLatLng([
      item.StationPosition.PositionLat,
      item.StationPosition.PositionLon,
    ])
    .setContent(createPopupTemplate(item))
    .openOn(map.value);
}
</script>

<template>
  <div class="overflow-hidden">
    <div class="search-box">
      <div class="rounded-xl bg-blue_100 text-yellow shadow-2xl" style="max-width: 400px">
        <div class="px-5 pt-8 pb-4">
          <span class="flex mb-3">
            <h3
              class="text-base phone:text-lg tracking-widest shadow-2xl"
              style="font-weight: bold"
            >下班後來兜風，找單車站…</h3>
            <img src="@/assets/images/icon_bike.svg" alt />
          </span>
          <div class="flex">
            <span>
              <input
                v-model="inputValue"
                class="bg-dark rounded-md shadow-2xl py-3 pl-2 mr-2 mt-1 w-52 w-full phone:w-72 relative text-sm"
                type="text"
                name="search"
                id="search"
                placeholder="搜尋附近的車站"
              />
            </span>
            <button @click="getNearByStation()">
              <img class="h-14 ml-2" src="@/assets/images/icon_search_btn.png" alt />
            </button>
          </div>
          <div class="mt-2 flex">
            <span class="hidden phone:block phone:mr-auto my-auto">附近站點</span>
            <ul class="flex text-blue_400 text-sm">
              <li>
                <button
                  @click="filterTab(null)"
                  class="border-2 rounded-full py-1 px-3 focus:bg-blue_400 focus:text-dark_300"
                  style="font-weight: bold"
                >全部</button>
              </li>
              <li class="mx-2">
                <button
                  @click="filterTab('rent')"
                  class="border-2 rounded-full py-1 px-3 focus:bg-blue_400 focus:text-dark_300"
                  style="font-weight: bold"
                >可租</button>
              </li>
              <li>
                <button
                  @click="filterTab('return')"
                  class="border-2 rounded-full py-1 px-3 focus:bg-blue_400 focus:text-dark_300"
                  style="font-weight: bold"
                >可還</button>
              </li>
            </ul>
          </div>
        </div>

        <div
          v-if="filterList.arr.length !== 0"
          class="h-44 phone:h-80 overflow-y-auto border-t-2 border-blue_400 px-2 pt-2 pb-3"
        >
          <div class="m-auto" v-show="loading">
            <Spinner />
          </div>
          <div v-for="item in filterList.arr" :key="item">
            <div
              @click="getPosition(item)"
              class="flex phone:flex-row flex-col p-3 hover:bg-dark_200 rounded-md"
              style="cursor: pointer"
            >
              <div>
                <div class="flex content-center">
                  <div class="my-auto mr-4 h-full">
                    <img class="h-10" src="@/assets/images/icon-station.svg" alt />
                  </div>
                  <div class="flex flex-col">
                    <span
                      class="text-light text-lg text-left w-48"
                    >{{ `${item.StationName.Zh_tw.substr(11)}` }}</span>
                    <div class="flex flex-col phone:flex-row text-left text-xs mt-1">
                      <span class="text-success mr-1">● 正常營運</span>
                      <span class="text-gray">
                        {{
                          `${item.StationName.Zh_tw.substr(0, 10)} | 總數：${item.AvailableRentBikes + item.AvailableReturnBikes}`
                        }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="w-60 text-left text-xs text-gray mt-2"
                >地址：{{ `${item.StationAddress.Zh_tw}` }}</div>
              </div>
              <div class="flex phone:flex-col phone:ml-auto my-auto mt-3 phone:mt-0">
                <button
                  class="bg-dark text-white font-montserrat py-1.5 px-4 w-full mr-4 mb-0 phone:mr-0 phone:mb-2 font-medium rounded-xl duration-300"
                >
                  <div
                    class="w-7 inline-block text-lg font-semibold text-primary"
                    style="letter-spacing: 1px"
                  >{{ `${item.AvailableRentBikes}` }}</div>
                  <span class="ml-1 text-blue_400 text-sm">可租</span>
                </button>
                <button
                  class="bg-dark text-white font-montserrat py-1.5 px-4 w-full font-medium rounded-xl duration-300"
                >
                  <div
                    class="w-7 inline-block text-lg font-semibold"
                    style="letter-spacing: 1px"
                  >{{ `${item.AvailableReturnBikes}` }}</div>
                  <span class="ml-1 text-blue_400 text-sm">可還</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-show="noData" class="h-16 py-5 border-t-2 border-blue_400">尚無符合的資料</div>
      </div>
    </div>

    <div class="absolute phone:bottom-7 right-5" style="z-index: 500">
      <div class="flex phone:flex-col flex-col-reverse">
        <div>
          <button
            @click="setZoom('plus')"
            class="bg-blue_200 rounded-t-xl h-11 w-11 flex items-center justify-center ml-auto"
          >
            <img src="@/assets/images/icon-plus.svg" alt />
          </button>
          <button
            @click="setZoom('reduce')"
            class="bg-blue_200 rounded-b-xl h-11 w-11 flex items-center justify-center ml-auto mt-2"
          >
            <img src="@/assets/images/icon-reduce.svg" alt />
          </button>
        </div>

        <div class="flex flex-col phone:flex-row my-2">
          <span
            v-show="filterList.arr.length !== 0"
            class="my-auto rounded-md bg-dark text-gray text-sm px-3 py-1 mr-2 mb-2"
            style="word-wrap: break-word"
          >最後更新時間：{{ lastTime }}</span>
          <button
            @click="getGeolocation(true)"
            class="ml-auto bg-blue_200 rounded-full h-12 w-12 flex items-center justify-center disabled:opacity-30"
            :disabled="disabledState"
          >
            <img src="@/assets/images/icon-refresh.svg" alt />
          </button>
        </div>
      </div>
    </div>
    <div id="mapContainer"></div>
  </div>
</template>

<style>
#mapContainer {
  width: 100vw;
  height: 100vh;
}

.marker-cluster span {
  font-size: 16px;
  font-weight: bold;
}

.search-box {
  position: fixed;
  bottom: 2rem;
  left: 7rem;
  z-index: 500;
}

@media (max-width: 520px) {
  .search-box {
    bottom: 3.5em;
    left: 3.5em;
    margin: 0 20px;
  }
}

.leaflet-touch .leaflet-control-zoom-in {
  display: none;
}

.leaflet-touch .leaflet-control-zoom-out {
  display: none;
}
</style>
