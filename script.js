// --- CONFIGURATION ---
let songs = [];
let currentIndex = 0;
let winners = [];
let fadeOutInterval;

// --- CHARGEMENT DE LA PLAYLIST ---
async function loadPlaylist() {
    const input = document.getElementById("playlistInput").value.trim();
    const match = input.match(/\d+/); // Extrait uniquement les chiffres
    
    if (!match) {
        alert("❌ Erreur : Veuillez coller un lien Deezer ou un ID (chiffres) valide.");
        return;
    }

    const playlistId = match[0];
    // Utilisation de Corsproxy.io (souvent plus stable que AllOrigins)
    const apiUrl = `https://api.deezer.com/playlist/${playlistId}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    console.log("Tentative de chargement pour l'ID :", playlistId);

    try {
        const response = await fetch(proxyUrl);
        
        if (!response.ok) throw new Error("Erreur réseau (Proxy)");
        
        const data = await response.json();

        if (data.error) {
            alert(`⚠️ Deezer dit : ${data.error.message}\nVérifiez que votre playlist est bien "PUBLIQUE".`);
            return;
        }

        // On filtre et on prépare les morceaux
        songs = data.tracks.data
            .filter(track => track.preview) // On ignore les titres sans extrait
            .map(track => ({
                title: track.title,
                artist: track.artist.name,
                albumCover: track.album.cover_medium,
                preview: track.preview
            }));

        if (songs.length < 2) {
            alert("❌ Cette playlist n'a pas assez de morceaux avec extraits audio.");
            return;
        }

        // Mélange aléatoire des morceaux
        songs.sort(() => Math.random() - 0.5);
        
        // Changement d'écran
        document.getElementById("setup-area").style.display = "none";
        document.getElementById("battle").style.display = "flex";
        
        currentIndex = 0;
        winners = [];
        showDuel();

    } catch (error) {
        console.error("Détail de l'erreur:", error);
        alert("🔌 Problème de connexion. Le service est peut-être saturé, réessayez dans quelques secondes.");
    }
}

// --- LOGIQUE DU TOURNOI ---
function showDuel() {
    // Si on a fini le tour
    if (currentIndex >= songs.length) {
        if (winners.length === 1) {
            renderWinner(winners[0]);
            return;
        }
        // Tour suivant avec les gagnants du tour précédent
        songs = [...winners];
        winners = [];
        currentIndex = 0;
        showDuel();
        return;
    }

    // Gestion du dernier morceau si le nombre est impair
    if (currentIndex === songs.length - 1) {
        winners.push(songs[currentIndex]);
        currentIndex += 1;
        showDuel();
        return;
    }

    // Affichage des deux morceaux
    displaySong(document.getElementById("songA"), songs[currentIndex]);
    displaySong(document.getElementById("songB"), songs[currentIndex + 1]);
    
    updateProgressBar();
}

function displaySong(container, track) {
    const isA = container.id === "songA";
    const audioId = isA ? "audioA" : "audioB";

    container.innerHTML = `
        <img src="${track.albumCover}" alt="Cover">
        <h3>${track.title}</h3>
        <p>${track.artist}</p>
        <audio id="${audioId}" src="${track.preview}"></audio>
    `;

    const audio = document.getElementById(audioId);

    // Gestion du son au survol
    container.onmouseenter = () => {
        clearInterval(fadeOutInterval);
        audio.volume = 0;
        audio.play().catch(e => console.log("Lecture bloquée par le navigateur"));
        
        let fadeIn = setInterval(() => {
            if (audio.volume < 0.9) audio.volume += 0.1;
            else { audio.volume = 0.5; clearInterval(fadeIn); }
        }, 30);
    };

    container.onmouseleave = () => {
        fadeOutInterval = setInterval(() => {
            if (audio.volume > 0.1) audio.volume -= 0.1;
            else { 
                audio.pause(); 
                audio.currentTime = 0; 
                clearInterval(fadeOutInterval); 
            }
        }, 50);
    };
}

// --- ACTIONS UTILISATEUR ---
function choose(choice) {
    // choice est 0 pour gauche, 1 pour droite
    winners.push(songs[currentIndex + choice]);
    currentIndex += 2;
    showDuel();
}

function skipDuel() {
    // On met les deux à la fin pour plus tard
    let s1 = songs[currentIndex];
    let s2 = songs[currentIndex + 1];
    songs.push(s1, s2);
    currentIndex += 2;
    showDuel();
}

// --- INTERFACE ---
function updateProgressBar() {
    const bar = document.getElementById("progressBar");
    if (bar) {
        const progress = (currentIndex / songs.length) * 100;
        bar.style.width = progress + "%";
    }
}

function renderWinner(winner) {
    document.getElementById("battle").innerHTML = `
        <div class="final-results">
            <h1 id="site-title">🏆 GAGNANT 🏆</h1>
            <div class="winner-card">
                <img src="${winner.albumCover}" class="winner-img" style="width:250px; border-radius:20px; border: 4px solid #6c63ff;">
                <h2>${winner.title}</h2>
                <p>${winner.artist}</p>
            </div>
            <button class="main-btn" onclick="location.reload()" style="max-width:300px; margin-top:20px;">Recommencer</button>
        </div>
    `;
}

// Support de la touche Entrée
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("playlistInput");
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") loadPlaylist();
        });
    }
});