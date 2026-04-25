const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const cameraBtn = document.getElementById('camera-btn');
const fileInput = document.getElementById('file-input');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const caloriesSpan = document.getElementById('calories');
const proteinsSpan = document.getElementById('proteins');
const fatsSpan = document.getElementById('fats');
const progressCircle = document.getElementById('progress-circle');
const progressPercent = document.getElementById('progress-percent');
const progressCal = document.getElementById('progress-cal');
const goalSelect = document.getElementById('goal-select');
const weightInput = document.getElementById('weight');
const heightInput = document.getElementById('height');
const bmiResult = document.getElementById('bmi-result');
const calendarDiv = document.getElementById('calendar');
const dayDetails = document.getElementById('day-details');
const dayTitle = document.getElementById('day-title');
const dayCalories = document.getElementById('day-calories');
const dayMeals = document.getElementById('day-meals');
const tg = window.Telegram.WebApp;tg.expand();

let stream;
let calorieGoal = 2000;
let totalCalories = 0;
let meals = [];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateBMI();
    generateCalendar();
});

weightInput.addEventListener('input', () => {
    saveUserData();
    updateBMI();
});
heightInput.addEventListener('input', () => {
    saveUserData();
    updateBMI();
});
goalSelect.addEventListener('change', () => {
    saveUserData();
    updateBMI();
});

cameraBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = 'block';
        cameraBtn.textContent = '📸 Сфотографировать';
        cameraBtn.onclick = capturePhoto;
    } catch (err) {
        alert('Ошибка доступа к камере: ' + err.message);
    }
});

function capturePhoto() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    stream.getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    cameraBtn.textContent = '📷 Использовать Камеру';
    cameraBtn.onclick = () => cameraBtn.click();
    analyzeImage(canvas.toDataURL('image/png'));
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => analyzeImage(e.target.result);
        reader.readAsDataURL(file);
    }
});

function analyzeImage(imageData) {
    loadingDiv.style.display = 'block';
    resultsDiv.style.display = 'none';

    // Симуляция анализа (в реальности здесь был бы API вызов)
    setTimeout(() => {
        const calories = Math.floor(Math.random() * 500) + 200; // 200-700 ккал
        const proteins = Math.floor(Math.random() * 30) + 10; // 10-40 г
        const fats = Math.floor(Math.random() * 20) + 5; // 5-25 г

        caloriesSpan.textContent = calories;
        proteinsSpan.textContent = proteins;
        fatsSpan.textContent = fats;

        addMeal(calories, proteins, fats);

        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
    }, 2000);
}

function addMeal(calories, proteins, fats) {
    totalCalories += calories;
    meals.push({ calories, proteins, fats, time: new Date().toLocaleTimeString() });
    saveData();
    updateProgressDisplay();
}

function updateProgressDisplay() {
    const percentage = Math.min((totalCalories / calorieGoal) * 100, 100);
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    progressPercent.textContent = Math.round(percentage) + '%';
    progressCal.textContent = totalCalories + ' / ' + calorieGoal + ' ккал';
}

function updateBMI() {
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value) / 100; // в метры
    if (weight && height) {
        const bmi = (weight / (height * height)).toFixed(1);
        let bmr = 10 * weight + 6.25 * height * 100 - 5 * 25 + 5; // упрощённая формула для мужчин
        if (goalSelect.value === 'lose') {
            calorieGoal = Math.round(bmr * 1.2 - 500); // дефицит для похудения
        } else {
            calorieGoal = Math.round(bmr * 1.2 + 500); // профицит для набора
        }
        bmiResult.textContent = `ИМТ: ${bmi} | Цель калорий: ${calorieGoal}`;
    } else {
        bmiResult.textContent = 'ИМТ: -- | Цель калорий: --';
    }
}

function saveData() {
    const today = new Date().toDateString();
    const data = { totalCalories, meals };
    localStorage.setItem('day-' + today, JSON.stringify(data));
}

function saveUserData() {
    const userData = {
        weight: weightInput.value,
        height: heightInput.value,
        goal: goalSelect.value
    };
    localStorage.setItem('userData', JSON.stringify(userData));
}

function loadData() {
    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        weightInput.value = userData.weight || '';
        heightInput.value = userData.height || '';
        goalSelect.value = userData.goal || 'lose';
    }

    // Load today's data
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem('day-' + today));
    if (data) {
        totalCalories = data.totalCalories || 0;
        meals = data.meals || [];
        updateProgressDisplay();
    }
}

function generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    calendarDiv.innerHTML = '';
    for (let i = 0; i < firstDay; i++) {
        calendarDiv.innerHTML += '<div></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toDateString();
        const data = JSON.parse(localStorage.getItem('day-' + dateStr));
        const cal = data ? data.totalCalories : 0;
        const className = date.toDateString() === now.toDateString() ? 'day today' : 'day';
        calendarDiv.innerHTML += `<div class="${className}" data-date="${dateStr}">${day}<br>${cal} ккал</div>`;
    }

    document.querySelectorAll('.day').forEach(day => {
        day.addEventListener('click', function() {
            showDayDetails(this.dataset.date);
        });
    });
}

function showDayDetails(dateStr) {
    const data = JSON.parse(localStorage.getItem('day-' + dateStr));
    if (data) {
        dayTitle.textContent = dateStr;
        dayCalories.textContent = data.totalCalories || 0;
        dayMeals.innerHTML = '';
        (data.meals || []).forEach(meal => {
            dayMeals.innerHTML += `<li>${meal.time}: ${meal.calories} ккал, ${meal.proteins}г белков, ${meal.fats}г жиров</li>`;
        });
        dayDetails.style.display = 'block';
    }
}
