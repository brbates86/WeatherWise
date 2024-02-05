const apiKey = "1b18ce13c84e21faafb19c931bb29331";
const savedSearches = [];

const searchHistoryList = function(cityName) {
    $('.past-search:contains("' + cityName + '")').remove();

    const searchHistoryEntry = $("<p>").addClass("past-search").text(cityName);
    const searchEntryContainer = $("<div>").addClass("past-search-container").append(searchHistoryEntry);

    $("#search-history-container").append(searchEntryContainer);

    if (savedSearches.length > 0) {
        savedSearches.push(cityName);
        localStorage.setItem("savedSearches", JSON.stringify(savedSearches));
        $("#search-input").val("");
    }
};

const loadSearchHistory = function() {
    try {
        const savedSearchHistory = localStorage.getItem("savedSearches");

        if (!savedSearchHistory) {
            return;
        }

        const parsedSearchHistory = JSON.parse(savedSearchHistory);

        parsedSearchHistory.forEach(cityName => {
            searchHistoryList(cityName);
        });
    } catch (error) {
        console.error("Error parsing search history:", error);
    }
};

const getWardrobeSuggestion = function(response) {
    const weatherCondition = response.current.weather[0].main.toLowerCase();

    let suggestion = "";

    switch (weatherCondition) {
        case "clear":
            suggestion = "It's clear sky. Wear sunglasses and light clothes.";
            break;
        case "clouds":
            suggestion = "Partly cloudy. Bring a light jacket just in case.";
            break;
        case "rain":
            suggestion = "It's raining. Don't forget your umbrella and waterproof jacket.";
            break;
        case "snow":
            suggestion = "Expecting snow. Bundle up with a warm coat and boots.";
            break;
        default:
            suggestion = "Check the weather conditions for the best clothing choice.";
    }

    return suggestion;
};

const updateCurrentWeather = function(cityName, response) {
    searchHistoryList(cityName);

    const currentWeatherContainer = $("#current-weather-container").addClass("current-weather-container");
    const currentTitle = $("#current-title").text(`${cityName} (${moment().format("M/D/YYYY")})`);
    const currentIcon = $("#current-weather-icon").addClass("current-weather-icon");
    const currentIconCode = response.current.weather[0].icon;
    currentIcon.attr("src", `https://openweathermap.org/img/wn/${currentIconCode}@2x.png`);

    const currentTemperature = $("#current-temperature").text(`Temperature: ${response.current.temp} \u00B0F`);
    const currentHumidity = $("#current-humidity").text(`Humidity: ${response.current.humidity}%`);
    const currentWindSpeed = $("#current-wind-speed").text(`Wind Speed: ${response.current.wind_speed} MPH`);
    const currentUvIndex = $("#current-uv-index").text("UV Index: ");
    const currentNumber = $("#current-number").text(response.current.uvi);

    if (response.current.uvi <= 2) {
        currentNumber.addClass("favorable");
    } else if (response.current.uvi >= 3 && response.current.uvi <= 7) {
        currentNumber.addClass("moderate");
    } else {
        currentNumber.addClass("severe");
    }

    // Update date and time
    const currentDateTime = moment().format("MMMM D, YYYY h:mm A");
    $("#current-date-time").text(currentDateTime);

    const wardrobeSuggestion = getWardrobeSuggestion(response);
    $("#wardrobe-suggestion").text(wardrobeSuggestion);
};

const currentWeatherSection = function(cityName) {
    console.log("Fetching current weather data...");
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`)
        .then(response => response.json())
        .then(response => {
            console.log("Current weather data received:", response);
            const cityLon = response.coord.lon;
            const cityLat = response.coord.lat;

            fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${cityLat}&lon=${cityLon}&exclude=minutely,hourly,alerts&units=imperial&appid=${apiKey}`)
                .then(response => response.json())
                .then(response => {
                    console.log("API Response:", response);
                    updateCurrentWeather(cityName, response);
                    // Call fiveDayForecastSection here, after current weather data is processed
                    fiveDayForecastSection(cityName);
                });
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            $("#search-input").val("");
            alert("We could not find the city you searched for. Try searching for a valid city.");
        });
};

// ...

$("#search-form").on("submit", function(event) {
    event.preventDefault();

    const cityName = $("#search-input").val();

    if (!cityName) {
        alert("Please enter the name of the city.");
        event.preventDefault();
    } else {
        currentWeatherSection(cityName);
        // Don't call fiveDayForecastSection here
    }
});


const updateFutureForecast = function(response) {
    const futureForecastTitle = $("#future-forecast-title").text("5-Day Forecast:");
    const forecastsCardsContainer = $("#forecasts-cards-container").empty(); // Clear previous cards

    for (let i = 1; i <= 5; i++) {
        const forecast = response.daily[i];

        // Create forecast card elements
        const forecastCard = $("<div>").addClass("future-card bg-primary");
        const futureDate = $("<p>").addClass("future-date").attr("id", "future-date-" + i).text(moment().add(i, "d").format("M/D"));
        const futureIcon = $("<img>").addClass("future-icon").attr("id", "future-icon-" + i).attr("src", `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`);
        const futureTemp = $("<p>").addClass("future-temp").attr("id", "future-temp-" + i).text(`${forecast.temp.day} \u00B0F`);
        const futureHumidity = $("<p>").addClass("future-humidity").attr("id", "future-humidity-" + i).text(`HUM: ${forecast.humidity}%`);

        // Append elements to forecast card
        forecastCard.append(futureDate, futureIcon, futureTemp, futureHumidity);

        // Append forecast card to container
        forecastsCardsContainer.append(forecastCard);
    }
};






const fiveDayForecastSection = function(cityName) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`)
        .then(response => response.json())
        .then(response => {
            const cityLon = response.coord.lon;
            const cityLat = response.coord.lat;

            fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${cityLat}&lon=${cityLon}&exclude=minutely,hourly,alerts&units=imperial&appid=${apiKey}`)
                .then(response => response.json())
                .then(response => {
                    updateFutureForecast(response);
                    $(".future-forecast-container").css("display", "block");
                })
                .catch(error => {
                    console.error("Error fetching one call API:", error);
                });
        })
        .catch(err => {
            $("#search-input").val("");
            alert("We could not find the city you searched for. Try searching for a valid city.");
            console.error("Error fetching 5-day forecast:", err);
        });
};

$("#search-form").on("submit", function(event) {
    event.preventDefault();

    const cityName = $("#search-input").val();

    if (!cityName) {
        alert("Please enter the name of the city.");
    } else {
        currentWeatherSection(cityName);
        fiveDayForecastSection(cityName);
    }
});

$("#search-history-container").on("click", "p", function() {
    const previousCityName = $(this).text();
    currentWeatherSection(previousCityName);
    fiveDayForecastSection(previousCityName);

    $(this).remove();
});

loadSearchHistory();
