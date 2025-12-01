document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('home-page')) {
        initHomepage();
    } else if (document.body.classList.contains('todo-page')) {
        initTodoPage();
    } else if (document.body.classList.contains('schedule-page')) {
        initSchedule();
    }
    
    initPomodoro(); 
});

function getTasks() {
    try {
        return JSON.parse(localStorage.getItem('myWay_tasks')) || [];
    } catch (e) { return []; }
}

function saveTasks(tasks) {
    localStorage.setItem('myWay_tasks', JSON.stringify(tasks));
}

function initHomepage() {
    const profileInput = document.getElementById('profile-pic-upload');
    const profileImg = document.getElementById('user-image');

    if (profileImg) {
        const savedImage = localStorage.getItem('myWay_profilePic');
        if (savedImage) {
            profileImg.src = savedImage;
        }
    }

    if (profileInput && profileImg) {
        profileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const result = event.target.result;
                    profileImg.src = result;
                    localStorage.setItem('myWay_profilePic', result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function renderDashboard() {
        const countDisplay = document.getElementById('dashboard-count');
        const barFill = document.getElementById('dashboard-bar');
        const percentText = document.getElementById('dashboard-percentage');
        const miniList = document.getElementById('mini-task-list');
        const emptyMsg = document.getElementById('empty-msg');

        const tasks = getTasks();
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        if(countDisplay) countDisplay.textContent = `${completed}/${total}`;
        if(barFill) barFill.style.width = `${percentage}%`;
        if(percentText) percentText.textContent = `${percentage}%`;

        if(miniList) {
            miniList.innerHTML = ''; 
            
            if (total === 0) {
                if(emptyMsg) emptyMsg.style.display = 'block';
            } else {
                if(emptyMsg) emptyMsg.style.display = 'none';
                
                const tasksToShow = tasks.slice(0, 3); 
                
                tasksToShow.forEach((task, index) => {
                    const row = document.createElement('div');
                    row.className = 'task-row'; 
                    row.style.marginBottom = '5px';
                    
                    row.innerHTML = `
                        <div class="task-check-area">
                            <div class="task-circle" style="width:15px; height:15px; background:${task.completed ? '#379ab4' : 'transparent'}; border: 2px solid #379ab4; border-radius: 50%;"></div>
                        </div>
                        <div class="task-text" style="font-size:12px; text-decoration:${task.completed ? 'line-through' : 'none'}; color: #379ab4;">${task.text}</div>
                    `;
                    
                    row.addEventListener('click', () => {
                        const realIndex = tasks.findIndex(t => t.text === task.text);
                        if(realIndex !== -1) {
                            tasks[realIndex].completed = !tasks[realIndex].completed;
                            saveTasks(tasks);
                            renderDashboard();
                        }
                    });

                    miniList.appendChild(row);
                });
            }
        }
    }

    function initScheduleRender() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        days.forEach(day => {
            const container = document.querySelector(`.day-col[data-day="${day}"]`);
            if(!container) return; 

            container.innerHTML = ''; 

            const classes = JSON.parse(localStorage.getItem(day) || '[]');
            classes.sort((a,b) => a.startTime.localeCompare(b.startTime));

            classes.forEach(cls => {
                const card = document.createElement('div');
                card.className = `class-card ${cls.modality === 'Online' ? 'online' : 'in-person'}`;
                
                card.innerHTML = `
                    <h3>${cls.course}</h3>
                    <p class="time">${cls.startTime} - ${cls.endTime}</p>
                    <p class="mode">${cls.modality}</p>
                `;
                container.appendChild(card);
            });
        });
    }

    renderDashboard();
    initScheduleRender();
}

function initPomodoro() {
    const startBtn = document.querySelector('.start') || document.getElementById('start');
    const stopBtn = document.querySelector('.stop') || document.getElementById('stop');
    const resetBtn = document.querySelector('.reset') || document.getElementById('reset');
    
    const display = document.querySelector('.time') || document.querySelector('.timer');
    
    const circle = document.querySelector('.circular-timer') || document.querySelector('.circular-progress');

    if(!display) return;

    const WORK_TIME = 25 * 60;
    let timerId = null;

    function updateView(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        display.textContent = `${m}:${s}`;

        if(circle) {
            const percent = seconds / WORK_TIME;
            const deg = percent * 360;
            
            if (circle.classList.contains('circular-timer')) {
                 circle.style.background = `conic-gradient(#7ed957 ${deg}deg, #c1ff72 0deg)`;
            } else {
                 circle.style.background = `conic-gradient(#7ed957 ${deg}deg, transparent 0deg)`;
            }
        }
    }

    function tick() {
        const endTime = parseInt(localStorage.getItem('pomo_endTime'));
        if (endTime) {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
            updateView(remaining);
            
            if (remaining <= 0) {
                stop();
                alert("Time's up!");
            } else {
                timerId = requestAnimationFrame(tick);
            }
        }
    }

    function start() {
        if (localStorage.getItem('pomo_isRunning') === 'true') return;
        
        const remaining = parseInt(localStorage.getItem('pomo_remaining') || WORK_TIME);
        localStorage.setItem('pomo_endTime', Date.now() + (remaining * 1000));
        localStorage.setItem('pomo_isRunning', 'true');
        tick();
    }

    function stop() {
        cancelAnimationFrame(timerId);
        const endTime = parseInt(localStorage.getItem('pomo_endTime'));
        if (endTime) {
            const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            localStorage.setItem('pomo_remaining', left);
        }
        localStorage.removeItem('pomo_endTime');
        localStorage.setItem('pomo_isRunning', 'false');
    }

    function reset() {
        stop();
        localStorage.setItem('pomo_remaining', WORK_TIME);
        updateView(WORK_TIME);
    }

    if(startBtn) startBtn.addEventListener('click', start);
    if(stopBtn) stopBtn.addEventListener('click', stop);
    if(resetBtn) resetBtn.addEventListener('click', reset);

    if (localStorage.getItem('pomo_isRunning') === 'true') {
        tick();
    } else {
        updateView(parseInt(localStorage.getItem('pomo_remaining') || WORK_TIME));
    }
}

function initTodoPage() {
    const taskInput = document.querySelector('.task-input');
    const addTaskBtn = document.querySelector('.add-task-button');
    const taskListUl = document.querySelector('.task-list');
    const progressBar = document.querySelector('.progress');
    const progressNum = document.querySelector('.numbers');
    const emptyImg = document.querySelector('.empty-image');
    const clearBtn = document.querySelector('.clear-all-tasks-button');

    function renderTodos() {
        if (!taskListUl) return;
        const tasks = getTasks();
        taskListUl.innerHTML = '';

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;

        if (progressBar) progressBar.style.width = total ? `${(completed / total) * 100}%` : '0%';
        if (progressNum) progressNum.textContent = `${completed}/${total}`;
        if (emptyImg) emptyImg.style.display = total === 0 ? 'block' : 'none';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');
            li.innerHTML = `
                <span class="task-checkbox ${task.completed ? 'checked' : ''}"></span>
                <span class="task-text">${task.text}</span>
                <button class="delete-button">×</button>
            `;
            
            li.querySelector('.task-checkbox').addEventListener('click', () => {
                tasks[index].completed = !tasks[index].completed;
                saveTasks(tasks);
                renderTodos();
            });

            li.querySelector('.delete-button').addEventListener('click', () => {
                tasks.splice(index, 1);
                saveTasks(tasks);
                renderTodos();
            });
            taskListUl.appendChild(li);
        });
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (taskInput.value.trim()) {
                const tasks = getTasks();
                tasks.push({ text: taskInput.value.trim(), completed: false });
                saveTasks(tasks);
                taskInput.value = '';
                renderTodos();
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm('Clear all tasks?')) {
                saveTasks([]);
                renderTodos();
            }
        });
    }

    renderTodos();
}

function initSchedule() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const addBtn = document.getElementById('add');
    const clearBtn = document.getElementById('clear');

    function renderDay(day) {
        const ul = document.querySelector(`[data-day="${day}"] ul`);
        if(!ul) return;
        ul.innerHTML = '';
        const classes = JSON.parse(localStorage.getItem(day) || '[]');
        
        classes.forEach((cls, idx) => {
            const li = document.createElement('li');
            li.className = cls.modality === 'Online' ? 'online' : 'in-person';
            li.innerHTML = `
                <span class="time">${cls.startTime} - ${cls.endTime}</span>
                ${cls.course} <span class="modality">(${cls.modality})</span>
                <button class="delete">×</button>
            `;
            li.querySelector('.delete').onclick = () => {
                classes.splice(idx, 1);
                localStorage.setItem(day, JSON.stringify(classes));
                renderDay(day);
            };
            ul.appendChild(li);
        });
    }

    days.forEach(renderDay);

    if (addBtn) {
        addBtn.onclick = (e) => {
            e.preventDefault();
            const day = document.getElementById('day').value;
            const course = document.getElementById('course').value;
            const start = document.getElementById('startTime').value;
            const end = document.getElementById('endTime').value;
            const mode = document.getElementById('modality').value;

            if (course && start && end) {
                const classes = JSON.parse(localStorage.getItem(day) || '[]');
                classes.push({ course, startTime: start, endTime: end, modality: mode });
                localStorage.setItem(day, JSON.stringify(classes));
                renderDay(day);
                document.getElementById('course').value = '';
            }
        };
    }
    
    if (clearBtn) {
        clearBtn.onclick = () => {
            if(confirm('Clear entire schedule?')) {
                days.forEach(d => localStorage.removeItem(d));
                days.forEach(renderDay);
            }
        };
    }
}