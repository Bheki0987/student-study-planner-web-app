let tasks = [];
let currentDate = new Date();
let timerInterval;
let remainingTime;
let isPaused = true;
let notes = [];
let totalStudyTime = 0;
let studySessionsHistory = [];
let goals = [];
let sessionStartTime;
let totalTasksCompleted = 0;
let totalTasksCreated = 0;
let productivityStreak = 0;
let lastProductiveDay = null;
let charts = {};
let completedTasks = [];
let chatHistory = [];
let modules = [];
let currentModule = null;
let currentAssessmentType = null;
let currentAssessmentIndex = undefined;

// Flashcards system
let decks = [];
let currentDeck = null;
let currentCardIndex = 0;
let studyingCards = [];

// Video Learning functionality
let currentVideo = null;
let playlists = [];
let bookmarks = [];

// Collaboration Hub functionality
let studyRooms = [];
let currentRoom = null;
let documents = [];
let currentDocument = null;
let collaborators = [];
let sharedEvents = [];
let canvas = null;
let socket = null;

document.addEventListener('DOMContentLoaded', function() {
    const authPage = document.getElementById('authPage');
    const appContent = document.getElementById('appContent');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.querySelector('#loginForm form');
    const registerForm = document.querySelector('#registerForm form');
    const authError = document.querySelector('#authError');

    // Show auth page and hide app content by default
    authPage.style.display = 'flex';
    appContent.style.display = 'none';

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        showApp();
    }

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`#${tab.dataset.tab}Form`).classList.add('active');
            authError.textContent = '';
        });
    });

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAuth('login');
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAuth('register');
    });

    // Initialize app components
    initializeApp();

    // Ensure this is only added once
    document.getElementById('sendButton').addEventListener('click', function() {
        const message = document.getElementById('userInput').value;
        sendMessageToAI(message);
    });
});

async function handleAuth(type) {
    const username = document.querySelector(`#${type}Username`).value;
    const password = document.querySelector(`#${type}Password`).value;

    try {
        const response = await fetch(`http://localhost:3001/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }

        if (type === 'login') {
            localStorage.setItem('token', data.token);
            showApp();
        } else {
            // Switch to login tab after successful registration
            document.querySelector('.auth-tab[data-tab="login"]').click();
            document.querySelector('#authError').textContent = 'Registration successful! Please log in.';
            document.querySelector('#authError').style.color = 'var(--secondary-color)';
        }
    } catch (error) {
        document.querySelector('#authError').textContent = error.message;
        document.querySelector('#authError').style.color = 'var(--error-color)';
    }
}

function setupAutoLogout() {
    window.addEventListener('beforeunload', function (e) {
        localStorage.removeItem('token');
    });
}

function showApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('appContent').style.display = 'flex';
    initializeApp();
}

function initializeApp() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthPage();
        return;
    }

    showPage('calendar');
    renderCalendar();
    startTimeUpdate();
    loadFromLocalStorage();
    setupAutoLogout();

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const pageId = e.target.getAttribute('page');
            showPage(pageId);
        });
    });

    const saveAssessmentBtn = document.getElementById('saveAssessmentBtn');
    if (saveAssessmentBtn) {
        saveAssessmentBtn.addEventListener('click', saveAssessment);
    }

    const closeAssessmentModalBtn = document.getElementById('closeAssessmentModalBtn');
    if (closeAssessmentModalBtn) {
        closeAssessmentModalBtn.addEventListener('click', () => closeModal('assessmentModal'));
    }

    const addButton = document.querySelector('.add-button');
    if (addButton) {
        addButton.addEventListener('click', () => showModal('addTaskModal'));
    }

    const closeModalButton = document.querySelector('.modal-content button:last-child');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => closeModal('addTaskModal'));
    }

    const progressTrackingMenuItem = document.querySelector('.menu-item[page="progressTracking"]');
    if (progressTrackingMenuItem) {
        progressTrackingMenuItem.addEventListener('click', function() {
            showPage('progressTracking');
            updateProgressTracking();
        });
    }

    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }

    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    document.getElementById('startTimer')?.addEventListener('click', startTimer);
    document.getElementById('pauseTimer')?.addEventListener('click', pauseTimer);
    document.getElementById('resetTimer')?.addEventListener('click', resetTimer);
    document.getElementById('addGoalBtn')?.addEventListener('click', addGoal);

    const calendarHeader = document.getElementById('calendarHeader');
    if (calendarHeader) {
        const buttons = calendarHeader.querySelectorAll('button');
        const prevButton = buttons[0];
        const todayButton = buttons[1];
        const nextButton = buttons[2];

        prevButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        todayButton.addEventListener('click', goToToday);

        nextButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    document.addEventListener('submit', function(event) {
        if (event.target.id === 'addNoteForm') {
            addNote(event);
        }
    });

    document.getElementById('taskName')?.addEventListener('input', validateTaskForm);
    document.getElementById('taskDate')?.addEventListener('input', validateTaskForm);
    document.getElementById('taskTime')?.addEventListener('input', validateTaskForm);
    document.getElementById('taskPriority')?.addEventListener('change', validateTaskForm);
    document.getElementById('taskColor')?.addEventListener('input', validateTaskForm);
    document.getElementById('taskSubject')?.addEventListener('input', validateTaskForm);

    const addTaskButton = document.getElementById('addTaskButton');
    if (addTaskButton) {
        addTaskButton.addEventListener('click', addTask);
    }

    const clearChatButton = document.getElementById('clearChatButton');
    if (clearChatButton) {
        clearChatButton.addEventListener('click', clearChat);
    }

    const addModuleBtn = document.getElementById('addModuleBtn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', addModule);
    }

    loadChatHistory();

    // Add Task Modal functionality
    const addTaskBtn = document.querySelector('.add-button');
    const addTaskModal = document.getElementById('addTaskModal');
    const taskInputs = addTaskModal.querySelectorAll('input, select, textarea');

    addTaskBtn.addEventListener('click', () => {
        openModal('addTaskModal');
        // Reset form fields
        taskInputs.forEach(input => {
            if (input.type === 'color') {
                input.value = '#4CAF50';
            } else {
                input.value = '';
            }
        });
        validateTaskForm(); // Check initial form state
    });

    // Add input validation
    taskInputs.forEach(input => {
        input.addEventListener('input', validateTaskForm);
    });

    addTaskButton.addEventListener('click', () => {
        const taskData = {
            name: document.getElementById('taskName').value,
            date: document.getElementById('taskDate').value,
            time: document.getElementById('taskTime').value,
            priority: document.getElementById('taskPriority').value,
            color: document.getElementById('taskColor').value,
            subject: document.getElementById('taskSubject').value,
            notes: document.getElementById('taskNotes').value
        };

        addTask(taskData);
    });

    // Add clear history button listener
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all progress history? This cannot be undone.')) {
                clearProgressHistory();
            }
        });
    }

    // Initialize flashcards
    initializeFlashcards();

    // Initialize video learning features
    initializeVideoLearning();
    
    // Initialize collaboration hub
    initializeCollaborationHub();
}

function logout() {
    localStorage.removeItem('token');
    showAuthPage();
}

function showAuthPage() {
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('appContent').style.display = 'none';
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
        if (pageId === 'calculateGrade') {
            renderModules();
        }
    }

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    const activeMenuItem = document.querySelector(`.menu-item[page="${pageId}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }

    if (pageId === 'calendar') {
        renderCalendar();
        startTimeUpdate();
    } else {
        stopTimeUpdate();
    }
    if (pageId === 'schedule') {
        renderSchedule();
    } else if (pageId === 'notes') {
        renderNotes();
    } else if (pageId === 'progressTracking') {
        showProgressTracking();
    }
    if (pageId === 'askAI') {
        loadChatHistory();
        renderChatHistory();
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonth = document.getElementById('currentMonth');
    calendarGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    currentMonth.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    updateTimeDisplay();

    // Add day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(dayName => {
        const dayNameElement = document.createElement('div');
        dayNameElement.className = 'calendar-day day-name';
        dayNameElement.textContent = dayName;
        calendarGrid.appendChild(dayNameElement);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
        const dayElement = createDayElement(new Date(year, month, -firstDay.getDay() + i + 1));
        dayElement.classList.add('different-month');
        calendarGrid.appendChild(dayElement);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayElement = createDayElement(new Date(year, month, i));
        calendarGrid.appendChild(dayElement);
    }

    for (let i = 1; i <= (42 - lastDay.getDate() - firstDay.getDay()); i++) {
        const dayElement = createDayElement(new Date(year, month + 1, i));
        dayElement.classList.add('different-month');
        calendarGrid.appendChild(dayElement);
    }
}

function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = date.getDate();

    if (date.toDateString() === new Date().toDateString()) {
        dayElement.classList.add('today');
    }

    const tasksForDay = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.toDateString() === date.toDateString();
    });

    tasksForDay.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'event';
        taskElement.textContent = task.name;
        taskElement.style.backgroundColor = task.color;
        dayElement.appendChild(taskElement);
    });

    return dayElement;
}

function updateTimeDisplay() {
    const currentTime = document.getElementById('currentTime');
    const now = new Date();
    currentTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let timeUpdateInterval;

function startTimeUpdate() {
    updateTimeDisplay();
    timeUpdateInterval = setInterval(updateTimeDisplay, 1000);
}

function stopTimeUpdate() {
    clearInterval(timeUpdateInterval);
}

function renderSchedule() {
    const todayTasks = document.getElementById('todayTasks');
    const tomorrowTasks = document.getElementById('tomorrowTasks');
    const upcomingTasks = document.getElementById('upcomingTasks');
    
    // Clear existing content
    todayTasks.innerHTML = '<h3>Today</h3>';
    tomorrowTasks.innerHTML = '<h3>Tomorrow</h3>';
    upcomingTasks.innerHTML = '<h3>Upcoming</h3>';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    tasks.forEach(task => {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        
        const taskElement = createTaskElement(task);
        
        if (taskDate.getTime() === today.getTime()) {
            todayTasks.appendChild(taskElement);
        } else if (taskDate.getTime() === tomorrow.getTime()) {
            tomorrowTasks.appendChild(taskElement);
        } else if (taskDate > today) {
            upcomingTasks.appendChild(taskElement);
        }
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.style.backgroundColor = task.color;
    taskElement.innerHTML = `
        <h4>${task.name}</h4>
        <p>${task.date} ${task.time}</p>
        <p>Priority: ${task.priority}</p>
        <button onclick="editTask(${task.id})">Edit</button>
        <button onclick="deleteTask(${task.id})">Delete</button>
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskCompletion(${task.id})">
    `;
    return taskElement;
}

function validateTaskForm() {
    const taskName = document.getElementById('taskName').value.trim();
    const taskDate = document.getElementById('taskDate').value;
    const taskTime = document.getElementById('taskTime').value;
    const taskPriority = document.getElementById('taskPriority').value;
    const taskColor = document.getElementById('taskColor').value;
    const taskSubject = document.getElementById('taskSubject').value.trim();

    const isValid = taskName && taskDate && taskTime && taskPriority && taskColor && taskSubject;
    const addTaskButton = document.getElementById('addTaskButton');
    
    if (addTaskButton) {
        addTaskButton.disabled = !isValid;
    }
}

function addTask(taskData) {
    // Generate a unique ID for the task
    taskData.id = Date.now().toString();
    tasks.push(taskData);
    updateTaskStatistics(true); // New task created
    saveToLocalStorage();
    renderCalendar();
    showNotification('Task added successfully');
    closeModal('addTaskModal');
}

function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskTime').value = task.time;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskColor').value = task.color;
        document.getElementById('taskNotes').value = task.notes;
        document.getElementById('taskSubject').value = task.subject;

        // Do NOT delete the task here
        showModal('addTaskModal');
        validateTaskForm();
    }
}

function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
    tasks.splice(taskIndex, 1);
    saveToLocalStorage();
    renderSchedule();
    renderCalendar();
    updateProgressTracking();
    showNotification('Task deleted successfully');
    } else {
    showNotification('Task not found.');
    }
}
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        task.completed = !task.completed;
        
        if (task.completed) {
            completedTasks.push({...task});
            tasks.splice(taskIndex, 1);
            totalTasksCompleted++;
            
            // Update productivity streak
            const today = new Date().toDateString();
            if (lastProductiveDay !== today) {
                productivityStreak++;
                lastProductiveDay = today;
            }
        }
        
        saveToLocalStorage();
        renderSchedule();
        renderCalendar();
        updateProgressTracking();
        showNotification(task.completed ? 'Task completed!' : 'Task uncompleted');
    }
}

function startTimer() {
    if (isPaused) {
        isPaused = false;
        const focusTime = document.getElementById('focusTime').value;
        remainingTime = focusTime * 60;
        timerInterval = setInterval(updateTimer, 1000);
        updateTimerDisplay();
        
        sessionStartTime = Date.now();
    }
}

function pauseTimer() {
    if (!isPaused) {
        isPaused = true;
        clearInterval(timerInterval);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    const focusTime = document.getElementById('focusTime').value;
    remainingTime = focusTime * 60;
    updateTimerDisplay();
}

function updateTimer() {
    if (remainingTime > 0) {
        remainingTime--;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        alert("Time's up!");
        
        const sessionDuration = (Date.now() - sessionStartTime) / 60000;
        totalStudyTime += sessionDuration;
        studySessionsHistory.push({
            date: new Date().toLocaleDateString(),
            duration: sessionDuration
        });
        updateProgressTracking();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById('timerDisplay').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function scheduleNotification(task) {
    const taskTime = new Date(`${task.date}T${task.time}`);
    const notificationTime = taskTime.getTime() - 5 * 60 * 1000;
    const currentTime = new Date().getTime();

    if (notificationTime > currentTime) {
        setTimeout(() => {
            showNotification(`Upcoming Task: ${task.name}`);
        }, notificationTime - currentTime);
    }
}

function showNotification(message) {
    const notificationArea = document.getElementById('notificationArea');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function addNote(event) {
    event.preventDefault();

    const form = event.target;
    const title = form.querySelector('#noteTitle').value.trim();
    const content = form.querySelector('#noteContent').value.trim();

    if (title && content) {
        const note = {
            id: Date.now(),
            title: title,
            content: content
        };
        notes.push(note);
        renderNotes();
        saveNotesToLocalStorage();
        form.reset();
    }
}

function renderNotes() {
    const notesList = document.getElementById('notesList');
    if (notesList) {
        notesList.innerHTML = '';
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <button onclick="editNote(${note.id})">Edit</button>
                <button onclick="deleteNote(${note.id})">Delete</button>
            `;
            notesList.appendChild(noteElement);
        });
    }
}

function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        deleteNote(noteId);
        saveNotesToLocalStorage();
    }
}

function deleteNote(noteId) {
    notes = notes.filter(note => note.id !== noteId);
    renderNotes();
    saveNotesToLocalStorage();
}

function saveNotesToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotesFromLocalStorage() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
}

function showProgressTracking() {
    updateTaskCompletionChart();
    updateStudyTimeChart();
    updateProductivityStreak();
    updateSubjectPerformance();
    updateGoalsProgress();
}

function updateTaskCompletionChart() {
    const totalCompletedTasks = completedTasks.length;
    const totalActiveTasks = tasks.length;
    const completionRate = (totalCompletedTasks + totalActiveTasks) > 0 
        ? (totalCompletedTasks / (totalCompletedTasks + totalActiveTasks)) * 100 
        : 0;

    const ctx = document.getElementById('taskCompletionChart').getContext('2d');
    
    if (charts.taskCompletion) {
        charts.taskCompletion.destroy();
    }
    
    charts.taskCompletion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Active'],
            datasets: [{
                data: [totalCompletedTasks, totalActiveTasks],
                backgroundColor: ['#4CAF50', '#FFA500']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Task Completion'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });

    document.getElementById('taskCompletionRate').textContent = `Task Completion Rate: ${completionRate.toFixed(2)}%`;
}

function updateStudyTimeChart() {
    const ctx = document.getElementById('studyTimeChart').getContext('2d');
    
    if (charts.studyTime) {
        charts.studyTime.destroy();
    }
    
    charts.studyTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: studySessionsHistory.map(session => session.date),
            datasets: [{
                label: 'Study Time (minutes)',
                data: studySessionsHistory.map(session => session.duration),
                borderColor: '#4CAF50',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Study Time History'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} minutes`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Study Time (minutes)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    document.getElementById('totalStudyTime').textContent = `Total Study Time: ${totalStudyTime.toFixed(2)} minutes`;
}

function updateProductivityStreak() {
    const today = new Date().toDateString();
    if (lastProductiveDay !== today) {
        if (lastProductiveDay === new Date(Date.now() - 86400000).toDateString()) {
            productivityStreak++;
        } else {
            productivityStreak = 1;
        }
        lastProductiveDay = today;
    }
    document.getElementById('productivityStreak').textContent = `Current Streak: ${productivityStreak} days`;
}

function updateSubjectPerformance() {
    const subjects = {};
    completedTasks.forEach(task => {
        subjects[task.subject] = (subjects[task.subject] || 0) + 1;
    });

    const ctx = document.getElementById('subjectPerformanceChart').getContext('2d');
    
    if (charts.subjectPerformance) {
        charts.subjectPerformance.destroy();
    }
    
    charts.subjectPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(subjects),
            datasets: [{
                label: 'Completed Tasks per Subject',
                data: Object.values(subjects),
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Subject Performance'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Completed Tasks'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Subjects'
                    }
                }
            }
        }
    });
}

function updateGoalsProgress() {
    const goalsElement = document.getElementById('goalsProgress');
    goalsElement.innerHTML = '';

    goals.forEach(goal => {
        const goalElement = document.createElement('div');
        goalElement.className = 'goal';
        goalElement.innerHTML = `
            <h4>${goal.name}</h4>
            <div class="progress-wrapper">
                <progress value="${goal.progress}" max="100"></progress>
                <span>${goal.progress}%</span>
            </div>
            <div class="goal-actions">
                <button onclick="editGoal(${goal.id})">Edit</button>
                <button onclick="deleteGoal(${goal.id})">Delete</button>
            </div>
        `;
        goalsElement.appendChild(goalElement);
    });
}

function addGoal() {
    const goalName = prompt('Enter goal name:');
    if (goalName) {
        const newGoal = { id: Date.now(), name: goalName, progress: 0 };
        goals.push(newGoal);
        updateGoalsProgress();
        saveToLocalStorage();
    }
}

function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        const newName = prompt('Enter new goal name:', goal.name);
        const newProgress = prompt('Enter new progress (0-100):', goal.progress);
        if (newName && !isNaN(newProgress)) {
            goal.name = newName;
            goal.progress = Math.min(100, Math.max(0, parseInt(newProgress)));
            updateGoalsProgress();
            saveToLocalStorage();
        }
    }
}

function deleteGoal(goalId) {
    goals = goals.filter(g => g.id !== goalId);
    updateGoalsProgress();
    saveToLocalStorage();
}

function addModule() {
    const moduleName = prompt("Enter module name:");
    if (moduleName) {
        const module = {
            id: Date.now(),
            name: moduleName,
            tests: [],
            quizzes: [],
            assignments: [],
            exam: null
        };
        modules.push(module);
        renderModules();
        saveToLocalStorage();
    }
}

function deleteModule(moduleId) {
    if (confirm('Are you sure you want to delete this module?')) {
        modules = modules.filter(m => m.id !== moduleId);
        renderModules();
        saveToLocalStorage();
    }
}

function renderModules() {
    const modulesContainer = document.getElementById('modules');
    if (!modulesContainer) {
        console.error("Modules container not found");
        return;
    }
    modulesContainer.innerHTML = '';
    modules.forEach(module => {
        const moduleElement = createModuleElement(module);
        modulesContainer.appendChild(moduleElement);
    });
}

function createModuleElement(module) {
    const moduleElement = document.createElement('div');
    moduleElement.className = 'module';
    moduleElement.innerHTML = `
        <h3>${module.name}</h3>
        <div class="assessment-section">
            <h4>Tests</h4>
            <div id="tests-${module.id}"></div>
            <button onclick="showAddAssessmentModal(${module.id}, 'test')" class="secondary-button">Add Test</button>
        </div>
        <div class="assessment-section">
            <h4>Quizzes</h4>
            <div id="quizzes-${module.id}"></div>
            <button onclick="showAddAssessmentModal(${module.id}, 'quiz')" class="secondary-button">Add Quiz</button>
        </div>
        <div class="assessment-section">
            <h4>Assignments/Projects</h4>
            <div id="assignments-${module.id}"></div>
            <button onclick="showAddAssessmentModal(${module.id}, 'assignment')" class="secondary-button">Add Assignment/Project</button>
        </div>
        <div class="assessment-section">
            <h4>Exam</h4>
            <div id="exam-${module.id}"></div>
            <button onclick="showAddAssessmentModal(${module.id}, 'exam')" class="secondary-button">Set Exam</button>
        </div>
        <div class="grade-result">
            <h4>Final Grade: <span id="final-grade-${module.id}">Not calculated</span></h4>
            <button onclick="calculateGrade(${module.id})" class="primary-button">Calculate Grade</button>
        </div>
        <button onclick="deleteModule(${module.id})" class="delete-button">Delete Module</button>
    `;

    setTimeout(() => {
        renderAssessments(module, 'test');
        renderAssessments(module, 'quiz');
        renderAssessments(module, 'assignment');
        renderExam(module);
    }, 0);

    return moduleElement;
}

function showAddAssessmentModal(moduleId, type) {
    currentModule = modules.find(m => m.id === moduleId);
    currentAssessmentType = type;

    if (!currentModule) {
        console.error('Module not found');
        alert('Error: Module not found');
        return;
    }

    document.getElementById('assessmentModalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('assessmentName').value = '';
    document.getElementById('assessmentScore').value = '';
    document.getElementById('assessmentTotalScore').value = '';
    document.getElementById('assessmentWeight').value = '';
    showModal('assessmentModal');
}

function saveAssessment() {
    const name = document.getElementById('assessmentName').value;
    const score = parseFloat(document.getElementById('assessmentScore').value);
    const totalScore = parseFloat(document.getElementById('assessmentTotalScore').value);
    const weight = parseFloat(document.getElementById('assessmentWeight').value);

    if (name && !isNaN(score) && !isNaN(totalScore) && !isNaN(weight) && score >= 0 && totalScore > 0 && weight > 0 && weight <= 100) {
        const assessment = { name, score, totalScore, weight };
        
        if (!currentModule) {
            console.error('No module selected');
            alert('Error: No module selected');
            return;
        }

        if (currentAssessmentType === 'exam') {
            currentModule.exam = assessment;
        } else {
            const containerType = currentAssessmentType === 'quiz' ? 'quizzes' : `${currentAssessmentType}s`;
            
            if (!currentModule[containerType]) {
                currentModule[containerType] = [];
            }
            
            if (currentAssessmentIndex !== null && currentAssessmentIndex !== undefined) {
                // Editing existing assessment
                currentModule[containerType][currentAssessmentIndex] = assessment;
            } else {
                // Adding new assessment
                currentModule[containerType].push(assessment);
            }
        }

        renderModules();
        saveToLocalStorage();
        closeModal('assessmentModal');

        // Clear the form fields and reset current assessment editing state
        document.getElementById('assessmentName').value = '';
        document.getElementById('assessmentScore').value = '';
        document.getElementById('assessmentTotalScore').value = '';
        document.getElementById('assessmentWeight').value = '';
        currentAssessmentIndex = undefined;
    } else {
        alert('Please enter valid values for all fields.');
    }
}

function renderAssessments(module, type) {
    const containerType = type === 'quiz' ? 'quizzes' : `${type}s`;
    const container = document.getElementById(`${containerType}-${module.id}`);
    if (!container) {
        console.error(`Container for ${containerType} not found for module ${module.id}`);
        return;
    }
    container.innerHTML = '';
    
    const assessments = module[containerType] || [];
    
    assessments.forEach((assessment, index) => {
        const assessmentElement = document.createElement('div');
        assessmentElement.className = 'assessment-item';
        assessmentElement.innerHTML = `
            <span>${assessment.name}: ${assessment.score}/${assessment.totalScore} (Weight: ${assessment.weight}%)</span>
            <div>
                <button onclick="editAssessment(${module.id}, '${type}', ${index})" class="edit-button">Edit</button>
                <button onclick="deleteAssessment(${module.id}, '${type}', ${index})" class="delete-button">Delete</button>
            </div>
        `;
        container.appendChild(assessmentElement);
    });
}

function renderExam(module) {
    const container = document.getElementById(`exam-${module.id}`);
    if (!container) {
        console.error(`Exam container not found for module ${module.id}`);
        return;
    }
    container.innerHTML = '';
    if (module.exam) {
        const examElement = document.createElement('div');
        examElement.className = 'assessment-item';
        examElement.innerHTML = `
            <span>${module.exam.name}: ${module.exam.score}/${module.exam.totalScore} (Weight: ${module.exam.weight}%)</span>
            <div>
                <button onclick="editAssessment(${module.id}, 'exam')" class="edit-button">Edit</button>
                <button onclick="deleteAssessment(${module.id}, 'exam')" class="delete-button">Delete</button>
            </div>
        `;
        container.appendChild(examElement);
    } else {
        container.innerHTML = '<p>No exam set</p>';
    }
}

function editAssessment(moduleId, type, index) {
    const module = modules.find(m => m.id === moduleId);
    if (!module) {
        console.error(`Module not found: ${moduleId}`);
        alert('Error: Module not found');
        return;
    }

    let assessment;
    if (type === 'exam') {
        assessment = module.exam;
    } else {
        const containerType = type === 'quiz' ? 'quizzes' : `${type}s`;
        const assessments = module[containerType];
        
        if (!assessments || !Array.isArray(assessments)) {
            console.error(`Assessments array not found for type: ${containerType}`);
            alert(`Error: No ${containerType} found for this module`);
            return;
        }

        assessment = assessments[index];
    }

    if (!assessment) {
        console.error(`Assessment not found`);
        alert('Error: Assessment not found');
        return;
    }

    document.getElementById('assessmentName').value = assessment.name;
    document.getElementById('assessmentScore').value = assessment.score;
    document.getElementById('assessmentTotalScore').value = assessment.totalScore;
    document.getElementById('assessmentWeight').value = assessment.weight;

    // Store the current module, assessment type, and index for use in saveAssessment
    currentModule = module;
    currentAssessmentType = type;
    currentAssessmentIndex = type === 'exam' ? null : index;

    showModal('assessmentModal');
}

function deleteAssessment(moduleId, type, index) {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    if (type === 'exam') {
        module.exam = null;
    } else {
        const containerType = type === 'quiz' ? 'quizzes' : `${type}s`;
        if (module[containerType] && Array.isArray(module[containerType])) {
            module[containerType].splice(index, 1);
        } else {
            console.error(`Invalid assessment type or array: ${containerType}`);
            return;
        }
    }
    renderModules();
    saveToLocalStorage();
}

function calculateGrade(moduleId) {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    let totalWeight = 0;
    let weightedSum = 0;

    function processAssessments(assessments) {
        assessments.forEach(assessment => {
            const percentage = (assessment.score / assessment.totalScore) * 100;
            totalWeight += assessment.weight;
            weightedSum += (percentage * assessment.weight / 100);
        });
    }

    processAssessments(module.tests);
    processAssessments(module.quizzes);
    processAssessments(module.assignments);
    if (module.exam) {
        const examPercentage = (module.exam.score / module.exam.totalScore) * 100;
        totalWeight += module.exam.weight;
        weightedSum += (examPercentage * module.exam.weight / 100);
    }

    if (Math.abs(totalWeight - 100) > 0.01) {
        alert(`Warning: Total weight is ${totalWeight.toFixed(2)}%, not 100%`);
    }

    const finalGrade = weightedSum;
    document.getElementById(`final-grade-${moduleId}`).textContent = finalGrade.toFixed(2) + '%';
}

async function handleSendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (message) {
        addMessageToChat(message, 'user');
        userInput.value = '';
    
        try {
            // Create a temporary thinking message element
            const thinkingElement = document.createElement('div');
            thinkingElement.classList.add('message', 'ai-message');
            thinkingElement.textContent = 'Thinking...';
            thinkingElement.id = 'thinking-message';
            
            // Add thinking message to chat
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.appendChild(thinkingElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Get AI response
            const aiResponse = await sendMessageToAI(message);
            
            // Remove thinking message
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) {
            thinkingMessage.remove();
            }
            
            // Add the actual AI response
            addMessageToChat(aiResponse, 'ai');
            saveChatHistory(); // Save chat history after each message
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            
            // Remove thinking message if there was an error
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }
            
            addMessageToChat("Sorry, I couldn't process your request at this time. Please try again later.", 'ai');
        }
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = message;
    
    // Don't add to chat history if it's a thinking message
    if (message !== 'Thinking...') {
        chatHistory.push({ sender, message });
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    localStorage.removeItem('chatHistory');
}

function saveChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatMessages.innerHTML = savedHistory;
    }
}

function renderChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    chatHistory.forEach(msg => addMessageToChat(msg.message, msg.sender));
}

async function sendMessageToAI(message) {
    try {
        // Debug log to check if function is being called
        console.log('Sending message to AI:', message);
        console.log('Token available:', !!localStorage.getItem('token'));
        
        const response = await fetch('http://localhost:3001/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server error:', errorData);
            throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error sending message to AI:', error);
        return `Sorry, I couldn't process your request at this time. Error: ${error.message}`;
    }
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    localStorage.setItem('totalTasksCompleted', totalTasksCompleted);
    localStorage.setItem('totalTasksCreated', totalTasksCreated);
    localStorage.setItem('productivityStreak', productivityStreak);
    localStorage.setItem('lastProductiveDay', lastProductiveDay);
}

function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    const savedCompletedTasks = localStorage.getItem('completedTasks');
    const savedTotalCompleted = localStorage.getItem('totalTasksCompleted');
    const savedTotalCreated = localStorage.getItem('totalTasksCreated');
    const savedStreak = localStorage.getItem('productivityStreak');
    const savedLastProductiveDay = localStorage.getItem('lastProductiveDay');

    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedCompletedTasks) completedTasks = JSON.parse(savedCompletedTasks);
    if (savedTotalCompleted) totalTasksCompleted = parseInt(savedTotalCompleted);
    if (savedTotalCreated) totalTasksCreated = parseInt(savedTotalCreated);
    if (savedStreak) productivityStreak = parseInt(savedStreak);
    if (savedLastProductiveDay) lastProductiveDay = savedLastProductiveDay;
}

document.addEventListener('DOMContentLoaded', function() {
    loadChatHistory();
    
    const sendButton = document.getElementById('sendButton');
    sendButton.addEventListener('click', handleSendMessage);

    const userInput = document.getElementById('userInput');
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    const clearChatButton = document.getElementById('clearChatButton');
    clearChatButton.addEventListener('click', clearChat);

    const saveChatButton = document.getElementById('saveChatButton');
    saveChatButton.addEventListener('click', saveChatHistory);
});

// For testing purposes
//localStorage.setItem('token', 'fake-token-for-testing');

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);

// Add this new function to handle the Today button click
function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

function updateProgressTracking() {
    // Update task completion rate
    const completionRate = totalTasksCreated > 0 
        ? ((totalTasksCompleted / totalTasksCreated) * 100).toFixed(1) 
        : 0;
    
    const taskCompletionRateElement = document.getElementById('taskCompletionRate');
    if (taskCompletionRateElement) {
        taskCompletionRateElement.textContent = `Task Completion Rate: ${completionRate}%`;
    }

    // Update total study time
    const hours = Math.floor(totalStudyTime / 3600);
    const minutes = Math.floor((totalStudyTime % 3600) / 60);
    
    const totalStudyTimeElement = document.getElementById('totalStudyTime');
    if (totalStudyTimeElement) {
        totalStudyTimeElement.textContent = `Total Study Time: ${hours}h ${minutes}m`;
    }

    // Update productivity streak
    const productivityStreakElement = document.getElementById('productivityStreak');
    if (productivityStreakElement) {
        productivityStreakElement.textContent = `Current Streak: ${productivityStreak} days`;
    }

    // Update charts
    updateCharts();
}

function updateCharts() {
    // Task Completion Chart
    if (charts.taskCompletion) {
        charts.taskCompletion.destroy();
    }
    const taskCtx = document.getElementById('taskCompletionChart').getContext('2d');
    charts.taskCompletion = new Chart(taskCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [totalTasksCompleted, totalTasksCreated - totalTasksCompleted],
                backgroundColor: ['#03dac6', '#6200ee']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Study Time Chart
    if (charts.studyTime) {
        charts.studyTime.destroy();
    }
    const studyCtx = document.getElementById('studyTimeChart').getContext('2d');
    const studyData = studySessionsHistory.slice(-7).map(session => ({
        date: new Date(session.date).toLocaleDateString(),
        duration: session.duration / 60 // Convert to minutes
    }));

    charts.studyTime = new Chart(studyCtx, {
        type: 'bar',
        data: {
            labels: studyData.map(d => d.date),
            datasets: [{
                label: 'Study Time (minutes)',
                data: studyData.map(d => d.duration),
                backgroundColor: '#03dac6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Subject Performance Chart
    if (charts.subjectPerformance) {
        charts.subjectPerformance.destroy();
    }
    const subjectCtx = document.getElementById('subjectPerformanceChart').getContext('2d');
    const subjectData = {};
    
    // Aggregate completed tasks by subject
    completedTasks.forEach(task => {
        if (!subjectData[task.subject]) {
            subjectData[task.subject] = 0;
        }
        subjectData[task.subject]++;
    });

    charts.subjectPerformance = new Chart(subjectCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(subjectData),
            datasets: [{
                data: Object.values(subjectData),
                backgroundColor: [
                    '#03dac6',
                    '#6200ee',
                    '#ff4081',
                    '#ffab00',
                    '#00e676'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Add these functions to track task statistics
function updateTaskStatistics(isNewTask = false, isCompleted = false) {
    if (isNewTask) {
        totalTasksCreated++;
    }
    if (isCompleted) {
        totalTasksCompleted++;
        
        // Update productivity streak
        const today = new Date().toDateString();
        if (lastProductiveDay !== today) {
            productivityStreak++;
            lastProductiveDay = today;
        }
    }
    saveToLocalStorage();
}

// Update the addTask function
function addTask(taskData) {
    tasks.push(taskData);
    updateTaskStatistics(true); // New task created
    saveToLocalStorage();
    renderCalendar();
    showNotification('Task added successfully');
    closeModal('addTaskModal');
}

// Update the completeTask function
function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const completedTask = tasks[taskIndex];
        completedTasks.push(completedTask);
        tasks.splice(taskIndex, 1);
        
        // Update task statistics
        totalTasksCompleted++;
        
        // Update productivity streak
        const today = new Date().toDateString();
        if (lastProductiveDay !== today) {
            productivityStreak++;
            lastProductiveDay = today;
        }
        
        saveToLocalStorage();
        renderCalendar();
        updateProgressTracking();
        showNotification('Task completed successfully!');
    }
}

// Update study session tracking
function updateStudyStatistics(duration) {
    totalStudyTime += duration;
    const sessionData = {
        date: new Date().toISOString(),
        duration: duration
    };
    studySessionsHistory.push(sessionData);
    saveToLocalStorage();
}

// Update modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Add event listeners for modal close buttons
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Close modal when clicking cancel button
    const cancelButtons = document.querySelectorAll('.modal-buttons button:last-child');
    cancelButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
});

function clearProgressHistory() {
    // Reset all tracking variables
    totalTasksCompleted = 0;
    totalTasksCreated = 0;
    totalStudyTime = 0;
    productivityStreak = 0;
    lastProductiveDay = null;
    studySessionsHistory = [];
    completedTasks = [];
    
    // Save the cleared state
    saveToLocalStorage();
    
    // Update the display
    updateProgressTracking();
    showNotification('Progress history cleared successfully');
}

// Update the task rendering function
function renderTask(task) {
    return `
        <div class="task ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-content">
                <h4>${task.name}</h4>
                <p>Time: ${task.time}</p>
                <p>Priority: ${task.priority}</p>
                <p>Subject: ${task.subject}</p>
                ${task.notes ? `<p>Notes: ${task.notes}</p>` : ''}
            </div>
            <div class="task-actions">
                <input type="checkbox" class="task-checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    onclick="toggleTaskCompletion('${task.id}')">
                <button class="edit-button" onclick="editTask('${task.id}')">Edit</button>
            </div>
        </div>
    `;
}

// Update the task completion toggle function
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        task.completed = !task.completed;
        
        if (task.completed) {
            completedTasks.push({...task});
            tasks.splice(taskIndex, 1);
            totalTasksCompleted++;
            
            // Update productivity streak
            const today = new Date().toDateString();
            if (lastProductiveDay !== today) {
                productivityStreak++;
                lastProductiveDay = today;
            }
        }
        
        saveToLocalStorage();
        renderSchedule();
        renderCalendar();
        updateProgressTracking();
        showNotification(task.completed ? 'Task completed!' : 'Task uncompleted');
    }
}


// Add CSS for task actions
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .task-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .task-checkbox {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    .task-actions button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.2s;
    }

    .task-actions .edit-button {
        background-color: var(--primary-color);
        color: var(--on-surface-color);
    }

    .task-actions .delete-button {
        background-color: var(--error-color);
        color: var(--on-surface-color);
    }

    .task-actions button:hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(styleSheet);

// Function to save chat history as a text file
function saveChatHistoryAsFile() {
    const chatHistoryText = chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n');
    const blob = new Blob([chatHistoryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_history.txt'; // Name of the file
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
// Bind the save button to the save function
document.getElementById('saveChatButton').addEventListener('click', saveChatHistoryAsFile);
function cleanup() {
    // Remove event listeners
    document.removeEventListener('click', handleClick);
    clearInterval(timerInterval);
}

// Initialize Sortable for drag-and-drop functionality
function initSortable() {
    const cardsList = document.getElementById('cardsList');
    if (cardsList) {
        new Sortable(cardsList, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                // Update the order of cards in the current deck
                const newIndex = evt.newIndex;
                const oldIndex = evt.oldIndex;
                
                if (currentDeck && currentDeck.cards) {
                    const [movedCard] = currentDeck.cards.splice(oldIndex, 1);
                    currentDeck.cards.splice(newIndex, 0, movedCard);
                    saveDecksToLocalStorage();
                }
            }
        });
    }
}

// Spaced repetition algorithm (SM-2 simplified)
function calculateNextReview(card, rating) {
    // Initialize if first review
    if (!card.interval) card.interval = 1;
    if (!card.ease) card.ease = 2.5;
    if (!card.repetitions) card.repetitions = 0;
    
    const now = new Date();
    
    switch(rating) {
        case "again": // Failed, reset
            card.repetitions = 0;
            card.interval = 1;
            card.ease = Math.max(1.3, card.ease - 0.2);
            break;
            
        case "hard": // Difficult
            card.repetitions = Math.max(0, card.repetitions);
            card.interval = card.interval * 1.2;
            card.ease = Math.max(1.3, card.ease - 0.15);
            break;
            
        case "good": // Correct
            card.repetitions += 1;
            if (card.repetitions === 1) {
                card.interval = 1;
            } else if (card.repetitions === 2) {
                card.interval = 6;
            } else {
                card.interval = Math.round(card.interval * card.ease);
            }
            break;
            
        case "easy": // Easy
            card.repetitions += 1;
            card.interval = Math.round(card.interval * card.ease * 1.3);
            card.ease = Math.min(3.0, card.ease + 0.15);
            break;
    }
    
    // Set next review date
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + card.interval);
    card.dueDate = nextDate.toISOString();
    card.lastReviewed = now.toISOString();
    
    return card;
}

// Get cards due for review today
function getDueCards(deck) {
    const now = new Date();
    return deck.cards.filter(card => {
        // If card has never been reviewed, it's due
        if (!card.dueDate) return true;
        
        const dueDate = new Date(card.dueDate);
        return dueDate <= now;
    });
}

// Count due cards for a deck
function countDueCards(deck) {
    return getDueCards(deck).length;
}

// Create a new deck
function createDeck(deckData) {
    const newDeck = {
        id: Date.now().toString(),
        title: deckData.title,
        subject: deckData.subject || '',
        description: deckData.description || '',
        created: new Date().toISOString(),
        lastStudied: null,
        cards: []
    };
    
    decks.push(newDeck);
    saveDecksToLocalStorage();
    renderDecks();
    return newDeck;
}

// Delete a deck
function deleteDeck(deckId) {
    decks = decks.filter(deck => deck.id !== deckId);
    saveDecksToLocalStorage();
    renderDecks();
}

// Add a card to the current deck
function addCard(cardData) {
    if (!currentDeck) return;
    
    const newCard = {
        id: Date.now().toString(),
        front: cardData.front,
        back: cardData.back,
        tags: cardData.tags || [],
        created: new Date().toISOString(),
        lastReviewed: null,
        dueDate: null,
        interval: null,
        ease: 2.5,
        repetitions: 0
    };
    
    currentDeck.cards.push(newCard);
    saveDecksToLocalStorage();
    renderCards();
}

// Edit a card
function editCard(cardId, cardData) {
    if (!currentDeck) return;
    
    const cardIndex = currentDeck.cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    currentDeck.cards[cardIndex] = {
        ...currentDeck.cards[cardIndex],
        front: cardData.front,
        back: cardData.back,
        tags: cardData.tags || []
    };
    
    saveDecksToLocalStorage();
    renderCards();
}

// Delete a card
function deleteCard(cardId) {
    if (!currentDeck) return;
    
    currentDeck.cards = currentDeck.cards.filter(card => card.id !== cardId);
    saveDecksToLocalStorage();
    renderCards();
}

// Start studying a deck
function startStudySession(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    
    currentDeck = deck;
    studyingCards = getDueCards(deck).sort(() => Math.random() - 0.5); // Shuffle due cards
    currentCardIndex = 0;
    
    if (studyingCards.length === 0) {
        showNotification("No cards due for review in this deck!");
        return;
    }
    
    document.getElementById('studyDeckTitle').textContent = deck.title;
    updateStudyProgress();
    showStudyView();
    displayCurrentCard();
    
    // Update last studied timestamp
    currentDeck.lastStudied = new Date().toISOString();
    saveDecksToLocalStorage();
}

// Display the current card in study mode
function displayCurrentCard() {
    if (currentCardIndex >= studyingCards.length) {
        // Study session complete
        showNotification("Review session complete!");
        showDeckView();
        return;
    }
    
    const card = studyingCards[currentCardIndex];
    const flashcard = document.getElementById('currentFlashcard');
    
    // Reset flip state
    flashcard.classList.remove('flipped');
    
    // Set content
    document.querySelector('.flashcard-front').innerHTML = card.front;
    document.querySelector('.flashcard-back').innerHTML = card.back;
    
    updateStudyProgress();
}

// Update the study progress indicators
function updateStudyProgress() {
    const progressElement = document.getElementById('cardProgress');
    const progressBar = document.getElementById('studyProgressBar');
    
    if (studyingCards.length === 0) {
        progressElement.textContent = 'No cards to study';
        progressBar.style.width = '0%';
        return;
    }
    
    const current = currentCardIndex + 1;
    const total = studyingCards.length;
    const percentage = (current / total) * 100;
    
    progressElement.textContent = `Card ${current}/${total}`;
    progressBar.style.width = `${percentage}%`;
}

// Rate the current card (spaced repetition)
function rateCard(rating) {
    if (currentCardIndex >= studyingCards.length) return;
    
    const card = studyingCards[currentCardIndex];
    
    // Apply spaced repetition algorithm
    const updatedCard = calculateNextReview(card, rating);
    
    // Find and update the actual card in the deck
    const cardIndex = currentDeck.cards.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
        currentDeck.cards[cardIndex] = updatedCard;
    }
    
    // Move to next card
    currentCardIndex++;
    
    // Save progress
    saveDecksToLocalStorage();
    updateFlashcardStats();
    
    // Show next card or end session
    displayCurrentCard();
}

// Update flashcard statistics for progress tracking
function updateFlashcardStats() {
    let stats = JSON.parse(localStorage.getItem('flashcardStats')) || {
        cardsReviewed: 0,
        sessionsCompleted: 0,
        streakDays: 0,
        lastReviewDate: null
    };
    
    const today = new Date().toISOString().slice(0, 10);
    
    // Update cards reviewed count
    stats.cardsReviewed += 1;
    
    // Check if this is a new day for streak
    if (stats.lastReviewDate !== today) {
        if (stats.lastReviewDate) {
            const lastDate = new Date(stats.lastReviewDate);
            const todayDate = new Date(today);
            
            // Calculate difference in days
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // If reviewed yesterday, increment streak
            if (diffDays === 1) {
                stats.streakDays += 1;
            } 
            // If missed days, reset streak
            else if (diffDays > 1) {
                stats.streakDays = 1;
            }
        } else {
            // First time reviewing
            stats.streakDays = 1;
        }
        
        stats.lastReviewDate = today;
    }
    
    // Check if session completed
    if (currentCardIndex >= studyingCards.length) {
        stats.sessionsCompleted += 1;
    }
    
    localStorage.setItem('flashcardStats', JSON.stringify(stats));
}

// Render all decks
function renderDecks() {
    const decksContainer = document.getElementById('decksContainer');
    if (!decksContainer) return;
    
    decksContainer.innerHTML = '';
    
    if (decks.length === 0) {
        decksContainer.innerHTML = '<p>No flashcard decks yet. Create your first deck to get started!</p>';
        return;
    }
    
    decks.forEach(deck => {
        const dueCount = countDueCards(deck);
        const deckElement = document.createElement('div');
        deckElement.className = 'deck-card';
        deckElement.innerHTML = `
            <div class="deck-actions">
                <button class="edit-deck-btn" data-id="${deck.id}">✏️</button>
                <button class="delete-deck-btn" data-id="${deck.id}">🗑️</button>
            </div>
            <h4>${deck.title} 
                ${dueCount > 0 ? `<span class="deck-due-count">${dueCount}</span>` : ''}
            </h4>
            <p>${deck.description || 'No description'}</p>
            <p class="deck-subject">${deck.subject || 'No subject'}</p>
            <div class="deck-footer">
                <span class="deck-stats">${deck.cards.length} cards</span>
                <button class="study-deck-btn primary-button" data-id="${deck.id}">Study Now</button>
            </div>
        `;
        
        decksContainer.appendChild(deckElement);
        
        // Add click event for study button
        deckElement.querySelector('.study-deck-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent deck click event
            startStudySession(deck.id);
        });
        
        // Add click event for edit button
        deckElement.querySelector('.edit-deck-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent deck click event
            editDeck(deck.id);
        });
        
        // Add click event for delete button
        deckElement.querySelector('.delete-deck-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent deck click event
            if (confirm('Are you sure you want to delete this deck?')) {
                deleteDeck(deck.id);
            }
        });
    });
    
    // Update deck selector
    updateDeckSelector();
}

// Edit a deck
function editDeck(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    
    currentDeck = deck;
    document.getElementById('currentDeckTitle').textContent = `Edit: ${deck.title}`;
    renderCards();
    showEditView();
}

// Render cards for the current deck
function renderCards() {
    const cardsList = document.getElementById('cardsList');
    if (!cardsList || !currentDeck) return;
    
    cardsList.innerHTML = '';
    
    if (currentDeck.cards.length === 0) {
        cardsList.innerHTML = '<p>No cards in this deck yet. Add your first card to get started!</p>';
        return;
    }
    
    currentDeck.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'flashcard-item';
        cardElement.innerHTML = `
            <div class="drag-handle">⋮</div>
            <div class="flashcard-content">
                <div class="flashcard-front">
                    <h4>Question</h4>
                    <p>${card.front}</p>
                </div>
                <div class="flashcard-back">
                    <h4>Answer</h4>
                    <p>${card.back}</p>
                </div>
            </div>
            <div class="flashcard-item-actions">
                <button class="edit-card-btn" data-id="${card.id}">✏️</button>
                <button class="delete-card-btn" data-id="${card.id}">🗑️</button>
            </div>
        `;
        
        cardsList.appendChild(cardElement);
        
        // Add click event for edit button
        cardElement.querySelector('.edit-card-btn').addEventListener('click', () => {
            showEditCardModal(card);
        });
        
        // Add click event for delete button
        cardElement.querySelector('.delete-card-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this card?')) {
                deleteCard(card.id);
            }
        });
    });
    
    // Initialize sortable after rendering
    initSortable();
}

// Update deck selector
function updateDeckSelector() {
    const selector = document.getElementById('deckSelector');
    if (!selector) return;
    
    // Clear existing options except the first
    while (selector.options.length > 1) {
        selector.remove(1);
    }
    
    // Add options for each deck
    decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.title;
        selector.appendChild(option);
    });
}

// Show create deck modal
function showCreateDeckModal() {
    document.getElementById('deckTitle').value = '';
    document.getElementById('deckSubject').value = '';
    document.getElementById('deckDescription').value = '';
    openModal('createDeckModal');
}

// Show edit card modal
function showEditCardModal(card = null) {
    const frontField = document.getElementById('cardFront');
    const backField = document.getElementById('cardBack');
    const tagsField = document.getElementById('cardTags');
    const saveBtn = document.getElementById('saveCardModalBtn');
    
    // Clear fields
    frontField.value = '';
    backField.value = '';
    tagsField.value = '';
    
    if (card) {
        // Edit existing card
        frontField.value = card.front;
        backField.value = card.back;
        tagsField.value = Array.isArray(card.tags) ? card.tags.join(', ') : '';
        saveBtn.textContent = 'Update Card';
        saveBtn.onclick = () => {
            const tags = tagsField.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            editCard(card.id, {
                front: frontField.value,
                back: backField.value,
                tags: tags
            });
            closeModal('createCardModal');
        };
    } else {
        // Add new card
        saveBtn.textContent = 'Add Card';
        saveBtn.onclick = () => {
            const tags = tagsField.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            addCard({
                front: frontField.value,
                back: backField.value,
                tags: tags
            });
            closeModal('createCardModal');
        };
    }
    
    openModal('createCardModal');
}

// Show deck view
function showDeckView() {
    hideAllFlashcardViews();
    document.getElementById('flashcardsDeckView').classList.add('active-view');
}

// Show edit view
function showEditView() {
    hideAllFlashcardViews();
    document.getElementById('flashcardsEditView').classList.add('active-view');
}

// Show study view
function showStudyView() {
    hideAllFlashcardViews();
    document.getElementById('flashcardsStudyView').classList.add('active-view');
}

// Hide all flashcard views
function hideAllFlashcardViews() {
    document.querySelectorAll('.flashcards-view').forEach(view => {
        view.classList.remove('active-view');
    });
}

// Save decks to local storage
function saveDecksToLocalStorage() {
    localStorage.setItem('flashcardDecks', JSON.stringify(decks));
}

// Load decks from local storage
function loadDecksFromLocalStorage() {
    const savedDecks = localStorage.getItem('flashcardDecks');
    if (savedDecks) {
        decks = JSON.parse(savedDecks);
    }
}

// Initialize flashcards feature
function initializeFlashcards() {
    // Load saved decks
    loadDecksFromLocalStorage();
    
    // Render decks
    renderDecks();
    
    // Create deck button
    document.getElementById('createDeckBtn').addEventListener('click', showCreateDeckModal);
    
    // Save deck button in modal
    document.getElementById('saveDeckModalBtn').addEventListener('click', () => {
        const title = document.getElementById('deckTitle').value;
        const subject = document.getElementById('deckSubject').value;
        const description = document.getElementById('deckDescription').value;
        
        if (!title) {
            alert('Please enter a deck title');
            return;
        }
        
        createDeck({
            title: title,
            subject: subject,
            description: description
        });
        
        closeModal('createDeckModal');
    });
    
    // Add card button
    document.getElementById('addCardBtn').addEventListener('click', () => {
        showEditCardModal();
    });
    
    // Back to decks button
    document.getElementById('backToDeckBtn').addEventListener('click', () => {
        showDeckView();
        currentDeck = null;
    });
    
    // Deck selector change
    document.getElementById('deckSelector').addEventListener('change', (e) => {
        const deckId = e.target.value;
        if (deckId) {
            editDeck(deckId);
        }
    });
    
    // Exit study button
    document.getElementById('exitStudyBtn').addEventListener('click', () => {
        showDeckView();
    });
    
    // Flashcard click to flip
    document.getElementById('currentFlashcard').addEventListener('click', () => {
        document.getElementById('currentFlashcard').classList.toggle('flipped');
    });
    
    // Rating buttons
    document.querySelectorAll('.rating-btn').forEach(button => {
        button.addEventListener('click', () => {
            const rating = button.getAttribute('data-rating');
            rateCard(rating);
        });
    });
    
    // Save Deck button
    document.getElementById('saveDeckBtn').addEventListener('click', () => {
        saveDecksToLocalStorage();
        showNotification('Deck saved successfully!');
    });
    
    // Import button
    document.getElementById('importDeckBtn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedDeck = JSON.parse(event.target.result);
                    
                    // Validate imported data
                    if (!importedDeck.title || !Array.isArray(importedDeck.cards)) {
                        throw new Error('Invalid deck format');
                    }
                    
                    // Add imported deck
                    const newDeck = createDeck({
                        title: importedDeck.title,
                        subject: importedDeck.subject || '',
                        description: importedDeck.description || ''
                    });
                    
                    // Add imported cards
                    importedDeck.cards.forEach(card => {
                        if (card.front && card.back) {
                            newDeck.cards.push({
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                front: card.front,
                                back: card.back,
                                tags: card.tags || [],
                                created: new Date().toISOString(),
                                lastReviewed: null,
                                dueDate: null,
                                interval: null,
                                ease: 2.5,
                                repetitions: 0
                            });
                        }
                    });
                    
                    saveDecksToLocalStorage();
                    renderDecks();
                    showNotification('Deck imported successfully!');
                    
                } catch (error) {
                    console.error('Import error:', error);
                    showNotification('Error importing deck. Please check the file format.');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
}

// Initialize video learning features
function initializeVideoLearning() {
    // Get DOM elements
    const searchInput = document.getElementById('videoSearch');
    const searchButton = document.getElementById('searchButton');
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const videoResults = document.getElementById('videoResults');
    const playlistsContainer = document.getElementById('playlistsContainer');

    // Add event listeners
    searchButton.addEventListener('click', handleVideoSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleVideoSearch();
        }
    });
    createPlaylistBtn.addEventListener('click', () => openModal('playlistModal'));

    // Load existing playlists
    loadPlaylists();

    // Add close button event listener
    const closeVideoBtn = document.getElementById('closeVideoBtn');
    closeVideoBtn.addEventListener('click', closeVideoPlayer);

    // Initialize playlists
    loadPlaylistsFromLocalStorage();
    loadPlaylists();

    // Add event listener for save playlist button
    const savePlaylistBtn = document.getElementById('savePlaylistBtn');
    savePlaylistBtn.addEventListener('click', savePlaylist);
}

async function handleVideoSearch() {
    const searchInput = document.getElementById('videoSearch');
    const query = searchInput.value.trim();
    const resultsContainer = document.getElementById('videoResults');

    if (!query) {
        showNotification('Please enter a search term', 'error');
        return;
    }

    try {
        resultsContainer.innerHTML = '<p>Searching...</p>';
        
        const response = await fetch(`http://localhost:3001/api/youtube/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();
        displaySearchResults(data.items);
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p>Error searching videos. Please try again.</p>';
        showNotification('Failed to search videos', 'error');
    }
}

function displaySearchResults(videos) {
    const resultsContainer = document.getElementById('videoResults');
    
    if (!videos || videos.length === 0) {
        resultsContainer.innerHTML = '<p>No videos found</p>';
        return;
    }

    resultsContainer.innerHTML = videos.map(video => `
        <div class="video-card" onclick="playVideo('${video.id.videoId}', '${video.snippet.title.replace(/'/g, "\\'")}')">
            <img class="video-thumbnail" 
                src="${video.snippet.thumbnails.medium.url}" 
                alt="${video.snippet.title}">
            <div class="video-info">
                <h4>${video.snippet.title}</h4>
                <p>${video.snippet.channelTitle}</p>
            </div>
        </div>
    `).join('');
}

function playVideo(videoId, title) {
    const playerContainer = document.getElementById('videoPlayer');
    const playerWrapper = document.getElementById('playerWrapper');
    const videoTitle = document.getElementById('currentVideoTitle');

    // Set current video data
    currentVideo = {
        id: videoId,
        title: title
    };

    // Set the video title
    videoTitle.textContent = title || 'Video Title';
    
    playerContainer.style.display = 'block';
    playerWrapper.innerHTML = `
        <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    // Add "Add to Playlist" button
    const bookmarkSection = playerContainer.querySelector('.bookmark-section');
    const addToPlaylistBtn = document.createElement('button');
    addToPlaylistBtn.className = 'primary-button';
    addToPlaylistBtn.textContent = 'Add to Playlist';
    addToPlaylistBtn.style.marginTop = '1rem';
    addToPlaylistBtn.onclick = () => showAddToPlaylistModal(videoId, title);
    
    // Insert before the bookmarks section
    bookmarkSection.parentNode.insertBefore(addToPlaylistBtn, bookmarkSection);

    // Scroll to player
    playerContainer.scrollIntoView({ behavior: 'smooth' });
}

// Playlist management functions
function savePlaylist() {
    const playlistTitle = document.getElementById('playlistTitle').value;
    const playlistDescription = document.getElementById('playlistDescription').value;

    if (!playlistTitle) {
        showNotification('Please enter a playlist title');
        return;
    }

    const newPlaylist = {
        id: Date.now(), // Use timestamp as unique ID
        title: playlistTitle,
        description: playlistDescription,
        videos: [], // Array to store video IDs and titles
        createdAt: new Date().toISOString()
    };

    playlists.push(newPlaylist);
    savePlaylistsToLocalStorage();
    loadPlaylists(); // Refresh the playlists display
    closeModal('playlistModal');
    showNotification('Playlist created successfully');

    // Clear the form
    document.getElementById('playlistTitle').value = '';
    document.getElementById('playlistDescription').value = '';
}

function savePlaylistsToLocalStorage() {
    localStorage.setItem('videoPlaylists', JSON.stringify(playlists));
}

function loadPlaylistsFromLocalStorage() {
    const savedPlaylists = localStorage.getItem('videoPlaylists');
    if (savedPlaylists) {
        playlists = JSON.parse(savedPlaylists);
    }
}

function loadPlaylists() {
    const playlistsContainer = document.getElementById('playlistsContainer');
    playlistsContainer.innerHTML = '';

    if (playlists.length === 0) {
        playlistsContainer.innerHTML = '<p>No playlists yet. Create one to get started!</p>';
        return;
    }

    playlists.forEach(playlist => {
        const playlistElement = document.createElement('div');
        playlistElement.className = 'playlist-item';
        
        // Playlist header
        const playlistHeader = document.createElement('div');
        playlistHeader.className = 'playlist-header';
        playlistHeader.innerHTML = `
            <h4>${playlist.title}</h4>
            <p>${playlist.description || 'No description'}</p>
            <p class="video-count">${playlist.videos.length} videos</p>
        `;
        playlistElement.appendChild(playlistHeader);
        
        // Videos in playlist
        if (playlist.videos.length > 0) {
            const videosList = document.createElement('div');
            videosList.className = 'playlist-videos';
            
            playlist.videos.forEach((video, index) => {
                const videoItem = document.createElement('div');
                videoItem.className = 'playlist-video-item';
                videoItem.innerHTML = `
                    <span>${index + 1}. ${video.title}</span>
                    <button class="play-video-btn" data-id="${video.id}" data-title="${video.title.replace(/"/g, '&quot;')}">Play</button>
                `;
                videosList.appendChild(videoItem);
                
                // Add event listener to play button
                const playBtn = videoItem.querySelector('.play-video-btn');
                playBtn.addEventListener('click', () => {
                    playVideo(video.id, video.title);
                });
            });
            
            playlistElement.appendChild(videosList);
        }
        
        // Playlist actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'playlist-actions';
        actionsDiv.innerHTML = `
            <button class="delete-button" data-id="${playlist.id}">Delete</button>
        `;
        playlistElement.appendChild(actionsDiv);
        
        // Add event listener for delete button
        const deleteBtn = actionsDiv.querySelector('.delete-button');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlaylist(playlist.id);
        });
        
        playlistsContainer.appendChild(playlistElement);
    });
}

function deletePlaylist(playlistId) {
    if (confirm('Are you sure you want to delete this playlist?')) {
        playlists = playlists.filter(playlist => playlist.id !== playlistId);
        savePlaylistsToLocalStorage();
        loadPlaylists();
        showNotification('Playlist deleted successfully');
    }
}

// Add this function to add a video to a playlist
function addVideoToPlaylist(videoId, videoTitle, playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
        showNotification('Playlist not found', 'error');
        return;
    }

    // Check if video already exists in the playlist
    const videoExists = playlist.videos.some(v => v.id === videoId);
    if (videoExists) {
        showNotification('Video already in playlist');
        return;
    }

    // Add the video to the playlist
    playlist.videos.push({
        id: videoId,
        title: videoTitle,
        addedAt: new Date().toISOString()
    });
    
    // Save and reload
    savePlaylistsToLocalStorage();
    loadPlaylists();
    showNotification('Video added to playlist successfully');
}

// Add this function to handle closing the video player
function closeVideoPlayer() {
    const playerContainer = document.getElementById('videoPlayer');
    const playerWrapper = document.getElementById('playerWrapper');
    
    // Clear the iframe content
    playerWrapper.innerHTML = '';
    // Hide the video player container
    playerContainer.style.display = 'none';
}

// Add a function to show the Add to Playlist modal
function showAddToPlaylistModal(videoId, videoTitle) {
    // Save current video info for use in the modal
    currentVideo = {
        id: videoId,
        title: videoTitle
    };
    
    // Populate the playlist dropdown
    const selectPlaylist = document.getElementById('selectPlaylist');
    selectPlaylist.innerHTML = '<option value="">Choose a playlist</option>';
    
    if (playlists.length === 0) {
        // No playlists available
        showNotification('Please create a playlist first');
        closeModal('addToPlaylistModal');
        openModal('playlistModal');
        return;
    }
    
    // Add playlists to the dropdown
    playlists.forEach(playlist => {
        const option = document.createElement('option');
        option.value = playlist.id;
        option.textContent = playlist.title;
        selectPlaylist.appendChild(option);
    });
    
    // Add event listener to the confirm button
    const confirmButton = document.getElementById('confirmAddToPlaylistBtn');
    // Remove any existing event listeners
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    // Add new event listener
    newConfirmButton.addEventListener('click', () => {
        const selectedPlaylistId = selectPlaylist.value;
        if (!selectedPlaylistId) {
            showNotification('Please select a playlist');
            return;
        }
        
        // Add to the selected playlist
        addVideoToPlaylist(currentVideo.id, currentVideo.title, parseInt(selectedPlaylistId));
        closeModal('addToPlaylistModal');
    });
    
    // Show the modal
    openModal('addToPlaylistModal');
}

// Render shared documents
function renderDocuments() {
    const documentsList = document.getElementById('documentsList');
    if (!documentsList) return;
    
    documentsList.innerHTML = '';
    
    if (documents.length === 0) {
        documentsList.innerHTML = '<p>No documents yet. Create or upload a document to get started!</p>';
        return;
    }
    
    documents.forEach(doc => {
        const docElement = document.createElement('div');
        docElement.className = 'document-item';
        docElement.innerHTML = `
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p>Last edited: ${new Date(doc.lastEdited).toLocaleDateString()}</p>
                <p>Shared with: ${doc.sharedWith.length} people</p>
            </div>
            <div class="document-actions">
                <button class="secondary-button edit-doc-btn" data-id="${doc.id}">Edit</button>
                <button class="delete-button delete-doc-btn" data-id="${doc.id}">Delete</button>
            </div>
        `;
        
        documentsList.appendChild(docElement);
        
        // Add event listeners
        docElement.querySelector('.edit-doc-btn').addEventListener('click', () => {
            openDocument(doc.id);
        });
        
        docElement.querySelector('.delete-doc-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this document?')) {
                deleteDocument(doc.id);
            }
        });
    });
}

// Create a new document
function createNewDocument() {
    const newDoc = {
        id: Date.now().toString(),
        title: 'Untitled Document',
        content: '',
        owner: collaborators[0].id,
        sharedWith: [],
        created: new Date().toISOString(),
        lastEdited: new Date().toISOString()
    };
    
    documents.push(newDoc);
    saveCollaborationData();
    renderDocuments();
    
    // Open the document editor
    openDocument(newDoc.id);
}

// Upload a document
function uploadDocument() {
    // In a real app, this would open a file picker
    // For now, we'll simulate it with a sample document
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf,.md';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // For demo purposes, we'll just create a new document with the file name
        const newDoc = {
            id: Date.now().toString(),
            title: file.name,
            content: `This is a placeholder for the content of "${file.name}"`,
            owner: collaborators[0].id,
            sharedWith: [],
            created: new Date().toISOString(),
            lastEdited: new Date().toISOString()
        };
        
        documents.push(newDoc);
        saveCollaborationData();
        renderDocuments();
        showNotification(`Document "${file.name}" uploaded`);
    };
    
    input.click();
}

// Open a document for editing
function openDocument(docId) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    currentDocument = doc;
    
    // Set document title
    document.getElementById('documentTitle').value = doc.title;
    
    // Set document content
    document.getElementById('editor').innerHTML = doc.content || '';
    
    // Show document editor
    document.getElementById('documentEditor').style.display = 'block';
    hideCollaborationSections();
}

// Save the current document
function saveDocument() {
    if (!currentDocument) return;
    
    // Update document properties
    currentDocument.title = document.getElementById('documentTitle').value || 'Untitled Document';
    currentDocument.content = document.getElementById('editor').innerHTML;
    currentDocument.lastEdited = new Date().toISOString();
    
    saveCollaborationData();
    showNotification('Document saved');
}

// Close the document editor
function closeDocumentEditor() {
    document.getElementById('documentEditor').style.display = 'none';
    showCollaborationSections();
    currentDocument = null;
}

// Share a document with others
function shareDocument() {
    if (!currentDocument) return;
    
    // Generate a share link (in a real app, this would be a valid URL)
    const shareLink = `https://studyplanner.example/share/${currentDocument.id}`;
    document.getElementById('documentLink').textContent = shareLink;
    
    openModal('shareDocumentModal');
    
    // Set up copy button
    document.getElementById('copyDocLinkBtn').onclick = () => {
        navigator.clipboard.writeText(shareLink)
            .then(() => {
                showNotification('Link copied to clipboard');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    };
    
    // Set up share button
    document.getElementById('sendShareBtn').onclick = () => {
        const email = document.getElementById('shareEmail').value;
        if (!email) {
            showNotification('Please enter an email address');
            return;
        }
        
        const permission = document.getElementById('sharePermission').value;
        
        // In a real app, this would send an email
        showNotification(`Document would be shared with ${email} (${permission} permission) in a real app`);
        
        // Add to shared list
        if (!currentDocument.sharedWith.some(share => share.email === email)) {
            currentDocument.sharedWith.push({
                email,
                permission,
                sharedOn: new Date().toISOString()
            });
            
            saveCollaborationData();
        }
        
        document.getElementById('shareEmail').value = '';
        closeModal('shareDocumentModal');
    };
}

// Delete a document
function deleteDocument(docId) {
    // Check if document is currently open
    if (currentDocument && currentDocument.id === docId) {
        closeDocumentEditor();
    }
    
    documents = documents.filter(doc => doc.id !== docId);
    saveCollaborationData();
    renderDocuments();
    showNotification('Document deleted');
}

// Initialize the document editor
function initializeDocumentEditor() {
    // Set up document editor toolbar
    document.querySelectorAll('.editor-toolbar button, .editor-toolbar select').forEach(item => {
        item.addEventListener('click', function(e) {
            const command = this.dataset.command;
            if (!command) return;
            
            if (command === 'createLink') {
                const url = prompt('Enter the link URL');
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, null);
            }
        });
    });
    
    // Handle color inputs
    document.querySelectorAll('.editor-toolbar input[type="color"]').forEach(colorBtn => {
        colorBtn.addEventListener('input', function(e) {
            const command = this.dataset.command;
            document.execCommand(command, false, this.value);
        });
    });
    
    // Handle dropdowns
    document.querySelectorAll('.editor-toolbar select').forEach(select => {
        select.addEventListener('change', function(e) {
            const command = this.dataset.command;
            document.execCommand(command, false, this.value);
        });
    });
}

// Render shared calendar
function renderSharedCalendar() {
    const calendarContainer = document.getElementById('sharedCalendarView');
    if (!calendarContainer) return;
    
    // Show the shared calendar container
    document.getElementById('sharedCalendarContainer').style.display = 'block';
    hideCollaborationSections();
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    renderSharedCalendarMonth(currentMonth, currentYear);
    renderSharedEvents();
    
    // Set up navigation buttons
    document.getElementById('prevMonthShared').addEventListener('click', () => {
        const monthDisplay = document.getElementById('currentMonthShared');
        const [month, year] = monthDisplay.dataset.date.split('-').map(Number);
        const newDate = new Date(year, month - 1, 1);
        renderSharedCalendarMonth(newDate.getMonth(), newDate.getFullYear());
    });
    
    document.getElementById('nextMonthShared').addEventListener('click', () => {
        const monthDisplay = document.getElementById('currentMonthShared');
        const [month, year] = monthDisplay.dataset.date.split('-').map(Number);
        const newDate = new Date(year, month + 1, 1);
        renderSharedCalendarMonth(newDate.getMonth(), newDate.getFullYear());
    });
    
    // Set up "Back to Hub" button
    document.getElementById('backToHubBtn').addEventListener('click', () => {
        document.getElementById('sharedCalendarContainer').style.display = 'none';
        showCollaborationSections();
    });
}

// Render a month for the shared calendar
function renderSharedCalendarMonth(month, year) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Update the month/year display
    const monthDisplay = document.getElementById('currentMonthShared');
    monthDisplay.textContent = `${monthNames[month]} ${year}`;
    monthDisplay.dataset.date = `${month}-${year}`;
    
    // Create the calendar grid
    const calendarGrid = document.getElementById('sharedCalendarGrid');
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add blank cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const blankDay = document.createElement('div');
        blankDay.className = 'calendar-day empty';
        calendarGrid.appendChild(blankDay);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateFormatted = date.toISOString().split('T')[0];
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.dataset.date = dateFormatted;
        
        // Check if today
        if (date.setHours(0,0,0,0) === new Date().setHours(0,0,0,0)) {
            dayCell.classList.add('today');
        }
        
        // Add the day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        // Add events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        dayCell.appendChild(eventsContainer);
        
        // Add events for this day
        const dayEvents = sharedEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === year && 
                   eventDate.getMonth() === month && 
                   eventDate.getDate() === day;
        });
        
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event';
            eventElement.style.backgroundColor = event.color || '#4285f4';
            eventElement.textContent = event.title;
            eventElement.dataset.eventId = event.id;
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showEventDetails(event.id);
            });
            eventsContainer.appendChild(eventElement);
        });
        
        // Add click event to add new event
        dayCell.addEventListener('click', () => {
            document.getElementById('eventDate').value = dateFormatted;
            openModal('addEventModal');
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

// Render shared events list
function renderSharedEvents() {
    const eventsList = document.getElementById('sharedEventsList');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    if (sharedEvents.length === 0) {
        eventsList.innerHTML = '<p>No events yet. Add an event to get started!</p>';
        return;
    }
    
    // Sort events by date
    const sortedEvents = [...sharedEvents].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
        return dateA - dateB;
    });
    
    sortedEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
            <div class="event-color" style="background-color: ${event.color || '#4285f4'}"></div>
            <div class="event-info">
                <h4>${event.title}</h4>
                <p>${formatEventDateTime(event)}</p>
            </div>
            <div class="event-actions">
                <button class="secondary-button view-event-btn" data-id="${event.id}">View</button>
                <button class="delete-button delete-event-btn" data-id="${event.id}">Delete</button>
            </div>
        `;
        
        eventsList.appendChild(eventElement);
        
        // Add event listeners
        eventElement.querySelector('.view-event-btn').addEventListener('click', () => {
            showEventDetails(event.id);
        });
        
        eventElement.querySelector('.delete-event-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this event?')) {
                deleteEvent(event.id);
            }
        });
    });
}

// Format event date and time for display
function formatEventDateTime(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString();
    
    if (event.time) {
        return `${formattedDate} at ${event.time}`;
    }
    return formattedDate;
}

// Add a new event to the shared calendar
function addEvent() {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const description = document.getElementById('eventDescription').value;
    const color = document.getElementById('eventColor').value;
    const isShared = document.getElementById('eventShared').checked;
    
    if (!title || !date) {
        showNotification('Event title and date are required');
        return;
    }
    
    const newEvent = {
        id: Date.now().toString(),
        title,
        date,
        time,
        description,
        color,
        isShared,
        createdBy: collaborators[0].id,
        createdAt: new Date().toISOString()
    };
    
    sharedEvents.push(newEvent);
    saveCollaborationData();
    
    // Reset form
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventColor').value = '#4285f4';
    document.getElementById('eventShared').checked = true;
    
    closeModal('addEventModal');
    renderSharedCalendarMonth(new Date(date).getMonth(), new Date(date).getFullYear());
    renderSharedEvents();
    showNotification('Event added to calendar');
}

// Show event details
function showEventDetails(eventId) {
    const event = sharedEvents.find(e => e.id === eventId);
    if (!event) return;
    
    document.getElementById('eventDetailTitle').textContent = event.title;
    document.getElementById('eventDetailDate').textContent = new Date(event.date).toLocaleDateString();
    document.getElementById('eventDetailTime').textContent = event.time || 'All day';
    document.getElementById('eventDetailDescription').textContent = event.description || 'No description provided';
    
    const creatorName = collaborators.find(c => c.id === event.createdBy)?.name || 'Unknown user';
    document.getElementById('eventDetailCreator').textContent = `Created by: ${creatorName}`;
    
    // Set up delete button
    document.getElementById('deleteEventBtn').onclick = () => {
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEvent(event.id);
            closeModal('eventDetailModal');
        }
    };
    
    openModal('eventDetailModal');
}

// Delete an event
function deleteEvent(eventId) {
    sharedEvents = sharedEvents.filter(event => event.id !== eventId);
    saveCollaborationData();
    renderSharedCalendarMonth(
        new Date().getMonth(), 
        new Date().getFullYear()
    );
    renderSharedEvents();
    showNotification('Event deleted');
}

// Show collaboration sections
function showCollaborationSections() {
    document.getElementById('collaborationContainer').style.display = 'flex';
    document.getElementById('hubControls').style.display = 'flex';
    document.getElementById('roomView').style.display = 'none';
    document.getElementById('documentEditor').style.display = 'none';
    document.getElementById('sharedCalendarContainer').style.display = 'none';
}

// Initialize a mock socket connection
function initializeSocketConnection() {
    // In a real app, this would connect to a real Socket.IO server
    // For demo purposes, we'll create a mock implementation
    
    // Initialize fake collaborators (in a real app, these would come from the server)
    if (collaborators.length === 0) {
        collaborators = [
            {
                id: 'user-' + Date.now(),
                name: localStorage.getItem('username') || 'Current User',
                isCurrentUser: true,
                status: 'online',
                avatar: 'https://ui-avatars.com/api/?name=Current+User&background=random'
            }
        ];
        
        // Add some mock collaborators for demo
        const mockCollaborators = [
            {
                id: 'user-1',
                name: 'Alex Johnson',
                isCurrentUser: false,
                status: 'online',
                avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random'
            },
            {
                id: 'user-2',
                name: 'Sam Taylor',
                isCurrentUser: false,
                status: 'away',
                avatar: 'https://ui-avatars.com/api/?name=Sam+Taylor&background=random'
            }
        ];
        
        collaborators = [...collaborators, ...mockCollaborators];
    }
    
    console.log('Socket connection initialized (mock)');
    console.log('Collaborators:', collaborators);
    
    // Mock socket events for demonstration
    socket = {
        emit: function(event, data) {
            console.log(`Socket emit: ${event}`, data);
            
            // Simulate incoming messages for demo purposes
            if (event === 'send_message' && currentRoom) {
                // Simulate a response after a short delay
                setTimeout(() => {
                    if (Math.random() > 0.7) {
                        // Simulate a response from a mock user
                        const mockUser = collaborators.find(c => !c.isCurrentUser);
                        if (mockUser) {
                            const mockResponse = {
                                id: 'msg-' + Date.now(),
                                roomId: currentRoom.id,
                                senderId: mockUser.id,
                                senderName: mockUser.name,
                                content: getRandomResponse(data.content),
                                timestamp: new Date().toISOString()
                            };
                            
                            // Add to room messages
                            const room = studyRooms.find(r => r.id === currentRoom.id);
                            if (room) {
                                room.messages.push(mockResponse);
                                saveCollaborationData();
                                renderRoomChat();
                            }
                        }
                    }
                }, 2000 + Math.random() * 3000);
            }
        },
        on: function(event, callback) {
            console.log(`Socket listening for: ${event}`);
        },
        disconnected: false
    };
}

// Get a random response for simulating chat interactions
function getRandomResponse(message) {
    const responses = [
        "That's a good point!",
        "I agree with what you're saying.",
        "Interesting perspective, I hadn't thought of it that way.",
        "Could you explain that in more detail?",
        "Thanks for sharing that information.",
        "I found a resource that might help with this topic.",
        "Let's schedule a study session to discuss this further.",
        "Have you reviewed the lecture notes on this topic?",
        "I'm a bit confused about this concept too.",
        "Great explanation!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Helper function to get a random color for events and elements
function getRandomColor() {
    const colors = [
        '#4285f4', // Blue
        '#ea4335', // Red
        '#fbbc05', // Yellow
        '#34a853', // Green
        '#8e24aa', // Purple
        '#16a085', // Teal
        '#f39c12', // Orange
        '#d35400', // Deep Orange
        '#7f8c8d', // Gray
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Create and show a notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Helper function for opening modals
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
}

// Helper function for closing modals
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Hide all collaboration sections except specified one
function hideCollaborationSections() {
    document.getElementById('collaborationContainer').style.display = 'none';
    document.getElementById('hubControls').style.display = 'none';
}

// Initialize collaboration hub
function initializeCollaborationHub() {
    console.log('Initializing Collaboration Hub');
    
    // Load saved collaboration data
    loadCollaborationData();
    
    // Initialize socket connection for real-time features
    initializeSocketConnection();
    
    // Set up event listeners for room creation and joining
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            openModal('createRoomModal');
        });
    }
    
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', () => {
            openModal('joinRoomModal');
        });
    }
    
    const sharedCalendarBtn = document.getElementById('sharedCalendarBtn');
    if (sharedCalendarBtn) {
        sharedCalendarBtn.addEventListener('click', () => {
            document.getElementById('sharedCalendarContainer').style.display = 'block';
            hideCollaborationSections();
            renderSharedCalendarMonth(new Date().getMonth(), new Date().getFullYear());
            renderSharedEvents();
            
            // Back to hub button
            document.getElementById('closeSharedCalendarBtn').addEventListener('click', () => {
                document.getElementById('sharedCalendarContainer').style.display = 'none';
                showCollaborationSections();
            });
            
            // Calendar navigation buttons
            document.getElementById('prevMonthBtn').addEventListener('click', () => {
                const monthDisplay = document.getElementById('sharedCalendarMonth');
                const [month, year] = monthDisplay.dataset.date.split('-').map(Number);
                const newDate = new Date(year, month - 1, 1);
                renderSharedCalendarMonth(newDate.getMonth(), newDate.getFullYear());
            });
            
            document.getElementById('nextMonthBtn').addEventListener('click', () => {
                const monthDisplay = document.getElementById('sharedCalendarMonth');
                const [month, year] = monthDisplay.dataset.date.split('-').map(Number);
                const newDate = new Date(year, month + 1, 1);
                renderSharedCalendarMonth(newDate.getMonth(), newDate.getFullYear());
            });
            
            // Add event button
            document.getElementById('addEventBtn').addEventListener('click', () => {
                document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
                openModal('addEventModal');
            });
        });
    }
    
    // Set up document buttons
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    if (uploadDocBtn) {
        uploadDocBtn.addEventListener('click', uploadDocument);
    }
    
    const createDocBtn = document.getElementById('createDocBtn');
    if (createDocBtn) {
        createDocBtn.addEventListener('click', createNewDocument);
    }
    
    // Set up room creation modal
    const confirmCreateRoomBtn = document.getElementById('confirmCreateRoomBtn');
    if (confirmCreateRoomBtn) {
        confirmCreateRoomBtn.addEventListener('click', () => {
            const roomName = document.getElementById('roomName').value;
            const roomTopic = document.getElementById('roomTopic').value;
            const roomPrivacy = document.getElementById('roomPrivacy').value;
            
            if (roomName.trim() === '') {
                showNotification('Room name is required', 'error');
                return;
            }
            
            createStudyRoom(roomName, roomTopic, roomPrivacy);
            closeModal('createRoomModal');
        });
    }
    
    // Set up join room modal
    const confirmJoinRoomBtn = document.getElementById('confirmJoinRoomBtn');
    if (confirmJoinRoomBtn) {
        confirmJoinRoomBtn.addEventListener('click', () => {
            const roomCode = document.getElementById('roomCode').value;
            
            if (roomCode.trim() === '') {
                showNotification('Room code is required', 'error');
                return;
            }
            
            joinStudyRoom(roomCode);
            closeModal('joinRoomModal');
        });
    }
    
    // Set up document editor buttons
    const saveDocumentBtn = document.getElementById('saveDocumentBtn');
    if (saveDocumentBtn) {
        saveDocumentBtn.addEventListener('click', saveDocument);
    }
    
    const closeEditorBtn = document.getElementById('closeEditorBtn');
    if (closeEditorBtn) {
        closeEditorBtn.addEventListener('click', closeDocumentEditor);
    }
    
    const shareDocumentBtn = document.getElementById('shareDocumentBtn');
    if (shareDocumentBtn) {
        shareDocumentBtn.addEventListener('click', shareDocument);
    }
    
    // Set up event listeners for room interaction
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', leaveCurrentRoom);
    }
    
    const inviteBtn = document.getElementById('inviteBtn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', showInviteModal);
    }
    
    const sendRoomChatBtn = document.getElementById('sendRoomChatBtn');
    if (sendRoomChatBtn) {
        sendRoomChatBtn.addEventListener('click', () => {
            const input = document.getElementById('roomChatInput');
            if (input && input.value.trim() !== '') {
                sendRoomChatMessage(input.value);
                input.value = '';
            }
        });
    }
    
    const roomChatInput = document.getElementById('roomChatInput');
    if (roomChatInput) {
        roomChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendRoomChatBtn.click();
            }
        });
    }
    
    // Set up whiteboard controls
    const clearWhiteboardBtn = document.getElementById('clearWhiteboardBtn');
    if (clearWhiteboardBtn) {
        clearWhiteboardBtn.addEventListener('click', clearWhiteboard);
    }
    
    // Initialize the room, document, and calendar views
    renderStudyRooms();
    renderDocuments();
    
    // Initialize document editor
    initializeDocumentEditor();
}

// Load collaboration data from local storage
function loadCollaborationData() {
    try {
        // Load study rooms
        const savedRooms = localStorage.getItem('studyRooms');
        if (savedRooms) {
            studyRooms = JSON.parse(savedRooms);
        }
        
        // Load documents
        const savedDocuments = localStorage.getItem('documents');
        if (savedDocuments) {
            documents = JSON.parse(savedDocuments);
        }
        
        // Load shared events
        const savedEvents = localStorage.getItem('sharedEvents');
        if (savedEvents) {
            sharedEvents = JSON.parse(savedEvents);
        }
        
        console.log('Collaboration data loaded:', {
            rooms: studyRooms.length,
            documents: documents.length,
            events: sharedEvents.length
        });
    } catch (error) {
        console.error('Error loading collaboration data:', error);
        // Initialize empty arrays if loading fails
        studyRooms = [];
        documents = [];
        sharedEvents = [];
    }
}

// Save collaboration data to local storage
function saveCollaborationData() {
    try {
        localStorage.setItem('studyRooms', JSON.stringify(studyRooms));
        localStorage.setItem('documents', JSON.stringify(documents));
        localStorage.setItem('sharedEvents', JSON.stringify(sharedEvents));
        
        console.log('Collaboration data saved');
    } catch (error) {
        console.error('Error saving collaboration data:', error);
        showNotification('Error saving data. Storage might be full.', 'error');
    }
}

// Render study rooms
function renderStudyRooms() {
    const roomsList = document.getElementById('studyRoomsList');
    if (!roomsList) return;
    
    roomsList.innerHTML = '';
    
    if (studyRooms.length === 0) {
        roomsList.innerHTML = '<p>No study rooms yet. Create or join a room to get started!</p>';
        return;
    }
    
    studyRooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'room-item';
        roomElement.innerHTML = `
            <div class="room-info">
                <h4>${room.name}</h4>
                <p>Topic: ${room.topic || 'General'}</p>
                <div class="room-badge ${room.isPrivate ? 'badge-private' : ''}">${room.isPrivate ? 'Private' : 'Public'}</div>
                <p>Participants: ${room.participants.length}</p>
            </div>
            <div class="room-actions">
                <button class="secondary-button enter-room-btn" data-id="${room.id}">Enter</button>
                <button class="delete-button delete-room-btn" data-id="${room.id}">Delete</button>
            </div>
        `;
        
        roomsList.appendChild(roomElement);
        
        // Add event listeners
        roomElement.querySelector('.enter-room-btn').addEventListener('click', () => {
            enterRoom(room.id);
        });
        
        roomElement.querySelector('.delete-room-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this room?')) {
                deleteStudyRoom(room.id);
            }
        });
    });
}

// Create a new study room
function createStudyRoom(name, topic, privacy) {
    // Generate a unique room code
    const roomCode = generateRoomCode();
    
    const newRoom = {
        id: Date.now().toString(),
        name,
        topic: topic || 'General Study',
        isPrivate: privacy === 'private',
        code: roomCode,
        participants: [
            {
                id: collaborators[0].id,
                name: collaborators[0].name,
                isHost: true,
                joinedAt: new Date().toISOString()
            }
        ],
        messages: [
            {
                id: 'sys-' + Date.now(),
                roomId: Date.now().toString(),
                senderId: 'system',
                senderName: 'System',
                content: `Room "${name}" created by ${collaborators[0].name}`,
                timestamp: new Date().toISOString(),
                isSystem: true
            }
        ],
        whiteboard: {
            objects: [],
            lastUpdated: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        createdBy: collaborators[0].id
    };
    
    studyRooms.push(newRoom);
    saveCollaborationData();
    renderStudyRooms();
    showNotification(`Study room "${name}" created`);
    
    // Automatically enter the new room
    enterRoom(newRoom.id);
    
    return newRoom;
}

// Join a study room using room code
function joinStudyRoom(roomCode) {
    const room = studyRooms.find(r => r.code === roomCode);
    
    if (!room) {
        showNotification('Invalid room code. Room not found.', 'error');
        return false;
    }
    
    // Check if user is already in the room
    if (room.participants.some(p => p.id === collaborators[0].id)) {
        showNotification('You are already a participant in this room');
        enterRoom(room.id);
        return true;
    }
    
    // Add the user to the participants
    room.participants.push({
        id: collaborators[0].id,
        name: collaborators[0].name,
        isHost: false,
        joinedAt: new Date().toISOString()
    });
    
    // Add system message
    room.messages.push({
        id: 'sys-' + Date.now(),
        roomId: room.id,
        senderId: 'system',
        senderName: 'System',
        content: `${collaborators[0].name} joined the room`,
        timestamp: new Date().toISOString(),
        isSystem: true
    });
    
    saveCollaborationData();
    renderStudyRooms();
    showNotification(`Joined study room "${room.name}"`);
    
    // Enter the room
    enterRoom(room.id);
    
    return true;
}

// Enter a study room
function enterRoom(roomId) {
    const room = studyRooms.find(r => r.id === roomId);
    if (!room) {
        showNotification('Room not found', 'error');
        return;
    }
    
    currentRoom = room;
    
    // Update UI to show room
    document.getElementById('roomView').style.display = 'block';
    hideCollaborationSections();
    
    // Update room details
    document.getElementById('currentRoomName').textContent = room.name;
    
    // Render participants and chat
    renderRoomParticipants();
    renderRoomChat();
    
    // Initialize whiteboard
    initializeWhiteboard();
    
    console.log('Entered room:', room.name);
}

// Leave the current room
function leaveCurrentRoom() {
    if (!currentRoom) return;
    
    document.getElementById('roomView').style.display = 'none';
    showCollaborationSections();
    
    currentRoom = null;
    console.log('Left room');
}

// Delete a study room
function deleteStudyRoom(roomId) {
    // If we're currently in this room, leave it first
    if (currentRoom && currentRoom.id === roomId) {
        leaveCurrentRoom();
    }
    
    studyRooms = studyRooms.filter(room => room.id !== roomId);
    saveCollaborationData();
    renderStudyRooms();
    showNotification('Study room deleted');
}

// Show the invite modal for the current room
function showInviteModal() {
    if (!currentRoom) return;
    
    // Set the room code in the modal
    document.getElementById('roomCodeDisplay').textContent = currentRoom.code;
    
    // Set up copy button
    document.getElementById('copyRoomCodeBtn').onclick = () => {
        navigator.clipboard.writeText(currentRoom.code)
            .then(() => {
                showNotification('Room code copied to clipboard');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    };
    
    // Set up send invitation button
    document.getElementById('sendInviteBtn').onclick = () => {
        const email = document.getElementById('inviteEmail').value;
        if (!email) {
            showNotification('Please enter an email address');
            return;
        }
        
        // In a real app, this would send an email
        showNotification(`Invitation would be sent to ${email} in a real app`);
        document.getElementById('inviteEmail').value = '';
        closeModal('inviteRoomModal');
    };
    
    openModal('inviteRoomModal');
}

// Render room participants
function renderRoomParticipants() {
    if (!currentRoom) return;
    
    const participantsList = document.getElementById('roomParticipants');
    if (!participantsList) return;
    
    participantsList.innerHTML = '';
    
    currentRoom.participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.className = 'participant-item';
        
        // Find the collaborator to get the avatar and status
        const collaborator = collaborators.find(c => c.id === participant.id) || {
            avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(participant.name),
            status: 'offline'
        };
        
        participantElement.innerHTML = `
            <div class="participant-avatar" style="background-image: url('${collaborator.avatar}')"></div>
            <div class="participant-info">
                <span>${participant.name}</span>
                ${participant.isHost ? '<span class="host-badge">Host</span>' : ''}
                <span class="status-indicator ${collaborator.status}"></span>
            </div>
        `;
        
        participantsList.appendChild(participantElement);
    });
}

// Send a chat message in the current room
function sendRoomChatMessage(content) {
    if (!currentRoom || !content.trim()) return;
    
    const message = {
        id: 'msg-' + Date.now(),
        roomId: currentRoom.id,
        senderId: collaborators[0].id,
        senderName: collaborators[0].name,
        content: content.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Add to room messages
    currentRoom.messages.push(message);
    saveCollaborationData();
    renderRoomChat();
    
    // In a real app, this would emit a message via socket
    if (socket) {
        socket.emit('send_message', {
            roomId: currentRoom.id,
            content: content.trim()
        });
    }
}

// Render chat messages for the current room
function renderRoomChat() {
    if (!currentRoom) return;
    
    const chatContainer = document.getElementById('roomChat');
    if (!chatContainer) return;
    
    chatContainer.innerHTML = '';
    
    currentRoom.messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        if (message.isSystem) {
            messageElement.classList.add('system-message');
            messageElement.innerHTML = `
                <div class="chat-content">${message.content}</div>
                <div class="chat-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
            `;
        } else {
            // Determine if this is from the current user
            const isSender = message.senderId === collaborators[0].id;
            messageElement.classList.add(isSender ? 'sender' : 'receiver');
            
            messageElement.innerHTML = `
                <div class="chat-sender">${message.senderName}</div>
                <div class="chat-content">${message.content}</div>
                <div class="chat-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
            `;
        }
        
        chatContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Initialize the whiteboard
function initializeWhiteboard() {
    const whiteboardElement = document.getElementById('whiteboard');
    if (!whiteboardElement || !fabric || !currentRoom) return;
    
    // Create a new fabric canvas
    canvas = new fabric.Canvas('whiteboard', {
        isDrawingMode: true,
        width: whiteboardElement.offsetWidth,
        height: 400
    });
    
    // Load saved whiteboard state if it exists
    if (currentRoom.whiteboard && currentRoom.whiteboard.objects) {
        try {
            canvas.loadFromJSON(currentRoom.whiteboard.objects, canvas.renderAll.bind(canvas));
        } catch (error) {
            console.error('Error loading whiteboard:', error);
        }
    }
    
    // Set up drawing tools
    document.getElementById('whiteboardTool').addEventListener('change', function(e) {
        const tool = e.target.value;
        if (tool === 'pen') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.width = 2;
            canvas.freeDrawingBrush.color = document.getElementById('whiteboardColor').value;
        } else if (tool === 'eraser') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.width = 10;
            canvas.freeDrawingBrush.color = '#ffffff';
        } else if (tool === 'text') {
            canvas.isDrawingMode = false;
            addTextToWhiteboard();
        }
    });
    
    // Set up color change
    document.getElementById('whiteboardColor').addEventListener('input', function(e) {
        if (canvas.isDrawingMode && document.getElementById('whiteboardTool').value !== 'eraser') {
            canvas.freeDrawingBrush.color = e.target.value;
        }
    });
    
    // Save whiteboard state on changes
    canvas.on('object:added', saveWhiteboardState);
    canvas.on('object:modified', saveWhiteboardState);
    canvas.on('object:removed', saveWhiteboardState);
}

// Add text to the whiteboard
function addTextToWhiteboard() {
    if (!canvas) return;
    
    const text = prompt('Enter text:');
    if (!text) return;
    
    const textObject = new fabric.IText(text, {
        left: Math.random() * (canvas.width - 100),
        top: Math.random() * (canvas.height - 50),
        fontFamily: 'Arial',
        fill: document.getElementById('whiteboardColor').value,
        fontSize: 20
    });
    
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    saveWhiteboardState();
}

// Save the whiteboard state
function saveWhiteboardState() {
    if (!canvas || !currentRoom) return;
    
    currentRoom.whiteboard = {
        objects: JSON.stringify(canvas.toJSON()),
        lastUpdated: new Date().toISOString()
    };
    
    saveCollaborationData();
}

// Clear the whiteboard
function clearWhiteboard() {
    if (!canvas) return;
    
    if (confirm('Are you sure you want to clear the whiteboard? This cannot be undone.')) {
        canvas.clear();
        saveWhiteboardState();
    }
}

// Generate a random room code
function generateRoomCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, 1, I
    let code = '';
    
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return code;
}

// Add this code to fix the shared calendar button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait until DOM is fully loaded
    setTimeout(() => {
        const sharedCalendarBtn = document.getElementById('sharedCalendarBtn');
        if (sharedCalendarBtn) {
            sharedCalendarBtn.addEventListener('click', function() {
                console.log('Shared Calendar button clicked');
                
                // Get the calendar view element
                const calendarView = document.getElementById('sharedCalendarView');
                if (calendarView) {
                    // Show the calendar view
                    calendarView.style.display = 'block';
                    
                    // Hide other sections
                    const collaborationContainer = document.getElementById('collaborationContainer');
                    const hubControls = document.getElementById('hubControls');
                    
                    if (collaborationContainer) collaborationContainer.style.display = 'none';
                    if (hubControls) hubControls.style.display = 'none';
                    
                    // Setup the month display
                    const currentDate = new Date();
                    const monthNames = ["January", "February", "March", "April", "May", "June", 
                                        "July", "August", "September", "October", "November", "December"];
                    
                    const monthDisplay = document.getElementById('sharedCalendarMonth');
                    if (monthDisplay) {
                        monthDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                        monthDisplay.dataset.date = `${currentDate.getMonth()}-${currentDate.getFullYear()}`;
                    }
                    
                    // Add navigation functionality
                    const prevMonthBtn = document.getElementById('prevMonthBtn');
                    const nextMonthBtn = document.getElementById('nextMonthBtn');
                    const closeBtn = document.getElementById('closeSharedCalendarBtn');
                    
                    if (prevMonthBtn) {
                        prevMonthBtn.onclick = function() {
                            const [month, year] = monthDisplay.dataset.date.split('-').map(Number);
                            const newDate = new Date(year, month - 1, 1);
                            monthDisplay.textContent = `${monthNames[newDate.getMonth()]} ${newDate.getFullYear()}`;
                            monthDisplay.dataset.date = `${newDate.getMonth()}-${newDate.getFullYear()}`;
                        };
                    }
                    
                    if (nextMonthBtn) {
                        nextMonthBtn.onclick = function() {
                            const [month, year] = monthDisplay.dataset.date.split('-').map(Number);
                            const newDate = new Date(year, month + 1, 1);
                            monthDisplay.textContent = `${monthNames[newDate.getMonth()]} ${newDate.getFullYear()}`;
                            monthDisplay.dataset.date = `${newDate.getMonth()}-${newDate.getFullYear()}`;
                        };
                    }
                    
                    if (closeBtn) {
                        closeBtn.onclick = function() {
                            calendarView.style.display = 'none';
                            if (collaborationContainer) collaborationContainer.style.display = 'flex';
                            if (hubControls) hubControls.style.display = 'flex';
                        };
                    }
                    
                    // Setup the add event button
                    const addEventBtn = document.getElementById('addEventBtn');
                    if (addEventBtn) {
                        addEventBtn.onclick = function() {
                            document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
                            openModal('addEventModal');
                        };
                    }
                } else {
                    console.error('Shared calendar view element not found');
                }
            });
        }
    }, 500); // Small delay to ensure all elements are ready
});
