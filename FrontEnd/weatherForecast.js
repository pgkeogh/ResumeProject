let cities = []; // Global variable to store city data

document.addEventListener("DOMContentLoaded", function () {
  // Fetch city data
  fetch("WeatherForecast/auscities.json")
    .then((response) => response.json())
    .then((data) => {
      cities = data;
    })
    .catch((error) => console.error("Error:", error));

  // Attach the event listener to cityInput
  var cityInputElement = document.getElementById("cityInput");
  if (cityInputElement) {
    cityInputElement.addEventListener("input", filterCities);
  } else {
    console.error("cityInput element not found");
  }
});

function filterCities() {
  var input = document.getElementById("cityInput").value.toLowerCase();
  var dataList = document.getElementById("cityList");

  // Filter cities based on input
  var filteredCities = cities.filter((city) =>
    city.city_ascii.toLowerCase().startsWith(input)
  );

  // Clear previous options
  dataList.innerHTML = "";

  // Add filtered cities to the datalist
  filteredCities.forEach((city) => {
    var option = document.createElement("option");
    option.value = `${city.city_ascii}, ${city.admin_name}`;
    dataList.appendChild(option);
  });
}
