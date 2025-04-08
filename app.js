// ======================
// STATE MANAGEMENT
// ======================
let state = {
    balance: 0,
    goals: JSON.parse(localStorage.getItem('goals')) || [],
    pendingUpdates: JSON.parse(localStorage.getItem('pendingUpdates')) || 0,
    currentUser: null
};

// ======================
// CORE FUNCTIONALITY
// ======================
const GoalManager = {
    createGoal: (name, startDate, endDate, description) => {
        const newGoal = {
            id: Date.now(),
            name,
            startDate,
            endDate,
            description,
            pinned: false,
            progress: 0,
            updates: [],
            pendingVerification: 0
        };
        
        state.goals.push(newGoal);
        localStorage.setItem('goals', JSON.stringify(state.goals));
        return newGoal;
    },

    pinGoal: (goalId) => {
        state.goals.forEach(goal => goal.pinned = goal.id === goalId);
        localStorage.setItem('goals', JSON.stringify(state.goals));
    },

    calculateProgress: (goal) => {
        const start = new Date(goal.startDate);
        const end = new Date(goal.endDate);
        const today = new Date();
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
        return Math.min(Math.round((daysPassed / totalDays) * 100), 100);
    },

    addProgressUpdate: (goalId, imageData) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (goal) {
            goal.pendingVerification++;
            state.pendingUpdates++;
            localStorage.setItem('goals', JSON.stringify(state.goals));
            localStorage.setItem('pendingUpdates', state.pendingUpdates);
        }
    }
};

// ======================
// UI UPDATES
// ======================
const UI = {
    updateBalance: () => {
        document.getElementById('balance').textContent = state.balance.toFixed(2);
    },

    renderPinnedGoal: () => {
        const pinnedGoal = state.goals.find(g => g.pinned);
        if (!pinnedGoal) return;

        document.getElementById('pinnedGoalTitle').textContent = pinnedGoal.name;
        document.getElementById('pinnedGoalMeta').innerHTML = `
            <div>Start: ${new Date(pinnedGoal.startDate).toLocaleDateString()}</div>
            <div>End: ${new Date(pinnedGoal.endDate).toLocaleDateString()}</div>
            <div>Progress: ${GoalManager.calculateProgress(pinnedGoal)}%</div>
        `;
        document.getElementById('mainProgress').style.width = `${GoalManager.calculateProgress(pinnedGoal)}%`;
    },

    renderGoalsPage: () => {
        const container = document.getElementById('goalsContainer');
        container.innerHTML = '';
        
        state.goals.forEach(goal => {
            const goalCard = document.createElement('div');
            goalCard.className = `goal-card ${goal.pinned ? 'pinned-goal' : ''}`;
            goalCard.innerHTML = `
                <h3>${goal.name}</h3>
                <div class="project-meta">
                    <div>Start: ${new Date(goal.startDate).toLocaleDateString()}</div>
                    <div>End: ${new Date(goal.endDate).toLocaleDateString()}</div>
                    <div>Progress: ${GoalManager.calculateProgress(goal)}%</div>
                    ${goal.pendingVerification ? `<div class="pending-badge">Pending: ${goal.pendingVerification}</div>` : ''}
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${GoalManager.calculateProgress(goal)}%"></div>
                </div>
                <button class="update-btn" onclick="handleProgressUpdate(${goal.id})">
                    UPDATE PROGRESS
                </button>
            `;
            container.appendChild(goalCard);
        });
    },

    showNotification: (message, type = 'success', duration = 3000) => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}-notification`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
};

// ======================
// EVENT HANDLERS
// ======================
const EventHandlers = {
    handleCreateGoal: () => {
        const name = document.getElementById('goalName').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const description = document.getElementById('goalDescription').value;

        if (!name || !startDate || !endDate) {
            UI.showNotification('Please fill all required fields', 'danger');
            return;
        }

        const newGoal = GoalManager.createGoal(name, startDate, endDate, description);
        UI.showNotification(`${newGoal.name} created! Check My Goals!`);
        setTimeout(() => window.location.href = 'goals.html', 1500);
    },

    handleProgressUpdate: async (goalId) => {
        try {
            // Simulate camera access
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            
            // Simulate AI verification delay
            UI.showNotification('Verifying progress update...', 'info');
            GoalManager.addProgressUpdate(goalId, 'simulated-image-data');
            
            setTimeout(() => {
                state.pendingUpdates--;
                localStorage.setItem('pendingUpdates', state.pendingUpdates);
                UI.renderGoalsPage();
                UI.showNotification('Progress update verified!', 'success');
            }, 2000);

        } catch (error) {
            UI.showNotification('Camera access denied', 'danger');
        }
    },

    handleSidebarToggle: () => {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');
    }
};

// ======================
// INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize balance
    UI.updateBalance();
    
    // Show initial notifications
    if (state.pendingUpdates > 0) {
        UI.showNotification(`You have ${state.pendingUpdates} pending updates!`, 'pending');
        state.pendingUpdates = 0;
        localStorage.setItem('pendingUpdates', state.pendingUpdates);
    }

    // Page-specific initializations
    if (window.location.pathname.endsWith('index.html')) {
        UI.renderPinnedGoal();
    }

    if (window.location.pathname.endsWith('goals.html')) {
        UI.renderGoalsPage();
    }
});

// ======================
// PUBLIC API
// ======================
window.toggleSidebar = EventHandlers.handleSidebarToggle;
window.createNewGoal = EventHandlers.handleCreateGoal;
window.handleProgressUpdate = EventHandlers.handleProgressUpdate;
window.showCreateModal = () => document.getElementById('createModal').style.display = 'block';
window.hideCreateModal = () => document.getElementById('createModal').style.display = 'none';
