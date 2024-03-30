let cityDataMap = {}; // Map to store city display names and their data

document.addEventListener("DOMContentLoaded", function () {
  fetch(
    "https://crcstoragea.blob.core.windows.net/$web/weatherForecast/auscities.json"
  )
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
    if (displayName.toLowerCase().startsWith(input)) {
      var option = document.createElement("option");
      option.value = displayName; // Use the display name for the option value
      dataList.appendChild(option);
    }
  });
}

// ****PROGRESS BAR FUNCTIONS****
function startProgressBar() {
  console.log("starting progress bar");
  var progressBar = document.getElementById("progressBar");
  if (!progressBar) {
    console.error("Progress bar element not found!");
    return; // Exit the function if the progress bar doesn't exist
  }
  // progressBar.style.width = "1%"; // Reset/start progress bar
  var width = 1;
  var interval = 300; // Adjust this to control how fast the progress bar moves
  console.log("bar set");

  var progressInterval = setInterval(function () {
    if (width >= 100) {
      clearInterval(progressInterval);
    } else {
      width++;
      progressBar.style.width = width + "%";
    }
  }, interval);

  // Store the interval ID so it can be cleared later
  progressBar.setAttribute("data-interval-id", progressInterval);
}

function completeProgressBar() {
  var progressBar = document.getElementById("progressBar");
  progressBar.style.width = "100%"; // Immediately set to 100%

  // Clear the interval to stop the progress bar
  var intervalId = progressBar.getAttribute("data-interval-id");
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Optionally, hide the progress bar after a delay or transition
  setTimeout(function () {
    progressBar.style.width = "0%"; // or hide the container
  }, 1000); // Adjust delay as needed
}

// Handle submit button click
document.getElementById("submitBtn").addEventListener("click", function () {
  const cityInputValue = document.getElementById("cityInput").value;
  const cityData = cityDataMap[cityInputValue];

  if (!cityData) {
    console.error("Selected city data not found.");
    // Display an alert to the user
    alert(
      "Error: The selected city is not valid. Please select a city from the list."
    );
    return;
  }
  startProgressBar();

  const conversationStyle = document.getElementById("styleDropdown").value;
  document.getElementById("forecastResult").textContent =
    "Generating your forecast...";

  // Construct the request payload
  const payload = {
    LAT: cityData.LAT,
    LON: cityData.LON,
    STYLE: conversationStyle,
  };
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
    })
    .then((data) => {
      // Display the forecast
      document.getElementById("forecastResult").textContent = data.text;
      // Remove progress bar
      completeProgressBar();
    })
    .catch((error) => console.error("Error:", error));
});
