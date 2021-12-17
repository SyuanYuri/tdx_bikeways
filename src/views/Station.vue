<script>
export default {
  name: "Station",
};
</script>

<script setup>
import { cityList } from "@/utils/cityList.js";
import { ref, reactive, provide } from "vue";
import axios from "axios";
import Map from "@/components/Map.vue";
import Spinner from "@/components/Spinner.vue";
import { Icon } from "@iconify/vue";
import { getAuthorization } from '@/utils/authorization.js';

let loading = ref(false);
let cityName = ref("");
let addressCityName = ref("");
const allStation = reactive({ list: [] });
const alertState = reactive([false, false]);

async function searchStation(item) {
  loading.value = true;
  let cityValue;

  item === "name"
    ? (cityValue = cityName.value)
    : (cityValue = addressCityName.value);

  try {
    // 判斷是否已選擇縣市
    if (item === "name" && cityName.value === '') {
      alertState[0] = true;
      loading.value = false;
      return;
    } else if (item !== "name" && addressCityName.value === '') {
      alertState[1] = true;
      loading.value = false;
      return;
    }

    alertState[0] = false;
    alertState[1] = false;

    const res = await axios({
      method: "get",
      url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/${cityValue}?$format=JSON`,
      headers: getAuthorization(),
    });
    allStation.list = res.data;
    item === "name"
      ? getAvailabilityStation("name")
      : getAvailabilityStation("address");
  } catch (error) {
    console.log(error);
  }
}

let inputValue = ref("");
let addressInputValue = ref("");
let availableStation = reactive({ list: [] });
provide("availableStation", availableStation);

async function getAvailabilityStation(value) {
  let cityValue;
  if (value === "name") {
    cityValue = cityName.value;
  } else {
    cityValue = addressCityName.value;
  }
  try {
    const res = await axios({
      method: "get",
      url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/${cityValue}?$format=JSON`,
      headers: getAuthorization(),
    });
    availableStation.list = [];
    res.data.forEach((availableItem) => {
      allStation.list.forEach((stationItem) => {
        if (availableItem.StationUID === stationItem.StationUID) {
          availableItem.StationName = stationItem.StationName;
          availableItem.StationAddress = stationItem.StationAddress;
          availableItem.StationPosition = stationItem.StationPosition;
          availableStation.list.push(availableItem);
        }
      });
    });

    if (value === "name") {
      if (inputValue.value !== "") {
        availableStation.list = availableStation.list.filter((item) =>
          item.StationName.Zh_tw.match(inputValue.value)
        );
      }
    } else if (addressInputValue.value !== "") {
      availableStation.list = availableStation.list.filter((item) =>
        item.StationAddress.Zh_tw.match(addressInputValue.value)
      );
    }
    loading.value = false;
  } catch (error) {
    console.log(error);
  }
}

let stationPosition = reactive({ arr: [] });
provide("stationPosition", stationPosition);

function getPosition(item) {
  stationPosition.arr = item;
}
</script>

<template>
  <div class="overflow-hidden w-screen h-screen bg-dark_100 grid">
    <div class="flex flex-col justify-center my-auto">
      <div>
        <h3 class="text-left text-light text-2xl ml-10 phone:ml-28 mb-3">單車站總覽</h3>
      </div>
      <Map />
      <div class="grid grid-cols-1 laptop:grid-cols-3 gap-3 w-full bg-dark_100">
        <div class="mt-5 mx-2 laptop:ml-10 grid grid-cols-2 laptop:grid-cols-1 place-items-center">
          <div class="flex flex-col">
            <span class="text-left text-light text-lg">依單車站名稱</span>
            <div class="flex flex-col tablet:flex-row">
              <select
                v-model="cityName"
                class="text-blue_400 bg-dark border-2 rounded-md shadow-2xl border-blue_300 py-1 px-1 mr-4 my-2 w-full tablet:w-32"
                name="city"
                id="city"
              >
                <option disabled selected="true" value>縣市</option>
                <option
                  v-for="item in cityList.group"
                  :key="item"
                  :value="item.enName"
                >{{ item.cityName }}</option>
              </select>
              <div class="my-auto" v-show="alertState[0]">
                <div class="flex text-danger">
                  <Icon class="my-auto mr-1" icon="mdi:alert-circle" />
                  <span class="text-sm">請選擇縣市</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col tablet:flex-row">
              <input
                v-model="inputValue"
                class="bg-dark rounded-md shadow-2xl text-light py-2 pl-2 mr-2 mt-1 w-32 w-full tablet:w-56 text-sm"
                type="text"
                name="search"
                id="search"
                placeholder="搜尋車站關鍵字"
              />
              <button
                class="rounded-md bg-secondary mt-3 tablet:mt-1 h-10 hover-style"
                @click="searchStation('name')"
              >
                <span class="flex pl-4 pr-6">
                  <img src="@/assets/images/icon-search.svg" alt />
                  <span class="text-dark ml-2 font-bold text-sm whitespace-nowrap">查詢</span>
                </span>
              </button>
            </div>
          </div>
          <div class="flex flex-col laptop:mt-4 mt-0 laptop:ml-0 ml-2">
            <span class="text-left text-light text-lg">依單車站地址</span>
            <div class="flex flex-col tablet:flex-row">
              <select
                v-model="addressCityName"
                class="text-blue_400 bg-dark border-2 rounded-md shadow-2xl border-blue_300 py-1 px-1 mr-4 my-2 w-full tablet:w-32"
                name="city"
                id="city"
              >
                <option disabled selected="true" value>縣市</option>
                <option
                  v-for="item in cityList.group"
                  :key="item"
                  :value="item.enName"
                >{{ item.cityName }}</option>
              </select>
              <div class="my-auto" v-show="alertState[1]">
                <div class="flex text-danger">
                  <Icon class="my-auto mr-1" icon="mdi:alert-circle" />
                  <span class="text-sm">請選擇縣市</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col tablet:flex-row">
              <input
                v-model="addressInputValue"
                class="bg-dark rounded-md shadow-2xl text-light py-2 pl-2 mr-2 mt-1 w-32 w-full tablet:w-56 text-sm"
                type="text"
                name="search"
                id="search"
                placeholder="搜尋地址關鍵字"
              />
              <button
                class="rounded-md bg-secondary mt-3 tablet:mt-1 h-10 hover-style"
                @click="searchStation('address')"
              >
                <span class="flex pl-4 pr-6">
                  <img src="@/assets/images/icon-search.svg" alt />
                  <span class="text-dark mt-0 ml-2 font-bold text-sm whitespace-nowrap">查詢</span>
                </span>
              </button>
            </div>
          </div>
        </div>
        <div style="position: absolute; right: 50%" v-show="loading">
          <Spinner />
        </div>
        <!-- 清單 -->
        <div
          v-if="availableStation.list.length !== 0"
          class="col-span-2 mt-auto h-64 overflow-y-auto border-blue_400 px-5 pt-7"
        >
          <ul class="grid grid-cols-1 xl:grid-cols-2">
            <li v-for="item in availableStation.list" :key="item">
              <div
                class="flex flex-col phone:flex-row justify-between border-b-2 border-blue_400 p-3 mx-2 hover:bg-dark"
              >
                <div @click="getPosition(item)" class="flex flex-col h-28" style="cursor: pointer">
                  <div class="flex content-center mr-auto">
                    <div class="my-auto mr-4 h-full">
                      <img class="h-10" src="@/assets/images/icon-station.svg" alt />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-light text-lg text-left w-60">
                        {{
                          `${item.StationName.Zh_tw.substr(11)}`
                        }}
                      </span>
                      <div class="flex text-xs mt-1">
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
                    class="w-80 text-left text-sm text-gray my-auto"
                  >地址：{{ `${item.StationAddress.Zh_tw}` }}</div>
                </div>
                <div class="flex phone:flex-col flex-row my-auto phone:w-28">
                  <button
                    class="bg-blue_100 text-white font-montserrat w-full py-1.5 px-4 mb-2 mr-4 phone:mr-0 font-medium rounded-xl duration-300"
                  >
                    <div
                      class="w-7 inline-block text-lg font-semibold text-primary"
                      style="letter-spacing: 1px"
                    >{{ `${item.AvailableRentBikes}` }}</div>
                    <span class="ml-1 text-blue_400 text-sm">可租</span>
                  </button>
                  <button
                    class="bg-blue_100 text-white font-montserrat w-full py-1.5 phone:mb-0 mb-2 px-4 font-medium rounded-xl duration-300"
                  >
                    <div
                      class="w-7 inline-block text-lg font-semibold"
                      style="letter-spacing: 1px"
                    >{{ `${item.AvailableReturnBikes}` }}</div>
                    <span class="ml-1 text-blue_400 text-sm">可還</span>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="col-span-2 m-auto laptop:mt-auto mt-5 text-light">
          <div class="flex">
            <Icon class="text-2xl my-auto mr-1" icon="mdi:alert-circle-outline" />
            <span class="text-lg">尚無符合的資料</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
