var BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
var SCRIPT_URL = "YOUR_WEB_APP_URL_HERE";
var SHEET_ID = "YOUR_SHEET_ID_HERE";

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
function setupBot() {
  // 1. Set Webhook
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/setWebhook?url=" + SCRIPT_URL;
  var response = UrlFetchApp.fetch(url);
  Logger.log("Webhook Response: " + response.getContentText());
  
  // 2. Clear old triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // 3. Create new trigger for checkAndRemind every 5 minutes
  ScriptApp.newTrigger("checkAndRemind")
           .timeBased()
           .everyMinutes(5)
           .create();
           
  Logger.log("✅ تم إعداد البوت بنجاح: تم ربط الـ Webhook وإنشاء الـ Triggers.");
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
  if (isMissed) return 2;
  
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
    if (pts < 7) { // Qadaa or very late (2 or 5 points) breaks the Perfect Day
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
      checkHiddenAchievements(props, chatId, p);
  }
}

function checkHiddenAchievements(props, chatId, p) {
  // الضربة الخماسية: لو الستريك = 5 أيام متتالية
  var streak = parseInt(props.getProperty('PRAYER_STREAK') || "0");
  if (streak === 5) {
    addMedal("🖐️ الضربة الخماسية", chatId);
  }
  // المليونير: أول ما النقاط تتخطى 5000
  if (p >= 5000) {
    var hasMedal = props.getProperty('MEDAL_MILLIONAIRE');
    if (!hasMedal) {
      addMedal("💰 مليونير الحسنات", chatId);
      props.setProperty('MEDAL_MILLIONAIRE', "true");
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
    sendMenu(chatId, "القيادة بتستقبل النصوص والأوامر فقط 🎖️", getKeyboard(getPoints()));
    return;
  }
  
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
  
  var p = getPoints();
  var islamicDateStr = getIslamicDateStr();
  var isEmergency = (props.getProperty('EMERGENCY_MODE') === "true");
  
  if (text === "/start") {
    sendMenu(chatId, "أهلاً بك في Camp Zero. تم تفعيل نظام المحاسبة العسكرية الصارم. ⚔️", getKeyboard(p));
    return;
  }
  
  if (text === "/help") {
    var helpText = "⚔️ *أوامر Camp Zero السرية:*\n\n" +
      "/start — تفعيل البوت وعرض القائمة\n" +
      "/fix — مسح cache الصلوات في حالة أي بق\n" +
      "/apology — تعويض تقني (مرة واحدة فقط)\n" +
      "/call @username — بعت اتصال صوتي عبر CallMeBot\n" +
      "/mystats — إحصائيات تفصيلية\n" +
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
    
    var vCount = 0;
    var vault = props.getProperty('VICTORY_VAULT');
    if (vault) vCount = JSON.parse(vault).length;
    
    var fCount = 0;
    var shame = props.getProperty('WALL_OF_SHAME');
    if (shame) fCount = JSON.parse(shame).length;
    
    var maxStreak = props.getProperty('MAX_PRAYER_STREAK') || "0";
    var pb = props.getProperty('PERSONAL_BEST_STREAK') || "0";
    var shields = props.getProperty('SHIELDS') || "0";
    var fajrCount = props.getProperty('FAJR_ONTIME_COUNT') || "0";
    
    var stats = "📊 **التقرير الإحصائي (My Stats):**\n\n";
    stats += "✅ صلوات في وقتها (هذا الأسبوع): " + onTime + "\n";
    stats += "❌ صلوات قضاء (هذا الأسبوع): " + qadaa + "\n";
    stats += "📈 نسبة الالتزام الأسبوعي: " + percentage + "%\n\n";
    stats += "🏆 إجمالي الانتصارات المسجلة: " + vCount + "\n";
    stats += "📉 إجمالي السقطات في سجل الخزي: " + fCount + "\n";
    stats += "🔥 أطول ستريك صلوات متتالية: " + maxStreak + " يوم\n";
    stats += "👑 أعلى صمود (PB): " + pb + " يوم\n";
    stats += "🛡️ الدروع المتاحة: " + shields + "/3\n";
    stats += "🌅 مرات الفجر في وقته: " + fajrCount + " مرة\n";
    stats += "💎 إجمالي النقاط الحالي: " + p + " نقطة\n";
    
    sendMenu(chatId, stats, getKeyboard(p));
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
    sendMessage(chatId, "تعويض من القيادة عن الخطأ التقني 🎖️: تم إرجاع الـ 20 نقطة. رصيدك الحالي: " + newP);
    sendMenu(chatId, "القائمة الرئيسية 👇", getKeyboard(newP));
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
    var vault = props.getProperty('VICTORY_VAULT');
    if (!vault) vault = "[]";
    var vaultArr = JSON.parse(vault);
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
      
      // Save prayer points for Perfect Day calculation
      props.setProperty('PRAYER_PTS_' + actualPrayer + '_' + islamicDateStr, earnedPoints.toString());
      
      // Update stats
      var isMissed = (missedArr.indexOf(actualPrayer) !== -1);
      if (isMissed && !isEmergency) {
        var qCount = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
        props.setProperty('WEEKLY_QADAA_COUNT', (qCount + 1).toString());
      } else {
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
      }
      
      var extraMsg = "";
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
      
      if (multiplier > 1.0) {
        extraMsg += " (" + getMultiplierLabel() + ")";
      }
      if (isFridayBonus) {
        extraMsg += " (✨ بونص الجمعة ×2)";
      }
      
      sendMessage(chatId, "تم إنجاز صلاة " + text + " بنجاح 🦅! تم إضافة " + finalPoints + " نقطة " + extraMsg + "\nرصيدك الحالي: " + newP);
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
  else if (text === "قبول تحدي الجوكر 🃏") {
    if (props.getProperty('JOKER_ACTIVE') === "true") {
      props.setProperty('JOKER_ACTIVE', "false");
      var newP = addPoints(150);
      addMedal("🃏 وسام الجوكر الخفي", chatId);
      sendMessage(chatId, "🔥 **أنت حقاً وحش!** تم قبول التحدي بنجاح.\nحصلت على 150 نقطة ووسام الجوكر الخفي! 🃏\nرصيدك الحالي: " + newP);
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(newP));
    } else {
      sendMenu(chatId, "عفواً، التحدي غير متاح الآن.", getKeyboard(p));
    }
  }
  else if (text === "تجاهل ❌") {
    if (props.getProperty('JOKER_ACTIVE') === "true") {
      props.setProperty('JOKER_ACTIVE', "false");
      sendMessage(chatId, "تم رفض التحدي. الفرص الكبيرة لا تأتي دائماً يا بطل.");
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(p));
    } else {
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(p));
    }
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
    var pbText = "";
    if (personalBest > 0) {
      var pct = Math.floor((days / personalBest) * 100);
      if (pct > 100) pct = 100;
      pbText = "أعلى صمود (PB): " + personalBest + " يوم (" + pct + "% من هدفك الشخصي)\n";
    }
    
    var profile = "📋 **الملف العسكري (Camp Zero):**\n";
    profile += "الرتبة: " + rank + "\n";
    profile += "النقاط: " + p + " نقطة\n";
    profile += "أيام الصمود: " + days + " يوم\n";
    profile += pbText;
    profile += "مضاعف الصمود: " + getMultiplierLabel() + "\n";
    profile += "ستريك الصلوات الخمس: " + prayerStreak + " يوم متتالي 🕌\n";
    profile += "📈 التقدم للرتبة التالية:\n" + getNextRankProgress(p) + "\n\n";
    profile += "**سجل صلوات اليوم:**\n" + todayPrayersList + "\n";
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
    
    var shields = parseInt(props.getProperty('SHIELDS') || "0");
    if (shields > 0) {
      props.setProperty('SHIELDS', (shields - 1).toString());
      props.setProperty('SHIELD_ACTIVE', "true");
      
      var shame = props.getProperty('WALL_OF_SHAME');
      if (!shame) shame = "[]";
      var shameArr = JSON.parse(shame);
      shameArr.push(relapseDateStr + " (محمي بالدرع 🛡️)");
      if (shameArr.length > 50) shameArr.shift(); 
      props.setProperty('WALL_OF_SHAME', JSON.stringify(shameArr));
      
      sendMessage(chatId, "🛡️ تفعيل درع الحماية! 🛡️\n\nالدرع اتكسرت وامتصت الضربة. الستريك والنقاط بتاعتك في أمان تام.\nعندك حماية إضافية من خصم التفتيش لأول 3 أيام.\nمتبقي لك دروع: " + (shields - 1));
      sendMenu(chatId, "القائمة الرئيسية:", getKeyboard(getPoints()));
    } else {
      var shame = props.getProperty('WALL_OF_SHAME');
      if (!shame) shame = "[]";
      var shameArr = JSON.parse(shame);
      shameArr.push(relapseDateStr);
      if (shameArr.length > 50) shameArr.shift(); 
      props.setProperty('WALL_OF_SHAME', JSON.stringify(shameArr));
      
      props.setProperty('LAST_RESET_DATE', relapseTime.toString());
      props.setProperty('POINTS', "0");
      props.setProperty('SHIELD_ACTIVE', "false");
      
      sendMessage(chatId, "المحارب الحقيقي بيقع ويقوم أقوى. تم تصفير العداد وتحديث وقت الانتكاسة في سجل السقوط. ارفع سيفك وابدأ القتال من جديد دلوقتي 🐺\nأنت الآن في فترة الاستعادة (7 أيام) بدون حماية.");
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

function getStreakMultiplier() {
  var days = getStreakDays();
  if (days < 7) return 2.0;     // 🔥 وضع الاستعادة (تشجيع)
  if (days >= 90) return 3.0;   // 🌌 أسطوري
  if (days >= 60) return 2.5;   // 💎 محترف
  if (days >= 30) return 2.0;   // 🏆 متقدم
  if (days >= 14) return 1.5;   // 🔥 جيد
  return 1.0;                   // عادي
}

function getMultiplierLabel() {
  var days = getStreakDays();
  var m = getStreakMultiplier();
  if (days < 7) return "🔥 وضع الاستعادة (×2)";
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
function sendWeeklySummary(chatId, props) {
  var onTime = parseInt(props.getProperty('WEEKLY_ON_TIME_COUNT') || "0");
  var qadaa = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
  var totalPrayers = onTime + qadaa;
  var percentage = totalPrayers === 0 ? 0 : Math.floor((onTime / totalPrayers) * 100);
  
  var msg = "📅 **الملخص الأسبوعي للقيادة:**\n\n";
  msg += "أديت الأسبوع ده " + onTime + " صلوات في وقتهم، و " + qadaa + " قضاء.\n";
  msg += "نسبة الالتزام: " + percentage + "%\n\n";
  if (percentage >= 90) msg += "أداء أسطوري! استمر يا بطل. 🦅";
  else if (percentage >= 50) msg += "أداء متوسط، تقدر تعمل أحسن من كدة الأسبوع الجاي. ⚔️";
  else msg += "أداء ضعيف! لازم تفوق لنفسك، المعسكر مابيرحمش المكسلين. ⚠️";
  
  sendMessage(chatId, msg);
  
  props.setProperty('WEEKLY_ON_TIME_COUNT', "0");
  props.setProperty('WEEKLY_QADAA_COUNT', "0");
}

function sendMorningVerse(chatId) {
  var verses = [
    "قال تعالى: {وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ}",
    "عن النبي ﷺ: «رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا»",
    "قال تعالى: {إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا}",
    "قال تعالى: {وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا}",
    "عن النبي ﷺ: «مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ»"
  ];
  var msg = "🌅 **إشراقة القيادة:**\n\n" + verses[Math.floor(Math.random() * verses.length)];
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
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var props = PropertiesService.getScriptProperties();
    var chatId = props.getProperty('ADMIN_CHAT_ID');
    if (!chatId) chatId = props.getProperty('CHAT_ID'); 
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
  
  var currentDay = Utilities.formatDate(now, "GMT+3", "u"); 
  if (currentDay === "5" && currentAbs >= 1200) { 
    var weeklyKey = 'WEEKLY_SUMMARY_' + islamicDateStr;
    if (!props.getProperty(weeklyKey)) {
      sendWeeklySummary(chatId, props);
      props.setProperty(weeklyKey, "true");
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
          
          var qCount = parseInt(props.getProperty('WEEKLY_QADAA_COUNT') || "0");
          props.setProperty('WEEKLY_QADAA_COUNT', (qCount + 1).toString());
          
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
      
      // ============ وضع الاستعادة (أيام 0-6) ============
      if (days < 7) {
        var rawPenalty = Math.round(25 * (1 - days / 7));
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
            "📍 يوم الاستعادة: " + days + " من 7\n" +
            "🔻 خصم صمود: " + rawPenalty + " نقطة\n";
          if (prayerPenalty > 0) {
            finalMsg += "🔻 خصم صلوات: " + prayerPenalty + " نقطة\n";
            finalMsg += prayerReport + "\n";
          }
          
          var remainingDays = 7 - days;
          var nextPenalty = Math.round(25 * (1 - (days + 1) / 7));
          finalMsg += "\n💡 العقوبة بكرة: " + nextPenalty + " نقطة (بدل " + rawPenalty + ")\n";
          finalMsg += "🏁 بعد " + remainingDays + " " + (remainingDays === 1 ? "يوم" : "أيام") + 
                      " تنتهي فترة الاستعادة!\n\n" +
                      "خصم اليوم: " + totalPenalty + " نقطة ⚔️";
        }
      }
      // ============ اليوم السابع ============
      else if (days === 7) {
        var bonus = 50;
        pointsChange = bonus;
        finalMsg = "🔥 أسبوع استعادة مكتمل! 🔥\n\n" +
          "يا وحش! قاومت لمدة 7 أيام كاملة رغم الخصومات!\n" +
          "فترة الاستعادة انتهت. من دلوقتي التفتيش هيزيد عليك مش يخصم!\n\n" +
          "مكافأة العودة للقتال: +" + bonus + " نقطة 🏆";
        addMedal("🔥 وسام العائد الأقوى", chatId);
      }
      // ============ وضع الصمود العادي (أيام 8+) ============
      else {
        var baseBonus = Math.min(100, 20 + Math.floor(days / 7) * 5);
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
      
      // ============ التحدي الجوكر (Weekly Joker) ============
      if (currentAbs >= 540 && currentAbs <= 1260) { // بين 9 صباحاً و 9 مساءً
        if (Math.random() < 0.05) {
          props.setProperty('JOKER_ACTIVE', "true");
          var jokerKeys = [
            [{"text": "قبول تحدي الجوكر 🃏"}],
            [{"text": "تجاهل ❌"}]
          ];
          sendMenuCustom(chatId, "🃏 **تحدي الجوكر ظهر فجأة!**\n\nأمامك فرصة للحصول على 150 نقطة ووسام نادر لو قبلت التحدي وأنجزته الآن. هل تقبل؟", jokerKeys);
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
