let state = {
    goals: JSON.parse(localStorage.getItem('goals')) || [],
    balance: 0,
    pendingUpdates: JSON.parse(localStorage.getItem('pendingUpdates')) || 0
};

function init() {
    renderGoals();
    updateUI();
    showWelcomeNotification();
}

function renderGoals() {
    if (!document.getElementById('goalsContainer')) return;

    const container = document.getElementById('goalsContainer');
    container.innerHTML = '';
    
    state.goals.forEach(goal => {
        const daysElapsed = Math.floor((new Date() - new Date(goal.startDate)) / (1000 * 60 * 60 * 24));
        const goalCard = document.createElement('div');
        goalCard.className = `goal-card ${goal.pinned ? 'pinned-goal' : ''}`;
        goalCard.innerHTML = `
            <h3>${goal.name}</h3>
            <div class="project-meta">
                <div>Start: ${new Date(goal.startDate).toLocaleDateString()}</div>
                <div>Days: ${daysElapsed}</div>
                <div>End: ${new Date(goal.endDate).toLocaleDateString()}</div>
                <div>Updates: ${goal.updates.length}/${goal.totalDays}</div>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${(daysElapsed/goal.totalDays)*100}%"></div>
            </div>
            <button class="update-button" onclick="updateProgress('${goal.id}')">UPDATE PROGRESS</button>
        `;
        container.appendChild(goalCard);
    });
}

function updateUI() {
    document.getElementById('balance').textContent = state.balance.toFixed(2);
    const pinnedGoal = state.goals.find(g => g.pinned);
    
    if (pinnedGoal) {
        const daysElapsed = Math.floor((new Date() - new Date(pinnedGoal.startDate)) / (1000 * 60 * 60 * 24));
        document.getElementById('pinnedGoalName').textContent = pinnedGoal.name;
        document.getElementById('startDate').textContent = new Date(pinnedGoal.startDate).toLocaleDateString();
        document.getElementById('endDate').textContent = new Date(pinnedGoal.endDate).toLocaleDateString();
        document.getElementById('daysElapsed').textContent = daysElapsed;
        document.getElementById('progressCount').textContent = `${pinnedGoal.updates.length}/${pinnedGoal.totalDays}`;
        document.querySelector('.progress').style.width = `${(daysElapsed/pinnedGoal.totalDays)*100}%`;
    }
}

function showCreateModal() {
    document.getElementById('createModal').style.display = 'block';
}

function createGoal() {
    const name = document.getElementById('goalName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const description = document.getElementById('goalDescription').value;

    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    
    const newGoal = {
        id: Date.now().toString(),
        name,
        startDate,
        endDate,
        description,
        totalDays,
        updates: [],
        pinned: state.goals.length === 0
    };

    state.goals.push(newGoal);
    localStorage.setItem('goals', JSON.stringify(state.goals));
    updateUI();
    hideCreateModal();
}

function updateProgress(goalId) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            const goal = state.goals.find(g => g.id === goalId);
            goal.updates.push(new Date().toISOString());
            state.pendingUpdates++;
            localStorage.setItem('goals', JSON.stringify(state.goals));
            localStorage.setItem('pendingUpdates', state.pendingUpdates);
            updateUI();
            showNotification('Progress update submitted for verification!', 'success');
        })
        .catch(() => showNotification('Camera access required for verification', 'danger'));
}

function postComment(anonymous = false) {
    const input = document.getElementById('commentInput');
    const comment = input.value.trim();
    
    if (comment) {
        const author = anonymous ? 'Anonymous' : 'You';
        const commentSection = document.getElementById('commentSection');
        commentSection.innerHTML += `
            <div class="comment">
                <strong>${author}:</strong> ${comment}
            </div>
        `;
        input.value = '';
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification-panel ${type}-notification`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function showWelcomeNotification() {
    if (!localStorage.getItem('firstVisit')) {
        showNotification('Welcome to Goal Achiever!', 'success');
        localStorage.setItem('firstVisit', 'true');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainContent').classList.toggle('collapsed');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
