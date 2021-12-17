<script>
export default {
  name: "Route",
};
</script>

<script setup>
import { routeCityList } from "@/utils/routeCityList.js";
import { ref, reactive, watch, provide } from "vue";
import axios from "axios";
import Map from "@/components/Map.vue";
import Spinner from "@/components/Spinner.vue";
import { Icon } from "@iconify/vue";
import { getAuthorization } from '@/utils/authorization.js';

let loading = ref(false);
let cityName = ref("");
let inputValue = ref("");
let addressCityName = ref("");
let addressInputValue = ref("");
let cityDistrict = ref("");
const districtList = reactive({ list: [] });
const allStation = reactive({ list: [] });
const stationRoute = reactive({ list: [] });
const alertState = reactive([false, false]);

watch(addressCityName, () => {
  // 縣市變更則清空區域
  cityDistrict.value = "";
  addressInputValue.value = "";
  let selectItem = routeCityList.group.find(
    (item) => item.enName === addressCityName.value
  );
  districtList.list = selectItem.district;
});

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
      url: `https://ptx.transportdata.tw/MOTC/v2/Cycling/Shape/${cityValue}?$format=JSON`,
      headers: getAuthorization(),
    });
    allStation.list = res.data;

    if (item === "name") {
      inputValue.value !== ""
        ? (stationRoute.list = allStation.list.filter((item) =>
          item.RouteName?.includes(inputValue.value)
        ))
        : (stationRoute.list = allStation.list);
    } else {
      if (cityDistrict.value !== "") {
        stationRoute.list = allStation.list.filter(
          (item) => item.Town === cityDistrict.value
        );

        addressInputValue.value !== ""
          ? (stationRoute.list = stationRoute.list.filter(
            (item) =>
              item.RoadSectionStart?.includes(addressInputValue.value) ||
              item.RoadSectionEnd?.includes(addressInputValue.value)
          ))
          : null;
      } else {
        addressInputValue.value !== ""
          ? (stationRoute.list = allStation.list.filter(
            (item) =>
              item.RoadSectionStart?.includes(addressInputValue.value) ||
              item.RoadSectionEnd?.includes(addressInputValue.value)
          ))
          : (stationRoute.list = allStation.list);
      }
    }
    loading.value = false;
  } catch (error) {
    console.log(error);
  }
}

const geometry = reactive({ arr: [] });
provide("geometry", geometry);

function getPosition(item) {
  geometry.arr = item.Geometry;
}
</script>

<template>
  <div class="overflow-hidden w-screen h-screen bg-dark_100 grid">
    <div class="flex flex-col justify-center my-auto">
      <div>
        <h3 class="text-left text-light text-2xl ml-10 phone:ml-28 mb-3">自行車路線總覽</h3>
      </div>
      <Map />
      <div class="grid grid-cols-1 laptop:grid-cols-3 gap-3 w-full bg-dark_100">
        <div class="mt-5 mx-2 laptop:ml-10 grid grid-cols-2 laptop:grid-cols-1 place-items-center">
          <div class="flex flex-col">
            <span class="text-left text-light text-lg">依自行車道名稱</span>
            <div class="flex flex-col tablet:flex-row">
              <select
                v-model="cityName"
                class="text-blue_400 bg-dark border-2 rounded-md shadow-2xl border-blue_300 py-1 px-1 mr-4 my-2 w-full tablet:w-32"
                name="city"
                id="city"
              >
                <option disabled selected="true" value>縣市</option>
                <option
                  v-for="item in routeCityList.group"
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
                placeholder="搜尋自行車道關鍵字"
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
            <span class="text-left text-light text-lg">依自行車道區域</span>
            <div class="flex flex-col tablet:flex-row tablet:mr-auto">
              <div class="flex">
                <select
                  v-model="addressCityName"
                  class="text-blue_400 bg-dark border-2 rounded-md shadow-2xl border-blue_300 py-1 px-1 mr-4 my-2 w-full tablet:w-22"
                  name="city"
                  id="city"
                >
                  <option disabled selected="true" value>縣市</option>
                  <option
                    v-for="item in routeCityList.group"
                    :key="item"
                    :value="item.enName"
                  >{{ item.cityName }}</option>
                </select>
                <select
                  v-model="cityDistrict"
                  class="text-blue_400 bg-dark border-2 rounded-md shadow-2xl border-blue_300 py-1 px-1 tablet:mr-4 my-2 w-full tablet:w-22"
                  name="city"
                  id="city"
                >
                  <option disabled selected="true" value>區域</option>
                  <option v-for="item in districtList.list" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>
              <div class="my-auto" v-show="alertState[1]">
                <div class="flex flex-nowrap text-danger">
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
                placeholder="搜尋自行車道起點終點"
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
        <div v-show="loading" style="position: absolute; right: 50%">
          <Spinner />
        </div>
        <!-- 清單 -->
        <div
          v-if="stationRoute.list.length !== 0"
          class="col-span-2 mt-auto h-64 overflow-y-auto border-blue_400 px-5 pt-7"
        >
          <ul class="grid grid-cols-1 desktop:grid-cols-2">
            <li v-for="item in stationRoute.list" :key="item">
              <div
                class="flex flex-col phone:flex-row justify-between border-b-2 border-blue_400 mx-2 hover:bg-dark"
              >
                <div
                  @click="getPosition(item)"
                  class="flex flex-col h-32 p-3"
                  style="cursor: pointer"
                >
                  <div class="flex my-auto content-center">
                    <div class="flex flex-col">
                      <div class="grid grid-cols-7">
                        <span
                          class="col-span-6 text-light text-lg text-left desktop:w-72 w-full"
                        >{{ item.RouteName }}</span>
                        <span
                          v-show="item.Direction"
                          class="ml-3 my-auto border-2 border-blue_400 rounded-full pb-1 w-20 text-blue_400 place-self-end"
                        >{{ item.Direction }}</span>
                      </div>

                      <div
                        class="flex text-sm text-gray my-auto"
                      >{{ `${item.City} | ${item.AuthorityName}` }}</div>
                    </div>
                  </div>

                  <div class="text-left text-sm text-gray my-auto">
                    {{
                      `起點：${item.RoadSectionStart} | 終點：${item.RoadSectionEnd}`
                    }}
                  </div>
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
