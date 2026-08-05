var BOT_TOKEN = "8607942971:AAEjTfnBkik_1AslFvAolgEwb7EbLgmPOyA";
var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwc9UmHwvM6dwFtZpWD0ha8kTTo_8toWJMrp8qRCv8gYiHbxTaSOpj4sNPjtUTVIJqs/exec";
var SHEET_ID = "1ytkQiI_Tui-8Xx6HQH3RggcwCs1EM-TlGd_f3lT1g7c";

// ---------------------------
// Ø±ØªØ¨ ÙˆÙ†Ù‚Ø§Ø·
// ---------------------------
var RANKS = [
  {name: "Ù…Ù„Ø§Ø²Ù… â­", min: 0},
  {name: "Ù…Ù„Ø§Ø²Ù… Ø£ÙˆÙ„ â­â­", min: 201},
  {name: "Ù†Ù‚ÙŠØ¨ â­â­â­", min: 501},
  {name: "Ø±Ø§Ø¦Ø¯ ðŸ¦…", min: 1001},
  {name: "Ù…Ù‚Ø¯Ù… ðŸ¦…â­", min: 2001},
  {name: "Ø¹Ù‚ÙŠØ¯ ðŸ¦…â­â­", min: 3501},
  {name: "Ø¹Ù…ÙŠØ¯ ðŸ¦…â­â­â­", min: 5001},
  {name: "Ù„ÙˆØ§Ø¡ ðŸ¦…âš”ï¸", min: 7501},
  {name: "Ù…Ø´ÙŠØ± ðŸ¦…âš”ï¸ðŸŒ¿", min: 10000},
  {name: "Ù‚Ø§Ø¦Ø¯ Ø£Ø¹Ù„Ù‰ ðŸ‘‘", min: 15000},
  {name: "Ø£Ø³Ø·ÙˆØ±Ø© Ø­ÙŠØ© ðŸŒðŸ‘‘", min: 25000},
  {name: "Ø­Ø§Ø±Ø³ Ø§Ù„Ø£Ù…Ø© ðŸ•‹ðŸ‘‘âš”ï¸", min: 50000},
  {name: "Ø®Ø§Ù„Ø¯ ðŸ’ŽðŸ‘‘ðŸŒ¿", min: 100000}
];

function getRank(points) {
  var currentRank = RANKS[0].name;
  for (var i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].min) {
      currentRank = RANKS[i].name;
    }
  }
  return currentRank;
}

function getNextRankProgress(points) {
  for (var i = 0; i < RANKS.length - 1; i++) {
    if (points < RANKS[i+1].min) {
      var needed = RANKS[i+1].min - points;
      var total = RANKS[i+1].min - RANKS[i].min;
      var pct = Math.floor(((points - RANKS[i].min) / total) * 10);
      var bar = "â–ˆ".repeat(pct) + "â–‘".repeat(10-pct);
      return "`[" + bar + "]` " + needed + " Ù†Ù‚Ø·Ø© Ù„Ù„Ø±ØªØ¨Ø©: " + RANKS[i+1].name;
    }
  }
  return "ðŸŒŒ Ø¨Ù„ØºØª Ø£Ø¹Ù„Ù‰ Ø±ØªØ¨Ø©. Ø£Ù†Øª Ø§Ù„Ù…Ø´ÙŠØ± Ø§Ù„Ø¢Ù†.";
}

function getPoints() {
  var p = PropertiesService.getScriptProperties().getProperty('POINTS');
  return p ? parseInt(p) : 0;
}

function addPoints(pts, reason) {
  var current = getPoints();
  current += pts;
  if (current < 0) current = 0;
  var props = PropertiesService.getScriptProperties();
  props.setProperty('POINTS', current.toString());

  if (!reason) reason = (pts >= 0) ? "Ø¥Ø¶Ø§ÙØ© Ù†Ù‚Ø§Ø·" : "Ø®ØµÙ… Ù†Ù‚Ø§Ø·";
  if (pts !== 0) {
    var history = safeParse(props.getProperty('POINTS_HISTORY'), []);
    var dateStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm");
    history.unshift({reason: reason, change: pts, total: current, timestamp: dateStr});
    if (history.length > 15) history.length = 15;
    props.setProperty('POINTS_HISTORY', JSON.stringify(history));
  }

  return current;
}

function safeParse(jsonStr, fallback) {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    Logger.log("JSON parse error: " + e.toString());
    return fallback;
  }
}

function pickFreshContent(props, key, items) {
  var propertyKey = 'CONTENT_ROTATION_' + key;
  var used = safeParse(props.getProperty(propertyKey), []);
  if (!Array.isArray(used)) used = [];

  var available = [];
  for (var i = 0; i < items.length; i++) {
    if (used.indexOf(i) === -1) available.push(i);
  }
  if (available.length === 0) {
    used = [];
    for (var j = 0; j < items.length; j++) available.push(j);
  }

  var chosen = available[Math.floor(Math.random() * available.length)];
  used.unshift(chosen);
  var memory = Math.min(Math.max(items.length - 1, 1), 8);
  if (used.length > memory) used.length = memory;
  props.setProperty(propertyKey, JSON.stringify(used));
  return items[chosen];
}

function getPrayerWindowEnd(prayer, prayerTimes, fajrMins) {
  var prayers = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];
  var index = prayers.indexOf(prayer);
  if (index === -1) return null;
  if (prayer === "Ø§Ù„ÙØ¬Ø±") return getAbsoluteMins(parseTimeStr(prayerTimes["Ø§Ù„Ø´Ø±ÙˆÙ‚"]), fajrMins);
  if (index < prayers.length - 1) return getAbsoluteMins(parseTimeStr(prayerTimes[prayers[index + 1]]), fajrMins);
  return fajrMins + 1440;
}

function getPrayerFlavor(props, prayer, countToday) {
  var flavors = {
    "Ø§Ù„ÙØ¬Ø±": [
      " â€” Ø£ÙˆÙ„ Ù…Ù† ØµØ§ÙØ­ Ø§Ù„Ù†ÙˆØ± Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡ ðŸŒ…",
      " â€” Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„ØµØ­ Ù„ÙŠÙˆÙ… ÙƒÙ„Ù‡ Ø§Ù†ØªØµØ§Ø±Ø§Øª âœ¨",
      " â€” Ø§Ù„ÙØ¬Ø± Ø´Ø§Ù‡Ø¯ Ø¹Ù„ÙŠÙƒ.. Ø¹Ø§Ø´ ÙŠØ§ Ø¨Ø·Ù„ ðŸŒ„"
    ],
    "Ø§Ù„Ø¸Ù‡Ø±": [
      " â€” ÙˆØ³Ø· Ø§Ù„Ù…Ø¹Ø±ÙƒØ© ÙˆÙ„Ø³Ù‡ Ø«Ø§Ø¨Øª âš”ï¸",
      " â€” ÙˆÙ‚ÙØ© Ø¨ØªØ´Ø­Ù† Ù‚Ù„Ø¨Ùƒ Ø¹Ø´Ø§Ù† ØªÙƒÙ…Ù„ ðŸ’ª",
      " â€” Ø´ØºÙ„Ùƒ ÙˆÙ…Ø´Ø§ØºÙ„Ùƒ Ù…Ù…ÙŽÙ†Ø¹ÙˆÙƒØ´ Ø¹Ù† Ø±Ø¨Ùƒ ðŸ•Œ"
    ],
    "Ø§Ù„Ø¹ØµØ±": [
      " â€” Ø§Ù„ØµÙ„Ø§Ø© Ø§Ù„ÙˆØ³Ø·Ù‰ Ø§Ù„Ù„ÙŠ Ø±Ø¨Ù†Ø§ ÙˆØµØ§Ù†Ø§ Ø¨ÙŠÙ‡Ø§ ðŸ’«",
      " â€” Ø«Ø¨Ø§ØªÙƒ ÙÙŠ Ø§Ù„Ù†Øµ Ù‡Ùˆ Ø§Ù„Ù„ÙŠ Ø¨ÙŠÙƒÙ…Ù„ Ø§Ù„ÙŠÙˆÙ… ðŸ¦…",
      " â€” Ø®Ø·ÙˆØ© ÙƒÙ…Ø§Ù† ÙˆØªÙ‚ÙÙ„ Ø§Ù„ÙŠÙˆÙ… Ø¨Ø§Ù†ØªØµØ§Ø± â³"
    ],
    "Ø§Ù„Ù…ØºØ±Ø¨": [
      " â€” ÙƒØ³Ø±Øª ÙŠÙˆÙ… ØªØ§Ù†ÙŠ Ø¨Ø§Ù†ØªØµØ§Ø± ðŸŒ…",
      " â€” Ø´Ù…Ø³ Ø§Ù„ÙŠÙˆÙ… ØºØ§Ø¨Øª ÙˆØ¥Ù†Øª ÙˆØ§Ù‚Ù Ù…ÙƒØ§Ù†Ùƒ Ù…Ø§ØªÙ‡Ø²ÙŠØªØ´ ðŸ”¥",
      " â€” Ø§Ù„ÙŠÙˆÙ… Ø¨ÙŠØ®Ù„Øµ ÙˆØ¥Ù†Øª ÙƒØ³Ø¨Ø§Ù† ðŸ†"
    ],
    "Ø§Ù„Ø¹Ø´Ø§Ø¡": [
      " â€” Ø®ØªÙ…Øª ÙŠÙˆÙ…Ùƒ ØµØ­. Ù†Ø§Ù… ÙˆØ£Ù†Øª Ù…Ù†ØªØµØ± ðŸŒ™",
      " â€” Ù…Ø³Ùƒ Ø§Ù„Ø®ØªØ§Ù… Ù„ÙŠÙˆÙ… Ø·ÙˆÙŠÙ„ ðŸŒŒ",
      " â€” ÙŠÙˆÙ…Ùƒ Ø§ØªÙ‚ÙÙ„ Ø¹Ù„Ù‰ Ø·Ø§Ø¹Ø©.. Ø§Ø³ØªØ¹Ø¯ Ù„Ù„ÙŠ Ø¨Ø¹Ø¯Ù‡ ðŸ›¡ï¸"
    ]
  };
  
  var arr = flavors[prayer] || [""];
  var msg = arr[Math.floor(Math.random() * arr.length)];
  
  if (prayer === "Ø§Ù„Ø¹Ø´Ø§Ø¡" && countToday === 5) {
    msg += "\n\nÙŠÙˆÙ… Ù†Ù‚ÙŠ Ø¨Ù„Ø§ Ù‡Ø²Ø§Ø¦Ù….. Ù†Ø§Ù… Ù…Ø±ØªØ§Ø­ ÙŠØ§ Ø¨Ø·Ù„ ðŸŒ¿";
  }
  
  var currentDayOfWeek = Utilities.formatDate(new Date(), "GMT+3", "u");
  if (prayer === "Ø§Ù„ÙØ¬Ø±" && currentDayOfWeek === "5") {
    msg = " â€” ÙØ¬Ø± Ø§Ù„Ø¬Ù…Ø¹Ø© Ø§Ù„Ù…Ø´Ù‡ÙˆØ¯! Ø¨Ø¯Ø§ÙŠØ© Ø£Ø¹Ø¸Ù… Ø£ÙŠØ§Ù… Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ØŒ Ù…ØªÙ†Ø³Ø§Ø´ Ø§Ù„ÙƒÙ‡Ù ÙˆØ§Ù„ØµÙ„Ø§Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ ðŸ•Œâœ¨";
  }
  
  return msg;
}

function isPrayerPastWindow(prayer, currentAbs, prayerTimes, fajrMins) {
  var windowEnd = getPrayerWindowEnd(prayer, prayerTimes, fajrMins);
  return windowEnd !== null && currentAbs >= windowEnd;
}

function getFortyChallengeDays(props) {
  var startedAt = parseInt(props.getProperty('FORTY_START_TS') || "0");
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((new Date().getTime() - startedAt) / (24 * 60 * 60 * 1000)));
}

function getFortyChallengeText(props) {
  var status = props.getProperty('FORTY_STATUS') || "";
  if (status === "ACTIVE") {
    var days = Math.min(40, getFortyChallengeDays(props));
    var bar = "â– ".repeat(Math.floor(days / 4)) + "â–¡".repeat(10 - Math.floor(days / 4));
    return "ðŸ ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ…: " + days + "/40\n`[" + bar + "]`";
  }
  if (status === "COMPLETED") return "ðŸ ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ…: Ù…ÙƒØªÙ…Ù„ ðŸ†";
  return "ðŸ ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ…: ØºÙŠØ± Ù†Ø´Ø·";
}

function updateFortyChallenge(props, chatId) {
  if (props.getProperty('FORTY_STATUS') !== "ACTIVE") return;
  if (getFortyChallengeDays(props) < 40) return;

  props.setProperty('FORTY_STATUS', "COMPLETED");
  var newPoints = addPoints(600, "Ø¥ÙƒÙ…Ø§Ù„ ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ…");
  addMedal("ÙˆØ³Ø§Ù… Ø§Ù„Ø£Ø±Ø¨Ø¹ÙŠÙ† Ø§Ù„ØµØ§Ù…Ø¯ ðŸ", chatId);
  sendMessage(chatId,
    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\nðŸ *Ø§ÙƒØªÙ…Ù„ ØªØ­Ø¯ÙŠ Ø§Ù„Ø£Ø±Ø¨Ø¹ÙŠÙ†*\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n" +
    "Ù¤Ù  ÙŠÙˆÙ…Ø§Ù‹ Ù…Ù† Ø§Ù„Ø«Ø¨Ø§ØªØŒ ÙŠÙˆÙ… ÙˆØ±Ø§Ø¡ ÙŠÙˆÙ….\n" +
    "Ù…Ø´ Ù…Ø¬Ø±Ø¯ Ø¹Ø¯Ù‘Ø§Ø¯Ø› Ø¯ÙŠ Ø¹Ø§Ø¯Ø© Ø¨ØªØªÙƒØªØ¨ ÙÙŠ Ø´Ø®ØµÙŠØªÙƒ.\n\n" +
    "ðŸŽ Ù…ÙƒØ§ÙØ£Ø© Ø§Ù„Ø¥ØªÙ…Ø§Ù…: +600 Ù†Ù‚Ø·Ø©\nðŸ’Ž Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ø¢Ù†: " + newPoints);
}

function runPulse(props, chatId, prayer) {
  var dateKey = getIslamicDateStr();
  var key = 'NUDGE_' + dateKey;
  if (props.getProperty(key)) return;

  var hour = parseInt(Utilities.formatDate(new Date(), "GMT+3", "HH"));
  var day = Utilities.formatDate(new Date(), "GMT+3", "u");
  var dateNumber = parseInt(Utilities.formatDate(new Date(), "GMT+3", "dd"));
  var text = "";
  if (prayer === "Ø§Ù„ÙØ¬Ø±" && day === "5" && hour < 6) {
    text = "ðŸŒ¿ *ØµØ¨Ø§Ø­ Ø§Ù„Ø¬Ù…Ø¹Ø© Ù…Ø®ØªÙ„Ù.*\n\nØ£Ù†Øª Ø¨Ø¯Ø£Øª Ø§Ù„ÙŠÙˆÙ… ÙÙŠ Ù…ÙƒØ§Ù† Ø£ØºÙ„Ø¨ Ø§Ù„Ù†Ø§Ø³ Ù„Ø³Ù‡ Ù†Ø§ÙŠÙ…Ø© ÙÙŠÙ‡. Ø®Ù„ÙŠÙ‡ ÙŠÙˆÙ… Ù‡Ø§Ø¯ÙŠ ÙˆØ«Ù‚ÙŠÙ„ ÙÙŠ Ø§Ù„Ù…ÙŠØ²Ø§Ù†.";
  } else if (prayer === "Ø§Ù„Ø¹Ø´Ø§Ø¡" && dateNumber % 17 === 0) {
    text = "ðŸŒ™ *ØªÙ… Ø±ØµØ¯ Ù†Ù‡Ø§ÙŠØ© ÙŠÙˆÙ… Ù†Ø¸ÙŠÙØ©.*\n\nÙ…Ø´ Ù„Ø§Ø²Ù… Ø­Ø¯ ÙŠØ´ÙˆÙ Ø§Ù„Ø®Ø·ÙˆØ© Ø¯ÙŠ Ø¹Ø´Ø§Ù† ØªÙƒÙˆÙ† Ø¹Ø¸ÙŠÙ…Ø©. Ø£Ù†Øª Ø´ÙØªÙ‡Ø§ØŒ ÙˆØ±Ø¨Ù†Ø§ ÙŠØ¹Ù„Ù…Ù‡Ø§.";
  }
  if (text) {
    props.setProperty(key, "1");
    sendMessage(chatId, text);
  }
}

var MEDALS_DB = {
  "Ø´Ø§Ø±Ø© Ø§Ù„Ù…Ø­Ø§Ø±Ø¨ Ø§Ù„Ø£ÙˆÙ„Ù‰ ðŸŽ–ï¸": { id: "medal1", name: "Ø´Ø§Ø±Ø© Ø§Ù„Ù…Ø­Ø§Ø±Ø¨ Ø§Ù„Ø£ÙˆÙ„Ù‰ ðŸŽ–ï¸", desc: "ØªÙÙ…Ù†Ø­ Ù„Ø£ÙˆÙ„ ÙŠÙˆÙ… Ù…Ù† Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ù…Ø³ØªÙ…Ø±.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_1.jpg" },
  "ÙˆØ³Ø§Ù… Ø§Ù„Ø¥Ø±Ø§Ø¯Ø© Ø§Ù„ØµÙ„Ø¨Ø© ðŸ›¡ï¸": { id: "medal2", name: "ÙˆØ³Ø§Ù… Ø§Ù„Ø¥Ø±Ø§Ø¯Ø© Ø§Ù„ØµÙ„Ø¨Ø© ðŸ›¡ï¸", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ…ÙˆØ¯ 3 Ø£ÙŠØ§Ù… Ù…ØªØªØ§Ù„ÙŠØ© Ø¨Ù‚ÙˆØ©.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_2.jpg" },
  "Ù†Ø¬Ù…Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù†Ø­Ø§Ø³ÙŠØ© ðŸ¥‰": { id: "medal3", name: "Ù†Ø¬Ù…Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù†Ø­Ø§Ø³ÙŠØ© ðŸ¥‰", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ…ÙˆØ¯ 7 Ø£ÙŠØ§Ù… (Ø£Ø³Ø¨ÙˆØ¹ ÙƒØ§Ù…Ù„).", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_3.jpg" },
  "Ø¯Ø±Ø¹ Ø§Ù„Ø´Ù‡Ø± Ø§Ù„ÙØ¶ÙŠ ðŸ¥ˆ": { id: "medal4", name: "Ø¯Ø±Ø¹ Ø§Ù„Ø´Ù‡Ø± Ø§Ù„ÙØ¶ÙŠ ðŸ¥ˆ", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ…ÙˆØ¯ 30 ÙŠÙˆÙ…Ø§Ù‹ Ù…ØªØªØ§Ù„ÙŠØ©.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_4.jpg" },
  "ØªØ§Ø¬ Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ø°Ù‡Ø¨ÙŠ ðŸ¥‡": { id: "medal5", name: "ØªØ§Ø¬ Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ø°Ù‡Ø¨ÙŠ ðŸ¥‡", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ…ÙˆØ¯ 90 ÙŠÙˆÙ…Ø§Ù‹ (Ø±Ø¨Ø¹ Ø³Ù†Ø©).", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_5.jpg" },
  "ÙˆØ³Ø§Ù… Ø§Ù„Ù†Ù‚Ø§Ø¡ Ø§Ù„Ù…Ø·Ù„Ù‚ ðŸ’Ž": { id: "medal6", name: "ÙˆØ³Ø§Ù… Ø§Ù„Ù†Ù‚Ø§Ø¡ Ø§Ù„Ù…Ø·Ù„Ù‚ ðŸ’Ž", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ…ÙˆØ¯ 180 ÙŠÙˆÙ…Ø§Ù‹ (Ù†ØµÙ Ø³Ù†Ø©).", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_6.jpg" },
  "ðŸ”¥ ÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ø§Ø¦Ø¯ Ø§Ù„Ø£Ù‚ÙˆÙ‰": { id: "medal7", name: "ðŸ”¥ ÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ø§Ø¦Ø¯ Ø§Ù„Ø£Ù‚ÙˆÙ‰", desc: "ØªÙÙ…Ù†Ø­ Ø¨Ø¹Ø¯ Ø§Ù„ØªØ¹Ø§ÙÙŠ Ù…Ù† Ø§Ù†ØªÙƒØ§Ø³Ø© Ø¨Ø¶Ø¹Ù Ù…Ø¯Ø© Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_7.jpg" },
  "ÙˆØ³Ø§Ù… Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø­Ø¯ÙŠØ¯ÙŠ ðŸ•Œ": { id: "medal8", name: "ÙˆØ³Ø§Ù… Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø­Ø¯ÙŠØ¯ÙŠ ðŸ•Œ", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© 3 Ø£ÙŠØ§Ù… Ù…ØªØªØ§Ù„ÙŠØ© ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_8.jpg" },
  "Ù†Ø¬Ù…Ø© Ø§Ù„ÙØ¬Ø± ðŸŒŸ": { id: "medal9", name: "Ù†Ø¬Ù…Ø© Ø§Ù„ÙØ¬Ø± ðŸŒŸ", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© 7 Ø£ÙŠØ§Ù… Ù…ØªØªØ§Ù„ÙŠØ© ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_9.jpg" },
  "Ø¯Ø±Ø¹ Ø§Ù„Ù…ØµÙ„ÙŠÙ† Ø§Ù„Ø£Ø³Ø·ÙˆØ±ÙŠ ðŸ•‹": { id: "medal10", name: "Ø¯Ø±Ø¹ Ø§Ù„Ù…ØµÙ„ÙŠÙ† Ø§Ù„Ø£Ø³Ø·ÙˆØ±ÙŠ ðŸ•‹", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© 30 ÙŠÙˆÙ…Ø§Ù‹ Ù…ØªØªØ§Ù„ÙŠØ© ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_10.jpg" },
  "ðŸ–ï¸ Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø®Ù…Ø§Ø³ÙŠØ©": { id: "medal11", name: "ðŸ–ï¸ Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø®Ù…Ø§Ø³ÙŠØ©", desc: "ØªÙÙ…Ù†Ø­ Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„ØµÙ„ÙˆØ§Øª Ø§Ù„Ø®Ù…Ø³ ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§ Ø¨Ø§Ù…ØªÙŠØ§Ø².", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_11.jpg" },
  "ðŸ’° Ù…Ù„ÙŠÙˆÙ†ÙŠØ± Ø§Ù„Ø­Ø³Ù†Ø§Øª": { id: "medal12", name: "ðŸ’° Ù…Ù„ÙŠÙˆÙ†ÙŠØ± Ø§Ù„Ø­Ø³Ù†Ø§Øª", desc: "ØªÙÙ…Ù†Ø­ Ù„Ø¬Ù…Ø¹ ÙƒÙ…ÙŠØ© Ø¶Ø®Ù…Ø© Ù…Ù† Ø§Ù„Ù†Ù‚Ø§Ø· ÙˆØ§Ù„Ø­Ø³Ù†Ø§Øª.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_12.jpg" },
  "ðŸŽ–ï¸ ÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ©": { id: "medal13", name: "ðŸŽ–ï¸ ÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ©", desc: "ØªÙÙ…Ù†Ø­ Ù„Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_13.jpg" },
  "Ø´Ø§Ø±Ø© Ø§Ù„Ù…Ù‚Ø§ÙˆÙ… Ø§Ù„ØµØ§Ù…Øª âš”ï¸": { id: "medal14", name: "Ø´Ø§Ø±Ø© Ø§Ù„Ù…Ù‚Ø§ÙˆÙ… Ø§Ù„ØµØ§Ù…Øª âš”ï¸", desc: "ØªÙÙ…Ù†Ø­ Ù„ØªØ³Ø¬ÙŠÙ„ 10 Ø§Ù†ØªØµØ§Ø±Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„Ù†ÙØ³." },
  "Ù‚Ù„Ø§Ø¯Ø© Ø§Ù„Ù…Ù†ØªØµØ± Ø§Ù„Ø£ÙƒØ¨Ø± ðŸ†": { id: "medal15", name: "Ù‚Ù„Ø§Ø¯Ø© Ø§Ù„Ù…Ù†ØªØµØ± Ø§Ù„Ø£ÙƒØ¨Ø± ðŸ†", desc: "ØªÙÙ…Ù†Ø­ Ù„ØªØ³Ø¬ÙŠÙ„ 50 Ø§Ù†ØªØµØ§Ø±Ø§Ù‹ Ø¹Ø¸ÙŠÙ…Ø§Ù‹." },
  "ðŸ¥‰ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„Ø¨Ø±ÙˆÙ†Ø²ÙŠ": { id: "medal16", name: "ðŸ¥‰ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„Ø¨Ø±ÙˆÙ†Ø²ÙŠ", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§ 3 Ù…Ø±Ø§Øª." },
  "ðŸ¥ˆ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„ÙØ¶ÙŠ": { id: "medal17", name: "ðŸ¥ˆ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„ÙØ¶ÙŠ", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§ 10 Ù…Ø±Ø§Øª." },
  "ðŸ¥‡ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„Ø°Ù‡Ø¨ÙŠ": { id: "medal18", name: "ðŸ¥‡ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„Ø°Ù‡Ø¨ÙŠ", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§ 30 Ù…Ø±Ø©." },
  "ðŸŒŒ Ø£Ø³Ø·ÙˆØ±Ø© Ø§Ù„ÙØ¬Ø±": { id: "medal19", name: "ðŸŒŒ Ø£Ø³Ø·ÙˆØ±Ø© Ø§Ù„ÙØ¬Ø±", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§ 90 Ù…Ø±Ø©." },
  "ðŸƒ ÙˆØ³Ø§Ù… Ø§Ù„Ø¬ÙˆÙƒØ± Ø§Ù„Ù†Ø§Ø¯Ø±": { id: "medal20", name: "ðŸƒ ÙˆØ³Ø§Ù… Ø§Ù„Ø¬ÙˆÙƒØ± Ø§Ù„Ù†Ø§Ø¯Ø±", desc: "ØªÙÙ…Ù†Ø­ Ø¹Ù†Ø¯ Ø§Ù‚ØªÙ†Ø§Øµ Ø§Ù„Ø¬ÙˆÙƒØ± ÙˆØ¥ØªÙ…Ø§Ù… ØªØ­Ø¯ÙŠØ§ØªÙ‡ Ø§Ù„Ù†Ø§Ø¯Ø±Ø©." },
  "ðŸŒ ÙˆØ³Ø§Ù… Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø£Ø³Ø·ÙˆØ±ÙŠØ©": { id: "medal21", name: "ðŸŒ ÙˆØ³Ø§Ù… Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø£Ø³Ø·ÙˆØ±ÙŠØ©", desc: "ØªÙÙ…Ù†Ø­ Ù„ØµÙ…ÙˆØ¯ Ø¹Ø§Ù… ÙƒØ§Ù…Ù„ (365 ÙŠÙˆÙ…Ø§Ù‹)! Ø£Ø³Ø·ÙˆØ±Ø© Ø­ÙŠØ©." },
  "ðŸ›¡ï¸ Ø§Ù„Ø¯Ø±Ø¹ Ø§Ù„ÙÙˆÙ„Ø§Ø°ÙŠ": { id: "medal22", name: "ðŸ›¡ï¸ Ø§Ù„Ø¯Ø±Ø¹ Ø§Ù„ÙÙˆÙ„Ø§Ø°ÙŠ", desc: "ØªÙÙ…Ù†Ø­ ÙƒØ¯Ø±Ø¹ Ø­Ù…Ø§ÙŠØ© ÙÙˆÙ„Ø§Ø°ÙŠ." },
  "âš”ï¸ Ø³ÙŠÙ Ø§Ù„Ø­Ù‚": { id: "medal23", name: "âš”ï¸ Ø³ÙŠÙ Ø§Ù„Ø­Ù‚", desc: "ØªÙÙ…Ù†Ø­ ÙƒØ±Ù…Ø² Ù„Ù‚ÙˆØ© Ø§Ù„Ø¥ÙŠÙ…Ø§Ù†." },
  "ÙˆØ³Ø§Ù… Ø§Ù„Ø£Ø±Ø¨Ø¹ÙŠÙ† Ø§Ù„ØµØ§Ù…Ø¯ ðŸ": { id: "medal24", name: "ÙˆØ³Ø§Ù… Ø§Ù„Ø£Ø±Ø¨Ø¹ÙŠÙ† Ø§Ù„ØµØ§Ù…Ø¯ ðŸ", desc: "ØªÙÙ…Ù†Ø­ Ù„Ø¥ÙƒÙ…Ø§Ù„ ØªØ­Ø¯ÙŠ Ø£Ø±Ø¨Ø¹ÙŠÙ† ÙŠÙˆÙ…Ø§Ù‹ Ù…Ù† Ø§Ù„Ø«Ø¨Ø§Øª." }
};

function getMedals() {
  var medalsStr = PropertiesService.getScriptProperties().getProperty('MY_MEDALS');
  var medalsArr = safeParse(medalsStr, []);
  if (medalsArr.length === 0) return "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø£ÙˆØ³Ù…Ø© Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.";

  var out = [];
  for (var i = 0; i < medalsArr.length; i++) {
    var medalObj = medalsArr[i];
    var medalName = (typeof medalObj === 'string') ? medalObj : medalObj.name;
    var medalData = MEDALS_DB[medalName];
    if (medalData) {
      out.push("/" + medalData.id + " (" + medalName + ")");
    } else {
      out.push(medalName);
    }
  }
  return out.join(" | ");
}

function addMedal(medalName, chatId) {
  var props = PropertiesService.getScriptProperties();
  var medalsStr = props.getProperty('MY_MEDALS');
  var medalsArr = safeParse(medalsStr, []);

  var alreadyHas = false;
  for (var i = 0; i < medalsArr.length; i++) {
    var mName = (typeof medalsArr[i] === 'string') ? medalsArr[i] : medalsArr[i].name;
    if (mName === medalName) {
      alreadyHas = true;
      break;
    }
  }

  if (!alreadyHas) {
    var dateEarned = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd");
    medalsArr.push({ name: medalName, earnedAt: dateEarned });
    props.setProperty('MY_MEDALS', JSON.stringify(medalsArr));
    sendMessage(chatId, "ðŸŽ–ï¸ ØªÙ… Ø§Ù„ØªÙƒØ±ÙŠÙ… Ø¨ÙˆØ³Ø§Ù… Ø¬Ø¯ÙŠØ¯: *" + medalName + "*\nØ§Ù„Ù‚ÙŠØ§Ø¯Ø© ÙØ®ÙˆØ±Ø© Ø¨Ø£Ø¯Ø§Ø¦Ùƒ Ø§Ù„Ø§Ø³ØªØ«Ù†Ø§Ø¦ÙŠ.\n\nØªÙÙ‚Ø¯Ù‡ Ø§Ù„Ø¢Ù† Ù…Ù† Ù…Ù„ÙÙƒ Ø§Ù„Ø¹Ø³ÙƒØ±ÙŠ Ù„Ù…Ø¹Ø±ÙØ© ØªÙØ§ØµÙŠÙ„Ù‡!");
  }
}

// ---------------------------
// Webhook & Setup
// ---------------------------
function setupBot() {
  // 1. Set Webhook
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/setWebhook?url=" + SCRIPT_URL;
  var response = UrlFetchApp.fetch(url);
  Logger.log("Webhook Response: " + response.getContentText());

  // 2. Clear only Camp Zero triggers; do not remove unrelated project automation.
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var handler = triggers[i].getHandlerFunction();
    if (handler === "checkAndRemind" || handler === "cleanupOldProperties") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // 3. Create new trigger for checkAndRemind every 5 minutes
  ScriptApp.newTrigger("checkAndRemind")
           .timeBased()
           .everyMinutes(5)
           .create();
  ScriptApp.newTrigger("cleanupOldProperties")
           .timeBased()
           .onWeekDay(ScriptApp.WeekDay.SUNDAY)
           .atHour(4)
           .create();

  Logger.log("âœ… ØªÙ… Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø¨ÙˆØª Ø¨Ù†Ø¬Ø§Ø­: ØªÙ… Ø±Ø¨Ø· Ø§Ù„Ù€ Webhook ÙˆØ¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù€ Triggers.");
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  try {
    props.setProperty('LAST_INTERACTION_TIME', new Date().getTime().toString());

    if (typeof e !== 'undefined' && e.postData && e.postData.contents) {
      var update = JSON.parse(e.postData.contents);
      if (update.message) {
        handleMessage(update.message);
      }
    }
  } catch (err) {
    if (typeof e !== 'undefined') {
      try {
        var update = JSON.parse(e.postData.contents);
        if (update.message && update.message.chat) {
          sendMessage(update.message.chat.id, "Ø­ØµÙ„ Ø¹Ø·Ù„ Ù…Ø¤Ù‚Øª ÙÙŠ Ø§Ù„Ù…Ø¹Ø³ÙƒØ±. Ø¬Ø±Ù‘Ø¨ Ø§Ù„Ø£Ù…Ø± Ù…Ø±Ø© Ø«Ø§Ù†ÙŠØ© Ø¨Ø¹Ø¯ Ù„Ø­Ø¸Ø§Øª. ðŸ›¡ï¸");
        }
      } catch (innerErr) { }
    }
    Logger.log("Webhook error: " + err.toString());
  }
  return HtmlService.createHtmlOutput("OK");
}

// ---------------------------
// Time & Islamic Date Logic
// ---------------------------
function getFajrMins() {
  var prayerTimes = getPrayerTimes();
  var fajrStr = prayerTimes["Ø§Ù„ÙØ¬Ø±"];
  if (fajrStr) {
    var parts = fajrStr.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 240; // Default 4:00 AM
}

function getAbsoluteMins(minsRaw, fajrMins) {
  return (minsRaw < fajrMins) ? minsRaw + 1440 : minsRaw;
}

function getIslamicDateStr() {
  var now = new Date();
  var todayStr = Utilities.formatDate(now, "GMT+3", "yyyy-MM-dd");
  var currentTimeStr = Utilities.formatDate(now, "GMT+3", "HH:mm");
  var parts = currentTimeStr.split(":");
  var currentMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  var fajrMins = getFajrMins();

  if (currentMins < fajrMins) {
     var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
     return Utilities.formatDate(yesterday, "GMT+3", "yyyy-MM-dd");
  }
  return todayStr;
}

function parseTimeStr(timeStr) {
  var p = timeStr.split(":");
  return parseInt(p[0]) * 60 + parseInt(p[1]);
}

function getMissedPrayers(currentAbs, prayerTimes, props, islamicDateStr, fajrMins) {
  var prayers = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];
  var missed = [];

  for (var i = 0; i < prayers.length; i++) {
    var pName = prayers[i];
    var nextAbs;

    if (pName === "Ø§Ù„ÙØ¬Ø±") {
       nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["Ø§Ù„Ø´Ø±ÙˆÙ‚"]), fajrMins);
    } else if (i < prayers.length - 1) {
       var nextPName = prayers[i + 1];
       nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes[nextPName]), fajrMins);
    } else {
       nextAbs = fajrMins + 1440;
    }

    if (currentAbs >= nextAbs) {
      if (props.getProperty('PRAYED_' + pName) !== islamicDateStr) {
        missed.push(pName);
      }
    }
  }
  return missed;
}

function countTodayPrayers(props, dateStr) {
  var d = props.getProperty('PRAYER_DATA_' + dateStr);
  if (!d) return 0;
  var count = 0;
  if (d.includes('Ø§Ù„ÙØ¬Ø±_OK')) count++;
  if (d.includes('Ø§Ù„Ø¸Ù‡Ø±_OK')) count++;
  if (d.includes('Ø§Ù„Ø¹ØµØ±_OK')) count++;
  if (d.includes('Ø§Ù„Ù…ØºØ±Ø¨_OK')) count++;
  if (d.includes('Ø§Ù„Ø¹Ø´Ø§Ø¡_OK')) count++;
  return count;
}

function getPrayerPoints(actualPrayer, currentAbs, prayerTimes, isExcused, missedArr, fajrMins) {
  if (isExcused) return 15;

  if (isPrayerPastWindow(actualPrayer, currentAbs, prayerTimes, fajrMins)) return 2;

  var prayers = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];
  var index = prayers.indexOf(actualPrayer);
  var nextAbs;

  if (actualPrayer === "Ø§Ù„ÙØ¬Ø±") {
    nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["Ø§Ù„Ø´Ø±ÙˆÙ‚"]), fajrMins);
  } else if (index >= 1 && index < 4) {
    var nextPName = prayers[index + 1];
    nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes[nextPName]), fajrMins);
  } else {
    nextAbs = fajrMins + 1440;
  }

  var timeRemaining = nextAbs - currentAbs;

  if (timeRemaining > 60) return 15;
  if (timeRemaining > 45) return 12;
  if (timeRemaining > 30) return 9;
  if (timeRemaining > 15) return 7;
  if (timeRemaining > 0)  return 5;
  return 2;
}

function updatePrayerStreak(islamicDateStr, props, chatId) {
  var prayersList = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];
  var isPerfectDay = true;

  for (var i = 0; i < prayersList.length; i++) {
    if (props.getProperty('PRAYED_' + prayersList[i]) !== islamicDateStr) {
      isPerfectDay = false;
      break;
    }
    var pts = parseInt(props.getProperty('PRAYER_PTS_' + prayersList[i] + '_' + islamicDateStr) || "0");
    var isExempt = props.getProperty('SLEEP_EXEMPT_' + prayersList[i] + '_' + islamicDateStr) === "true";
    if (pts < 7 && !isExempt) { // Qadaa or very late (2 or 5 points) breaks the Perfect Day
      isPerfectDay = false;
      break;
    }
  }

  if (isPerfectDay) {
    var lastComplete = props.getProperty('PRAYER_STREAK_LAST');
    if (lastComplete !== islamicDateStr) {
      var streak = parseInt(props.getProperty('PRAYER_STREAK') || "0");
      var now = new Date();
      var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      var yesterdayStr = Utilities.formatDate(yesterday, "GMT+3", "yyyy-MM-dd");

      if (lastComplete === yesterdayStr) {
        streak++;
      } else {
        streak = 1;
      }

      props.setProperty('PRAYER_STREAK', streak.toString());
      props.setProperty('PRAYER_STREAK_LAST', islamicDateStr);

      var maxStreak = parseInt(props.getProperty('MAX_PRAYER_STREAK') || "0");
      if (streak > maxStreak) {
        props.setProperty('MAX_PRAYER_STREAK', streak.toString());
      }

      if (streak === 3) addMedal("ÙˆØ³Ø§Ù… Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø­Ø¯ÙŠØ¯ÙŠ ðŸ•Œ", chatId);
      if (streak === 7) addMedal("Ù†Ø¬Ù…Ø© Ø§Ù„ÙØ¬Ø± ðŸŒŸ", chatId);
      if (streak === 30) addMedal("Ø¯Ø±Ø¹ Ø§Ù„Ù…ØµÙ„ÙŠÙ† Ø§Ù„Ø£Ø³Ø·ÙˆØ±ÙŠ ðŸ•‹", chatId);

      var msg = "ðŸŒŸ **ÙŠÙˆÙ… Ø°Ù‡Ø¨ÙŠ Ù…ÙƒØªÙ…Ù„!** Ù„Ù‚Ø¯ Ø£ÙƒÙ…Ù„Øª Ø¬Ù…ÙŠØ¹ Ø§Ù„ØµÙ„ÙˆØ§Øª Ø§Ù„Ø®Ù…Ø³ Ù„Ù„ÙŠÙˆÙ…. Ø³ØªØ±ÙŠÙƒ Ø§Ù„ØµÙ„ÙˆØ§Øª Ø§Ù„Ø­Ø§Ù„ÙŠ: *" + streak + "* ÙŠÙˆÙ… Ù…ØªØªØ§Ù„ÙŠ ðŸ¦…";

      // Ù†Ø¸Ø§Ù… Ø§Ù„Ø¯Ø±ÙˆØ¹ (Shields) - Ø¯Ø±Ø¹ Ù„ÙƒÙ„ 7 Ø£ÙŠØ§Ù… ØµÙ„ÙˆØ§Øª Ù…ØªØªØ§Ù„ÙŠØ© (ÙŠÙˆÙ… Ø°Ù‡Ø¨ÙŠ)
      if (streak % 7 === 0) {
        var shields = parseInt(props.getProperty('SHIELDS') || "0");
        if (shields < 3) {
          shields++;
          props.setProperty('SHIELDS', shields.toString());
          msg += "\n\nðŸ›¡ï¸ **Ø­ØµÙ„Øª Ø¹Ù„Ù‰ Ø¯Ø±Ø¹ Ø­Ù…Ø§ÙŠØ©!** Ù„Ø§Ù„ØªØ²Ø§Ù…Ùƒ 7 Ø£ÙŠØ§Ù… Ù…ØªØªØ§Ù„ÙŠØ© Ø¨Ø§Ù„ØµÙ„ÙˆØ§Øª Ø§Ù„Ø®Ù…Ø³. Ø§Ù„Ø¯Ø±ÙˆØ¹ Ø§Ù„Ø­Ø§Ù„ÙŠØ©: " + shields + "/3.";
        } else {
          msg += "\n\nðŸ›¡ï¸ Ø­Ø§ÙØ¸Øª Ø¹Ù„Ù‰ Ø§Ù„ØªØ²Ø§Ù…ÙƒØŒ ÙˆØ­Ù‚ÙŠØ¨Ø© Ø¯Ø±ÙˆØ¹Ùƒ Ù…Ù…ØªÙ„Ø¦Ø© Ù„Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ (3/3). Ø£Ù†Øª Ø¬Ø§Ù‡Ø² Ù„Ø£ÙŠ Ø·ÙˆØ§Ø±Ø¦!";
        }
      }

      sendMessage(chatId, msg);
      checkHiddenAchievements(props, chatId, getPoints());
    }
  }
}

function checkHiddenAchievements(props, chatId, p) {
  var streak = parseInt(props.getProperty('PRAYER_STREAK') || "0");
  var days   = getStreakDays();

  // --- Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø®Ù…Ø§Ø³ÙŠØ© ---
  if (streak === 5) addMedal("ðŸ–ï¸ Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø®Ù…Ø§Ø³ÙŠØ©", chatId);

  // --- Ù…Ù„ÙŠÙˆÙ†ÙŠØ± Ø§Ù„Ø­Ø³Ù†Ø§Øª ---
  if (p >= 5000 && !props.getProperty('S_MILLIONAIRE')) {
    addMedal("ðŸ’° Ù…Ù„ÙŠÙˆÙ†ÙŠØ± Ø§Ù„Ø­Ø³Ù†Ø§Øª", chatId);
    props.setProperty('S_MILLIONAIRE', "1");
  }

  // --- Ø§Ù„ØµØ§Ù…Ø¯ Ø§Ù„Ù„ÙŠÙ„ÙŠ: ØµÙ…ÙˆØ¯ 100 ÙŠÙˆÙ… ---
  if (days >= 100 && !props.getProperty('S_100DAYS')) {
    props.setProperty('S_100DAYS', "1");
    sendMessage(chatId,
      "ðŸŒ‘ *Ø­Ø¯Ø« ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹...*\n\n" +
      "Ø§Ù„Ø³ÙŠØ³ØªÙ… Ø±ØµØ¯ Ø´ÙŠØ¦Ø§Ù‹ Ù„Ù… ÙŠØ±Ù‡ Ù…Ù† Ù‚Ø¨Ù„.\n" +
      "100 ÙŠÙˆÙ… Ù…Ù† Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ù…ØªÙˆØ§ØµÙ„.\n\n" +
      "âš¡ *[ØªÙ… ÙØªØ­ Ù…Ù„Ù Ø³Ø±ÙŠ Ù…Ù† Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©]*\n" +
      "ã€Ž Ù„Ø§ ÙŠÙØ¹Ø·Ù‰ Ù‡Ø°Ø§ Ø§Ù„ÙˆØ³Ø§Ù… Ø¥Ù„Ø§ Ù„Ù…Ù† ØªØ¬Ø§ÙˆØ² Ø­Ø§Ø¬Ø² Ø§Ù„Ù…Ø¦Ø©. ã€\n\n" +
      "ðŸŽ–ï¸ ÙˆØ³Ø§Ù… *Ø§Ù„ØµØ§Ù…Ø¯ Ø§Ù„Ù„ÙŠÙ„ÙŠ* â€” Ù…Ø­ÙÙˆØ± ÙÙŠ Ø³Ø¬Ù„Ø§Øª Camp Zero Ø¥Ù„Ù‰ Ø§Ù„Ø£Ø¨Ø¯."
    );
  }

  // --- Ø§Ø¨Ù† Ø§Ù„ÙØ¬Ø±: 21 ÙŠÙˆÙ… ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡ Ù…ØªØªØ§Ù„ÙŠØ© ---
  var fajrCount = parseInt(props.getProperty('FAJR_ONTIME_COUNT') || "0");
  if (fajrCount >= 21 && !props.getProperty('S_FAJR21')) {
    props.setProperty('S_FAJR21', "1");
    sendMessage(chatId,
      "ðŸŒ… *Ø±Ø³Ø§Ù„Ø© Ù…Ù† Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø§Ù„Ø¹Ù„ÙŠØ§...*\n\n" +
      "Ù…Ù†Ø° 21 ÙŠÙˆÙ…Ø§Ù‹ ÙˆØ£Ù†Øª Ø£ÙˆÙ„ Ù…Ù† ÙŠØµØ§ÙØ­ Ø§Ù„Ù†ÙˆØ±.\n" +
      "Ø§Ù„Ø¹Ù„Ù… ÙŠÙ‚ÙˆÙ„ Ø¥Ù† Ø§Ù„Ù€ 21 ÙŠÙˆÙ… ÙŠÙØ´ÙƒÙ‘Ù„ Ø¹Ø§Ø¯Ø© Ù„Ø§ ØªÙÙƒØ³Ø±.\n\n" +
      "Ø£Ù†Øª Ø§Ù„Ø¢Ù† *Ø§Ø¨Ù† Ø§Ù„ÙØ¬Ø±*.\n" +
      "Ù…Ù† ÙƒØ§Ù† Ù„Ù‡ ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø± ÙÙ„Ù‡ Ø§Ù„Ù†Ù‡Ø§Ø± ÙƒÙ„Ù‡. ðŸ¦…"
    );
  }

  // --- Ø§Ù„ØªØ§Ø¦Ø¨ Ø§Ù„ØµØ§Ø¯Ù‚: Ø£ÙˆÙ„ ØµÙ…ÙˆØ¯ Ø¨Ø¹Ø¯ Ø§Ù†ØªÙƒØ§Ø³Ø© ÙŠØªØ¬Ø§ÙˆØ² 30 ÙŠÙˆÙ… ---
  var shameCount = safeParse(props.getProperty('WALL_OF_SHAME'), []).length;
  if (shameCount > 0 && days >= 30 && !props.getProperty('S_TRUE_REPENT')) {
    props.setProperty('S_TRUE_REPENT', "1");
    sendMessage(chatId,
      "ðŸ•Šï¸ *Ø¥Ø´Ø¹Ø§Ø± Ù†Ø§Ø¯Ø±...*\n\n" +
      "Ø¨Ø¹Ø¯ ÙƒÙ„ Ø§Ù†ÙƒØ³Ø§Ø±... 30 ÙŠÙˆÙ… ØµÙ…ÙˆØ¯.\n" +
      "Ù‡Ø°Ø§ Ø£ØµØ¹Ø¨ Ø¨ÙƒØ«ÙŠØ± Ù…Ù† Ù„Ù… ÙŠØ³Ù‚Ø· Ø£ØµÙ„Ø§Ù‹.\n\n" +
      "ã€Ž Ø§Ù„Ù…Ø¤Ù…Ù† Ø§Ù„Ø°ÙŠ ÙŠÙØ°Ù†Ø¨ ÙˆÙŠØªÙˆØ¨ Ø®ÙŠØ± Ù…Ù…Ù† Ù„Ø§ ÙŠÙØ°Ù†Ø¨ ÙˆÙŠØ¹Ø¬Ø¨ ã€\n\n" +
      "Ø£Ù†Øª *Ø§Ù„ØªØ§Ø¦Ø¨ Ø§Ù„ØµØ§Ø¯Ù‚*. ÙˆØ³Ø§Ù…Ùƒ Ù…ÙƒØªÙˆØ¨ ÙÙŠ Ù…ÙƒØ§Ù† Ø£Ø¹Ù„Ù‰ Ù…Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¨ÙˆØª. ðŸŒ¿"
    );
  }

  // --- ÙˆØ³Ø§Ù… Ø§Ù„ØµÙ…Øª: Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¨ÙˆØª 7 Ø£ÙŠØ§Ù… Ù…ØªØªØ§Ù„ÙŠØ© Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø®ØµÙ… ÙŠØ¯ÙˆÙŠ ---
  var lastPenalty = props.getProperty('LAST_MANUAL_DEDUCT_DATE');
  var sevenDaysAgo = Utilities.formatDate(new Date(new Date().getTime() - 7*24*60*60*1000), "GMT+3", "yyyy-MM-dd");
  if (days >= 7 && (!lastPenalty || lastPenalty < sevenDaysAgo) && !props.getProperty('S_SILENCE')) {
    props.setProperty('S_SILENCE', "1");
    sendMessage(chatId,
      "ðŸ”‡ *ÙƒØ´Ù Ø³Ø±ÙŠ...*\n\n" +
      "7 Ø£ÙŠØ§Ù… ÙƒØ§Ù…Ù„Ø© Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø¹Ù‚ÙˆØ¨Ø© Ø£Ùˆ Ø®ØµÙ….\n" +
      "Ù„Ø§ Ø¥Ù†Ø°Ø§Ø±Ø§Øª. Ù„Ø§ Ø³Ù‚ÙˆØ·. Ù„Ø§ ØªØ±Ø§Ø¬Ø¹.\n\n" +
      "Ù‡Ø°Ù‡ Ù‡ÙŠ Ø§Ù„Ù‚ÙˆØ© Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© â€” Ù„ÙŠØ³Øª Ø§Ù„Ø§Ù†ØªØµØ§Ø± Ø§Ù„Ù…Ø²Ø¹ÙˆÙ…ØŒ\n" +
      "Ø¨Ù„ Ø§Ù„ØµÙ…Øª Ø§Ù„Ø«Ø§Ø¨Øª Ø§Ù„Ù„ÙŠ Ù…Ø§ Ø­Ø¯Ø´ ÙŠØ±Ø§Ù‡.\n\n" +
      "ðŸ… *ÙˆØ³Ø§Ù… Ø§Ù„ØµÙ…Øª Ø§Ù„Ø­Ø¯ÙŠØ¯ÙŠ* â€” Ù„Ù„Ø°ÙŠÙ† ÙŠØ¹ÙŠØ´ÙˆÙ† Ø§Ù„Ø§Ù†Ø¶Ø¨Ø§Ø· Ø¨Ø¯ÙˆÙ† ØªØµÙÙŠÙ‚. âš”ï¸"
    );
  }

  // --- ÙˆØ³Ø§Ù… Ø§Ù„Ø´Ø¨Ø­: 14 ÙŠÙˆÙ… Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø®ØµÙ… Ù…Ù† Ù†Ù‚Ø§Ø· Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… ---
  if (days >= 14 && !props.getProperty('S_GHOST')) {
    props.setProperty('S_GHOST', "1");
    addMedal("ðŸ‘» ÙˆØ³Ø§Ù… Ø§Ù„Ø´Ø¨Ø­", chatId);
    sendMessage(chatId, "Ø£Ù†Øª Ø§Ù„Ø¢Ù† ØºÙŠØ± Ù…Ø±Ø¦ÙŠ Ù„Ù„Ø³ÙŠØ³ØªÙ….. 14 ÙŠÙˆÙ… Ù…Ù† Ø§Ù„Ø§Ù†Ø¶Ø¨Ø§Ø· Ø§Ù„ÙƒØ§Ù…Ù„ ÙˆØ§Ù„ÙƒÙ…Ø§Ù„. Ø£Ù†Øª *Ø´Ø¨Ø­* Ø§Ù„Ù…Ø¹Ø³ÙƒØ±. ðŸŽ–ï¸");
  }
}

function sendWeeklySummary(chatId, props) {
  var currentP = parseInt(props.getProperty('POINTS') || "0");
  var shameThisWeek = safeParse(props.getProperty('WALL_OF_SHAME'), []).length;
  var onTime = parseInt(props.getProperty('WEEKLY_ON_TIME_COUNT') || "0");
  var qadaa = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
  var totalPrayers = onTime + qadaa;
  var percentage = totalPrayers === 0 ? 0 : Math.floor((onTime / totalPrayers) * 100);
  
  var ghostData = { percentage: percentage, shameCount: shameThisWeek };
  props.setProperty('LAST_WEEK_STATS', JSON.stringify(ghostData));

  var msg = "ðŸ“… **Ø­ØµØ§Ø¯ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹:**\n\n";
  msg += "ðŸ“ˆ Ù†Ù‚Ø§Ø·Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠØ©: " + currentP + "\n";
  msg += "âœ… ØµÙ„ÙˆØ§Øª ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§: " + onTime + "\n";
  msg += "âŒ ØµÙ„ÙˆØ§Øª Ù‚Ø¶Ø§Ø¡: " + qadaa + "\n";
  msg += "ðŸ“‰ Ù…Ø¹Ø¯Ù„ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù…: " + percentage + "%\n\n";

  if (percentage >= 90) {
    msg += "Ø£Ø¯Ø§Ø¡ Ù…Ù…ØªØ§Ø²! Ø§Ø³ØªÙ…Ø± ÙŠØ§ Ø¨Ø·Ù„ ðŸ”¥";
  } else if (percentage >= 50) {
    msg += "Ø£Ø¯Ø§Ø¡ Ù…ØªÙˆØ³Ø·.. ØªÙ‚Ø¯Ø± ØªØ¹Ù…Ù„ Ø£Ø­Ø³Ù† Ù…Ù† ÙƒØ¯Ù‡ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ø¬Ø§ÙŠ ðŸ’ª";
  } else {
    msg += "ØªØ±Ø§Ø¬Ø¹ Ù…Ù„Ø­ÙˆØ¸.. Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ù…Ø³ØªÙ†ÙŠØ© Ù…Ù†Ùƒ Ø§Ù„ØªØ²Ø§Ù… Ø£Ù‚ÙˆÙ‰ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø¯Ù‡ âš”ï¸";
  }

  props.setProperty('WEEKLY_ON_TIME_COUNT', "0");
  props.setProperty('WEEKLY_QADAA_COUNT', "0");

  sendMessage(chatId, msg);
}

// ---------------------------
// Main Logic
// ---------------------------
function handleMessage(message) {
  var text = message.text || "";
  var chatId = message.chat.id;
  var props = PropertiesService.getScriptProperties();

  var adminChatId = props.getProperty('ADMIN_CHAT_ID');
  if (!adminChatId) {
    props.setProperty('ADMIN_CHAT_ID', chatId.toString());
    adminChatId = chatId.toString();
    sendMessage(chatId, "ðŸ”’ **ØªÙ… Ø§Ù„ØªØ£Ù…ÙŠÙ†:** ØªÙ… ØªØ¹ÙŠÙŠÙ†Ùƒ ÙƒÙ‚Ø§Ø¦Ø¯ Ø§Ù„Ù…Ø¹Ø³ÙƒØ± Ø§Ù„Ø£ÙˆØ­Ø¯ (Single-user). Ù„Ù† ÙŠØ³ØªØ¬ÙŠØ¨ Ø§Ù„Ø¨ÙˆØª Ù„Ø£ÙŠ Ø´Ø®Øµ Ø¢Ø®Ø± ØºÙŠØ±Ùƒ.");
  } else if (adminChatId !== chatId.toString()) {
    sendMessage(chatId, "âš ï¸ Ù‡Ø°Ø§ Ø§Ù„Ù…Ø¹Ø³ÙƒØ± Ø¹Ø³ÙƒØ±ÙŠ ÙˆØ®Ø§Øµ. Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ ØªØµØ±ÙŠØ­ Ø¨Ø§Ù„Ø¯Ø®ÙˆÙ„.");
    return;
  }

  props.setProperty('CHAT_ID', chatId.toString());
  if (message.from && message.from.username) {
    props.setProperty('USERNAME', "@" + message.from.username);
  }

  var isSleepMode = props.getProperty('IS_SLEEP_MODE') === "true";
  if (isSleepMode) {
    props.setProperty('IS_SLEEP_MODE', "false");
    props.setProperty('EMERGENCY_MODE', "false");
    props.setProperty('SLEEP_GRACE_UNTIL', (new Date().getTime() + 15 * 60 * 1000).toString());
    sendMessage(chatId, "â˜€ï¸ ØµØ¨Ø§Ø­ Ø§Ù„Ù†ØµØ±! ØªÙ… Ø±ØµØ¯ Ù†Ø´Ø§Ø· Ù…Ù†Ùƒ ÙˆØ¥Ù„ØºØ§Ø¡ ÙˆØ¶Ø¹ Ø§Ù„Ø³Ø¨Ø§Øª.\nÙ…Ø¹Ø§Ùƒ 15 Ø¯Ù‚ÙŠÙ‚Ø© ØªØ³Ø¬Ù„ ÙÙŠÙ‡Ù… ØµÙ„ÙˆØ§ØªÙƒ Ø§Ù„Ù„ÙŠ ÙØ§ØªØªÙƒ ÙˆÙ‡ØªØªØ­Ø³Ø¨ Ù‚Ø¶Ø§Ø¡ Ø¨Ø¹Ø°Ø± (Ù…Ø´ Ù‡ØªÙƒØ³Ø± Ø§Ù„Ø³ØªØ±ÙŠÙƒ) âš”ï¸");
  }

  if (text === "/sleep" || text === "Ø·" || text === "z") {
    props.setProperty('EMERGENCY_MODE', "true");
    props.setProperty('IS_SLEEP_MODE', "true");
    props.setProperty('SLEEP_GRACE_UNTIL', "0");
    sendMessage(chatId, "Ø¹Ù„Ù… ÙˆÙŠÙ†ÙØ°. ØªÙ… ØªÙØ¹ÙŠÙ„ ÙˆØ¶Ø¹ Ø§Ù„Ø³Ø¨Ø§Øª (Ø·ÙˆØ§Ø±Ø¦ Ø§Ù„Ù†ÙˆÙ…) Ø¨Ø¶ØºØ·Ø© ÙˆØ§Ø­Ø¯Ø©. Ø§Ù„Ø¹Ø¯Ø§Ø¯ ÙˆÙ‚Ù Ø§Ù„Ù„Ø­Ø¸Ø© Ø¯ÙŠ. ØªØµØ¨Ø­ Ø¹Ù„Ù‰ Ø®ÙŠØ± ÙŠØ§ ÙˆØ­Ø´! ðŸ«¡\n(Ø§Ù„Ø³Ø¨Ø§Øª Ù…ÙØ¹Ù„ ðŸ’¤)");
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(parseInt(props.getProperty('POINTS') || "0")));
    return;
  }

  if (!text) {
    sendMenu(chatId, "Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø¨ØªØ³ØªÙ‚Ø¨Ù„ Ø§Ù„Ù†ØµÙˆØµ ÙˆØ§Ù„Ø£ÙˆØ§Ù…Ø± ÙÙ‚Ø· ðŸŽ–ï¸", getKeyboard(getPoints()));
    return;
  }

  var p = getPoints();
  var islamicDateStr = getIslamicDateStr();
  var isEmergency = (props.getProperty('EMERGENCY_MODE') === "true");

  if (text === "/start") {
    var hour = parseInt(Utilities.formatDate(new Date(), "GMT+3", "HH"));
    var dayOfWeek = Utilities.formatDate(new Date(), "GMT+3", "u");
    var greeting = "";
    if (dayOfWeek === "5") {
      greeting = "Ø¬Ù…Ø¹Ø© Ù…Ø¨Ø§Ø±ÙƒØ© ÙŠØ§ ÙˆØ­Ø´! ðŸŒ¿ Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡ Ø§Ù„Ø­Ø³Ù†Ø§Øª Ù…Ø¶Ø§Ø¹ÙØ©. Ø§Ø³ØªØºÙ„Ù‡Ø§.";
    } else if (hour >= 3 && hour < 6) {
      greeting = "ØµØ§Ø­ÙŠ ÙÙŠ Ø¬ÙˆÙ Ø§Ù„Ù„ÙŠÙ„... Ø§Ù„Ù„Ù‡ ÙŠØ±Ø§Ùƒ Ø¯Ù„ÙˆÙ‚ØªÙŠ. ðŸŒ™";
    } else if (hour >= 6 && hour < 12) {
      greeting = "ØµØ¨Ø§Ø­ Ø§Ù„Ù†ØµØ±! âš˜ï¸ ÙŠØ§Ù„Ø§ Ù†Ø¨Ø¯Ø£ Ø§Ù„ÙŠÙˆÙ… Ø¨Ù‚ÙˆØ©.";
    } else if (hour >= 12 && hour < 17) {
      greeting = "Ù†Øµ Ø§Ù„Ù…Ø¹Ø±ÙƒØ©. ÙƒÙ…Ù„ Ø¨Ø«Ø¨Ø§Øª. âš”ï¸";
    } else if (hour >= 17 && hour < 21) {
      greeting = "Ù‚Ø±Ø¨Øª ØªØ®ØªÙ… ÙŠÙˆÙ… ØªØ§Ù†ÙŠ Ø¨Ø§Ù†ØªØµØ§Ø±. ðŸ¦…";
    } else {
      greeting = "Ø§Ù„Ù„ÙŠÙ„ ÙˆÙ‚Øª Ø§Ù„Ø®Ø·Ø±. Ø®Ù„ÙŠÙƒ ØµØ§Ø­ÙŠ. ðŸ›¡ï¸";
    }
    sendMenu(chatId, greeting, getKeyboard(p));
    return;
  }

  if (text === "/help") {
    var helpText = "âš”ï¸ *Ø£ÙˆØ§Ù…Ø± Camp Zero Ø§Ù„Ø³Ø±ÙŠØ©:*\n\n" +
      "/start â€” ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¨ÙˆØª ÙˆØ¹Ø±Ø¶ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©\n" +
      "/fix â€” Ù…Ø³Ø­ cache Ø§Ù„ØµÙ„ÙˆØ§Øª ÙÙŠ Ø­Ø§Ù„Ø© Ø£ÙŠ Ø¨Ù‚\n" +
      "/apology â€” ØªØ¹ÙˆÙŠØ¶ ØªÙ‚Ù†ÙŠ (Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø·)\n" +
      "/call @username â€” Ø¨Ø¹Øª Ø§ØªØµØ§Ù„ ØµÙˆØªÙŠ Ø¹Ø¨Ø± CallMeBot\n" +
      "/mystats â€” Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª ØªÙØµÙŠÙ„ÙŠØ©\n" +
      "/history â€” Ø¢Ø®Ø± Ø­Ø±ÙƒØ§Øª Ø§Ù„Ù†Ù‚Ø§Ø·\n" +
      "/backup â€” Ø­ÙØ¸ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù…Ù† Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ø¹Ù„Ù‰ Google Sheet\n" +
      "/restore â€” Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø¢Ø®Ø± Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©\n" +
      "/help â€” Ù‡Ø°Ù‡ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©\n\n" +
      "ðŸ’¡ Ù…Ù„Ø§Ø­Ø¸Ø©: Ø¨Ø¹Ø¶ Ø§Ù„Ø£Ø²Ø±Ø§Ø± Ø¨ØªØ¸Ù‡Ø± Ø¨Ø³ Ù„Ùˆ ÙˆØµÙ„Øª Ø­Ø¯ Ù†Ù‚Ø§Ø· Ù…Ø¹ÙŠÙ†.";
    sendMessage(chatId, helpText);
    return;
  }

  if (text === "ØªÙ… Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© âœ…") {
    var opStatus = props.getProperty('WEEKLY_OP_STATUS');
    if (opStatus === "DONE") {
      sendMessage(chatId, "Ø¥Ù†Ø¬Ø²Øª Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ù…Ù† Ù‚Ø¨Ù„ ÙŠØ§ Ø¨Ø·Ù„! Ø§Ø³ØªØ¹Ø¯ Ù„Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù‚Ø§Ø¯Ù… ðŸ¦…");
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(p));
    } else if (opStatus === "PENDING") {
      props.setProperty('WEEKLY_OP_STATUS', "DONE");
      var newP = addPoints(200);
      addMedal("ðŸŽ–ï¸ ÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ©", chatId);
      sendMessage(chatId, "Ø¹Ø§Ø´ ÙŠØ§ Ø£Ø³Ø·ÙˆØ±Ø©! 200 Ù†Ù‚Ø·Ø© ÙˆÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© âœ…\nØ±ØµÙŠØ¯Ùƒ: " + newP);
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(newP));
    } else {
      sendMenu(chatId, "Ù…ÙÙŠØ´ Ø¹Ù…Ù„ÙŠØ© Ù†Ø´Ø·Ø© Ø¯Ù„ÙˆÙ‚ØªÙŠ.", getKeyboard(p));
    }
    return;
  }

  if (text === "/mystats") {
    var onTime = parseInt(props.getProperty('WEEKLY_ON_TIME_COUNT') || "0");
    var qadaa = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
    var totalPrayers = onTime + qadaa;
    var percentage = totalPrayers === 0 ? 0 : Math.floor((onTime / totalPrayers) * 100);

    var vaultArr = safeParse(props.getProperty('VICTORY_VAULT'), []);
    var vCount = vaultArr.length;

    var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);
    var fCount = shameArr.length;

    var maxStreak = props.getProperty('MAX_PRAYER_STREAK') || "0";
    var pb = props.getProperty('PERSONAL_BEST_STREAK') || "0";
    var shields = props.getProperty('SHIELDS') || "0";
    var fajrCount = props.getProperty('FAJR_ONTIME_COUNT') || "0";

    var stats = "ðŸ“Š **Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠ (My Stats):**\n\n";
    stats += "âœ… ØµÙ„ÙˆØ§Øª ÙÙŠ ÙˆÙ‚ØªÙ‡Ø§ (Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹): " + onTime + "\n";
    stats += "âŒ ØµÙ„ÙˆØ§Øª Ù‚Ø¶Ø§Ø¡ (Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹): " + qadaa + "\n";
    stats += "ðŸ“ˆ Ù†Ø³Ø¨Ø© Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ: " + percentage + "%\n\n";
    
    var lastWeekStats = props.getProperty('LAST_WEEK_STATS');
    if (lastWeekStats) {
       try {
           var lw = JSON.parse(lastWeekStats);
           stats += "ðŸ‘» **Ø´Ø¨Ø­ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù…Ø§Ø¶ÙŠ:**\n";
           stats += "Ù†Ø³Ø¨Ø© Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… ÙƒØ§Ù†Øª: " + (lw.percentage || 0) + "% | Ø§Ù„Ø®Ø²ÙŠ: " + (lw.shameCount || 0) + "\n\n";
       } catch(e) {}
    }
    
    stats += "ðŸ† Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: " + vCount + "\n";
    stats += "ðŸ“‰ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø³Ù‚Ø·Ø§Øª ÙÙŠ Ø³Ø¬Ù„ Ø§Ù„Ø®Ø²ÙŠ: " + fCount + "\n";
    stats += "ðŸ”¥ Ø£Ø·ÙˆÙ„ Ø³ØªØ±ÙŠÙƒ ØµÙ„ÙˆØ§Øª Ù…ØªØªØ§Ù„ÙŠØ©: " + maxStreak + " ÙŠÙˆÙ…\n";
    stats += "ðŸ‘‘ Ø£Ø¹Ù„Ù‰ ØµÙ…ÙˆØ¯ (PB): " + pb + " ÙŠÙˆÙ…\n";
    stats += "ðŸ›¡ï¸ Ø§Ù„Ø¯Ø±ÙˆØ¹ Ø§Ù„Ù…ØªØ§Ø­Ø©: " + shields + "/3\n";
    stats += "ðŸŒ… Ù…Ø±Ø§Øª Ø§Ù„ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡: " + fajrCount + " Ù…Ø±Ø©\n";
    stats += getFortyChallengeText(props) + "\n";
    stats += "ðŸ’Ž Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‚Ø§Ø· Ø§Ù„Ø­Ø§Ù„ÙŠ: " + p + " Ù†Ù‚Ø·Ø©\n";

    sendMenu(chatId, stats, getKeyboard(p));
    return;
  }

  if (text === "/fix") {
    var fixKey = 'FIX_USED_' + islamicDateStr;
    if (props.getProperty(fixKey) === "true") {
      sendMessage(chatId, "âŒ Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ØªØ±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨: Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù‡Ø°Ø§ Ø§Ù„Ø£Ù…Ø± Ø³ÙˆÙ‰ Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ÙŠÙˆÙ…ÙŠØ§Ù‹ Ù„Ù…Ù†Ø¹ Ø§Ù„ØªÙ„Ø§Ø¹Ø¨.");
      return;
    }

    var prayersToClear = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];
    for (var i = 0; i < prayersToClear.length; i++) {
      props.deleteProperty('PRAYED_' + prayersToClear[i]);
    }

    props.setProperty(fixKey, "true");
    logToSheet("FIX_USED", islamicDateStr);

    sendMessage(chatId, "ØªÙ… Ù…Ø³Ø­ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ù…Ø¹Ù„Ù‚ Ù„Ù„ØµÙ„ÙˆØ§Øª Ø¨Ù†Ø¬Ø§Ø­ ðŸ§¹. Ø§Ù„ÙƒÙŠØ¨ÙˆØ±Ø¯ Ù‡ÙŠØ±Ø¬Ø¹ ÙŠØ¸Ù‡Ø±Ù„Ùƒ ÙƒÙ„ Ø§Ù„ØµÙ„ÙˆØ§Øª Ø§Ù„Ù„ÙŠ ÙˆÙ‚ØªÙ‡Ø§ Ø¯Ø®Ù„. (ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… ÙÙŠ Ø§Ù„Ø³Ø¬Ù„Ø§Øª ðŸš¨)");
    return;
  }

  if (text === "/history") {
    var historyArr = safeParse(props.getProperty('POINTS_HISTORY'), []);
    if (historyArr.length === 0) {
      sendMessage(chatId, "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³Ø¬Ù„ Ù„Ù„Ù†Ù‚Ø§Ø· Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.");
      return;
    }
    var hText = "ðŸ“œ **Ø³Ø¬Ù„ Ø§Ù„Ù†Ù‚Ø§Ø· Ø§Ù„Ø£Ø®ÙŠØ±:**\n\n";
    for (var i = 0; i < historyArr.length; i++) {
      var h = historyArr[i];
      var sign = h.change > 0 ? "+" : "";
      var emoji = h.change > 0 ? "ðŸŸ¢" : "ðŸ”´";
      hText += emoji + " [" + h.timestamp + "] " + h.reason + ": " + sign + h.change + " (Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: " + h.total + ")\n";
    }
    sendMessage(chatId, hText);
    return;
  }

  if (text === "/apology") {
    var hasApology = props.getProperty('APOLOGY_CLAIMED');
    if (hasApology) {
      sendMessage(chatId, "Ø£Ù„Ø§Ø¹ÙŠØ¨ Ø§Ù„Ù…Ø¹Ø³ÙƒØ± Ø¯ÙŠ Ù…ØªØ¹Ù…Ù„Ù‡Ø§Ø´ Ø¹Ù„ÙŠØ§ ÙŠØ§ ÙˆØ­Ø´! Ø§Ù„ØªØ¹ÙˆÙŠØ¶ Ø¨ÙŠØªØµØ±Ù Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© Ø¨Ø³ ðŸ¦…");
      return;
    }
    props.setProperty('APOLOGY_CLAIMED', 'true');
    var newP = addPoints(20);
    sendMessage(chatId, "ØªØ¹ÙˆÙŠØ¶ Ù…Ù† Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø¹Ù† Ø§Ù„Ø®Ø·Ø£ Ø§Ù„ØªÙ‚Ù†ÙŠ ðŸŽ–ï¸: ØªÙ… Ø¥Ø±Ø¬Ø§Ø¹ Ø§Ù„Ù€ 20 Ù†Ù‚Ø·Ø©. Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: " + newP);
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(newP));
    return;
  }

  if (text === "/backup") {
    try {
      var backupInfo = backupProperties(props);
      sendMessage(chatId, "âœ… *ØªÙ… Ø­ÙØ¸ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­!*\n\nØªÙ… ØªØµØ¯ÙŠØ± " + backupInfo.count + " Ø³Ø¬Ù„ Ø¥Ù„Ù‰ ÙˆØ±Ù‚Ø© Backup ÙÙŠ Google Sheets.\nØªØ§Ø±ÙŠØ® Ø§Ù„Ù†Ø³Ø®: " + backupInfo.date);
    } catch (e) {
      sendMessage(chatId, "âŒ Ø­ØµÙ„ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ: " + e.message);
    }
    return;
  }

  if (text === "/restore") {
    try {
      var restored = restoreProperties(props);
      sendMessage(chatId, "âœ… *ØªÙ… Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ù†Ø¬Ø§Ø­!*\n\nØªÙ… Ø§Ø³ØªÙŠØ±Ø§Ø¯ " + restored + " Ø³Ø¬Ù„ Ù…Ù† ÙˆØ±Ù‚Ø© Backup.\nØ§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø±Ø¬Ø¹Øª Ø²ÙŠ Ù…Ø§ ÙƒØ§Ù†Øª ÙˆÙ‚Øª Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ. ðŸ›¡ï¸");
    } catch (e) {
      sendMessage(chatId, "âŒ Ø­ØµÙ„ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©: " + e.message);
    }
    return;
  }

  if (text.indexOf("/call") === 0) {
    var parts = text.split(" ");
    if (parts.length < 2) {
      sendMessage(chatId, "Ø§ÙƒØªØ¨ Ø§Ù„Ø£Ù…Ø± ÙƒØ¯Ø©: \n`/call @YourUsername`");
      return;
    }
    var username = parts[1];
    if (!username.startsWith("@")) username = "@" + username;

    var callText = encodeURIComponent("Wake up hero, this is Camp Zero calling.");
    var callUrl = "https://api.callmebot.com/start.php?user=" + username + "&text=" + callText;

    try {
      var response = UrlFetchApp.fetch(callUrl);
      var responseText = response.getContentText();
      sendMessage(chatId, "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø£Ù…Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù†Ø¬Ø§Ø­ Ù„Ù€ " + username + "! ðŸ“ž\nØ±Ø¯ Ø§Ù„Ø³ÙŠØ±ÙØ±: " + responseText.substring(0, 50));
    } catch(e) {
      sendMessage(chatId, "Ø­ØµÙ„Øª Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„: " + e.toString());
    }
    return;
  }

  if (props.getProperty('AWAITING_VICTORY') === "true" && text !== "Ø¥Ù„ØºØ§Ø¡ âŒ") {
    var vaultArr = safeParse(props.getProperty('VICTORY_VAULT'), []);
    var dateStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd");
    vaultArr.push("[" + dateStr + "] " + text);
    if (vaultArr.length > 50) vaultArr.shift();
    props.setProperty('VICTORY_VAULT', JSON.stringify(vaultArr));
    props.setProperty('AWAITING_VICTORY', "false");

    var totalVic = parseInt(props.getProperty('TOTAL_VICTORIES') || "0") + 1;
    props.setProperty('TOTAL_VICTORIES', totalVic.toString());

    if (totalVic === 10) addMedal("Ø´Ø§Ø±Ø© Ø§Ù„Ù…Ù‚Ø§ÙˆÙ… Ø§Ù„ØµØ§Ù…Øª âš”ï¸", chatId);
    if (totalVic === 50) addMedal("Ù‚Ù„Ø§Ø¯Ø© Ø§Ù„Ù…Ù†ØªØµØ± Ø§Ù„Ø£ÙƒØ¨Ø± ðŸ†", chatId);

    var countKey = 'VICTORY_COUNT_' + islamicDateStr;
    var vCount = parseInt(props.getProperty(countKey) || "0");
    var earnedV = 0;
    if (vCount < 3) {
       earnedV = 10;
       props.setProperty(countKey, (vCount + 1).toString());
    }

    var newP = addPoints(earnedV);
    if (earnedV > 0) {
      sendMessage(chatId, "Ø¹Ø§Ø´ ÙŠØ§ Ø¨Ø·Ù„! ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ù†ØªØµØ§Ø± ÙÙŠ Ø§Ù„Ø®Ø²ÙŠÙ†Ø© ÙˆØ®Ø¯Øª 10 Ù†Ù‚Ø· Ù…ÙƒØ§ÙØ£Ø©.");
    } else {
      sendMessage(chatId, "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù†ØªØµØ§Ø±Ùƒ Ø§Ù„Ù…Ø¹Ù†ÙˆÙŠ ÙÙŠ Ø§Ù„Ø®Ø²ÙŠÙ†Ø©! (Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù†Ù‚Ø§Ø· Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª Ø§Ù„ÙŠÙˆÙ…ÙŠØ© 30 Ù†Ù‚Ø·Ø© ÙˆÙ‚Ø¯ ØªØ¬Ø§ÙˆØ²ØªÙ‡Ø§ ðŸ›¡ï¸).");
    }
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(newP));
    return;
  }

  var prayersList = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];

  if (prayersList.indexOf(text) !== -1) {
    var actualPrayer = text;
    var isPrayed = props.getProperty('PRAYED_' + actualPrayer) === islamicDateStr;
    if (!isPrayed) {
      var now = new Date();
      var currentTimeStr = Utilities.formatDate(now, "GMT+3", "HH:mm");
      var currentMinsRaw = parseTimeStr(currentTimeStr);
      var prayerTimes = getPrayerTimes();
      var fajrMins = getFajrMins();
      var currentAbs = getAbsoluteMins(currentMinsRaw, fajrMins);
      var prayerStartAbs = getAbsoluteMins(parseTimeStr(prayerTimes[actualPrayer]), fajrMins);

      if (currentAbs < prayerStartAbs) {
        sendMessage(chatId, "Ù„Ø³Ù‡ ÙˆÙ‚Øª ØµÙ„Ø§Ø© " + actualPrayer + " Ù…Ø§ Ø¯Ø®Ù„Ø´. Ø³Ø¬Ù„Ù‡Ø§ Ø£ÙˆÙ„ Ù…Ø§ ÙŠØ¤Ø°Ù† Ø¹Ø´Ø§Ù† Ø§Ù„Ø­Ø³Ø§Ø¨ ÙŠÙØ¶Ù„ Ø¯Ù‚ÙŠÙ‚ ðŸ•°ï¸");
        sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(p));
        return;
      }

      logToSheet("ØµÙ„Ø§Ø©", actualPrayer);
      props.setProperty('PRAYED_' + actualPrayer, islamicDateStr);

      var effectiveAbs = currentAbs;
      if (isEmergency && props.getProperty('EMERGENCY_START_DATE') === islamicDateStr) {
        var emergencyAbs = parseInt(props.getProperty('EMERGENCY_START_ABS') || currentAbs.toString());
        if (emergencyAbs < currentAbs) {
          effectiveAbs = emergencyAbs;
        }
      }

      var missedArr = getMissedPrayers(effectiveAbs, prayerTimes, props, islamicDateStr, fajrMins);
      var isPastWindow = isPrayerPastWindow(actualPrayer, effectiveAbs, prayerTimes, fajrMins);
      var earnedPoints = getPrayerPoints(actualPrayer, effectiveAbs, prayerTimes, isEmergency, missedArr, fajrMins);

      var graceUntil = parseInt(props.getProperty('SLEEP_GRACE_UNTIL') || "0");
      var isExempt = (new Date().getTime() < graceUntil);

      // Save prayer points for Perfect Day calculation
      props.setProperty('PRAYER_PTS_' + actualPrayer + '_' + islamicDateStr, earnedPoints.toString());

      // Update stats
      if (isPastWindow && !isEmergency && !isExempt) {
        var qCount = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
        props.setProperty('WEEKLY_QADAA_COUNT', (qCount + 1).toString());
      } else if (!isExempt) {
        var oCount = parseInt(props.getProperty('WEEKLY_ON_TIME_COUNT') || "0");
        props.setProperty('WEEKLY_ON_TIME_COUNT', (oCount + 1).toString());
      }

      var currentDayOfWeek = Utilities.formatDate(new Date(), "GMT+3", "u");
      var isFridayBonus = (currentDayOfWeek === "5" && earnedPoints >= 12);

      var multiplier = getStreakMultiplier();
      var finalPoints = Math.round(earnedPoints * multiplier);
      if (isFridayBonus) finalPoints *= 2;

      var newP = addPoints(finalPoints);

      if (actualPrayer === "Ø§Ù„ÙØ¬Ø±" && earnedPoints === 15 && !isEmergency) {
        var fCount = parseInt(props.getProperty('FAJR_ONTIME_COUNT') || "0");
        fCount++;
        props.setProperty('FAJR_ONTIME_COUNT', fCount.toString());
        if (fCount === 3) addMedal("ðŸ¥‰ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„Ø¨Ø±ÙˆÙ†Ø²ÙŠ", chatId);
        if (fCount === 10) addMedal("ðŸ¥ˆ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„ÙØ¶ÙŠ", chatId);
        if (fCount === 30) addMedal("ðŸ¥‡ Ø­Ø§Ø±Ø³ Ø§Ù„ÙØ¬Ø± Ø§Ù„Ø°Ù‡Ø¨ÙŠ", chatId);
        if (fCount === 90) addMedal("ðŸŒŒ Ø£Ø³Ø·ÙˆØ±Ø© Ø§Ù„ÙØ¬Ø±", chatId);

        // Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø«Ù„Ø« Ø§Ù„Ø£Ø®ÙŠØ± Ù…Ù† Ø§Ù„Ù„ÙŠÙ„
        var rawHour = parseInt(Utilities.formatDate(new Date(), "GMT+3", "HH"));
        var rawMin  = parseInt(Utilities.formatDate(new Date(), "GMT+3", "mm"));
        var totalNowMins = rawHour * 60 + rawMin;
        if ((totalNowMins >= 180 && totalNowMins <= 225) && !props.getProperty('S_THIRDNIGHT_' + islamicDateStr)) {
          props.setProperty('S_THIRDNIGHT_' + islamicDateStr, "1");
          sendMessage(chatId,
            "ðŸŒ‘ *Ø§Ù„Ø«Ù„Ø« Ø§Ù„Ø£Ø®ÙŠØ± Ù…Ù† Ø§Ù„Ù„ÙŠÙ„...*\n\n" +
            "ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù„Ø­Ø¸Ø© Ø¨Ø§Ù„Ø°Ø§ØªØŒ Ø§Ù„Ù„Ù‡ ÙŠÙ†Ø²Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø³Ù…Ø§Ø¡ Ø§Ù„Ø¯Ù†ÙŠØ§.\n" +
            "ÙŠÙ‚ÙˆÙ„: Ù…Ù† ÙŠØ¯Ø¹ÙˆÙ†ÙŠ ÙØ£Ø³ØªØ¬ÙŠØ¨ Ù„Ù‡ØŸ\n\n" +
            "ÙˆØ£Ù†Øª ÙƒÙ†Øª Ù…Ø³ØªÙŠÙ‚Ø¸Ø§Ù‹. ðŸ¤\n\n" +
            "Ù„Ø§ ÙŠØ¹Ù„Ù… Ù‡Ø°Ø§ Ø¥Ù„Ø§ Ø§Ù„Ù„Ù‡ ÙˆØ£Ù†Øª."
          );
        }
      }

      var extraMsg = "";
      if (isExempt) {
         props.setProperty('SLEEP_EXEMPT_' + actualPrayer + '_' + islamicDateStr, "true");
         if (earnedPoints <= 5) extraMsg = " (Ù‚Ø¶Ø§Ø¡ Ø¨Ø¹Ø°Ø± Ø§Ù„Ø³Ø¨Ø§Øª ðŸ’¤ - Ù„Ù† ÙŠÙƒØ³Ø± Ø§Ù„Ø³ØªØ±ÙŠÙƒ)";
      }

      if (extraMsg === "") {
        if (isEmergency) {
          extraMsg = " (Ø§Ù„Ù†Ù‚Ø§Ø· ÙƒØ§Ù…Ù„Ø© Ù„ÙˆØ¬ÙˆØ¯ Ø¹Ø°Ø± ðŸ›¡ï¸)";
        } else if (earnedPoints === 15) {
          extraMsg = " (Ø¹Ø§Ø´ Ø£Ø¨Ø·Ø§Ù„ Ø§Ù„ØªØ¨ÙƒÙŠØ± ðŸ”¥)";
        } else if (earnedPoints >= 12) {
          extraMsg = " (Ø­Ø§ÙˆÙ„ ØªØ¨Ø¯Ø± Ø§Ù„Ù…Ø±Ø© Ø§Ù„Ø¬Ø§ÙŠØ© âš¡)";
        } else if (earnedPoints >= 7) {
          extraMsg = " (Ù„Ø­Ù‚Øª Ù†ÙØ³Ùƒ Ø¨Ø£Ø¹Ø¬ÙˆØ¨Ø© â³)";
        } else {
          extraMsg = " (Ø§Ù„ØªØ£Ø®ÙŠØ± Ø¯Ù‡ Ø®Ø·Ø± Ø¬Ø¯Ø§Ù‹ âš ï¸)";
        }
      }

      if (multiplier > 1.0) {
        extraMsg += " (" + getMultiplierLabel() + ")";
      }
      if (isFridayBonus) {
        extraMsg += " (âœ¨ Ø¨ÙˆÙ†Øµ Ø§Ù„Ø¬Ù…Ø¹Ø© Ã—2)";
      }

      var countToday = countTodayPrayers(props, islamicDateStr);
      var prayerFlavor = getPrayerFlavor(props, actualPrayer, countToday);

      // ÙƒØ´Ù Ø£ÙˆÙ„ ØµÙ„Ø§Ø© Ø¨Ø¹Ø¯ Ø§Ù†ØªÙƒØ§Ø³Ø©
      var postRelapseMsg = "";
      if (props.getProperty('JUST_RELAPSED') === "true") {
        props.deleteProperty('JUST_RELAPSED');
        postRelapseMsg = "\n\nðŸ’š Ø¯ÙŠ Ø£ÙˆÙ„ ØµÙ„Ø§Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ø³Ù‚ÙˆØ·. ÙˆØ¯ÙŠ Ø£Ù‡Ù… Ø®Ø·ÙˆØ©. Ø§Ù„Ù„ÙŠ Ø¨ÙŠØ±Ø¬Ø¹ Ù„Ù„Ù‡ Ø¨Ø¹Ø¯ Ø§Ù„Ù…Ø¹ØµÙŠØ© Ù…Ø´ Ø¶Ø¹ÙŠÙØŒ Ø¯Ù‡ Ù…Ø­Ø§Ø±Ø¨ Ø­Ù‚ÙŠÙ‚ÙŠ.";
      }

      sendMessage(chatId, "ØªÙ… Ø¥Ù†Ø¬Ø§Ø² ØµÙ„Ø§Ø© " + text + " Ø¨Ù†Ø¬Ø§Ø­ ðŸ¦…! ØªÙ… Ø¥Ø¶Ø§ÙØ© " + finalPoints + " Ù†Ù‚Ø·Ø© " + extraMsg + prayerFlavor + "\nØ±ØµÙŠØ¯Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: " + newP + postRelapseMsg);
      runPulse(props, chatId, actualPrayer);
      updatePrayerStreak(islamicDateStr, props, chatId);
      sendMenu(chatId, "Ø§Ø³ØªØ¹Ø¯ Ù„Ù„ÙŠ Ø¨Ø¹Ø¯Ù‡Ø§. Ø§Ù„Ø²Ø±Ø§Ø± Ø¨ØªØ§Ø¹Ù‡Ø§ Ù‡ÙŠØ®ØªÙÙŠ Ø¹Ø´Ø§Ù† Ø§Ù„ÙƒÙŠØ¨ÙˆØ±Ø¯ ÙŠÙØ¶Ù„ Ø±Ø§ÙŠÙ‚.", getKeyboard(newP));
    } else {
      sendMessage(chatId, "Ø£Ù†Øª Ø³Ø¬Ù„Øª Ø§Ù„ØµÙ„Ø§Ø© Ø¯ÙŠ Ù‚Ø¨Ù„ ÙƒØ¯Ù‡ ÙŠØ§ Ø¨Ø·Ù„.");
      sendMenu(chatId, "Ø§Ù„ÙƒÙŠØ¨ÙˆØ±Ø¯ Ø§ØªØ­Ø¯Ø«:", getKeyboard(p));
    }
  }
  else if (text === "Ø¥Ø°Ù† Ø·ÙˆØ§Ø±Ø¦ ðŸ›¡ï¸") {
    props.setProperty('EMERGENCY_MODE', "true");
    sendMessage(chatId, "Ø¹Ù„Ù… ÙˆÙŠÙ†ÙØ°. ØªÙ… ØªÙØ¹ÙŠÙ„ ÙˆØ¶Ø¹ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ Ø§Ù„ØµØ§Ù…Øª. Ù…ÙÙŠØ´ Ø¹Ù‚ÙˆØ¨Ø§Øª Ù‡ØªØªØ®ØµÙ… ÙˆÙ„Ø§ Ø¥Ù†Ø°Ø§Ø±Ø§Øª Ù‡ØªØªØ¨Ø¹Øª. Ù…ØªÙ†Ø³Ø§Ø´ ØªØ³Ø¬Ù„ Ù…Ù‡Ø§Ù…Ùƒ Ø£ÙˆÙ„ Ù…Ø§ ØªÙˆØµÙ„ Ø¨Ø§Ù„Ø³Ù„Ø§Ù…Ø©! ðŸ«¡");
    sendMenu(chatId, "Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ Ù…ÙØ¹Ù„Ø© ðŸŸ¢", getKeyboard(p));
  }
  else if (text === "ÙÙƒ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ ðŸŸ¢") {
    props.setProperty('EMERGENCY_MODE', "false");
    sendMessage(chatId, "ØªÙ… ÙÙƒ ÙˆØ¶Ø¹ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦. Ø±Ø¬Ø¹Ù†Ø§ Ù„Ù„Ø®Ø¯Ù…Ø© ÙˆØ§Ù„Ø¥Ù†Ø°Ø§Ø±Ø§Øª Ø§Ø´ØªØºÙ„Øª ØªØ§Ù†ÙŠ âš”ï¸");
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(p));
  }
  else if (text === "ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ… ðŸ") {
    var challengeStatus = props.getProperty('FORTY_STATUS') || "";
    if (challengeStatus === "ACTIVE") {
      var challengeDays = Math.min(40, getFortyChallengeDays(props));
      sendMenuCustom(chatId,
        getFortyChallengeText(props) + "\n\nÙƒÙ„ ÙŠÙˆÙ… Ø«Ø¨Ø§Øª ÙŠÙ‚Ø±Ù‘Ø¨Ùƒ Ù…Ù† Ø§Ù„ÙˆØ³Ø§Ù… ÙˆÙ…ÙƒØ§ÙØ£Ø© +600 Ù†Ù‚Ø·Ø©.",
        [[{"text": "Ø±Ø¬ÙˆØ¹ â¬…ï¸"}]]);
    } else if (challengeStatus === "COMPLETED") {
      sendMenu(chatId, "Ø£Ù†Øª Ø£ØªÙ…Ù…Øª ØªØ­Ø¯ÙŠ Ø§Ù„Ø£Ø±Ø¨Ø¹ÙŠÙ† Ø¨Ø§Ù„ÙØ¹Ù„. Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² Ø¯Ù‡ Ù…Ø³Ø¬Ù„ ÙÙŠ Ù…Ù„ÙÙƒ Ø§Ù„Ø¹Ø³ÙƒØ±ÙŠ ðŸ†", getKeyboard(p));
    } else {
      sendMenuCustom(chatId,
        "ðŸ *ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ…*\n\n40 ÙŠÙˆÙ…Ø§Ù‹ Ù…Ù† Ø§Ù„Ø«Ø¨Ø§Øª Ø§Ù„Ù…ØªÙˆØ§ØµÙ„. Ù„Ùˆ Ø­ØµÙ„Øª Ø§Ù†ØªÙƒØ§Ø³Ø© ÙŠØªÙˆÙ‚Ù Ø§Ù„ØªØ­Ø¯ÙŠØŒ ÙˆÙ„Ùˆ ÙˆØµÙ„Øª Ù„Ù„Ù†Ù‡Ø§ÙŠØ© ØªØ­ØµÙ„ Ø¹Ù„Ù‰ 600 Ù†Ù‚Ø·Ø© ÙˆÙˆØ³Ø§Ù… Ø®Ø§Øµ.\n\nØ§Ù„Ù‡Ø¯Ù Ù…Ø´ Ø§Ù„ÙƒÙ…Ø§Ù„Ø› Ø§Ù„Ù‡Ø¯Ù Ø¥Ù†Ùƒ ØªØ±Ø¬Ø¹ ØªØ®ØªØ§Ø± Ù†ÙØ³Ùƒ ÙƒÙ„ ÙŠÙˆÙ….",
        [[{"text": "Ø§Ø¨Ø¯Ø£ ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ… ðŸ”¥"}], [{"text": "Ø±Ø¬ÙˆØ¹ â¬…ï¸"}]]);
    }
  }
  else if (text === "Ø§Ø¨Ø¯Ø£ ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ… ðŸ”¥") {
    props.setProperty('FORTY_STATUS', "ACTIVE");
    props.setProperty('FORTY_START_TS', new Date().getTime().toString());
    props.setProperty('FORTY_START_DATE', islamicDateStr);
    sendMenu(chatId,
      "ðŸ”¥ Ø¨Ø¯Ø£Øª Ø§Ù„Ù…Ù‡Ù…Ø©. Ø§Ù„ÙŠÙˆÙ… Ø§Ù„Ø£ÙˆÙ„ Ù…Ø´ Ù…Ø­ØªØ§Ø¬ Ø¨Ø·ÙˆÙ„Ø© Ø®Ø§Ø±Ù‚Ø©Ø› Ù…Ø­ØªØ§Ø¬ Ù‚Ø±Ø§Ø± ÙˆØ§Ø¶Ø­.\n\n" + getFortyChallengeText(props),
      getKeyboard(p));
  }
  else if (text === "Ù…Ù‡Ù…Ø© Ø®Ø§ØµØ© ðŸŽ¯") {
    if (p < 501) return;
    var doneToday = props.getProperty('MISSION_DONE_' + islamicDateStr);
    if (doneToday) {
      sendMessage(chatId, "Ø£Ù†Øª Ø£Ù†Ø¬Ø²Øª Ù…Ù‡Ù…ØªÙƒ Ø§Ù„Ø®Ø§ØµØ© Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ø© ÙŠØ§ Ø¨Ø·Ù„! ÙˆÙØ± Ø·Ø§Ù‚ØªÙƒ Ù„Ø¨ÙƒØ±Ø© ðŸ¦…");
    } else {
      var missions = [
        "Ø§Ø³ØªØºÙØ± Ø§Ù„Ù„Ù‡ 100 Ù…Ø±Ø© Ø¨ÙŠÙ‚ÙŠÙ† ÙˆØ­Ø¶ÙˆØ± Ù‚Ù„Ø¨.",
        "ØµÙ„ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ ï·º 100 Ù…Ø±Ø©.",
        "Ø§Ù‚Ø±Ø£ Ø³ÙˆØ±Ø© Ø§Ù„Ù…Ù„Ùƒ (Ø§Ù„Ù…Ù†Ø¬ÙŠØ© Ù…Ù† Ø¹Ø°Ø§Ø¨ Ø§Ù„Ù‚Ø¨Ø±) Ø§Ù„Ù„ÙŠÙ„Ø©.",
        "Ø§Ù‚Ø±Ø£ Ø³ÙˆØ±Ø© Ø§Ù„ÙˆØ§Ù‚Ø¹Ø© Ø¨Ù†ÙŠØ© Ø§Ù„Ø±Ø²Ù‚ ÙˆØ§Ù„ØªÙˆÙÙŠÙ‚.",
        "Ø§Ù‚Ø±Ø£ 5 ØµÙØ­Ø§Øª Ù…Ù† Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ… Ø¨ØªØ±ÙƒÙŠØ².",
        "Ø³Ø¨Ø­ Ø§Ù„Ù„Ù‡ 100 Ù…Ø±Ø© (Ø³Ø¨Ø­Ø§Ù† Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø­Ù…Ø¯Ù‡).",
        "Ø§Ù‚Ø±Ø£ Ø³ÙˆØ±Ø© Ø§Ù„ÙƒÙ‡Ù ÙƒØ§Ù…Ù„Ø©.",
        "ØµÙ„ÙÙ‘ Ø±ÙƒØ¹ØªÙŠÙ† Ù‚ÙŠØ§Ù… Ù„ÙŠÙ„ Ø§Ù„Ù„ÙŠÙ„Ø© Ù‚Ø¨Ù„ Ù…Ø§ ØªÙ†Ø§Ù….",
        "ØªØµØ¯Ù‚ Ø¨Ø£ÙŠ Ù…Ø¨Ù„Øº Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡ (ÙˆÙ„Ùˆ Ø¬Ù†ÙŠÙ‡ ÙˆØ§Ø­Ø¯).",
        "Ø§ÙƒØªØ¨ 3 Ù†Ø¹Ù… Ø±Ø¨Ù†Ø§ Ø£Ù†Ø¹Ù… Ø¹Ù„ÙŠÙƒ Ø¨ÙŠÙ‡Ø§ Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡ ÙˆØ­Ù…Ø¯Ù‡ Ø¹Ù„ÙŠÙ‡Ø§.",
        "Ù‚Ù„: Ù„Ø§ Ø­ÙˆÙ„ ÙˆÙ„Ø§ Ù‚ÙˆØ© Ø¥Ù„Ø§ Ø¨Ø§Ù„Ù„Ù‡ 100 Ù…Ø±Ø©.",
        "Ø§Ù‚Ø±Ø£ Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­ ÙˆØ§Ù„Ù…Ø³Ø§Ø¡ ÙƒØ§Ù…Ù„Ø© Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡.",
        "Ø§ØªØµÙ„ Ø¨Ø­Ø¯ Ù…Ù† Ø£Ù‡Ù„Ùƒ ÙˆØ§Ø³Ø£Ù„Ù‡ Ø¨ØµØ¯Ù‚ Ø¥Ø°Ø§ ÙƒØ§Ù† ÙŠØ­ØªØ§Ø¬ Ø´ÙŠØ¦Ø§Ù‹.",
        "Ø§Ù‚Ø±Ø£ ØµÙØ­ØªÙŠÙ† Ø¨ØªØ¯Ø¨Ø± ÙˆØ§ÙƒØªØ¨ Ø¢ÙŠØ© Ù„Ù…Ø³ØªÙƒ.",
        "ØµÙ„ÙÙ‘ Ø±ÙƒØ¹ØªÙŠÙ† Ù†ÙÙ„ Ø¨Ù†ÙŠØ© Ø§Ù„Ø«Ø¨Ø§Øª ÙˆØ§Ù„Ù‡Ø¯Ø§ÙŠØ©.",
        "Ø®Ø¯ 10 Ø¯Ù‚Ø§Ø¦Ù‚ Ø¨Ø¹ÙŠØ¯Ø§Ù‹ Ø¹Ù† Ø§Ù„Ù‡Ø§ØªÙØŒ ÙˆØ§Ø°ÙƒØ± Ø§Ù„Ù„Ù‡ Ø®Ù„Ø§Ù„Ù‡Ø§."
      ];
      var m = pickFreshContent(props, "MISSION", missions);
      props.setProperty('PENDING_MISSION_' + islamicDateStr, "true");

      var tempKeyboard = getKeyboard(p);
      tempKeyboard.unshift([{"text": "ØªÙ… Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ù…Ù‡Ù…Ø© âœ…"}]);
      sendMenuCustom(chatId, "Ù…Ù‡Ù…ØªÙƒ Ø§Ù„Ø®Ø§ØµØ©: " + m + "\n\nÙ„Ùˆ Ø®Ù„ØµØªÙ‡Ø§ Ø¯ÙˆØ³ Ø¹Ù„Ù‰ (ØªÙ… Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ù…Ù‡Ù…Ø© âœ…).", tempKeyboard);
    }
  }
  else if (text === "Ø£Ù†Ø¬Ø²Øª Ø§Ù„ØªØ­Ø¯ÙŠ âœ…") {
    if (props.getProperty('JOKER_ACTIVE') === "true" && props.getProperty('JOKER_DATE') === islamicDateStr) {
      props.setProperty('JOKER_ACTIVE', "false");
      var newP = addPoints(150);
      addMedal("ðŸƒ ÙˆØ³Ø§Ù… Ø§Ù„Ø¬ÙˆÙƒØ± Ø§Ù„Ù†Ø§Ø¯Ø±", chatId);
      sendMessage(chatId, "ðŸƒ **Ø¹Ø§Ø´ ÙˆØ­Ø´ Ø§Ù„Ù…Ø¹Ø³ÙƒØ±!** ØªÙ… Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„ØªØ­Ø¯ÙŠ Ø¨Ù†Ø¬Ø§Ø­.\nØªÙ…Øª Ø¥Ø¶Ø§ÙØ© 150 Ù†Ù‚Ø·Ø© Ù„Ø±ØµÙŠØ¯Ùƒ ÙˆØ§Ù„ÙˆØ³Ø§Ù… Ø§Ù„Ù†Ø§Ø¯Ø±! ðŸ†\nØ§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯: " + newP);
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(newP));
    } else {
      sendMenu(chatId, "Ø§Ù„ØªØ­Ø¯ÙŠ Ø§Ù†ØªÙ‡Ù‰ Ø£Ùˆ ØºÙŠØ± Ù…ØªØ§Ø­ Ø­Ø§Ù„ÙŠØ§Ù‹.", getKeyboard(p));
    }
  }
  else if (text === "ØªØ¬Ø§Ù‡Ù„ âŒ") {
    if (props.getProperty('JOKER_ACTIVE') === "true" && props.getProperty('JOKER_DATE') === islamicDateStr) {
      props.setProperty('JOKER_ACTIVE', "false");
      sendMessage(chatId, "ØªÙ… ØªØ¬Ø§Ù‡Ù„ Ø§Ù„ØªØ­Ø¯ÙŠ. Ø§Ù„ÙØ±Øµ Ø§Ù„ÙƒØ¨ÙŠØ±Ø© Ù„Ø§ ØªØ£ØªÙŠ Ø¯Ø§Ø¦Ù…Ø§Ù‹ ÙŠØ§ Ø¨Ø·Ù„ ðŸƒ");
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(p));
    } else {
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(p));
    }
  }
  else if (text === "ØªÙ… Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ù…Ù‡Ù…Ø© âœ…") {
    if (props.getProperty('PENDING_MISSION_' + islamicDateStr) === "true") {
      props.setProperty('PENDING_MISSION_' + islamicDateStr, "false");
      props.setProperty('MISSION_DONE_' + islamicDateStr, "true");
      var newP = addPoints(50);
      sendMessage(chatId, "Ø¹Ø§Ø´ Ø¬Ø¯Ø§Ù‹! ØªÙ… Ø¥Ø¶Ø§ÙØ© 50 Ù†Ù‚Ø·Ø© Ù„Ø±ØµÙŠØ¯Ùƒ.");
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(newP));
    }
  }
  else if (text === "ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„Ø¯Ø¹Ù… ðŸ“¦") {
    if (p < 1001) return;
    var newP = addPoints(-100);
    var rewards = [
      "'Ø§Ù„Ø´Ù‡ÙˆØ© Ù„Ø­Ø¸Ø©ØŒ ÙˆØ§Ù„Ù†Ø¯Ù… Ø³Ù†ÙŠÙ†. ÙˆØ§Ù„Ø§Ù†ØªØµØ§Ø± Ù„Ø­Ø¸Ø©ØŒ ÙˆØ§Ù„ÙØ®Ø± Ø³Ù†ÙŠÙ†.'",
      "'Ø§Ù„Ù„Ù‡Ù… ÙŠØ§ Ù…Ù‚Ù„Ø¨ Ø§Ù„Ù‚Ù„ÙˆØ¨ Ø«Ø¨Øª Ù‚Ù„Ø¨ÙŠ Ø¹Ù„Ù‰ Ø¯ÙŠÙ†Ùƒ' â€” Ø±Ø¯Ø¯Ù‡Ø§ Ø¯Ø§ÙŠÙ…Ø§Ù‹.",
      "'Ø§Ù„Ø´ÙŠØ·Ø§Ù† Ø¨ÙŠØ²ÙŠÙ†Ù„Ùƒ Ø§Ù„Ù…Ø¹ØµÙŠØ© Ù‚Ø¨Ù„Ù‡Ø§ØŒ ÙˆØ¨ÙŠØ³ÙŠØ¨Ùƒ ØªÙ†Ø¯Ù… Ù„ÙˆØ­Ø¯Ùƒ Ø¨Ø¹Ø¯Ù‡Ø§. Ø®Ù„ÙŠÙƒ Ø£Ø°ÙƒÙ‰ Ù…Ù†Ù‡.'",
      "'ÙƒÙ„ ØªØ¹Ø¨ ÙÙŠ Ù…Ù‚Ø§ÙˆÙ…Ø© Ø§Ù„Ù‡ÙˆÙ‰ØŒ Ø¨ÙŠØªØ¨Ù†ÙŠ Ø¨ÙŠÙ‡ Ù‚ØµØ± ÙÙŠ Ø§Ù„Ø¬Ù†Ø©.'",
      "'Ø§Ù„Ù†ÙØ³ Ø¥Ø°Ø§ Ø£ÙØ¹Ø·ÙŠØª Ù…Ø§ ØªØ´ØªÙ‡ÙŠØŒ Ø·ØºØª. ÙˆØ¥Ø°Ø§ Ù…ÙÙ†Ø¹ØªØŒ Ø±Ø¬Ø¹Øª.'",
      "'Ø§Ù„Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ø£Ù‚ÙˆÙ‰ Ù…Ù† Ø§Ù„ÙƒÙ…Ø§Ù„. ÙŠÙˆÙ… Ø¶Ø¹ÙŠÙ ÙˆÙ„ÙƒÙ† ØªÙƒÙ…Ù„ØŒ Ø£ÙØ¶Ù„ Ù…Ù† ÙŠÙˆÙ… Ù…Ø«Ø§Ù„ÙŠ Ø«Ù… ØªØªÙˆÙ‚Ù.'",
      "'Ù‚ÙŠÙ…ØªÙƒ Ù„ÙŠØ³Øª ÙÙŠ Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ù„Ø³Ù‚ÙˆØ·ØŒ Ø¨Ù„ ÙÙŠ Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ù„Ù‚ÙŠØ§Ù….'",
      "'Ù„Ù…Ø§ ØªÙ‚Ø§ÙˆÙ… ÙÙŠ Ø§Ù„Ø®ÙØ§Ø¡ØŒ Ø£Ù†Øª Ø¨ØªØ¨Ù†ÙŠ Ù†Ø³Ø®Ø© Ù…Ø­Ø¯Ø´ ÙŠÙ‚Ø¯Ø± ÙŠÙ‡Ø²Ù‡Ø§.'",
      "'Ù„Ø§ ØªØ³ØªØµØºØ± Ø®Ø·ÙˆØ© Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡Ø› Ø£ØºÙ„Ø¨ Ø§Ù„ØªØ­ÙˆÙ„Ø§Øª Ø§Ù„ÙƒØ¨ÙŠØ±Ø© Ø¨Ø¯Ø£Øª Ø¨Ù‚Ø±Ø§Ø± Ù‡Ø§Ø¯ÙŠ.'",
      "'Ù…Ø´ Ù„Ø§Ø²Ù… ØªØ­Ø³ Ø¨Ø§Ù„Ù‚ÙˆØ© Ø¹Ø´Ø§Ù† ØªØªØµØ±Ù Ø¨Ù‚ÙˆØ©. ØªØµØ±Ù Ø§Ù„Ø£ÙˆÙ„ØŒ ÙˆØ§Ù„Ø¥Ø­Ø³Ø§Ø³ Ù‡ÙŠÙ„Ø­Ù‚Ùƒ.'",
      "'Ø§Ù„Ù„ÙŠ Ø¨ÙŠØ­Ù…ÙŠ ÙŠÙˆÙ…Ùƒ Ù…Ø´ Ø§Ù„Ø­Ù…Ø§Ø³Ø› Ø§Ù„Ù„ÙŠ Ø¨ÙŠØ­Ù…ÙŠÙ‡ Ù†Ø¸Ø§Ù… ØµØºÙŠØ± Ø¨ØªÙ„ØªØ²Ù… Ø¨ÙŠÙ‡.'"
    ];
    var r = pickFreshContent(props, "SUPPORT", rewards);
    sendMessage(chatId, "ðŸŽ *Ø±Ø³Ø§Ù„Ø© Ù…Ù† Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚:*\n\n" + r);
    sendMenu(chatId, "ØªÙ… Ø®ØµÙ… 100 Ù†Ù‚Ø·Ø©. Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: " + newP, getKeyboard(newP));
  }
  else if (text === "Ø®Ø²ÙŠÙ†Ø© Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª ðŸ†") {
    var keys = [
      [{"text": "ØªØ³Ø¬ÙŠÙ„ Ø§Ù†ØªØµØ§Ø± âœï¸"}],
      [{"text": "Ø§Ø³ØªÙ…Ø¯ Ø·Ø§Ù‚Ø© ðŸ”¥"}],
      [{"text": "Ø±Ø¬ÙˆØ¹ â¬…ï¸"}]
    ];
    sendMenuCustom(chatId, "Ø®Ø²ÙŠÙ†Ø© Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª ðŸ†\nØ§Ø®ØªØ§Ø± Ø¹Ø§ÙŠØ² ØªØ¹Ù…Ù„ Ø¥ÙŠÙ‡:", keys);
  }
  else if (text === "ØªØ³Ø¬ÙŠÙ„ Ø§Ù†ØªØµØ§Ø± âœï¸") {
    props.setProperty('AWAITING_VICTORY', "true");
    var keys = [[{"text": "Ø¥Ù„ØºØ§Ø¡ âŒ"}]];
    sendMenuCustom(chatId, "Ø§ÙƒØªØ¨ Ø§Ù†ØªØµØ§Ø±Ùƒ Ø¯Ù„ÙˆÙ‚ØªÙŠ (Ù…Ø«Ù„Ø§Ù‹: Ù‚Ø§ÙˆÙ…Øª ÙÙƒØ±Ø© ÙˆØ­Ø´Ø©ØŒ ØºØ¶ÙŠØª Ø¨ØµØ±ÙŠØŒ Ù‚Ù…Øª ØµÙ„ÙŠØª ÙˆØ£Ù†Ø§ Ù…ÙƒØ³Ù„ Ø¬Ø¯Ø§Ù‹):", keys);
  }
  else if (text === "Ø¥Ù„ØºØ§Ø¡ âŒ") {
    props.setProperty('AWAITING_VICTORY', "false");
    sendMenu(chatId, "ØªÙ… Ø§Ù„Ø¥Ù„ØºØ§Ø¡.", getKeyboard(p));
  }

  else if (text === "Ø§Ø³ØªÙ…Ø¯ Ø·Ø§Ù‚Ø© ðŸ”¥") {
    var vault = props.getProperty('VICTORY_VAULT');
    var vaultArr = safeParse(vault, []);
    if (vaultArr.length === 0) {
      sendMessage(chatId, "Ø§Ù„Ø®Ø²ÙŠÙ†Ø© Ù„Ø³Ù‡ ÙØ§Ø¶ÙŠØ©! Ø³Ø¬Ù„ Ø§Ù†ØªØµØ§Ø±Ø§ØªÙƒ Ø§Ù„Ø£ÙˆÙ„ Ø¹Ø´Ø§Ù† ØªÙ„Ø§Ù‚ÙŠÙ‡Ø§ ÙˆÙ‚Øª Ø§Ù„Ø²Ù†Ù‚Ø©.");
    } else {
      var randomVic = vaultArr[Math.floor(Math.random() * vaultArr.length)];
      sendMessage(chatId, "ðŸ”¥ Ø±Ø³Ø§Ù„Ø© Ù…Ù† Ø§Ù„Ù…Ø§Ø¶ÙŠ:\n\n*" + randomVic + "*\n\nÙØ§ÙƒØ± Ù„Ù…Ø§ Ù‚Ø§ÙˆÙ…Øª ÙˆÙƒÙ†Øª Ù‚ÙˆÙŠØŸ Ø¥Ù†Øª ØªÙ‚Ø¯Ø± ØªØ¹Ù…Ù„Ù‡Ø§ ØªØ§Ù†ÙŠ Ø¯Ù„ÙˆÙ‚ØªÙŠ! ðŸ¦…");
    }
  }
  else if (text.indexOf("/addvic ") === 0) {
    var vText = text.replace("/addvic ", "");
    var vault = props.getProperty('VICTORY_VAULT');
    var vaultArr = safeParse(vault, []);
    vaultArr.unshift(vText);
    props.setProperty('VICTORY_VAULT', JSON.stringify(vaultArr));
    sendMessage(chatId, "ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø§Ù†ØªØµØ§Ø± Ø¨Ù†Ø¬Ø§Ø­! ðŸ†");
    return;
  }
  else if (text.indexOf("/delvic ") === 0) {
    var vText = text.replace("/delvic ", "");
    var vault = props.getProperty('VICTORY_VAULT');
    if (vault) {
      var vaultArr = safeParse(vault, []);
      var newArr = [];
      for (var i = 0; i < vaultArr.length; i++) {
        if (vaultArr[i].indexOf(vText) === -1) {
          newArr.push(vaultArr[i]);
        }
      }
      props.setProperty('VICTORY_VAULT', JSON.stringify(newArr));
      sendMessage(chatId, "ØªÙ… Ù…Ø³Ø­ Ø§Ù„Ø§Ù†ØªØµØ§Ø± Ø¨Ù†Ø¬Ø§Ø­! ðŸ—‘ï¸");
    }
    return;
  }
  else if (text === "Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ ðŸ“…") {
    if (p < 1001) return;

    var currentWeek = Utilities.formatDate(new Date(), "GMT+3", "yyyy") + "-" + Utilities.formatDate(new Date(), "GMT+3", "w");
    var savedWeek = props.getProperty('WEEKLY_OP_NUM');
    var opStatus = props.getProperty('WEEKLY_OP_STATUS');
    var currentOp = props.getProperty('WEEKLY_OP_TEXT');

    var ops = [
      "ØµÙŠØ§Ù… ÙŠÙˆÙ…ÙŠÙ† Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ (Ø§Ù„Ø§Ø«Ù†ÙŠÙ† ÙˆØ§Ù„Ø®Ù…ÙŠØ³ Ø£Ùˆ Ø£ÙŠ ÙŠÙˆÙ…ÙŠÙ†).",
      "Ù‚Ø±Ø§Ø¡Ø© Ø³ÙˆØ±Ø© Ø§Ù„Ø¨Ù‚Ø±Ø© ÙƒØ§Ù…Ù„Ø© ÙÙŠ Ø±ÙƒØ¹ØªÙŠÙ† Ù‚ÙŠØ§Ù… Ù„ÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "Ø­ÙØ¸ 5 Ø¢ÙŠØ§Øª Ø¬Ø¯ÙŠØ¯Ø© ÙˆÙ…Ø±Ø§Ø¬Ø¹ØªÙ‡Ø§ ÙŠÙˆÙ…ÙŠØ§Ù‹.",
      "Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸ Ù‚Ø¨Ù„ Ø§Ù„ÙØ¬Ø± Ø¨Ù†ØµÙ Ø³Ø§Ø¹Ø© ÙŠÙˆÙ…ÙŠØ§Ù‹ Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "Ø§Ù„ØµØ¯Ù‚Ø© ÙˆÙ„Ùˆ Ø¨Ù…Ø¨Ù„Øº Ø¨Ø³ÙŠØ· Ù…Ø±ØªÙŠÙ† Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "ØµÙ„Ø§Ø© Ø§Ù„Ø¶Ø­Ù‰ ÙŠÙˆÙ…ÙŠØ§Ù‹ Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ (Ø±ÙƒØ¹ØªÙŠÙ† Ø¨Ø¹Ø¯ Ø§Ù„Ø´Ø±ÙˆÙ‚ Ø¨Ù€ 15 Ø¯Ù‚ÙŠÙ‚Ø©).",
      "Ù‚Ø±Ø§Ø¡Ø© Ø¬Ø²Ø¡ ÙƒØ§Ù…Ù„ Ù…Ù† Ø§Ù„Ù‚Ø±Ø¢Ù† Ù…Ù‚Ø³Ù… Ø¹Ù„Ù‰ Ø£ÙŠØ§Ù… Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "Ø®ØªÙ… Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­ ÙˆØ§Ù„Ù…Ø³Ø§Ø¡ ÙƒÙ„ ÙŠÙˆÙ… Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "Ù‚ÙŠØ§Ù… Ù„ÙŠÙ„ 3 Ù„ÙŠØ§Ù„ÙŠ Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ (ÙˆÙ„Ùˆ Ø±ÙƒØ¹ØªÙŠÙ†).",
      "ØºØ¶ Ø§Ù„Ø¨ØµØ± ØªÙ…Ø§Ù…Ø§Ù‹ Ø¹Ù† ÙƒÙ„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø³ÙŠØ¡ Ù„Ù…Ø¯Ø© Ø£Ø³Ø¨ÙˆØ¹ ÙƒØ§Ù…Ù„.",
      "Ø¥Ù‡Ø¯Ù Ø¯Ø¹ÙˆØ© Ø¨Ø¸Ù‡Ø± Ø§Ù„ØºÙŠØ¨ Ù„Ø®Ù…Ø³Ø© Ø£Ø´Ø®Ø§Øµ Ù…Ø®ØªÙ„ÙÙŠÙ† ÙƒÙ„ ÙŠÙˆÙ… Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "Ù‚Ø±Ø§Ø¡Ø© ÙˆØ±Ø¯ Ù‚Ø±Ø¢Ù†ÙŠ Ø«Ø§Ø¨Øª 10 Ø¯Ù‚Ø§Ø¦Ù‚ ÙŠÙˆÙ…ÙŠØ§Ù‹ Ù„Ù…Ø¯Ø© Ø£Ø³Ø¨ÙˆØ¹.",
      "Ø§Ù„Ù…Ø´ÙŠ 20 Ø¯Ù‚ÙŠÙ‚Ø© ÙŠÙˆÙ…ÙŠØ§Ù‹ Ø¨Ø¯ÙˆÙ† Ù‡Ø§ØªÙ Ù„Ù…Ø¯Ø© Ø®Ù…Ø³Ø© Ø£ÙŠØ§Ù… Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹.",
      "Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ø³ÙˆØ´ÙŠØ§Ù„ Ù…ÙŠØ¯ÙŠØ§ Ù‚Ø¨Ù„ Ø§Ù„Ù†ÙˆÙ… Ø¨Ø³Ø§Ø¹Ø© Ù„Ø³Ø¨Ø¹Ø© Ø£ÙŠØ§Ù…."
    ];

    if (savedWeek !== currentWeek) {
      currentOp = pickFreshContent(props, "WEEKLY_OP", ops);
      props.setProperty('WEEKLY_OP_NUM', currentWeek);
      props.setProperty('WEEKLY_OP_TEXT', currentOp);
      props.setProperty('WEEKLY_OP_STATUS', "PENDING");
      opStatus = "PENDING";
    }

    if (opStatus === "DONE") {
      sendMessage(chatId, "Ø£Ù†Øª Ø£Ù†Ø¬Ø²Øª Ø¹Ù…Ù„ÙŠØ© Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø¨Ø¬Ø¯Ø§Ø±Ø©! Ø§Ø³ØªØ±Ø­ ÙˆØ§Ø³ØªØ¹Ø¯ Ù„Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù‚Ø§Ø¯Ù… âš”ï¸");
    } else {
      var keys = [
        [{"text": "ØªÙ… Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© âœ…"}],
        [{"text": "Ø±Ø¬ÙˆØ¹ â¬…ï¸"}]
      ];
      sendMenuCustom(chatId, "ðŸ“… Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹:\n\n" + currentOp + "\n\nØ§Ù„Ù…ÙƒØ§ÙØ£Ø©: 200 Ù†Ù‚Ø·Ø© ÙˆÙˆØ³Ø§Ù… Ù†Ø§Ø¯Ø±.", keys);
    }
  }

  else if (text === "ðŸ“… Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„ØµÙ„Ø§Ø©") {
    var pTimes = getPrayerTimes();
    var msg = "ðŸ“… **Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„ØµÙ„Ø§Ø© Ø§Ù„ÙŠÙˆÙ…:**\n\n";
    msg += "Ø§Ù„ÙØ¬Ø±: " + pTimes["Ø§Ù„ÙØ¬Ø±"] + "\n";
    msg += "Ø§Ù„Ø´Ø±ÙˆÙ‚: " + pTimes["Ø§Ù„Ø´Ø±ÙˆÙ‚"] + "\n";
    msg += "Ø§Ù„Ø¸Ù‡Ø±: " + pTimes["Ø§Ù„Ø¸Ù‡Ø±"] + "\n";
    msg += "Ø§Ù„Ø¹ØµØ±: " + pTimes["Ø§Ù„Ø¹ØµØ±"] + "\n";
    msg += "Ø§Ù„Ù…ØºØ±Ø¨: " + pTimes["Ø§Ù„Ù…ØºØ±Ø¨"] + "\n";
    msg += "Ø§Ù„Ø¹Ø´Ø§Ø¡: " + pTimes["Ø§Ù„Ø¹Ø´Ø§Ø¡"] + "\n";
    sendMessage(chatId, msg);
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(p));
  }
  else if (text === "ðŸ“¿ Ø°ÙƒØ± Ø³Ø±ÙŠØ¹") {
    var keys = [
      [{"text": "Ø³Ø¨Ø­Ø§Ù† Ø§Ù„Ù„Ù‡ Ã— 33"}],
      [{"text": "Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ã— 33"}],
      [{"text": "Ø§Ù„Ù„Ù‡ Ø£ÙƒØ¨Ø± Ã— 33"}],
      [{"text": "ØµÙ„Ø§Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ Ã— 100"}],
      [{"text": "Ø±Ø¬ÙˆØ¹ â¬…ï¸"}]
    ];
    var dhikrCount = parseInt(props.getProperty('DHIKR_COUNT_' + islamicDateStr) || "0");
    sendMenuCustom(chatId, "ðŸ“¿ **Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø³Ø±ÙŠØ¹Ø©**\nÙƒÙ„ Ø¬Ù„Ø³Ø© Ø°ÙƒØ± Ø¨Ù€ 5 Ù†Ù‚Ø§Ø·. Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 3 Ù…Ø±Ø§Øª ÙŠÙˆÙ…ÙŠØ§Ù‹.\nØ£Ù†Ø¬Ø²Øª Ø§Ù„ÙŠÙˆÙ…: " + dhikrCount + "/3", keys);
  }
  else if (text === "Ø³Ø¨Ø­Ø§Ù† Ø§Ù„Ù„Ù‡ Ã— 33" || text === "Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ã— 33" || text === "Ø§Ù„Ù„Ù‡ Ø£ÙƒØ¨Ø± Ã— 33" || text === "ØµÙ„Ø§Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ Ã— 100") {
    var dhikrCount = parseInt(props.getProperty('DHIKR_COUNT_' + islamicDateStr) || "0");
    var totalDhikr = parseInt(props.getProperty('TOTAL_DHIKR') || "0");
    if (dhikrCount >= 3) {
      sendMessage(chatId, "Ù„Ù‚Ø¯ Ø£ØªÙ…Ù…Øª Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù…Ù† Ø§Ù„Ù†Ù‚Ø§Ø· Ù„Ù„Ø£Ø°ÙƒØ§Ø± Ø§Ù„ÙŠÙˆÙ… (3 Ø¬Ù„Ø³Ø§Øª). ØªÙ‚Ø¨Ù„ Ø§Ù„Ù„Ù‡ Ù…Ù†Ùƒ! âœ¨\nØ¥Ø¬Ù…Ø§Ù„ÙŠ Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ø°ÙƒØ± ÙÙŠ Ù…Ø³ÙŠØ±ØªÙƒ: " + totalDhikr + " Ø¬Ù„Ø³Ø© ðŸ“¿");
    } else {
      props.setProperty('DHIKR_COUNT_' + islamicDateStr, (dhikrCount + 1).toString());
      props.setProperty('TOTAL_DHIKR', (totalDhikr + 1).toString());
      addPoints(5, "Ø¬Ù„Ø³Ø© Ø°ÙƒØ±: " + text);
      sendMessage(chatId, "Ø£Ø­Ø³Ù†Øª! ðŸ“¿ ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¬Ù„Ø³Ø© ÙˆØ¥Ø¶Ø§ÙØ© 5 Ù†Ù‚Ø§Ø·.\nØ¥Ø¬Ù…Ø§Ù„ÙŠ Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ø°ÙƒØ±: " + (totalDhikr + 1) + " Ø¬Ù„Ø³Ø©");
    }
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(getPoints()));
  }
  else if (text === "ØµÙŠØ§Ù… Ù†Ø§ÙÙ„Ø© ðŸŒ™") {
    var keys = [
      [{"text": "Ø§Ø«Ù†ÙŠÙ† ÙˆØ®Ù…ÙŠØ³"}],
      [{"text": "Ø£ÙŠØ§Ù… Ø§Ù„Ø¨ÙŠØ¶"}],
      [{"text": "ÙŠÙˆÙ… Ø¹Ø±ÙØ©"}],
      [{"text": "ØªØ§Ø³ÙˆØ¹Ø§Ø¡ ÙˆØ¹Ø§Ø´ÙˆØ±Ø§Ø¡"}],
      [{"text": "Ø´ÙˆØ§Ù„"}],
      [{"text": "Ø±Ø¬ÙˆØ¹ â¬…ï¸"}]
    ];
    sendMenuCustom(chatId, "ðŸŒ™ **ØµÙŠØ§Ù… Ø§Ù„Ù†Ø§ÙÙ„Ø©:**\nØ§Ø®ØªØ± Ù†ÙŠØ© Ø§Ù„ØµÙŠØ§Ù… Ø§Ù„ÙŠÙˆÙ…. (Ø§Ù„Ù…ÙƒØ§ÙØ£Ø©: 50 Ù†Ù‚Ø·Ø©)", keys);
  }
  else if (["Ø§Ø«Ù†ÙŠÙ† ÙˆØ®Ù…ÙŠØ³", "Ø£ÙŠØ§Ù… Ø§Ù„Ø¨ÙŠØ¶", "ÙŠÙˆÙ… Ø¹Ø±ÙØ©", "ØªØ§Ø³ÙˆØ¹Ø§Ø¡ ÙˆØ¹Ø§Ø´ÙˆØ±Ø§Ø¡", "Ø´ÙˆØ§Ù„"].indexOf(text) !== -1) {
    var fKey = 'FASTING_DONE_' + islamicDateStr;
    if (props.getProperty(fKey)) {
      sendMessage(chatId, "Ù„Ù‚Ø¯ Ø³Ø¬Ù„Øª ØµÙŠØ§Ù…Ø§Ù‹ Ø§Ù„ÙŠÙˆÙ… Ø¨Ø§Ù„ÙØ¹Ù„. ØªÙ‚Ø¨Ù„ Ø§Ù„Ù„Ù‡ Ø·Ø§Ø¹ØªÙƒ! ðŸŒ™");
    } else {
      props.setProperty(fKey, "true");
      var fCount = parseInt(props.getProperty('FASTING_COUNT') || "0");
      props.setProperty('FASTING_COUNT', (fCount + 1).toString());
      var fStreak = parseInt(props.getProperty('FASTING_STREAK') || "0");
      props.setProperty('FASTING_STREAK', (fStreak + 1).toString());
      addPoints(50, "ØµÙŠØ§Ù… Ù†Ø§ÙÙ„Ø©: " + text);
      sendMessage(chatId, "ØªÙ‚Ø¨Ù„ Ø§Ù„Ù„Ù‡ ØµÙŠØ§Ù…Ùƒ! ðŸŒ™ ØªÙ… Ø¥Ø¶Ø§ÙØ© 50 Ù†Ù‚Ø·Ø© Ù„Ø±ØµÙŠØ¯Ùƒ.");
    }
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(getPoints()));
  }
  else if (text === "ØµÙ„Ø§Ø© Ø§Ù„ØªØ±Ø§ÙˆÙŠØ­ ðŸ•Œ") {
    var tarawihKey = 'TARAWIH_DONE_' + islamicDateStr;
    if (props.getProperty(tarawihKey)) {
      sendMessage(chatId, "Ù„Ù‚Ø¯ ØµÙ„ÙŠØª Ø§Ù„ØªØ±Ø§ÙˆÙŠØ­ Ø§Ù„ÙŠÙˆÙ…. ØªÙ‚Ø¨Ù„ Ø§Ù„Ù„Ù‡ Ù…Ù†Ùƒ! ðŸ•Œ");
    } else {
      props.setProperty(tarawihKey, "true");
      addPoints(30, "ØµÙ„Ø§Ø© Ø§Ù„ØªØ±Ø§ÙˆÙŠØ­");
      sendMessage(chatId, "ØªÙ‚Ø¨Ù„ Ø§Ù„Ù„Ù‡ ØµÙ„Ø§ØªÙƒ! ðŸ•Œ ØªÙ… Ø¥Ø¶Ø§ÙØ© 30 Ù†Ù‚Ø·Ø© Ù„Ø±ØµÙŠØ¯Ùƒ.");
    }
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(getPoints()));
  }
  else if (text === "Ø®ØµÙ… ÙŠØ¯ÙˆÙŠ âž–") {
    sendMessage(chatId, "Ø¹Ø´Ø§Ù† ØªØ®ØµÙ… Ù†Ù‚Ø§Ø· ÙŠØ¯ÙˆÙŠØ§Ù‹ØŒ Ø§ÙƒØªØ¨ ÙƒÙ„Ù…Ø© 'Ø®ØµÙ…' ÙˆØ¨Ø¹Ø¯Ù‡Ø§ Ø§Ù„Ø±Ù‚Ù….\nÙ…Ø«Ø§Ù„: Ø®ØµÙ… 50");
  }
  else if (text.startsWith("Ø®ØµÙ… ")) {
    var amount = parseInt(text.replace("Ø®ØµÙ… ", "").trim());
    if (isNaN(amount) || amount <= 0) {
      sendMessage(chatId, "Ø§Ù„Ø±Ù‚Ù… ØºÙŠØ± ØµØ­ÙŠØ­! Ø§ÙƒØªØ¨ ÙƒÙ„Ù…Ø© 'Ø®ØµÙ…' ÙˆØ¨Ø¹Ø¯Ù‡Ø§ Ø±Ù‚Ù… ØµØ­ÙŠØ­. Ù…Ø«Ø§Ù„: Ø®ØµÙ… 50");
    } else {
      addPoints(-amount, "Ø®ØµÙ… ÙŠØ¯ÙˆÙŠ");
      props.setProperty('LAST_MANUAL_DEDUCT_DATE', islamicDateStr);
      sendMessage(chatId, "ØªÙ… Ø®ØµÙ… " + amount + " Ù†Ù‚Ø·Ø© Ù…Ù† Ø±ØµÙŠØ¯Ùƒ Ø¨Ù†Ø¬Ø§Ø­ âž–. Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: " + getPoints());
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(getPoints()));
    }
  }
  else if (text.startsWith("/medal")) {
    var medalId = text.trim().substring(1);
    var foundData = null;
    for (var key in MEDALS_DB) {
      if (MEDALS_DB[key].id === medalId) {
        foundData = MEDALS_DB[key];
        break;
      }
    }

    if (foundData) {
      // Find if user has it and when
      var medalsStr = props.getProperty('MY_MEDALS');
      var medalsArr = safeParse(medalsStr, []);
      var earnedDate = "Ù…ÙƒØªØ³Ø¨ Ù…Ø³Ø¨Ù‚Ø§Ù‹";
      var hasMedal = false;
      for (var i = 0; i < medalsArr.length; i++) {
        var mObj = medalsArr[i];
        var mName = (typeof mObj === 'string') ? mObj : mObj.name;
        if (mName === foundData.name) {
          hasMedal = true;
          if (typeof mObj !== 'string' && mObj.earnedAt) {
            earnedDate = mObj.earnedAt;
          }
          break;
        }
      }

      var mText = "ðŸ† *" + foundData.name + "*\n\n";
      mText += "ðŸ“ *Ø§Ù„ÙˆØµÙ:* " + foundData.desc + "\n";
      if (hasMedal) {
        mText += "âœ… *Ø§Ù„Ø­Ø§Ù„Ø©:* ØªÙ… Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„ÙŠÙ‡\n";
        mText += "ðŸ“… *ØªØ§Ø±ÙŠØ® Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„ÙŠÙ‡:* " + earnedDate;
      } else {
        mText += "âŒ *Ø§Ù„Ø­Ø§Ù„Ø©:* Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„ÙŠÙ‡ Ø¨Ø¹Ø¯.";
      }

      if (foundData.img) {
        var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendPhoto";
        var payload = { "chat_id": chatId, "photo": foundData.img, "caption": mText, "parse_mode": "Markdown" };
        var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
        try { UrlFetchApp.fetch(url, options); } catch (e) { Logger.log(e); }
      } else {
        sendMessage(chatId, mText);
      }
    }
  }

  else if (text === "Ù…Ù„Ù Ø§Ù„ÙˆØ­Ø´ ðŸ¦") {
    var details = getStreakDetails();
    var days = getStreakDays();
    var msgText = getStreakMessage(days);
    var rank = getRank(p);

    if (days >= 1) addMedal("Ø´Ø§Ø±Ø© Ø§Ù„Ù…Ø­Ø§Ø±Ø¨ Ø§Ù„Ø£ÙˆÙ„Ù‰ ðŸŽ–ï¸", chatId);
    if (days >= 3) addMedal("ÙˆØ³Ø§Ù… Ø§Ù„Ø¥Ø±Ø§Ø¯Ø© Ø§Ù„ØµÙ„Ø¨Ø© ðŸ›¡ï¸", chatId);
    if (days >= 7) addMedal("Ù†Ø¬Ù…Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù†Ø­Ø§Ø³ÙŠØ© ðŸ¥‰", chatId);
    if (days >= 30) addMedal("Ø¯Ø±Ø¹ Ø§Ù„Ø´Ù‡Ø± Ø§Ù„ÙØ¶ÙŠ ðŸ¥ˆ", chatId);
    if (days >= 90) addMedal("ØªØ§Ø¬ Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ø°Ù‡Ø¨ÙŠ ðŸ¥‡", chatId);
    if (days >= 180) addMedal("ÙˆØ³Ø§Ù… Ø§Ù„Ù†Ù‚Ø§Ø¡ Ø§Ù„Ù…Ø·Ù„Ù‚ ðŸ’Ž", chatId);

    var medals = getMedals();

    var prayerStreak = parseInt(props.getProperty('PRAYER_STREAK') || "0");
    var lastComplete = props.getProperty('PRAYER_STREAK_LAST');
    if (lastComplete && prayerStreak > 0) {
      var now = new Date();
      var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      var yesterdayStr = Utilities.formatDate(yesterday, "GMT+3", "yyyy-MM-dd");
      if (lastComplete !== islamicDateStr && lastComplete !== yesterdayStr) {
        prayerStreak = 0;
        props.setProperty('PRAYER_STREAK', "0");
      }
    }

    var todayPrayersList = "";
    var pList = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];
    for (var i = 0; i < pList.length; i++) {
      var isP = (props.getProperty('PRAYED_' + pList[i]) === islamicDateStr);
      todayPrayersList += pList[i] + ": " + (isP ? "âœ…" : "âŒ") + "\n";
    }

    var personalBest = parseInt(props.getProperty('PERSONAL_BEST_STREAK') || "0");
    if (days > personalBest) {
      personalBest = days;
      props.setProperty('PERSONAL_BEST_STREAK', personalBest.toString());
    }
    
    var targetGoal = parseInt(props.getProperty('CURRENT_TARGET_GOAL') || "3");
    
    var pbText = "";
    if (personalBest > 0) {
      var pct = Math.floor((days / personalBest) * 100);
      if (pct > 100) pct = 100;
      if (days === personalBest) {
        pbText = "ðŸ‘‘ Ø£Ø¹Ù„Ù‰ ØµÙ…ÙˆØ¯ (PB): " + personalBest + " ÙŠÙˆÙ… â€” *Ø±Ù‚Ù…Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ* ðŸ†\n";
      } else {
        pbText = "ðŸ‘‘ Ø£Ø¹Ù„Ù‰ ØµÙ…ÙˆØ¯ (PB): " + personalBest + " ÙŠÙˆÙ… (Ø£Ù†Øª Ø¹Ù†Ø¯ " + pct + "% Ù…Ù†Ù‡)\n";
      }
    }
    
    pbText += "ðŸŽ¯ Ù‡Ø¯Ù Ø§Ù„Ø¥Ø­Ù…Ø§Ø¡ (Ø¹Ø´Ø§Ù† ØªØ±Ø¬Ø¹ Ù„Ù…Ø³ØªÙˆØ§Ùƒ): " + targetGoal + " ÙŠÙˆÙ…\n";
    
    var barLength = 10;
    var progress = Math.floor((days / targetGoal) * barLength);
    if (progress > barLength) progress = barLength;
    var bar = "[";
    for(var i=0; i<barLength; i++) {
        bar += (i < progress) ? "â–ˆ" : "â–‘";
    }
    bar += "] " + Math.floor((days/targetGoal)*100) + "%";
    pbText += "ðŸ“ˆ Ø§Ù„ØªÙ‚Ø¯Ù… Ù†Ø­Ùˆ Ø§Ù„Ù‡Ø¯Ù:\n" + bar + "\n";
    
    if (targetGoal - days <= 2 && targetGoal - days > 0) {
        pbText += "ðŸ”¥ *Ø¹Ù„Ù‰ Ø¨ÙØ¹Ø¯ Ø®Ø·ÙˆØ© Ù…Ù† Ø§Ù„Ù…Ø¬Ø¯.. Ø¥ÙŠØ§Ùƒ ØªØ³Ù‚Ø· Ø¯Ù„ÙˆÙ‚ØªÙŠ!*\n";
    }
    
    var dynamicEmoji = "âš”ï¸";
    if (days >= 30) dynamicEmoji = "ðŸ‘‘";
    profile += pbText;
    profile += "âš¡ Ù…Ø¶Ø§Ø¹Ù Ø§Ù„ØµÙ…ÙˆØ¯: " + getMultiplierLabel() + "\n";
    profile += "ðŸ•Œ Ø³ØªØ±ÙŠÙƒ Ø§Ù„ØµÙ„ÙˆØ§Øª: " + prayerStreak + " ÙŠÙˆÙ… Ù…ØªØªØ§Ù„ÙŠ\n";
    profile += "ðŸ›¡ï¸ Ø§Ù„Ø¯Ø±ÙˆØ¹ Ø§Ù„Ù…ØªØ§Ø­Ø©: " + shields + "/3\n";
    profile += "ðŸ† Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: " + totalVictories + "\n";
    profile += getFortyChallengeText(props) + "\n";
    if (fCount > 0) profile += "ðŸŒ™ Ø£ÙŠØ§Ù… ØµÙŠØ§Ù… Ø§Ù„Ù†Ø§ÙÙ„Ø©: " + fCount + " Ø£ÙŠØ§Ù…\n";
    if (isJokerActive && jokerTask) {
      profile += "\nðŸƒ *ØªØ­Ø¯ÙŠ Ø¬ÙˆÙƒØ± Ù†Ø´Ø·:* " + jokerTask + "\n";
    }
    profile += "\nðŸ“ˆ Ø§Ù„ØªÙ‚Ø¯Ù… Ù„Ù„Ø±ØªØ¨Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©:\n" + getNextRankProgress(p) + "\n\n";
    profile += "*Ø³Ø¬Ù„ ØµÙ„ÙˆØ§Øª Ø§Ù„ÙŠÙˆÙ…:*\n" + todayPrayersList + "\n";
    profile += "*ØªÙØ§ØµÙŠÙ„ Ù…Ø¯Ø© Ø§Ù„ØµÙ…ÙˆØ¯:*\n" + details + "\n\n";
    profile += "Ø§Ù„Ø£ÙˆØ³Ù…Ø©: " + medals + "\n\n";
    profile += "ðŸ’¬ Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©:\n" + msgText;

    sendMenu(chatId, profile, getKeyboard(p));
  }
  else if (text === "Ø³Ø¬Ù„ Ø§Ù„Ø³Ù‚ÙˆØ· ðŸ“‰") {
    var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);
    if (shameArr.length === 0) {
      sendMenu(chatId, "Ø³Ø¬Ù„Ùƒ Ù†Ø¸ÙŠÙ ÙŠØ§ ÙˆØ­Ø´! Ù…ÙÙŠØ´ Ø£ÙŠ Ø§Ù†ØªÙƒØ§Ø³Ø§Øª Ù…ØªØ³Ø¬Ù„Ø©. Ø¹Ø§Ø´! ðŸ¦…", getKeyboard(p));
    } else {
      var mText = "ðŸ“‰ **Ø³Ø¬Ù„ Ø§Ù„Ø³Ù‚ÙˆØ· (The Wall of Shame):**\n\n";
      for (var i = 0; i < shameArr.length; i++) {
        mText += (i+1) + ". ðŸ“… " + shameArr[i] + "\n";
      }
      mText += "\nØ¨Øµ Ù„Ù„ØªÙˆØ§Ø±ÙŠØ® Ø¯ÙŠ ÙƒÙˆÙŠØ³ ÙˆØ§ÙØªÙƒØ± Ø´Ø¹ÙˆØ±Ùƒ ÙˆÙ‚ØªÙ‡Ø§ Ø¹Ø´Ø§Ù† Ù…ØªÙƒØ±Ø±Ù‡Ø§Ø´ ØªØ§Ù†ÙŠ. Ø¥Ù†Øª Ø£Ù‚ÙˆÙ‰ Ù…Ù† ÙƒØ¯Ø© âš”ï¸";
      sendMenu(chatId, mText, getKeyboard(p));
    }
  }
  else if (text === "Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ù‚ØªØ§Ù„ âš”ï¸") {
    var confirmKeys = [
      [{"text": "Ù†Ø¹Ù…ØŒ ÙˆÙ‚Ø¹Øª ÙØ¹Ù„Ø§Ù‹ âš”ï¸"}],
      [{"text": "ØªØ±Ø§Ø¬Ø¹ âŒ"}]
    ];
    var daysNow = getStreakDays();
    var shieldsNow = parseInt(props.getProperty('SHIELDS') || "0");
    var warnMsg = "âš ï¸ *ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø§Ù†ØªÙƒØ§Ø³Ø©*\n\n";
    warnMsg += "Ø³ØªØ±ÙŠÙƒÙƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: *" + daysNow + " ÙŠÙˆÙ…*\n";
    if (shieldsNow > 0) {
      warnMsg += "ðŸ›¡ï¸ Ø¹Ù†Ø¯Ùƒ " + shieldsNow + " Ø¯Ø±Ø¹ â€” Ø§Ù„Ø¯Ø±Ø¹ Ù‡ÙŠÙ…ØªØµ Ø§Ù„Ø¶Ø±Ø¨Ø© ÙˆÙŠØ­Ù…ÙŠ Ø§Ù„Ø³ØªØ±ÙŠÙƒ ÙˆØ§Ù„Ù†Ù‚Ø§Ø·.\n";
    } else {
      warnMsg += "âŒ Ù…ÙÙŠØ´ Ø¯Ø±ÙˆØ¹ â€” Ø§Ù„Ù†Ù‚Ø§Ø· ÙˆØ§Ù„Ø³ØªØ±ÙŠÙƒ Ù‡ÙŠØªØµÙØ±ÙˆØ§.\n";
    }
    warnMsg += "\nÙ…ØªØ£ÙƒØ¯ØŸ";
    sendMenuCustom(chatId, warnMsg, confirmKeys);
  }
  else if (text === "Ù†Ø¹Ù…ØŒ ÙˆÙ‚Ø¹Øª ÙØ¹Ù„Ø§Ù‹ âš”ï¸") {
    var keys = [
      [{"text": "Ø¯Ù„ÙˆÙ‚ØªÙŠ Ø­Ø§Ù„Ø§ ðŸ”´"}],
      [{"text": "Ù…Ù† Ø³Ø§Ø¹Ø© ðŸ•"}, {"text": "Ù…Ù† Ø³Ø§Ø¹ØªÙŠÙ† ðŸ•‘"}],
      [{"text": "Ù…Ù† Ù†Øµ ÙŠÙˆÙ… ðŸŒ—"}, {"text": "Ø¥Ù…Ø¨Ø§Ø±Ø­ ðŸ“…"}],
      [{"text": "ØªØ±Ø§Ø¬Ø¹ âŒ"}]
    ];
    sendMenuCustom(chatId, "Ø§Ù„ÙˆÙ‚ÙˆØ¹ Ø¯Ù‡ Ø­ØµÙ„ Ø¥Ù…ØªÙ‰ Ø¨Ø§Ù„Ø¸Ø¨Ø· ÙŠØ§ Ø¨Ø·Ù„ØŸ", keys);
  }
  else if (text === "Ø¯Ù„ÙˆÙ‚ØªÙŠ Ø­Ø§Ù„Ø§ ðŸ”´" || text === "Ù…Ù† Ø³Ø§Ø¹Ø© ðŸ•" || text === "Ù…Ù† Ø³Ø§Ø¹ØªÙŠÙ† ðŸ•‘" || text === "Ù…Ù† Ù†Øµ ÙŠÙˆÙ… ðŸŒ—" || text === "Ø¥Ù…Ø¨Ø§Ø±Ø­ ðŸ“…") {
    var offset = 0;
    if (text === "Ù…Ù† Ø³Ø§Ø¹Ø© ðŸ•") offset = 60 * 60 * 1000;
    else if (text === "Ù…Ù† Ø³Ø§Ø¹ØªÙŠÙ† ðŸ•‘") offset = 2 * 60 * 60 * 1000;
    else if (text === "Ù…Ù† Ù†Øµ ÙŠÙˆÙ… ðŸŒ—") offset = 12 * 60 * 60 * 1000;
    else if (text === "Ø¥Ù…Ø¨Ø§Ø±Ø­ ðŸ“…") offset = 24 * 60 * 60 * 1000;

    var relapseTime = new Date().getTime() - offset;
    var relapseDateStr = Utilities.formatDate(new Date(relapseTime), "GMT+3", "yyyy-MM-dd HH:mm:ss");
    var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);

    if (props.getProperty('FORTY_STATUS') === "ACTIVE") {
      var fortyDays = getFortyChallengeDays(props);
      props.setProperty('FORTY_STATUS', "FAILED");
      props.setProperty('FORTY_LAST_DAYS', fortyDays.toString());
      props.deleteProperty('FORTY_START_TS');
      sendMessage(chatId, "ðŸ ØªØ­Ø¯ÙŠ Ø§Ù„Ø£Ø±Ø¨Ø¹ÙŠÙ† ØªÙˆÙ‚Ù Ø¹Ù†Ø¯ " + fortyDays + " ÙŠÙˆÙ…. Ø®Ø° Ù†ÙØ³Ø§Ù‹ØŒ Ø§ØªØ¹Ù„Ù… Ù…Ù† Ø§Ù„Ù„Ø­Ø¸Ø© Ø¯ÙŠØŒ ÙˆØ§Ø¨Ø¯Ø£ Ù…Ù† Ø¬Ø¯ÙŠØ¯ Ù„Ù…Ø§ ØªÙƒÙˆÙ† Ø¬Ø§Ù‡Ø². Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¬Ø²Ø¡ Ù…Ù† Ø§Ù„Ù‚ÙˆØ©.");
    }

    var shields = parseInt(props.getProperty('SHIELDS') || "0");
    if (shields > 0) {
      props.setProperty('SHIELDS', (shields - 1).toString());
      props.setProperty('SHIELD_ACTIVE', "true");

      shameArr.push(relapseDateStr + " (Ù…Ø­Ù…ÙŠ Ø¨Ø§Ù„Ø¯Ø±Ø¹ ðŸ›¡ï¸)");
      if (shameArr.length > 50) shameArr.shift();
      props.setProperty('WALL_OF_SHAME', JSON.stringify(shameArr));

      sendMessage(chatId, "ðŸ›¡ï¸ ØªÙØ¹ÙŠÙ„ Ø¯Ø±Ø¹ Ø§Ù„Ø­Ù…Ø§ÙŠØ©! ðŸ›¡ï¸\n\nØ§Ù„Ø¯Ø±Ø¹ Ø§ØªÙƒØ³Ø±Øª ÙˆØ§Ù…ØªØµØª Ø§Ù„Ø¶Ø±Ø¨Ø©. Ø§Ù„Ø³ØªØ±ÙŠÙƒ ÙˆØ§Ù„Ù†Ù‚Ø§Ø· ÙÙŠ Ø£Ù…Ø§Ù† Ø¨ÙØ¶Ù„ Ø§Ù„Ø¯Ø±Ø¹.\nØ¹Ù†Ø¯Ùƒ Ø­Ù…Ø§ÙŠØ© Ø¥Ø¶Ø§ÙÙŠØ© Ù…Ù† Ø®ØµÙ… Ø§Ù„ØªÙØªÙŠØ´ Ù„Ø£ÙˆÙ„ 3 Ø£ÙŠØ§Ù….\nÙ…ØªØ¨Ù‚ÙŠ Ù„Ùƒ Ø¯Ø±ÙˆØ¹: " + (shields - 1));
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(getPoints()));
    } else {
      shameArr.push(relapseDateStr);
      if (shameArr.length > 50) shameArr.shift();
      props.setProperty('WALL_OF_SHAME', JSON.stringify(shameArr));

      var daysBeforeRelapse = getStreakDays();
      var recoveryPeriod = Math.max(1, daysBeforeRelapse); // Dynamic, no max limit
      props.setProperty('RECOVERY_PERIOD', recoveryPeriod.toString());

      props.setProperty('LAST_RESET_DATE', relapseTime.toString());
      props.setProperty('POINTS', "0");
      props.setProperty('SHIELD_ACTIVE', "false");

      var personalBest = parseInt(props.getProperty('PERSONAL_BEST_STREAK') || "0");
      var pbMsg = "";
      if (personalBest > 0) pbMsg = "\n\nØ§Ù„Ù†Ù‡Ø§Ø±Ø¯Ø© ÙˆÙ‚Ø¹Øª.. Ø¨Ø³ Ù…ØªÙ†Ø³Ø§Ø´ Ø¥Ù†Ùƒ ÙÙŠ ÙŠÙˆÙ… Ù…Ù† Ø§Ù„Ø£ÙŠØ§Ù… Ù‚Ø¯Ø±Øª ØªØµÙ…Ø¯ " + personalBest + " ÙŠÙˆÙ….. Ø§Ù„Ù„ÙŠ Ø¹Ù…Ù„Ù‡Ø§ Ù…Ø±Ø© ÙŠØ¹Ù…Ù„Ù‡Ø§ ØªØ§Ù†ÙŠ.";
      sendMessage(chatId, "Ø§Ù„Ù…Ø­Ø§Ø±Ø¨ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ø¨ÙŠÙ‚Ø¹ ÙˆÙŠÙ‚ÙˆÙ… Ø£Ù‚ÙˆÙ‰. ØªÙ… ØªØµÙÙŠØ± Ø§Ù„Ø¹Ø¯Ø§Ø¯ ÙˆØªØ­Ø¯ÙŠØ« ÙˆÙ‚Øª Ø§Ù„Ø§Ù†ØªÙƒØ§Ø³Ø© ÙÙŠ Ø³Ø¬Ù„ Ø§Ù„Ø³Ù‚ÙˆØ·. Ø§Ø±ÙØ¹ Ø³ÙŠÙÙƒ ÙˆØ§Ø¨Ø¯Ø£ Ø§Ù„Ù‚ØªØ§Ù„ Ù…Ù† Ø¬Ø¯ÙŠØ¯ Ø¯Ù„ÙˆÙ‚ØªÙŠ ðŸº\nØ£Ù†Øª Ø§Ù„Ø¢Ù† ÙÙŠ ÙØªØ±Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© (" + recoveryPeriod + " ÙŠÙˆÙ…) Ø¨Ø¯ÙˆÙ† Ø­Ù…Ø§ÙŠØ©." + pbMsg);
      props.setProperty('JUST_RELAPSED', "true");
      sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©:", getKeyboard(0));
    }
  }
  else if (text === "ØªØ±Ø§Ø¬Ø¹ âŒ" || text === "Ø±Ø¬ÙˆØ¹ â¬…ï¸") {
    sendMenu(chatId, "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ðŸ‘‡", getKeyboard(p));
  }
  else {
    sendMenu(chatId, "Ø§Ø®ØªØ± Ù…Ù† Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…Ø¹Ø³ÙƒØ± Ø¨Ø§Ù„Ø£Ø³ÙÙ„ ðŸ‘‡", getKeyboard(p));
  }
}

function getKeyboard(points) {
  var props = PropertiesService.getScriptProperties();
  var islamicDateStr = getIslamicDateStr();
  var isEmergency = (props.getProperty('EMERGENCY_MODE') === "true");

  var keys = [];
  var now = new Date();
  var currentTimeStr = Utilities.formatDate(now, "GMT+3", "HH:mm");
  var currentMinsRaw = parseTimeStr(currentTimeStr);
  var fajrMins = getFajrMins();
  var currentAbs = getAbsoluteMins(currentMinsRaw, fajrMins);

  var prayerTimes = getPrayerTimes();
  var prayers = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];

  var prayerRow1 = [];
  var prayerRow2 = [];

  for (var i = 0; i < prayers.length; i++) {
    var pName = prayers[i];
    var pAbs = getAbsoluteMins(parseTimeStr(prayerTimes[pName]), fajrMins);
    var hasPrayed = (props.getProperty('PRAYED_' + pName) === islamicDateStr);

    if (currentAbs >= pAbs && !hasPrayed) {
      if (prayerRow1.length < 3) {
        prayerRow1.push({"text": pName});
      } else {
        prayerRow2.push({"text": pName});
      }
    }
  }

  if (prayerRow1.length > 0) keys.push(prayerRow1);
  if (prayerRow2.length > 0) keys.push(prayerRow2);

  keys.push([{"text": "Ù…Ù„Ù Ø§Ù„ÙˆØ­Ø´ ðŸ¦"}, {"text": "Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ù‚ØªØ§Ù„ âš”ï¸"}]);

  var row4 = [];
  if (isEmergency) {
    row4.push({"text": "ÙÙƒ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ ðŸŸ¢"});
  } else {
    row4.push({"text": "Ø¥Ø°Ù† Ø·ÙˆØ§Ø±Ø¦ ðŸ›¡ï¸"});
  }
  row4.push({"text": "Ø³Ø¬Ù„ Ø§Ù„Ø³Ù‚ÙˆØ· ðŸ“‰"});
  row4.push({"text": "Ø®ØµÙ… ÙŠØ¯ÙˆÙŠ âž–"});
  keys.push(row4);

  var extraRow = [];
  extraRow.push({"text": "ØªØ­Ø¯ÙŠ Ù¤Ù  ÙŠÙˆÙ… ðŸ"});
  if (points >= 501) extraRow.push({"text": "Ù…Ù‡Ù…Ø© Ø®Ø§ØµØ© ðŸŽ¯"});
  if (points >= 1001) extraRow.push({"text": "ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„Ø¯Ø¹Ù… ðŸ“¦"});
  if (extraRow.length > 0) keys.push(extraRow);

  var extraRow2 = [];
  extraRow2.push({"text": "Ø®Ø²ÙŠÙ†Ø© Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª ðŸ†"});
  if (points >= 1001) extraRow2.push({"text": "Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ ðŸ“…"});
  if (extraRow2.length > 0) keys.push(extraRow2);

  var extraRow3 = [];
  extraRow3.push({"text": "ðŸ“… Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„ØµÙ„Ø§Ø©"});
  extraRow3.push({"text": "ðŸ“¿ Ø°ÙƒØ± Ø³Ø±ÙŠØ¹"});
  keys.push(extraRow3);

  var extraRow4 = [];
  if (points >= 500) extraRow4.push({"text": "ØµÙŠØ§Ù… Ù†Ø§ÙÙ„Ø© ðŸŒ™"});

  // Ramadan Tarawih Button Check
  var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");
  if (hMonth === 9) {
    if (extraRow4.length < 2) {
      extraRow4.push({"text": "ØµÙ„Ø§Ø© Ø§Ù„ØªØ±Ø§ÙˆÙŠØ­ ðŸ•Œ"});
    } else {
      keys.push(extraRow4);
      extraRow4 = [{"text": "ØµÙ„Ø§Ø© Ø§Ù„ØªØ±Ø§ÙˆÙŠØ­ ðŸ•Œ"}];
    }
  }

  if (extraRow4.length > 0) keys.push(extraRow4);

  return keys;
}

function postTelegram(method, payload) {
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/" + method;
  try {
    var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
    var response = UrlFetchApp.fetch(url, options);
    var result = safeParse(response.getContentText(), { ok: false, description: "Ø§Ø³ØªØ¬Ø§Ø¨Ø© ØºÙŠØ± ØµØ§Ù„Ø­Ø©" });
    if (!result.ok) Logger.log("Telegram " + method + " failed: " + result.description);
    return result;
  } catch (e) {
    Logger.log("Telegram " + method + " error: " + e.toString());
    return { ok: false, description: e.toString() };
  }
}

function sendTelegramText(chatId, text, keyboard) {
  var payload = { "chat_id": chatId, "text": text, "parse_mode": "Markdown" };
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard);
  var result = postTelegram("sendMessage", payload);
  if (!result.ok) {
    delete payload.parse_mode;
    postTelegram("sendMessage", payload);
  }
}

function sendMenu(chatId, text, keys) {
  sendTelegramText(chatId, text, {
    "keyboard": keys || getKeyboard(getPoints()),
    "resize_keyboard": true,
    "persistent": true
  });
}

function sendMenuCustom(chatId, text, keys) {
  sendTelegramText(chatId, text, {
    "keyboard": keys,
    "resize_keyboard": true,
    "persistent": true
  });
}

function sendMessage(chatId, text) {
  sendTelegramText(chatId, text, null);
}

// ---------------------------
// Utilities
// ---------------------------
function backupProperties(props) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var backupSheet = ss.getSheetByName("Backup");
  if (!backupSheet) backupSheet = ss.insertSheet("Backup");

  var allProps = props.getProperties();
  var propKeys = Object.keys(allProps).sort();
  var dateNow = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss");
  var values = [["Ø§Ù„Ù…ÙØªØ§Ø­", "Ø§Ù„Ù‚ÙŠÙ…Ø©", "ØªØ§Ø±ÙŠØ® Ø§Ù„Ù†Ø³Ø®"]];
  for (var i = 0; i < propKeys.length; i++) {
    values.push([propKeys[i], allProps[propKeys[i]], dateNow]);
  }

  backupSheet.clearContents();
  backupSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  backupSheet.setFrozenRows(1);
  return { count: propKeys.length, date: dateNow };
}

function restoreProperties(props) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var backupSheet = ss.getSheetByName("Backup");
  if (!backupSheet) throw new Error("Ù…ÙÙŠØ´ ÙˆØ±Ù‚Ø© Backup Ù…ÙˆØ¬ÙˆØ¯Ø©. Ø§Ø¹Ù…Ù„ /backup Ø§Ù„Ø£ÙˆÙ„.");

  var data = backupSheet.getDataRange().getValues();
  if (data.length <= 1 || data[0][0] !== "Ø§Ù„Ù…ÙØªØ§Ø­" || data[0][1] !== "Ø§Ù„Ù‚ÙŠÙ…Ø©") {
    throw new Error("Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© ØºÙŠØ± ØµØ§Ù„Ø­ Ø£Ùˆ ÙØ§Ø±Øº.");
  }

  var values = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var value = data[i][1];
    if (typeof key === 'string' && key && value !== undefined && value !== null) {
      values[key] = value.toString();
    }
  }
  if (Object.keys(values).length === 0) throw new Error("Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø¨ÙŠØ§Ù†Ø§Øª ØµØ§Ù„Ø­Ø©.");

  props.setProperties(values, false);
  return Object.keys(values).length;
}

function logToSheet(type, value) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Logs");
    if (!sheet) {
      sheet = ss.insertSheet("Logs");
      sheet.appendRow(["Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ù‚ÙŠÙ…Ø©"]);
    }
    var dateStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd");
    var timeStr = Utilities.formatDate(new Date(), "GMT+3", "HH:mm:ss");
    sheet.appendRow([dateStr, timeStr, type, value]);
  } catch (e) {
    Logger.log("Error in Sheet: " + e.toString());
  }
}

function getStreakDetails() {
  var props = PropertiesService.getScriptProperties();
  var lastReset = props.getProperty('LAST_RESET_DATE');
  if (!lastReset) {
    lastReset = new Date().getTime().toString();
    props.setProperty('LAST_RESET_DATE', lastReset);
  }
  var now = new Date().getTime();
  var diff = now - parseInt(lastReset);

  var days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  var hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  var mins = Math.floor(diff / (1000 * 60));
  diff -= mins * (1000 * 60);
  var secs = Math.floor(diff / 1000);

  return "ðŸ—“ï¸ " + days + " Ø£ÙŠØ§Ù…\nâ³ " + hours + " Ø³Ø§Ø¹Ø©\nâ±ï¸ " + mins + " Ø¯Ù‚ÙŠÙ‚Ø©\nâ±ï¸ " + secs + " Ø«Ø§Ù†ÙŠØ©";
}

function getStreakDays() {
  var props = PropertiesService.getScriptProperties();
  var lastReset = props.getProperty('LAST_RESET_DATE');
  if (!lastReset) {
    lastReset = new Date().getTime().toString();
    props.setProperty('LAST_RESET_DATE', lastReset);
  }
  var now = new Date().getTime();
  var diff = now - parseInt(lastReset);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getStreakMultiplier() {
  var props = PropertiesService.getScriptProperties();
  var recoveryPeriod = parseInt(props.getProperty('RECOVERY_PERIOD') || "7");
  var days = getStreakDays();
  if (days < recoveryPeriod) return 2.0;     // ðŸ”¥ ÙˆØ¶Ø¹ Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© (ØªØ´Ø¬ÙŠØ¹)
  if (days >= 90) return 3.0;   // ðŸŒŒ Ø£Ø³Ø·ÙˆØ±ÙŠ
  if (days >= 60) return 2.5;   // ðŸ’Ž Ù…Ø­ØªØ±Ù
  if (days >= 30) return 2.0;   // ðŸ† Ù…ØªÙ‚Ø¯Ù…
  if (days >= 14) return 1.5;   // ðŸ”¥ Ø¬ÙŠØ¯
  return 1.0;                   // Ø¹Ø§Ø¯ÙŠ
}

function getMultiplierLabel() {
  var props = PropertiesService.getScriptProperties();
  var recoveryPeriod = parseInt(props.getProperty('RECOVERY_PERIOD') || "7");
  var days = getStreakDays();
  var m = getStreakMultiplier();
  if (days < recoveryPeriod) return "ðŸ”¥ ÙˆØ¶Ø¹ Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© (Ã—2)";
  if (m >= 3.0) return "ðŸŒŒ Ø£Ø³Ø·ÙˆØ±ÙŠ (Ã—3)";
  if (m >= 2.5) return "ðŸ’Ž Ù…Ø­ØªØ±Ù (Ã—2.5)";
  if (m >= 2.0) return "ðŸ† Ù…ØªÙ‚Ø¯Ù… (Ã—2)";
  if (m >= 1.5) return "ðŸ”¥ ÙÙŠ Ø·Ø±ÙŠÙ‚Ùƒ (Ã—1.5)";
  return "âš”ï¸ Ø§Ø¨Ø¯Ø£ (Ã—1)";
}

function resetStreak() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('LAST_RESET_DATE', new Date().getTime().toString());
}

function getStreakMessage(days) {
  var props = PropertiesService.getScriptProperties();
  var recoveryPeriod = parseInt(props.getProperty('RECOVERY_PERIOD') || "7");
  var hour = parseInt(Utilities.formatDate(new Date(), "GMT+3", "HH"));
  var phase = Math.floor(hour / 6);
  var phaseTitles = ["ðŸŒ™ ÙˆØ±Ø¯ÙŠØ© Ø§Ù„Ù„ÙŠÙ„", "ðŸŒ… ÙˆØ±Ø¯ÙŠØ© Ø§Ù„ÙØ¬Ø±", "â˜€ï¸ ÙˆØ±Ø¯ÙŠØ© Ø§Ù„Ù†Ù‡Ø§Ø±", "ðŸŒ† ÙˆØ±Ø¯ÙŠØ© Ø§Ù„Ù…Ø³Ø§Ø¡"];
  var phaseLines = [
    ["Ø§Ù„Ù„ÙŠÙ„ Ø¨ÙŠØ®ØªØ¨Ø± Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ù‡Ø§Ø¯ÙŠØ©. Ø§Ø¨Ø¹Ø¯ Ø®Ø·ÙˆØ© Ø¹Ù† Ø£ÙŠ Ø¨Ø§Ø¨ Ø®Ø·Ø±.", "Ø§Ù„Ù‡Ø¯ÙˆØ¡ Ø¯Ù‡ ÙØ±ØµØ©Ø› Ø§Ù‚ÙÙ„ ÙŠÙˆÙ…Ùƒ Ø¹Ù„Ù‰ Ø­Ø§Ø¬Ø© ØªÙØªØ®Ø± Ø¨ÙŠÙ‡Ø§.", "Ù…Ø´ ÙƒÙ„ Ù…Ø¹Ø±ÙƒØ© ØµÙˆØªÙ‡Ø§ Ø¹Ø§Ù„ÙŠ. Ø«Ø¨Ø§ØªÙƒ Ø§Ù„Ù„ÙŠÙ„Ø© Ù…Ø­Ø³ÙˆØ¨."],
    ["Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„ÙŠÙˆÙ… Ø¨ØªÙƒØªØ¨ Ø§ØªØ¬Ø§Ù‡Ù‡. Ø£ÙˆÙ„ Ø§Ø®ØªÙŠØ§Ø± ØµØ­ Ø¨ÙŠÙØ±Ù‚.", "Ø§Ù„Ù†Ø§Ø³ Ù„Ø³Ù‡ Ø¨ØªØµØ­Ù‰ØŒ ÙˆØ£Ù†Øª Ø¨ØªØ¨Ù†ÙŠ Ø³Ø¨Ù‚ ØµØºÙŠØ± Ù„Ù†ÙØ³Ùƒ.", "Ø®Ù„ÙŠ Ø§Ù„ÙØ¬Ø± Ø¹Ù„Ø§Ù…Ø© Ø¥Ù†Ùƒ Ù…Ø§Ø³Ùƒ Ø²Ù…Ø§Ù… ÙŠÙˆÙ…Ùƒ."],
    ["ÙˆØ³Ø· Ø§Ù„Ø²Ø­Ù…Ø©ØŒ Ø§Ù„Ø«Ø¨Ø§Øª Ù‚Ø±Ø§Ø± ÙŠØªØ§Ø®Ø¯ Ù…Ø±Ø© ÙˆØ±Ø§ Ù…Ø±Ø©.", "Ø®Ø¯ Ø¯Ù‚ÙŠÙ‚Ø© ØªÙ†Ø¸Ù… Ù†ÙØ³Ùƒ Ù‚Ø¨Ù„ Ù…Ø§ Ø§Ù„ÙŠÙˆÙ… ÙŠØ³Ø­Ø¨Ùƒ.", "Ø¥Ù†Ø¬Ø§Ø² Ù‡Ø§Ø¯ÙŠ Ø¯Ù„ÙˆÙ‚ØªÙŠ Ø£Ø­Ø³Ù† Ù…Ù† Ù†ÙŠØ© ÙƒØ¨ÙŠØ±Ø© ØªØªØ£Ø¬Ù„."],
    ["Ø§Ù‚ÙÙ„ ÙŠÙˆÙ…Ùƒ Ø¨Ù‚Ø±Ø§Ø± ÙŠØ®Ù„ÙŠ Ø¨ÙƒØ±Ø© Ø£Ø³Ù‡Ù„.", "Ø§Ù„Ù…Ø³Ø§Ø¡ ÙˆÙ‚Øª Ù…Ø±Ø§Ø¬Ø¹Ø©ØŒ Ù…Ø´ Ø¬Ù„Ø¯ Ø°Ø§Øª. Ø®Ø·ÙˆØ© ØµØ­ ÙˆÙƒÙ…Ù„.", "Ù„Ùˆ Ø§Ù„ÙŠÙˆÙ… ÙƒØ§Ù† ØªÙ‚ÙŠÙ„ØŒ Ø®Ù„ÙŠÙ‡ ÙŠØ®Ù„Øµ ÙˆØ£Ù†Øª ÙˆØ§Ù‚Ù." ]
  ];
  var stage = "";

  if (days === 0) stage = "Ø¶Ø±Ø¨Ø© Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©. Ø§Ù„Ù„ÙŠ ÙØ§Øª Ø§Ù†ØªÙ‡Ù‰Ø› Ø§Ù„Ù…Ù‡Ù…Ø© Ø¯Ù„ÙˆÙ‚ØªÙŠ Ù‡ÙŠ Ø§Ù„Ø³Ø§Ø¹Ø© Ø§Ù„Ø¬Ø§ÙŠØ©.";
  else if (days < 3) stage = "Ø£ÙˆÙ„ Ø§Ù„Ø£ÙŠØ§Ù… Ø­Ø³Ø§Ø³Ø©ØŒ ÙˆÙƒÙ„ Ù‚Ø±Ø§Ø± ØµØºÙŠØ± Ø¨ÙŠØ­Ù…ÙŠ Ø§Ù„Ø³ØªØ±ÙŠÙƒ.";
  else if (days < recoveryPeriod) stage = "Ø£Ù†Øª ÙÙŠ Ù…Ø±Ø­Ù„Ø© Ø§Ø³ØªØ¹Ø§Ø¯Ø©. Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ø«Ø¨Ø§ØªØŒ Ù…Ø´ Ø¶ØºØ· Ù…Ø«Ø§Ù„ÙŠ.";
  else if (days === recoveryPeriod) stage = "ÙØªØ±Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù†ØªÙ‡Øª. Ø±Ø¬Ø¹Øª Ù„Ù„Ø³Ø§Ø­Ø© ÙˆØ£Ù†Øª Ø£Ù‡Ø¯Ù‰ ÙˆØ£Ù‚ÙˆÙ‰.";
  else if (days < 7) stage = "Ø¨Ø§Ù‚ÙŠ Ø®Ø·ÙˆØ§Øª Ù‚Ù„ÙŠÙ„Ø© Ø¹Ù„Ù‰ Ø£Ø³Ø¨ÙˆØ¹ ÙƒØ§Ù…Ù„ â€” Ù…ØªØ¯ÙŠØ´ Ø§Ù„Ø¹Ø§Ø¯Ø© Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ù…Ø³Ø§Ø­Ø©.";
  else if (days < 14) stage = "Ø£Ø³Ø¨ÙˆØ¹ ØµÙ…ÙˆØ¯ Ù…Ø´ ØµØ¯ÙØ©Ø› Ø¯Ù‡ Ø¯Ù„ÙŠÙ„ Ø¥Ù†Ùƒ Ù‚Ø§Ø¯Ø± ØªÙƒØ±Ø± Ø§Ù„ØµØ­.";
  else if (days < 30) stage = "Ø§Ù„Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ø¨ØªØ§Ø®Ø¯ Ø´ÙƒÙ„Ù‡Ø§. Ø­Ø§ÙØ¸ Ø¹Ù„Ù‰ Ø§Ù„Ø±ÙˆØªÙŠÙ† Ø§Ù„Ù„ÙŠ Ø¬Ø§Ø¨Ùƒ Ù„Ø­Ø¯ Ù‡Ù†Ø§.";
  else if (days < 60) stage = "Ø£Ù†Øª ÙÙŠ Ù…Ø±Ø­Ù„Ø© Ø¨Ù†Ø§Ø¡ Ù‡ÙˆÙŠØ©ØŒ Ù…Ø´ Ù…Ø¬Ø±Ø¯ Ø¹Ø¯Ø§Ø¯ Ø£ÙŠØ§Ù….";
  else if (days < 90) stage = "ÙƒÙ„ ÙŠÙˆÙ… Ø²ÙŠØ§Ø¯Ø© Ø¨ÙŠØ«Ø¨Øª Ø¥Ù†Ùƒ Ù…Ø´ Ù†ÙØ³ Ø§Ù„Ø´Ø®Øµ Ø§Ù„Ù„ÙŠ Ø¨Ø¯Ø£.";
  else if (days < 180) stage = "Ø«Ø¨Ø§ØªÙƒ Ø¨Ù‚Ù‰ Ù„Ù‡ ÙˆØ²Ù†. Ø®Ù„ÙŠÙƒ Ø­Ø°Ø± Ù…Ù† Ø§Ù„Ø«Ù‚Ø© Ø§Ù„Ø²ÙŠØ§Ø¯Ø©.";
  else stage = "Ø§Ù„Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ù‡Ù†Ø§ Ø¥Ù†Ø¬Ø§Ø² Ù†Ø§Ø¯Ø±. Ø­Ø§ÙØ¸ Ø¹Ù„Ù‰ ØªÙˆØ§Ø¶Ø¹ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© ÙˆØªØ±ÙƒÙŠØ²Ù‡Ø§.";

  var lineIndex = (days + phase + parseInt(Utilities.formatDate(new Date(), "GMT+3", "d"))) % phaseLines[phase].length;
  return phaseTitles[phase] + "\n" + stage + "\n\n" + phaseLines[phase][lineIndex];
}

// ---------------------------
// Automations & Triggers
// ---------------------------
function sendWeeklySummary(chatId, props) {
  var onTime = parseInt(props.getProperty('WEEKLY_ON_TIME_COUNT') || "0");
  var qadaa = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
  var totalPrayers = onTime + qadaa;
  var percentage = totalPrayers === 0 ? 0 : Math.floor((onTime / totalPrayers) * 100);

  var msg = "ðŸ“… **Ø§Ù„Ù…Ù„Ø®Øµ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ Ù„Ù„Ù‚ÙŠØ§Ø¯Ø©:**\n\n";
  msg += "Ø£Ø¯ÙŠØª Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø¯Ù‡ " + onTime + " ØµÙ„ÙˆØ§Øª ÙÙŠ ÙˆÙ‚ØªÙ‡Ù…ØŒ Ùˆ " + qadaa + " Ù‚Ø¶Ø§Ø¡.\n";
  msg += "Ù†Ø³Ø¨Ø© Ø§Ù„Ø§Ù„ØªØ²Ø§Ù…: " + percentage + "%\n\n";
  var performanceHistory = safeParse(props.getProperty('WEEKLY_PERFORMANCE_HISTORY'), []);
  if (performanceHistory.length > 0 && typeof performanceHistory[0].percentage === 'number') {
    var delta = percentage - performanceHistory[0].percentage;
    if (delta > 0) msg += "ðŸ“ˆ Ø£ÙØ¶Ù„ Ù…Ù† Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù…Ø§Ø¶ÙŠ Ø¨Ù€ " + delta + "% â€” Ø¨ØªÙ†Ø§ÙØ³ Ù†ÙØ³Ùƒ ØµØ­.\n";
    else if (delta < 0) msg += "ðŸ“‰ Ø£Ù‚Ù„ Ù…Ù† Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù…Ø§Ø¶ÙŠ Ø¨Ù€ " + Math.abs(delta) + "% â€” Ø¹Ù†Ø¯Ùƒ Ù‡Ø¯Ù ÙˆØ§Ø¶Ø­ Ù„Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ø¬Ø§ÙŠ.\n";
    else msg += "âž– Ù†ÙØ³ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù…Ø§Ø¶ÙŠ â€” ÙƒØ³Ø± Ø§Ù„ØªØ¹Ø§Ø¯Ù„ Ù‡Ø¯ÙÙƒ Ø§Ù„Ù‚Ø§Ø¯Ù….\n";
  }
  if (percentage >= 90) msg += "Ø£Ø¯Ø§Ø¡ Ø£Ø³Ø·ÙˆØ±ÙŠ! Ø§Ø³ØªÙ…Ø± ÙŠØ§ Ø¨Ø·Ù„. ðŸ¦…";
  else if (percentage >= 50) msg += "Ø£Ø¯Ø§Ø¡ Ù…ØªÙˆØ³Ø·ØŒ ØªÙ‚Ø¯Ø± ØªØ¹Ù…Ù„ Ø£Ø­Ø³Ù† Ù…Ù† ÙƒØ¯Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ø¬Ø§ÙŠ. âš”ï¸";
  else msg += "Ø£Ø¯Ø§Ø¡ Ø¶Ø¹ÙŠÙ! Ù„Ø§Ø²Ù… ØªÙÙˆÙ‚ Ù„Ù†ÙØ³ÙƒØŒ Ø§Ù„Ù…Ø¹Ø³ÙƒØ± Ù…Ø§Ø¨ÙŠØ±Ø­Ù…Ø´ Ø§Ù„Ù…ÙƒØ³Ù„ÙŠÙ†. âš ï¸";

  sendMessage(chatId, msg);

  performanceHistory.unshift({ percentage: percentage, onTime: onTime, qadaa: qadaa, date: getIslamicDateStr() });
  if (performanceHistory.length > 12) performanceHistory.length = 12;
  props.setProperty('WEEKLY_PERFORMANCE_HISTORY', JSON.stringify(performanceHistory));

  props.setProperty('WEEKLY_ON_TIME_COUNT', "0");
  props.setProperty('WEEKLY_QADAA_COUNT', "0");
  var now = new Date();
  var resetTime = now.getTime();
  props.setProperty('LAST_WEEKLY_RESET_DATE', resetTime.toString());
}

function sendMonthlySummary(chatId, props) {
  var p = parseInt(props.getProperty('POINTS') || "0");
  var maxStreak = props.getProperty('MAX_PRAYER_STREAK') || "0";
  var pb = props.getProperty('PERSONAL_BEST_STREAK') || "0";
  var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);
  var fCount = shameArr.length;

  var msg = "ðŸ“Š **Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ Ø§Ù„Ø´Ø§Ù…Ù„:**\n\n";
  msg += "Ø±ØµÙŠØ¯ Ø§Ù„Ù†Ù‚Ø§Ø· Ø§Ù„Ø­Ø§Ù„ÙŠ: " + p + " Ù†Ù‚Ø·Ø© ðŸ’Ž\n";
  msg += "Ø£Ø¹Ù„Ù‰ Ø³ØªØ±ÙŠÙƒ ØµÙ„ÙˆØ§Øª Ù…ØªØªØ§Ù„ÙŠØ©: " + maxStreak + " ÙŠÙˆÙ… ðŸ”¥\n";
  msg += "Ø£Ø¹Ù„Ù‰ ØµÙ…ÙˆØ¯ (PB): " + pb + " ÙŠÙˆÙ… ðŸ‘‘\n";
  msg += "Ø¹Ø¯Ø¯ Ø§Ù„Ø³Ù‚Ø·Ø§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: " + fCount + " Ù…Ø±Ø© ðŸ“‰\n\n";
  msg += "Ø§Ø³ØªØ¹Ø¯ Ù„Ø´Ù‡Ø± Ø¬Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„ØªØ­Ø¯ÙŠØ§ØªØŒ Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø¨ØªØ±Ø§Ù‚Ø¨Ùƒ! ðŸ¦…";

  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
    if (!sheet) throw new Error("Logs sheet not found");
    var data = sheet.getDataRange().getValues();
    var currentMonth = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM");
    var fixCount = 0;
    var qadaaCount = 0;
    for(var i=1; i<data.length; i++) {
      var dStr = data[i][0] ? data[i][0].toString() : "";
      if (dStr.indexOf(currentMonth) > -1) {
        if (data[i][2] === "FIX_USED") fixCount++;
        if (data[i][2] === "PUNISH_QADAA") qadaaCount++;
      }
    }
    msg += "\n\n**Ù…Ù† Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© (Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ):**\n";
    msg += "Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø£Ù…Ø± /fix Ù„Ù„Ø·ÙˆØ§Ø±Ø¦: " + fixCount + " Ù…Ø±Ø©\n";
    msg += "ØµÙ„ÙˆØ§Øª Ù‚Ø¶Ø§Ø¡: " + qadaaCount + " ØµÙ„Ø§Ø©\n";
  } catch(e) {}

  sendMessage(chatId, msg);
}

function sendMorningVerse(chatId) {
  var verses = [
    "Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: {ÙˆÙŽØ§Ø³Ù’ØªÙŽØ¹ÙÙŠÙ†ÙÙˆØ§ Ø¨ÙØ§Ù„ØµÙŽÙ‘Ø¨Ù’Ø±Ù ÙˆÙŽØ§Ù„ØµÙŽÙ‘Ù„ÙŽØ§Ø©Ù Ûš ÙˆÙŽØ¥ÙÙ†ÙŽÙ‘Ù‡ÙŽØ§ Ù„ÙŽÙƒÙŽØ¨ÙÙŠØ±ÙŽØ©ÙŒ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø¹ÙŽÙ„ÙŽÙ‰ Ø§Ù„Ù’Ø®ÙŽØ§Ø´ÙØ¹ÙÙŠÙ†ÙŽ}",
    "Ø¹Ù† Ø§Ù„Ù†Ø¨ÙŠ ï·º: Â«Ø±ÙŽÙƒÙ’Ø¹ÙŽØªÙŽØ§ Ø§Ù„Ù’ÙÙŽØ¬Ù’Ø±Ù Ø®ÙŽÙŠÙ’Ø±ÙŒ Ù…ÙÙ†ÙŽ Ø§Ù„Ø¯ÙÙ‘Ù†Ù’ÙŠÙŽØ§ ÙˆÙŽÙ…ÙŽØ§ ÙÙÙŠÙ‡ÙŽØ§Â»",
    "Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: {Ø¥ÙÙ†ÙŽÙ‘ Ù‚ÙØ±Ù’Ø¢Ù†ÙŽ Ø§Ù„Ù’ÙÙŽØ¬Ù’Ø±Ù ÙƒÙŽØ§Ù†ÙŽ Ù…ÙŽØ´Ù’Ù‡ÙÙˆØ¯Ù‹Ø§}",
    "Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: {ÙˆÙŽÙ…ÙŽÙ† ÙŠÙŽØªÙŽÙ‘Ù‚Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ ÙŠÙŽØ¬Ù’Ø¹ÙŽÙ„ Ù„ÙŽÙ‘Ù‡Ù Ù…ÙŽØ®Ù’Ø±ÙŽØ¬Ù‹Ø§}",
    "Ø¹Ù† Ø§Ù„Ù†Ø¨ÙŠ ï·º: Â«Ù…ÙŽÙ†Ù’ ØµÙŽÙ„ÙŽÙ‘Ù‰ Ø§Ù„ØµÙÙ‘Ø¨Ù’Ø­ÙŽ ÙÙŽÙ‡ÙÙˆÙŽ ÙÙÙŠ Ø°ÙÙ…ÙŽÙ‘Ø©Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÂ»",
    "Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: {ÙˆÙŽØ§Ù„ÙŽÙ‘Ø°ÙÙŠÙ†ÙŽ Ø¬ÙŽØ§Ù‡ÙŽØ¯ÙÙˆØ§ ÙÙÙŠÙ†ÙŽØ§ Ù„ÙŽÙ†ÙŽÙ‡Ù’Ø¯ÙÙŠÙŽÙ†ÙŽÙ‘Ù‡ÙÙ…Ù’ Ø³ÙØ¨ÙÙ„ÙŽÙ†ÙŽØ§}",
    "Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: {Ø¥ÙÙ†ÙŽÙ‘ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ Ù…ÙŽØ¹ÙŽ Ø§Ù„ØµÙŽÙ‘Ø§Ø¨ÙØ±ÙÙŠÙ†ÙŽ}"
  ];
  var ramadanVerses = [
    "Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: {Ø´ÙŽÙ‡Ù’Ø±Ù Ø±ÙŽÙ…ÙŽØ¶ÙŽØ§Ù†ÙŽ Ø§Ù„ÙŽÙ‘Ø°ÙÙŠ Ø£ÙÙ†Ø²ÙÙ„ÙŽ ÙÙÙŠÙ‡Ù Ø§Ù„Ù’Ù‚ÙØ±Ù’Ø¢Ù†Ù Ù‡ÙØ¯Ù‹Ù‰ Ù„ÙÙ‘Ù„Ù†ÙŽÙ‘Ø§Ø³Ù ÙˆÙŽØ¨ÙŽÙŠÙÙ‘Ù†ÙŽØ§ØªÙ Ù…ÙÙ‘Ù†ÙŽ Ø§Ù„Ù’Ù‡ÙØ¯ÙŽÙ‰Ù° ÙˆÙŽØ§Ù„Ù’ÙÙØ±Ù’Ù‚ÙŽØ§Ù†Ù}",
    "Ø¹Ù† Ø§Ù„Ù†Ø¨ÙŠ ï·º: Â«Ù…ÙŽÙ†Ù’ ØµÙŽØ§Ù…ÙŽ Ø±ÙŽÙ…ÙŽØ¶ÙŽØ§Ù†ÙŽ Ø¥ÙÙŠÙ…ÙŽØ§Ù†Ù‹Ø§ ÙˆÙŽØ§Ø­Ù’ØªÙØ³ÙŽØ§Ø¨Ù‹Ø§ ØºÙÙÙØ±ÙŽ Ù„ÙŽÙ‡Ù Ù…ÙŽØ§ ØªÙŽÙ‚ÙŽØ¯ÙŽÙ‘Ù…ÙŽ Ù…ÙÙ†Ù’ Ø°ÙŽÙ†Ù’Ø¨ÙÙ‡ÙÂ»",
    "Ø¹Ù† Ø§Ù„Ù†Ø¨ÙŠ ï·º: Â«Ø§Ù„ØµÙÙ‘ÙŠÙŽØ§Ù…Ù ÙˆÙŽØ§Ù„Ù’Ù‚ÙØ±Ù’Ø¢Ù†Ù ÙŠÙŽØ´Ù’ÙÙŽØ¹ÙŽØ§Ù†Ù Ù„ÙÙ„Ù’Ø¹ÙŽØ¨Ù’Ø¯Ù ÙŠÙŽÙˆÙ’Ù…ÙŽ Ø§Ù„Ù’Ù‚ÙÙŠÙŽØ§Ù…ÙŽØ©ÙÂ»"
  ];

  var props = PropertiesService.getScriptProperties();
  var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");

  var msg = "ðŸŒ… **Ø¥Ø´Ø±Ø§Ù‚Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©:**\n\n";
  if (hMonth === 9) {
    msg += pickFreshContent(props, "RAMADAN_VERSE", ramadanVerses);
  } else {
    msg += pickFreshContent(props, "MORNING_VERSE", verses);
  }
  sendMessage(chatId, msg);
}

function getPrayerTimes() {
  var props = PropertiesService.getScriptProperties();
  var todayDateStr = Utilities.formatDate(new Date(), "GMT+3", "dd-MM-yyyy");
  var cachedDate = props.getProperty('PRAYER_DATE');
  if (cachedDate === todayDateStr) {
    var cachedTimes = props.getProperty('PRAYER_TIMES');
    if (cachedTimes) {
      var parsed = JSON.parse(cachedTimes);
      if (parsed["Ø§Ù„Ø´Ø±ÙˆÙ‚"]) return parsed;
    }
  }

  var prayerTimes;
  try {
    var response = UrlFetchApp.fetch("https://api.aladhan.com/v1/timingsByCity?city=Tanta&country=Egypt&method=5");
    var data = JSON.parse(response.getContentText());
    var timings = data.data.timings;
    prayerTimes = {
      "Ø§Ù„ÙØ¬Ø±": timings.Fajr,
      "Ø§Ù„Ø´Ø±ÙˆÙ‚": timings.Sunrise,
      "Ø§Ù„Ø¸Ù‡Ø±": timings.Dhuhr,
      "Ø§Ù„Ø¹ØµØ±": timings.Asr,
      "Ø§Ù„Ù…ØºØ±Ø¨": timings.Maghrib,
      "Ø§Ù„Ø¹Ø´Ø§Ø¡": timings.Isha
    };
    if (data.data.date && data.data.date.hijri && data.data.date.hijri.month) {
      props.setProperty('HIJRI_MONTH', data.data.date.hijri.month.number.toString());
    }
    props.setProperty('PRAYER_DATE', todayDateStr);
    props.setProperty('PRAYER_TIMES', JSON.stringify(prayerTimes));
  } catch(e) {
    Logger.log("Prayer API failed: " + e.toString());
    var cached = props.getProperty('PRAYER_TIMES');
    if (cached) return JSON.parse(cached);

    // Fallback
    prayerTimes = {
      "Ø§Ù„ÙØ¬Ø±": "04:30", "Ø§Ù„Ø´Ø±ÙˆÙ‚": "06:00",
      "Ø§Ù„Ø¸Ù‡Ø±": "12:00", "Ø§Ù„Ø¹ØµØ±": "15:30",
      "Ø§Ù„Ù…ØºØ±Ø¨": "18:00", "Ø§Ù„Ø¹Ø´Ø§Ø¡": "19:30"
    };
  }
  return prayerTimes;
}

function checkAndSendReminder(type, prayer, date, chatId, msg) {
  var props = PropertiesService.getScriptProperties();
  var key = type + '_' + prayer + '_' + date;
  if (!props.getProperty(key)) {
    var p = parseInt(props.getProperty('POINTS') || "0");
    sendMenu(chatId, msg, getKeyboard(p));
    props.setProperty(key, "true");
    return true;
  }
  return false;
}

function checkAndRemind() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var props = PropertiesService.getScriptProperties();
    var now = new Date();

    var chatId = props.getProperty('ADMIN_CHAT_ID');
    if (!chatId) chatId = props.getProperty('CHAT_ID');
    if (!chatId) return;
    updateFortyChallenge(props, chatId);

  var nowTime = now.getTime();
  var lastInteraction = parseInt(props.getProperty('LAST_INTERACTION_TIME') || nowTime.toString());
  var isSleepMode = props.getProperty('IS_SLEEP_MODE') === "true";
  var isEmergency = (props.getProperty('EMERGENCY_MODE') === "true");

  if (!isEmergency && !isSleepMode && (nowTime - lastInteraction) > 6 * 60 * 60 * 1000) {
    props.setProperty('EMERGENCY_MODE', "true");
    props.setProperty('IS_SLEEP_MODE', "true");
    props.setProperty('SLEEP_GRACE_UNTIL', "0");
    sendMessage(chatId, "ðŸ’¤ ÙŠØ¨Ø¯Ùˆ Ø£Ù†Ùƒ ÙÙŠ Ø³Ø¨Ø§Øª Ø¹Ù…ÙŠÙ‚ (Ø®Ù…ÙˆÙ„ 6 Ø³Ø§Ø¹Ø§Øª). ØªÙ… ØªÙØ¹ÙŠÙ„ **ÙˆØ¶Ø¹ Ø§Ù„Ø³Ø¨Ø§Øª Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ** Ù„Ø­Ù…Ø§ÙŠØªÙƒ Ù…Ù† Ø§Ù„Ø®ØµÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø³ØªÙ…Ø±Ø© ÙˆØ§Ù„Ø¥Ù†Ø°Ø§Ø±Ø§Øª.\n(ØµÙ„ÙˆØ§ØªÙƒ Ø§Ù„ÙØ§Ø¦ØªØ© Ù„Ù† ØªÙƒØ³Ø± Ø§Ù„Ø³ØªØ±ÙŠÙƒ Ø¹Ù†Ø¯ ØªØ³Ø¬ÙŠÙ„Ù‡Ø§ Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸) ðŸ›¡ï¸");
    isEmergency = true;
  }

  var currentTimeStr = Utilities.formatDate(now, "GMT+3", "HH:mm");
  var currentMinsRaw = parseTimeStr(currentTimeStr);

  var prayerTimes = getPrayerTimes();
  var fajrMins = getFajrMins();
  var currentAbs = getAbsoluteMins(currentMinsRaw, fajrMins);
  var islamicDateStr = getIslamicDateStr();
  if (props.getProperty('JOKER_ACTIVE') === "true" && props.getProperty('JOKER_DATE') !== islamicDateStr) {
    props.setProperty('JOKER_ACTIVE', "false");
    props.deleteProperty('JOKER_TASK');
    props.deleteProperty('JOKER_DATE');
  }
  var missed = getMissedPrayers(currentAbs, prayerTimes, props, islamicDateStr, fajrMins);

  var currentDay = Utilities.formatDate(now, "GMT+3", "u");
  if (currentDay === "5" && currentAbs >= 1200) {
    var weeklyKey = 'WEEKLY_SUMMARY_' + islamicDateStr;
    if (!props.getProperty(weeklyKey)) {
      sendWeeklySummary(chatId, props);
      props.setProperty(weeklyKey, "true");
    }
  }

  var currentMonthDay = Utilities.formatDate(now, "GMT+3", "dd");
  if (currentMonthDay === "01" && currentAbs >= 1200) {
    var monthlyKey = 'MONTHLY_SUMMARY_' + Utilities.formatDate(now, "GMT+3", "yyyy-MM");
    if (!props.getProperty(monthlyKey)) {
      sendMonthlySummary(chatId, props);
      props.setProperty(monthlyKey, "true");
    }
  }

  var morningTarget = fajrMins + 15;
  if (currentAbs >= morningTarget && currentAbs <= morningTarget + 10) {
    var verseKey = 'MORNING_VERSE_' + islamicDateStr;
    if (!props.getProperty(verseKey)) {
      sendMorningVerse(chatId);
      props.setProperty(verseKey, "true");
    }
  }

  var missedText = "";
  if (missed.length > 0) {
    missedText = "âš ï¸ Ø¥Ù†Øª Ø¹Ù„ÙŠÙƒ Ù‚Ø¶Ø§Ø¡ (" + missed.join(" Ùˆ ") + "). ";
  }

  var prayers = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];

  for (var i = 0; i < prayers.length; i++) {
    var pName = prayers[i];
    var pAbs = getAbsoluteMins(parseTimeStr(prayerTimes[pName]), fajrMins);
    var diff = currentAbs - pAbs;

    if (!isEmergency && missed.length > 0) {
      if (diff >= -30 && diff <= -25) {
        checkAndSendReminder('EMERGENCY_30', pName, islamicDateStr, chatId, "Ø¥Ù†Ø°Ø§Ø± Ø£Ø­Ù…Ø± ðŸš¨: " + missedText + "ÙˆØ£Ø°Ø§Ù† " + pName + " ÙØ§Ø¶Ù„ Ø¹Ù„ÙŠÙ‡ Ù†Øµ Ø³Ø§Ø¹Ø©. Ø§ØªØ­Ø±Ùƒ ÙÙˆØ±Ø§Ù‹!");
      } else if (diff >= -15 && diff <= -10) {
        checkAndSendReminder('EMERGENCY_15', pName, islamicDateStr, chatId, "Ø§Ù„ÙØ±ØµØ© Ø§Ù„Ø£Ø®ÙŠØ±Ø© âš ï¸: Ø±Ø¨Ø¹ Ø³Ø§Ø¹Ø© ÙˆØ§Ù„Ù…Ù‡Ù…Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ù‡ØªØ¶ÙŠØ¹ ÙˆØªØ®Ø³Ø± Ù†Ù‚Ø·. Ù‚ÙˆÙ… Ø¯Ù„ÙˆÙ‚ØªÙŠ! " + missedText);
      } else if (diff >= -5 && diff <= 0) {
        checkAndSendReminder('EMERGENCY_5', pName, islamicDateStr, chatId, "5 Ø¯Ù‚Ø§ÙŠÙ‚! Ù…ÙÙŠØ´ ÙˆÙ‚Øª Ù„Ù„Ø£Ø¹Ø°Ø§Ø±. Ø£Ø«Ø¨Øª Ø¥Ù†Ùƒ ÙˆØ­Ø´ ÙˆØ®Ù„Øµ Ø§Ù„Ù„ÙŠ Ø¹Ù„ÙŠÙƒ âš”ï¸");
      }
    }

    var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");

    if (hMonth === 9) {
      if (pName === "Ø§Ù„ÙØ¬Ø±" && diff >= -45 && diff <= -40) {
        checkAndSendReminder('SUHOOR_REMINDER', pName, islamicDateStr, chatId, "ðŸŒ™ Ø³Ø­ÙˆØ± ÙŠØ§ ØµØ§ÙŠÙ…! 45 Ø¯Ù‚ÙŠÙ‚Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙØ¬Ø±. ØªØ³Ø­Ø±ÙˆØ§ ÙØ¥Ù† ÙÙŠ Ø§Ù„Ø³Ø­ÙˆØ± Ø¨Ø±ÙƒØ©.");
      }
      if (pName === "Ø§Ù„Ù…ØºØ±Ø¨" && diff >= -10 && diff <= -5) {
        checkAndSendReminder('IFTAR_10', pName, islamicDateStr, chatId, "ðŸŒ™ Ø§Ù‚ØªØ±Ø¨ Ø§Ù„Ø¥ÙØ·Ø§Ø±! 10 Ø¯Ù‚Ø§Ø¦Ù‚ Ø¹Ù„Ù‰ Ø£Ø°Ø§Ù† Ø§Ù„Ù…ØºØ±Ø¨. Ø¬Ù‡Ø² ÙØ·Ø§Ø±Ùƒ ÙˆØ¯Ø¹ÙˆØ§ØªÙƒ Ù…Ø³ØªØ¬Ø§Ø¨Ø© Ø¥Ù† Ø´Ø§Ø¡ Ø§Ù„Ù„Ù‡.");
      }
    }

    if (diff >= -20 && diff <= -15) {
      var msg = "Ø§Ø³ØªØ¹Ø¯ Ù„Ù„Ù…ÙˆØ§Ø¬Ù‡Ø© ÙŠØ§ ÙˆØ­Ø´! " + pName + " ÙƒÙ…Ø§Ù† Ø´ÙˆÙŠØ©. ØªÙˆØ¶Ø£ ÙˆØ¬Ù‡Ø² Ù†ÙØ³Ùƒ ðŸ¦…";
      if (missed.length > 0) msg += "\n\n" + missedText;
      checkAndSendReminder('NORMAL_20', pName, islamicDateStr, chatId, msg);
    }

    if (diff >= 0 && diff <= 4) {
      var msgAthan = "Ø§Ù„Ù„Ù‡ Ø£ÙƒØ¨Ø±! ðŸ•Œ Ø£Ø°Ø§Ù† " + pName + " Ø´ØºØ§Ù„ Ø¯Ù„ÙˆÙ‚ØªÙŠ. Ø³ÙŠØ¨ Ø§Ù„Ù„ÙŠ ÙÙŠ Ø¥ÙŠØ¯Ùƒ ÙˆØ±Ø¯Ø¯ Ø§Ù„Ø£Ø°Ø§Ù† ÙˆÙ‚ÙˆÙ… ØµÙ„ÙŠ!";
      if (hMonth === 9 && pName === "Ø§Ù„Ù…ØºØ±Ø¨") msgAthan = "Ø§Ù„Ù„Ù‡ Ø£ÙƒØ¨Ø±! ðŸ•Œ Ø£Ø°Ø§Ù† Ø§Ù„Ù…ØºØ±Ø¨. Ø¥ÙØ·Ø§Ø±Ø§Ù‹ Ø´Ù‡ÙŠØ§Ù‹ ÙˆØµÙˆÙ…Ø§Ù‹ Ù…Ù‚Ø¨ÙˆÙ„Ø§Ù‹ ÙŠØ§ Ø¨Ø·Ù„! Ù…ØªÙ†Ø³Ø§Ø´ ØªØ³Ø¬Ù„ Ø§Ù„ØµÙ„Ø§Ø©.";
      checkAndSendReminder('ATHAN_0', pName, islamicDateStr, chatId, msgAthan);
    }

    var hasPrayedCurr = (props.getProperty('PRAYED_' + pName) === islamicDateStr);

    if (pName === "Ø§Ù„ÙØ¬Ø±" && !hasPrayedCurr) {
      var username = props.getProperty('USERNAME');
      if (username) {
        if (diff >= 0 && diff <= 4) {
          var callKey1 = 'FAJR_CALL_1_' + islamicDateStr;
          if (!props.getProperty(callKey1)) {
            try { UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("Ø§Ø³ØªÙŠÙ‚Ø¸ ÙŠØ§ Ø¨Ø·Ù„. Ø­Ø§Ù† ÙˆÙ‚Øª ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø±.")); } catch(e) {}
            props.setProperty(callKey1, "true");
          }
        } else if (diff >= 5 && diff <= 9) {
          var callKey2 = 'FAJR_CALL_2_' + islamicDateStr;
          if (!props.getProperty(callKey2)) {
            try { UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("Ø§Ù„Ø¥Ù†Ø°Ø§Ø± Ø§Ù„Ø«Ø§Ù†ÙŠ Ù„Ù„ÙØ¬Ø±. Ù„Ø§ ØªØ®Ø°Ù„ Ù†ÙØ³Ùƒ ÙŠØ§ ÙˆØ­Ø´.")); } catch(e) {}
            props.setProperty(callKey2, "true");
          }
        } else if (diff >= 10 && diff <= 14) {
          var callKey3 = 'FAJR_CALL_3_' + islamicDateStr;
          if (!props.getProperty(callKey3)) {
            try { UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("Ø§Ù„Ø¥Ù†Ø°Ø§Ø± Ø§Ù„Ø£Ø®ÙŠØ±. Ø§Ø³ØªÙŠÙ‚Ø¸ Ø§Ù„Ø¢Ù† ÙˆÙ„Ø§ ØªØ¶ÙŠØ¹ Ø§Ù„Ù†Ù‚Ø§Ø·.")); } catch(e) {}
            props.setProperty(callKey3, "true");
          }
        }
      }
    }

    if (diff >= 10 && diff <= 15) {
      if (!hasPrayedCurr && !isEmergency) {
        checkAndSendReminder('POST_10', pName, islamicDateStr, chatId, "ÙØ§Øª 10 Ø¯Ù‚Ø§ÙŠÙ‚ Ø¹Ù„Ù‰ Ø£Ø°Ø§Ù† " + pName + " ÙˆØ¥Ù†Øª Ù„Ø³Ù‡ Ù…Ø³Ø¬Ù„ØªØ´! Ø§Ù„Ù†Ù‚Ø· Ø¨ØªÙ‚Ù„ ÙˆÙƒÙ„ Ø¯Ù‚ÙŠÙ‚Ø© Ø¨ØªØ£Ø®ÙŠØ±Ù‡Ø§ Ø¨ØªØ®Ø³Ø±Ùƒ Ø£ÙƒØªØ±. Ù‚ÙˆÙ… ØµÙ„ÙŠ ÙÙˆØ±Ø§Ù‹ âš ï¸");
      }
    }

    var nextAbs;
    if (pName === "Ø§Ù„ÙØ¬Ø±") {
       nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["Ø§Ù„Ø´Ø±ÙˆÙ‚"]), fajrMins);
    } else if (i < prayers.length - 1) {
       var nextPName = prayers[i + 1];
       nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes[nextPName]), fajrMins);
    } else {
       nextAbs = fajrMins + 1440;
    }

    if (nextAbs) {
      var diffQadaa = currentAbs - nextAbs;
      if (diffQadaa >= 0 && diffQadaa <= 5) {
        if (!hasPrayedCurr && !isEmergency) {
          if (checkAndSendReminder('PUNISH_QADAA', pName, islamicDateStr, chatId, "ØªÙØªÙŠØ´ Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©: ÙˆÙ‚Øª " + pName + " Ø®Ù„Øµ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ ÙˆØ¥Ù†Øª Ù„Ø³Ù‡ Ù…ØªØ³Ø¬Ù„ØªØ´! Ø§Ù„ØµÙ„Ø§Ø© Ø¨Ù‚Øª Ù‚Ø¶Ø§Ø¡ ÙˆØªÙ… Ø®ØµÙ… 20 Ù†Ù‚Ø·Ø© Ù…Ù† Ø±ØµÙŠØ¯Ùƒ ÙƒØ¹Ù‚Ø§Ø¨ ðŸ’”")) {
            var updatedP = addPoints(-20, "Ø®ØµÙ… ØµÙ„Ø§Ø© Ù‚Ø¶Ø§Ø¡: " + pName);
            sendMessage(chatId, "Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ø¹Ø¯ Ø§Ù„Ø®ØµÙ…: " + updatedP + " Ù†Ù‚Ø·Ø© ðŸ’”");
          }
        }
      }
    }
  }

  var randomTimeKey = 'RANDOM_TIME_' + islamicDateStr;
  var randomTarget = props.getProperty(randomTimeKey);
  if (!randomTarget) {
    var randomMin = Math.floor(Math.random() * (1320 - 600 + 1)) + 600;
    props.setProperty(randomTimeKey, randomMin.toString());
    randomTarget = randomMin;
  } else {
    randomTarget = parseInt(randomTarget);
  }

  if (currentAbs >= randomTarget && !isEmergency) {
    var dailyKey = 'DAILY_CHECKIN_' + islamicDateStr;
    if (!props.getProperty(dailyKey)) {
      props.setProperty(dailyKey, "true");

      var days = getStreakDays();
      var multiplier = getStreakMultiplier();

      // ============ Ø­Ø³Ø§Ø¨ Ù…ÙƒÙˆÙ‘Ù† Ø§Ù„ØµÙ„ÙˆØ§Øª ============
      var prayerComponent = 0;
      var prayerReport = "";
      var allPrayers = ["Ø§Ù„ÙØ¬Ø±", "Ø§Ù„Ø¸Ù‡Ø±", "Ø§Ù„Ø¹ØµØ±", "Ø§Ù„Ù…ØºØ±Ø¨", "Ø§Ù„Ø¹Ø´Ø§Ø¡"];

      for (var pi = 0; pi < allPrayers.length; pi++) {
        var pn = allPrayers[pi];
        var pnAbs = getAbsoluteMins(parseTimeStr(prayerTimes[pn]), fajrMins);

        if (currentAbs >= pnAbs) {
          var hasPrayed = (props.getProperty('PRAYED_' + pn) === islamicDateStr);
          if (hasPrayed) {
            prayerComponent += 3;
          } else {
            prayerComponent -= 8;
            prayerReport += "âš ï¸ " + pn + " Ù„Ø³Ù‡ Ù…Ø³Ø¬Ù„ØªØ´! ";
          }
        }
      }

      var finalMsg = "";
      var pointsChange = 0;

      var recoveryPeriod = parseInt(props.getProperty('RECOVERY_PERIOD') || "7");

      // ============ ÙˆØ¶Ø¹ Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© ============
      if (days < recoveryPeriod) {
        var rawPenalty = Math.round(25 * (1 - days / recoveryPeriod));
        var prayerPenalty = Math.max(0, -prayerComponent);
        var totalPenalty = rawPenalty + prayerPenalty;

        var shields = parseInt(props.getProperty('SHIELDS') || "0");
        var shieldActive = props.getProperty('SHIELD_ACTIVE') === "true";

        if (shieldActive && days < 3) {
          pointsChange = 0;
          finalMsg = "ðŸ›¡ï¸ Ø§Ù„Ø¯Ø±Ø¹ Ø­Ù…ØªÙƒ Ø§Ù„ÙŠÙˆÙ…! Ø§Ù„Ø£ÙŠØ§Ù… Ø§Ù„Ø«Ù„Ø§Ø«Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰ Ù…Ø´ Ù‡ÙŠØªØ®ØµÙ… Ù…Ù†Ùƒ.";
          if (days === 2) {
            props.setProperty('SHIELD_ACTIVE', "false");
            finalMsg += "\nâš ï¸ Ø§Ù„Ø¯Ø±Ø¹ Ø®Ù„ØµØª. Ù…Ù† Ø¨ÙƒØ±Ø© Ø§Ù„Ø¹Ù‚ÙˆØ¨Ø© ØªØ¨Ø¯Ø£ Ø¨Ø´ÙƒÙ„ Ø·Ø¨ÙŠØ¹ÙŠ ÙˆÙ…Ø®ÙÙØ©.";
          }
        } else {
          pointsChange = -totalPenalty;
          finalMsg = "ØªÙØªÙŠØ´ Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ðŸš¨\n\n" +
            "ðŸ“ ÙŠÙˆÙ… Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©: " + days + " Ù…Ù† " + recoveryPeriod + "\n" +
            "ðŸ”» Ø®ØµÙ… ØµÙ…ÙˆØ¯: " + rawPenalty + " Ù†Ù‚Ø·Ø©\n";
          if (prayerPenalty > 0) {
            finalMsg += "ðŸ”» Ø®ØµÙ… ØµÙ„ÙˆØ§Øª: " + prayerPenalty + " Ù†Ù‚Ø·Ø©\n";
            finalMsg += prayerReport + "\n";
          }

          var remainingDays = recoveryPeriod - days;
          var nextPenalty = Math.round(25 * (1 - (days + 1) / recoveryPeriod));
          finalMsg += "\nðŸ’¡ Ø§Ù„Ø¹Ù‚ÙˆØ¨Ø© Ø¨ÙƒØ±Ø©: " + nextPenalty + " Ù†Ù‚Ø·Ø© (Ø¨Ø¯Ù„ " + rawPenalty + ")\n";
          finalMsg += "ðŸ Ø¨Ø¹Ø¯ " + remainingDays + " " + (remainingDays === 1 ? "ÙŠÙˆÙ…" : "Ø£ÙŠØ§Ù…") +
                      " ØªÙ†ØªÙ‡ÙŠ ÙØªØ±Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©!\n\n" +
                      "Ø®ØµÙ… Ø§Ù„ÙŠÙˆÙ…: " + totalPenalty + " Ù†Ù‚Ø·Ø© âš”ï¸";
        }
      }
      // ============ Ø§Ù†ØªÙ‡Ø§Ø¡ ÙØªØ±Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© ============
      else if (days === recoveryPeriod) {
        var bonus = 50;
        pointsChange = bonus;
        finalMsg = "ðŸ”¥ ÙØªØ±Ø© Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ù…ÙƒØªÙ…Ù„Ø©! ðŸ”¥\n\n" +
          "ÙŠØ§ ÙˆØ­Ø´! Ù‚Ø§ÙˆÙ…Øª Ù„Ù…Ø¯Ø© " + recoveryPeriod + " ÙŠÙˆÙ… ÙƒØ§Ù…Ù„Ø© Ø±ØºÙ… Ø§Ù„Ø®ØµÙˆÙ…Ø§Øª!\n" +
          "ÙØªØ±Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù†ØªÙ‡Øª. Ù…Ù† Ø¯Ù„ÙˆÙ‚ØªÙŠ Ø§Ù„ØªÙØªÙŠØ´ Ù‡ÙŠØ²ÙŠØ¯ Ø¹Ù„ÙŠÙƒ Ù…Ø´ ÙŠØ®ØµÙ…!\n\n" +
          "Ù…ÙƒØ§ÙØ£Ø© Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ù‚ØªØ§Ù„: +" + bonus + " Ù†Ù‚Ø·Ø© ðŸ†";
        addMedal("ðŸ”¥ ÙˆØ³Ø§Ù… Ø§Ù„Ø¹Ø§Ø¦Ø¯ Ø§Ù„Ø£Ù‚ÙˆÙ‰", chatId);
      }
      // ============ ÙˆØ¶Ø¹ Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ø¹Ø§Ø¯ÙŠ ============
      else {
        var baseBonus = Math.min(100, 20 + Math.floor(days / 7) * 5);
        var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");
        if (hMonth === 9) baseBonus *= 2;
        var bonusWithPrayers = baseBonus + prayerComponent;
        var finalBonus = Math.max(5, Math.round(bonusWithPrayers * multiplier));
        pointsChange = finalBonus;

        finalMsg = "ÙØ­Øµ Ù…ÙØ§Ø¬Ø¦ Ù…Ù† Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ðŸš¨\n\n" +
          "ðŸ“ Ø£ÙŠØ§Ù… Ø§Ù„ØµÙ…ÙˆØ¯: " + days + " ÙŠÙˆÙ…\n" +
          "ðŸ’° Ù…ÙƒØ§ÙØ£Ø© Ø§Ù„ØµÙ…ÙˆØ¯: +" + baseBonus + "\n";
        if (prayerComponent > 0) {
          finalMsg += "ðŸ™ Ù…ÙƒØ§ÙØ£Ø© Ø§Ù„ØµÙ„ÙˆØ§Øª: +" + prayerComponent + "\n";
        } else if (prayerComponent < 0) {
          finalMsg += "âš ï¸ Ø®ØµÙ… ØµÙ„ÙˆØ§Øª: " + prayerComponent + "\n";
          finalMsg += prayerReport + "\n";
        }
        if (multiplier > 1) {
          finalMsg += "ðŸ”¥ Ù…Ø¶Ø§Ø¹Ù Ø§Ù„ØµÙ…ÙˆØ¯: Ã—" + multiplier + "\n";
        }
        finalMsg += "\nØ§Ù„Ù…Ø¬Ù…ÙˆØ¹: +" + finalBonus + " Ù†Ù‚Ø·Ø©";
      }

      var newP = addPoints(pointsChange);
      sendMessage(chatId, finalMsg + "\n\nâš¡ Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: " + newP + " Ù†Ù‚Ø·Ø©");

      if (days >= 7)  addMedal("Ù†Ø¬Ù…Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ù†Ø­Ø§Ø³ÙŠØ© ðŸ¥‰", chatId);
      if (days >= 30) addMedal("Ø¯Ø±Ø¹ Ø§Ù„Ø´Ù‡Ø± Ø§Ù„ÙØ¶ÙŠ ðŸ¥ˆ", chatId);
      if (days >= 90) addMedal("ØªØ§Ø¬ Ø§Ù„ØµÙ…ÙˆØ¯ Ø§Ù„Ø°Ù‡Ø¨ÙŠ ðŸ¥‡", chatId);
      if (days >= 180) addMedal("ÙˆØ³Ø§Ù… Ø§Ù„Ù†Ù‚Ø§Ø¡ Ø§Ù„Ù…Ø·Ù„Ù‚ ðŸ’Ž", chatId);
      if (days >= 365) addMedal("ðŸŒ ÙˆØ³Ø§Ù… Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø£Ø³Ø·ÙˆØ±ÙŠØ©", chatId);

      var personalBest = parseInt(props.getProperty('PERSONAL_BEST_STREAK') || "0");
      if (days > personalBest) {
        props.setProperty('PERSONAL_BEST_STREAK', days.toString());
        if (days > 7) {
          sendMessage(chatId, "ðŸ† Ø±Ù‚Ù… Ø´Ø®ØµÙŠ Ø¬Ø¯ÙŠØ¯! ÙƒØ³Ø±Øª Ø£Ø¹Ù„Ù‰ Ø±Ù‚Ù… Ø¹Ù†Ø¯Ùƒ: " + days + " ÙŠÙˆÙ…!\nØ§Ù„Ø±Ù‚Ù… Ø§Ù„Ù‚Ø¯ÙŠÙ… ÙƒØ§Ù†: " + personalBest + " ÙŠÙˆÙ… ðŸŽ‰");
        }
      }

      // ÙŠÙˆÙ… Ø®Ø§Øµ Ø¬Ø¯Ø§Ù‹
      if (days === 365 && !props.getProperty('S_YEAR_MSG')) {
        props.setProperty('S_YEAR_MSG', "1");
        sendMessage(chatId,
          "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n" +
          "         ðŸŒ  Ù£Ù¦Ù¥ ÙŠÙˆÙ…\n" +
          "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n" +
          "Ù‚Ø¨Ù„ Ø³Ù†Ø© Ø¨Ø§Ù„Ø¸Ø¨Ø·...\n" +
          "ÙƒØ§Ù† ÙÙŠ Ø´Ø®Øµ Ù‚Ø±Ø±.\n\n" +
          "Ù…Ø´ ÙØ§Ù‡Ù… ÙƒÙ„ Ø­Ø§Ø¬Ø©.\n" +
          "Ù…Ø´ Ø¶Ø§Ù…Ù† Ø¥Ù†Ù‡ ÙŠÙƒÙ…Ù„.\n" +
          "Ø¨Ø³ Ù‚Ø±Ø±.\n\n" +
          "ÙˆØ§Ù„Ø´Ø®Øµ Ø¯Ù‡ Ø£Ù†Øª.\n\n" +
          "Ù…Ø§ Ù‚ÙˆÙ„Ù†Ø§ÙƒØ´ Ø¥Ù†Ù‡ Ù‡ÙŠØ¨Ù‚Ù‰ Ø³Ù‡Ù„.\n" +
          "ÙˆÙ…Ø§ ÙƒØ§Ù†Ø´ Ø³Ù‡Ù„.\n\n" +
          "Ø¨Ø³ Ø£Ù†Øª Ù„Ø³Ù‡ Ù‡Ù†Ø§. ðŸ¤\n\n" +
          "ã€Ž ÙˆÙŽÙ…ÙŽÙ† ÙŠÙŽØªÙŽÙ‘Ù‚Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ ÙŠÙŽØ¬Ù’Ø¹ÙŽÙ„ Ù„ÙŽÙ‘Ù‡Ù Ù…ÙŽØ®Ù’Ø±ÙŽØ¬Ù‹Ø§ ã€"
        );
      }

      checkHiddenAchievements(props, chatId, newP);

      // ============ Ø§Ù„ØªØ­Ø¯ÙŠ Ø§Ù„Ø¬ÙˆÙƒØ± (Weekly Joker) ============
      if (currentAbs >= 540 && currentAbs <= 1260) { // Ø¨ÙŠÙ† 9 ØµØ¨Ø§Ø­Ø§Ù‹ Ùˆ 9 Ù…Ø³Ø§Ø¡Ù‹
        if (props.getProperty('JOKER_ACTIVE') !== "true" && Math.random() < 0.05) {
          props.setProperty('JOKER_ACTIVE', "true");
          props.setProperty('JOKER_DATE', islamicDateStr);
          var challenges = [
            "Ù‚Ù„ Ø³Ø¨Ø­Ø§Ù† Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø­Ù…Ø¯Ù‡ 100 Ù…Ø±Ø©",
            "Ø§Ù‚Ø±Ø£ Ø¢Ø®Ø± Ø¢ÙŠØªÙŠÙ† Ù…Ù† Ø³ÙˆØ±Ø© Ø§Ù„Ø¨Ù‚Ø±Ø©",
            "ØµÙ„ÙÙ‘ Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ ï·º 50 Ù…Ø±Ø©",
            "Ø§Ø³ØªØºÙØ± Ø§Ù„Ù„Ù‡ 100 Ù…Ø±Ø©",
            "Ø§Ù‚Ø±Ø£ Ø¢ÙŠØ© Ø§Ù„ÙƒØ±Ø³ÙŠ 7 Ù…Ø±Ø§Øª",
            "Ù‚Ù„: Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ø§Ù„Ù„Ù‡ ÙˆØ­Ø¯Ù‡ Ù„Ø§ Ø´Ø±ÙŠÙƒ Ù„Ù‡ 100 Ù…Ø±Ø©",
            "Ø§Ù‚Ø±Ø£ Ø³ÙˆØ±Ø© Ø§Ù„Ø¥Ø®Ù„Ø§Øµ 10 Ù…Ø±Ø§Øª",
            "Ø§Ù‚Ø±Ø£ Ø§Ù„Ù…Ø¹ÙˆØ°ØªÙŠÙ† 7 Ù…Ø±Ø§Øª",
            "ØµÙ„ÙÙ‘ Ø±ÙƒØ¹ØªÙŠ Ø´ÙƒØ± Ù„Ù„Ù‡ Ø¯Ù„ÙˆÙ‚ØªÙŠ",
            "Ø§ÙƒØªØ¨ 5 Ø­Ø§Ø¬Ø§Øª Ø´Ø§ÙƒØ± Ù„Ù„Ù‡ Ø¹Ù„ÙŠÙ‡Ø§ ÙˆØ§Ø¨Ø¹ØªÙ‡Ù… Ù‡Ù†Ø§",
            "Ù‚Ù„: Ø­Ø³Ø¨ÙŠ Ø§Ù„Ù„Ù‡ Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ù‡Ùˆ Ø¹Ù„ÙŠÙ‡ ØªÙˆÙƒÙ„Øª 7 Ù…Ø±Ø§Øª",
            "Ø§Ù‚Ø±Ø£ Ø³ÙˆØ±Ø© ÙŠØ³ ÙƒØ§Ù…Ù„Ø©",
            "Ù‚Ù„: Ø§Ù„Ù„Ù‡Ù… Ø¥Ù†ÙŠ Ø£Ø¹ÙˆØ° Ø¨Ùƒ Ù…Ù† Ø§Ù„Ù‡Ù… ÙˆØ§Ù„Ø­Ø²Ù† 40 Ù…Ø±Ø©",
            "Ø§Ø¹Ù…Ù„ Ø³Ø¬Ø¯Ø© Ø´ÙƒØ± Ù„Ù„Ù‡ Ø¯Ù„ÙˆÙ‚ØªÙŠ Ø¹Ù„Ù‰ Ù†Ø¹Ù…Ø© Ø§Ù„ØµÙ…ÙˆØ¯",
            "ØªØµØ¯Ù‚ Ø¨Ø£ÙŠ Ù…Ø¨Ù„Øº ÙÙŠ Ø§Ù„Ø³Ø§Ø¹Ø© Ø§Ù„Ø¬Ø§ÙŠØ© Ø¹Ø´Ø§Ù† ØªØ«Ø¨Øª Ø§Ù„Ø¬ÙˆÙƒØ±",
            "Ø§Ù‚Ø±Ø£ Ø£ÙˆÙ„ Ø¹Ø´Ø± Ø¢ÙŠØ§Øª Ù…Ù† Ø³ÙˆØ±Ø© Ø§Ù„ÙƒÙ‡Ù Ø¨ØªØ¯Ø¨Ø±",
            "Ø§ÙƒØªØ¨ Ù„Ù†ÙØ³Ùƒ Ø³Ø¨Ø¨Ø§Ù‹ ÙˆØ§Ø­Ø¯Ø§Ù‹ ÙŠØ®Ù„ÙŠÙƒ Ø«Ø§Ø¨Øª Ø§Ù„Ù†Ù‡Ø§Ø±Ø¯Ù‡",
            "ØµÙ„ÙÙ‘ Ø±ÙƒØ¹ØªÙŠÙ† Ø³Ù†Ø© Ø£Ùˆ Ù†ÙÙ„ Ù‚Ø¨Ù„ Ù…Ø§ ØªÙƒÙ…Ù„ ÙŠÙˆÙ…Ùƒ",
            "Ø§Ø¨Ø¹Øª Ø±Ø³Ø§Ù„Ø© Ø·ÙŠØ¨Ø© Ù„Ø­Ø¯ Ù…Ù† Ø£Ù‡Ù„Ùƒ Ø¯Ù„ÙˆÙ‚ØªÙŠ"
          ];
          var randomChallenge = pickFreshContent(props, "JOKER", challenges);
          props.setProperty('JOKER_TASK', randomChallenge);

          var jokerKeys = [
            [{"text": "Ø£Ù†Ø¬Ø²Øª Ø§Ù„ØªØ­Ø¯ÙŠ âœ…"}],
            [{"text": "ØªØ¬Ø§Ù‡Ù„ âŒ"}]
          ];
          sendMenuCustom(chatId, "ðŸƒ **ØªØ­Ø¯ÙŠ Ø§Ù„Ø¬ÙˆÙƒØ± Ø¸Ù‡Ø± ÙØ¬Ø£Ø©!**\n\nØ§Ù„Ù…Ù‡Ù…Ø©: *" + randomChallenge + "*\n\nØ£Ù†Ø¬Ø² Ø§Ù„Ù…Ù‡Ù…Ø© Ø¯ÙŠ Ø¯Ù„ÙˆÙ‚ØªÙŠ ÙˆØ¨Ø¹Ø¯ÙŠÙ† Ø§Ø¶ØºØ· âœ… Ø¹Ø´Ø§Ù† ØªØ§Ø®Ø¯ 150 Ù†Ù‚Ø·Ø© ÙˆÙˆØ³Ø§Ù….", jokerKeys);
        }
      }
    }
  }

  } catch(e) {
    Logger.log("Lock failed: " + e);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------
// Property Cleanup (run weekly)
// ---------------------------
function cleanupOldProperties() {
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  var keys = Object.keys(allProps);
  var now = new Date();
  var cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
  var cutoffStr = Utilities.formatDate(cutoffDate, "GMT+3", "yyyy-MM-dd");
  var deleted = 0;

  var dailyPrefixes = [
    'PRAYED_', 'PRAYER_PTS_', 'SLEEP_EXEMPT_', 'DHIKR_COUNT_',
    'FASTING_DONE_', 'TARAWIH_DONE_', 'MISSION_DONE_', 'PENDING_MISSION_',
    'DAILY_CHECKIN_', 'RANDOM_TIME_', 'FIX_USED_', 'VICTORY_COUNT_',
    'S_THIRDNIGHT_', 'FAJR_CALL_1_', 'FAJR_CALL_2_', 'FAJR_CALL_3_',
    'EMERGENCY_30', 'EMERGENCY_15', 'EMERGENCY_5', 'ATHAN_0',
    'NORMAL_20', 'POST_10', 'PUNISH_QADAA', 'SUHOOR_REMINDER', 'IFTAR_10',
    'WEEKLY_SUMMARY_', 'MORNING_VERSE_', 'NUDGE_'
  ];

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    for (var j = 0; j < dailyPrefixes.length; j++) {
      if (key.indexOf(dailyPrefixes[j]) === 0) {
        // Extract date from key
        var dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch && dateMatch[1] < cutoffStr) {
          props.deleteProperty(key);
          deleted++;
        }
        break;
      }
    }
  }

  var cutoffMonth = Utilities.formatDate(cutoffDate, "GMT+3", "yyyy-MM");
  for (var k = 0; k < keys.length; k++) {
    var monthlyKey = keys[k];
    var monthMatch = monthlyKey.match(/^(MONTHLY_SUMMARY|MONTHLY_REPORT)_(\d{4}-\d{2})$/);
    if (monthMatch && monthMatch[2] < cutoffMonth) {
      props.deleteProperty(monthlyKey);
      deleted++;
    }
  }

  Logger.log("Cleanup: deleted " + deleted + " old properties. Remaining: " + (keys.length - deleted));
}

// ---------------------------
// Monthly Report
// ---------------------------
function sendMonthlyReport() {
  var props = PropertiesService.getScriptProperties();
  var chatId = props.getProperty('CHAT_ID');
  if (!chatId) return;

  var now = new Date();
  var currentDay = parseInt(Utilities.formatDate(now, "GMT+3", "d"));
  if (currentDay !== 1) return; // Only send on the 1st of each month

  var monthKey = 'MONTHLY_REPORT_' + Utilities.formatDate(now, "GMT+3", "yyyy-MM");
  if (props.getProperty(monthKey)) return; // Already sent
  props.setProperty(monthKey, "true");

  var p = getPoints();
  var rank = getRank(p);
  var days = getStreakDays();
  var prayerStreak = parseInt(props.getProperty('PRAYER_STREAK') || "0");
  var pb = parseInt(props.getProperty('PERSONAL_BEST_STREAK') || "0");
  var fajrCount = parseInt(props.getProperty('FAJR_ONTIME_COUNT') || "0");
  var totalVic = parseInt(props.getProperty('TOTAL_VICTORIES') || "0");
  var totalDhikr = parseInt(props.getProperty('TOTAL_DHIKR') || "0");
  var shields = parseInt(props.getProperty('SHIELDS') || "0");
  var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);
  var medalsArr = safeParse(props.getProperty('MY_MEDALS'), []);
  var fCount = parseInt(props.getProperty('FASTING_COUNT') || "0");

  var lastMonth = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  var monthName = Utilities.formatDate(lastMonth, "GMT+3", "MMMM yyyy");

  var report = "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n";
  report += "ðŸ“Š *Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ â€” " + monthName + "*\n";
  report += "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n";
  report += "ðŸŽ–ï¸ Ø§Ù„Ø±ØªØ¨Ø©: " + rank + "\n";
  report += "ðŸ’Ž Ø§Ù„Ù†Ù‚Ø§Ø·: " + p + "\n";
  report += "ðŸ”¥ Ø£ÙŠØ§Ù… Ø§Ù„ØµÙ…ÙˆØ¯: " + days + " ÙŠÙˆÙ…\n";
  report += "ðŸ‘‘ Ø£Ø¹Ù„Ù‰ ØµÙ…ÙˆØ¯ (PB): " + pb + " ÙŠÙˆÙ…\n";
  report += "ðŸ•Œ Ø³ØªØ±ÙŠÙƒ Ø§Ù„ØµÙ„ÙˆØ§Øª: " + prayerStreak + " ÙŠÙˆÙ…\n";
  report += "ðŸŒ… ÙØ¬Ø± ÙÙŠ ÙˆÙ‚ØªÙ‡: " + fajrCount + " Ù…Ø±Ø©\n";
  report += "ðŸ›¡ï¸ Ø§Ù„Ø¯Ø±ÙˆØ¹: " + shields + "/3\n";
  report += "ðŸ† Ø§Ù†ØªØµØ§Ø±Ø§Øª: " + totalVic + "\n";
  report += "ðŸ“¿ Ø¬Ù„Ø³Ø§Øª Ø°ÙƒØ±: " + totalDhikr + "\n";
  if (fCount > 0) report += "ðŸŒ™ ØµÙŠØ§Ù… Ù†Ø§ÙÙ„Ø©: " + fCount + " Ø£ÙŠØ§Ù…\n";
  report += "ðŸŽ–ï¸ Ø£ÙˆØ³Ù…Ø© Ù…ÙƒØªØ³Ø¨Ø©: " + medalsArr.length + "/" + Object.keys(MEDALS_DB).length + "\n";
  report += "ðŸ“‰ Ø§Ù„Ø³Ù‚Ø·Ø§Øª Ø§Ù„ÙƒÙ„ÙŠØ©: " + shameArr.length + "\n";
  report += "\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n";

  if (days >= 30) {
    report += "ðŸ¦… *Ø£Ù†Øª ØªØªØ­Ø±Ùƒ Ø¨Ø«Ø¨Ø§Øª. ÙƒÙ…Ù„.*";
  } else if (days >= 7) {
    report += "âš”ï¸ *Ø£Ø³Ø¨ÙˆØ¹+ Ù…Ù† Ø§Ù„ØµÙ…ÙˆØ¯. Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ÙØ®ÙˆØ±Ø©.*";
  } else {
    report += "ðŸ’ª *Ø´Ù‡Ø± Ø¬Ø¯ÙŠØ¯. Ø§Ø¨Ø¯Ø£ Ù‚ÙˆÙŠ.*";
  }

  sendMessage(chatId, report);
}

