/**
 * Weather Forecast Application
 * Professional-grade weather forecast client with modern ES6+ patterns
 */
class WeatherForecastApp {
  constructor() {
    // Configuration
    this.config = {
      citiesUrl:
        "https://crcstoragea.blob.core.windows.net/$web/weatherForecast/auscities.json",
      weatherApiUrl:
        "https://pksazureweatherforecast.azurewebsites.net/api/PKsWeatherForecast",
      progressInterval: 200,
      progressCompleteDelay: 1000,
      retryAttempts: 3,
      retryDelay: 2000,
    };

    // State management
    this.state = {
      cityDataMap: {},
      isLoading: false,
      progressInterval: null,
      currentRequest: null,
    };

    // DOM elements cache
    this.elements = {};

    // Initialize application
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.cacheElements();
      this.attachEventListeners();
      await this.loadCityData();
      this.setLoadingState(false);
    } catch (error) {
      this.handleError("Failed to initialize application", error);
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      cityInput: document.getElementById("cityInput"),
      cityList: document.getElementById("cityList"),
      styleDropdown: document.getElementById("styleDropdown"),
      submitBtn: document.getElementById("submitBtn"),
      progressBar: document.getElementById("progressBar"),
      forecastResult: document.getElementById("forecastResult"),
    };

    // Validate critical elements exist
    const criticalElements = ["cityInput", "submitBtn", "forecastResult"];
    const missingElements = criticalElements.filter((id) => !this.elements[id]);

    if (missingElements.length > 0) {
      throw new Error(
        `Critical elements missing: ${missingElements.join(", ")}`
      );
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // City input with debouncing
    this.elements.cityInput.addEventListener(
      "input",
      this.debounce(() => this.filterCities(), 300)
    );

    // Submit button
    this.elements.submitBtn.addEventListener("click", (e) =>
      this.handleSubmit(e)
    );

    // Enter key support
    this.elements.cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSubmit(e);
      }
    });

    // Prevent form submission if in a form
    const form = this.elements.submitBtn.closest("form");
    if (form) {
      form.addEventListener("submit", (e) => e.preventDefault());
    }
  }

  /**
   * Load city data from API
   */
  async loadCityData() {
    try {
      // this.showMessage("Loading cities...");

      const response = await fetch(this.config.citiesUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to load cities: ${response.status} ${response.statusText}`
        );
      }

      const cities = await response.json();

      // Process city data
      cities.forEach((city) => {
        const displayName = `${city.city_ascii}, ${city.admin_name}`;
        this.state.cityDataMap[displayName] = {
          city_ascii: city.city_ascii,
          admin_name: city.admin_name,
          LAT: parseFloat(city.LAT),
          LON: parseFloat(city.LON),
        };
      });

      // this.showMessage(`Ready! ${cities.length} cities loaded.`);
      console.log(`✅ Loaded ${cities.length} cities successfully`);
    } catch (error) {
      this.handleError("Failed to load city data", error);
      throw error;
    }
  }

  /**
   * Filter cities based on input with improved search
   */
  filterCities() {
    if (!this.elements.cityList) return;

    const input = this.elements.cityInput.value.toLowerCase().trim();
    this.elements.cityList.innerHTML = "";

    if (input.length < 2) return; // Only search after 2 characters

    // Get matches with scoring
    const matches = Object.keys(this.state.cityDataMap)
      .map((displayName) => ({
        name: displayName,
        score: this.calculateSearchScore(displayName.toLowerCase(), input),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results

    // Add options to datalist
    matches.forEach((match) => {
      const option = document.createElement("option");
      option.value = match.name;
      this.elements.cityList.appendChild(option);
    });
  }

  /**
   * Simple search scoring algorithm
   */
  calculateSearchScore(text, query) {
    if (text.startsWith(query)) return 100;
    if (text.includes(query)) return 50;

    // Check if all query characters exist in order
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) queryIndex++;
    }

    return queryIndex === query.length ? 25 : 0;
  }

  /**
   * Handle form submission
   */
  async handleSubmit(event) {
    event.preventDefault();

    if (this.state.isLoading) {
      console.log("Request already in progress");
      return;
    }

    try {
      // Validate inputs
      const validation = this.validateInputs();
      if (!validation.isValid) {
        this.showError(validation.errors.join("\n"));
        return;
      }

      // Get form data
      const cityData = this.state.cityDataMap[this.elements.cityInput.value];
      const style =
        this.elements.styleDropdown?.value || "friendly weather presenter";

      // Submit request
      await this.submitWeatherRequest(cityData, style);
    } catch (error) {
      this.handleError("Failed to process weather request", error);
    }
  }

  /**
   * Validate user inputs
   */
  validateInputs() {
    const errors = [];
    const cityInput = this.elements.cityInput.value.trim();

    if (!cityInput) {
      errors.push("Please select a city from the list");
    } else if (!this.state.cityDataMap[cityInput]) {
      errors.push("Please select a valid city from the dropdown list");
    }

    const cityData = this.state.cityDataMap[cityInput];
    if (cityData) {
      if (isNaN(cityData.LAT) || isNaN(cityData.LON)) {
        errors.push("Invalid city coordinates");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Submit weather forecast request with retry logic
   */
  async submitWeatherRequest(cityData, style, attempt = 1) {
    try {
      this.setLoadingState(true);
      this.startProgressBar();
      this.showMessage("Generating your personalized weather forecast...");

      const payload = {
        LAT: cityData.LAT,
        LON: cityData.LON,
        STYLE: style,
      };

      console.log(
        `🌤️ Requesting forecast for ${cityData.city_ascii}, ${cityData.admin_name} (Attempt ${attempt})`
      );

      // Create abort controller for request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.config.weatherApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.text) {
        throw new Error("Invalid response format - missing forecast text");
      }

      // Success!
      this.displayForecast(data.text);
      console.log("✅ Weather forecast generated successfully");
    } catch (error) {
      console.error(`❌ Request failed (attempt ${attempt}):`, error);

      // Retry logic
      if (
        attempt < this.config.retryAttempts &&
        !error.name?.includes("Abort")
      ) {
        console.log(`🔄 Retrying in ${this.config.retryDelay}ms...`);
        this.showMessage(
          `Connection failed. Retrying... (${attempt}/${this.config.retryAttempts})`
        );

        await this.delay(this.config.retryDelay);
        return this.submitWeatherRequest(cityData, style, attempt + 1);
      }

      // Final failure
      this.handleError("Weather forecast request failed", error, attempt > 1);
    } finally {
      this.completeProgressBar();
      this.setLoadingState(false);
    }
  }

  /**
   * Display the weather forecast
   */
  displayForecast(forecastText) {
    if (!forecastText || typeof forecastText !== "string") {
      throw new Error("Invalid forecast data received");
    }

    this.elements.forecastResult.innerHTML = `
            <div class="forecast-content">
                <h3>🌤️ Your Weather Forecast</h3>
                <div class="forecast-text">${this.formatForecastText(
                  forecastText
                )}</div>
                <small class="forecast-timestamp">Generated at ${new Date().toLocaleString()}</small>
            </div>
        `;

    // Scroll to results
    this.elements.forecastResult.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /**
   * Format forecast text for better display
   */
  formatForecastText(text) {
    // Convert line breaks and improve formatting
    return text
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
  }

  /**
   * Progress bar management
   */
  startProgressBar() {
    if (!this.elements.progressBar) return;

    let width = 1;
    this.elements.progressBar.style.width = `${width}%`;
    this.elements.progressBar.style.opacity = "1";

    this.state.progressInterval = setInterval(() => {
      if (width >= 90) {
        clearInterval(this.state.progressInterval);
        return;
      }

      // Realistic progress simulation
      const increment = Math.random() * 2 + 0.5;
      width = Math.min(width + increment, 90);
      this.elements.progressBar.style.width = `${width}%`;
    }, this.config.progressInterval);
  }

  completeProgressBar() {
    if (this.state.progressInterval) {
      clearInterval(this.state.progressInterval);
      this.state.progressInterval = null;
    }

    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = "100%";

      setTimeout(() => {
        this.elements.progressBar.style.width = "0%";
        this.elements.progressBar.style.opacity = "0";
      }, this.config.progressCompleteDelay);
    }
  }

  /**
   * Loading state management
   */
  setLoadingState(isLoading) {
    this.state.isLoading = isLoading;

    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = isLoading;
      this.elements.submitBtn.textContent = isLoading
        ? "Generating..."
        : "Get Weather Forecast";
    }

    if (this.elements.cityInput) {
      this.elements.cityInput.disabled = isLoading;
    }

    if (this.elements.styleDropdown) {
      this.elements.styleDropdown.disabled = isLoading;
    }
  }

  /**
   * Message display utilities
   */
  showMessage(message) {
    if (this.elements.forecastResult) {
      this.elements.forecastResult.innerHTML = `
                <div class="message info">
                    <span class="message-icon">ℹ️</span>
                    ${message}
                </div>
            `;
    }
  }

  showError(message) {
    if (this.elements.forecastResult) {
      this.elements.forecastResult.innerHTML = `
                <div class="message error">
                    <span class="message-icon">⚠️</span>
                    ${message}
                </div>
            `;
    }
    console.error("User Error:", message);
  }

  /**
   * Error handling
   */
  handleError(context, error, wasRetried = false) {
    console.error(`${context}:`, error);

    let userMessage =
      "We're experiencing technical difficulties. Please try again.";

    if (error.name === "AbortError") {
      userMessage =
        "Request timed out. Please check your connection and try again.";
    } else if (error.message?.includes("Failed to fetch")) {
      userMessage = "Connection failed. Please check your internet connection.";
    } else if (error.message?.includes("Server error")) {
      userMessage =
        "Server is temporarily unavailable. Please try again in a moment.";
    }

    if (wasRetried) {
      userMessage += " If the problem persists, please try again later.";
    }

    this.showError(userMessage);
  }

  /**
   * Utility functions
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  try {
    new WeatherForecastApp();
    console.log("🚀 Weather Forecast App initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Weather Forecast App:", error);

    // Fallback error display
    const errorElement = document.getElementById("forecastResult");
    if (errorElement) {
      errorElement.innerHTML = `
                <div class="message error">
                    <span class="message-icon">❌</span>
                    Application failed to start. Please refresh the page.
                </div>
            `;
    }
  }
});
