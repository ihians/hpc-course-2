// ── API URL ───────────────────────────────────────────────────────────────────
// Since there is no docker-compose, the frontend calls the backend directly
// via the host machine's port. Both containers expose their ports to localhost.
const API_URL = "http://localhost:8000";

// ── State ─────────────────────────────────────────────────────────────────────
let allDuties = [];

// ── DOM references ────────────────────────────────────────────────────────────
const tableBody      = document.getElementById("table-body");
const loadingEl      = document.getElementById("loading");
const emptyMsg       = document.getElementById("empty-message");
const addForm        = document.getElementById("add-form");
const formMessage    = document.getElementById("form-message");
const searchInput    = document.getElementById("search-input");
const filterShift    = document.getElementById("filter-shift");
const filterStatus   = document.getElementById("filter-status");
const filterDate     = document.getElementById("filter-date");
const totalCount     = document.getElementById("total-count");
const pendingCount   = document.getElementById("pending-count");
const ondutyCount    = document.getElementById("onduty-count");
const completedCount = document.getElementById("completed-count");

// ── Set today's date as default for the duty date input ───────────────────────
document.getElementById("duty_date").valueAsDate = new Date();

// ── Fetch all duties from the API ─────────────────────────────────────────────
async function fetchDuties() {
  try {
    const response = await fetch(`${API_URL}/duties`);
    if (!response.ok) throw new Error("API error");
    allDuties = await response.json();
    renderTable();
    updateSummary();
  } catch (err) {
    loadingEl.textContent = "Error: Could not connect to the backend. Is the backend container running on port 8000?";
    loadingEl.style.color = "var(--red)";
  }
}

// ── Render the table ──────────────────────────────────────────────────────────
function renderTable() {
  const search = searchInput.value.toLowerCase();
  const shift  = filterShift.value;
  const status = filterStatus.value;
  const date   = filterDate.value;

  const filtered = allDuties.filter(d => {
    const matchSearch = d.officer_name.toLowerCase().includes(search) ||
                        d.post.toLowerCase().includes(search);
    const matchShift  = shift  === "" || d.shift      === shift;
    const matchStatus = status === "" || d.status     === status;
    const matchDate   = date   === "" || d.duty_date  === date;
    return matchSearch && matchShift && matchStatus && matchDate;
  });

  loadingEl.style.display = "none";

  if (filtered.length === 0) {
    tableBody.innerHTML    = "";
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";
  tableBody.innerHTML = filtered.map(d => `
    <tr id="row-${d.id}">
      <td>${escapeHtml(d.duty_date)}</td>
      <td><span class="shift-pill ${shiftClass(d.shift)}">${escapeHtml(d.shift)}</span></td>
      <td>${escapeHtml(d.rank)}</td>
      <td><strong>${escapeHtml(d.officer_name)}</strong></td>
      <td>${escapeHtml(d.post)}</td>
      <td><span class="badge ${badgeClass(d.status)}">${escapeHtml(d.status)}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-sm btn-status" onclick="cycleStatus('${d.id}', '${d.status}')">
            Change Status
          </button>
          <button class="btn btn-sm btn-delete" onclick="deleteDuty('${d.id}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ── Update summary counts in the header ───────────────────────────────────────
function updateSummary() {
  totalCount.textContent     = allDuties.length;
  pendingCount.textContent   = allDuties.filter(d => d.status === "Pending").length;
  ondutyCount.textContent    = allDuties.filter(d => d.status === "On Duty").length;
  completedCount.textContent = allDuties.filter(d => d.status === "Completed").length;
}

// ── Add a new duty assignment ─────────────────────────────────────────────────
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    officer_name: document.getElementById("officer_name").value.trim(),
    rank:         document.getElementById("rank").value,
    post:         document.getElementById("post").value.trim(),
    shift:        document.getElementById("shift").value,
    duty_date:    document.getElementById("duty_date").value,
  };

  try {
    const response = await fetch(`${API_URL}/duties`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      showMessage(err.detail || "Failed to assign duty.", "error");
      return;
    }

    const newEntry = await response.json();
    allDuties.push(newEntry);
    allDuties.sort((a, b) => a.duty_date.localeCompare(b.duty_date));
    renderTable();
    updateSummary();
    addForm.reset();
    document.getElementById("duty_date").valueAsDate = new Date();
    showMessage("Duty assigned successfully.", "success");

  } catch {
    showMessage("Network error. Is the backend container running?", "error");
  }
});

// ── Cycle through statuses: Pending → On Duty → Completed → Pending ──────────
const statusCycle = ["Pending", "On Duty", "Completed"];

async function cycleStatus(id, currentStatus) {
  const nextIndex  = (statusCycle.indexOf(currentStatus) + 1) % statusCycle.length;
  const nextStatus = statusCycle[nextIndex];

  try {
    const response = await fetch(`${API_URL}/duties/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) throw new Error();
    const updated = await response.json();
    allDuties = allDuties.map(d => d.id === id ? updated : d);
    renderTable();
    updateSummary();

  } catch {
    alert("Failed to update status.");
  }
}

// ── Delete a duty entry ───────────────────────────────────────────────────────
async function deleteDuty(id) {
  if (!confirm("Delete this duty assignment?")) return;

  try {
    const response = await fetch(`${API_URL}/duties/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error();
    allDuties = allDuties.filter(d => d.id !== id);
    renderTable();
    updateSummary();
  } catch {
    alert("Failed to delete duty entry.");
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shiftClass(shift) {
  if (shift === "Morning")   return "shift-morning";
  if (shift === "Afternoon") return "shift-afternoon";
  if (shift === "Night")     return "shift-night";
  return "";
}

function badgeClass(status) {
  if (status === "Pending")   return "badge-pending";
  if (status === "On Duty")   return "badge-onduty";
  if (status === "Completed") return "badge-completed";
  return "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showMessage(msg, type) {
  formMessage.textContent = msg;
  formMessage.className   = type;
  setTimeout(() => { formMessage.textContent = ""; }, 4000);
}

// ── Filter listeners ──────────────────────────────────────────────────────────
searchInput.addEventListener("input",  renderTable);
filterShift.addEventListener("change", renderTable);
filterStatus.addEventListener("change", renderTable);
filterDate.addEventListener("change",  renderTable);

// ── Initial data load ─────────────────────────────────────────────────────────
fetchDuties();
