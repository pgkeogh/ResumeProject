let cityDataMap = {}; // Map to store city display names and their data

document.addEventListener("DOMContentLoaded", function () {
  fetch("WeatherForecast/auscities.json")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((city) => {
        const displayName = `${city.city_ascii}, ${city.admin_name}`;
        // Store all relevant data in the map
        cityDataMap[displayName] = {
          city_ascii: city.city_ascii,
          admin_name: city.admin_name,
          LAT: city.LAT,
          LON: city.LON,
        };
      });
    })
    .catch((error) => console.error("Error:", error));
});

// Attach the event listener to cityInput
var cityInputElement = document.getElementById("cityInput");
if (cityInputElement) {
  cityInputElement.addEventListener("input", filterCities);
} else {
  console.error("cityInput element not found");
}

function filterCities() {
  var input = document.getElementById("cityInput").value.toLowerCase();
  var dataList = document.getElementById("cityList");

  dataList.innerHTML = ""; // Clear previous options

  // Filter and add city names to the datalist based on input
  Object.keys(cityDataMap).forEach((displayName) => {
    if (displayName.toLowerCase().includes(input)) {
      var option = document.createElement("option");
      option.value = displayName; // Use the display name for the option value
      dataList.appendChild(option);
    }
  });
}

// Handle submit button click
document.getElementById("submitBtn").addEventListener("click", function () {
  const cityInputValue = document.getElementById("cityInput").value;
  const cityData = cityDataMap[cityInputValue];

  if (!cityData) {
    console.error("Selected city data not found.");
    return;
  }

  const conversationStyle = document.getElementById("styleDropdown").value;
  document.getElementById("forecastResult").textContent =
    "Generating your forecast...";

  // Construct the request payload
  const payload = {
    LAT: cityData.LAT,
    LON: cityData.LON,
    STYLE: conversationStyle,
  };
  console.log(cityData.LAT);
  console.log(payload);

  // Trigger the Azure Function
  fetch(
    "https://pksazureweatherforecast.azurewebsites.net/api/PKsWeatherForecast",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )
    .then((response) => {
      // return response.text;
      if (!response.ok) {
        throw new Error(
          `Network response was not ok, status: ${response.status}`
        );
      }
      // Ensure the response is in JSON format
      const contentType = response.headers.get("content-type");
      console.log(contentType);
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      return response.json();
      // return response.text();
    })
    .then((data) => {
      // Display the forecast
      document.getElementById("forecastResult").textContent = data.text;
    })
    .catch((error) => console.error("Error:", error));
});
