var BOT_TOKEN = "8607942971:AAEjTfnBkik_1AslFvAolgEwb7EbLgmPOyA";
var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwc9UmHwvM6dwFtZpWD0ha8kTTo_8toWJMrp8qRCv8gYiHbxTaSOpj4sNPjtUTVIJqs/exec";
var SHEET_ID = "1ytkQiI_Tui-8Xx6HQH3RggcwCs1EM-TlGd_f3lT1g7c";

// ---------------------------
// رتب ونقاط
// ---------------------------
var RANKS = [
  {name: "ملازم ⭐", min: 0},
  {name: "ملازم أول ⭐⭐", min: 201},
  {name: "نقيب ⭐⭐⭐", min: 501},
  {name: "رائد 🦅", min: 1001},
  {name: "مقدم 🦅⭐", min: 2001},
  {name: "عقيد 🦅⭐⭐", min: 3501},
  {name: "عميد 🦅⭐⭐⭐", min: 5001},
  {name: "لواء 🦅⚔️", min: 7501},
  {name: "مشير 🦅⚔️🌿", min: 10000},
  {name: "قائد أعلى 👑", min: 15000},
  {name: "أسطورة حية 🌍👑", min: 25000},
  {name: "حارس الأمة 🕋👑⚔️", min: 50000},
  {name: "خالد 💎👑🌿", min: 100000}
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
      var bar = "█".repeat(pct) + "░".repeat(10-pct);
      return "`[" + bar + "]` " + needed + " نقطة للرتبة: " + RANKS[i+1].name;
    }
  }
  return "🌌 بلغت أعلى رتبة. أنت المشير الآن.";
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

  if (!reason) reason = (pts >= 0) ? "إضافة نقاط" : "خصم نقاط";
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
  var prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  var index = prayers.indexOf(prayer);
  if (index === -1) return null;
  if (prayer === "الفجر") return getAbsoluteMins(parseTimeStr(prayerTimes["الشروق"]), fajrMins);
  if (index < prayers.length - 1) return getAbsoluteMins(parseTimeStr(prayerTimes[prayers[index + 1]]), fajrMins);
  return fajrMins + 1440;
}

function getPrayerFlavor(props, prayer, countToday) {
  var flavors = {
    "الفجر": [
      " — أول من صافح النور النهارده 🌅",
      " — البداية الصح ليوم كله انتصارات ✨",
      " — الفجر شاهد عليك.. عاش يا بطل 🌄"
    ],
    "الظهر": [
      " — وسط المعركة ولسه ثابت ⚔️",
      " — وقفة بتشحن قلبك عشان تكمل 💪",
      " — شغلك ومشاغلك ممَنعوكش عن ربك 🕌"
    ],
    "العصر": [
      " — الصلاة الوسطى اللي ربنا وصانا بيها 💫",
      " — ثباتك في النص هو اللي بيكمل اليوم 🦅",
      " — خطوة كمان وتقفل اليوم بانتصار ⏳"
    ],
    "المغرب": [
      " — كسرت يوم تاني بانتصار 🌅",
      " — شمس اليوم غابت وإنت واقف مكانك ماتهزيتش 🔥",
      " — اليوم بيخلص وإنت كسبان 🏆"
    ],
    "العشاء": [
      " — ختمت يومك صح. نام وأنت منتصر 🌙",
      " — مسك الختام ليوم طويل 🌌",
      " — يومك اتقفل على طاعة.. استعد للي بعده 🛡️"
    ]
  };
  
  var arr = flavors[prayer] || [""];
  var msg = arr[Math.floor(Math.random() * arr.length)];
  
  if (prayer === "العشاء" && countToday === 5) {
    msg += "\n\nيوم نقي بلا هزائم.. نام مرتاح يا بطل 🌿";
  }
  
  var currentDayOfWeek = Utilities.formatDate(new Date(), "GMT+3", "u");
  if (prayer === "الفجر" && currentDayOfWeek === "5") {
    msg = " — فجر الجمعة المشهود! بداية أعظم أيام الأسبوع، متنساش الكهف والصلاة على النبي 🕌✨";
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
    var bar = "■".repeat(Math.floor(days / 4)) + "□".repeat(10 - Math.floor(days / 4));
    return "🏁 تحدي ٤٠ يوم: " + days + "/40\n`[" + bar + "]`";
  }
  if (status === "COMPLETED") return "🏁 تحدي ٤٠ يوم: مكتمل 🏆";
  return "🏁 تحدي ٤٠ يوم: غير نشط";
}

function updateFortyChallenge(props, chatId) {
  if (props.getProperty('FORTY_STATUS') !== "ACTIVE") return;
  if (getFortyChallengeDays(props) < 40) return;

  props.setProperty('FORTY_STATUS', "COMPLETED");
  var newPoints = addPoints(600, "إكمال تحدي ٤٠ يوم");
  addMedal("وسام الأربعين الصامد 🏁", chatId);
  sendMessage(chatId,
    "━━━━━━━━━━━━━━━━\n🏁 *اكتمل تحدي الأربعين*\n━━━━━━━━━━━━━━━━\n\n" +
    "٤٠ يوماً من الثبات، يوم وراء يوم.\n" +
    "مش مجرد عدّاد؛ دي عادة بتتكتب في شخصيتك.\n\n" +
    "🎁 مكافأة الإتمام: +600 نقطة\n💎 رصيدك الآن: " + newPoints);
}

function runPulse(props, chatId, prayer) {
  var dateKey = getIslamicDateStr();
  var key = 'NUDGE_' + dateKey;
  if (props.getProperty(key)) return;

  var hour = parseInt(Utilities.formatDate(new Date(), "GMT+3", "HH"));
  var day = Utilities.formatDate(new Date(), "GMT+3", "u");
  var dateNumber = parseInt(Utilities.formatDate(new Date(), "GMT+3", "dd"));
  var text = "";
  if (prayer === "الفجر" && day === "5" && hour < 6) {
    text = "🌿 *صباح الجمعة مختلف.*\n\nأنت بدأت اليوم في مكان أغلب الناس لسه نايمة فيه. خليه يوم هادي وثقيل في الميزان.";
  } else if (prayer === "العشاء" && dateNumber % 17 === 0) {
    text = "🌙 *تم رصد نهاية يوم نظيفة.*\n\nمش لازم حد يشوف الخطوة دي عشان تكون عظيمة. أنت شفتها، وربنا يعلمها.";
  }
  if (text) {
    props.setProperty(key, "1");
    sendMessage(chatId, text);
  }
}

var MEDALS_DB = {
  "شارة المحارب الأولى 🎖️": { id: "medal1", name: "شارة المحارب الأولى 🎖️", desc: "تُمنح لأول يوم من الصمود المستمر.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_1.jpg" },
  "وسام الإرادة الصلبة 🛡️": { id: "medal2", name: "وسام الإرادة الصلبة 🛡️", desc: "تُمنح لصمود 3 أيام متتالية بقوة.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_2.jpg" },
  "نجمة الأسبوع النحاسية 🥉": { id: "medal3", name: "نجمة الأسبوع النحاسية 🥉", desc: "تُمنح لصمود 7 أيام (أسبوع كامل).", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_3.jpg" },
  "درع الشهر الفضي 🥈": { id: "medal4", name: "درع الشهر الفضي 🥈", desc: "تُمنح لصمود 30 يوماً متتالية.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_4.jpg" },
  "تاج الصمود الذهبي 🥇": { id: "medal5", name: "تاج الصمود الذهبي 🥇", desc: "تُمنح لصمود 90 يوماً (ربع سنة).", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_5.jpg" },
  "وسام النقاء المطلق 💎": { id: "medal6", name: "وسام النقاء المطلق 💎", desc: "تُمنح لصمود 180 يوماً (نصف سنة).", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_6.jpg" },
  "🔥 وسام العائد الأقوى": { id: "medal7", name: "🔥 وسام العائد الأقوى", desc: "تُمنح بعد التعافي من انتكاسة بضعف مدة الصمود السابقة.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_7.jpg" },
  "وسام الالتزام الحديدي 🕌": { id: "medal8", name: "وسام الالتزام الحديدي 🕌", desc: "تُمنح لصلاة 3 أيام متتالية في وقتها.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_8.jpg" },
  "نجمة الفجر 🌟": { id: "medal9", name: "نجمة الفجر 🌟", desc: "تُمنح لصلاة 7 أيام متتالية في وقتها.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_9.jpg" },
  "درع المصلين الأسطوري 🕋": { id: "medal10", name: "درع المصلين الأسطوري 🕋", desc: "تُمنح لصلاة 30 يوماً متتالية في وقتها.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_10.jpg" },
  "🖐️ الضربة الخماسية": { id: "medal11", name: "🖐️ الضربة الخماسية", desc: "تُمنح لأداء الصلوات الخمس في وقتها بامتياز.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_11.jpg" },
  "💰 مليونير الحسنات": { id: "medal12", name: "💰 مليونير الحسنات", desc: "تُمنح لجمع كمية ضخمة من النقاط والحسنات.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_12.jpg" },
  "🎖️ وسام العملية الأسبوعية": { id: "medal13", name: "🎖️ وسام العملية الأسبوعية", desc: "تُمنح لإتمام المهام والعمليات الأسبوعية بنجاح.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_13.jpg" },
  "شارة المقاوم الصامت ⚔️": { id: "medal14", name: "شارة المقاوم الصامت ⚔️", desc: "تُمنح لتسجيل 10 انتصارات على النفس.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_14.jpg" },
  "قلادة المنتصر الأكبر 🏆": { id: "medal15", name: "قلادة المنتصر الأكبر 🏆", desc: "تُمنح لتسجيل 50 انتصاراً عظيماً.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_15.jpg" },
  "🥉 حارس الفجر البرونزي": { id: "medal16", name: "🥉 حارس الفجر البرونزي", desc: "تُمنح لصلاة الفجر في وقتها 3 مرات.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_16.jpg" },
  "🥈 حارس الفجر الفضي": { id: "medal17", name: "🥈 حارس الفجر الفضي", desc: "تُمنح لصلاة الفجر في وقتها 10 مرات.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_17.jpg" },
  "🥇 حارس الفجر الذهبي": { id: "medal18", name: "🥇 حارس الفجر الذهبي", desc: "تُمنح لصلاة الفجر في وقتها 30 مرة.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_18.jpg" },
  "🌌 أسطورة الفجر": { id: "medal19", name: "🌌 أسطورة الفجر", desc: "تُمنح لصلاة الفجر في وقتها 90 مرة.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_19.jpg" },
  "🃏 وسام الجوكر النادر": { id: "medal20", name: "🃏 وسام الجوكر النادر", desc: "تُمنح عند اقتناص الجوكر وإتمام تحدياته النادرة.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_20.jpg" },
  "🌍 وسام السنة الأسطورية": { id: "medal21", name: "🌍 وسام السنة الأسطورية", desc: "تُمنح لصمود عام كامل (365 يوماً)! أسطورة حية." },
  "🛡️ الدرع الفولاذي": { id: "medal22", name: "🛡️ الدرع الفولاذي", desc: "تُمنح كدرع حماية فولاذي.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_22.jpg" },
  "⚔️ سيف الحق": { id: "medal23", name: "⚔️ سيف الحق", desc: "تُمنح كرمز لقوة الإيمان.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_23.jpg" },
  "وسام الأربعين الصامد 🏁": { id: "medal24", name: "وسام الأربعين الصامد 🏁", desc: "تُمنح لإكمال تحدي أربعين يوماً من الثبات.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_24.jpg" },
  "الصامد الليلي": { id: "medal25", name: "الصامد الليلي", desc: "تُمنح لصمود 100 يوم. محفور في سجلات Camp Zero إلى الأبد.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_25.jpg" },
  "ابن الفجر": { id: "medal26", name: "ابن الفجر", desc: "تُمنح لأداء الفجر في وقته 21 يوم متتالية. من كان له صلاة الفجر فله النهار كله.", img: "https://raw.githubusercontent.com/Mohammad-Sherif/CampZero-Bot/main/assets/medals/medal_26.jpg" },
  "التائب الصادق": { id: "medal27", name: "التائب الصادق", desc: "تُمنح لصمود 30 يوم بعد الانتكاسة مباشرة. التائب الصادق." },
  "وسام الصمت الحديدي": { id: "medal28", name: "وسام الصمت الحديدي", desc: "تُمنح لـ 7 أيام متتالية دون أي عقوبة أو خصم." },
  "👻 وسام الشبح": { id: "medal29", name: "👻 وسام الشبح", desc: "أنت الآن غير مرئي للسيستم.. 14 يوم من الانضباط الكامل." }
};

function getMedals() {
  var medalsStr = PropertiesService.getScriptProperties().getProperty('MY_MEDALS');
  var medalsArr = safeParse(medalsStr, []);
  if (medalsArr.length === 0) return "لا يوجد أوسمة حتى الآن.";

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
    sendMessage(chatId, "🎖️ تم التكريم بوسام جديد: *" + medalName + "*\nالقيادة فخورة بأدائك الاستثنائي.\n\nتفقده الآن من ملفك العسكري لمعرفة تفاصيله!");
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

  Logger.log("✅ تم إعداد البوت بنجاح: تم ربط الـ Webhook وإنشاء الـ Triggers.");
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
          sendMessage(update.message.chat.id, "حصل عطل مؤقت في المعسكر. جرّب الأمر مرة ثانية بعد لحظات. 🛡️");
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
  var fajrStr = prayerTimes["الفجر"];
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
  var prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  var missed = [];

  for (var i = 0; i < prayers.length; i++) {
    var pName = prayers[i];
    var nextAbs;

    if (pName === "الفجر") {
       nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["الشروق"]), fajrMins);
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
  if (d.includes('الفجر_OK')) count++;
  if (d.includes('الظهر_OK')) count++;
  if (d.includes('العصر_OK')) count++;
  if (d.includes('المغرب_OK')) count++;
  if (d.includes('العشاء_OK')) count++;
  return count;
}

function getPrayerPoints(actualPrayer, currentAbs, prayerTimes, isExcused, missedArr, fajrMins) {
  if (isExcused) return 15;

  if (isPrayerPastWindow(actualPrayer, currentAbs, prayerTimes, fajrMins)) return 2;

  var prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  var index = prayers.indexOf(actualPrayer);
  var nextAbs;

  if (actualPrayer === "الفجر") {
    nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["الشروق"]), fajrMins);
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
  var prayersList = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
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

      if (streak === 3) addMedal("وسام الالتزام الحديدي 🕌", chatId);
      if (streak === 7) addMedal("نجمة الفجر 🌟", chatId);
      if (streak === 30) addMedal("درع المصلين الأسطوري 🕋", chatId);

      var msg = "🌟 **يوم ذهبي مكتمل!** لقد أكملت جميع الصلوات الخمس لليوم. ستريك الصلوات الحالي: *" + streak + "* يوم متتالي 🦅";

      // نظام الدروع (Shields) - درع لكل 7 أيام صلوات متتالية (يوم ذهبي)
      if (streak % 7 === 0) {
        var shields = parseInt(props.getProperty('SHIELDS') || "0");
        if (shields < 3) {
          shields++;
          props.setProperty('SHIELDS', shields.toString());
          msg += "\n\n🛡️ **حصلت على درع حماية!** لالتزامك 7 أيام متتالية بالصلوات الخمس. الدروع الحالية: " + shields + "/3.";
        } else {
          msg += "\n\n🛡️ حافظت على التزامك، وحقيبة دروعك ممتلئة للحد الأقصى (3/3). أنت جاهز لأي طوارئ!";
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

  // --- الضربة الخماسية ---
  if (streak === 5) addMedal("🖐️ الضربة الخماسية", chatId);

  // --- مليونير الحسنات ---
  if (p >= 5000 && !props.getProperty('S_MILLIONAIRE')) {
    addMedal("💰 مليونير الحسنات", chatId);
    props.setProperty('S_MILLIONAIRE', "1");
  }

  // --- الصامد الليلي: صمود 100 يوم ---
  if (days >= 100 && !props.getProperty('S_100DAYS')) {
    props.setProperty('S_100DAYS', "1");
    addMedal("الصامد الليلي", chatId);
    sendMessage(chatId,
      "🌑 *حدث غير متوقع...*\n\n" +
      "السيستم رصد شيئاً لم يره من قبل.\n" +
      "100 يوم من الصمود المتواصل.\n\n" +
      "⚡ *[تم فتح ملف سري من القيادة]*\n" +
      "『 لا يُعطى هذا الوسام إلا لمن تجاوز حاجز المئة. 』\n\n" +
      "🎖️ وسام *الصامد الليلي* — محفور في سجلات Camp Zero إلى الأبد."
    );
  }

  // --- ابن الفجر: 21 يوم فجر في وقته متتالية ---
  var fajrCount = parseInt(props.getProperty('FAJR_ONTIME_COUNT') || "0");
  if (fajrCount >= 21 && !props.getProperty('S_FAJR21')) {
    props.setProperty('S_FAJR21', "1");
    addMedal("ابن الفجر", chatId);
    sendMessage(chatId,
      "🌅 *رسالة من القيادة العليا...*\n\n" +
      "منذ 21 يوماً وأنت أول من يصافح النور.\n" +
      "العلم يقول إن الـ 21 يوم يُشكّل عادة لا تُكسر.\n\n" +
      "أنت الآن *ابن الفجر*.\n" +
      "من كان له صلاة الفجر فله النهار كله. 🦅"
    );
  }

  // --- التائب الصادق: أول صمود بعد انتكاسة يتجاوز 30 يوم ---
  var shameCount = safeParse(props.getProperty('WALL_OF_SHAME'), []).length;
  if (shameCount > 0 && days >= 30 && !props.getProperty('S_TRUE_REPENT')) {
    props.setProperty('S_TRUE_REPENT', "1");
    addMedal("التائب الصادق", chatId);
    sendMessage(chatId,
      "🕊️ *إشعار نادر...*\n\n" +
      "بعد كل انكسار... 30 يوم صمود.\n" +
      "هذا أصعب بكثير من لم يسقط أصلاً.\n\n" +
      "『 المؤمن الذي يُذنب ويتوب خير ممن لا يُذنب ويعجب 』\n\n" +
      "أنت *التائب الصادق*. وسامك مكتوب في مكان أعلى من هذا البوت. 🌿"
    );
  }

  // --- وسام الصمت: استخدام البوت 7 أيام متتالية بدون أي خصم يدوي ---
  var lastPenalty = props.getProperty('LAST_MANUAL_DEDUCT_DATE');
  var sevenDaysAgo = Utilities.formatDate(new Date(new Date().getTime() - 7*24*60*60*1000), "GMT+3", "yyyy-MM-dd");
  if (days >= 7 && (!lastPenalty || lastPenalty < sevenDaysAgo) && !props.getProperty('S_SILENCE')) {
    props.setProperty('S_SILENCE', "1");
    addMedal("وسام الصمت الحديدي", chatId);
    sendMessage(chatId,
      "🔇 *كشف سري...*\n\n" +
      "7 أيام كاملة بدون أي عقوبة أو خصم.\n" +
      "لا إنذارات. لا سقوط. لا تراجع.\n\n" +
      "هذه هي القوة الحقيقية — ليست الانتصار المزعوم،\n" +
      "بل الصمت الثابت اللي ما حدش يراه.\n\n" +
      "🏅 *وسام الصمت الحديدي* — للذين يعيشون الانضباط بدون تصفيق. ⚔️"
    );
  }

  // --- وسام الشبح: 14 يوم بدون أي خصم من نقاط الالتزام ---
  if (days >= 14 && !props.getProperty('S_GHOST')) {
    props.setProperty('S_GHOST', "1");
    addMedal("👻 وسام الشبح", chatId);
    sendMessage(chatId, "أنت الآن غير مرئي للسيستم.. 14 يوم من الانضباط الكامل والكمال. أنت *شبح* المعسكر. 🎖️");
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

  var msg = "📅 **حصاد الأسبوع:**\n\n";
  msg += "📈 نقاطك الحالية: " + currentP + "\n";
  msg += "✅ صلوات في وقتها: " + onTime + "\n";
  msg += "❌ صلوات قضاء: " + qadaa + "\n";
  msg += "📉 معدل الالتزام: " + percentage + "%\n\n";

  if (percentage >= 90) {
    msg += "أداء ممتاز! استمر يا بطل 🔥";
  } else if (percentage >= 50) {
    msg += "أداء متوسط.. تقدر تعمل أحسن من كده الأسبوع الجاي 💪";
  } else {
    msg += "تراجع ملحوظ.. القيادة مستنية منك التزام أقوى الأسبوع ده ⚔️";
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
    sendMessage(chatId, "🔒 **تم التأمين:** تم تعيينك كقائد المعسكر الأوحد (Single-user). لن يستجيب البوت لأي شخص آخر غيرك.");
  } else if (adminChatId !== chatId.toString()) {
    sendMessage(chatId, "⚠️ هذا المعسكر عسكري وخاص. ليس لديك تصريح بالدخول.");
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
    sendMessage(chatId, "☀️ صباح النصر! تم رصد نشاط منك وإلغاء وضع السبات.\nمعاك 15 دقيقة تسجل فيهم صلواتك اللي فاتتك وهتتحسب قضاء بعذر (مش هتكسر الستريك) ⚔️");
  }

  if (text === "/sleep" || text === "ط" || text === "z") {
    props.setProperty('EMERGENCY_MODE', "true");
    props.setProperty('IS_SLEEP_MODE', "true");
    props.setProperty('SLEEP_GRACE_UNTIL', "0");
    sendMessage(chatId, "علم وينفذ. تم تفعيل وضع السبات (طوارئ النوم) بضغطة واحدة. العداد وقف اللحظة دي. تصبح على خير يا وحش! 🫡\n(السبات مفعل 💤)");
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(parseInt(props.getProperty('POINTS') || "0")));
    return;
  }

  if (!text) {
    sendMenu(chatId, "القيادة بتستقبل النصوص والأوامر فقط 🎖️", getKeyboard(getPoints()));
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
      greeting = "جمعة مباركة يا وحش! 🌿 النهارده الحسنات مضاعفة. استغلها.";
    } else if (hour >= 3 && hour < 6) {
      greeting = "صاحي في جوف الليل... الله يراك دلوقتي. 🌙";
    } else if (hour >= 6 && hour < 12) {
      greeting = "صباح النصر! ⚘️ يالا نبدأ اليوم بقوة.";
    } else if (hour >= 12 && hour < 17) {
      greeting = "نص المعركة. كمل بثبات. ⚔️";
    } else if (hour >= 17 && hour < 21) {
      greeting = "قربت تختم يوم تاني بانتصار. 🦅";
    } else {
      greeting = "الليل وقت الخطر. خليك صاحي. 🛡️";
    }
    sendMenu(chatId, greeting, getKeyboard(p));
    return;
  }

  if (text === "/help") {
    var helpText = "⚔️ *أوامر Camp Zero السرية:*\n\n" +
      "/start — تفعيل البوت وعرض القائمة\n" +
      "/fix — مسح cache الصلوات في حالة أي بق\n" +
      "/apology — تعويض تقني (مرة واحدة فقط)\n" +
      "/call @username — بعت اتصال صوتي عبر CallMeBot\n" +
      "/mystats — إحصائيات تفصيلية\n" +
      "/history — آخر حركات النقاط\n" +
      "/backup — حفظ نسخة احتياطية من بياناتك على Google Sheet\n" +
      "/restore — استعادة آخر نسخة احتياطية\n" +
      "/help — هذه القائمة\n\n" +
      "💡 ملاحظة: بعض الأزرار بتظهر بس لو وصلت حد نقاط معين.";
    sendMessage(chatId, helpText);
    return;
  }

  if (text === "تم إنجاز العملية الأسبوعية ✅") {
    var opStatus = props.getProperty('WEEKLY_OP_STATUS');
    if (opStatus === "DONE") {
      sendMessage(chatId, "إنجزت عملية الأسبوع من قبل يا بطل! استعد للأسبوع القادم 🦅");
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(p));
    } else if (opStatus === "PENDING") {
      props.setProperty('WEEKLY_OP_STATUS', "DONE");
      var newP = addPoints(200);
      addMedal("🎖️ وسام العملية الأسبوعية", chatId);
      sendMessage(chatId, "عاش يا أسطورة! 200 نقطة ووسام العملية الأسبوعية ✅\nرصيدك: " + newP);
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(newP));
    } else {
      sendMenu(chatId, "مفيش عملية نشطة دلوقتي.", getKeyboard(p));
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

    var stats = "📊 **التقرير الإحصائي (My Stats):**\n\n";
    stats += "✅ صلوات في وقتها (هذا الأسبوع): " + onTime + "\n";
    stats += "❌ صلوات قضاء (هذا الأسبوع): " + qadaa + "\n";
    stats += "📈 نسبة الالتزام الأسبوعي: " + percentage + "%\n\n";
    
    var lastWeekStats = props.getProperty('LAST_WEEK_STATS');
    if (lastWeekStats) {
       try {
           var lw = JSON.parse(lastWeekStats);
           stats += "👻 **شبح الأسبوع الماضي:**\n";
           stats += "نسبة الالتزام كانت: " + (lw.percentage || 0) + "% | الخزي: " + (lw.shameCount || 0) + "\n\n";
       } catch(e) {}
    }
    
    stats += "🏆 إجمالي الانتصارات المسجلة: " + vCount + "\n";
    stats += "📉 إجمالي السقطات في سجل الخزي: " + fCount + "\n";
    stats += "🔥 أطول ستريك صلوات متتالية: " + maxStreak + " يوم\n";
    stats += "👑 أعلى صمود (PB): " + pb + " يوم\n";
    stats += "🛡️ الدروع المتاحة: " + shields + "/3\n";
    stats += "🌅 مرات الفجر في وقته: " + fajrCount + " مرة\n";
    stats += getFortyChallengeText(props) + "\n";
    stats += "💎 إجمالي النقاط الحالي: " + p + " نقطة\n";

    sendMenu(chatId, stats, getKeyboard(p));
    return;
  }

  if (text === "/fix") {
    var fixKey = 'FIX_USED_' + islamicDateStr;
    if (props.getProperty(fixKey) === "true") {
      sendMessage(chatId, "❌ القيادة ترفض الطلب: لا يمكنك استخدام هذا الأمر سوى مرة واحدة يومياً لمنع التلاعب.");
      return;
    }

    var prayersToClear = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
    for (var i = 0; i < prayersToClear.length; i++) {
      props.deleteProperty('PRAYED_' + prayersToClear[i]);
    }

    props.setProperty(fixKey, "true");
    logToSheet("FIX_USED", islamicDateStr);

    sendMessage(chatId, "تم مسح السجل المعلق للصلوات بنجاح 🧹. الكيبورد هيرجع يظهرلك كل الصلوات اللي وقتها دخل. (تم تسجيل الاستخدام في السجلات 🚨)");
    return;
  }

  if (text === "/history") {
    var historyArr = safeParse(props.getProperty('POINTS_HISTORY'), []);
    if (historyArr.length === 0) {
      sendMessage(chatId, "لا يوجد سجل للنقاط حتى الآن.");
      return;
    }
    var hText = "📜 **سجل النقاط الأخير:**\n\n";
    for (var i = 0; i < historyArr.length; i++) {
      var h = historyArr[i];
      var sign = h.change > 0 ? "+" : "";
      var emoji = h.change > 0 ? "🟢" : "🔴";
      hText += emoji + " [" + h.timestamp + "] " + h.reason + ": " + sign + h.change + " (الإجمالي: " + h.total + ")\n";
    }
    sendMessage(chatId, hText);
    return;
  }

  if (text === "/apology") {
    var hasApology = props.getProperty('APOLOGY_CLAIMED');
    if (hasApology) {
      sendMessage(chatId, "ألاعيب المعسكر دي متعملهاش عليا يا وحش! التعويض بيتصرف مرة واحدة بس 🦅");
      return;
    }
    props.setProperty('APOLOGY_CLAIMED', 'true');
    var newP = addPoints(20);
    sendMessage(chatId, "تعويض من القيادة عن الخطأ التقني 🎖️: تم إرجاع الـ 20 نقطة. رصيدك الحالي: " + newP);
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(newP));
    return;
  }

  if (text === "/backup") {
    try {
      var backupInfo = backupProperties(props);
      sendMessage(chatId, "✅ *تم حفظ نسخة احتياطية بنجاح!*\n\nتم تصدير " + backupInfo.count + " سجل إلى ورقة Backup في Google Sheets.\nتاريخ النسخ: " + backupInfo.date);
    } catch (e) {
      sendMessage(chatId, "❌ حصل خطأ في النسخ الاحتياطي: " + e.message);
    }
    return;
  }

  if (text === "/restore") {
    try {
      var restored = restoreProperties(props);
      sendMessage(chatId, "✅ *تم استعادة البيانات بنجاح!*\n\nتم استيراد " + restored + " سجل من ورقة Backup.\nالبيانات رجعت زي ما كانت وقت النسخ الاحتياطي. 🛡️");
    } catch (e) {
      sendMessage(chatId, "❌ حصل خطأ في الاستعادة: " + e.message);
    }
    return;
  }

  if (text.indexOf("/call") === 0) {
    var parts = text.split(" ");
    if (parts.length < 2) {
      sendMessage(chatId, "اكتب الأمر كدة: \n`/call @YourUsername`");
      return;
    }
    var username = parts[1];
    if (!username.startsWith("@")) username = "@" + username;

    var callText = encodeURIComponent("Wake up hero, this is Camp Zero calling.");
    var callUrl = "https://api.callmebot.com/start.php?user=" + username + "&text=" + callText;

    try {
      var response = UrlFetchApp.fetch(callUrl);
      var responseText = response.getContentText();
      sendMessage(chatId, "تم إرسال أمر الاتصال بنجاح لـ " + username + "! 📞\nرد السيرفر: " + responseText.substring(0, 50));
    } catch(e) {
      sendMessage(chatId, "حصلت مشكلة في الاتصال: " + e.toString());
    }
    return;
  }

  if (props.getProperty('AWAITING_VICTORY') === "true" && text !== "إلغاء ❌") {
    var vaultArr = safeParse(props.getProperty('VICTORY_VAULT'), []);
    var dateStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd");
    vaultArr.push("[" + dateStr + "] " + text);
    if (vaultArr.length > 50) vaultArr.shift();
    props.setProperty('VICTORY_VAULT', JSON.stringify(vaultArr));
    props.setProperty('AWAITING_VICTORY', "false");

    var totalVic = parseInt(props.getProperty('TOTAL_VICTORIES') || "0") + 1;
    props.setProperty('TOTAL_VICTORIES', totalVic.toString());

    if (totalVic === 10) addMedal("شارة المقاوم الصامت ⚔️", chatId);
    if (totalVic === 50) addMedal("قلادة المنتصر الأكبر 🏆", chatId);

    var countKey = 'VICTORY_COUNT_' + islamicDateStr;
    var vCount = parseInt(props.getProperty(countKey) || "0");
    var earnedV = 0;
    if (vCount < 3) {
       earnedV = 10;
       props.setProperty(countKey, (vCount + 1).toString());
    }

    var newP = addPoints(earnedV);
    if (earnedV > 0) {
      sendMessage(chatId, "عاش يا بطل! تم تسجيل الانتصار في الخزينة وخدت 10 نقط مكافأة.");
    } else {
      sendMessage(chatId, "تم تسجيل انتصارك المعنوي في الخزينة! (الحد الأقصى لنقاط الانتصارات اليومية 30 نقطة وقد تجاوزتها 🛡️).");
    }
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(newP));
    return;
  }

  var prayersList = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

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
        sendMessage(chatId, "لسه وقت صلاة " + actualPrayer + " ما دخلش. سجلها أول ما يؤذن عشان الحساب يفضل دقيق 🕰️");
        sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(p));
        return;
      }

      logToSheet("صلاة", actualPrayer);
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

      if (actualPrayer === "الفجر" && earnedPoints === 15 && !isEmergency) {
        var fCount = parseInt(props.getProperty('FAJR_ONTIME_COUNT') || "0");
        fCount++;
        props.setProperty('FAJR_ONTIME_COUNT', fCount.toString());
        if (fCount === 3) addMedal("🥉 حارس الفجر البرونزي", chatId);
        if (fCount === 10) addMedal("🥈 حارس الفجر الفضي", chatId);
        if (fCount === 30) addMedal("🥇 حارس الفجر الذهبي", chatId);
        if (fCount === 90) addMedal("🌌 أسطورة الفجر", chatId);

        // رسالة الثلث الأخير من الليل
        var rawHour = parseInt(Utilities.formatDate(new Date(), "GMT+3", "HH"));
        var rawMin  = parseInt(Utilities.formatDate(new Date(), "GMT+3", "mm"));
        var totalNowMins = rawHour * 60 + rawMin;
        if ((totalNowMins >= 180 && totalNowMins <= 225) && !props.getProperty('S_THIRDNIGHT_' + islamicDateStr)) {
          props.setProperty('S_THIRDNIGHT_' + islamicDateStr, "1");
          sendMessage(chatId,
            "🌑 *الثلث الأخير من الليل...*\n\n" +
            "في هذه اللحظة بالذات، الله ينزل إلى السماء الدنيا.\n" +
            "يقول: من يدعوني فأستجيب له؟\n\n" +
            "وأنت كنت مستيقظاً. 🤍\n\n" +
            "لا يعلم هذا إلا الله وأنت."
          );
        }
      }

      var extraMsg = "";
      if (isExempt) {
         props.setProperty('SLEEP_EXEMPT_' + actualPrayer + '_' + islamicDateStr, "true");
         if (earnedPoints <= 5) extraMsg = " (قضاء بعذر السبات 💤 - لن يكسر الستريك)";
      }

      if (extraMsg === "") {
        if (isEmergency) {
          extraMsg = " (النقاط كاملة لوجود عذر 🛡️)";
        } else if (earnedPoints === 15) {
          extraMsg = " (عاش أبطال التبكير 🔥)";
        } else if (earnedPoints >= 12) {
          extraMsg = " (حاول تبدر المرة الجاية ⚡)";
        } else if (earnedPoints >= 7) {
          extraMsg = " (لحقت نفسك بأعجوبة ⏳)";
        } else {
          extraMsg = " (التأخير ده خطر جداً ⚠️)";
        }
      }

      if (multiplier > 1.0) {
        extraMsg += " (" + getMultiplierLabel() + ")";
      }
      if (isFridayBonus) {
        extraMsg += " (✨ بونص الجمعة ×2)";
      }

      var countToday = countTodayPrayers(props, islamicDateStr);
      var prayerFlavor = getPrayerFlavor(props, actualPrayer, countToday);

      // كشف أول صلاة بعد انتكاسة
      var postRelapseMsg = "";
      if (props.getProperty('JUST_RELAPSED') === "true") {
        props.deleteProperty('JUST_RELAPSED');
        postRelapseMsg = "\n\n💚 دي أول صلاة بعد السقوط. ودي أهم خطوة. اللي بيرجع لله بعد المعصية مش ضعيف، ده محارب حقيقي.";
      }

      sendMessage(chatId, "تم إنجاز صلاة " + text + " بنجاح 🦅! تم إضافة " + finalPoints + " نقطة " + extraMsg + prayerFlavor + "\nرصيدك الحالي: " + newP + postRelapseMsg);
      runPulse(props, chatId, actualPrayer);
      updatePrayerStreak(islamicDateStr, props, chatId);
      sendMenu(chatId, "استعد للي بعدها. الزرار بتاعها هيختفي عشان الكيبورد يفضل رايق.", getKeyboard(newP));
    } else {
      sendMessage(chatId, "أنت سجلت الصلاة دي قبل كده يا بطل.");
      sendMenu(chatId, "الكيبورد اتحدث:", getKeyboard(p));
    }
  }
  else if (text === "إذن طوارئ 🛡️") {
    props.setProperty('EMERGENCY_MODE', "true");
    sendMessage(chatId, "علم وينفذ. تم تفعيل وضع الطوارئ الصامت. مفيش عقوبات هتتخصم ولا إنذارات هتتبعت. متنساش تسجل مهامك أول ما توصل بالسلامة! 🫡");
    sendMenu(chatId, "الطوارئ مفعلة 🟢", getKeyboard(p));
  }
  else if (text === "فك الطوارئ 🟢") {
    props.setProperty('EMERGENCY_MODE', "false");
    sendMessage(chatId, "تم فك وضع الطوارئ. رجعنا للخدمة والإنذارات اشتغلت تاني ⚔️");
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(p));
  }
  else if (text === "تحدي ٤٠ يوم 🏁") {
    var challengeStatus = props.getProperty('FORTY_STATUS') || "";
    if (challengeStatus === "ACTIVE") {
      var challengeDays = Math.min(40, getFortyChallengeDays(props));
      sendMenuCustom(chatId,
        getFortyChallengeText(props) + "\n\nكل يوم ثبات يقرّبك من الوسام ومكافأة +600 نقطة.",
        [[{"text": "رجوع ⬅️"}]]);
    } else if (challengeStatus === "COMPLETED") {
      sendMenu(chatId, "أنت أتممت تحدي الأربعين بالفعل. الإنجاز ده مسجل في ملفك العسكري 🏆", getKeyboard(p));
    } else {
      sendMenuCustom(chatId,
        "🏁 *تحدي ٤٠ يوم*\n\n40 يوماً من الثبات المتواصل. لو حصلت انتكاسة يتوقف التحدي، ولو وصلت للنهاية تحصل على 600 نقطة ووسام خاص.\n\nالهدف مش الكمال؛ الهدف إنك ترجع تختار نفسك كل يوم.",
        [[{"text": "ابدأ تحدي ٤٠ يوم 🔥"}], [{"text": "رجوع ⬅️"}]]);
    }
  }
  else if (text === "ابدأ تحدي ٤٠ يوم 🔥") {
    props.setProperty('FORTY_STATUS', "ACTIVE");
    props.setProperty('FORTY_START_TS', new Date().getTime().toString());
    props.setProperty('FORTY_START_DATE', islamicDateStr);
    sendMenu(chatId,
      "🔥 بدأت المهمة. اليوم الأول مش محتاج بطولة خارقة؛ محتاج قرار واضح.\n\n" + getFortyChallengeText(props),
      getKeyboard(p));
  }
  else if (text === "مهمة خاصة 🎯") {
    if (p < 501) return;
    var doneToday = props.getProperty('MISSION_DONE_' + islamicDateStr);
    if (doneToday) {
      sendMessage(chatId, "أنت أنجزت مهمتك الخاصة النهاردة يا بطل! وفر طاقتك لبكرة 🦅");
    } else {
      var missions = [
        "استغفر الله 100 مرة بيقين وحضور قلب.",
        "صلي على النبي ﷺ 100 مرة.",
        "اقرأ سورة الملك (المنجية من عذاب القبر) الليلة.",
        "اقرأ سورة الواقعة بنية الرزق والتوفيق.",
        "اقرأ 5 صفحات من القرآن الكريم بتركيز.",
        "سبح الله 100 مرة (سبحان الله وبحمده).",
        "اقرأ سورة الكهف كاملة.",
        "صلِّ ركعتين قيام ليل الليلة قبل ما تنام.",
        "تصدق بأي مبلغ النهارده (ولو جنيه واحد).",
        "اكتب 3 نعم ربنا أنعم عليك بيها النهارده وحمده عليها.",
        "قل: لا حول ولا قوة إلا بالله 100 مرة.",
        "اقرأ أذكار الصباح والمساء كاملة النهارده.",
        "اتصل بحد من أهلك واسأله بصدق إذا كان يحتاج شيئاً.",
        "اقرأ صفحتين بتدبر واكتب آية لمستك.",
        "صلِّ ركعتين نفل بنية الثبات والهداية.",
        "خد 10 دقائق بعيداً عن الهاتف، واذكر الله خلالها."
      ];
      var m = pickFreshContent(props, "MISSION", missions);
      props.setProperty('PENDING_MISSION_' + islamicDateStr, "true");

      var tempKeyboard = getKeyboard(p);
      tempKeyboard.unshift([{"text": "تم إنجاز المهمة ✅"}]);
      sendMenuCustom(chatId, "مهمتك الخاصة: " + m + "\n\nلو خلصتها دوس على (تم إنجاز المهمة ✅).", tempKeyboard);
    }
  }
  else if (text === "أنجزت التحدي ✅") {
    if (props.getProperty('JOKER_ACTIVE') === "true" && props.getProperty('JOKER_DATE') === islamicDateStr) {
      props.setProperty('JOKER_ACTIVE', "false");
      var newP = addPoints(150);
      addMedal("🃏 وسام الجوكر النادر", chatId);
      sendMessage(chatId, "🃏 **عاش وحش المعسكر!** تم إنجاز التحدي بنجاح.\nتمت إضافة 150 نقطة لرصيدك والوسام النادر! 🏆\nالرصيد الجديد: " + newP);
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(newP));
    } else {
      sendMenu(chatId, "التحدي انتهى أو غير متاح حالياً.", getKeyboard(p));
    }
  }
  else if (text === "تجاهل ❌") {
    if (props.getProperty('JOKER_ACTIVE') === "true" && props.getProperty('JOKER_DATE') === islamicDateStr) {
      props.setProperty('JOKER_ACTIVE', "false");
      sendMessage(chatId, "تم تجاهل التحدي. الفرص الكبيرة لا تأتي دائماً يا بطل 🃏");
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(p));
    } else {
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(p));
    }
  }
  else if (text === "تم إنجاز المهمة ✅") {
    if (props.getProperty('PENDING_MISSION_' + islamicDateStr) === "true") {
      props.setProperty('PENDING_MISSION_' + islamicDateStr, "false");
      props.setProperty('MISSION_DONE_' + islamicDateStr, "true");
      var newP = addPoints(50);
      sendMessage(chatId, "عاش جداً! تم إضافة 50 نقطة لرصيدك.");
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(newP));
    }
  }
  else if (text === "صندوق الدعم 📦") {
    if (p < 1001) return;
    var newP = addPoints(-100);
    var rewards = [
      "'الشهوة لحظة، والندم سنين. والانتصار لحظة، والفخر سنين.'",
      "'اللهم يا مقلب القلوب ثبت قلبي على دينك' — رددها دايماً.",
      "'الشيطان بيزينلك المعصية قبلها، وبيسيبك تندم لوحدك بعدها. خليك أذكى منه.'",
      "'كل تعب في مقاومة الهوى، بيتبني بيه قصر في الجنة.'",
      "'النفس إذا أُعطيت ما تشتهي، طغت. وإذا مُنعت، رجعت.'",
      "'الاستمرارية أقوى من الكمال. يوم ضعيف ولكن تكمل، أفضل من يوم مثالي ثم تتوقف.'",
      "'قيمتك ليست في عدد مرات السقوط، بل في عدد مرات القيام.'",
      "'لما تقاوم في الخفاء، أنت بتبني نسخة محدش يقدر يهزها.'",
      "'لا تستصغر خطوة النهارده؛ أغلب التحولات الكبيرة بدأت بقرار هادي.'",
      "'مش لازم تحس بالقوة عشان تتصرف بقوة. تصرف الأول، والإحساس هيلحقك.'",
      "'اللي بيحمي يومك مش الحماس؛ اللي بيحميه نظام صغير بتلتزم بيه.'"
    ];
    var r = pickFreshContent(props, "SUPPORT", rewards);
    sendMessage(chatId, "🎁 *رسالة من الصندوق:*\n\n" + r);
    sendMenu(chatId, "تم خصم 100 نقطة. رصيدك الحالي: " + newP, getKeyboard(newP));
  }
  else if (text === "خزينة الانتصارات 🏆") {
    var keys = [
      [{"text": "تسجيل انتصار ✍️"}],
      [{"text": "استمد طاقة 🔥"}],
      [{"text": "رجوع ⬅️"}]
    ];
    sendMenuCustom(chatId, "خزينة الانتصارات 🏆\nاختار عايز تعمل إيه:", keys);
  }
  else if (text === "تسجيل انتصار ✍️") {
    props.setProperty('AWAITING_VICTORY', "true");
    var keys = [[{"text": "إلغاء ❌"}]];
    sendMenuCustom(chatId, "اكتب انتصارك دلوقتي (مثلاً: قاومت فكرة وحشة، غضيت بصري، قمت صليت وأنا مكسل جداً):", keys);
  }
  else if (text === "إلغاء ❌") {
    props.setProperty('AWAITING_VICTORY', "false");
    sendMenu(chatId, "تم الإلغاء.", getKeyboard(p));
  }

  else if (text === "استمد طاقة 🔥") {
    var vault = props.getProperty('VICTORY_VAULT');
    var vaultArr = safeParse(vault, []);
    if (vaultArr.length === 0) {
      sendMessage(chatId, "الخزينة لسه فاضية! سجل انتصاراتك الأول عشان تلاقيها وقت الزنقة.");
    } else {
      var randomVic = vaultArr[Math.floor(Math.random() * vaultArr.length)];
      sendMessage(chatId, "🔥 رسالة من الماضي:\n\n*" + randomVic + "*\n\nفاكر لما قاومت وكنت قوي؟ إنت تقدر تعملها تاني دلوقتي! 🦅");
    }
  }
  else if (text.indexOf("/addvic ") === 0) {
    var vText = text.replace("/addvic ", "");
    var vault = props.getProperty('VICTORY_VAULT');
    var vaultArr = safeParse(vault, []);
    vaultArr.unshift(vText);
    props.setProperty('VICTORY_VAULT', JSON.stringify(vaultArr));
    sendMessage(chatId, "تم إضافة الانتصار بنجاح! 🏆");
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
      sendMessage(chatId, "تم مسح الانتصار بنجاح! 🗑️");
    }
    return;
  }
  else if (text === "عملية الأسبوع 📅") {
    if (p < 1001) return;

    var currentWeek = Utilities.formatDate(new Date(), "GMT+3", "yyyy") + "-" + Utilities.formatDate(new Date(), "GMT+3", "w");
    var savedWeek = props.getProperty('WEEKLY_OP_NUM');
    var opStatus = props.getProperty('WEEKLY_OP_STATUS');
    var currentOp = props.getProperty('WEEKLY_OP_TEXT');

    var ops = [
      "صيام يومين هذا الأسبوع (الاثنين والخميس أو أي يومين).",
      "قراءة سورة البقرة كاملة في ركعتين قيام ليل هذا الأسبوع.",
      "حفظ 5 آيات جديدة ومراجعتها يومياً.",
      "الاستيقاظ قبل الفجر بنصف ساعة يومياً هذا الأسبوع.",
      "الصدقة ولو بمبلغ بسيط مرتين هذا الأسبوع.",
      "صلاة الضحى يومياً هذا الأسبوع (ركعتين بعد الشروق بـ 15 دقيقة).",
      "قراءة جزء كامل من القرآن مقسم على أيام الأسبوع.",
      "ختم أذكار الصباح والمساء كل يوم هذا الأسبوع.",
      "قيام ليل 3 ليالي هذا الأسبوع (ولو ركعتين).",
      "غض البصر تماماً عن كل المحتوى السيء لمدة أسبوع كامل.",
      "إهدِ دعوة بظهر الغيب لخمسة أشخاص مختلفين كل يوم هذا الأسبوع.",
      "قراءة ورد قرآني ثابت 10 دقائق يومياً لمدة أسبوع.",
      "المشي 20 دقيقة يومياً بدون هاتف لمدة خمسة أيام هذا الأسبوع.",
      "إغلاق السوشيال ميديا قبل النوم بساعة لسبعة أيام."
    ];

    if (savedWeek !== currentWeek) {
      currentOp = pickFreshContent(props, "WEEKLY_OP", ops);
      props.setProperty('WEEKLY_OP_NUM', currentWeek);
      props.setProperty('WEEKLY_OP_TEXT', currentOp);
      props.setProperty('WEEKLY_OP_STATUS', "PENDING");
      opStatus = "PENDING";
    }

    if (opStatus === "DONE") {
      sendMessage(chatId, "أنت أنجزت عملية هذا الأسبوع بجدارة! استرح واستعد للأسبوع القادم ⚔️");
    } else {
      var keys = [
        [{"text": "تم إنجاز العملية الأسبوعية ✅"}],
        [{"text": "رجوع ⬅️"}]
      ];
      sendMenuCustom(chatId, "📅 عملية الأسبوع:\n\n" + currentOp + "\n\nالمكافأة: 200 نقطة ووسام نادر.", keys);
    }
  }

  else if (text === "📅 مواعيد الصلاة") {
    var pTimes = getPrayerTimes();
    var msg = "📅 **مواعيد الصلاة اليوم:**\n\n";
    msg += "الفجر: " + pTimes["الفجر"] + "\n";
    msg += "الشروق: " + pTimes["الشروق"] + "\n";
    msg += "الظهر: " + pTimes["الظهر"] + "\n";
    msg += "العصر: " + pTimes["العصر"] + "\n";
    msg += "المغرب: " + pTimes["المغرب"] + "\n";
    msg += "العشاء: " + pTimes["العشاء"] + "\n";
    sendMessage(chatId, msg);
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(p));
  }
  else if (text === "📿 ذكر سريع") {
    var keys = [
      [{"text": "سبحان الله × 33"}],
      [{"text": "الحمد لله × 33"}],
      [{"text": "الله أكبر × 33"}],
      [{"text": "صلاة على النبي × 100"}],
      [{"text": "رجوع ⬅️"}]
    ];
    var dhikrCount = parseInt(props.getProperty('DHIKR_COUNT_' + islamicDateStr) || "0");
    sendMenuCustom(chatId, "📿 **قائمة الأذكار السريعة**\nكل جلسة ذكر بـ 5 نقاط. الحد الأقصى 3 مرات يومياً.\nأنجزت اليوم: " + dhikrCount + "/3", keys);
  }
  else if (text === "سبحان الله × 33" || text === "الحمد لله × 33" || text === "الله أكبر × 33" || text === "صلاة على النبي × 100") {
    var dhikrCount = parseInt(props.getProperty('DHIKR_COUNT_' + islamicDateStr) || "0");
    var totalDhikr = parseInt(props.getProperty('TOTAL_DHIKR') || "0");
    if (dhikrCount >= 3) {
      sendMessage(chatId, "لقد أتممت الحد الأقصى من النقاط للأذكار اليوم (3 جلسات). تقبل الله منك! ✨\nإجمالي جلسات الذكر في مسيرتك: " + totalDhikr + " جلسة 📿");
    } else {
      props.setProperty('DHIKR_COUNT_' + islamicDateStr, (dhikrCount + 1).toString());
      props.setProperty('TOTAL_DHIKR', (totalDhikr + 1).toString());
      addPoints(5, "جلسة ذكر: " + text);
      sendMessage(chatId, "أحسنت! 📿 تم تسجيل الجلسة وإضافة 5 نقاط.\nإجمالي جلسات الذكر: " + (totalDhikr + 1) + " جلسة");
    }
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(getPoints()));
  }
  else if (text === "صيام نافلة 🌙") {
    var keys = [
      [{"text": "اثنين وخميس"}],
      [{"text": "أيام البيض"}],
      [{"text": "يوم عرفة"}],
      [{"text": "تاسوعاء وعاشوراء"}],
      [{"text": "شوال"}],
      [{"text": "رجوع ⬅️"}]
    ];
    sendMenuCustom(chatId, "🌙 **صيام النافلة:**\nاختر نية الصيام اليوم. (المكافأة: 50 نقطة)", keys);
  }
  else if (["اثنين وخميس", "أيام البيض", "يوم عرفة", "تاسوعاء وعاشوراء", "شوال"].indexOf(text) !== -1) {
    var fKey = 'FASTING_DONE_' + islamicDateStr;
    if (props.getProperty(fKey)) {
      sendMessage(chatId, "لقد سجلت صياماً اليوم بالفعل. تقبل الله طاعتك! 🌙");
    } else {
      props.setProperty(fKey, "true");
      var fCount = parseInt(props.getProperty('FASTING_COUNT') || "0");
      props.setProperty('FASTING_COUNT', (fCount + 1).toString());
      var fStreak = parseInt(props.getProperty('FASTING_STREAK') || "0");
      props.setProperty('FASTING_STREAK', (fStreak + 1).toString());
      addPoints(50, "صيام نافلة: " + text);
      sendMessage(chatId, "تقبل الله صيامك! 🌙 تم إضافة 50 نقطة لرصيدك.");
    }
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(getPoints()));
  }
  else if (text === "صلاة التراويح 🕌") {
    var tarawihKey = 'TARAWIH_DONE_' + islamicDateStr;
    if (props.getProperty(tarawihKey)) {
      sendMessage(chatId, "لقد صليت التراويح اليوم. تقبل الله منك! 🕌");
    } else {
      props.setProperty(tarawihKey, "true");
      addPoints(30, "صلاة التراويح");
      sendMessage(chatId, "تقبل الله صلاتك! 🕌 تم إضافة 30 نقطة لرصيدك.");
    }
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(getPoints()));
  }
  else if (text === "خصم يدوي ➖") {
    sendMessage(chatId, "عشان تخصم نقاط يدوياً، اكتب كلمة 'خصم' وبعدها الرقم.\nمثال: خصم 50");
  }
  else if (text.startsWith("خصم ")) {
    var amount = parseInt(text.replace("خصم ", "").trim());
    if (isNaN(amount) || amount <= 0) {
      sendMessage(chatId, "الرقم غير صحيح! اكتب كلمة 'خصم' وبعدها رقم صحيح. مثال: خصم 50");
    } else {
      addPoints(-amount, "خصم يدوي");
      props.setProperty('LAST_MANUAL_DEDUCT_DATE', islamicDateStr);
      sendMessage(chatId, "تم خصم " + amount + " نقطة من رصيدك بنجاح ➖. رصيدك الحالي: " + getPoints());
      sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(getPoints()));
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
      var earnedDate = "مكتسب مسبقاً";
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

      var mText = "🏆 *" + foundData.name + "*\n\n";
      mText += "📝 *الوصف:* " + foundData.desc + "\n";
      if (hasMedal) {
        mText += "✅ *الحالة:* تم الحصول عليه\n";
        mText += "📅 *تاريخ الحصول عليه:* " + earnedDate;
      } else {
        mText += "❌ *الحالة:* لم يتم الحصول عليه بعد.";
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

  else if (text === "ملف الوحش 🦍") {
    var details = getStreakDetails();
    var days = getStreakDays();
    var msgText = getStreakMessage(days);
    var rank = getRank(p);

    if (days >= 1) addMedal("شارة المحارب الأولى 🎖️", chatId);
    if (days >= 3) addMedal("وسام الإرادة الصلبة 🛡️", chatId);
    if (days >= 7) addMedal("نجمة الأسبوع النحاسية 🥉", chatId);
    if (days >= 30) addMedal("درع الشهر الفضي 🥈", chatId);
    if (days >= 90) addMedal("تاج الصمود الذهبي 🥇", chatId);
    if (days >= 180) addMedal("وسام النقاء المطلق 💎", chatId);

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
    var pList = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
    for (var i = 0; i < pList.length; i++) {
      var isP = (props.getProperty('PRAYED_' + pList[i]) === islamicDateStr);
      todayPrayersList += pList[i] + ": " + (isP ? "✅" : "❌") + "\n";
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
        pbText = "👑 أعلى صمود (PB): " + personalBest + " يوم — *رقمك الحالي* 🏆\n";
      } else {
        pbText = "👑 أعلى صمود (PB): " + personalBest + " يوم (أنت عند " + pct + "% منه)\n";
      }
    }
    
    pbText += "🎯 هدف الإحماء (عشان ترجع لمستواك): " + targetGoal + " يوم\n";
    
    var barLength = 10;
    var progress = Math.floor((days / targetGoal) * barLength);
    if (progress > barLength) progress = barLength;
    var bar = "[";
    for(var i=0; i<barLength; i++) {
        bar += (i < progress) ? "█" : "░";
    }
    bar += "] " + Math.floor((days/targetGoal)*100) + "%";
    pbText += "📈 التقدم نحو الهدف:\n" + bar + "\n";
    
    if (targetGoal - days <= 2 && targetGoal - days > 0) {
        pbText += "🔥 *على بُعد خطوة من المجد.. إياك تسقط دلوقتي!*\n";
    }
    
    var dynamicEmoji = "⚔️";
    if (days >= 30) dynamicEmoji = "👑";

    var profile = "📋 **الملف العسكري — Camp Zero**\n━━━━━━━━━━━━━━━\n";
    profile += "🎖️ الرتبة: " + rank + "\n";
    profile += "💎 النقاط: " + p + " نقطة\n";
    profile += dynamicEmoji + " أيام الصمود: " + days + " يوم\n";

    profile += pbText;
    profile += "⚡ مضاعف الصمود: " + getMultiplierLabel() + "\n";
    profile += "🕌 ستريك الصلوات: " + prayerStreak + " يوم متتالي\n";
    profile += "🛡️ الدروع المتاحة: " + shields + "/3\n";
    profile += "🏆 إجمالي الانتصارات المسجلة: " + totalVictories + "\n";
    profile += getFortyChallengeText(props) + "\n";
    if (fCount > 0) profile += "🌙 أيام صيام النافلة: " + fCount + " أيام\n";
    if (isJokerActive && jokerTask) {
      profile += "\n🃏 *تحدي جوكر نشط:* " + jokerTask + "\n";
    }
    profile += "\n📈 التقدم للرتبة التالية:\n" + getNextRankProgress(p) + "\n\n";
    profile += "*سجل صلوات اليوم:*\n" + todayPrayersList + "\n";
    profile += "*تفاصيل مدة الصمود:*\n" + details + "\n\n";
    profile += "الأوسمة: " + medals + "\n\n";
    profile += "💬 رسالة القيادة:\n" + msgText;

    sendMenu(chatId, profile, getKeyboard(p));
  }
  else if (text === "سجل السقوط 📉") {
    var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);
    if (shameArr.length === 0) {
      sendMenu(chatId, "سجلك نظيف يا وحش! مفيش أي انتكاسات متسجلة. عاش! 🦅", getKeyboard(p));
    } else {
      var mText = "📉 **سجل السقوط (The Wall of Shame):**\n\n";
      for (var i = 0; i < shameArr.length; i++) {
        mText += (i+1) + ". 📅 " + shameArr[i] + "\n";
      }
      mText += "\nبص للتواريخ دي كويس وافتكر شعورك وقتها عشان متكررهاش تاني. إنت أقوى من كدة ⚔️";
      sendMenu(chatId, mText, getKeyboard(p));
    }
  }
  else if (text === "العودة للقتال ⚔️") {
    var confirmKeys = [
      [{"text": "نعم، وقعت فعلاً ⚔️"}],
      [{"text": "تراجع ❌"}]
    ];
    var daysNow = getStreakDays();
    var shieldsNow = parseInt(props.getProperty('SHIELDS') || "0");
    var warnMsg = "⚠️ *تأكيد الانتكاسة*\n\n";
    warnMsg += "ستريكك الحالي: *" + daysNow + " يوم*\n";
    if (shieldsNow > 0) {
      warnMsg += "🛡️ عندك " + shieldsNow + " درع — الدرع هيمتص الضربة ويحمي الستريك والنقاط.\n";
    } else {
      warnMsg += "❌ مفيش دروع — النقاط والستريك هيتصفروا.\n";
    }
    warnMsg += "\nمتأكد؟";
    sendMenuCustom(chatId, warnMsg, confirmKeys);
  }
  else if (text === "نعم، وقعت فعلاً ⚔️") {
    var keys = [
      [{"text": "دلوقتي حالا 🔴"}],
      [{"text": "من ساعة 🕐"}, {"text": "من ساعتين 🕑"}],
      [{"text": "من نص يوم 🌗"}, {"text": "إمبارح 📅"}],
      [{"text": "تراجع ❌"}]
    ];
    sendMenuCustom(chatId, "الوقوع ده حصل إمتى بالظبط يا بطل؟", keys);
  }
  else if (text === "دلوقتي حالا 🔴" || text === "من ساعة 🕐" || text === "من ساعتين 🕑" || text === "من نص يوم 🌗" || text === "إمبارح 📅") {
    var offset = 0;
    if (text === "من ساعة 🕐") offset = 60 * 60 * 1000;
    else if (text === "من ساعتين 🕑") offset = 2 * 60 * 60 * 1000;
    else if (text === "من نص يوم 🌗") offset = 12 * 60 * 60 * 1000;
    else if (text === "إمبارح 📅") offset = 24 * 60 * 60 * 1000;

    var relapseTime = new Date().getTime() - offset;
    var relapseDateStr = Utilities.formatDate(new Date(relapseTime), "GMT+3", "yyyy-MM-dd HH:mm:ss");
    var shameArr = safeParse(props.getProperty('WALL_OF_SHAME'), []);

    if (props.getProperty('FORTY_STATUS') === "ACTIVE") {
      var fortyDays = getFortyChallengeDays(props);
      props.setProperty('FORTY_STATUS', "FAILED");
      props.setProperty('FORTY_LAST_DAYS', fortyDays.toString());
      props.deleteProperty('FORTY_START_TS');
      sendMessage(chatId, "🏁 تحدي الأربعين توقف عند " + fortyDays + " يوم. خذ نفساً، اتعلم من اللحظة دي، وابدأ من جديد لما تكون جاهز. العودة جزء من القوة.");
    }

    var shields = parseInt(props.getProperty('SHIELDS') || "0");
    if (shields > 0) {
      props.setProperty('SHIELDS', (shields - 1).toString());
      props.setProperty('SHIELD_ACTIVE', "true");

      shameArr.push(relapseDateStr + " (محمي بالدرع 🛡️)");
      if (shameArr.length > 50) shameArr.shift();
      props.setProperty('WALL_OF_SHAME', JSON.stringify(shameArr));

      sendMessage(chatId, "🛡️ تفعيل درع الحماية! 🛡️\n\nالدرع اتكسرت وامتصت الضربة. الستريك والنقاط في أمان بفضل الدرع.\nعندك حماية إضافية من خصم التفتيش لأول 3 أيام.\nمتبقي لك دروع: " + (shields - 1));
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(getPoints()));
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
      if (personalBest > 0) pbMsg = "\n\nالنهاردة وقعت.. بس متنساش إنك في يوم من الأيام قدرت تصمد " + personalBest + " يوم.. اللي عملها مرة يعملها تاني.";
      sendMessage(chatId, "المحارب الحقيقي بيقع ويقوم أقوى. تم تصفير العداد وتحديث وقت الانتكاسة في سجل السقوط. ارفع سيفك وابدأ القتال من جديد دلوقتي 🐺\nأنت الآن في فترة الاستعادة (" + recoveryPeriod + " يوم) بدون حماية." + pbMsg);
      props.setProperty('JUST_RELAPSED', "true");
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(0));
    }
  }
  else if (text === "تراجع ❌" || text === "رجوع ⬅️") {
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(p));
  }
  else {
    sendMenu(chatId, "اختر من أوامر المعسكر بالأسفل 👇", getKeyboard(p));
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
  var prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

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

  keys.push([{"text": "ملف الوحش 🦍"}, {"text": "العودة للقتال ⚔️"}]);

  var row4 = [];
  if (isEmergency) {
    row4.push({"text": "فك الطوارئ 🟢"});
  } else {
    row4.push({"text": "إذن طوارئ 🛡️"});
  }
  row4.push({"text": "سجل السقوط 📉"});
  row4.push({"text": "خصم يدوي ➖"});
  keys.push(row4);

  var extraRow = [];
  extraRow.push({"text": "تحدي ٤٠ يوم 🏁"});
  if (points >= 501) extraRow.push({"text": "مهمة خاصة 🎯"});
  if (points >= 1001) extraRow.push({"text": "صندوق الدعم 📦"});
  if (extraRow.length > 0) keys.push(extraRow);

  var extraRow2 = [];
  extraRow2.push({"text": "خزينة الانتصارات 🏆"});
  if (points >= 1001) extraRow2.push({"text": "عملية الأسبوع 📅"});
  if (extraRow2.length > 0) keys.push(extraRow2);

  var extraRow3 = [];
  extraRow3.push({"text": "📅 مواعيد الصلاة"});
  extraRow3.push({"text": "📿 ذكر سريع"});
  keys.push(extraRow3);

  var extraRow4 = [];
  if (points >= 500) extraRow4.push({"text": "صيام نافلة 🌙"});

  // Ramadan Tarawih Button Check
  var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");
  if (hMonth === 9) {
    if (extraRow4.length < 2) {
      extraRow4.push({"text": "صلاة التراويح 🕌"});
    } else {
      keys.push(extraRow4);
      extraRow4 = [{"text": "صلاة التراويح 🕌"}];
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
    var result = safeParse(response.getContentText(), { ok: false, description: "استجابة غير صالحة" });
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
  var values = [["المفتاح", "القيمة", "تاريخ النسخ"]];
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
  if (!backupSheet) throw new Error("مفيش ورقة Backup موجودة. اعمل /backup الأول.");

  var data = backupSheet.getDataRange().getValues();
  if (data.length <= 1 || data[0][0] !== "المفتاح" || data[0][1] !== "القيمة") {
    throw new Error("ملف النسخة الاحتياطية غير صالح أو فارغ.");
  }

  var values = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var value = data[i][1];
    if (typeof key === 'string' && key && value !== undefined && value !== null) {
      values[key] = value.toString();
    }
  }
  if (Object.keys(values).length === 0) throw new Error("ملف النسخة الاحتياطية لا يحتوي بيانات صالحة.");

  props.setProperties(values, false);
  return Object.keys(values).length;
}

function logToSheet(type, value) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Logs");
    if (!sheet) {
      sheet = ss.insertSheet("Logs");
      sheet.appendRow(["التاريخ", "الوقت", "النوع", "القيمة"]);
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

  return "🗓️ " + days + " أيام\n⏳ " + hours + " ساعة\n⏱️ " + mins + " دقيقة\n⏱️ " + secs + " ثانية";
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
  if (days < recoveryPeriod) return 2.0;     // 🔥 وضع الاستعادة (تشجيع)
  if (days >= 90) return 3.0;   // 🌌 أسطوري
  if (days >= 60) return 2.5;   // 💎 محترف
  if (days >= 30) return 2.0;   // 🏆 متقدم
  if (days >= 14) return 1.5;   // 🔥 جيد
  return 1.0;                   // عادي
}

function getMultiplierLabel() {
  var props = PropertiesService.getScriptProperties();
  var recoveryPeriod = parseInt(props.getProperty('RECOVERY_PERIOD') || "7");
  var days = getStreakDays();
  var m = getStreakMultiplier();
  if (days < recoveryPeriod) return "🔥 وضع الاستعادة (×2)";
  if (m >= 3.0) return "🌌 أسطوري (×3)";
  if (m >= 2.5) return "💎 محترف (×2.5)";
  if (m >= 2.0) return "🏆 متقدم (×2)";
  if (m >= 1.5) return "🔥 في طريقك (×1.5)";
  return "⚔️ ابدأ (×1)";
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
  var phaseTitles = ["🌙 وردية الليل", "🌅 وردية الفجر", "☀️ وردية النهار", "🌆 وردية المساء"];
  var phaseLines = [
    ["الليل بيختبر القرارات الهادية. ابعد خطوة عن أي باب خطر.", "الهدوء ده فرصة؛ اقفل يومك على حاجة تفتخر بيها.", "مش كل معركة صوتها عالي. ثباتك الليلة محسوب."],
    ["بداية اليوم بتكتب اتجاهه. أول اختيار صح بيفرق.", "الناس لسه بتصحى، وأنت بتبني سبق صغير لنفسك.", "خلي الفجر علامة إنك ماسك زمام يومك."],
    ["وسط الزحمة، الثبات قرار يتاخد مرة ورا مرة.", "خد دقيقة تنظم نفسك قبل ما اليوم يسحبك.", "إنجاز هادي دلوقتي أحسن من نية كبيرة تتأجل."],
    ["اقفل يومك بقرار يخلي بكرة أسهل.", "المساء وقت مراجعة، مش جلد ذات. خطوة صح وكمل.", "لو اليوم كان تقيل، خليه يخلص وأنت واقف." ]
  ];
  var stage = "";

  if (days === 0) stage = "ضربة البداية. اللي فات انتهى؛ المهمة دلوقتي هي الساعة الجاية.";
  else if (days < 3) stage = "أول الأيام حساسة، وكل قرار صغير بيحمي الستريك.";
  else if (days < recoveryPeriod) stage = "أنت في مرحلة استعادة. المطلوب ثبات، مش ضغط مثالي.";
  else if (days === recoveryPeriod) stage = "فترة الاستعادة انتهت. رجعت للساحة وأنت أهدى وأقوى.";
  else if (days < 7) stage = "باقي خطوات قليلة على أسبوع كامل — متديش العادة القديمة مساحة.";
  else if (days < 14) stage = "أسبوع صمود مش صدفة؛ ده دليل إنك قادر تكرر الصح.";
  else if (days < 30) stage = "العادة الجديدة بتاخد شكلها. حافظ على الروتين اللي جابك لحد هنا.";
  else if (days < 60) stage = "أنت في مرحلة بناء هوية، مش مجرد عداد أيام.";
  else if (days < 90) stage = "كل يوم زيادة بيثبت إنك مش نفس الشخص اللي بدأ.";
  else if (days < 180) stage = "ثباتك بقى له وزن. خليك حذر من الثقة الزيادة.";
  else stage = "الاستمرارية هنا إنجاز نادر. حافظ على تواضع البداية وتركيزها.";

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

  var msg = "📅 **الملخص الأسبوعي للقيادة:**\n\n";
  msg += "أديت الأسبوع ده " + onTime + " صلوات في وقتهم، و " + qadaa + " قضاء.\n";
  msg += "نسبة الالتزام: " + percentage + "%\n\n";
  var performanceHistory = safeParse(props.getProperty('WEEKLY_PERFORMANCE_HISTORY'), []);
  if (performanceHistory.length > 0 && typeof performanceHistory[0].percentage === 'number') {
    var delta = percentage - performanceHistory[0].percentage;
    if (delta > 0) msg += "📈 أفضل من الأسبوع الماضي بـ " + delta + "% — بتنافس نفسك صح.\n";
    else if (delta < 0) msg += "📉 أقل من الأسبوع الماضي بـ " + Math.abs(delta) + "% — عندك هدف واضح للأسبوع الجاي.\n";
    else msg += "➖ نفس مستوى الأسبوع الماضي — كسر التعادل هدفك القادم.\n";
  }
  if (percentage >= 90) msg += "أداء أسطوري! استمر يا بطل. 🦅";
  else if (percentage >= 50) msg += "أداء متوسط، تقدر تعمل أحسن من كدة الأسبوع الجاي. ⚔️";
  else msg += "أداء ضعيف! لازم تفوق لنفسك، المعسكر مابيرحمش المكسلين. ⚠️";

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

  var msg = "📊 **التقرير الشهري الشامل:**\n\n";
  msg += "رصيد النقاط الحالي: " + p + " نقطة 💎\n";
  msg += "أعلى ستريك صلوات متتالية: " + maxStreak + " يوم 🔥\n";
  msg += "أعلى صمود (PB): " + pb + " يوم 👑\n";
  msg += "عدد السقطات المسجلة: " + fCount + " مرة 📉\n\n";
  msg += "استعد لشهر جديد من التحديات، القيادة بتراقبك! 🦅";

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
    msg += "\n\n**من سجلات المراقبة (الشهر الحالي):**\n";
    msg += "استخدام أمر /fix للطوارئ: " + fixCount + " مرة\n";
    msg += "صلوات قضاء: " + qadaaCount + " صلاة\n";
  } catch(e) {}

  sendMessage(chatId, msg);
}

function sendMorningVerse(chatId) {
  var verses = [
    "قال تعالى: {وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ}",
    "عن النبي ﷺ: «رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا»",
    "قال تعالى: {إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا}",
    "قال تعالى: {وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا}",
    "عن النبي ﷺ: «مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ»",
    "قال تعالى: {وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا}",
    "قال تعالى: {إِنَّ اللَّهَ مَعَ الصَّابِرِينَ}"
  ];
  var ramadanVerses = [
    "قال تعالى: {شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ}",
    "عن النبي ﷺ: «مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ»",
    "عن النبي ﷺ: «الصِّيَامُ وَالْقُرْآنُ يَشْفَعَانِ لِلْعَبْدِ يَوْمَ الْقِيَامَةِ»"
  ];

  var props = PropertiesService.getScriptProperties();
  var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");

  var msg = "🌅 **إشراقة القيادة:**\n\n";
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
      if (parsed["الشروق"]) return parsed;
    }
  }

  var prayerTimes;
  try {
    var response = UrlFetchApp.fetch("https://api.aladhan.com/v1/timingsByCity?city=Tanta&country=Egypt&method=5");
    var data = JSON.parse(response.getContentText());
    var timings = data.data.timings;
    prayerTimes = {
      "الفجر": timings.Fajr,
      "الشروق": timings.Sunrise,
      "الظهر": timings.Dhuhr,
      "العصر": timings.Asr,
      "المغرب": timings.Maghrib,
      "العشاء": timings.Isha
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
      "الفجر": "04:30", "الشروق": "06:00",
      "الظهر": "12:00", "العصر": "15:30",
      "المغرب": "18:00", "العشاء": "19:30"
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
    sendMessage(chatId, "💤 يبدو أنك في سبات عميق (خمول 6 ساعات). تم تفعيل **وضع السبات التلقائي** لحمايتك من الخصومات المستمرة والإنذارات.\n(صلواتك الفائتة لن تكسر الستريك عند تسجيلها بعد الاستيقاظ) 🛡️");
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
    missedText = "⚠️ إنت عليك قضاء (" + missed.join(" و ") + "). ";
  }

  var prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

  for (var i = 0; i < prayers.length; i++) {
    var pName = prayers[i];
    var pAbs = getAbsoluteMins(parseTimeStr(prayerTimes[pName]), fajrMins);
    var diff = currentAbs - pAbs;

    if (!isEmergency && missed.length > 0) {
      if (diff >= -30 && diff <= -25) {
        checkAndSendReminder('EMERGENCY_30', pName, islamicDateStr, chatId, "إنذار أحمر 🚨: " + missedText + "وأذان " + pName + " فاضل عليه نص ساعة. اتحرك فوراً!");
      } else if (diff >= -15 && diff <= -10) {
        checkAndSendReminder('EMERGENCY_15', pName, islamicDateStr, chatId, "الفرصة الأخيرة ⚠️: ربع ساعة والمهمات القديمة هتضيع وتخسر نقط. قوم دلوقتي! " + missedText);
      } else if (diff >= -5 && diff <= 0) {
        checkAndSendReminder('EMERGENCY_5', pName, islamicDateStr, chatId, "5 دقايق! مفيش وقت للأعذار. أثبت إنك وحش وخلص اللي عليك ⚔️");
      }
    }

    var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");

    if (hMonth === 9) {
      if (pName === "الفجر" && diff >= -45 && diff <= -40) {
        checkAndSendReminder('SUHOOR_REMINDER', pName, islamicDateStr, chatId, "🌙 سحور يا صايم! 45 دقيقة على الفجر. تسحروا فإن في السحور بركة.");
      }
      if (pName === "المغرب" && diff >= -10 && diff <= -5) {
        checkAndSendReminder('IFTAR_10', pName, islamicDateStr, chatId, "🌙 اقترب الإفطار! 10 دقائق على أذان المغرب. جهز فطارك ودعواتك مستجابة إن شاء الله.");
      }
    }

    if (diff >= -20 && diff <= -15) {
      var msg = "استعد للمواجهة يا وحش! " + pName + " كمان شوية. توضأ وجهز نفسك 🦅";
      if (missed.length > 0) msg += "\n\n" + missedText;
      checkAndSendReminder('NORMAL_20', pName, islamicDateStr, chatId, msg);
    }

    if (diff >= 0 && diff <= 4) {
      var msgAthan = "الله أكبر! 🕌 أذان " + pName + " شغال دلوقتي. سيب اللي في إيدك وردد الأذان وقوم صلي!";
      if (hMonth === 9 && pName === "المغرب") msgAthan = "الله أكبر! 🕌 أذان المغرب. إفطاراً شهياً وصوماً مقبولاً يا بطل! متنساش تسجل الصلاة.";
      checkAndSendReminder('ATHAN_0', pName, islamicDateStr, chatId, msgAthan);
    }

    var hasPrayedCurr = (props.getProperty('PRAYED_' + pName) === islamicDateStr);

    if (pName === "الفجر" && !hasPrayedCurr) {
      var username = props.getProperty('USERNAME');
      if (username) {
        if (diff >= 0 && diff <= 4) {
          var callKey1 = 'FAJR_CALL_1_' + islamicDateStr;
          if (!props.getProperty(callKey1)) {
            try { UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("استيقظ يا بطل. حان وقت صلاة الفجر.")); } catch(e) {}
            props.setProperty(callKey1, "true");
          }
        } else if (diff >= 5 && diff <= 9) {
          var callKey2 = 'FAJR_CALL_2_' + islamicDateStr;
          if (!props.getProperty(callKey2)) {
            try { UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("الإنذار الثاني للفجر. لا تخذل نفسك يا وحش.")); } catch(e) {}
            props.setProperty(callKey2, "true");
          }
        } else if (diff >= 10 && diff <= 14) {
          var callKey3 = 'FAJR_CALL_3_' + islamicDateStr;
          if (!props.getProperty(callKey3)) {
            try { UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("الإنذار الأخير. استيقظ الآن ولا تضيع النقاط.")); } catch(e) {}
            props.setProperty(callKey3, "true");
          }
        }
      }
    }

    if (diff >= 10 && diff <= 15) {
      if (!hasPrayedCurr && !isEmergency) {
        checkAndSendReminder('POST_10', pName, islamicDateStr, chatId, "فات 10 دقايق على أذان " + pName + " وإنت لسه مسجلتش! النقط بتقل وكل دقيقة بتأخيرها بتخسرك أكتر. قوم صلي فوراً ⚠️");
      }
    }

    var nextAbs;
    if (pName === "الفجر") {
       nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["الشروق"]), fajrMins);
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
          if (checkAndSendReminder('PUNISH_QADAA', pName, islamicDateStr, chatId, "تفتيش القيادة: وقت " + pName + " خلص بالكامل وإنت لسه متسجلتش! الصلاة بقت قضاء وتم خصم 20 نقطة من رصيدك كعقاب 💔")) {
            var updatedP = addPoints(-20, "خصم صلاة قضاء: " + pName);
            sendMessage(chatId, "الرصيد الحالي بعد الخصم: " + updatedP + " نقطة 💔");
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

      // ============ حساب مكوّن الصلوات ============
      var prayerComponent = 0;
      var prayerReport = "";
      var allPrayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

      for (var pi = 0; pi < allPrayers.length; pi++) {
        var pn = allPrayers[pi];
        var pnAbs = getAbsoluteMins(parseTimeStr(prayerTimes[pn]), fajrMins);

        if (currentAbs >= pnAbs) {
          var hasPrayed = (props.getProperty('PRAYED_' + pn) === islamicDateStr);
          if (hasPrayed) {
            prayerComponent += 3;
          } else {
            prayerComponent -= 8;
            prayerReport += "⚠️ " + pn + " لسه مسجلتش! ";
          }
        }
      }

      var finalMsg = "";
      var pointsChange = 0;

      var recoveryPeriod = parseInt(props.getProperty('RECOVERY_PERIOD') || "7");

      // ============ وضع الاستعادة ============
      if (days < recoveryPeriod) {
        var rawPenalty = Math.round(25 * (1 - days / recoveryPeriod));
        var prayerPenalty = Math.max(0, -prayerComponent);
        var totalPenalty = rawPenalty + prayerPenalty;

        var shields = parseInt(props.getProperty('SHIELDS') || "0");
        var shieldActive = props.getProperty('SHIELD_ACTIVE') === "true";

        if (shieldActive && days < 3) {
          pointsChange = 0;
          finalMsg = "🛡️ الدرع حمتك اليوم! الأيام الثلاثة الأولى مش هيتخصم منك.";
          if (days === 2) {
            props.setProperty('SHIELD_ACTIVE', "false");
            finalMsg += "\n⚠️ الدرع خلصت. من بكرة العقوبة تبدأ بشكل طبيعي ومخففة.";
          }
        } else {
          pointsChange = -totalPenalty;
          finalMsg = "تفتيش القيادة 🚨\n\n" +
            "📍 يوم الاستعادة: " + days + " من " + recoveryPeriod + "\n" +
            "🔻 خصم صمود: " + rawPenalty + " نقطة\n";
          if (prayerPenalty > 0) {
            finalMsg += "🔻 خصم صلوات: " + prayerPenalty + " نقطة\n";
            finalMsg += prayerReport + "\n";
          }

          var remainingDays = recoveryPeriod - days;
          var nextPenalty = Math.round(25 * (1 - (days + 1) / recoveryPeriod));
          finalMsg += "\n💡 العقوبة بكرة: " + nextPenalty + " نقطة (بدل " + rawPenalty + ")\n";
          finalMsg += "🏁 بعد " + remainingDays + " " + (remainingDays === 1 ? "يوم" : "أيام") +
                      " تنتهي فترة الاستعادة!\n\n" +
                      "خصم اليوم: " + totalPenalty + " نقطة ⚔️";
        }
      }
      // ============ انتهاء فترة الاستعادة ============
      else if (days === recoveryPeriod) {
        var bonus = 50;
        pointsChange = bonus;
        finalMsg = "🔥 فترة استعادة مكتملة! 🔥\n\n" +
          "يا وحش! قاومت لمدة " + recoveryPeriod + " يوم كاملة رغم الخصومات!\n" +
          "فترة الاستعادة انتهت. من دلوقتي التفتيش هيزيد عليك مش يخصم!\n\n" +
          "مكافأة العودة للقتال: +" + bonus + " نقطة 🏆";
        addMedal("🔥 وسام العائد الأقوى", chatId);
      }
      // ============ وضع الصمود العادي ============
      else {
        var baseBonus = Math.min(100, 20 + Math.floor(days / 7) * 5);
        var hMonth = parseInt(props.getProperty('HIJRI_MONTH') || "0");
        if (hMonth === 9) baseBonus *= 2;
        var bonusWithPrayers = baseBonus + prayerComponent;
        var finalBonus = Math.max(5, Math.round(bonusWithPrayers * multiplier));
        pointsChange = finalBonus;

        finalMsg = "فحص مفاجئ من القيادة 🚨\n\n" +
          "📍 أيام الصمود: " + days + " يوم\n" +
          "💰 مكافأة الصمود: +" + baseBonus + "\n";
        if (prayerComponent > 0) {
          finalMsg += "🙏 مكافأة الصلوات: +" + prayerComponent + "\n";
        } else if (prayerComponent < 0) {
          finalMsg += "⚠️ خصم صلوات: " + prayerComponent + "\n";
          finalMsg += prayerReport + "\n";
        }
        if (multiplier > 1) {
          finalMsg += "🔥 مضاعف الصمود: ×" + multiplier + "\n";
        }
        finalMsg += "\nالمجموع: +" + finalBonus + " نقطة";
      }

      var newP = addPoints(pointsChange);
      sendMessage(chatId, finalMsg + "\n\n⚡ رصيدك الحالي: " + newP + " نقطة");

      if (days >= 7)  addMedal("نجمة الأسبوع النحاسية 🥉", chatId);
      if (days >= 30) addMedal("درع الشهر الفضي 🥈", chatId);
      if (days >= 90) addMedal("تاج الصمود الذهبي 🥇", chatId);
      if (days >= 180) addMedal("وسام النقاء المطلق 💎", chatId);
      if (days >= 365) addMedal("🌍 وسام السنة الأسطورية", chatId);

      var personalBest = parseInt(props.getProperty('PERSONAL_BEST_STREAK') || "0");
      if (days > personalBest) {
        props.setProperty('PERSONAL_BEST_STREAK', days.toString());
        if (days > 7) {
          sendMessage(chatId, "🏆 رقم شخصي جديد! كسرت أعلى رقم عندك: " + days + " يوم!\nالرقم القديم كان: " + personalBest + " يوم 🎉");
        }
      }

      // يوم خاص جداً
      if (days === 365 && !props.getProperty('S_YEAR_MSG')) {
        props.setProperty('S_YEAR_MSG', "1");
        sendMessage(chatId,
          "━━━━━━━━━━━━━━━━━\n" +
          "         🌍  ٣٦٥ يوم\n" +
          "━━━━━━━━━━━━━━━━━\n\n" +
          "قبل سنة بالظبط...\n" +
          "كان في شخص قرر.\n\n" +
          "مش فاهم كل حاجة.\n" +
          "مش ضامن إنه يكمل.\n" +
          "بس قرر.\n\n" +
          "والشخص ده أنت.\n\n" +
          "ما قولناكش إنه هيبقى سهل.\n" +
          "وما كانش سهل.\n\n" +
          "بس أنت لسه هنا. 🤍\n\n" +
          "『 وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا 』"
        );
      }

      checkHiddenAchievements(props, chatId, newP);

      // ============ التحدي الجوكر (Weekly Joker) ============
      if (currentAbs >= 540 && currentAbs <= 1260) { // بين 9 صباحاً و 9 مساءً
        if (props.getProperty('JOKER_ACTIVE') !== "true" && Math.random() < 0.05) {
          props.setProperty('JOKER_ACTIVE', "true");
          props.setProperty('JOKER_DATE', islamicDateStr);
          var challenges = [
            "قل سبحان الله وبحمده 100 مرة",
            "اقرأ آخر آيتين من سورة البقرة",
            "صلِّ على النبي ﷺ 50 مرة",
            "استغفر الله 100 مرة",
            "اقرأ آية الكرسي 7 مرات",
            "قل: لا إله إلا الله وحده لا شريك له 100 مرة",
            "اقرأ سورة الإخلاص 10 مرات",
            "اقرأ المعوذتين 7 مرات",
            "صلِّ ركعتي شكر لله دلوقتي",
            "اكتب 5 حاجات شاكر لله عليها وابعتهم هنا",
            "قل: حسبي الله لا إله إلا هو عليه توكلت 7 مرات",
            "اقرأ سورة يس كاملة",
            "قل: اللهم إني أعوذ بك من الهم والحزن 40 مرة",
            "اعمل سجدة شكر لله دلوقتي على نعمة الصمود",
            "تصدق بأي مبلغ في الساعة الجاية عشان تثبت الجوكر",
            "اقرأ أول عشر آيات من سورة الكهف بتدبر",
            "اكتب لنفسك سبباً واحداً يخليك ثابت النهارده",
            "صلِّ ركعتين سنة أو نفل قبل ما تكمل يومك",
            "ابعت رسالة طيبة لحد من أهلك دلوقتي"
          ];
          var randomChallenge = pickFreshContent(props, "JOKER", challenges);
          props.setProperty('JOKER_TASK', randomChallenge);

          var jokerKeys = [
            [{"text": "أنجزت التحدي ✅"}],
            [{"text": "تجاهل ❌"}]
          ];
          sendMenuCustom(chatId, "🃏 **تحدي الجوكر ظهر فجأة!**\n\nالمهمة: *" + randomChallenge + "*\n\nأنجز المهمة دي دلوقتي وبعدين اضغط ✅ عشان تاخد 150 نقطة ووسام.", jokerKeys);
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

  var report = "━━━━━━━━━━━━━━━━\n";
  report += "📊 *التقرير الشهري — " + monthName + "*\n";
  report += "━━━━━━━━━━━━━━━━\n\n";
  report += "🎖️ الرتبة: " + rank + "\n";
  report += "💎 النقاط: " + p + "\n";
  report += "🔥 أيام الصمود: " + days + " يوم\n";
  report += "👑 أعلى صمود (PB): " + pb + " يوم\n";
  report += "🕌 ستريك الصلوات: " + prayerStreak + " يوم\n";
  report += "🌅 فجر في وقته: " + fajrCount + " مرة\n";
  report += "🛡️ الدروع: " + shields + "/3\n";
  report += "🏆 انتصارات: " + totalVic + "\n";
  report += "📿 جلسات ذكر: " + totalDhikr + "\n";
  if (fCount > 0) report += "🌙 صيام نافلة: " + fCount + " أيام\n";
  report += "🎖️ أوسمة مكتسبة: " + medalsArr.length + "/" + Object.keys(MEDALS_DB).length + "\n";
  report += "📉 السقطات الكلية: " + shameArr.length + "\n";
  report += "\n━━━━━━━━━━━━━━━━\n";

  if (days >= 30) {
    report += "🦅 *أنت تتحرك بثبات. كمل.*";
  } else if (days >= 7) {
    report += "⚔️ *أسبوع+ من الصمود. القيادة فخورة.*";
  } else {
    report += "💪 *شهر جديد. ابدأ قوي.*";
  }

  sendMessage(chatId, report);
}
