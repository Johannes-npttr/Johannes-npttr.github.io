let lovers = []; // Liste der Verliebten
let protectedByMattress = null;
let witchHealUsed = false;
let witchKillUsed = false;
let currentNight = 1; // Variable zur Verfolgung der aktuellen Nacht
let totalPlayers = 0;
let roles = [];
let currentPlayerIndex = 0;
let playerData = [];
let deadPlayers = []; // Liste der ausgeschiedenen Spieler
let healerProtected = null; // Spielername, der durch Heiler geschützt ist
let priestUsed = false; // Der Priester kann nur einmal segnen
let accusedPlayers = {}; // Liste der angeklagten Spieler und ihre Stimmen
let mayor = null; // Name des Bürgermeisters
let nightActions = []; // Temporäre Liste für Nachtaktionen
let bodyguardProtected = null; // Spielername, der vom Leibwächter geschützt wird
let bodyguardHealth = 1; // Lebenspunkte des Leibwächters

// 🔁 Beim Laden: Spiel wiederherstellen
window.onload = function () {
  const savedData = localStorage.getItem('werwolfGame');
  if (savedData) {
    const data = JSON.parse(savedData);
    playerData = data.playerData;
    currentPlayerIndex = data.currentPlayerIndex || 0;
    lovers = data.lovers || [];
    currentNight = data.currentNight || 1;
    deadPlayers = data.deadPlayers || [];

    // Direkt zum passenden Abschnitt springen:
    if (currentPlayerIndex < playerData.length) {
      document.getElementById('setup').classList.add('hidden');
      document.getElementById('roleReveal').classList.remove('hidden');
      updatePlayerReveal();
    } else {
      document.getElementById('setup').classList.add('hidden');
      document.getElementById('narratorMode').classList.remove('hidden');
      showNarratorView();
    }
  }if (deadPlayers.includes(phase.role)) {
  nextNightPhase();
  return;
}
};

function resetGame() {
  localStorage.removeItem('werwolfGame');
  location.reload(); // Seite neu laden
}

function goToRoleSelection() {
  totalPlayers = parseInt(document.getElementById('playerCount').value);
  if (!totalPlayers || totalPlayers < 3) {
    alert("Mindestens 3 Spieler nötig!");
    return;
  }
  document.getElementById('setup').classList.add('hidden');
  document.getElementById('roleSetup').classList.remove('hidden');
}

function assignRoles() {
  const wolves = parseInt(document.getElementById('wolvesCount').value) || 0;
  const seerEnabled = document.getElementById('seerEnabled').checked;
  const witchEnabled = document.getElementById('witchEnabled').checked;
  const armorEnabled = document.getElementById('armorEnabled').checked;
  const healerEnabled = document.getElementById('healerEnabled').checked;
  const priestEnabled = document.getElementById('priestEnabled').checked;
  const bodyguardEnabled = document.getElementById('bodyguardEnabled').checked;
  const hunterEnabled = document.getElementById('hunterEnabled').checked; // Neue Rolle: Jäger
  const villageMattressEnabled = document.getElementById('villageMattressEnabled').checked;

  let specialRoles = 0;
  if (seerEnabled) specialRoles++;
  if (witchEnabled) specialRoles++;
  if (armorEnabled) specialRoles++;
  if (healerEnabled) specialRoles++;
  if (priestEnabled) specialRoles++;
  if (bodyguardEnabled) specialRoles++;
  if (hunterEnabled) specialRoles++; // Zähler für Jäger
  if (villageMattressEnabled) specialRoles++;

  let villagers = totalPlayers - wolves - specialRoles;
  let roles = [
    ...Array(wolves).fill("Werwolf"),
    ...(seerEnabled ? ["Seher"] : []),
    ...(witchEnabled ? ["Hexe"] : []),
    ...(armorEnabled ? ["Armor"] : []),
    ...(healerEnabled ? ["Heiler"] : []),
    ...(priestEnabled ? ["Priest"] : []),
    ...(bodyguardEnabled ? ["Leibwächter"] : []),
    ...(hunterEnabled ? ["Jäger"] : []), // Neue Rolle: Jäger
    ...(villageMattressEnabled ? ["Dorfmatratze"] : []),
  ];

  if (villagers < 0) {
    alert("Zu viele Spezialrollen für die Spieleranzahl!");
    return;
  }

  roles = [...roles, ...Array(villagers).fill("Dorfbewohner")];
  roles = roles.sort(() => Math.random() - 0.5); // Rollen mischen
  playerData = roles.map((role, index) => ({ name: `Spieler ${index + 1}`, role }));

  localStorage.setItem('werwolfGame', JSON.stringify({
    playerData,
    currentPlayerIndex
  }));

  document.getElementById('roleSetup').classList.add('hidden');
  document.getElementById('roleReveal').classList.remove('hidden');
  currentPlayerIndex = 0;
  updatePlayerReveal();
}

function updatePlayerReveal() {
  document.getElementById('roleText').classList.add('hidden');
  document.getElementById('nextPlayerButton').classList.add('hidden');
  document.getElementById('currentPlayerNumber').textContent = playerData[currentPlayerIndex].name;
}

function showRole() {
  const currentPlayer = playerData[currentPlayerIndex];
  const role = currentPlayer.role;

  const roleText = document.getElementById('roleText');
  const roleImage = document.createElement('img'); // Neues Bild-Element
  roleImage.style.maxWidth = "80%"; // Größe des Bildes anpassen
  roleImage.style.marginTop = "20px";

  // Bildpfad basierend auf der Rolle
  if (role === "Werwolf") {
    const randomWolfIndex = Math.floor(Math.random() * 3) + 1; // Zufällige Auswahl (z. B. Werwolf1.png, Werwolf2.png)
    roleImage.src = `images/roles/Werwolf${randomWolfIndex}.png`;
  } else {
    roleImage.src = `images/roles/${role}.png`; // Bild basierend auf der Rolle
  }

  roleText.textContent = `Deine Rolle: ${role}`;
  roleText.classList.remove('hidden');
  roleText.appendChild(roleImage); // Bild hinzufügen

  document.getElementById('nextPlayerButton').classList.remove('hidden');
}

function nextPlayer() {
  currentPlayerIndex++;
  if (currentPlayerIndex >= playerData.length) {
    document.getElementById('roleReveal').classList.add('hidden');
    document.getElementById('narratorMode').classList.remove('hidden');
    showNarratorView();
  } else {
    updatePlayerReveal();
  }

  localStorage.setItem('werwolfGame', JSON.stringify({
    playerData,
    currentPlayerIndex
  }));
}

function showNarratorView() {
  const container = document.getElementById('playerList');
  container.innerHTML = '';

  // Bürgermeister anzeigen, falls gewählt
  if (mayor) {
    const mayorDisplay = document.createElement('p');
    mayorDisplay.textContent = `Bürgermeister: ${mayor}`;
    mayorDisplay.style.fontWeight = "bold";
    mayorDisplay.style.marginBottom = "10px";
    container.appendChild(mayorDisplay);
  }

  playerData.forEach((player, index) => {
    const btn = document.createElement('button');
    btn.textContent = player.name;
    btn.style.margin = "10px";

    // Spieler ausgrauen, wenn sie tot sind
    if (deadPlayers.includes(player.name)) {
      btn.style.backgroundColor = "gray";
      btn.style.color = "white";
      btn.style.cursor = "not-allowed";
      btn.disabled = true; // Button deaktivieren
    } else {
      btn.onclick = () => alert(`${player.name} ist ${player.role}`);
    }

    container.appendChild(btn);
  });

  const mayorButton = document.createElement('button');
  mayorButton.textContent = "Bürgermeister wählen";
  mayorButton.onclick = showMayorOverlay;
  container.appendChild(document.createElement("br"));
  container.appendChild(mayorButton);

  const accuseButton = document.createElement('button');
  accuseButton.textContent = "Spieler anklagen";
  accuseButton.onclick = showAccuseOverlay;
  container.appendChild(document.createElement("br"));
  container.appendChild(accuseButton);

  const accusedButton = document.createElement('button');
  accusedButton.textContent = "Angeklagte anzeigen";
  accusedButton.onclick = showAccusedOverlay;
  container.appendChild(document.createElement("br"));
  container.appendChild(accusedButton);

  const deadPlayersButton = document.createElement('button');
  deadPlayersButton.textContent = "Tote Spieler anzeigen";
  deadPlayersButton.onclick = showDeadPlayers;
  container.appendChild(document.createElement("br"));
  container.appendChild(deadPlayersButton);

  const nightButton = document.createElement('button');
  nightButton.textContent = "Nacht starten";
  nightButton.onclick = startNight;
  container.appendChild(document.createElement("br"));
  container.appendChild(nightButton);
}

function showDeadPlayers() {
  if (deadPlayers.length === 0) {
    alert("Es gibt keine toten Spieler.");
  } else {
    const deadPlayerNames = playerData
      .filter(player => deadPlayers.includes(player.name))
      .map(player => `${player.name} (${player.role})`);
    alert(`Tote Spieler:\n${deadPlayerNames.join("\n")}`);
  }
}

function showLovers() {
  if (lovers.length === 0) {
    alert("Es gibt keine Verliebten.");
  } else {
    alert(`Verliebte: ${lovers.map(player => player.name).join(", ")}`);
  }
}

function startNight() {
  // Nur Rollen lebender Spieler berücksichtigen
  const rolesInGame = playerData
    .filter(p => !deadPlayers.includes(p.name))
    .map(p => p.role);
  const uniqueRoles = new Set(rolesInGame);

  filteredPhases = fullPhases.filter(phase => {
    return phase.role === null || uniqueRoles.has(phase.role);
  });

  currentPhaseIndex = 0;
  document.getElementById('narratorMode').classList.add('hidden');
  document.getElementById('nightPhase').classList.remove('hidden');
  updateNightText();
}

function updateNightText() {
  const phase = filteredPhases[currentPhaseIndex];

  // Überspringe die Armor-Phase nach der ersten Nacht
  if (phase.role === "Armor" && currentNight > 1) {
    nextNightPhase();
    return;
  }

  // Überspringe Phasen für ausgeschiedene Spieler
  if (deadPlayers.includes(phase.role)) {
    nextNightPhase();
    return;
  }

  document.getElementById('nightText').textContent = phase.text;

  // Falls die Phase eine Aktion hat, führe sie aus
  if (phase.action) {
    phase.action();
  }
}

function nextNightPhase() {
  currentPhaseIndex++;
  if (currentPhaseIndex >= filteredPhases.length) {
    document.getElementById('nightPhase').classList.add('hidden');
    document.getElementById('narratorMode').classList.remove('hidden');
    currentNight++;

    localStorage.setItem('werwolfGame', JSON.stringify({
      playerData,
      currentPlayerIndex,
      lovers,
      currentNight,
      deadPlayers
    }));

    processNightActions(); // Verarbeite alle Nachtaktionen
    showNightSummary(); // Zeige Zusammenfassung der Nacht
  } else {
    updateNightText();
  }
}

// Overlay für Armor
function showArmorOverlay() {
  const overlay = document.createElement('div');
  overlay.id = "armorOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const title = document.createElement('h2');
  title.textContent = "Armor wählt zwei Verliebte aus";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => selectLover(player, overlay);
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

function selectLover(player, overlay) {
  if (lovers.length >= 2) {
    alert("Es können nur zwei Verliebte ausgewählt werden.");
    return;
  }

  lovers.push(player);

  if (lovers.length === 2) {
    alert(`Verliebte: ${lovers.map(p => p.name).join(", ")}`);
    localStorage.setItem('werwolfGame', JSON.stringify({
      playerData,
      currentPlayerIndex,
      lovers,
      currentNight,
      deadPlayers
    }));
    document.body.removeChild(overlay);
    nextNightPhase(); // Weiter zur nächsten Nachtphase
  }
}

// Overlay für Werwölfe
function showWerewolfOverlay() {
  const overlay = document.createElement('div');
  overlay.id = "werewolfOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const title = document.createElement('h2');
  title.textContent = "Werwölfe wählen einen Spieler aus, der stirbt";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => killPlayer(player, overlay);
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

// Overlay für Heiler
function showHealerOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Heiler wählt einen Spieler, der heute Nacht geschützt wird";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        healerProtected = player.name;
        alert(`${player.name} wird heute Nacht vom Heiler geschützt!`);
        document.body.removeChild(overlay);
        nextNightPhase();
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

// Overlay für Priester
function showPriestOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Priester wählt einen Spieler zur Segnung oder tut nichts";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        if (player.role === "Werwolf") {
          // Werwolf stirbt, Priester wird Dorfbewohner
          deadPlayers.push(player.name);
          alert(`${player.name} war ein Werwolf und wurde durch die Segnung getötet!`);
          const priest = playerData.find(p => p.role === "Priest");
          if (priest) priest.role = "Dorfbewohner";
        } else {
          // Priester stirbt
          const priest = playerData.find(p => p.role === "Priest");
          if (priest) {
            deadPlayers.push(priest.name);
            alert(`${priest.name} war der Priester und ist gestorben, da ${player.name} kein Werwolf war.`);
          }
        }
        priestUsed = true; // Priester kann nur einmal segnen
        document.body.removeChild(overlay);
        nextNightPhase();
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);

  // "Nichts tun"-Button hinzufügen
  const skipButton = document.createElement('button');
  skipButton.textContent = "Nichts tun";
  skipButton.style.marginTop = "20px";
  skipButton.onclick = () => {
    alert("Der Priester hat sich entschieden, nichts zu tun.");
    priestUsed = true; // Priester hat seine Phase abgeschlossen
    document.body.removeChild(overlay);
    nextNightPhase();
  };
  overlay.appendChild(skipButton);

  document.body.appendChild(overlay);
}

// Wenn der Spieler vom Heiler geschützt ist, stirbt er nicht
function killPlayer(player, overlay) {
  console.log(`Angriff auf: ${player.name}`);
  nightActions.push({ type: "attack", target: player.name });
  alert(`${player.name} wurde von den Werwölfen angegriffen.`);
  document.body.removeChild(overlay);
  nextNightPhase();
}

// Integration der Heiler-Phase in die Nachtphasen
const fullPhases = [
  { role: null, text: "Alle schlafen ein" },
  { role: "Armor", text: "Armor erwacht", action: () => { if (currentNight === 1) showArmorOverlay(); } },
  { role: "Heiler", text: "Heiler erwacht", action: showHealerOverlay },
  { role: "Priest", text: "Priester erwacht", action: () => { if (!priestUsed) showPriestOverlay(); } },
  { role: "Leibwächter", text: "Leibwächter erwacht", action: showBodyguardOverlay },
  { role: "Dorfmatratze", text: "Dorfmatratze erwacht", action: showMattressOverlay },
  { role: "Seher", text: "Seherin erwacht", action: showSeerOverlay },
  { role: "Werwolf", text: "Werwölfe erwachen", action: showWerewolfOverlay },
  { role: "Hexe", text: "Hexe erwacht", action: showWitchOverlay }
];
// Overlay für Seherin
function showSeerOverlay() {
  const overlay = document.createElement('div');
  overlay.id = "seerOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Seherin wählt einen Spieler zur Offenbarung";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        alert(`${player.name} ist ${player.role}`);
        document.body.removeChild(overlay);
        nextNightPhase();
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

let currentPhaseIndex = 0;
let filteredPhases = [];
function showWitchOverlay() {
  const lastKilled = nightActions.find(action => action.type === "attack")?.target || null;
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const message = document.createElement('p');
  message.textContent = lastKilled ? `Opfer der Werwölfe: ${lastKilled}` : "Diese Nacht wurde niemand angegriffen.";
  overlay.appendChild(message);

  if (!witchHealUsed && lastKilled) {
    const healButton = document.createElement('button');
    healButton.textContent = `Heile ${lastKilled}`;
    healButton.style.margin = "10px";
    healButton.onclick = () => {
      nightActions.push({ type: "heal", target: lastKilled });
      witchHealUsed = true;
      alert(`${lastKilled} wird von der Hexe geheilt.`);
      document.body.removeChild(overlay);
      nextNightPhase();
    };
    overlay.appendChild(healButton);
  }

  if (!witchKillUsed) {
    const killTitle = document.createElement('p');
    killTitle.textContent = "Optional: Einen Spieler töten";
    overlay.appendChild(killTitle);

    const playerButtons = document.createElement('div');
    playerButtons.style.display = "flex";
    playerButtons.style.flexWrap = "wrap";
    playerButtons.style.justifyContent = "center";

    playerData.forEach(player => {
      if (!deadPlayers.includes(player.name)) {
        const btn = document.createElement('button');
        btn.textContent = player.name;
        btn.style.margin = "10px";
        btn.onclick = () => {
          nightActions.push({ type: "kill", target: player.name });
          witchKillUsed = true;
          alert(`${player.name} wird von der Hexe getötet.`);
          document.body.removeChild(overlay);
          nextNightPhase();
        };
        playerButtons.appendChild(btn);
      }
    });

    overlay.appendChild(playerButtons);
  }

  const skipBtn = document.createElement('button');
  skipBtn.textContent = "Nichts tun";
  skipBtn.style.margin = "10px";
  skipBtn.onclick = () => {
    document.body.removeChild(overlay);
    nextNightPhase();
  };
  overlay.appendChild(skipBtn);

  document.body.appendChild(overlay);
}
function showMattressOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Dorfmatratze wählt einen Spieler für die Nacht";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        protectedByMattress = player.name;
        alert(`Dorfmatratze schläft diese Nacht bei ${player.name}`);
        document.body.removeChild(overlay);
        nextNightPhase();
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

// Overlay für Leibwächter
function showBodyguardOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Leibwächter wählt einen Spieler zum Schutz";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        bodyguardProtected = player.name; // Leibwächter schützt Spieler
        alert(`${player.name} wird vom Leibwächter geschützt.`);
        document.body.removeChild(overlay);
        nextNightPhase();
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

// Overlay für Anklage
function showAccuseOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Wähle einen Spieler, der angeklagt werden soll";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        accusedPlayers[player.name] = 0; // Spieler wird angeklagt
        alert(`${player.name} wurde angeklagt!`);
        document.body.removeChild(overlay);
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

// Overlay für Angeklagte
function showAccusedOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Angeklagte Spieler und Stimmen";
  overlay.appendChild(title);

  const accusedList = document.createElement('div');
  accusedList.style.display = "flex";
  accusedList.style.flexDirection = "column";
  accusedList.style.alignItems = "center";

  Object.keys(accusedPlayers).forEach(playerName => {
    const accusedItem = document.createElement('div');
    accusedItem.style.margin = "10px";

    const accusedText = document.createElement('span');
    accusedText.textContent = `${playerName}: ${accusedPlayers[playerName]} Stimmen`;
    accusedItem.appendChild(accusedText);

    const voteInput = document.createElement('input');
    voteInput.type = "number";
    voteInput.min = "0";
    voteInput.style.marginLeft = "10px";
    voteInput.onchange = () => {
      accusedPlayers[playerName] = parseInt(voteInput.value) || 0;
    };
    accusedItem.appendChild(voteInput);

    accusedList.appendChild(accusedItem);
  });

  overlay.appendChild(accusedList);

  const endTribunalButton = document.createElement('button');
  endTribunalButton.textContent = "Tribunal beenden";
  endTribunalButton.style.marginTop = "20px";
  endTribunalButton.onclick = () => {
    endTribunal(overlay);
  };
  overlay.appendChild(endTribunalButton);

  const backButton = document.createElement('button');
  backButton.textContent = "Zurück";
  backButton.style.marginTop = "10px";
  backButton.onclick = () => {
    document.body.removeChild(overlay);
  };
  overlay.appendChild(backButton);

  document.body.appendChild(overlay);
}

function endTribunal(overlay) {
  const sortedPlayers = Object.entries(accusedPlayers).sort((a, b) => b[1] - a[1]);
  const [mostVotedPlayer, votes] = sortedPlayers[0];

  if (votes > 0) {
    deadPlayers.push(mostVotedPlayer);
    const playerRole = playerData.find(player => player.name === mostVotedPlayer).role;
    alert(`${mostVotedPlayer} wurde hingerichtet und war ${playerRole}.`);

    // Überprüfe, ob einer der Verliebten gestorben ist
    checkWinConditions();
  } else {
    alert("Kein Spieler wurde hingerichtet.");
  }

  accusedPlayers = {}; // Zurücksetzen der Anklagen
  document.body.removeChild(overlay);

  checkWinConditions(); // Siegbedingungen überprüfen
}

// Overlay für Bürgermeister
function showMayorOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Wähle einen Bürgermeister";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        mayor = player.name; // Bürgermeister wird gewählt
        alert(`${player.name} wurde zum Bürgermeister gewählt!`);
        document.body.removeChild(overlay);
        updateNarratorView(); // Aktualisiere das Hauptmenü
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

function checkWinConditions() {
  const livingPlayers = playerData.filter(player => !deadPlayers.includes(player.name));
  const livingRoles = livingPlayers.map(player => player.role);

  const werewolvesAlive = livingRoles.filter(role => role === "Werwolf").length;
  const villagersAlive = livingRoles.filter(role => role !== "Werwolf").length;
  const loversAlive = livingPlayers.filter(player => lovers.includes(player)).length;

  // Wenn einer der Verliebten stirbt, stirbt auch der andere
  lovers.forEach(lover => {
    if (deadPlayers.includes(lover.name)) {
      lovers.forEach(otherLover => {
        if (!deadPlayers.includes(otherLover.name)) {
          deadPlayers.push(otherLover.name);
          alert(`${otherLover.name} ist gestorben, da ${lover.name} gestorben ist.`);
        }
      });
    }
  });

  // Siegbedingungen
  if (werewolvesAlive === 0) {
    alert("Das Dorf hat gewonnen! Alle Werwölfe sind tot.");
    endGame();
  } else if (villagersAlive === 0 && werewolvesAlive > 0) {
    alert("Die Werwölfe haben gewonnen! Es leben nur noch Werwölfe.");
    endGame();
  } else if (loversAlive === livingPlayers.length) {
    alert("Die Verliebten haben gewonnen! Sie sind die einzigen Überlebenden.");
    endGame();
  }
}

function endGame() {
  alert("Das Spiel ist beendet.");
  // Optional: Spiel zurücksetzen oder zur Startseite navigieren
  resetGame();
}

function showNightSummary() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Zusammenfassung der Nacht";
  overlay.appendChild(title);

  const deadPlayerNames = playerData
    .filter(player => deadPlayers.includes(player.name))
    .map(player => `${player.name} (${player.role})`);

  const summaryText = document.createElement('p');
  summaryText.textContent = deadPlayerNames.length > 0
    ? `Gestorbene Spieler:\n${deadPlayerNames.join("\n")}`
    : "Diese Nacht ist niemand gestorben.";
  summaryText.style.textAlign = "center";
  overlay.appendChild(summaryText);

  const closeButton = document.createElement('button');
  closeButton.textContent = "Weiter";
  closeButton.style.marginTop = "20px";
  closeButton.onclick = () => {
    document.body.removeChild(overlay);
  };
  overlay.appendChild(closeButton);

  document.body.appendChild(overlay);
}

function showHunterOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const title = document.createElement('h2');
  title.textContent = "Der Jäger wählt einen Spieler, der stirbt";
  overlay.appendChild(title);

  const playerButtons = document.createElement('div');
  playerButtons.style.display = "flex";
  playerButtons.style.flexWrap = "wrap";
  playerButtons.style.justifyContent = "center";

  playerData.forEach(player => {
    if (!deadPlayers.includes(player.name)) {
      const btn = document.createElement('button');
      btn.textContent = player.name;
      btn.style.margin = "10px";
      btn.onclick = () => {
        deadPlayers.push(player.name);
        alert(`${player.name} wurde vom Jäger getötet.`);
        document.body.removeChild(overlay);
        checkWinConditions(); // Überprüfe Siegbedingungen
      };
      playerButtons.appendChild(btn);
    }
  });

  overlay.appendChild(playerButtons);
  document.body.appendChild(overlay);
}

function processNightActions() {
  const healedPlayers = nightActions
    .filter(action => action.type === "heal")
    .map(action => action.target);

  const killedPlayers = nightActions
    .filter(action => action.type === "attack" || action.type === "kill")
    .map(action => action.target)
    .filter(player => !healedPlayers.includes(player)); // Spieler, die geheilt wurden, sterben nicht

  killedPlayers.forEach(player => {
    if (player === bodyguardProtected) {
      const bodyguard = playerData.find(p => p.role === "Leibwächter" && !deadPlayers.includes(p.name));
      if (bodyguard) {
        if (bodyguardHealth > 0) {
          bodyguardHealth--;
          alert(`${bodyguard.name} hat den Angriff abgewehrt, aber ist jetzt verwundbar!`);
        } else {
          deadPlayers.push(bodyguard.name);
          alert(`${bodyguard.name} wurde getötet, da er erneut angegriffen wurde.`);
        }
      }
    } else {
      deadPlayers.push(player);
      alert(`${player} ist gestorben.`);
    }
  });

  // Überprüfe Verliebte
  lovers.forEach(lover => {
    if (deadPlayers.includes(lover.name)) {
      lovers.forEach(otherLover => {
        if (!deadPlayers.includes(otherLover.name)) {
          deadPlayers.push(otherLover.name);
          alert(`${otherLover.name} ist gestorben, da ${lover.name} gestorben ist.`);
        }
      });
    }
  });

  nightActions = []; // Aktionen zurücksetzen
  checkWinConditions(); // Siegbedingungen überprüfen
}