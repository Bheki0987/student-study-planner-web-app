# Student Study Planner

A comprehensive web application designed to help students manage their studies effectively, track progress, and improve productivity.

## Features

### 📅 Task Management & Calendar
- Interactive calendar with task visualization
- Task organization with priority levels and color coding
- Daily, tomorrow, and upcoming task views
- Task completion tracking

### ⏱️ Study Timer
- Configurable focus and break intervals
- Pomodoro-style timer functionality
- Study session tracking
- Session history and statistics

### 📊 Progress Tracking
- Visual progress charts and statistics
- Task completion rates
- Study time analytics
- Productivity streak tracking
- Subject performance analysis
- Goal setting and tracking

### 📝 Notes Management
- Create and organize study notes
- Rich text editing capabilities
- Quick note search and categorization

### 🎯 Grade Calculator
- Module-based grade calculation
- Assessment weight management
- Grade tracking and projections

### 🗃️ Flashcards
- Create custom flashcard decks
- Spaced repetition learning system
- Study progress tracking
- Import/export deck functionality

### 🤖 AI Assistant
- Built-in AI chat support
- Study-related queries and assistance
- Chat history saving

### 🎥 Video Learning
- YouTube integration for educational content
- Create and manage video playlists
- Video bookmarking
- Search educational content

### 👥 Collaboration Hub
- Create and join study rooms
- Real-time chat functionality
- Shared whiteboard for collaborative learning
- Document sharing and co-editing
- Shared calendar for group study planning

### 🔄 Syncing & Storage
- Automatic progress saving
- Local storage implementation
- User authentication and data persistence

## Technical Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT
- External APIs: Google Generative AI, YouTube API
- Real-time Features: Socket.io
- UI Libraries: Chart.js, Fabric.js, SortableJS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd study-planner-backend
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. Start the backend server:
   ```bash
   cd study-planner-backend
   node server.js
   ```

5. Open `index.html` in your browser or use a local server

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Protected API endpoints
- CORS protection

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
ISC
