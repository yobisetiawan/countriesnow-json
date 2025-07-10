const axios = require("axios");
const fs = require("fs");

const COUNTRIES_URL = "https://countriesnow.space/api/v0.1/countries/states";
const CITIES_URL = "https://countriesnow.space/api/v0.1/countries/state/cities";
const OUTPUT_FILE = "countries_data.json";
const CHECKPOINT_FILE = "checkpoint.json";

let results = [];
let checkpoint = { index: 0 };

if (fs.existsSync(CHECKPOINT_FILE)) {
  checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE));
}

if (fs.existsSync(OUTPUT_FILE)) {
  results = JSON.parse(fs.readFileSync(OUTPUT_FILE));
}

async function fetchCities(country, state) {
  try {
    const response = await axios.post(CITIES_URL, {
      country,
      state,
    });
    return response.data.data || [];
  } catch (error) {
    console.error(
      `❌ Failed to get cities for ${country} - ${state}: ${error.message}`
    );
    return [];
  }
}

(async () => {
  try {
    console.log(`✅ Starting data fetch from ${COUNTRIES_URL}`);
    const response = await axios.get(COUNTRIES_URL);
    const countries = response.data.data;

    console.log(`✅ Fetched ${countries.length} countries`);

    for (let i = checkpoint.index; i < countries.length; i++) {
      const country = countries[i];
      console.log(`✅ Fetched ${country.name} countries`);
      const result = {
        name: country.name,
        iso3: country.iso3,
        states: [],
      };

      if (country.states && country.states.length > 0) {
        console.log(`✅ Fetched ${country.name} states`);
        for (const state of country.states) {
          console.log(`✅ Fetched ${country.name} - ${state.name} states`);
          const cities = await fetchCities(country.name, state.name);
          result.states.push({ name: state.name, cities });
        }
      } else {
        console.log(`✅ Fetched ${country.name} cities`);
        const cities = await fetchCities(country.name, "");
        result.cities = cities;
      }

      results.push(result);

      console.log(`✅ Writing data for ${country.name}`);
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
      fs.writeFileSync(
        CHECKPOINT_FILE,
        JSON.stringify({ index: i + 1 }, null, 2)
      );

      console.log(`✅ Saved: ${country.name}`);
    }

    console.log("🎉 All done!");
    fs.unlinkSync(CHECKPOINT_FILE);
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
})();
