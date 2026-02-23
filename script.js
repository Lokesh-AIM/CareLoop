const notifySound = document.getElementById("notifySound");

// Ask notification permission on first click
document.body.addEventListener(
  "click",
  () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  },
  { once: true },
);

let today = new Date().toDateString();

let state = JSON.parse(localStorage.getItem("careloop")) || {
  tasks: [],
  history: [],
  lastDate: today,
};

function save() {
  localStorage.setItem("careloop", JSON.stringify(state));
}

/* Sidebar */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("hidden");
}

/* Render tasks for father */
function renderFatherTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  state.tasks.forEach((t) => {
    const div = document.createElement("div");
    div.className = "task" + (t.done ? " done" : "");
    div.innerHTML = `
        <span>${t.title}<br><small>⏰ ${t.time}</small></span>
        <button onclick="markDone(${t.id})">✓</button>
      `;
    list.appendChild(div);
  });
}

function markDone(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = true;
  save();
  renderFatherTasks();
}

/* Add task (Son) */
function addTask() {
  const title = taskInput.value.trim();
  const time = taskTime.value;
  if (!title || !time) return alert("Enter task and time");

  const task = {
    id: Date.now(),
    title,
    type: taskType.value,
    time,
    done: false,
  };

  state.tasks.push(task);
  save();
  scheduleReminder(task);

  taskInput.value = "";
  taskTime.value = "";

  renderFatherTasks();
}

/* Reminder logic */
function scheduleReminder(task) {
  if (task.done) return;

  const [h, m] = task.time.split(":").map(Number);
  const now = new Date();
  const remindAt = new Date();
  remindAt.setHours(h, m, 0, 0);

  const delay = remindAt - now;
  if (delay <= 0) return;

  setTimeout(() => {
    if (task.done) return;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("CARELOOP Reminder", {
        body: `It's time to: ${task.title}`,
      });
    }

    notifySound.currentTime = 0;
    notifySound.play();

    document.body.classList.add("pulse");
    setTimeout(() => document.body.classList.remove("pulse"), 2000);
  }, delay);
}

/* Summary */
function buildSummary(date) {
  const completed = state.tasks.filter((t) => t.done);
  const pending = state.tasks.filter((t) => !t.done);

  let s = `📅 Daily Care Report (${date})\n\n`;

  s += "✔ Completed:\n";
  completed.length
    ? completed.forEach((t) => (s += `• ${t.title}\n`))
    : (s += "• None\n");

  s += "\n✖ Pending:\n";
  pending.length
    ? pending.forEach((t) => (s += `• ${t.title}\n`))
    : (s += "• None\n");

  s += "\n📌 Needs Attention:\n";
  if (pending.some((t) => t.type === "medicine"))
    s += "• Medication adherence\n";
  if (pending.some((t) => t.type === "exercise")) s += "• Physical exercise\n";
  if (pending.some((t) => t.type === "activity")) s += "• Daily activity\n";
  if (pending.length === 0) s += "• Everything looks good 👍\n";

  return s;
}

function generateSummary() {
  summaryBox.innerText = buildSummary(today);
  save();
}

/* Midnight reset */
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  setTimeout(() => {
    state.history.push(buildSummary(state.lastDate));
    state.tasks = [];
    state.lastDate = new Date().toDateString();
    save();
    renderFatherTasks();
    scheduleMidnightReset();
  }, midnight - now);
}

function renderHistory() {
  history.innerHTML = "";
  state.history.forEach((h) => (history.innerHTML += `<pre>${h}</pre>`));
}

/* Init */
state.tasks.forEach(scheduleReminder);
renderFatherTasks();
renderHistory();
scheduleMidnightReset();
