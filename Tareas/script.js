document.addEventListener('DOMContentLoaded', () => {
    // ---- ELEMENTOS DEL DOM ----
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    // ---- ESTADO DE LA APLICACIÓN ----
    // Carga las tareas desde localStorage o inicializa un array vacío.
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // ---- FUNCIÓN PARA GUARDAR TAREAS ----
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // ---- FUNCIÓN PARA RENDERIZAR LAS TAREAS ----
    const renderTasks = () => {
        taskList.innerHTML = ''; // Limpiar la lista actual

        // Mover tareas completadas al final
        const sortedTasks = [...tasks].sort((a, b) => a.completed - b.completed);

        if (sortedTasks.length === 0) {
            taskList.innerHTML = '<p style="text-align:center; color:#9e9e9e;">¡No hay tareas pendientes!</p>';
            return;
        }

        sortedTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id; // Asignar un ID único al elemento
            if (task.completed) {
                taskItem.classList.add('completed');
            }

            taskItem.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    };

    // ---- MANEJO DE EVENTOS ----

    // Agregar una nueva tarea
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();

        if (taskText) {
            const newTask = {
                id: Date.now(), // ID simple y único
                text: taskText,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        }
    });

    // Marcar como completada, editar o eliminar
    taskList.addEventListener('click', (e) => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;

        const taskId = Number(taskItem.dataset.id);

        // Marcar/Desmarcar como completada
        if (target.type === 'checkbox') {
            const task = tasks.find(t => t.id === taskId);
            task.completed = target.checked;
            saveTasks();
            renderTasks();
        }

        // Eliminar tarea
        if (target.classList.contains('delete-btn')) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
        }

        // Editar tarea
        if (target.classList.contains('edit-btn')) {
            const taskTextSpan = taskItem.querySelector('.task-text');
            const newText = prompt('Edita tu tarea:', taskTextSpan.textContent);
            
            if (newText !== null && newText.trim() !== '') {
                const task = tasks.find(t => t.id === taskId);
                task.text = newText.trim();
                saveTasks();
                renderTasks();
            }
        }
    });
    
    // Función para escapar HTML y prevenir inyecciones de código
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // ---- INICIALIZACIÓN ----
    renderTasks();
});