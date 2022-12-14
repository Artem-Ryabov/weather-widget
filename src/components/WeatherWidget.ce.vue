<script lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { City } from "../models/cityInfo";
import { SortabeWeatherReport } from "../models/weatherReport";
import useFetchReport from "../hooks/useFetchReport";
import Settings from "./Settings.vue";
import WeatherCard from "./WeatherCard.vue";

export default {
  name: "WeatherWidget",
};
</script>

<script setup lang="ts">
const { loading, weatherReport, fetchReport, fetchReportByCoord } =
  useFetchReport();

const reportsData = ref<SortabeWeatherReport[]>([]);
const cities = ref<City[]>([]);
const modeSettings = ref<boolean>(false);

const sortReports = (
  prevreport: SortabeWeatherReport,
  nextreport: SortabeWeatherReport
) => {
  if (prevreport.order > nextreport.order) {
    return 1;
  } else if (prevreport.order < nextreport.order) {
    return -1;
  } else {
    return 0;
  }
};

const caclOrder = (array: SortabeWeatherReport[]) =>
  array.sort(sortReports).map((report, index) => {
    report.order = index;
    return report;
  });

const getCities = (array: SortabeWeatherReport[]): City[] =>
  array.map((report) => {
    return {
      name: report.name,
      coutry: report.sys.country,
      order: report.order,
    };
  });

const reports = computed({
  get() {
    return reportsData.value;
  },
  set(newArray: SortabeWeatherReport[]) {
    reportsData.value = caclOrder(newArray);
  },
});

watch(reports, (newArray) => {
  cities.value = getCities(newArray);
  if (newArray.length > 0) {
    localStorage.setItem("reports", JSON.stringify(cities.value));
  } else {
    localStorage.removeItem("reports");
  }
});

const addReport = async (newCity: string) => {
  const exCity = reports.value.find(
    ({ name }) => name.toLowerCase() === newCity.toLowerCase()
  );
  if (exCity) {
    console.error(`Error: ${exCity.name} is already added`);
    return;
  }
  await fetchReport(newCity);
  if (weatherReport.value) {
    reports.value = [
      ...reports.value,
      { ...weatherReport.value, order: reports.value.length },
    ];
  }
};

const removeReport = (name: string) => {
  reports.value = reports.value.filter((report) => report.name !== name);
};

const changeSortReports = (draggedItem: string, dropOnItem: string) => {
  const draggedReport = reports.value.find(
    (report) => report.name === draggedItem
  );
  const dropOnReport = reports.value.find(
    (report) => report.name === dropOnItem
  );

  if (!(draggedReport && dropOnReport)) {
    return;
  }

  const delta = draggedReport.order - dropOnReport.order;

  if (delta === 0) {
    return;
  }

  const order = dropOnReport.order;

  const logic = (i: number, num: number) => (delta > 0 ? i < num : i > num);
  for (
    let i = dropOnReport.order;
    logic(i, draggedReport.order);
    delta > 0 ? i++ : i--
  ) {
    delta > 0 ? reports.value[i].order++ : reports.value[i].order--;
  }

  draggedReport.order = order;
  reports.value = reports.value;
};

onMounted(async () => {
  const cities = localStorage.getItem("reports");
  if (cities != null) {
    for (const { name } of JSON.parse(cities) as City[]) {
      await addReport(name);
    }
  } else {
    window.navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      await fetchReportByCoord(coords.latitude, coords.longitude);
      if (weatherReport.value) {
        reports.value = [
          ...reports.value,
          { ...weatherReport.value, order: reports.value.length },
        ];
      }
    });
  }
});
</script>

<template>
  <div class="weather-widget">
    <div>
      <span>Weather widget</span>
      <button
        class="settings-btn"
        :class="modeSettings ? 'settings-btn_close' : 'settings-btn_open'"
        @click="() => (modeSettings = !modeSettings)"
      ></button>
    </div>
    <Settings
      v-if="modeSettings"
      :cities="cities"
      @add="addReport"
      @sort="changeSortReports"
      @delete="removeReport"
    />
    <WeatherCard
      v-else
      v-for="report in reports"
      :key="report.name"
      :report="report"
    />
    <div v-if="!modeSettings && loading" class="loader-spinner">
      <div></div>
    </div>
  </div>
</template>

<style lang="scss">
@mixin boldFont($multiplier: 1) {
  font-weight: 900;
  font-size: calc(var(--font-s) * $multiplier);
}

@mixin basicGrid() {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: start;
  align-items: center;
}

@import url("https://fonts.googleapis.com/css2?family=Lato&display=swap");

*,
* > * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:host {
  --clr-primary: white;
  --clr-secondary: rgb(218, 218, 218);
  --clr-accent: rgb(103, 199, 255);
  --clr-shadow: rgba(0, 0, 0, 0.1);
}

.weather-widget {
  --font-s: 1rem;
  font-size: var(--font-s);
  font-family: "Lato", sans-serif;
  width: 19em;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  > :first-child {
    display: flex;
    justify-content: space-between;
    width: calc(100% - 1em);
    padding: 0.5em;
    margin-bottom: 1em;
    background-color: var(--clr-primary);
    border-radius: 15px;
    box-shadow: 0.2em 0.2em var(--clr-shadow);

    > span {
      @include boldFont(1.2);
    }
  }
}

.loader-spinner {
  > div {
    width: 3em;
    height: 3em;
    border: 0.4em solid transparent;
    border-radius: 50%;
    border-top-color: var(--clr-secondary);
    animation: loader-spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  }
}

@keyframes loader-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.settings-btn {
  width: 1.5em;
  height: 1.5em;

  &_open {
    background-image: url("data:image/svg+xml,%3Csvg%20version%3D%221.0%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%0A%20width%3D%22512.000000pt%22%20height%3D%22512.000000pt%22%20viewBox%3D%220%200%20512.000000%20512.000000%22%0A%20preserveAspectRatio%3D%22xMidYMid%20meet%22%3E%0A%0A%3Cg%20transform%3D%22translate(0.000000%2C512.000000)%20scale(0.100000%2C-0.100000)%22%0Afill%3D%22%23000000%22%20stroke%3D%22none%22%3E%0A%3Cpath%20d%3D%22M2257%205109%20c-105%20-25%20-195%20-109%20-237%20-219%20-9%20-24%20-15%20-115%20-19%20-279%0Al-6%20-244%20-88%20-33%20c-48%20-17%20-121%20-48%20-161%20-67%20l-73%20-35%20-164%20164%20c-174%20175%0A-222%20209%20-316%20223%20-65%209%20-144%20-4%20-206%20-36%20-73%20-37%20-415%20-378%20-451%20-450%20-48%0A-96%20-50%20-217%20-5%20-306%2012%20-24%2094%20-116%20185%20-207%2090%20-91%20164%20-171%20164%20-177%200%20-6%0A-14%20-41%20-32%20-78%20-17%20-37%20-45%20-106%20-63%20-154%20l-32%20-86%20-244%20-6%20c-164%20-4%20-255%0A-10%20-279%20-19%20-90%20-34%20-175%20-115%20-206%20-196%20-17%20-44%20-19%20-78%20-19%20-349%20l0%20-300%0A26%20-55%20c39%20-82%20110%20-146%20199%20-180%2024%20-9%20115%20-15%20279%20-19%20l244%20-6%2033%20-88%20c17%0A-48%2048%20-121%2067%20-161%20l35%20-73%20-164%20-164%20c-175%20-174%20-209%20-222%20-223%20-316%20-9%20-65%0A4%20-144%2036%20-206%2036%20-73%20378%20-415%20450%20-451%2095%20-48%20217%20-50%20306%20-5%2024%2012%20114%2093%0A207%20185%2091%2090%20171%20164%20177%20164%206%200%2041%20-14%2078%20-32%2037%20-17%20106%20-45%20154%20-63%20l86%0A-32%206%20-244%20c4%20-164%2010%20-255%2019%20-279%2034%20-90%20115%20-175%20196%20-206%2044%20-17%2078%20-19%0A349%20-19%20l300%200%2055%2026%20c82%2039%20146%20110%20180%20199%209%2024%2015%20115%2019%20279%20l6%20244%2088%2033%0Ac48%2017%20121%2048%20161%2067%20l73%2035%20164%20-164%20c201%20-202%20230%20-219%20364%20-219%20143%200%20169%0A16%20396%20243%20161%20161%20193%20198%20219%20254%2025%2054%2031%2079%2031%20134%200%20135%20-23%20173%20-229%0A378%20l-160%20159%2035%2073%20c19%2040%2050%20113%2067%20161%20l33%2088%20244%206%20c164%204%20255%2010%20279%2019%0A89%2034%20160%2098%20199%20180%20l26%2055%200%20305%200%20305%20-26%2055%20c-39%2082%20-110%20146%20-199%20180%0A-24%209%20-115%2015%20-279%2019%20l-244%206%20-33%2088%20c-17%2048%20-48%20121%20-67%20161%20l-35%2073%20164%0A164%20c175%20174%20209%20222%20223%20316%203%2026%203%2072%20-1%20101%20-15%2099%20-48%20144%20-248%20344%20-226%0A227%20-252%20243%20-395%20243%20-134%200%20-163%20-17%20-364%20-219%20l-164%20-164%20-73%2035%20c-40%2019%0A-113%2050%20-161%2067%20l-88%2033%20-6%20244%20c-4%20164%20-10%20255%20-19%20279%20-34%2089%20-98%20160%20-180%0A199%20l-55%2026%20-285%202%20c-157%201%20-302%20-2%20-323%20-8z%20m555%20-219%20c21%20-6%2046%20-23%2057%20-39%0A18%20-26%2020%20-47%2023%20-314%204%20-340%20-1%20-327%20119%20-367%20155%20-53%20207%20-74%20304%20-122%20122%0A-62%20149%20-70%20183%20-57%2015%205%20110%2092%20212%20193%20203%20201%20221%20216%20263%20216%2048%200%2077%20-23%0A255%20-203%20160%20-162%20172%20-177%20172%20-211%200%20-20%20-6%20-49%20-14%20-64%20-8%20-15%20-96%20-108%0A-196%20-207%20-100%20-99%20-188%20-194%20-196%20-211%20-17%20-40%20-11%20-60%2054%20-189%2048%20-97%2069%0A-149%20122%20-304%2040%20-120%2027%20-115%20367%20-119%20267%20-3%20288%20-5%20314%20-23%2016%20-11%2033%20-36%0A39%20-57%2013%20-48%2013%20-456%200%20-504%20-6%20-21%20-23%20-46%20-39%20-57%20-26%20-18%20-47%20-20%20-314%0A-23%20-340%20-4%20-327%201%20-367%20-119%20-53%20-155%20-74%20-207%20-122%20-304%20-62%20-122%20-70%20-149%0A-57%20-183%205%20-15%2092%20-110%20193%20-212%20101%20-102%20191%20-196%20200%20-210%2019%20-28%2021%20-72%205%0A-103%20-16%20-31%20-329%20-346%20-361%20-363%20-32%20-17%20-71%20-18%20-101%20-3%20-12%206%20-110%2099%20-218%0A205%20-110%20109%20-204%20194%20-215%20195%20-47%203%20-74%20-6%20-173%20-56%20-103%20-51%20-154%20-72%20-310%0A-125%20-120%20-40%20-115%20-27%20-119%20-367%20-3%20-267%20-5%20-288%20-23%20-314%20-11%20-16%20-36%20-33%0A-57%20-39%20-48%20-13%20-456%20-13%20-504%200%20-21%206%20-46%2023%20-57%2039%20-18%2026%20-20%2047%20-23%20314%0A-4%20340%201%20327%20-119%20367%20-153%2052%20-207%2074%20-324%20131%20-110%2054%20-123%2058%20-155%2049%20-26%0A-7%20-83%20-58%20-220%20-195%20-102%20-103%20-197%20-193%20-212%20-201%20-15%20-8%20-44%20-14%20-64%20-14%0A-36%200%20-49%2011%20-226%20188%20-177%20177%20-188%20190%20-188%20226%200%2020%205%2047%2011%2059%206%2012%2099%0A110%20205%20218%20109%20110%20194%20204%20195%20215%203%2047%20-6%2074%20-56%20173%20-51%20103%20-72%20154%20-125%0A310%20-40%20120%20-27%20115%20-367%20119%20-267%203%20-288%205%20-314%2023%20-16%2011%20-33%2036%20-39%2057%20-13%0A48%20-13%20456%200%20504%206%2021%2023%2046%2039%2057%2026%2018%2047%2020%20314%2023%20340%204%20327%20-1%20367%20119%0A53%20155%2074%20207%20122%20304%2065%20129%2071%20149%2054%20189%20-8%2017%20-96%20112%20-196%20211%20-100%2099%0A-188%20192%20-196%20207%20-8%2015%20-14%2044%20-14%2064%200%2036%2011%2049%20188%20226%20177%20177%20190%20188%0A226%20188%2020%200%2049%20-6%2064%20-14%2015%20-8%20108%20-96%20207%20-196%2099%20-100%20194%20-188%20211%20-196%0A40%20-17%2060%20-11%20189%2054%2097%2048%20149%2069%20304%20122%20120%2040%20115%2027%20119%20367%203%20268%204%20288%0A23%20315%2011%2015%2035%2032%2052%2037%2044%2013%20463%2013%20509%201z%22%2F%3E%0A%3Cpath%20d%3D%22M2385%203546%20c-395%20-76%20-690%20-352%20-797%20-746%20-33%20-123%20-33%20-357%200%20-480%0A52%20-190%20133%20-333%20266%20-466%20133%20-133%20276%20-214%20466%20-266%20123%20-33%20357%20-33%20480%200%0A190%2052%20333%20133%20466%20266%20133%20133%20214%20276%20266%20466%2033%20123%2033%20357%200%20480%20-52%20190%0A-133%20333%20-266%20466%20-132%20132%20-276%20214%20-461%20264%20-102%2028%20-317%2036%20-420%2016z%20m334%0A-226%20c298%20-61%20540%20-303%20601%20-601%2025%20-119%2025%20-199%200%20-318%20-61%20-298%20-303%20-540%0A-601%20-601%20-119%20-25%20-199%20-25%20-318%200%20-231%2047%20-430%20202%20-537%20416%20-51%20102%20-84%0A238%20-84%20344%200%20288%20174%20565%20436%20696%20161%2080%20326%20101%20503%2064z%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E");
  }

  &_close {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20id%3D%22body_1%22%20width%3D%22512%22%20height%3D%22512%22%3E%0A%0A%3Cg%20transform%3D%22matrix(1.3333334%200%200%201.3333334%200%200)%22%3E%0A%20%20%20%20%3Cimage%20%20x%3D%220%22%20y%3D%220%22%20xlink%3Ahref%3D%22data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABshSURBVHhe7d3dq%2BZrXcfxRaKGStmTW0HLLKJOysL%2Bh6CDChKTNPsTIjoqsw4iojpITVNEi92BmRWBgpp2GBhmZipWpEEQEZVaUGi5reu3Zs%2Fse838PmvdD7%2BH6%2BH1gjfI2jOzZd3X9f3%2B1r1mz1wt6FtLrym9ufTB0j%2BUPlf68pNN%2F%2Fuzpemfvan0E6Xp5wDAiJremy8p%2FULpb0r%2Fd2afLr2uNP1aANCz5vfm95f%2BoPREae7%2F3DlNv9a7Sy8rAUBPmt%2Bbzy89XvpKae7%2FzBJNv%2Fbvl15UAoCWdbE3f6z0hdLcv3yNpn%2FXK0oA0KLm9%2BYzSm8rzf3Ltuitpen%2FAwC0oIu9%2BezS%2B0pz%2F4It%2B1Dpa0oAULMu9uZzSh8uzf3Ce%2FTnpeeWAKBG046adtXcDtujaYdPu%2FwkTy%2B9vzT3C%2B7ZX5a%2BvgQANfnaUk3L%2F35%2FWnpm6Wh7fu%2Firj5S8k4AALWYdtK0m%2BZ2Vg29pXSUl5fmfoGa8k4AADWo9Sv%2Fh3tl6VYvKG35nyxckncCANhT7V%2F5H%2Fb50mOl6HdLcz%2Bx1rwTAMAeWvnK%2F7B3lGZNf0zhmn9S0Vp5JwCALbX0lf9h047%2FvtIj%2FrA09xNayDsBAGyhxa%2F8D3tX6YZvK01%2F9eDcD24l7wQAsKZWv%2FI%2FbNr1N%2F5K4emvJpz7ga3lnQAA1tD6V%2F6Hvbb0wCV%2FL3FteScAgCX18JX%2FYZ8qXXtJae4HtJx3AgBYQk9f%2BR%2F2zaWrnzz4QE95CADgEr0u%2F6lXla7edPCB3vLtAADO0dvb%2Fg%2F3xtL1Xxk49w97yTsBAJyi56%2F87%2FeB0tVnDz7Qa94JAOAYvX%2Flf7%2B%2FL13%2F%2BcBz%2F7C3vBMAwG1G%2BMr%2Ffv9euvqfgw%2F0nncCAJgzylf%2B95t2%2F1APAFMeAgA4NNryn7p%2BABjlWwCH%2BXYAAJOR3vY%2F7PpbACP8JsC5vBMAMLYRv%2FK%2F3%2FVvAvzgwQdGyzsBAGMa9Sv%2F%2B72%2F1PUfBHRM3gkAGMvIX%2Fnf7%2FoPAnrNwQdGzTsBAGMY%2FSv%2F%2B%2F146frvBZ77h6PlIQCgb5b%2FU13%2FZUCTT5fmfsBo%2BXYAQJ%2B87f9Unyw98LrS3A8aMe8EAPTFV%2F43%2B9nSAy8pfbk09wNHzDsBAH3wlf%2FNpl3%2F4tIN7y7N%2FeBR804AQNt85f9o7yw94mWlr5TmfsKoeScAoE2%2B8n%2B0J0ovLc16vDT3k0bOOwEAbfGV%2F3xvL0XPL32hNPcTR847AQBt8JX%2FfNPf%2B%2FNY6VYvL8395NHzTgBA3Xzln3tl6ShvLc39AqPnnQCAOvnKP%2Ffm0tGeXnpfae4XGj3vBADUxVf%2BuQ%2BVnlE6yXNKPqHzeScAoA6%2B8s9NO3za5WfxVJXzTgDAvuyo3CI7yic45yEAYB92U27R3eQTnfMQALAtOym3yk7yCc95CADYhl2UW3UX%2BcTnPAQArMsOym2yg7wAOQ8BAOuwe3Kb7h4vRM5DAMCy7JzcLjvHC5LzEACwDLsmt%2Buu8cLkPAQAXMaOyVWxY7xAOQ8BAOexW3JV7RYvVM5DAMBp7JRclTvFC5bzEABwHLskV%2FUu8cLlPAQA3M4OyTWxQ7yAOQ8BAPPsjlxTu8MLmfMQAHCTnZFrcmd4QXMeAgDusStyTe8KL2zOQwAwOjsi18WO8ALnPAQAo7Ibcl3tBi90zkMAMBo7IdflTvCC5zwEAKOwC3Jd7wIvfM5DANA7OyA3xA5wAHIeAoBemf25oWa%2Fg5DzEAD0xszPDTnzHYichwCgF2Z9buhZ72DkPAQArTPjc2Z84YDkHBCgVWZ7zmw%2F4KDkHBSgNWZ6zkyf4cDkHBigFWZ5ziy%2FhYOTc3CA2pnhOTP8CA5QzgECamV258zuEzhIOQcJqI2ZnTOzz%2BBA5RwooBZmdc6svoCDlXOwgL2Z0TkzegEOWM4BA%2FZiNufM5gU5aDkHDdiamZwzk1fgwOUcOGArZnHOLF6Rg5dz8IC1mcE5M3gDDmDOAQTWYvbmzN4NOYg5BxFYmpmbM3N34EDmHEhgKWZtzqzdkYOZczCBS5mxOTO2Ag5ozgEFzmW25szWijioOQcVOJWZmjNTK%2BTA5hxY4Fhmac4srZiDm3NwgbuYoTkztAEOcM4BBhKzM2d2NsRBzjnIwMPMzJyZ2SAHOudAA%2FeZlTmzsmEOds7BBszInBnZAQc854DDuMzGnNnYEQc956DDeMzEnJnYIQc%2B58DDOMzCnFnYMQc%2F5%2BBD%2F8zAnBk4ABcg5wJAv8y%2BnNk3EBch5yJAf8y8nJk3IBci50JAP8y6nFk3MBcj52JA%2B8y4nBmHC3JLLgi0y2zLmW084KLkXBRoj5mWM9N4hAuTc2GgHWZZziwjcnFyLg7UzwzLmWHcyQXKuUBQL7MrZ3ZxNBcp5yJBfcysnJnFyVyonAsF9TCrcmYVZ3Oxci4W7M%2BMyplRXMwFy7lgsB%2BzKWc2sRgXLeeiwfbMpJyZxOJcuJwLB9sxi3JmEatx8XIuHqzPDMqZQazOBcy5gLAesydn9rAZFzHnIsLyzJycmcPmXMicCwnLMWtyZg27cTFzLiZczozJmTHszgXNuaBwPrMlZ7ZQDRc156LC6cyUnJlCdVzYnAsLxzNLcmYJ1XJxcy4u3M0MyZkhVM8FzrnAkJkdObODZrjIORcZHmVm5MwMmuNC51xoeIpZkTMraJaLnXOxwYy4LTOC5rngOReckZkNObOBbrjoORedEZkJOTOB7rjwOReekZgFObOAbrn4ORefEZgBOTOA7hkAOQOAnrn7OXefYRgEOYOAHrnzOXee4RgIOQOBnrjrOXedYRkMOYOBHrjjOXec4RkQOQOClrnbOXcbnmRQ5AwKWuRO59xpeIiBkTMwaIm7nHOXITA4cgYHLXCHc%2B4w3MEAyRkg1Mzdzbm7cCSDJGeQUCN3NufOwokMlJyBQk3c1Zy7CmcyWHIGCzVwR3PuKFzIgMkZMOzJ3cy5m7AQgyZn0LAHdzLnTsLCDJycgcOW3MWcuwgrMXhyBg9bcAdz7iCszADKGUCsyd3LuXuwEYMoZxCxBncu587BxgyknIHEkty1nLsGOzGYcgYTS3DHcu4Y7MyAyhlQXMLdyrlbUAmDKmdQcQ53KudOQWUMrJyBxSncpZy7BJUyuHIGF8dwh3LuEFTOAMsZYNzG3cm5O9AIgyxnkDHHncm5M9AYAy1noHHIXcm5K9Aogy1nsDFxR3LuCDTOgMsZcGNzN3LuBnTCoMsZdGNyJ3LuBHTGwMsZeGNxF3LuAnTK4MsZfGNwB3LuAHTOAMwZgH1z9nPOPgzCIMwZhH1y5nPOPAzGQMwZiH1x1nPOOgzKYMwZjH1wxnPOOAzOgMwZkG1ztnPONnDNoMwZlG1ypnPONHCDgZkzMNviLOecZWCWwZkzONvgDOecYeBWBmjOAK2bs5tzdoGjGKQ5g7ROzmzOmQVOYqDmDNS6OKs5ZxU4i8GaM1jr4IzmnFHgIgZszoDdl7OZczaBRRi0OYN2H85kzpkEFmXg5gzcbTmLOWcRWIXBmzN4t%2BEM5pxBYFUGcM4AXpezl3P2gE0YxDmDeB3OXM6ZAzZlIOcM5GU5azlnDdiFwZwzmJfhjOWcMWBXBnTOgL6Ms5VztoAqGNQ5g%2Fo8zlTOmQKqYmDnDOzTOEs5ZwmoksGdM7iP4wzlnCGgagZ4zgC%2FnbOTc3aAJhjkOYN8njOTc2aAphjoOQP9Jmcl56wATTLYcwb7Pc5IzhkBmmbA50Yf8M5GzvIHumDQ50Yd9M5EzvIHumLg50Yb%2BM5CzvIHumTw50YZ%2FM5AzvIHumYB5HpfAF77nOUPDMEiyPW6CLzmOcsfGIqFkOttIXitc5Y%2FMCSLIdfLYvAa5yx%2FYGgWRK71BeG1zVn%2BAIVFkWt1UXhNc5Y%2FwAELI9fawvBa5ix%2FgBkWR66VxeE1zFn%2BALewQHK1LxCvXc7yBziCRZKrdZF4zXKWP8AJLJRcbQvFa5Wz%2FAHOYLHkalksXqOc5Q9wAQsmt%2FeC8drkLH%2BABVg0ub0WjdckZ%2FkDLMjCyW29cLwWOcsfYAUWT26rxeM1yFn%2BACuygHJrLyCf%2B5zlD7ABiyi31iLyOc9Z%2FgAbspBySy8kn%2Buc5Q%2BwA4spt9Ri8jnOWf4AO7KgcpcuKJ%2FbnOUPUAGLKnfuovI5zVn%2BABWxsHKnLiyfy5zlD1Ahiyt37OLyOcxZ%2FgAVs8Bydy0wn7uc5Q%2FQAIsslxaZz1nO8gdoiIWWe3ih%2BVzlLH%2BABllsufuLzecoZ%2FkDNMyCy3289NGHPqZ7Wf4AHfAQoFOy%2FAE64iFAx2T5A3TIQ4Buy%2FIH6JiHAM1l%2BQMMwEOADrP8AQbiIUBTlj%2FAgDwEjJ3lDzAwDwFjZvkD4CFgsCx%2FAB7wEDBGlj8Aj%2FAQ0HeWPwCRh4A%2Bs%2FwBuJOHgL6y%2FAE4moeAPrL8ATiZh4C2s%2FwBOJuHgDaz%2FAG4mIeAtrL8AViMh4A2svwBWJyHgLqz%2FAFYjYeAOrP8AVidh4C6svwB2IyHgDqy%2FAHYnIeAfbP8AdiNh4B9svwB2J2HgG2z%2FAGohoeAbbL8AaiOh4B1s%2FwBqJaHgHWy%2FAGonoeAZbP8AWiGh4BlsvwBaI6HgMuy%2FAFoloeA87L8AWieh4DTsvwB6IaHgOOy%2FAHozvQQ8BelucWnq6uPlyx%2FALrjAeD2PAAA0B3fAjgu3wIAoBuW%2F2l5CACgeZb%2FeXkIAKBZlv9leQgAoDmW%2FzJ5CACgGZb%2FsnkIAKB6lv86eQgAoFqW%2F7p5CACgOpb%2FNnkIAKAalv%2B2eQgAYHeW%2Fz55CABgN5b%2FvnkIAGBzln8deQgAYDOWf115CABgdZZ%2FnXkIAGA1ln%2FdeQgAYHGWfxt5CABgMZZ%2FW3kIAOBiln%2BbeQgA4GyWf9t5CADgZJZ%2FH3kIAOBoln9feQgA4E6Wf595CAAgsvz7zkMAAI%2Bw%2FMfIQwAAD1j%2BY%2BUhAADLf9A8BAAMzPIfOw8BAAOy%2FDXlIQBgIJa%2FDvMQADAAy19zeQgA6Jjlr9vyEADQIctfx%2BQhAKAjlr9OyUMAQAcs%2F9zHSx996GO6l4cAgIZZ%2Frn7C87nKOchAKBBFlvu4cXmc5XzEADQEAstlxaaz1nOQwBAAyyy3F2LzOcu5yEAoGIWWO7YBeZzmPMQAFAhiyt36uLyucx5CACoiIWVO3dh%2BZzmPAQAVMCiyl26qHxucx4CAHZkQeWWWlA%2BxzkPAQA7sJhySy8mn%2BuchwCADVlIubUWks95zkMAwAYsotzai8jnPuchAGBFFlBuqwXkNch5CABYgcWT23rxeC1yHgIAFmTh5PZaOF6TnIcAgAVYNLm9F43XJuchAOACFkyulgXjNcp5CAA4g8WSq22xeK1yHgIATmCh5GpdKF6znIcAgCNYJLnaF4nXLuchAOAWFkiulQXiNcx5CACYYXHkWlscXsuchwCAAxZGrtWF4TXNeQgAKCyKXOuLwmub8xAADM2CyPWyILzGOQ8BwJAshlxvi8FrnfMQAAzFQsj1uhC85jkPAcAQLIJc74vAa5%2FzEAB0zQLIjbIAnIGchwCgSwZ%2FbrTB7yzkPAQAXTHwc6MOfGci5yEA6IJBnxt90DsbOQ8BQNMM%2BJwBf48zknNGgCYZ7DmD%2FSZnJeesAE0x0HMG%2BjxnJufMAE0wyHMG%2Be2cnZyzA1TNAM8Z4MdxhnLOEFAlgztncJ%2FGWco5S0BVDOycgX0eZyrnTAFVMKhzBvVlnK2cswXsyoDOGdDLcMZyzhiwC4M5ZzAvy1nLOWvApgzknIG8Dmcu58wBmzCIcwbxupy9nLMHrMoAzhnA23AGc84gsAqDN2fwbstZzDmLwKIM3JyBuw9nMudMAoswaHMG7b6czZyzCVzEgM0ZsHVwRnPOKHAWgzVnsNbFWc05q8BJDNScgVonZzbnzAJHMUhzBmndnN2cswvcygDNGaBtcIZzzjAwy%2BDMGZxtcZZzzjJwg4GZMzDb5EznnGngmkGZMyjb5mznnG0YnAGZMyD74IznnHEYlMGYMxj74qznnHUYjIGYMxD75MznnHkYhEGYMwj75uznnH3onAGYMwDH4A7k3AHolMGXM%2FjG4i7k3AXojIGXM%2FDG5E7k3AnohEGXM%2BjG5m7k3A1onAGXM%2BCYuCM5dwQaZbDlDDYOuSs5dwUaY6DlDDTmuDM5dwYaYZDlDDJu4%2B7k3B2onAGWM8A4hjuUc4egUgZXzuDiFO5Szl2CyhhYOQOLc7hTOXcKKmFQ5QwqLuFu5dwt2JkBlTOgWII7lnPHYCcGU85gYknuWs5dg40ZSDkDiTW4czl3DjZiEOUMItbk7uXcPViZAZQzgNiCO5hzB2ElBk%2FO4GFL7mLOXYSFGTg5A4c9uJM5dxIWYtDkDBr25G7m3E24kAGTM2CogTuac0fhTAZLzmChJu5qzl2FExkoOQOFGrmzOXcWjmSQ5AwSaubu5txduIMBkjNAaIE7nHOHITA4cgYHLXGXc%2B4yPMTAyBkYtMidzrnT8CSDImdQ0DJ3O%2BduMzwDImdA0AN3POeOMyyDIWcw0BN3PeeuMxwDIWcg0CN3PufOMwyDIGcQ0DN3P%2Bfu0z0DIGcAMAIzIGcG0C0XP%2BfiMxKzIGcW0B0XPufCMyIzIWcm0A0XPeeiMzKzIWc20DwXPOeCgxlxW2YEzXKxcy42PMWsyJkVNMeFzrnQ8CgzI2dm0AwXOeciQ2Z25MwOqucC51xguJsZkjNDqJaLm3Nx4XhmSc4soToubM6FhdOZKTkzhWq4qDkXFc5ntuTMFnbnguZcULicGZMzY9iNi5lzMWE5Zk3OrGFzLmTOhYTlmTk5M4fNuIg5FxHWY%2FbkzB5W5wLmXEBYnxmUM4NYjYuXc%2FFgO2ZRzixicS5czoWD7ZlJOTOJxbhoORcN9mM25cwmLuaC5Vww2J8ZlTOjOJuLlXOxoB5mVc6s4mQuVM6FgvqYWTkzi6O5SDkXCeplduXMLu7kAuVcIKifGZYzw4hcnJyLA%2B0wy3JmGY9wYXIuDLTHTMuZaTzgouRcFGiX2ZYz23BBbskFgfaZcTkzbmAuRs7FgH6YdTmzbkAuRM6FgP6YeTkzbyAuQs5FgH6ZfTmzbwAuQM4FgP6ZgTkzsGMOfs7Bh3GYhTmzsEMOfM6Bh%2FGYiTkzsSMOes5Bh3GZjTmzsQMOeM4BB8zInBnZMAc752AD95mVObOyQQ50zoEGHmZm5szMhjjIOQcZSMzOnNnZAAc45wADdzFDc2ZoxRzcnIMLHMsszZmlFXJgcw4scCozNWemVsRBzTmowLnM1pzZWgEHNOeAApcyY3Nm7I4czJyDCSzFrM2ZtTtwIHMOJLA0Mzdn5m7IQcw5iMBazN6c2bsBBzDnAAJrM4NzZvCKHLycgwdsxSzOmcUrcOByDhywNTM5ZyYvyEHLOWjAXszmnNm8AAcs54ABezOjc2b0BRysnIMF1MKszpnVZ3Cgcg4UUBszO2dmn8BByjlIQK3M7pzZfQQHKOcAAbUzw3Nm%2BC0cnJyDA7TCLM%2BZ5TMcmJwDA7TGTM%2BZ6QcclJyDArTKbM%2BZ7YUDknNAgNaZ8bmhZ7yDkbP8gV6Y9bkhZ70DkbP8gd6Y%2BbmhZr6DkLP8gV6Z%2FbkhZr8DkLP8gd7ZAbmud4AXPmf5A6OwC3Jd7gIveM7yB0ZjJ%2BS62gle6JzlD4zKbsh1sRu8wDnLHxidHZFrekd4YXOWP8A9dkWuyV3hBc1Z%2FgA32Rm5pnaGFzJn%2BQPMsztyTewOL2DO8ge4nR2Sq3qHeOFylj%2FAceySXJW7xAuWs%2FwBTmOn5KraKV6onOUPcB67JVfFbvEC5Sx%2FgMvYMbldd4wXJmf5AyzDrsntsmu8IDnLH2BZdk5u053jhchZ%2FgDrsHtym%2BweL0DO8gdYlx2UW3UH%2BcTnLH%2BAbdhFuVV2kU94zvIH2JadlFt0J%2FlE5yx%2FgH3YTblFdpNPcM7yB9iXHZW7aEc9q%2BQTO99HSs8tAbCvaRZPM3luVo%2FetMOnXX6Sryr9UWnuFxw9X%2FkD1MU7Abn3lp5WOtpvlOZ%2BodGz%2FAHq5CEg9%2Bulo7yiNPcLjJ63%2FQHq5tsBuR8t3Wp6gvqn0txPHjlf%2BQO0wTsB8%2F1z6etK0dtKcz9x5Cx%2FgLZ4CJjvt0qzXlr6SmnuJ42at%2F0B2uTbAY%2F2ROm7S494vDT3E0bNV%2F4AbfNOwKO9o3TDC0pfKs394BGz%2FAH64CHgZl8sPb%2F0wC%2BW5n7giHnbH6Avvh1ws58vPfCx0twPGi1f%2BQP0yTsBTzU9DF17rOQ3%2F1n%2BAL3zEHCv6TcDPq909aonPzBylj%2FAGDwE3OuVpas3HHxgxHzPH2Asfk%2FA1dXrS1fvOfjAaPnKH2BMo78T8Melq08cfGCkLH%2BAsY38EPBXpav%2FOPjAKHnbH4DJqN8O%2BHzp6r8PPjBCvvIH4NCI7wT8Z%2BnqCwcf6D3LH4A5oz0E%2FFvp6l8PPtBzlj8AtxnpIWD664GvPnPwgV7zPX8AjjHK7wn4u9LVew8%2B0GO%2B8gfgFCO8E3D9nwH%2BysEHesvyB%2BAcvT8E%2FFLp6tUHH%2Bgpyx%2BAS%2FT8EHD9RwG%2FsNTbXwZk%2BQOwhB4fAqad%2F6LStQ%2BX5n5Qi1n%2BACypt4eAPys98DOluR%2FUWpY%2FAGvo6SHgp0sPfEvpy6W5H9hK%2FlM%2FANbUw38iOO36aeff8Hhp7ge3kK%2F8AdhC6%2B8E%2FE7pEd9e%2Bt%2FS3E%2BoOcsfgC21%2BhAwffX%2FHaVZv12a%2B0m15m1%2FAPbQ4rcD3l6Kvqk0%2FfnAcz%2BxtnzlD8CeWnon4F9Kj5Vu9QOl2v9cAMsfgBq08BAw7fQfLB3lN0tzv0gNedsfgJrU%2Fu2A15eO9vTSe0pzv9Ce%2BcofgBrV%2Bk7A%2B0rPLJ3kq0sfKs39gns0fWJ95Q9AraYdVdNDwAdKJy%2F%2F%2B55d%2BmBp7hfesveXnlMCgJpNu%2BpPSnO7bMum5f%2Bs0kWeVpr%2ByuC9fmPgm0vTtyQAoAXPKL2lNLfT1m7a1b9cmnb3Yn6k9LnS3L9wjT5fenkJAFr0itK0y%2BZ23BpNO%2FqHSquYfgPe9G7Al0pz%2F%2FIlmp5epj%2BW%2BM7%2FXhEAKvcNpel34T9Rmtt5SzT9Kb5vLT2vtLrvKr2rtOSDwPRHFP5e6XtKANCT7y1Ne3PJB4Evlt5Z%2Bs7S5qY%2FOXD6awU%2FUZr7P3dMnyz9XOnFJQDo2bTrXlv6VGluJx7TX5d%2BqvSNpSpMb9n%2FcOnXStPvPvxY6R9L%2F1Wa3imYvjfxt6Xpn72h9OrSC0sAMKIXlaZd%2BMbStBunHTntymlnTrtz2qHTLp3%2BS7hfLU3f31%2Fobf6rq%2F8HhcrbIXTfkJQAAAAASUVORK5CYII%3D%22%20width%3D%22384%22%20height%3D%22384%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E");
  }
}

input,
button {
  font-size: var(--font-s);

  &:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-color: var(--clr-accent);
  }
}

button {
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 5px;
  background: none;
  background-size: cover;

  &:hover {
    cursor: pointer;
    background-color: var(--clr-secondary);
  }
}

.card {
  padding: 1em;
  margin-bottom: 1em;
  width: calc(100% - 2em);
  border-radius: 15px;
  box-shadow: 0.2em 0.2em var(--clr-shadow);
  background-color: var(--clr-primary);
}

form {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.5em;

  > input {
    padding: 0.5em;
    border: 2px solid var(--clr-secondary);
    border-radius: 5px;
  }

  > button {
    width: 2em;
    height: 2em;
    background-color: var(--clr-primary);
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20id%3D%22body_2%22%20width%3D%22512%22%20height%3D%22512%22%3E%0A%0A%3Cg%20transform%3D%22matrix(1.3333334%200%200%201.3333334%200%200)%22%3E%0A%20%20%20%20%3Cimage%20%20x%3D%220%22%20y%3D%220%22%20xlink%3Ahref%3D%22data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAA%2BkSURBVHhe7d3977Z1XcdxLgQEDFEQhq6V%2FeBmo7ABKkyGtjS12giWU%2FDml0xBZvmLP3kDjtbqlzbLSkPMEeEmATOqeceFFq1GZRRkhGEIjLgpmIPLC8ZNvT7lt77hh4uLi%2FM8j89xvB%2BP7fkHXNv5ud7v4zjP73HsBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwMUemk9Jr05vST6VXpxen%2FRMAsADHpHPTFeme9J97aHf68%2FSRdHwCAGbmNemP06OpN%2Bz3phvTu9OzEwAwsOPSV1NvoO9rd6S3ph0JABjIAemX0yOpN8RX0ZfTixIAMICj0p%2Bl3tBedXen9qNBAGBCP5huSr1hva4eSmckAGAC7cr%2Fn1NvSK%2B79uPC0xMAsEGHpK%2Bl3nDeVLvSCQkA2JALU28ob7pb0xEJAFizn069YTxVFyUAYI3arf9bUm8QT9Xj6eQEAKzJe1NvCE%2Fd1QkAWIP2sJ9vpd4AHiF3AQBgDX4m9QbvKH0yAQAr9pnUG7yj9O10cAIAVqS9q%2F%2Fe1Bu8I%2FXjCQBYkZel3sAdrY8kAGBF3p56A3e0rkgAwIpckHoDd7T%2BMQEAK%2FLx1Bu4o9V%2BpwAArMglqTdwR6u9KhgAWJHPpt7AHTEAYEUsAABQkAUAAAqyAABAQRYAACjIAgAABVkAAKAgCwAAFGQBAICCLAAAUJAFAAAKsgAAQEEWAAAoyAIAAAVZAACgIAsAABRkAQCAgiwAAFCQBQAACrIAAEBBFgAAKMgCAAAFWQAAoCALAAAUZAEAgIIsAABQkAUAAAqyAABAQRYAACjIAgAABVkAAKAgCwAAFGQBAICCLAAAUJAFAAAKsgAAQEEWAAAoyAIAAAVZAACgIAsAABRkAQCAgiwAAFCQBQAACrIAAEBBFgAAKMgCAAAFWQAAoCALAAAUZAEAgIIsAABQkAUAAAqyAABAQRYAACjIAgAABVkAAKAgCwAAFGQBAICCLAAAUJAFAAAKsgAAQEEWAAAoyAIAAAVZAACgIAsAsE%2BOSWem30o7023p%2FtQO6650T7ouXZLem340AeOwAAB77aD0jtQG%2FmOpd1D31M3p%2FNSWB2BaFgDgKT0rnZvuSL3D%2BXR7KP1OOjoB07AAAHt0Qro%2B9Q7lM619ZfDuBGyeBQB4Uu9LD6fegVxll6fDE7A5FgDge%2BxIv556B3Fd3Zi%2BPwGbYQEA%2Fp%2F2ff%2BlqXcI190t6UUJWD8LAPC%2F2vD%2FTOodwE3198nXAbB%2BFgDgv7Xh%2F%2Fupd%2Fg23R8mYL0sAMAQV%2F5P7F0JWB8LABQ30pX%2F9u5LRyVgPSwAUNiIV%2F7b%2B1gC1sMCAEWNeuW%2FvfbEwBcmYPUsAFDQ6Ff%2B2%2FtwAlbPAgDFzOHKf3vfSMDqWQCgkDld%2BW%2Fv2ASslgUAipjblf%2F23pOA1bIAQAFzvfLf6uIErJYFABZuzlf%2BW%2F1lAlbLAgALNvcr%2F63uTMBqWQBgoZZw5b%2FVAwlYLQsALNBSrvy3eiQBq9VeutU7b6P1eAL2wpKu%2FLe6PwGrdVXqnbfR2p2Ap7C0K%2F%2BtvpmA1fpi6p230fp2AvZgiVf%2BW7X%2FqIDV%2BmrqnbfRuicBT2KpV%2F5bfTQBq3VD6p230bo9AR1LvvLf6ucSsFrtz2t75220bknAEyz9yr%2FV%2FgLgBQlYrYdT78yN1tcSsE2FK%2F%2FWFxKwWken3nkbMf8HwDYVrvy3emsCVuuVqXfeRuzSBESVK%2F%2FWbenABKzWm1PvzI3YbyQor9KVf%2BsXErB6H0q9Mzdi5ycordKVf%2BtvU%2Fs3A6s3p%2FcAnJOgrGpX%2Fu3Rnz%2BWgPW4KfXO3oi9IUFJ1YZ%2F69wErMdh6dHUO3sj9tIE5VS77d%2F67QSsz%2BtS7%2ByNWHsT4MEJSql45d%2F%2B3Gf%2FBKxP%2B1Fd7%2FyNWHtaIZRS8cq%2F%2FSjpgASs187UO4Mjdm2CMgx%2FYF2ekx5KvXM4Yh9PUILhD6zTaal3DkfND4IpwfAH1u13U%2B8sjtqpCRbN8AfWrZ23e1LvPI7a8xIsluEPbMLrU%2B88jlp7FwgsluEPbMqnU%2B9MjtplCRbJ8Ac25fC0K%2FXO5aj9UoLFMfyBTWov1Omdy5E7McGiGP7AJu1I16fe2Ry1B9OBCRbD8Ac27SdT72yO3NUJFsPwB6bwpdQ7nyP3wQSLYPgDU3h56p3P0fP9P4tg%2BANT%2BXzqndGRaw8r8lZQZs%2FwB6byqtQ7o6N3cYJZM%2FyBqbQr6L9KvXM6emclmC3DH5jSHP%2Fuv%2FVwen6CWTL8gSkdmf499c7q6F2VYJYMf2Bqc3vm%2F%2FbelmB2DH9gaqekx1PvvI7e7tTeWQCzYvgDU%2Fu%2BdFPqndc5dGWCWTH8gRG0P5%2Frnde5dEaC2TD8gRG8M%2FXO61y6K3n5D7Nh%2BAMj%2BJE0t3f9P7FfTTALhj8wguekr6femZ1L7UeLL0kwPMMfGEE7k59LvTM7p65JMDzDHxjBjvTJ1Duzc%2BtnEwzN8AdG8Supd2bn1s3Jm%2F8YmuEPjOI9qXdm59jZCYZl%2BAOjaI%2FKfSz1zu3cau%2F9PyTBkAx%2FYBS%2FmJYy%2FFvnJRiS4Q%2BMoP3g7%2FzUO7Nz7f7ktb8MyfAHRtD%2BL%2FpE6p3ZOfeBBMMx%2FIERtJf7LOHv%2FJ%2FYvemwBEMx%2FIER%2FHC6IfXO7Nx7f4KhGP7ACNqLfb6Temd27t2WDk0wDMMfmFq75X9J6p3XpfSWBMMw%2FIGpnZJuSr3zupT%2BIrW%2FaIAhGP7AlI5IH01L%2Bvv%2BXu3f94oEQzD8gam059%2Bfk%2B5LvbO6tD6VYAiGPzCVV6W%2FTr1zusTuTkcmmJzhD0zhuNTOYu%2BMLrkzE0zO8Ac2rf3A76r0eOqd0SX3pwkmZ%2FgDm3J4aq%2B6vT71zmaFHkg%2FkGBShj%2Bwbu28vT59Ou1KvXNZqfZAI5iU4Q%2BsS3t4z2mpvbCnPeO%2Bdx4rdnmCSRn%2BwCq1l9i8LrXX8%2B5MD6feOazcHcmv%2FpmU4Q%2Fsq6NTe3DNm9OHUjtb7Ul9j6be2dP%2F1B748xMJJlNx%2BN%2BeLkvtPypJe9cfpS%2Bla1J7%2B96dyVX9vndBgslUHP6SNHWfT%2B0JhzAJw1%2BSNt%2B%2FpvZeA5hEG%2F7tl6e9D6ckaT3tTickmEQb%2Ftem3odTkrSe2tMNz0owiQPTP6Xeh1OStL4%2BkGASbfi37556H0xJ0vq6KMFkKj9nW5Kmqv3Z5EEJJnFl6n0wJUnr67r03ASTeHvqfTAlSevrH5LH%2FDKZdtvpO6n34ZQkradvpBcmmEx7fGfvwylJWk%2B3Ju%2F2Z1KHJi%2FjkKTN9c30QwkmdWHqfUAlSauvfed%2FTILJ3Z96H1JJ0mr7m%2FSCBJM7LvU%2BpJKk1dZekexP%2FRjGx1LvgypJWl2%2Fl9pTVmEYN6Teh1WS9MxrL%2FbxbH%2BG5Pt%2FSVpP7dkq3urHsB5JvQ%2BuJGnfay9UOz7BsNrtqd6HV5K0b%2B1MRycYWu%2FDK0l6%2Bj2WLkj7Jxhe70MsSXp63ZXekGA22sba%2BzBLkvauy5O3%2BTE7D6beB1qStOceSO9MMEvtl6q9D7Yk6cn7k%2BRNfsxau3XV%2B3BLkr63%2F0jvSjB7Z6Teh1yS9H%2B130t9Kvmun0V5OPU%2B8JKk%2Ffa7Lp2cYHG%2Bknofekmq3B3pHWlHgkV6Wep9%2BCWpYvem96dDEyzejal3ECSpSvel9ua%2BwxKUcWzyXgBJFbsnnZeel6CkP0i9wyFJS%2BzmdHY6JEFp7Ycut6feQZGkJdTudF6TTk9e2gPbtCdb7U69gyNJc629rOfX0ksS8CSOT4%2Bk3iGSpLnULmauTO2BZwcmYC%2BcmDwgSNLcejRdm9rjeg9PwD5ofxngbYGSRu%2FudHE6Kz0%2FASvQfhPQHorRO3SSNEXtwmRn%2BmBqdyv9mA%2FWpC0Bt6beQZSkdXdbuiy9L708HZCADWlLwC2pdzglaRXdmdr3959I56ZTk1v6MABLgKS9qf2AuD1Wt%2FWt1P7f%2BLv0xXRp%2Bs10fjonvTG9NB2cgIFVWwLaL4rflgCgPEsAABRlCQCAoiwBAFCUJQAAirIEAEBRlgAAKMoSAABFWQIAoChLAAAUZQkAgKIsAQBQlCUAAIqyBABAUZYAACjKEgAARVkCAKAoSwAAFGUJAICiLAEAUJQlAACKsgQAQFGWAAAoyhIAAEVZAgCgKEsAABRlCQCAoiwBAFCUJQAAirIEAEBRlgAAKMoSAABFWQIAoChLAAAUZQkAgKIsAQBQlCUAAIqyBABAUZYAACjKEgAARVkCAKAoSwAAFGUJAICiLAEAUJQlAACKsgQAQFGWAAAoyhIAAEW9ON2aegNzibUl4MwEAOVVvBNwegKA8qrdCdiVTkwAUF61OwHt33p4AoDyqt0JuCgBAFHpTsDj6aQEAESlOwE7EwDwXZXuBJycAIDvqrIE%2BC0AADxBha8D7k%2FPTgDANhXuBLwmAQBPsPQ7AeclAKBjyXcCrkwAwJNY6p2AGxMAsAdLvBNwbwIAnsLSloCHEgCwF5a0BOxOAMBeWsoS4CsAAHialvDDwBsSAPA0zf1OwBUJANgHc74T8OEEAOyjud4JeHUCAJ6Bud0JuC8dlACAZ2hOdwIuTADAisxlCTgpAQArNPrXAVcnAGANRr0T8Fh6ZQIA1mTEOwG%2B%2BweADRjpTsC%2FpOcmAGADRrgT8GA6PgEAGzTlnYBH02kJAJhAWwK%2BnnpDel21V%2F6ekQCACR2ZvpJ6w3rV3ZVOSQDAAJ6VzkuPpN7gXkVfSMckAGAwx6Yvp94A39duS29JAMDg2m36z6VnckfghvTzyQt%2BAGBmjkpnp8vSv6XeoN9qV7omta8SjksAwEIckV6RXpvelN6YTk3trwl2JAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgm%2F32%2By%2BpUDTUE07P9QAAAABJRU5ErkJggg%3D%3D%22%20width%3D%22384%22%20height%3D%22384%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E");
  }
}

.report {
  &__city {
    @include boldFont(1.1);
  }

  &__temp {
    @include boldFont(2.5);
  }

  &__main-info {
    > :first-child {
      @include basicGrid();
    }
    > :last-child {
      display: flex;
      gap: 0.5em;
    }
  }

  &__add-info {
    @include basicGrid();
    > div {
      display: flex;
      align-items: center;
      gap: 0.4em;
    }
  }

  > * span {
    display: block;
    margin-block: 0.4em;
  }
}

.city {
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  padding: 0.5em;

  &_drag-over {
    background-color: rgba(0, 0, 0, 0.2);
  }

  > div {
    display: flex;
    align-items: center;

    > span {
      margin-left: 0.4em;
    }
  }

  &__draggable:hover {
    cursor: pointer;
  }

  > button {
    width: 1.5em;
    height: 1.5em;
    background-image: url("data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%2020010904%2F%2FEN%22%0A%20%22http%3A%2F%2Fwww.w3.org%2FTR%2F2001%2FREC-SVG-20010904%2FDTD%2Fsvg10.dtd%22%3E%0A%3Csvg%20version%3D%221.0%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%0A%20width%3D%22512.000000pt%22%20height%3D%22512.000000pt%22%20viewBox%3D%220%200%20512.000000%20512.000000%22%0A%20preserveAspectRatio%3D%22xMidYMid%20meet%22%3E%0A%0A%3Cg%20transform%3D%22translate(0.000000%2C512.000000)%20scale(0.100000%2C-0.100000)%22%0Afill%3D%22%23000000%22%20stroke%3D%22none%22%3E%0A%3Cpath%20d%3D%22M1845%204951%20c-90%20-22%20-173%20-90%20-215%20-176%20-24%20-47%20-25%20-61%20-28%20-252%0Al-3%20-203%20-589%20-2%20c-577%20-3%20-589%20-3%20-616%20-24%20-53%20-39%20-69%20-71%20-69%20-134%200%20-63%0A16%20-95%2069%20-134%2025%20-19%2044%20-21%20217%20-24%20l189%20-3%200%20-1668%20c0%20-1629%200%20-1670%2020%0A-1745%2028%20-109%2063%20-170%20150%20-256%2086%20-87%20147%20-122%20256%20-150%2075%20-19%20115%20-20%201334%0A-20%201219%200%201259%201%201334%2020%20109%2028%20170%2063%20256%20150%2087%2086%20122%20147%20150%20256%2020%2075%0A20%20116%2020%201745%20l0%201668%20189%203%20c173%203%20192%205%20217%2024%2053%2039%2069%2071%2069%20134%200%2063%0A-16%2095%20-69%20134%20-27%2021%20-39%2021%20-616%2024%20l-588%202%20-4%20203%20c-3%20190%20-5%20205%20-28%20252%0A-31%2064%20-91%20124%20-155%20155%20l-50%2025%20-705%202%20c-388%200%20-718%20-2%20-735%20-6z%20m1355%20-471%0Al0%20-160%20-640%200%20-640%200%200%20160%200%20160%20640%200%20640%200%200%20-160z%20m800%20-2142%20c0%20-1651%0A-1%20-1663%20-21%20-1708%20-27%20-60%20-64%20-98%20-124%20-126%20l-50%20-24%20-1245%200%20c-1231%200%0A-1246%201%20-1290%2021%20-60%2027%20-98%2064%20-126%20124%20l-24%2050%200%201663%200%201662%201440%200%201440%200%0A0%20-1662z%22%2F%3E%0A%3Cpath%20d%3D%22M1965%203346%20c-41%20-18%20-83%20-69%20-90%20-109%20-3%20-18%20-4%20-478%20-3%20-1024%203%0A-984%203%20-992%2024%20-1019%2038%20-52%2071%20-69%20132%20-69%2070%200%20115%2028%20143%2089%2018%2039%2019%2087%0A19%201026%200%20939%20-1%20987%20-19%201026%20-10%2023%20-33%2051%20-51%2064%20-39%2028%20-113%2036%20-155%2016z%22%2F%3E%0A%3Cpath%20d%3D%22M3040%203353%20c-38%20-16%20-74%20-50%20-91%20-87%20-18%20-39%20-19%20-87%20-19%20-1026%200%0A-939%201%20-987%2019%20-1026%2028%20-61%2073%20-89%20143%20-89%2061%200%2094%2017%20132%2069%2021%2027%2021%2033%2021%0A1046%200%201013%200%201019%20-21%201046%20-34%2046%20-69%2067%20-121%2070%20-26%202%20-55%201%20-63%20-3z%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A");
  }
}
</style>
