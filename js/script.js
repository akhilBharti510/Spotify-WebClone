// ===================== Music Player =====================
let currentSong = new Audio();
let songs = [];
let currFolder = "";

// seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

const albums = [
  "Aashiqui 2",
  "Angrezi Medium",
  "Brahmastra",
  "Chhichhore",
  "G.O.A.T",
  "Indipop",
  "ncs",
  "Yeh Jawaani Hai Deewani",
];

// Display all album cards
async function displayAlbums() {
  const cardContainer = document.querySelector(".cardContainer");
  if (!cardContainer) return;

  for (const folder of albums) {
    try {
      const res = await fetch(`./songs/${folder}/info.json`);
      const data = await res.json();

      const card = document.createElement("div");
      card.classList.add("card");
      card.dataset.folder = folder;
      card.innerHTML = `
        <div class="play">
          <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#1abc54"></circle>
            <polygon points="40,35 70,50 40,65" fill="rgb(0,0,0)"></polygon>
          </svg>
        </div>
        <img src="./songs/${folder}/cover.jpg" alt="${data.title}">
        <h2>${data.title}</h2>
        <p>${data.description}</p>
      `;
      cardContainer.appendChild(card);

      card.addEventListener("click", () => {
        songs = data.songs;
        currFolder = `songs/${folder}`;
        playMusic(songs[0]);
        updateSongListUI();
      });
    } catch (err) {
      console.error(`Error loading album "${folder}":`, err);
    }
  }
}

// Play a song
function playMusic(track, pause = false) {
  if (!track) return;
  currentSong.src = `${currFolder}/${track}`;
  if (!pause) currentSong.play();

  const playBtn = document.getElementById("play");
  if (playBtn)
    playBtn.src = currentSong.paused ? "./img/play.svg" : "./img/pause.svg";

  const songInfo = document.querySelector(".songinfo");
  if (songInfo) songInfo.textContent = track;

  const songTime = document.querySelector(".songtime");
  if (songTime) songTime.textContent = "00:00 / 00:00";
}

// Update playlist UI
function updateSongListUI() {
  const ul = document.querySelector(".songList ul");
  if (!ul) return;
  ul.innerHTML = "";

  songs.forEach((track) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img class="invert" src="./img/music.svg" alt="">
      <div class="info">
        <div>${track}</div>
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img class="invert" src="./img/play.svg" alt="">
      </div>
    `;
    li.addEventListener("click", () => {
      playMusic(track);
    });
    ul.appendChild(li);
  });
}

// Get current track filename
function getCurrentTrackName() {
  return decodeURIComponent(currentSong.src.split("/").pop());
}

// ===================== Main =====================
async function main() {
  // Load first album by default
  try {
    const firstAlbum = albums[0];
    const res = await fetch(`./songs/${firstAlbum}/info.json`);
    const data = await res.json();
    songs = data.songs;
    currFolder = `songs/${firstAlbum}`;
    playMusic(songs[0], true); // paused
    updateSongListUI();
  } catch (err) {
    console.error("Error loading default album:", err);
  }

  displayAlbums();

  // Play/Pause button
  const playBtn = document.getElementById("play");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play();
        playBtn.src = "./img/pause.svg";
      } else {
        currentSong.pause();
        playBtn.src = "./img/play.svg";
      }
    });
  }

  // Time update & seekbar
  currentSong.addEventListener("timeupdate", () => {
    const songTime = document.querySelector(".songtime");
    if (songTime)
      songTime.textContent = `${secondsToMinutesSeconds(
        currentSong.currentTime
      )} / ${secondsToMinutesSeconds(currentSong.duration)}`;

    const circle = document.querySelector(".circle");
    if (circle && currentSong.duration)
      circle.style.left = `${
        (currentSong.currentTime / currentSong.duration) * 100
      }%`;
  });

  // Auto next song
  currentSong.addEventListener("ended", () => {
    let index = songs.indexOf(getCurrentTrackName());
    if (index === -1) return;
    index = (index + 1) % songs.length;
    playMusic(songs[index]);
  });

  // Seekbar click
  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      const percent = e.offsetX / seekbar.getBoundingClientRect().width;
      currentSong.currentTime = currentSong.duration * percent;
    });
  }

  // Previous / Next buttons
  const previousBtn = document.getElementById("previous");
  const nextBtn = document.getElementById("next");
  const playNextPrev = (direction) => {
    let index = songs.indexOf(getCurrentTrackName());
    if (index === -1) return;
    if (direction === "next") index = (index + 1) % songs.length;
    else index = (index - 1 + songs.length) % songs.length;
    playMusic(songs[index]);
  };
  if (previousBtn)
    previousBtn.addEventListener("click", () => playNextPrev("prev"));
  if (nextBtn) nextBtn.addEventListener("click", () => playNextPrev("next"));

  // Volume control
  const volumeRange = document.querySelector(".range input");
  const volumeBtn = document.querySelector(".volume>img");
  if (volumeRange) {
    volumeRange.addEventListener("input", (e) => {
      currentSong.volume = e.target.value / 100;
      if (volumeBtn)
        volumeBtn.src =
          currentSong.volume === 0 ? "./img/mute.svg" : "./img/volume.svg";
    });
  }
  if (volumeBtn) {
    volumeBtn.addEventListener("click", () => {
      if (currentSong.volume > 0) {
        currentSong.volume = 0;
        volumeBtn.src = "./img/mute.svg";
        if (volumeRange) volumeRange.value = 0;
      } else {
        currentSong.volume = 0.1;
        volumeBtn.src = "./img/volume.svg";
        if (volumeRange) volumeRange.value = 10;
      }
    });
  }

  // Hamburger menu
  const hamburger = document.querySelector(".hamburger");
  const closeBtn = document.querySelector(".close");
  const leftPanel = document.querySelector(".left");
  if (hamburger && leftPanel) {
    hamburger.addEventListener("click", () => (leftPanel.style.left = "0"));
  }
  if (closeBtn && leftPanel) {
    closeBtn.addEventListener("click", () => (leftPanel.style.left = "-120%"));
  }
}

main();

// ===================== Song Search =====================
function searchSongs(query) {
  query = query.toLowerCase().trim();
  if (!query) {
    updateSongListUI();
    return;
  }
  const filteredSongs = songs.filter((track) =>
    track.toLowerCase().includes(query)
  );
  const ul = document.querySelector(".songList ul");
  if (!ul) return;
  ul.innerHTML = "";
  filteredSongs.forEach((track) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img class="invert" src="./img/music.svg" alt="">
      <div class="info">
        <div>${track}</div>
        
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img class="invert" src="./img/play.svg" alt="">
      </div>
    `;
    li.addEventListener("click", () => playMusic(track));
    ul.appendChild(li);
  });
}
const searchInput = document.getElementById("songSearch");
if (searchInput) {
  searchInput.addEventListener("input", (e) => searchSongs(e.target.value));
}

// ===================== Login / Signup System =====================

// Helper Functions
function showUsername(name) {
  const display = document.getElementById("usernameDisplay");
  if (display) display.textContent = `Welcome, ${name}!`;
}

function showButtons(loginVisible, signupVisible, logoutVisible) {
  document.querySelector(".loginbtn").style.display = loginVisible
    ? "inline-block"
    : "none";
  document.querySelector(".signupbtn").style.display = signupVisible
    ? "inline-block"
    : "none";

  if (!document.querySelector(".logoutbtn")) {
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.classList.add("logoutbtn");
    logoutBtn.style.marginLeft = "12px";
    logoutBtn.style.cursor = "pointer";
    document.querySelector(".buttons").appendChild(logoutBtn);

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      location.reload();
    });
  }
  const logoutBtn = document.querySelector(".logoutbtn");
  if (logoutBtn)
    logoutBtn.style.display = logoutVisible ? "inline-block" : "none";
}

// Users
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUser(username, password) {
  const users = getUsers();
  users.push({ username, password });
  localStorage.setItem("users", JSON.stringify(users));
}

function validateUser(username, password) {
  const users = getUsers();
  return users.find((u) => u.username === username && u.password === password);
}

// Modals
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const loginBtn = document.querySelector(".loginbtn");
const signupBtn = document.querySelector(".signupbtn");
const closeBtns = document.querySelectorAll(".close");
const openSignup = document.getElementById("openSignup");
const openLogin = document.getElementById("openLogin");

// Events
loginBtn?.addEventListener("click", () => (loginModal.style.display = "flex"));
signupBtn?.addEventListener(
  "click",
  () => (signupModal.style.display = "flex")
);
closeBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    loginModal.style.display = "none";
    signupModal.style.display = "none";
  })
);
window.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
  if (e.target === signupModal) signupModal.style.display = "none";
});
openSignup?.addEventListener("click", () => {
  loginModal.style.display = "none";
  signupModal.style.display = "flex";
});
openLogin?.addEventListener("click", () => {
  signupModal.style.display = "none";
  loginModal.style.display = "flex";
});

// Forms
const signupForm = document.getElementById("signupForm");
signupForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  saveUser(username, password);
  alert("Signup successful! Please login.");
  signupModal.style.display = "none";
  loginModal.style.display = "flex";
});

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const enteredUser = document.getElementById("loginUsername").value;
  const enteredPass = document.getElementById("loginPassword").value;
  const validUser = validateUser(enteredUser, enteredPass);
  if (validUser) {
    localStorage.setItem("loggedInUser", enteredUser);
    loginModal.style.display = "none";
    showUsername(enteredUser);
    showButtons(false, false, true);
  } else {
    alert("User Not Found!\nPlease Sign Up!!!");
  }
});

// Page Load
window.addEventListener("load", () => {
  const loggedInUser = localStorage.getItem("loggedInUser");

  if (loggedInUser) {
    // User already logged in
    showUsername(loggedInUser);
    showButtons(false, false, true);
  } else {
    // First-time visitor
    loginModal.style.display = "flex"; // Show login modal
    showButtons(true, true, false);
  }
});

loginModal.querySelector(".close")?.addEventListener("click", () => {
  const randomNames = [
    "Coder101",
    "TechieX",
    "AlphaDev",
    "SkyWalker",
    "PixelGuy",
  ];
  const randomName =
    randomNames[Math.floor(Math.random() * randomNames.length)];
  showUsername(randomName);
});

// Show/Hide Password Toggle
document.querySelectorAll(".toggle-password").forEach(el => {
  const input = document.querySelector(el.getAttribute("toggle"));
  const eyeOpen = el.querySelector(".eye-open");
  const eyeClosed = el.querySelector(".eye-closed");

  el.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      eyeOpen.style.display = "inline";
      eyeClosed.style.display = "none";
    } else {
      input.type = "password";
      eyeOpen.style.display = "none";
      eyeClosed.style.display = "inline";
    }
  });
});
