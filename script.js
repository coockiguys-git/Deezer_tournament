let songs = [];
let currentIndex = 0;
let winners = [];

function getPlaylistId(input) {
  if (input.includes("playlist")) {
    return input.split("/playlist/")[1].split("?")[0];
  }
  return input;
}

function loadPlaylist() {
  const input = document.getElementById("playlistInput").value.trim();
  const playlistId = getPlaylistId(input);

  const script = document.createElement("script");
  script.src = `https://api.deezer.com/playlist/${playlistId}?output=jsonp&callback=handleDeezer`;

  script.onerror = () => {
    alert("Erreur de chargement Deezer");
  };

  document.body.appendChild(script);
}

function handleDeezer(data) {
  if (!data || data.error) {
    alert("Playlist introuvable ou privée");
    return;
  }

  songs = data.tracks.data
    .filter(track => track.preview)
    .map(track => ({
      title: track.title,
      artist: track.artist.name,
      preview: track.preview
    }));

  if (songs.length < 2) {
    alert("Pas assez de musiques avec extrait");
    return;
  }

  shuffle(songs);
  startBattle();
}

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function startBattle() {
  document.getElementById("battle").style.display = "flex";
  currentIndex = 0;
  winners = [];
  showDuel();
}

function showDuel() {
  if (currentIndex >= songs.length - 1) {
    songs = winners;
    winners = [];
    currentIndex = 0;

    if (songs.length === 1) {
      alert("🏆 Gagnant : " + songs[0].title);
      return;
    }
    showDuel();
    return;
  }

  const s1 = songs[currentIndex];
  const s2 = songs[currentIndex + 1];

  document.getElementById("title1").textContent = s1.title;
  document.getElementById("artist1").textContent = s1.artist;
  document.getElementById("audio1").src = s1.preview;

  document.getElementById("title2").textContent = s2.title;
  document.getElementById("artist2").textContent = s2.artist;
  document.getElementById("audio2").src = s2.preview;
}

function choose(choice) {
  winners.push(songs[currentIndex + choice]);
  currentIndex += 2;
  showDuel();
}
