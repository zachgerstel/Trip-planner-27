# Trip Planner 2027 🌍

A group trip availability collector. Friends fill out their unavailable dates, top destination picks, and max budget — no account required for them.

---

## Deploy in ~10 minutes (free, no coding needed)

### Step 1 — Set up Firebase (your free database)

1. Go to **https://console.firebase.google.com** and sign in with a Google account
2. Click **"Add project"**, give it any name (e.g. `trip-planner-2027`), click through the steps
3. Once inside your project, click **"Realtime Database"** in the left sidebar
4. Click **"Create Database"** → choose any location → start in **Test mode** (you can lock it down later)
5. Click the ⚙️ gear icon → **"Project settings"**
6. Scroll down to **"Your apps"** → click the **</>** (web) icon → register an app with any nickname
7. Firebase will show you a `firebaseConfig` block that looks like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

8. Open **`src/firebase.js`** in this folder and paste those values in (replacing the PASTE_YOUR_... placeholders)

---

### Step 2 — Push to GitHub

1. Go to **https://github.com** and create a free account if you don't have one
2. Click **"New repository"** → name it `trip-planner-2027` → click **"Create repository"**
3. Upload all these files by clicking **"uploading an existing file"** on the repo page
   - Drag the entire `trip-planner` folder contents in
   - Click **"Commit changes"**

---

### Step 3 — Deploy on Vercel (free hosting)

1. Go to **https://vercel.com** and sign in with your GitHub account
2. Click **"Add New Project"** → select your `trip-planner-2027` repository
3. Vercel will auto-detect it's a React app — just click **"Deploy"**
4. In about 1 minute you'll get a live URL like `trip-planner-2027.vercel.app`

**That's it!** Share that URL with your friends. No account needed on their end.

---

## Your admin password

The Results tab is password-protected. Your password is: **959699**

To clear all responses, go to Results → scroll to the bottom → click ⚙ Admin.
The admin password to clear data is: **tripplanner2027**

---

## Files in this project

```
trip-planner/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── App.jsx       ← the main app
│   └── firebase.js   ← paste your Firebase config here
├── package.json
└── README.md
```
