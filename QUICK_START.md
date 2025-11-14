# ⚡ Quick Start Guide - CoAuthor

## 🎯 For Your Teammates (Copy & Paste This!)

### Step 1: Clone the Repository
```bash
git clone https://github.com/SadsSauce/CoAuthor
cd CoAuthor
```

### Step 2: Setup (One Time Only)

**macOS/Linux:**
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install python-multipart websockets
```

**Windows:**
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install python-multipart websockets
```

### Step 3: Run the Server

**macOS/Linux:**
```bash
cd server  # if not already there
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Windows:**
```bash
cd server
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Open Browser
```
http://localhost:8000
```

---

## ✅ You're Done!

You should see:
- Beautiful genre cards (Fantasy, Sci-Fi, etc.)
- Login button
- Welcome message

**Create an account and start collaborating!**

---

## 🛑 Stopping the Server
Press `Ctrl+C` in the terminal

---

## 📞 Having Issues?

1. **Hard refresh browser**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Check server is running**: Look for "Uvicorn running on..." message
3. **Verify virtual environment**: You should see `(venv)` in your terminal
4. **Port in use?** See troubleshooting in SETUP.md

---

**That's it! Simple 4-step setup!** 🚀




