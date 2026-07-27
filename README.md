# 🦅 CampZero-Bot

**Camp Zero** is a Telegram Bot built on Google Apps Script, designed to serve as a strict military-themed personal accountability system. The bot aims to build strong character, ensure commitment to the five daily prayers on time, break bad habits, and build positive ones through a system of points and military ranks.

## 🌟 Key Features
- **⏰ Smart Islamic Timing System:** The new day begins with the Fajr (Dawn) prayer call, not at midnight, ensuring accurate calculations for night owls.
- **📱 Dynamic Prayer Tracker:** Prayer buttons appear only when their time arrives and disappear once performed, maintaining a clean user interface.
- **🔥 Prayer Streak:** A smart counter that tracks consecutive days of completing all five daily prayers successfully, automatically resetting upon failure.
- **🛡️ Shield System:** Achieve a "Golden Day" (all 5 prayers on-time) 7 times in a row to earn a protective shield that nullifies relapse penalties (max 3 shields).
- **🔄 Recovery Mode & Multipliers:** The first 7 days after a relapse grant you 2x points to encourage getting back on track, scaling up to 3x for legendary streaks!
- **🏅 Ranks and Medals System:** Earn points by completing tasks and praying on time (early prayers grant 15 points, while delays gradually reduce points), and climb the ranks from "Lieutenant" to "Field Marshal".
- **🃏 Weekly Joker Challenge:** Random surprise inspections may trigger a Joker challenge, offering massive points and hidden medals.
- **🌅 Fajr & Friday Bonuses:** Detailed tracking for praying Fajr right on-time to unlock hidden bronze/silver/gold medals, and 2x point multipliers on Fridays.
- **📉 Wall of Shame:** Accurately track your relapses to understand when and how you fell, helping you avoid repeating the same mistakes.
- **🏆 Victory Vault:** Log your small moral victories daily (max 3 rewards per day) and draw energy from them during moments of weakness.
- **🚨 Surprise Inspections & Penalties:** Random military inspections for delayed tasks, and a 20-point deduction if a prayer time entirely passes and becomes "Qadaa".
- **🛡️ Emergency Mode:** A special mode for travel or illness that pauses penalties and temporarily grants full points until manually deactivated.
- **📞 Fajr Audio Bombardment:** Automatic voice calls via the `CallMeBot` service if you delay the Fajr prayer after the call to prayer.
- **📅 Weekly Operations & Special Missions:** Random religious tasks (e.g., reading a specific Surah, fasting, memorizing verses) with massive rewards to break the routine.
- **📊 Detailed Analytics (`/mystats`):** Tracks on-time vs Qadaa prayers, longest streak, total victories and falls.
- **📅 Weekly Summaries:** Automated performance reviews delivered every Friday.
- **🌅 Morning Inspiration:** A daily verse or hadith delivered 15 minutes after Fajr.
- **🔒 Single-User Security:** Locks the bot to the first person who uses it, ignoring all other users.

## ⚠️ Security Notice
This bot is designed to be a personal accountability system.
- **Single User Constraint:** The bot will automatically lock to the first user who sends a message and set them as the `ADMIN_CHAT_ID`. It will ignore all messages from other users.
- **Keep your Token Safe:** Never share your `BOT_TOKEN`. Ensure that when deploying, you do not push your personal tokens to public repositories. If your token gets compromised, go to BotFather and revoke it immediately.

## 🚀 Deployment Guide

The project requires no traditional servers; it is hosted entirely and for free on Google Apps Script.

### Step 1: Prepare the Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Send the `/newbot` command and follow the instructions to choose a name and username for your bot.
3. Copy the generated **Bot Token** (keep it secret).

### Step 2: Clone the Project into Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/) and log in with your Google account.
2. Click on **New Project**.
3. Delete the default code, then copy the entire code from `Code.gs` in this repository and paste it there.
4. At the top of the code, replace the `BOT_TOKEN` value with the token you obtained from BotFather.

### Step 3: Set up the Database (Google Sheets)
1. Open [Google Sheets](https://sheets.google.com/) and create a new file.
2. Copy the **Sheet ID** from the file's URL (it's the long string between `/d/` and `/edit`).
3. Return to the Apps Script code and replace the `SHEET_ID` value at the top with your ID.

### Step 4: Deploy as a Web App
1. In the top right corner of Apps Script, click **Deploy**, then **New deployment**.
2. From the left sidebar (gear icon ⚙️), select **Web app**.
3. In the settings:
   - **Execute as:** Choose `Me (Your Email)`.
   - **Who has access:** Choose `Anyone`.
4. Click **Deploy** and grant the required permissions (a security warning will appear; click Advanced, then Go to project).
5. Copy the generated **Web app URL**.
6. Paste the copied URL into the `SCRIPT_URL` variable at the top of the code.
7. ⚠️ **CRITICAL:** After modifying the URL, you MUST deploy again via: **Manage deployments** ⬅️ Edit (Pencil icon) ⬅️ From the Version dropdown select **New version** ⬅️ Then Deploy.

### Step 5: Automated Bot Setup
1. In Apps Script, find the function named `setupBot` from the top dropdown menu (next to the Run button).
2. Click **Run**.
3. This single command will automatically link your Telegram Webhook and create all the necessary 5-minute background triggers. You should see a success message in the Execution log.

✅ **Done!** Now go to your bot on Telegram, type `/start`, and begin your camp.

---
> "Lust is a moment, and regret is years. Victory is a moment, and pride is years." 🦅
