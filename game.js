// ============================================
// GANESHA'S MODAK RUSH
// Contest Edition
// ============================================


// ============================================
// CANVAS
// ============================================

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const pauseButton = document.getElementById("pauseButton");

const pauseScreen = document.getElementById("pauseScreen");

const resumeButton = document.getElementById("resumeButton");

const continueButton = document.getElementById("continueButton");

const exitButton = document.getElementById("exitButton");

const exitConfirm = document.getElementById("exitConfirm");

const confirmExit = document.getElementById("confirmExit");

const cancelExit = document.getElementById("cancelExit");

canvas.width = 1000;
canvas.height = 620;

function resizeGameCanvas() {
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const maxWidth = Math.min(wrapper.clientWidth || 1000, 1000);
    const scale = maxWidth / 1000;
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${620 * scale}px`;
}
window.addEventListener("resize", resizeGameCanvas);
window.addEventListener("orientationchange", resizeGameCanvas);
setTimeout(resizeGameCanvas, 0);


// ============================================
// UI
// ============================================

const scoreEl =
    document.getElementById("score");

const livesEl =
    document.getElementById("lives");

const comboEl =
    document.getElementById("combo");

const timerEl =
    document.getElementById("timer");

const highScoreEl =
    document.getElementById("highScore");

const startScreen =
    document.getElementById("startScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const startButton =
    document.getElementById("startButton");

const restartButton =
    document.getElementById("restartButton");

const finalScoreEl =
    document.getElementById("finalScore");

const resultTitle =
    document.getElementById("resultTitle");

const resultSubtitle =
    document.getElementById("resultSubtitle");

const resultIcon =
    document.getElementById("resultIcon");

const newRecord =
    document.getElementById("newRecord");

const blessingMode =
    document.getElementById("blessingMode");

const comboPopup =
    document.getElementById("comboPopup");

const playerNameInput = document.getElementById("playerName");
const leaderboardList = document.getElementById("leaderboardList");
const leaderboardStatus = document.getElementById("leaderboardStatus");
const refreshLeaderboardButton = document.getElementById("refreshLeaderboard");
const resultPlayer = document.getElementById("resultPlayer");
const viewLeaderboardButton = document.getElementById("viewLeaderboardButton");
const leaderboardOverlay = document.getElementById("leaderboardOverlay");
const leaderboardModalList = document.getElementById("leaderboardModalList");
const leaderboardModalStatus = document.getElementById("leaderboardModalStatus");
const closeLeaderboardButton = document.getElementById("closeLeaderboardButton");
const menuLeaderboardButton = document.getElementById("menuLeaderboardButton");


// ============================================
// SUPABASE ONLINE PROFILE + LEADERBOARD
// ============================================

let supabaseClient = null;
let supabaseUser = null;
let currentPlayerName = "";
let onlineHighScore = 0;

const LOCAL_PLAYER_NAME_KEY = "ganeshaPlayerName";
const LOCAL_HIGH_SCORE_KEY = "ganeshaHighScore";

function supabaseIsConfigured() {
    return Boolean(
        window.GANESHA_SUPABASE_URL &&
        window.GANESHA_SUPABASE_PUBLISHABLE_KEY &&
        !window.GANESHA_SUPABASE_URL.includes("YOUR_") &&
        !window.GANESHA_SUPABASE_PUBLISHABLE_KEY.includes("YOUR_")
    );
}

function setLeaderboardStatus(message) {
    if (leaderboardStatus) leaderboardStatus.textContent = message;
}

function getEnteredPlayerName() {
    return (playerNameInput?.value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 20);
}

function escapeLeaderboardName(name) {
    const div = document.createElement("div");
    div.textContent = name || "Player";
    return div.innerHTML;
}

async function initSupabase() {
    currentPlayerName = localStorage.getItem(LOCAL_PLAYER_NAME_KEY) || "";
    if (playerNameInput) playerNameInput.value = currentPlayerName;

    if (!supabaseIsConfigured() || !window.supabase?.createClient) {
        setLeaderboardStatus("Online leaderboard not configured yet.");
        return;
    }

    try {
        supabaseClient = window.supabase.createClient(
            window.GANESHA_SUPABASE_URL,
            window.GANESHA_SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        supabaseUser = data?.session?.user || null;

        if (!supabaseUser) {
            const result = await supabaseClient.auth.signInAnonymously();
            if (result.error) throw result.error;
            supabaseUser = result.data?.user || null;
        }

        if (supabaseUser) await loadOnlinePlayer();
        await loadLeaderboard();
    } catch (error) {
        console.warn("Supabase initialization failed:", error);
        setLeaderboardStatus("Offline mode — local high score is still available.");
    }
}

async function loadOnlinePlayer() {
    if (!supabaseClient || !supabaseUser) return;

    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("player_name, high_score")
        .eq("id", supabaseUser.id)
        .maybeSingle();

    if (error) {
        console.warn("Could not load player profile:", error);
        return;
    }

    if (data) {
        currentPlayerName = data.player_name || currentPlayerName;
        onlineHighScore = Number(data.high_score) || 0;

        if (playerNameInput && currentPlayerName) {
            playerNameInput.value = currentPlayerName;
        }

        highScore = Math.max(highScore, onlineHighScore);
        highScoreEl.textContent = highScore;
    }
}

async function loadLeaderboard() {
    if (!leaderboardList) return;

    if (!supabaseClient) {
        leaderboardList.innerHTML = "";
        setLeaderboardStatus("Connect Supabase to enable the online leaderboard.");
        return;
    }

    setLeaderboardStatus("Loading leaderboard…");

    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("player_name, high_score")
        .order("high_score", { ascending: false })
        .limit(10);

    if (error) {
        console.warn("Leaderboard load failed:", error);
        leaderboardList.innerHTML = "";
        setLeaderboardStatus("Leaderboard unavailable. Check Supabase setup.");
        return;
    }

    if (!data?.length) {
        leaderboardList.innerHTML =
            '<li class="leaderboard-empty">Be the first Modak Champion! 🪔</li>';
        setLeaderboardStatus("No scores yet.");
        return;
    }

    leaderboardList.innerHTML = data.map((entry, index) => `
        <li class="leaderboard-row">
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${escapeLeaderboardName(entry.player_name)}</span>
            <strong class="leaderboard-score">${Number(entry.high_score).toLocaleString()}</strong>
        </li>
    `).join("");

    setLeaderboardStatus("Live · scores are saved online");
}

async function isPlayerNameAvailable(name) {
    const safeName = (name || "").trim().replace(/\s+/g, " ").slice(0, 20);
    if (!safeName) return false;

    // If Supabase is not configured, allow local play. Online uniqueness is
    // enforced by Supabase when the leaderboard is connected.
    if (!supabaseClient || !supabaseUser) return true;

    try {
        const { data, error } = await supabaseClient.rpc(
            "is_player_name_available",
            { p_name: safeName }
        );

        if (error) {
            console.warn("Player-name availability check failed:", error);
            // Do not silently reject a player because of a temporary network/RPC error.
            // The database unique index remains the final authority.
            return true;
        }

        return data === true;
    } catch (error) {
        console.warn("Player-name availability check failed:", error);
        return true;
    }
}

async function saveOnlineHighScore(finalScore) {
    const safeName = getEnteredPlayerName() || currentPlayerName || "Modak Player";

    currentPlayerName = safeName;
    localStorage.setItem(LOCAL_PLAYER_NAME_KEY, safeName);

    if (!supabaseClient || !supabaseUser) {
        const oldLocal = Number(localStorage.getItem(LOCAL_HIGH_SCORE_KEY)) || 0;
        if (finalScore > oldLocal) {
            localStorage.setItem(LOCAL_HIGH_SCORE_KEY, String(finalScore));
        }
        return finalScore > highScore;
    }

    if (finalScore <= onlineHighScore) {
        const { error } = await supabaseClient
            .from("leaderboard")
            .update({
                player_name: safeName,
                updated_at: new Date().toISOString()
            })
            .eq("id", supabaseUser.id);

        if (error) console.warn("Player name update failed:", error);
        return false;
    }

    const { error } = await supabaseClient
        .from("leaderboard")
        .upsert({
            id: supabaseUser.id,
            player_name: safeName,
            high_score: finalScore,
            updated_at: new Date().toISOString()
        }, {
            onConflict: "id",
            ignoreDuplicates: false
        });

    if (error) {
        console.warn("Online high-score save failed:", error);
        if (error.code === "23505" || /duplicate|unique/i.test(error.message || "")) {
            setLeaderboardStatus("That player name is already taken. Choose another name.");
            return false;
        }
        return finalScore > highScore;
    }

    onlineHighScore = finalScore;
    highScore = Math.max(highScore, finalScore);
    highScoreEl.textContent = highScore;

    await loadLeaderboard();
    return true;
}


// ============================================
// LEADERBOARD MODAL
// ============================================

function setLeaderboardModalStatus(message) {
    if (leaderboardModalStatus) leaderboardModalStatus.textContent = message;
}

async function loadLeaderboardModal() {
    if (!leaderboardModalList) return;

    leaderboardModalList.innerHTML = "";

    if (!supabaseClient) {
        setLeaderboardModalStatus("Online leaderboard is not configured yet.");
        leaderboardModalList.innerHTML =
            '<li class="leaderboard-empty">Configure Supabase to show online scores.</li>';
        return;
    }

    setLeaderboardModalStatus("Loading leaderboard…");

    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("player_name, high_score")
        .order("high_score", { ascending: false })
        .limit(10);

    if (error) {
        console.warn("Leaderboard modal load failed:", error);
        setLeaderboardModalStatus("Could not load online scores. Check Supabase setup.");
        leaderboardModalList.innerHTML =
            '<li class="leaderboard-empty">Leaderboard unavailable right now.</li>';
        return;
    }

    if (!data?.length) {
        setLeaderboardModalStatus("No scores yet.");
        leaderboardModalList.innerHTML =
            '<li class="leaderboard-empty">Be the first Modak Champion! 🪔</li>';
        return;
    }

    leaderboardModalList.innerHTML = data.map((entry, index) => `
        <li class="leaderboard-row">
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${escapeLeaderboardName(entry.player_name)}</span>
            <strong class="leaderboard-score">${Number(entry.high_score).toLocaleString()}</strong>
        </li>
    `).join("");

    setLeaderboardModalStatus("Live · scores are saved online");
}

function openLeaderboardModal() {
    if (!leaderboardOverlay) return;

    // Hide every other screen so the modal is always on top.
    startScreen?.classList.add("hidden");
    pauseScreen?.classList.add("hidden");
    exitConfirm?.classList.add("hidden");
    gameOverScreen?.classList.add("hidden");

    leaderboardOverlay.classList.remove("hidden");
    leaderboardOverlay.setAttribute("aria-hidden", "false");

    loadLeaderboardModal();
}

function closeLeaderboardModal(returnToGameOver = true) {
    if (!leaderboardOverlay) return;

    leaderboardOverlay.classList.add("hidden");
    leaderboardOverlay.setAttribute("aria-hidden", "true");

    if (returnToGameOver) {
        gameOverScreen?.classList.remove("hidden");
    } else {
        startScreen?.classList.remove("hidden");
        loadLeaderboard();
    }
}


// ============================================
// GAME STATE
// ============================================

let score = 0;

let lives = 3;

let combo = 0;

let timeLeft = 60;

let gameRunning = false;
let gamePaused = false;

let lastTime = 0;

let spawnTimer = 0;

let difficulty = 1;
let currentRound = 1;
let currentLevel = "easy";
let roundTransitionActive = false;

let blessingActive = false;

let blessingTime = 0;

let screenShake = 0;

let objects = [];

let particles = [];

let floatingTexts = [];

let confetti = [];


// ============================================
// HIGH SCORE
// ============================================

let highScore =
    Number(
        localStorage.getItem(
            LOCAL_HIGH_SCORE_KEY
        )
    ) || 0;

highScoreEl.textContent =
    highScore;


// ============================================
// PLAYER
// ============================================

const player = {

    x: 450,

    y: 500,

    width: 100,

    height: 90,

    speed: 620,

    animation: 0,

    invincible: 0

};


// ============================================
// INPUT
// ============================================

const keys = {};


document.addEventListener(
    "keydown",
    event => {

        // Space toggles pause/resume.
        // Ignore key auto-repeat so one press = one toggle.
        if (event.code === "Space") {

            event.preventDefault();

            if (!event.repeat) {
                togglePause();
            }

            return;
        }

        keys[event.key] = true;

        if (
            [
                "ArrowLeft",
                "ArrowRight"
            ].includes(event.key)
        ) {
            event.preventDefault();
        }

    }
);


document.addEventListener(
    "keyup",
    event => {

        keys[event.key] = false;

    }
);


// ============================================
// MOBILE CONTROLS
// ============================================

const leftButton =
    document.getElementById(
        "leftButton"
    );

const rightButton =
    document.getElementById(
        "rightButton"
    );


function pressButton(key) {

    keys[key] = true;

}


function releaseButton(key) {

    keys[key] = false;

}


leftButton.addEventListener(
    "touchstart",
    e => {

        e.preventDefault();

        pressButton("ArrowLeft");

    }
);


leftButton.addEventListener(
    "touchend",
    e => {

        e.preventDefault();

        releaseButton("ArrowLeft");

    }
);


rightButton.addEventListener(
    "touchstart",
    e => {

        e.preventDefault();

        pressButton("ArrowRight");

    }
);


rightButton.addEventListener(
    "touchend",
    e => {

        e.preventDefault();

        releaseButton("ArrowRight");

    }
);


// ============================================
// SOUND ENGINE
// ============================================

let audioContext = null;


function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }

}


function playSound(
    frequency,
    duration = 0.1,
    type = "sine",
    volume = 0.08
) {

    if (!audioContext) {
        return;
    }


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type = type;

    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
        duration
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );

}


function playCollectSound(
    type
) {

    initAudio();


    if (type === "gold") {

        playSound(
            880,
            0.15,
            "sine",
            0.1
        );

        setTimeout(
            () =>
                playSound(
                    1320,
                    0.2,
                    "sine",
                    0.08
                ),
            80
        );

    }

    else if (type === "divine") {

        playSound(
            660,
            0.12,
            "triangle",
            0.08
        );

        setTimeout(
            () =>
                playSound(
                    990,
                    0.12,
                    "triangle",
                    0.08
                ),
            80
        );

        setTimeout(
            () =>
                playSound(
                    1320,
                    0.18,
                    "triangle",
                    0.08
                ),
            160
        );

    }

    else {

        playSound(
            520,
            0.08,
            "triangle",
            0.06
        );

    }

}


function playHitSound() {

    initAudio();

    playSound(
        120,
        0.25,
        "sawtooth",
        0.08
    );

}


function playBlessingSound() {

    initAudio();

    const notes =
        [
            523,
            659,
            784,
            1046
        ];


    notes.forEach(
        (note, index) => {

            setTimeout(
                () =>
                    playSound(
                        note,
                        0.25,
                        "sine",
                        0.07
                    ),
                index * 100
            );

        }
    );

}


// ============================================
// BACKGROUND
// ============================================

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );


    gradient.addColorStop(
        0,
        "#fff1b8"
    );

    gradient.addColorStop(
        0.45,
        "#ffc857"
    );

    gradient.addColorStop(
        1,
        "#e76f51"
    );


    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // ========================================
    // SUN
    // ========================================

    ctx.save();

    ctx.globalAlpha = 0.65;

    ctx.fillStyle = "#ffb703";

    ctx.beginPath();

    ctx.arc(
        830,
        105,
        58,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    // ========================================
    // CLOUDS
    // ========================================

    drawCloud(
        130,
        90,
        1
    );

    drawCloud(
        500,
        130,
        0.8
    );

    drawCloud(
        730,
        70,
        0.7
    );


    // ========================================
    // TEMPLE
    // ========================================

    drawTemple();


    // ========================================
    // FLOOR
    // ========================================

    ctx.fillStyle =
        "#743c1c";

    ctx.fillRect(
        0,
        555,
        canvas.width,
        65
    );


    // floor pattern

    for (
        let x = 0;
        x < canvas.width;
        x += 70
    ) {

        ctx.fillStyle =
            "rgba(255,183,3,0.35)";

        ctx.fillRect(
            x,
            555,
            35,
            4
        );

    }


    // ========================================
    // DIYAS
    // ========================================

    drawDiya(80, 540);

    drawDiya(920, 540);

    drawDiya(300, 570);

    drawDiya(700, 570);


    // ========================================
    // FLOWERS
    // ========================================

    drawFlower(
        50,
        515
    );

    drawFlower(
        950,
        515
    );

}


function drawCloud(
    x,
    y,
    scale
) {

    ctx.save();

    ctx.translate(x, y);

    ctx.scale(
        scale,
        scale
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.5)";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.arc(
        30,
        -10,
        34,
        0,
        Math.PI * 2
    );

    ctx.arc(
        62,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}


function drawTemple() {

    ctx.save();

    ctx.fillStyle =
        "rgba(110,55,20,0.25)";


    // Main temple

    ctx.fillRect(
        360,
        370,
        280,
        185
    );


    // Main dome

    ctx.beginPath();

    ctx.arc(
        500,
        370,
        115,
        Math.PI,
        0
    );

    ctx.fill();


    // Side domes

    ctx.beginPath();

    ctx.arc(
        385,
        410,
        65,
        Math.PI,
        0
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        615,
        410,
        65,
        Math.PI,
        0
    );

    ctx.fill();


    // Door

    ctx.fillStyle =
        "rgba(70,30,10,0.4)";

    ctx.fillRect(
        455,
        450,
        90,
        105
    );


    // Flag

    ctx.fillRect(
        497,
        215,
        6,
        100
    );


    ctx.fillStyle =
        "#c1121f";

    ctx.beginPath();

    ctx.moveTo(
        503,
        215
    );

    ctx.lineTo(
        565,
        240
    );

    ctx.lineTo(
        503,
        260
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();

}


function drawDiya(
    x,
    y
) {

    ctx.save();

    ctx.translate(x, y);


    // Glow

    ctx.globalAlpha =
        0.35;

    ctx.fillStyle =
        "#ffb703";

    ctx.beginPath();

    ctx.arc(
        0,
        -10,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.globalAlpha = 1;


    // Flame

    ctx.fillStyle =
        "#ffb703";

    ctx.beginPath();

    ctx.moveTo(
        0,
        -28
    );

    ctx.quadraticCurveTo(
        12,
        -10,
        0,
        0
    );

    ctx.quadraticCurveTo(
        -12,
        -10,
        0,
        -28
    );

    ctx.fill();


    // Bowl

    ctx.fillStyle =
        "#9d3b00";

    ctx.beginPath();

    ctx.ellipse(
        0,
        4,
        24,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


function drawFlower(
    x,
    y
) {

    ctx.save();

    ctx.translate(x, y);

    ctx.fillStyle =
        "#d62828";


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const angle =
            i *
            Math.PI /
            3;

        ctx.beginPath();

        ctx.arc(
            Math.cos(angle) * 9,
            Math.sin(angle) * 9,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    ctx.fillStyle =
        "#ffb703";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}


// ============================================
// GANESHA
// ============================================

function drawPlayer() {

    player.animation +=
        0.08;


    const bob =
        Math.sin(
            player.animation
        ) * 5;


    const blink =
        Math.sin(
            player.animation * 0.7
        );


    ctx.save();


    ctx.translate(
        player.x +
        player.width / 2,

        player.y +
        player.height / 2 +
        bob
    );


    // ========================================
    // BLESSING AURA
    // ========================================

    if (blessingActive) {

        const pulse =
            60 +
            Math.sin(
                player.animation * 2
            ) * 8;


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(255,215,0,0.18)";

        ctx.fill();


        ctx.strokeStyle =
            "rgba(255,183,3,0.7)";

        ctx.lineWidth = 3;

        ctx.stroke();

    }


    // ========================================
    // EARS
    // ========================================

    ctx.fillStyle =
        "#df7657";


    ctx.beginPath();

    ctx.ellipse(
        -43,
        -5,
        26,
        38,
        -0.15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.ellipse(
        43,
        -5,
        26,
        38,
        0.15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // ========================================
    // BODY
    // ========================================

    ctx.beginPath();

    ctx.ellipse(
        0,
        55,
        48,
        32,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#e76f51";

    ctx.fill();


    // ========================================
    // HEAD
    // ========================================

    ctx.beginPath();

    ctx.arc(
        0,
        -12,
        43,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#f4a261";

    ctx.fill();


    // ========================================
    // CROWN
    // ========================================

    ctx.fillStyle =
        "#ffb703";


    ctx.beginPath();

    ctx.moveTo(
        -35,
        -45
    );

    ctx.lineTo(
        -20,
        -67
    );

    ctx.lineTo(
        0,
        -82
    );

    ctx.lineTo(
        20,
        -67
    );

    ctx.lineTo(
        35,
        -45
    );

    ctx.closePath();

    ctx.fill();


    ctx.strokeStyle =
        "#9d5c00";

    ctx.lineWidth = 2;

    ctx.stroke();


    // Crown jewel

    ctx.fillStyle =
        "#c1121f";

    ctx.beginPath();

    ctx.arc(
        0,
        -65,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // ========================================
    // EYES
    // ========================================

    ctx.fillStyle =
        "#30180b";


    ctx.beginPath();

    ctx.arc(
        -15,
        -16,
        4,
        0,
        Math.PI * 2
    );

    ctx.arc(
        15,
        -16,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // ========================================
    // TILAK
    // ========================================

    ctx.fillStyle =
        "#c1121f";

    ctx.fillRect(
        -3,
        -29,
        6,
        12
    );


    // ========================================
    // TRUNK
    // ========================================

    const trunkMove =
        Math.sin(
            player.animation
        ) * 3;


    ctx.beginPath();

    ctx.moveTo(
        0,
        0
    );

    ctx.quadraticCurveTo(
        -8,
        20,
        8 + trunkMove,
        34
    );

    ctx.quadraticCurveTo(
        22 + trunkMove,
        45,
        29 + trunkMove,
        31
    );


    ctx.strokeStyle =
        "#df7657";

    ctx.lineWidth = 13;

    ctx.lineCap = "round";

    ctx.stroke();


    // ========================================
    // JEWELRY
    // ========================================

    ctx.fillStyle =
        "#ffb703";


    ctx.beginPath();

    ctx.arc(
        -26,
        50,
        5,
        0,
        Math.PI * 2
    );

    ctx.arc(
        26,
        50,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


// ============================================
// CREATE OBJECT
// ============================================

function createObject() {

    const random =
        Math.random();


    let type;


    if (random < 0.14) {

        type = "obstacle";

    }

    else if (random < 0.20) {

        type = "fire";

    }

    else if (random < 0.25) {

        type = "spinner";

    }

    else if (random < 0.30) {

        type = "log";

    }

    else if (random < 0.35) {

        type = "gold";

    }

    else if (random < 0.39) {

        type = "divine";

    }

    else {

        type = "modak";

    }


    objects.push({

        x:
            35 +
            Math.random() *
            (canvas.width - 70),

        y: -60,

        size:
            type === "spinner"
                ? 40
                : type === "log"
                    ? 42
                    : 38,

        speed:
            (
                175 +
                Math.random() * 150
            ) *
            difficulty,

        type: type,

        rotation:
            Math.random() *
            Math.PI * 2

    });

}


// ============================================
// DRAW OBJECT
// ============================================

function drawObject(
    object
) {

    ctx.save();

    ctx.translate(
        object.x,
        object.y
    );


    object.rotation +=
        0.025;


    ctx.rotate(
        object.rotation
    );


    if (
        object.type ===
        "modak"
    ) {

        drawModak();

    }

    else if (
        object.type ===
        "gold"
    ) {

        drawGoldenModak();

    }

    else if (
        object.type ===
        "divine"
    ) {

        drawDivineModak();

    }

    else if (
        object.type ===
        "obstacle"
    ) {

        drawRock();

    }

    else if (
        object.type ===
        "fire"
    ) {

        drawFirePot();

    }

    else if (
        object.type ===
        "log"
    ) {

        drawLog();

    }

    else {

        drawSpinner();

    }


    ctx.restore();

}


// ============================================
// NORMAL MODAK
// ============================================

function drawModak() {

    ctx.fillStyle =
        "#fff1b8";

    ctx.strokeStyle =
        "#b66a20";

    ctx.lineWidth = 2;


    ctx.beginPath();

    ctx.moveTo(
        0,
        -24
    );


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const angle =
            -Math.PI / 2 +
            i *
            Math.PI / 5;

        ctx.lineTo(
            Math.cos(angle) * 23,
            Math.sin(angle) * 23
        );

    }


    ctx.lineTo(
        0,
        24
    );

    ctx.closePath();

    ctx.fill();

    ctx.stroke();


    ctx.fillStyle =
        "#d97706";

    ctx.beginPath();

    ctx.arc(
        0,
        -22,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ============================================
// GOLDEN MODAK
// ============================================

function drawGoldenModak() {

    ctx.shadowBlur = 18;

    ctx.shadowColor =
        "#fff000";


    ctx.fillStyle =
        "#ffd700";


    ctx.beginPath();

    ctx.moveTo(
        0,
        -25
    );

    ctx.lineTo(
        25,
        10
    );

    ctx.lineTo(
        0,
        25
    );

    ctx.lineTo(
        -25,
        10
    );

    ctx.closePath();

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#fff";

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "★",
        0,
        7
    );

}


// ============================================
// DIVINE MODAK
// ============================================

function drawDivineModak() {

    ctx.shadowBlur = 25;

    ctx.shadowColor =
        "#fff5a0";


    ctx.fillStyle =
        "#fff7c2";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.strokeStyle =
        "#ffb703";

    ctx.lineWidth = 3;

    ctx.stroke();


    ctx.fillStyle =
        "#e85d04";

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "ॐ",
        0,
        7
    );

}


// ============================================
// ROCK
// ============================================

function drawRock() {

    ctx.fillStyle =
        "#5a4635";


    ctx.beginPath();

    ctx.moveTo(
        -25,
        15
    );

    ctx.lineTo(
        -17,
        -17
    );

    ctx.lineTo(
        5,
        -27
    );

    ctx.lineTo(
        27,
        -5
    );

    ctx.lineTo(
        18,
        22
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#3d3025";


    ctx.beginPath();

    ctx.arc(
        -8,
        -5,
        4,
        0,
        Math.PI * 2
    );

    ctx.arc(
        9,
        8,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ============================================
// FIRE POT
// ============================================

function drawFirePot() {

    ctx.fillStyle =
        "#7b341e";


    ctx.beginPath();

    ctx.ellipse(
        0,
        12,
        24,
        17,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#ffb703";


    ctx.beginPath();

    ctx.moveTo(
        0,
        -30
    );

    ctx.quadraticCurveTo(
        20,
        -10,
        0,
        5
    );

    ctx.quadraticCurveTo(
        -18,
        -10,
        0,
        -30
    );

    ctx.fill();


    ctx.fillStyle =
        "#e85d04";

    ctx.beginPath();

    ctx.arc(
        0,
        7,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ============================================
// SPINNER
// ============================================

function drawSpinner() {

    ctx.strokeStyle =
        "#c1121f";

    ctx.lineWidth = 8;

    ctx.beginPath();

    ctx.moveTo(
        -25,
        -25
    );

    ctx.lineTo(
        25,
        25
    );

    ctx.moveTo(
        25,
        -25
    );

    ctx.lineTo(
        -25,
        25
    );

    ctx.stroke();


    ctx.fillStyle =
        "#ffb703";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ============================================
// FALLING LOG
// ============================================

function drawLog() {

    ctx.fillStyle =
        "#7b4b2a";

    ctx.fillRect(
        -32,
        -13,
        64,
        26
    );

    ctx.strokeStyle =
        "#4e2d1b";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        -32,
        -13,
        64,
        26
    );

    ctx.beginPath();

    ctx.arc(
        32,
        0,
        10,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        -22,
        -8
    );

    ctx.lineTo(
        20,
        -8
    );

    ctx.moveTo(
        -22,
        8
    );

    ctx.lineTo(
        20,
        8
    );

    ctx.stroke();

}


// ============================================
// COLLISION
// ============================================

function collision(
    player,
    object
) {

    const px =
        player.x +
        player.width / 2;

    const py =
        player.y +
        player.height / 2;


    const dx =
        px -
        object.x;

    const dy =
        py -
        object.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    return (
        distance <
        55
    );

}


// ============================================
// PARTICLES
// ============================================

function createParticles(
    x,
    y,
    type = "gold"
) {

    for (
        let i = 0;
        i < 16;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            vx:
                (
                    Math.random()
                    - 0.5
                ) * 350,

            vy:
                (
                    Math.random()
                    - 0.5
                ) * 350,

            life: 1,

            size:
                2 +
                Math.random() * 5,

            type: type

        });

    }

}


function updateParticles(
    delta
) {

    particles.forEach(
        particle => {

            particle.x +=
                particle.vx *
                delta;

            particle.y +=
                particle.vy *
                delta;

            particle.vy +=
                300 *
                delta;

            particle.life -=
                delta * 2;

        }
    );


    particles =
        particles.filter(
            p =>
                p.life > 0
        );

}


function drawParticles() {

    particles.forEach(
        particle => {

            ctx.globalAlpha =
                particle.life;


            ctx.fillStyle =
                particle.type ===
                "hit"
                    ? "#c1121f"
                    : "#ffb703";


            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    ctx.globalAlpha = 1;

}


// ============================================
// FLOATING TEXT
// ============================================

function addFloatingText(
    x,
    y,
    text
) {

    floatingTexts.push({

        x: x,

        y: y,

        text: text,

        life: 1

    });

}


function updateFloatingTexts(
    delta
) {

    floatingTexts.forEach(
        item => {

            item.y -=
                50 *
                delta;

            item.life -=
                delta;

        }
    );


    floatingTexts =
        floatingTexts.filter(
            item =>
                item.life > 0
        );

}


function drawFloatingTexts() {

    floatingTexts.forEach(
        item => {

            ctx.globalAlpha =
                item.life;

            ctx.fillStyle =
                "#ffffff";

            ctx.font =
                "bold 24px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                item.text,
                item.x,
                item.y
            );

        }
    );


    ctx.globalAlpha = 1;

}


// ============================================
// PLAYER MOVEMENT
// ============================================

function movePlayer(
    delta
) {

    if (
        keys["ArrowLeft"] ||
        keys["a"] ||
        keys["A"]
    ) {

        player.x -=
            player.speed *
            delta;

    }


    if (
        keys["ArrowRight"] ||
        keys["d"] ||
        keys["D"]
    ) {

        player.x +=
            player.speed *
            delta;

    }


    player.x =
        Math.max(
            0,
            Math.min(
                canvas.width -
                player.width,
                player.x
            )
        );

}


// ============================================
// UPDATE OBJECTS
// ============================================

function updateObjects(
    delta
) {

    for (
        let i =
            objects.length - 1;

        i >= 0;

        i--
    ) {

        const object =
            objects[i];


        object.y +=
            object.speed *
            delta *
            getRoundConfig().speedMultiplier;


        if (
            collision(
                player,
                object
            )
        ) {

            // ================================
            // OBSTACLE
            // ================================

            if (
                object.type ===
                "obstacle" ||
                object.type ===
                "fire" ||
                object.type ===
                "spinner" ||
                object.type ===
                "log"
            ) {

                if (
                    player.invincible <= 0
                ) {

                    lives--;

                    combo = 0;

                    player.invincible =
                        1.2;

                    screenShake =
                        12;

                    livesEl.textContent =
                        lives;

                    comboEl.textContent =
                        combo;

                    createParticles(
                        object.x,
                        object.y,
                        "hit"
                    );

                    playHitSound();


                    if (
                        lives <= 0
                    ) {

                        endGame();

                        return;

                    }

                }


                objects.splice(
                    i,
                    1
                );

                continue;

            }


            // ================================
            // COLLECTIBLE
            // ================================

            let points = 10;


            if (
                object.type ===
                "gold"
            ) {

                points = 50;

            }


            if (
                object.type ===
                "divine"
            ) {

                points = 100;

            }


            if (
                blessingActive
            ) {

                points *= 2;

            }


            score += points;

            combo++;


            scoreEl.textContent =
                score;

            comboEl.textContent =
                combo;


            playCollectSound(
                object.type
            );


            createParticles(
                object.x,
                object.y
            );


            addFloatingText(
                object.x,
                object.y,
                "+" + points
            );


            // Combo feedback

            if (
                combo > 1 &&
                combo % 5 === 0
            ) {

                showCombo(
                    combo
                );

            }


            // Blessing Mode

            if (
                combo >= 10 &&
                !blessingActive
            ) {

                activateBlessing();

                combo = 0;

                comboEl.textContent =
                    combo;

            }


            objects.splice(
                i,
                1
            );

            continue;

        }


        if (
            object.y >
            canvas.height + 70
        ) {

            objects.splice(
                i,
                1
            );

        }

    }

}


// ============================================
// COMBO
// ============================================

function showCombo(
    value
) {

    comboPopup.textContent =
        `🔥 ${value} COMBO!`;

    comboPopup.classList.remove(
        "show"
    );


    void comboPopup.offsetWidth;


    comboPopup.classList.add(
        "show"
    );

}


// ============================================
// BLESSING MODE
// ============================================

function activateBlessing() {

    blessingActive = true;

    blessingTime = 7;

    blessingMode.classList.add(
        "active"
    );

    playBlessingSound();


    // Celebration particles

    for (
        let i = 0;
        i < 50;
        i++
    ) {

        createParticles(
            player.x +
            player.width / 2,

            player.y,

            "gold"
        );

    }

}


function updateBlessing(
    delta
) {

    if (
        !blessingActive
    ) {
        return;
    }


    blessingTime -=
        delta;


    if (
        blessingTime <= 0
    ) {

        blessingActive =
            false;

        blessingMode.classList.remove(
            "active"
        );

    }

}


// ============================================
// DIFFICULTY
// ============================================

function updateDifficulty() {

    difficulty =
        1 +
        (
            score / 1000
        );

    difficulty =
        Math.min(
            difficulty,
            2.4
        );

}


// ============================================
// TIMER
// ============================================

function updateTimer(
    delta
) {

    timeLeft -=
        delta;


    if (
        timeLeft <= 0
    ) {

        timeLeft = 0;

        if (lives > 0 && currentRound < 3) {
            advanceRound();
        } else {
            endGame();
        }

        return;
    }


    timerEl.textContent =
        Math.ceil(
            timeLeft
        );

}


// ============================================
// SCREEN SHAKE
// ============================================

function applyScreenShake() {

    if (
        screenShake <= 0
    ) {
        return;
    }


    const x =
        (
            Math.random()
            - 0.5
        ) *
        screenShake;


    const y =
        (
            Math.random()
            - 0.5
        ) *
        screenShake;


    ctx.translate(
        x,
        y
    );


    screenShake *=
        0.88;

}


// ============================================
// CONFETTI
// ============================================

function createConfetti() {

    confetti = [];


    for (
        let i = 0;
        i < 150;
        i++
    ) {

        confetti.push({

            x:
                Math.random() *
                canvas.width,

            y:
                -Math.random() *
                canvas.height,

            speed:
                100 +
                Math.random() * 250,

            rotation:
                Math.random() *
                Math.PI,

            size:
                5 +
                Math.random() * 8

        });

    }

}


function updateConfetti(
    delta
) {

    confetti.forEach(
        piece => {

            piece.y +=
                piece.speed *
                delta;

            piece.rotation +=
                delta * 4;

        }
    );

}


function drawConfetti() {

    confetti.forEach(
        piece => {

            ctx.save();

            ctx.translate(
                piece.x,
                piece.y
            );

            ctx.rotate(
                piece.rotation
            );


            ctx.fillStyle =
                "#ffb703";

            ctx.fillRect(
                -piece.size / 2,
                -piece.size / 2,
                piece.size,
                piece.size
            );


            ctx.restore();

        }
    );

}


// ============================================
// GAME LOOP
// ============================================

function gameLoop(
    timestamp
) {

    if (!gameRunning) {
        return;
    }

    if (gamePaused) {
        return;
    }


    const delta =
        Math.min(
            (
                timestamp -
                lastTime
            ) / 1000,

            0.05
        );


    lastTime =
        timestamp;


    updateDifficulty();


    // Spawn

    spawnTimer -=
        delta;


    if (
        spawnTimer <= 0
    ) {

        createObject();


        spawnTimer =
            Math.max(
                0.22,

                0.75 -
                (
                    score /
                    2500
                )
            );

    }


    movePlayer(delta);

    updateObjects(delta);

    updateParticles(delta);

    updateFloatingTexts(delta);

    updateBlessing(delta);

    updateTimer(delta);


    if (
        player.invincible > 0
    ) {

        player.invincible -=
            delta;

    }


    // ========================================
    // DRAW
    // ========================================

    ctx.save();


    applyScreenShake();


    drawBackground();

    drawPlayer();


    objects.forEach(
        drawObject
    );


    drawParticles();

    drawFloatingTexts();


    ctx.restore();


    requestAnimationFrame(
        gameLoop
    );

}


// ============================================
// START GAME
// ============================================


// ============================================
// ROUND / LEVEL SYSTEM
// ============================================

const ROUND_CONFIG = {
    easy:   { speedMultiplier: 1.00, label: "EASY", round: 1 },
    medium: { speedMultiplier: 1.30, label: "MEDIUM", round: 2 },
    hard:   { speedMultiplier: 1.65, label: "HARD", round: 3 }
};

function getRoundConfig() {
    return ROUND_CONFIG[currentLevel] || ROUND_CONFIG.easy;
}

function showRoundTransition() {
    roundTransitionActive = true;

    const overlay = document.createElement("div");
    overlay.id = "roundTransition";
    overlay.className = "round-transition";

    const config = getRoundConfig();

    overlay.innerHTML = `
        <div class="round-card">
            <div class="round-emoji">🙏</div>
            <div class="round-small">NEXT ROUND</div>
            <h2>Round ${currentRound}</h2>
            <div class="round-level">${config.label}</div>
            <p>The festival rush is getting faster!</p>
            <button id="startNextRound">CONTINUE ▶️</button>
        </div>
    `;

    document.querySelector(".game-wrapper")?.appendChild(overlay);

    document.getElementById("startNextRound")?.addEventListener("click", () => {
        overlay.remove();
        roundTransitionActive = false;
        timeLeft = 60;
        difficulty = currentRound;
        gamePaused = false;
        gameRunning = true;
        lastTime = performance.now();
        updateRoundUI();
        requestAnimationFrame(gameLoop);
    }, { once: true });
}

function advanceRound() {
    if (currentRound >= 3) {
        endGame();
        return;
    }

    currentRound += 1;
    currentLevel =
        currentRound === 2 ? "medium" :
        currentRound === 3 ? "hard" : "easy";

    gamePaused = true;
    gameRunning = false;
    updateRoundUI();
    showRoundTransition();
}

function updateRoundUI() {
    let badge = document.getElementById("roundBadge");

    if (!badge) {
        badge = document.createElement("div");
        badge.id = "roundBadge";
        badge.className = "round-badge";
        document.querySelector(".game-wrapper")?.appendChild(badge);
    }

    const config = getRoundConfig();
    badge.innerHTML = `ROUND ${currentRound} · ${config.label}`;
}


// ============================================
// FESTIVAL BACKGROUND AUDIO
// ============================================

let festivalAudio = null;
let festivalGain = null;
let festivalTimer = null;

function startFestivalMusic() {
    if (festivalAudio) return;

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        festivalAudio = new AudioContextClass();
        festivalGain = festivalAudio.createGain();
        festivalGain.gain.value = 0.035;
        festivalGain.connect(festivalAudio.destination);

        const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
        let i = 0;

        function playNote() {
            if (!festivalAudio || festivalAudio.state === "closed") return;

            const osc = festivalAudio.createOscillator();
            const gain = festivalAudio.createGain();

            osc.type = "sine";
            osc.frequency.value = notes[i % notes.length];

            gain.gain.setValueAtTime(0.0001, festivalAudio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.06, festivalAudio.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, festivalAudio.currentTime + 0.45);

            osc.connect(gain);
            gain.connect(festivalGain);
            osc.start();
            osc.stop(festivalAudio.currentTime + 0.48);

            i++;
            festivalTimer = setTimeout(playNote, 520);
        }

        festivalAudio.resume();
        playNote();
    } catch (e) {
        console.warn("Festival audio unavailable:", e);
    }
}

function stopFestivalMusic() {
    if (festivalTimer) clearTimeout(festivalTimer);
    festivalTimer = null;

    if (festivalAudio) {
        festivalAudio.close().catch(() => {});
    }

    festivalAudio = null;
    festivalGain = null;
}


// ============================================
// MOBILE TOUCH / DRAG CONTROL
// ============================================
// On phones, directly drag Ganesha with your finger. This is more
// reliable than simulating keyboard keys and works with fast swipes too.
let pointerActive = false;
let lastPointerX = null;
let pointerMoved = false;

function updatePlayerFromPointer(clientX) {
    if (!gameRunning || gamePaused || roundTransitionActive) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, canvasX - player.width / 2)
    );
}

function beginPointerControl(event) {
    if (!gameRunning || gamePaused || roundTransitionActive) return;

    pointerActive = true;
    pointerMoved = false;
    lastPointerX = event.clientX;
    updatePlayerFromPointer(event.clientX);

    if (canvas.setPointerCapture && event.pointerId !== undefined) {
        try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
    }
    event.preventDefault();
}

function movePointerControl(event) {
    if (!pointerActive || !gameRunning || gamePaused) return;

    const dx = event.clientX - lastPointerX;
    if (Math.abs(dx) > 1) pointerMoved = true;

    // Direct dragging: Ganesha follows the finger.
    updatePlayerFromPointer(event.clientX);
    lastPointerX = event.clientX;
    event.preventDefault();
}

function endPointerControl(event) {
    if (!pointerActive) return;

    pointerActive = false;
    lastPointerX = null;

    if (canvas.releasePointerCapture && event.pointerId !== undefined) {
        try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
    }
    event.preventDefault();
}

if (window.PointerEvent) {
    canvas.addEventListener("pointerdown", beginPointerControl, { passive: false });
    canvas.addEventListener("pointermove", movePointerControl, { passive: false });
    canvas.addEventListener("pointerup", endPointerControl, { passive: false });
    canvas.addEventListener("pointercancel", endPointerControl, { passive: false });
    canvas.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse") endPointerControl(event);
    }, { passive: false });
} else {
    // Fallback for older mobile browsers.
    canvas.addEventListener("touchstart", (event) => {
        if (!event.touches[0]) return;
        beginPointerControl({
            clientX: event.touches[0].clientX,
            pointerId: 0,
            preventDefault: () => event.preventDefault()
        });
    }, { passive: false });

    canvas.addEventListener("touchmove", (event) => {
        if (!event.touches[0]) return;
        movePointerControl({
            clientX: event.touches[0].clientX,
            pointerId: 0,
            preventDefault: () => event.preventDefault()
        });
    }, { passive: false });

    canvas.addEventListener("touchend", (event) => {
        endPointerControl({
            pointerId: 0,
            preventDefault: () => event.preventDefault()
        });
    }, { passive: false });
}

async function startGame() {
    const enteredName = getEnteredPlayerName();

    if (!enteredName) {
        if (playerNameInput) {
            playerNameInput.focus();
            playerNameInput.classList.add("input-error");
            setTimeout(() => playerNameInput.classList.remove("input-error"), 900);
        }
        setLeaderboardStatus("Please enter your player name first.");
        return;
    }

    if (supabaseClient && supabaseUser) {
        const available = await isPlayerNameAvailable(enteredName);
        if (!available) {
            if (playerNameInput) {
                playerNameInput.focus();
                playerNameInput.classList.add("input-error");
                setTimeout(() => playerNameInput.classList.remove("input-error"), 1200);
            }
            setLeaderboardStatus("That player name is already taken. Try a different name.");
            return;
        }
    }

    currentPlayerName = enteredName;
    localStorage.setItem(LOCAL_PLAYER_NAME_KEY, currentPlayerName);

    if (supabaseClient && !supabaseUser) {
        try {
            const result = await supabaseClient.auth.signInAnonymously();
            if (!result.error) supabaseUser = result.data?.user || null;
        } catch (error) {
            console.warn("Anonymous sign-in failed:", error);
        }
    }

    startFestivalMusic();
    currentRound = 1;
    currentLevel = "easy";
    difficulty = 1;

    highScore = Math.max(
        Number(localStorage.getItem(LOCAL_HIGH_SCORE_KEY)) || 0,
        onlineHighScore || 0,
        highScore
    );
    highScoreEl.textContent = highScore;
    roundTransitionActive = false;

    initAudio();


    score = 0;

    lives = 3;

    combo = 0;

    timeLeft = 60;

    difficulty = 1;

    blessingActive = false;

    blessingTime = 0;

    objects = [];

    particles = [];

    floatingTexts = [];

    confetti = [];


    player.x =
        canvas.width / 2 -
        player.width / 2;


    player.invincible = 0;


    scoreEl.textContent =
        score;

    livesEl.textContent =
        lives;

    comboEl.textContent =
        combo;

    timerEl.textContent =
        timeLeft;


    blessingMode.classList.remove(
        "active"
    );


    gameOverScreen.classList.add(
        "hidden"
    );

    startScreen.classList.add(
        "hidden"
    );


    gamePaused = false;

    pauseScreen.classList.add(
        "hidden"
    );

    exitConfirm.classList.add(
        "hidden"
    );

    gameRunning = true;

    lastTime =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );

}


// ============================================
// PAUSE / RESUME / EXIT
// ============================================

function pauseGame() {

    if (!gameRunning || gamePaused) {
        return;
    }

    gamePaused = true;

    pauseScreen.classList.remove(
        "hidden"
    );

    exitConfirm.classList.add(
        "hidden"
    );

}


function resumeGame() {

    if (!gameRunning || !gamePaused) {
        return;
    }

    gamePaused = false;

    pauseScreen.classList.add(
        "hidden"
    );

    exitConfirm.classList.add(
        "hidden"
    );

    // Prevent a large delta after pausing.
    lastTime = performance.now();

    requestAnimationFrame(
        gameLoop
    );

}


function continueGame() {

    // Continue is an alias for Resume.
    resumeGame();

}


function togglePause() {

    if (!gameRunning) {
        return;
    }

    if (gamePaused) {
        resumeGame();
    }
    else {
        pauseGame();
    }

}


function requestExit() {

    if (!gameRunning || !gamePaused) {
        return;
    }

    // Put the pause menu behind the confirmation dialog.
    pauseScreen.classList.add(
        "hidden"
    );

    exitConfirm.classList.remove(
        "hidden"
    );

}


function handleCancelExit() {

    exitConfirm.classList.add(
        "hidden"
    );

    if (gameRunning && gamePaused) {
        pauseScreen.classList.remove(
            "hidden"
        );
    }

}


function exitGame() {
    roundTransitionActive = false;
    document.getElementById("roundTransition")?.remove();
    stopFestivalMusic();

    gameRunning = false;
    gamePaused = false;

    pauseScreen.classList.add(
        "hidden"
    );

    exitConfirm.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    startScreen.classList.remove(
        "hidden"
    );

    blessingMode.classList.remove(
        "active"
    );

    objects = [];
    particles = [];
    floatingTexts = [];
    confetti = [];

    score = 0;
    lives = 3;
    combo = 0;
    timeLeft = 60;
    difficulty = 1;
    blessingActive = false;
    blessingTime = 0;
    screenShake = 0;

    scoreEl.textContent =
        "0";

    livesEl.textContent =
        "3";

    comboEl.textContent =
        "0";

    timerEl.textContent =
        "60";

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.invincible = 0;

}


// ============================================
// END GAME
// ============================================

async function endGame() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    const wasNewRecord = score > highScore;

    if (wasNewRecord) {
        highScore = score;
        localStorage.setItem(LOCAL_HIGH_SCORE_KEY, String(highScore));
        highScoreEl.textContent = highScore;
    }

    finalScoreEl.textContent = score;

    if (resultPlayer) {
        resultPlayer.textContent = currentPlayerName
            ? `${currentPlayerName} · Round ${currentRound}`
            : `Round ${currentRound}`;
    }

    const onlineNewRecord = await saveOnlineHighScore(score);

    if (onlineNewRecord && !wasNewRecord) {
        newRecord.classList.remove("hidden");
    }


    newRecord.classList.toggle(
        "hidden",
        !wasNewRecord
    );


    if (
        wasNewRecord
    ) {

        resultIcon.textContent =
            "🏆";

        resultTitle.textContent =
            "Divine Victory!";

        resultSubtitle.textContent =
            "You created a new high score!";

        createConfetti();

    }

    else if (
        score >= 1000
    ) {

        resultIcon.textContent =
            "🐘";

        resultTitle.textContent =
            "Amazing Journey!";

        resultSubtitle.textContent =
            "Ganesha's blessings are with you!";

        createConfetti();

    }

    else if (
        score >= 500
    ) {

        resultIcon.textContent =
            "🙏";

        resultTitle.textContent =
            "Wonderful!";

        resultSubtitle.textContent =
            "Ganapati Bappa Morya!";

    }

    else {

        resultIcon.textContent =
            "🌸";

        resultTitle.textContent =
            "Keep Going!";

        resultSubtitle.textContent =
            "Every journey begins with one step.";

    }


    gameOverScreen.classList.remove(
        "hidden"
    );


    // Confetti animation

    if (
        confetti.length > 0
    ) {

        animateVictory();

    }

}


// ============================================
// VICTORY ANIMATION
// ============================================

function animateVictory() {

    let last =
        performance.now();


    function frame(
        timestamp
    ) {

        const delta =
            (
                timestamp -
                last
            ) / 1000;


        last =
            timestamp;


        updateConfetti(
            delta
        );


        drawBackground();

        drawPlayer();

        drawConfetti();


        if (
            !gameRunning &&
            confetti.some(
                p =>
                    p.y <
                    canvas.height + 50
            )
        ) {

            requestAnimationFrame(
                frame
            );

        }

    }


    requestAnimationFrame(
        frame
    );

}


// ============================================
// INITIAL DRAW
// ============================================

drawBackground();

drawPlayer();


// ============================================
// BUTTONS
// ============================================

startButton.addEventListener(
    "click",
    startGame
);


restartButton.addEventListener(
    "click",
    startGame
);


pauseButton.addEventListener(
    "click",
    pauseGame
);


resumeButton.addEventListener(
    "click",
    resumeGame
);


continueButton.addEventListener(
    "click",
    continueGame
);


exitButton.addEventListener(
    "click",
    requestExit
);


confirmExit.addEventListener(
    "click",
    exitGame
);


cancelExit.addEventListener(
    "click",
    handleCancelExit
);


// Spacebar toggles pause/resume.
document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat) return;

    const tag = document.activeElement?.tagName;
    if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA") return;

    event.preventDefault();

    if (!gameRunning && !gamePaused) return;

    if (gamePaused) {
        if (typeof resumeGame === "function") resumeGame();
    } else {
        if (typeof pauseGame === "function") pauseGame();
    }
});




// ============================================
// GLOBAL SPACEBAR PAUSE / RESUME
// ============================================

document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat) return;

    // Space must control the game regardless of where focus is.
    event.preventDefault();
    event.stopPropagation();

    if (roundTransitionActive) return;
    if (!gameRunning && !gamePaused) return;

    if (gamePaused) {
        if (typeof resumeGame === "function") {
            resumeGame();
        }
    } else {
        if (typeof pauseGame === "function") {
            pauseGame();
        }
    }
}, true);

initSupabase();

if (refreshLeaderboardButton) {
    refreshLeaderboardButton.addEventListener("click", loadLeaderboard);
}

if (viewLeaderboardButton) {
    viewLeaderboardButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openLeaderboardModal();
    });
}

if (closeLeaderboardButton) {
    closeLeaderboardButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeLeaderboardModal(true);
    });
}

if (menuLeaderboardButton) {
    menuLeaderboardButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeLeaderboardModal(false);
    });
}

if (playerNameInput) {
    playerNameInput.addEventListener("input", () => {
        playerNameInput.classList.remove("input-error");
    });
}
