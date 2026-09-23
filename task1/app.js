/**
 * Closure Factory creating an isolated Task Context with private encapsulated state.
 * @param {string} taskName - Name identifier for the task
 * @param {number} minTime - Minimum duration bound (ms)
 * @param {number} maxTime - Maximum duration bound (ms)
 * @param {number} failRatio - Probability threshold for failure (0.0 to 1.0)
 */
function createTask(taskName, minTime = 500, maxTime = 2000, failRatio = 0.35) {
  // Private variables encapsulated by closure scope
  let count = 0;
  let status = "Idle";
  let lastDuration = 0;

  return {
    name: taskName,
    
    getStatus: () => status,
    getCount: () => count,
    getLastTime: () => lastDuration,
    
    reset: function () {
      count = 0;
      status = "Idle";
      lastDuration = 0;
    },

    run: function () {
      count++;
      status = "Pending";
      const randomTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

      return new Promise((resolve, reject) => {
        const startTime = performance.now();

        setTimeout(() => {
          lastDuration = Math.round(performance.now() - startTime);
          const isSuccessful = Math.random() > failRatio;

          if (isSuccessful) {
            status = "Completed";
            resolve({ name: taskName, status, count, duration: lastDuration });
          } else {
            status = "Failed";
            reject({ name: taskName, status, count, duration: lastDuration, error: "Random Network Error" });
          }
        }, randomTime);
      });
    }
  };
}

// Global registry of task objects instantiated via closure
const tasks = {
  users: createTask("Load Users"),
  posts: createTask("Load Posts"),
  comments: createTask("Load Comments")
};

// --- UI Binding and State Synchronization ---

function updateTaskUI(key) {
  const task = tasks[key];
  const statusEl = document.getElementById(`status-${key}`);
  const countEl = document.getElementById(`count-${key}`);
  const timeEl = document.getElementById(`time-${key}`);

  statusEl.textContent = task.getStatus();
  statusEl.className = `badge status-${task.getStatus().toLowerCase()}`;
  countEl.textContent = task.getCount();
  timeEl.textContent = `${task.getLastTime()} ms`;
}

function updateAllUI() {
  Object.keys(tasks).forEach(key => updateTaskUI(key));
}

// Single task execution handler
async function runSingleTask(key) {
  const task = tasks[key];
  const btn = document.querySelector(`[data-task="${key}"]`);
  btn.disabled = true;
  
  updateTaskUI(key);

  try {
    await task.run();
  } catch (err) {
    // Catch rejection to keep UI stable; state updated inside object
  } finally {
    updateTaskUI(key);
    btn.disabled = false;
  }
}

// Concurrent execution of all tasks using Promise.allSettled
async function runAllTasks() {
  const runBtn = document.getElementById("btn-run-all");
  const banner = document.getElementById("all-tasks-banner");
  
  runBtn.disabled = true;
  banner.classList.add("hidden");

  // Trigger pending UI state
  Object.keys(tasks).forEach(key => {
    tasks[key].run(); // Initiate promises
    updateTaskUI(key);
  });

  // Re-run execution via mapping promises to promise.allSettled
  const currentPromises = Object.values(tasks).map(t => {
    // Re-bind to monitor existing running state or execute new run cycle
    return t.getStatus() === "Pending" ? Promise.resolve() : t.run();
  });

  // Wait for all promises to fulfill or reject safely
  await Promise.allSettled(currentPromises);

  // Poll for completion until all tasks reach terminal state
  await new Promise(res => {
    const checkInterval = setInterval(() => {
      const allDone = Object.values(tasks).every(t => t.getStatus() !== "Pending");
      if (allDone) {
        clearInterval(checkInterval);
        res();
      }
    }, 50);
  });

  updateAllUI();
  banner.textContent = "All tasks finished (Completed or Failed).";
  banner.classList.remove("hidden");
  runBtn.disabled = false;
}

// Reset system state
function resetAllTasks() {
  Object.keys(tasks).forEach(key => {
    tasks[key].reset();
    updateTaskUI(key);
  });
  document.getElementById("all-tasks-banner").classList.add("hidden");
}

// --- Benchmark: Sequential vs Concurrent ---

async function runBenchmark() {
  const benchBtn = document.getElementById("btn-compare");
  const resultsBox = document.getElementById("benchmark-results");
  const seqEl = document.getElementById("time-seq");
  const concEl = document.getElementById("time-conc");
  const descEl = document.getElementById("benchmark-desc");

  benchBtn.disabled = true;
  resultsBox.classList.remove("hidden");

  // 1. Sequential Execution
  const startSeq = performance.now();
  for (const key of Object.keys(tasks)) {
    try {
      await tasks[key].run();
    } catch (e) { /* continue execution */ }
    updateTaskUI(key);
  }
  const durationSeq = Math.round(performance.now() - startSeq);
  seqEl.textContent = `${durationSeq} ms`;

  // Reset between tests
  await new Promise(r => setTimeout(r, 200));

  // 2. Concurrent Execution
  const startConc = performance.now();
  const promises = Object.values(tasks).map(t => t.run().catch(e => e));
  
  // UI polling during concurrent run
  const timer = setInterval(() => updateAllUI(), 50);
  await Promise.allSettled(promises);
  clearInterval(timer);
  
  const durationConc = Math.round(performance.now() - startConc);
  concEl.textContent = `${durationConc} ms`;
  updateAllUI();

  descEl.textContent = `Sequential execution ran tasks in series, accumulating a total duration equal to the sum of individual delays (${durationSeq}ms). Concurrent execution dispatched all Web API timers simultaneously in parallel background threads, completing in time equal to the single slowest task (${durationConc}ms).`;
  
  benchBtn.disabled = false;
}

// --- Event Loop Demo Execution ---

const EXPECTED_EVENT_LOOP_LOG = 
`[1] Synchronous: Main script start
[2] Synchronous: Inside asyncFn (before await)
[3] Synchronous: Main script end
[4] Microtask: Promise.resolve().then() #1
[5] Microtask: Inside asyncFn (after await)
[6] Microtask: Promise.resolve().then() #2
[7] Task (Macrotask): setTimeout #1 (0ms delay)
[8] Task (Macrotask): setTimeout #2 (50ms delay)`;

function runEventLoopDemo() {
  const expectedPre = document.getElementById("expected-output");
  const actualPre = document.getElementById("actual-output");

  expectedPre.textContent = EXPECTED_EVENT_LOOP_LOG;
  actualPre.textContent = "";

  function appendActualLog(msg) {
    actualPre.textContent += msg + "\n";
  }

  // Synchronous Execution Phase
  appendActualLog("[1] Synchronous: Main script start");

  // Macrotask 1 (Timer 0ms)
  setTimeout(() => {
    appendActualLog("[7] Task (Macrotask): setTimeout #1 (0ms delay)");
  }, 0);

  // Macrotask 2 (Timer 50ms)
  setTimeout(() => {
    appendActualLog("[8] Task (Macrotask): setTimeout #2 (50ms delay)");
  }, 50);

  // Microtask 1
  Promise.resolve().then(() => {
    appendActualLog("[4] Microtask: Promise.resolve().then() #1");
  });

  // Async/Await Microtask setup
  async function asyncFn() {
    appendActualLog("[2] Synchronous: Inside asyncFn (before await)");
    await Promise.resolve(); // Yields execution control, schedules continuation to microtask queue
    appendActualLog("[5] Microtask: Inside asyncFn (after await)");
  }

  asyncFn();

  // Microtask 2
  Promise.resolve().then(() => {
    appendActualLog("[6] Microtask: Promise.resolve().then() #2");
  });

  appendActualLog("[3] Synchronous: Main script end");
}

// Event Listeners setup
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".task-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const taskKey = e.target.getAttribute("data-task");
      runSingleTask(taskKey);
    });
  });

  document.getElementById("btn-run-all").addEventListener("click", runAllTasks);
  document.getElementById("btn-reset-all").addEventListener("click", resetAllTasks);
  document.getElementById("btn-compare").addEventListener("click", runBenchmark);
  document.getElementById("btn-event-loop").addEventListener("click", runEventLoopDemo);
});