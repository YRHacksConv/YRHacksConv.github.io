// ======================= STATE MANAGEMENT =======================  
let state = {  
    goals: JSON.parse(localStorage.getItem('goals')) || [],  
    balance: Number(localStorage.getItem('balance')) || 0,  
    pendingUpdates: JSON.parse(localStorage.getItem('pendingUpdates')) || 0  
};  

let cameraStream = null;  

// ======================= CORE FUNCTIONS =======================  
function init() {  
    setActivePage();  
    renderGoals();  
    updateUI();  
    showWelcomeNotification();  
    initializeSidebar();  
}  

function initializeSidebar() {  
    document.querySelector('.toggle-btn').addEventListener('click', toggleSidebar);  
    document.addEventListener('click', (e) => {  
        if (!e.target.closest('.sidebar') && !e.target.closest('.toggle-btn')) {  
            document.getElementById('sidebar').classList.remove('collapsed');  
        }  
    });  
}  

function renderGoals() {  
    const container = document.getElementById('goalsContainer');  
    if (!container) return;  

    container.innerHTML = '';  
    const uniqueGoals = [...new Map(state.goals.map(goal => [goal.id, goal])).values()];  

    uniqueGoals.forEach(goal => {  
        const daysElapsed = calculateDaysElapsed(goal.startDate);  
        const progressWidth = calculateProgress(goal.startDate, goal.endDate);  

        const goalCard = document.createElement('div');  
        goalCard.className = `goal-card ${goal.pinned ? 'pinned-goal' : ''}`;  
        goalCard.innerHTML = `  
            <h3>${goal.name}</h3>  
            <div class="project-meta">  
                <div>Start: ${formatDate(goal.startDate)}</div>  
                <div>Days: ${daysElapsed}</div>  
                <div>End: ${formatDate(goal.endDate)}</div>  
                <div>Revenue: $${calculateRevenue(goal.updates)}</div>  
            </div>  
            <div class="progress-bar">  
                <div class="progress" style="width: ${progressWidth}%"></div>  
            </div>  
            <button class="update-button" onclick="updateProgress('${goal.id}')">  
                UPDATE PROGRESS  
                ${state.pendingUpdates > 0 ? `<span class="pending-badge">${state.pendingUpdates}</span>` : ''}  
            </button>  
        `;  
        container.appendChild(goalCard);  
    });  
}  

// ======================= UTILITY FUNCTIONS =======================  
function calculateDaysElapsed(startDate) {  
    return Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));  
}  

function calculateProgress(start, end) {  
    const total = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);  
    const elapsed = (new Date() - new Date(start)) / (1000 * 60 * 60 * 24);  
    return Math.min((elapsed / total) * 100, 100);  
}  

function formatDate(dateString) {  
    return new Date(dateString).toLocaleDateString('en-US', {  
        month: 'short',  
        day: 'numeric',  
        year: 'numeric'  
    });  
}  

function calculateRevenue(updates) {  
    return (updates.length * 5).toFixed(2);  
}  

// ======================= GOAL CREATION SYSTEM =======================  
function showCreateModal() {  
    document.getElementById('createModal').style.display = 'block';  
}  

function hideCreateModal() {  
    document.getElementById('createModal').style.display = 'none';  
    clearForm();  
}  

function createGoal() {  
    const formElements = {  
        name: document.getElementById('goalName'),  
        startDate: document.getElementById('startDate'),  
        endDate: document.getElementById('endDate'),  
        description: document.getElementById('goalDescription')  
    };  

    if (!validateGoalForm(formElements)) return;  

    const newGoal = {  
        id: Date.now().toString(),  
        name: formElements.name.value.trim(),  
        startDate: formElements.startDate.value,  
        endDate: formElements.endDate.value,  
        description: formElements.description.value.trim(),  
        totalDays: calculateTotalDays(formElements.startDate.value, formElements.endDate.value),  
        updates: [],  
        pinned: state.goals.length === 0  
    };  

    if (state.goals.some(goal => goal.name.toLowerCase() === newGoal.name.toLowerCase())) {  
        showNotification('This goal name already exists!', 'danger');  
        return;  
    }  

    state.goals.push(newGoal);  
    saveState();  
    hideCreateModal();  
    renderGoals();  
    updateUI();  
}  

function validateGoalForm({name, startDate, endDate}) {  
    let isValid = true;  

    // Name validation
    if (!name.value.trim()) {  
        showNotification('Goal name is required', 'danger');  
        isValid = false;  
    }  

    // Start date validation
    if (!startDate.value) {  
        showNotification('Start date is required', 'danger');  
        isValid = false;  
    }  

    // End date validation
    if (!endDate.value) {  
        showNotification('End date is required', 'danger');  
        isValid = false;  
    }  

    // Date comparison validation
    if (startDate.value && endDate.value) {  
        if (new Date(startDate.value) > new Date(endDate.value)) {  
            showNotification('End date must be after start date', 'danger');  
            isValid = false;  
        }  
    }  

    return isValid;  
}  

function calculateTotalDays(start, end) {  
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));  
}  

function clearForm() {  
    document.getElementById('goalName').value = '';  
    document.getElementById('startDate').value = '';  
    document.getElementById('endDate').value = '';  
    document.getElementById('goalDescription').value = '';  
}  

// ======================= PROGRESS SYSTEM =======================  
async function handleCameraAccess(goalId) {  
    try {  
        cameraStream = await navigator.mediaDevices.getUserMedia({  
            video: { facingMode: "environment" }  
        });  
        
        showNotification("Verifying progress...", "success");  
        
        setTimeout(() => {  
            cameraStream.getTracks().forEach(track => track.stop());  
            completeProgressUpdate(goalId);  
        }, 3000);  
    } catch (error) {  
        showNotification("Camera access required!", "danger");  
    }  
}  

function completeProgressUpdate(goalId) {  
    const goal = state.goals.find(g => g.id === goalId);  
    if (!goal) return;  

    goal.updates.push(new Date().toISOString());  
    state.pendingUpdates++;  
    state.balance += 5.00;  
    saveState();  
    updateUI();  
    renderGoals();  
    showNotification('Progress verified!', 'success');  
}  

function updateProgress(goalId) {  
    const targetGoal = goalId ? state.goals.find(g => g.id === goalId) : state.goals.find(g => g.pinned);  
    if (!targetGoal) return;  
    handleCameraAccess(targetGoal.id);  
}  

// ======================= UI SYSTEM =======================  
function updateUI() {  
    document.getElementById('balance').textContent = state.balance.toFixed(2);  
    document.getElementById('revenue').textContent = state.balance.toFixed(2);  

    const pinnedGoal = state.goals.find(g => g.pinned);  
    if (pinnedGoal) {  
        const daysElapsed = calculateDaysElapsed(pinnedGoal.startDate);  
        document.getElementById('pinnedGoalName').textContent = pinnedGoal.name;  
        document.getElementById('startDate').textContent = formatDate(pinnedGoal.startDate);  
        document.getElementById('endDate').textContent = formatDate(pinnedGoal.endDate);  
        document.getElementById('daysElapsed').textContent = daysElapsed;  
        document.querySelector('.progress').style.width = `${calculateProgress(pinnedGoal.startDate, pinnedGoal.endDate)}%`;  
    }  
}  

function setActivePage() {  
    const currentPage = window.location.pathname.split("/").pop();  
    document.querySelectorAll('.nav-item a').forEach(link => {  
        link.parentElement.classList.toggle('active', link.getAttribute('href') === currentPage);  
    });  
}  

// ======================= NOTIFICATION SYSTEM =======================  
function showNotification(message, type = 'success') {  
    const notification = document.createElement('div');  
    notification.className = `notification-panel ${type}-notification`;  
    notification.textContent = message;  
    document.body.appendChild(notification);  
    
    setTimeout(() => {  
        notification.remove();  
    }, 3000);  
}  

function showWelcomeNotification() {  
    if (!localStorage.getItem('firstVisit')) {  
        showNotification('1 pending update needs verification', 'danger');  
        localStorage.setItem('firstVisit', 'true');  
        state.pendingUpdates = 1;  
        saveState();  
        updateUI();  
    }  
}  

// ======================= STATE PERSISTENCE =======================  
function saveState() {  
    localStorage.setItem('goals', JSON.stringify(state.goals));  
    localStorage.setItem('balance', state.balance.toString());  
    localStorage.setItem('pendingUpdates', state.pendingUpdates.toString());  
}  

// ======================= SIDEBAR SYSTEM =======================  
function toggleSidebar() {  
    document.getElementById('sidebar').classList.toggle('collapsed');  
}  

// ======================= INITIALIZATION =======================  
document.addEventListener('DOMContentLoaded', init);  
