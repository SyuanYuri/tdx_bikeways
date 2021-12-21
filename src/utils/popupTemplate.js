module.exports = (list) => `
<div class="flex flex-col">
  <div class="flex">
    <div class="flex flex-col mr-2">
      <h5 class="text-lg font-medium">${list.StationName.Zh_tw.substr(11)}</h5>
      <div class="flex text-xs">
        <span class="text-success mr-1">● 正常營運</span>
        <span class="text-gray">
          ${list.StationName.Zh_tw.substr(0, 10)} | 總數：${list.AvailableRentBikes + list.AvailableReturnBikes}
        </span>
      </div>
      <h6 class="w-60 mt-auto text-sm text-gray">
        地址：${list.StationAddress.Zh_tw}
      </h6>
    </div>
    <div class="flex flex-col">
      <button class="bg-blue_100 text-white font-montserrat py-2 px-5 mb-2 font-medium rounded-xl duration-300">
        <div class="w-7 inline-block text-lg font-semibold text-primary" style="letter-spacing: 1px">
          ${list.AvailableRentBikes}
        </div>
        <span class="text-blue_400 text-sm">可租</span>
      </button>
      <button class="bg-blue_100 text-white font-montserrat py-2 px-5 font-medium rounded-xl duration-300">
        <div class="w-7 inline-block text-lg font-semibold" style="letter-spacing: 1px">
          ${list.AvailableReturnBikes}
        </div>
        <span class="text-blue_400 text-sm">可還</span>
      </button>
    </div>
  </div>
  <div>
    <a href="https://www.google.com.tw/maps/place/${list.StationAddress.Zh_tw}" target="_blank">
      <button style="background: linear-gradient(90deg, #F07E3F 0%, #FFCE65 100%);letter-spacing: 2px; border-radius: 5px; font-weight: bold;" class="mt-2 text-dark w-full py-2 text-sm hover:text-blue_100">
        前往導航
      </button>
    </a>
  </div>
</div>`;
