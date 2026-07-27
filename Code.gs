var BOT_TOKEN = "8607942971:AAGo-CUW-WkD4vTnczifsp9lsHGUM4byOu4";
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
  {name: "مشير 🦅⚔️🌿", min: 10000}
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

function getPoints() {
  var p = PropertiesService.getScriptProperties().getProperty('POINTS');
  return p ? parseInt(p) : 0;
}

function addPoints(pts) {
  var current = getPoints();
  current += pts;
  if (current < 0) current = 0;
  PropertiesService.getScriptProperties().setProperty('POINTS', current.toString());
  return current;
}

function getMedals() {
  return PropertiesService.getScriptProperties().getProperty('MY_MEDALS') || "لا يوجد أوسمة حتى الآن.";
}

function addMedal(medal, chatId) {
  var currentMedals = getMedals();
  if (currentMedals.indexOf(medal) === -1) {
    if (currentMedals === "لا يوجد أوسمة حتى الآن.") currentMedals = "";
    PropertiesService.getScriptProperties().setProperty('MY_MEDALS', currentMedals + medal + " | ");
    sendMessage(chatId, "🎉 تم تقليدك وسام جديد: *" + medal + "*\nالوسام اتضاف لملفك العسكري.");
  }
}

// ---------------------------
// Webhook & Setup
// ---------------------------
function setWebhook() {
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/setWebhook?url=" + SCRIPT_URL;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doPost(e) {
  if (typeof e !== 'undefined') {
    var update = JSON.parse(e.postData.contents);
    if (update.message) {
      handleMessage(update.message);
    }
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
       // العشاء becomes qadaa next Fajr
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

function getPrayerPoints(actualPrayer, currentAbs, prayerTimes, isExcused, missedArr, fajrMins) {
  if (isExcused) return 15;
  
  var isMissed = (missedArr.indexOf(actualPrayer) !== -1);
  if (isMissed) return 5;
  
  var prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  var index = prayers.indexOf(actualPrayer);
  var nextAbs;
  
  if (actualPrayer === "الفجر") {
    nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes["الشروق"]), fajrMins);
  } else if (index >= 1 && index < 4) {
    var nextPName = prayers[index + 1];
    nextAbs = getAbsoluteMins(parseTimeStr(prayerTimes[nextPName]), fajrMins);
  }
  
  if (nextAbs) {
    var diff = nextAbs - currentAbs;
    if (diff > 30) return 15;
    if (diff > 15) return 10;
    if (diff > 5) return 5;
    return 2;
  } else {
    return 15; 
  }
}

function updatePrayerStreak(islamicDateStr, props, chatId) {
  var prayersList = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  var allPrayed = true;
  for (var i = 0; i < prayersList.length; i++) {
    if (props.getProperty('PRAYED_' + prayersList[i]) !== islamicDateStr) {
      allPrayed = false;
      break;
    }
  }
  
  if (allPrayed) {
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
      
      sendMessage(chatId, "🌟 **إنجاز عظيم!** لقد أكملت جميع الصلوات الخمس لليوم. ستريك الصلوات الحالي: *" + streak + "* يوم متتالي 🦅");
    }
  }
}

// ---------------------------
// Main Logic
// ---------------------------
function handleMessage(message) {
  var text = message.text;
  var chatId = message.chat.id;
  var props = PropertiesService.getScriptProperties();
  
  if (!text) {
    sendMenu(chatId, "القيادة بتستقبل النصوص فقط 🎖️", getKeyboard(getPoints()));
    return;
  }
  
  props.setProperty('CHAT_ID', chatId.toString());
  if (message.from && message.from.username) {
    props.setProperty('USERNAME', "@" + message.from.username);
  }
  
  var p = getPoints();
  var islamicDateStr = getIslamicDateStr();
  var isEmergency = (props.getProperty('EMERGENCY_MODE') === "true");
  
  if (text === "/start") {
    sendMenu(chatId, "أهلاً بك في Camp Zero. تم تفعيل نظام التجنيد والمهام السرية. ⚔️", getKeyboard(p));
    return;
  }
  
  if (text === "/help") {
    var helpMsg = "🛠️ **قائمة مساعدة Camp Zero:**\n\n";
    helpMsg += "🔹 **ملف الوحش 🦍:** بيعرض رتبتك، نقطك، أيام الصمود، وستريك الصلوات.\n";
    helpMsg += "🔹 **العودة للقتال ⚔️:** لو حصل انتكاسة (لا قدر الله)، بتدوس هنا وتحدد الوقت عشان تصفر العداد.\n";
    helpMsg += "🔹 **إذن طوارئ 🛡️:** لو مسافر أو تعبان، فعّله عشان البوت ميخصمش نقط وميزعجكش (الصلاة هتتحسب بـ 15 نقطة دايماً). لا تنسَ فكه!\n";
    helpMsg += "🔹 **سجل السقوط 📉:** بيحتفظ بتواريخ انتكاساتك عشان تتعلم منها.\n";
    helpMsg += "🔹 **خزينة الانتصارات 🏆:** سجل فيها أي موقف قاومت فيه الشيطان. كل انتصار بـ 10 نقط (بحد أقصى 3 يومياً).\n";
    helpMsg += "🔹 **عملية الأسبوع 📅:** عملية إضافية بتتغير كل أسبوع، لو أنجزتها هتاخد 200 نقطة ووسام.\n";
    helpMsg += "🔹 **مهمة خاصة 🎯:** مهمة دينية سريعة (بتتفتح بعد 500 نقطة) بتديك 50 نقطة.\n";
    helpMsg += "🔹 **صندوق الدعم 📦:** بـ 100 نقطة بيطلعلك نصيحة أو دعاء أو وسام نادر (بيتفتح بعد 1000 نقطة).\n\n";
    helpMsg += "💡 **ملاحظة:** زراير الصلوات بتظهر بس وقت الأذان، وبتختفي أول ما تسجل إنك صليت.";
    sendMenu(chatId, helpMsg, getKeyboard(p));
    return;
  }
  
  if (text === "/fix") {
    var prayersToClear = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
    for (var i = 0; i < prayersToClear.length; i++) {
      props.deleteProperty('PRAYED_' + prayersToClear[i]);
    }
    sendMessage(chatId, "تم مسح السجل المعلق للصلوات بنجاح 🧹. الكيبورد هيرجع يظهرلك كل الصلوات اللي وقتها دخل.");
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
    sendMessage(chatId, "تعويض من القيادة عن الخطأ التقني 🎖️: تم إرجاع الـ 20 نقطة اللي اتخصموا منك ظلماً. رصيدك الحالي: " + newP);
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(newP));
    return;
  }
  
  if (text.indexOf("/call") === 0) {
    var parts = text.split(" ");
    if (parts.length < 2) {
      sendMessage(chatId, "اكتب الأمر كدة: \n/call @YourUsername");
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
    var vault = props.getProperty('VICTORY_VAULT');
    if (!vault) vault = "[]";
    var vaultArr = JSON.parse(vault);
    var dateStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd");
    vaultArr.push("[" + dateStr + "] " + text);
    if (vaultArr.length > 50) vaultArr.shift(); 
    props.setProperty('VICTORY_VAULT', JSON.stringify(vaultArr));
    props.setProperty('AWAITING_VICTORY', "false");
    
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
      logToSheet("صلاة", actualPrayer);
      props.setProperty('PRAYED_' + actualPrayer, islamicDateStr);
      
      var now = new Date();
      var currentTimeStr = Utilities.formatDate(now, "GMT+3", "HH:mm");
      var currentMinsRaw = parseTimeStr(currentTimeStr);
      var prayerTimes = getPrayerTimes();
      var fajrMins = getFajrMins();
      var currentAbs = getAbsoluteMins(currentMinsRaw, fajrMins);
      
      var missedArr = getMissedPrayers(currentAbs, prayerTimes, props, islamicDateStr, fajrMins);
      var earnedPoints = getPrayerPoints(actualPrayer, currentAbs, prayerTimes, isEmergency, missedArr, fajrMins);
      var newP = addPoints(earnedPoints);
      
      var extraMsg = "";
      if (isEmergency) {
        extraMsg = " (النقاط كاملة لوجود عذر 🛡️)";
        // Bug 8: الطوارئ لا تُفك تلقائياً بعد صلاة واحدة
      } else if (earnedPoints === 15) {
        extraMsg = " (عاش أبطال التبكير 🔥)";
      } else if (earnedPoints === 10) {
        extraMsg = " (حاول تبدر المرة الجاية ⚡)";
      } else if (earnedPoints === 5) {
        extraMsg = " (لحقت نفسك بأعجوبة ⏳)";
      } else if (earnedPoints === 2) {
        extraMsg = " (التأخير ده خطر جداً ⚠️)";
      }
      
      sendMessage(chatId, "تم إنجاز صلاة " + text + " بنجاح 🦅! تم إضافة " + earnedPoints + " نقطة " + extraMsg + "\nرصيدك الحالي: " + newP);
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
        "سبح الله 100 مرة (سبحان الله وبحمده)."
      ];
      var m = missions[Math.floor(Math.random()*missions.length)];
      props.setProperty('PENDING_MISSION_' + islamicDateStr, "true");
      
      var tempKeyboard = getKeyboard(p);
      tempKeyboard.unshift([{"text": "تم إنجاز المهمة ✅"}]);
      sendMenuCustom(chatId, "مهمتك الخاصة: " + m + "\n\nلو خلصتها دوس على (تم إنجاز المهمة ✅).", tempKeyboard);
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
      "مقولة سرية: 'الشهوة لحظة، والندم سنين. والانتصار لحظة، والفخر سنين.'",
      "دعاء مستجاب: 'اللهم يا مقلب القلوب ثبت قلبي على دينك'. رددها دايما.",
      "مقولة سرية: 'الشيطان بيزينلك المعصية قبلها، وبيسيبك تندم لوحدك بعدها. خليك أذكى منه.'",
      "وسام جديد: 🛡️ الدرع الفولاذي",
      "وسام جديد: ⚔️ سيف الحق",
      "مقولة سرية: 'كل تعب في مقاومة الهوى، بيتبني بيه قصر في الجنة.'"
    ];
    var r = rewards[Math.floor(Math.random()*rewards.length)];
    if (r.indexOf("وسام جديد") !== -1) {
      var medal = r.split(": ")[1];
      addMedal(medal, chatId);
    }
    sendMessage(chatId, "🎁 فتحت الصندوق وطلعلك:\n\n*" + r + "*");
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
    if (!vault || vault === "[]") {
      sendMessage(chatId, "الخزينة لسه فاضية! سجل انتصاراتك الأول عشان تلاقيها وقت الزنقة.");
    } else {
      var vaultArr = JSON.parse(vault);
      var randomVic = vaultArr[Math.floor(Math.random() * vaultArr.length)];
      sendMessage(chatId, "🔥 رسالة من الماضي:\n\n*" + randomVic + "*\n\nفاكر لما قاومت وكنت قوي؟ إنت تقدر تعملها تاني دلوقتي! 🦅");
    }
  }
  else if (text === "عملية الأسبوع 📅") {
    if (p < 1001) return;
    
    var currentWeek = Utilities.formatDate(new Date(), "GMT+3", "w"); 
    var savedWeek = props.getProperty('WEEKLY_OP_NUM');
    var opStatus = props.getProperty('WEEKLY_OP_STATUS');
    var currentOp = props.getProperty('WEEKLY_OP_TEXT');
    
    var ops = [
      "صيام يومين هذا الأسبوع (الاثنين والخميس أو أي يومين).",
      "قراءة سورة البقرة كاملة في ركعتين قيام ليل هذا الأسبوع.",
      "حفظ 5 آيات جديدة ومراجعتها يومياً.",
      "الاستيقاظ قبل الفجر بنصف ساعة يومياً هذا الأسبوع.",
      "الصدقة ولو بمبلغ بسيط مرتين هذا الأسبوع."
    ];
    
    if (savedWeek !== currentWeek) {
      currentOp = ops[Math.floor(Math.random() * ops.length)];
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
  else if (text === "تم إنجاز العملية الأسبوعية ✅") {
    var opStatus = props.getProperty('WEEKLY_OP_STATUS');
    if (opStatus === "DONE") {
      sendMessage(chatId, "أنت أنجزت العملية من قبل يا بطل! 🦅");
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(p));
    } else if (opStatus === "PENDING") {
      props.setProperty('WEEKLY_OP_STATUS', "DONE");
      var newP = addPoints(200);
      addMedal("🎖️ وسام العملية الأسبوعية", chatId);
      sendMessage(chatId, "عاش يا أسطورة! 200 نقطة ووسام العملية الأسبوعية تم منحهم لك. رصيدك: " + newP);
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(newP));
    } else {
      sendMenu(chatId, "مفيش عملية نشطة دلوقتي.", getKeyboard(p));
    }
  }
  else if (text === "ملف الوحش 🦍") {
    var details = getStreakDetails();
    var days = getStreakDays();
    var msgText = getStreakMessage(days);
    var rank = getRank(p);
    var medals = getMedals();
    var prayerStreak = props.getProperty('PRAYER_STREAK') || "0";
    
    var profile = "📋 **الملف العسكري (Camp Zero):**\n";
    profile += "الرتبة: " + rank + "\n";
    profile += "النقاط: " + p + " نقطة\n";
    profile += "أيام الصمود: " + days + " يوم\n";
    profile += "ستريك الصلوات الخمس: " + prayerStreak + " يوم متتالي 🕌\n\n";
    profile += "**تفاصيل مدة الصمود:**\n" + details + "\n\n";
    profile += "الأوسمة: " + medals + "\n\n";
    profile += "💬 رسالة القيادة:\n" + msgText;
    
    sendMenu(chatId, profile, getKeyboard(p));
  } 
  else if (text === "سجل السقوط 📉") {
    var shame = props.getProperty('WALL_OF_SHAME');
    if (!shame || shame === "[]") {
      sendMenu(chatId, "سجلك نظيف يا وحش! مفيش أي انتكاسات متسجلة. عاش! 🦅", getKeyboard(p));
    } else {
      var shameArr = JSON.parse(shame);
      var mText = "📉 **سجل السقوط (The Wall of Shame):**\n\n";
      for (var i = 0; i < shameArr.length; i++) {
        mText += (i+1) + ". 📅 " + shameArr[i] + "\n";
      }
      mText += "\nبص للتواريخ دي كويس وافتكر شعورك وقتها عشان متكررهاش تاني. إنت أقوى من كدة ⚔️";
      sendMenu(chatId, mText, getKeyboard(p));
    }
  }
  else if (text === "العودة للقتال ⚔️") {
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
    
    var shame = props.getProperty('WALL_OF_SHAME');
    if (!shame) shame = "[]";
    var shameArr = JSON.parse(shame);
    shameArr.push(relapseDateStr);
    if (shameArr.length > 50) shameArr.shift(); 
    props.setProperty('WALL_OF_SHAME', JSON.stringify(shameArr));
    
    props.setProperty('LAST_RESET_DATE', relapseTime.toString());
    props.setProperty('POINTS', "0");
    
    sendMessage(chatId, "المحارب الحقيقي بيقع ويقوم أقوى. تم تصفير العداد وتحديث وقت الانتكاسة في سجل السقوط. ارفع سيفك وابدأ القتال من جديد دلوقتي 🐺");
    sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(0));
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
  keys.push(row4);
  
  var extraRow = [];
  if (points >= 501) extraRow.push({"text": "مهمة خاصة 🎯"});
  if (points >= 1001) extraRow.push({"text": "صندوق الدعم 📦"});
  if (extraRow.length > 0) keys.push(extraRow);
  
  var extraRow2 = [];
  extraRow2.push({"text": "خزينة الانتصارات 🏆"});
  if (points >= 1001) extraRow2.push({"text": "عملية الأسبوع 📅"});
  if (extraRow2.length > 0) keys.push(extraRow2);
  
  return keys;
}

function sendMenu(chatId, text, keys) {
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  var keyboard = {
    "keyboard": keys || getKeyboard(getPoints()),
    "resize_keyboard": true,
    "persistent": true
  };
  var payload = { "chat_id": chatId, "text": text, "parse_mode": "Markdown", "reply_markup": JSON.stringify(keyboard) };
  var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) };
  UrlFetchApp.fetch(url, options);
}

function sendMenuCustom(chatId, text, keys) {
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  var keyboard = {
    "keyboard": keys,
    "resize_keyboard": true,
    "persistent": true
  };
  var payload = { "chat_id": chatId, "text": text, "parse_mode": "Markdown", "reply_markup": JSON.stringify(keyboard) };
  var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) };
  UrlFetchApp.fetch(url, options);
}

function sendMessage(chatId, text) {
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  var payload = { "chat_id": chatId, "text": text, "parse_mode": "Markdown" };
  var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) };
  UrlFetchApp.fetch(url, options);
}

// ---------------------------
// Utilities
// ---------------------------
function logToSheet(type, value) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
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

function resetStreak() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('LAST_RESET_DATE', new Date().getTime().toString());
}

function getStreakMessage(days) {
  if (days === 0) return "ضربة البداية يا بطل! متتراجعش ⚔️";
  if (days === 1) return "أول 24 ساعة عدت بنجاح! كمل طحن 🦍";
  if (days === 2) return "يومين من السيطرة! استمر 🛡️";
  if (days === 3) return "تلات أيام من القوة! دوس كمان 🔥";
  if (days === 7) return "أسبوع كامل! 7 أيام من السيطرة على نفسك 🏆";
  if (days === 10) return "10 أيام من النقاء والتركيز. عاش يا بطل 🦅";
  if (days === 14) return "أسبوعين من الصمود! مفيش رجوع لورا ⏳";
  if (days === 21) return "21 يوم! إنت بتبني نفسك من جديد 🧠";
  if (days === 30) return "شهر كامل يا أسطورة! إياك تضعف 👑";
  if (days === 60) return "شهرين! إنت دلوقتي في مستوى احترافي 💎";
  if (days === 90) return "90 يوم! الدماغ اتعاد برمجته بالكامل 🚀";
  if (days === 100) return "مية يوم! رقم أسطوري ميجيبوش غير محارب حقيقي 💯";
  if (days === 180) return "نصف سنة! 180 يوم. قوة شخصيتك الجديدة رهيبة 🌟";
  if (days === 365) return "سنة كاملة! 365 يوم. أسطورة حقيقية 🌍";
  if (days === 1000) return "1000 يوم! المرجع والقوة ذاتها 🌌";
  
  if (days > 365) return "استمر في العظمة 👑";
  if (days > 90) return "معدي الـ 90 يوم وبترفع سقف التحدي 🚀";
  if (days > 30) return "كل يوم زيادة هو رصاصة في قلب العادات القديمة 🛡️";
  if (days > 7) return "الطريق بقى أوضح وإرادتك بقت أقوى 🦅";
  
  return "البدايات دايماً بتحتاج قوة، وإنت بتثبت إنك قدها ⚔️";
}

// ---------------------------
// Automations & Triggers
// ---------------------------
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
    sendMessage(chatId, msg);
    props.setProperty(key, "true");
  }
}

function checkAndRemind() {
  var props = PropertiesService.getScriptProperties();
  var chatId = props.getProperty('CHAT_ID');
  if (!chatId) return; 
  
  var now = new Date();
  var currentTimeStr = Utilities.formatDate(now, "GMT+3", "HH:mm");
  var currentMinsRaw = parseTimeStr(currentTimeStr);
  
  var prayerTimes = getPrayerTimes();
  var fajrMins = getFajrMins();
  var currentAbs = getAbsoluteMins(currentMinsRaw, fajrMins);
  
  var islamicDateStr = getIslamicDateStr();
  var isEmergency = (props.getProperty('EMERGENCY_MODE') === "true");
  var missed = getMissedPrayers(currentAbs, prayerTimes, props, islamicDateStr, fajrMins);
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
    
    if (diff >= -20 && diff <= -15) {
      var msg = "استعد للمواجهة يا وحش! " + pName + " كمان شوية. توضأ وجهز نفسك 🦅";
      if (missed.length > 0) msg += "\n\n" + missedText;
      checkAndSendReminder('NORMAL_20', pName, islamicDateStr, chatId, msg);
    }
    
    if (diff >= 0 && diff <= 4) {
      var msgAthan = "الله أكبر! 🕌 أذان " + pName + " شغال دلوقتي. سيب اللي في إيدك وردد الأذان وقوم صلي!";
      checkAndSendReminder('ATHAN_0', pName, islamicDateStr, chatId, msgAthan);
    }
    
    var hasPrayedCurr = (props.getProperty('PRAYED_' + pName) === islamicDateStr);
    
    if (pName === "الفجر" && !hasPrayedCurr) {
      var username = props.getProperty('USERNAME');
      if (username) {
        if (diff >= 0 && diff <= 4) {
          var callKey1 = 'FAJR_CALL_1_' + islamicDateStr;
          if (!props.getProperty(callKey1)) {
            UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("استيقظ يا بطل. حان وقت صلاة الفجر."));
            props.setProperty(callKey1, "true");
          }
        } else if (diff >= 5 && diff <= 9) {
          var callKey2 = 'FAJR_CALL_2_' + islamicDateStr;
          if (!props.getProperty(callKey2)) {
            UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("الإنذار الثاني للفجر. لا تخذل نفسك يا وحش."));
            props.setProperty(callKey2, "true");
          }
        } else if (diff >= 10 && diff <= 14) {
          var callKey3 = 'FAJR_CALL_3_' + islamicDateStr;
          if (!props.getProperty(callKey3)) {
            UrlFetchApp.fetch("https://api.callmebot.com/start.php?user=" + username + "&text=" + encodeURIComponent("الإنذار الأخير. استيقظ الآن ولا تضيع النقاط."));
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
          checkAndSendReminder('PUNISH_QADAA', pName, islamicDateStr, chatId, "تفتيش القيادة: وقت " + pName + " خلص بالكامل وإنت لسه متسجلتش! الصلاة بقت قضاء وتم خصم 20 نقطة من رصيدك كعقاب 💔");
          addPoints(-20);
          var updatedP = getPoints();
          sendMessage(chatId, "الرصيد الحالي بعد الخصم: " + updatedP + " نقطة 💔");
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
  
  if (currentAbs >= randomTarget) {
    var dailyKey = 'DAILY_CHECKIN_' + islamicDateStr;
    if (!props.getProperty(dailyKey)) {
      var days = getStreakDays();
      var newP = addPoints(50);
      sendMessage(chatId, "فحص مفاجئ من القيادة 🚨: تقرير الأداء بيقول إنك صامد بقالك " + days + " يوم. تم إضافة 50 نقطة مكافأة الصمود! رصيدك: " + newP);
      props.setProperty(dailyKey, "true");
      
      if (days >= 7) addMedal("نجمة الأسبوع النحاسية 🥉", chatId);
      if (days >= 30) addMedal("درع الشهر الفضي 🥈", chatId);
      if (days >= 90) addMedal("تاج الصمود الذهبي 🥇", chatId);
    }
  }
}
