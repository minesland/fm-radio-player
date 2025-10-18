// =====================
// FM Radio Player App
// =====================

const apiBase = "https://corsproxy.io/?https://de1.api.radio-browser.info/json/stations/bycountry/";

const countrySelect = document.getElementById("countrySelect");
const stationList = document.getElementById("stationList");
const searchInput = document.getElementById("searchInput");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const volumeSlider = document.getElementById("volumeSlider");
const favoritesBtn = document.getElementById("favoritesBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");

let stations = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentStation = null;

async function fetchStations(country) {
  stationList.innerHTML = `<p class="loading">🎧 Loading stations for ${country}...</p>`;
  try {
    const response = await fetch(`${apiBase}${encodeURIComponent(country)}`);
    const data = await response.json();
    stations = data.filter(station => station.url_resolved.startsWith("https://"));
    renderStations(stations);
  } catch (err) {
    stationList.innerHTML = `<p class="error">❌ Unable to load stations. Please try again later.</p>`;
    console.error("Fetch error:", err);
  }
}

function renderStations(list) {
  stationList.innerHTML = "";
  if (!list.length) {
    stationList.innerHTML = `<p class="empty">No stations found.</p>`;
    return;
  }

  list.forEach(station => {
    const card = document.createElement("div");
    card.className = "station-card";
    const isFavorite = favorites.some(fav => fav.stationuuid === station.stationuuid);

    card.innerHTML = `
      <img src="${station.favicon || 'assets/default-logo.png'}" alt="Logo" class="station-logo">
      <div class="station-info">
        <h3>${station.name}</h3>
        <p>${station.country || "Unknown Country"}</p>
      </div>
      <div class="station-actions">
        <button class="play-btn">▶️</button>
        <button class="fav-btn ${isFavorite ? 'fav-active' : ''}">⭐</button>
      </div>
    `;

    const playBtn = card.querySelector(".play-btn");
    const favBtn = card.querySelector(".fav-btn");
    playBtn.addEventListener("click", () => playStation(station));
    favBtn.addEventListener("click", () => toggleFavorite(station, favBtn));
    stationList.appendChild(card);
  });
}

function playStation(station) {
  currentStation = station;
  audioPlayer.src = station.url_resolved;
  audioPlayer.play();
  nowPlaying.textContent = `🎵 Now Playing: ${station.name}`;
}

function toggleFavorite(station, btn) {
  const exists = favorites.some(fav => fav.stationuuid === station.stationuuid);
  if (exists) {
    favorites = favorites.filter(fav => fav.stationuuid !== station.stationuuid);
    btn.classList.remove("fav-active");
  } else {
    favorites.push(station);
    btn.classList.add("fav-active");
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

searchInput.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();
  const filtered = stations.filter(st => st.name.toLowerCase().includes(keyword));
  renderStations(filtered);
});

volumeSlider.addEventListener("input", e => {
  audioPlayer.volume = e.target.value;
});

favoritesBtn.addEventListener("click", () => {
  if (favoritesBtn.classList.contains("active")) {
    renderStations(stations);
    favoritesBtn.classList.remove("active");
  } else {
    renderStations(favorites);
    favoritesBtn.classList.add("active");
  }
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "favorites.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const imported = JSON.parse(event.target.result);
      favorites = imported;
      localStorage.setItem("favorites", JSON.stringify(favorites));
      alert("✅ Favorites imported successfully!");
      renderStations(stations);
    } catch (err) {
      alert("❌ Invalid file format.");
    }
  };
  reader.readAsText(file);
});

countrySelect.addEventListener("change", e => {
  const country = e.target.value;
  localStorage.setItem("lastCountry", country);
  fetchStations(country);
});

window.addEventListener("DOMContentLoaded", () => {
  const lastCountry = localStorage.getItem("lastCountry") || "United States";
  countrySelect.value = lastCountry;
  fetchStations(lastCountry);
  audioPlayer.volume = 0.5;
});
