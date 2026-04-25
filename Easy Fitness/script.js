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
const resetBtn = document.getElementById('reset-btn');
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let stream;
let calorieGoal = 2000;
let totalCalories = 0;
let meals = [];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateBMI();
    setupEventListeners();
    generateCalendar(); // Вызов генерации при загрузке
});

function setupEventListeners() {
    resetBtn.addEventListener('click', () => {
        if (confirm('Вы уверены? Все данные будут удалены!')) {
            localStorage.clear();
            weightInput.value = '';
            heightInput.value = '';
            goalSelect.value = 'lose';
            totalCalories = 0;
            meals = [];
            calorieGoal = 2000;
            bmiResult.textContent = 'ИМТ: -- | Цель калорий: --';
            updateProgressDisplay();
            generateCalendar();
            dayDetails.style.display = 'none';
        }
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
}

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

    setTimeout(() => {
        const calories = Math.floor(Math.random() * 500) + 200;
        const proteins = Math.floor(Math.random() * 30) + 10;
        const fats = Math.floor(Math.random() * 20) + 5;

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
    generateCalendar(); // Обновляем календарь при добавлении еды
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
    const height = parseFloat(heightInput.value) / 100;
    if (weight && height) {
        const bmi = (weight / (height * height)).toFixed(1);
        let bmr = 10 * weight + 6.25 * height * 100 - 5 * 25 + 5;
        if (goalSelect.value === 'lose') {
            calorieGoal = Math.round(bmr * 1.2 - 500);
        } else {
            calorieGoal = Math.round(bmr * 1.2 + 500);
        }
        bmiResult.textContent = `ИМТ: ${bmi} | Цель калорий: ${calorieGoal}`;
        updateProgressDisplay();
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
    }; // Ошибка была здесь (пропущена скобка)
    localStorage.setItem('userData', JSON.stringify(userData));
}

function loadData() {
    // 1. Загружаем данные пользователя (рост, вес, цель)
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        weightInput.value = userData.weight || '';
        heightInput.value = userData.height || '';
        goalSelect.value = userData.goal || 'lose';
    }

    // 2. Загружаем данные за СЕГОДНЯ
    const today = new Date().toDateString();
    const todayData = JSON.parse(localStorage.getItem('day-' + today));
    
    if (todayData) {
        // КРИТИЧЕСКИ ВАЖНО: Обновляем глобальные переменные из памяти
        totalCalories = parseInt(todayData.totalCalories) || 0;
        meals = todayData.meals || [];
        console.log("Данные за сегодня загружены:", totalCalories); // Для отладки
    } else {
        // Если данных за сегодня нет, обнуляем
        totalCalories = 0;
        meals = [];
    }
    
    // 3. Обновляем экран
    updateProgressDisplay();
}

function generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarDiv.innerHTML = '';
    
    // Пустые ячейки для начала месяца
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        calendarDiv.innerHTML += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toDateString();
        const data = JSON.parse(localStorage.getItem('day-' + dateStr));
        const cal = data ? data.totalCalories : 0;
        const isToday = date.toDateString() === now.toDateString();
        
        const dayDiv = document.createElement('div');
        dayDiv.className = isToday ? 'day today' : 'day';
        dayDiv.innerHTML = `${day}<br><small>${cal} ккал</small>`;
        dayDiv.onclick = () => showDayDetails(dateStr);
        calendarDiv.appendChild(dayDiv);
    }
}

function showDayDetails(dateStr) {
    const data = JSON.parse(localStorage.getItem('day-' + dateStr));
    dayTitle.textContent = dateStr;
    dayMeals.innerHTML = '';
    
    if (data && data.meals.length > 0) {
        dayCalories.textContent = data.totalCalories;
        data.meals.forEach(meal => {
            dayMeals.innerHTML += `<li>${meal.time}: ${meal.calories} ккал</li>`;
        });
    } else {
        dayCalories.textContent = '0';
        dayMeals.innerHTML = '<li>Нет записей</li>';
    }
    dayDetails.style.display = 'block';
}
