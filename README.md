# 🎓 Student Study Planner

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)

**A comprehensive web application designed to help students manage their studies effectively, track progress, and improve productivity.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Overview

Student Study Planner is a full-stack web application that provides students with a centralized platform to organize their academic life. From task management and study timers to AI-powered assistance and collaborative study rooms, this application offers everything a student needs to succeed academically.

### Why Student Study Planner?

- **All-in-One Solution**: Combines calendar, notes, flashcards, and more in one place
- **AI-Powered**: Get instant help with your studies using integrated AI assistance
- **Collaborative Learning**: Create or join study rooms with peers
- **Progress Tracking**: Visualize your productivity and academic progress
- **Free & Open Source**: Fully customizable and free to use

---

## ✨ Features

### 📅 **Task Management & Calendar**
- 📌 Interactive calendar with task visualization
- 🎨 Color-coded priority levels
- 📊 Daily, weekly, and monthly views
- ✅ Task completion tracking
- 🔔 Deadline notifications

### ⏱️ **Study Timer**
- ⏰ Pomodoro-style focus sessions
- ☕ Configurable break intervals
- 📈 Session history tracking
- 📊 Study time analytics

### 📊 **Progress Tracking**
- 📉 Visual progress charts (Chart.js)
- ✅ Task completion rates
- ⏲️ Study time analytics
- 🔥 Productivity streak tracking
- 📚 Subject performance analysis
- 🎯 Custom goal setting

### 📝 **Notes Management**
- ✍️ Rich text editing
- 🗂️ Organized note categorization
- 🔍 Quick search functionality
- 💾 Auto-save feature

### 🎯 **Grade Calculator**
- 📊 Module-based calculation
- ⚖️ Assessment weight management
- 📈 Grade tracking and projections
- 🎓 Multiple assessment types (tests, quizzes, assignments, exams)

### 🗃️ **Flashcards**
- 🃏 Custom deck creation
- 🧠 Spaced repetition algorithm (SM-2)
- 📊 Study progress tracking
- 📥 Import/export functionality
- 🏷️ Tag-based organization

### 🤖 **AI Assistant**
- 💬 Powered by Google Gemini AI
- 📚 Study-related queries and assistance
- 💾 Chat history saving
- 🎓 Educational content support

### 🎥 **Video Learning**
- 🔗 YouTube integration
- 📺 Custom playlist management
- 🔖 Video bookmarking
- 🔍 Educational content search

### 👥 **Collaboration Hub**
- 🏠 Create and join study rooms
- 💬 Real-time chat functionality
- 🎨 Shared whiteboard (Fabric.js)
- 📄 Document sharing and co-editing
- 📅 Shared calendar for group planning
- 🔐 Public and private room options

### 🔒 **Authentication & Security**
- 🔐 JWT-based authentication
- 🔑 Bcrypt password hashing
- 👤 User-specific data isolation
- 🛡️ Protected API endpoints

---


## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v12.0.0 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas account)
- **Google Gemini API Key**
- **YouTube Data API Key**

### Step 1: Clone the Repository

```bash
git clone https://github.com/Bheki0987/student-study-planner.git
cd student-study-planner
```

### Step 2: Install Dependencies

#### Root Directory
```bash
npm install
```

#### Backend Directory
```bash
cd study-planner-backend
npm install
```

### Step 3: Environment Setup

Create a `.env` file in the `study-planner-backend` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyplanner

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# YouTube Data API Key
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Step 4: Start the Application

#### Terminal 1 - Start Backend Server
```bash
cd study-planner-backend
node server.js
```

The backend server will run on `http://localhost:3001`

#### Terminal 2 - Start Frontend
For development, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Or simply open index.html in your browser
```

---

## ⚙️ Configuration

### Obtaining API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

#### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy the key to your `.env` file

#### MongoDB Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add database user
4. Whitelist your IP address
5. Get connection string
6. Update `MONGODB_URI` in `.env`

---

## 📖 Usage

### Getting Started

1. **Register an Account**
   - Open the application
   - Click "Register" tab
   - Enter username and password
   - Click "Register"

2. **Login**
   - Enter your credentials
   - Click "Login"

3. **Navigate Features**
   - Use the sidebar menu to access different features
   - Click "+ Add Task" to create new tasks
   - Explore each section for full functionality

### Key Workflows

#### Creating a Study Session
1. Go to **Study Timer**
2. Set focus time and break time
3. Click **Start**
4. Study during focus time
5. Take breaks as scheduled

#### Using Flashcards
1. Navigate to **Flashcards**
2. Click **Create Deck**
3. Add cards with questions and answers
4. Click **Study** to begin learning
5. Rate your recall (Again, Hard, Good, Easy)

#### Joining a Study Room
1. Go to **Collaboration Hub**
2. Click **Join Room**
3. Enter room code shared by a friend
4. Start collaborating!

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with custom dark theme
- **JavaScript (ES6+)** - Application logic
- **Chart.js** - Data visualization
- **Fabric.js** - Whiteboard functionality
- **SortableJS** - Drag-and-drop

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Authentication & Security
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### External APIs
- **Google Gemini AI** - AI assistance
- **YouTube Data API v3** - Video learning

---

## 📁 Project Structure

```
student-study-planner/
├── index.html              # Main HTML file
├── styles.css              # Application styles
├── script.js               # Main JavaScript logic
├── theme-toggle.js         # Theme switching functionality
├── quick-fix.js           # Collaboration hub fixes
├── package.json           # Frontend dependencies
├── LICENSE                # MIT License
├── README.md              # This file
│
└── study-planner-backend/
    ├── server.js          # Express server
    ├── package.json       # Backend dependencies
    ├── .env               # Environment variables (create this)
    │
    └── models/
        └── User.js        # User schema
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_here"
}
```

### Protected Endpoints

#### Ask AI
```http
POST /ask
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What is photosynthesis?"
}
```

**Response:**
```json
{
  "response": "AI generated response..."
}
```

#### YouTube Search
```http
GET /api/youtube/search?q={query}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "items": [
    {
      "id": { "videoId": "string" },
      "snippet": {
        "title": "string",
        "description": "string",
        "thumbnails": { ... }
      }
    }
  ]
}
```

---

## 🔒 Security

### Implemented Security Measures

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - Bcrypt with salt rounds
- ✅ **CORS Protection** - Configured origins
- ✅ **Input Validation** - Server-side validation
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **HTTPS Ready** - SSL/TLS support

### Best Practices

1. **Never commit `.env` files**
2. **Use strong JWT secrets** (min 32 characters)
3. **Regularly update dependencies**
4. **Enable MongoDB authentication**
5. **Use HTTPS in production**

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style

- Use **ES6+** JavaScript features
- Follow **camelCase** naming convention
- Add **comments** for complex logic
- Write **meaningful commit messages**

### Reporting Bugs

1. Check existing issues
2. Create detailed bug report
3. Include steps to reproduce
4. Add screenshots if applicable

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Bheki Mogola

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 Contact

**Bheki Mogola**

- 💼 LinkedIn: [Bheki Mogola](https://www.linkedin.com/in/bheki-mogola-8481122b7/)
- 📧 Email: [bpmogola@gmail.com](mailto:bpmogola@gmail.com)
- 🐙 GitHub: [@Bheki0987](https://github.com/Bheki0987)

---

## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts
- **Fabric.js** - Canvas library for whiteboard
- **Google Gemini** - AI assistance
- **MongoDB** - Database solution
- **YouTube API** - Video integration
- **All contributors** - Thank you!

---

## 🗺️ Roadmap

### Current Features ✅
- [x] Task management
- [x] Study timer
- [x] Flashcards with spaced repetition
- [x] AI assistant
- [x] Collaboration hub
- [x] Video learning

### Upcoming Features 🚀
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Cloud sync across devices
- [ ] Advanced analytics
- [ ] Calendar integrations (Google Calendar)
- [ ] Notification system
- [ ] Dark/Light theme toggle
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Export data (PDF, CSV)

---

## 💡 Tips & Tricks

### For Students
- 📅 **Plan ahead**: Add tasks at the start of each week
- ⏰ **Use Pomodoro**: 25-minute focus sessions work best
- 🃏 **Review flashcards daily**: Consistency is key
- 👥 **Study with peers**: Use collaboration rooms
- 📊 **Track your progress**: Check analytics weekly

### For Developers
- 🔧 **Use nodemon**: Auto-restart server during development
  ```bash
  npm install -g nodemon
  nodemon server.js
  ```
- 🐛 **Enable debug logs**: Set `DEBUG=*` in environment
- 📝 **Use ESLint**: Maintain code quality
- 🧪 **Write tests**: Ensure reliability

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

</div>
