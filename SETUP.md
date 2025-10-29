# 🚀 Quick Setup Guide for Team Members

## One-Time Setup (After Cloning)

### For macOS/Linux Users:

```bash
# 1. Navigate to the project
cd CoAuthor/server

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate virtual environment
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
pip install python-multipart websockets

# 5. Start the server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### For Windows Users:

```bash
# 1. Navigate to the project
cd CoAuthor\server

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment (Command Prompt)
venv\Scripts\activate
# OR (PowerShell)
venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements.txt
pip install python-multipart websockets

# 5. Start the server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Daily Usage (After Initial Setup)

### Starting the Server

**macOS/Linux:**
```bash
cd CoAuthor/server
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Windows:**
```bash
cd CoAuthor\server
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Stopping the Server
Press `Ctrl+C` in the terminal

---

## 🌐 Accessing the Application

Once the server is running, open your browser to:
```
http://localhost:8000
```

---

## 🆘 Common Issues & Solutions

### Issue: "Address already in use"
**Solution:**
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
# Note the PID, then:
taskkill /PID <PID> /F
```

### Issue: "ModuleNotFoundError"
**Solution:** Make sure virtual environment is activated
```bash
# You should see (venv) at the start of your terminal prompt
# If not, activate it:
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### Issue: "python-multipart not found"
**Solution:**
```bash
pip install python-multipart websockets
```

### Issue: Blank page in browser
**Solution:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear browser cache
- Try incognito/private mode

---

## ✅ Verification

After starting the server, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

In your browser at `http://localhost:8000`:
- Purple header with "🖋️ CoAuthor"
- "Welcome to CoAuthor" heading
- 10 genre cards (Fantasy, Sci-Fi, Romance, etc.)
- Login button in top right

---

## 📞 Need Help?

Contact your team members if you run into any issues!

