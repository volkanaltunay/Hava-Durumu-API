const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const searchHistoryDiv = document.querySelector(".search-history"); // Son aramalar listesi

const API_KEY = "091a034270564ad17b0c3190d63f17d1";

// LocalStorage'a şehir ekle
const saveToSearchHistory = (city) => {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!history.includes(city)) {
        history.unshift(city);
        if (history.length > 5) history.pop(); // Maksimum 5 kayıt tut
        localStorage.setItem("searchHistory", JSON.stringify(history));
    }
    renderSearchHistory();
}

// Son arama geçmişini göster
const renderSearchHistory = () => {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!searchHistoryDiv) return;
    searchHistoryDiv.innerHTML = "";

    history.forEach(city => {
        const cityBtn = document.createElement("button");
        cityBtn.textContent = city;
        cityBtn.classList.add("history-btn");
        cityBtn.addEventListener("click", () => {
            cityInput.value = city;
            getCityCoordinates();
        });
        searchHistoryDiv.appendChild(cityBtn);
    });
}

const createWeatherCard = (cityName, weatherItem, index) => {
    const date = weatherItem.dt_txt.split(" ")[0];
    const icon = weatherItem.weather[0].icon;
    const temp = weatherItem.main.temp.toFixed(1);
    const wind = weatherItem.wind.speed;
    const humidity = weatherItem.main.humidity;

    if(index === 0){
        return `
            <div class="details">
                <h2>${cityName} (${date})</h2>
                <h4>Temperature: ${temp}°C</h4>
                <h4>Wind: ${wind} M/S</h4>
                <h4>Humidity: ${humidity}%</h4>
            </div>
            <div class="icon">
                <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="">
                <h4>${weatherItem.weather[0].description}</h4>
            </div>`;
    } else {
        return `
            <li class="card"> 
                <h3>${date}</h3>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="">
                <h4>Temp: ${temp}°C</h4>
                <h4>Wind: ${wind} M/S</h4>
                <h4>Humidity: ${humidity}%</h4>
            </li>`;
    }
}

const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=40&units=metric&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            const uniqueForecastDays = new Set();
            const fiveDaysForecast = [];

            data.list.forEach(forecast => {
                const date = forecast.dt_txt.split(" ")[0];
                if (!uniqueForecastDays.has(date)) {
                    uniqueForecastDays.add(date);
                    fiveDaysForecast.push(forecast);
                }
            });
            cityInput.value = "";
            weatherCardsDiv.innerHTML = "";
            currentWeatherDiv.innerHTML = "";

            fiveDaysForecast.forEach((weatherItem, index) => {
                if(index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });
        })
        .catch(() => {
            alert("An error occurred while fetching the weather forecast!");
        });
};

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                alert(`No coordinates found for ${cityName}`);
                return;
            }
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon);
            saveToSearchHistory(name);
        })
        .catch(() => {
            alert("An error occurred while fetching the coordinates!");
        });
};

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                    saveToSearchHistory(name);
                })
                .catch(() => {
                    alert("An error occurred while fetching the city!");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            }
        }
    );
}

locationButton.addEventListener("click", getUserCoordinates);
cityInput.addEventListener("keyup", e => {
    if (e.key === "Enter") {
        getCityCoordinates();
    }
});

// Sayfa yüklendiğinde son aramaları göster
window.addEventListener("DOMContentLoaded", () => {
    renderSearchHistory();

    // Sayfa açılır açılmaz Ankara için hava durumu göster
    cityInput.value = "Ankara";
    getCityCoordinates();
});

searchButton.addEventListener("click", (e) => {
    e.preventDefault(); // Form submit engelle
    getCityCoordinates();
});

const settingsToggle = document.getElementById("settings-toggle");
const settingsMenu = document.getElementById("settings-menu");

settingsToggle.addEventListener("click", () => {
    settingsMenu.classList.toggle("hidden");
});
