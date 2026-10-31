"use strict";

const isEmployeeDemo = sessionStorage.getItem("sitenexsDemoRole") === "employee";
if (isEmployeeDemo) {
  document.getElementById("adminNavigation").classList.add("is-hidden");
  document.getElementById("employeeNavigation").classList.remove("is-hidden");
  document.getElementById("adminView").classList.add("is-hidden");
  document.getElementById("employeeView").classList.remove("is-hidden");
  document.getElementById("employeeAddEmployeeButton").classList.add("is-hidden");
  document.querySelectorAll(".avatar-admin").forEach((avatar) => {
    avatar.classList.remove("avatar-admin");
    avatar.classList.add("avatar-1");
  });
}

const attendanceRecords = [
  { name: "Ayu Ramadhani", nip: "SNX-2023-014", role: "Product Designer", status: "Hadir", date: "2026-10-31", in: "08:52", out: "—", lastDate: "31 Okt 2026", lastTime: "08:52" },
  { name: "Bima Pratama", nip: "SNX-2022-006", role: "Frontend Engineer", status: "Hadir", date: "2026-10-31", in: "08:41", out: "—", lastDate: "31 Okt 2026", lastTime: "08:41" },
  { name: "Citra Maharani", nip: "SNX-2024-021", role: "People Operations", status: "Izin", date: "2026-10-31", in: "—", out: "—", lastDate: "30 Okt 2026", lastTime: "17:12" },
  { name: "Dimas Saputra", nip: "SNX-2021-002", role: "Backend Engineer", status: "Hadir", date: "2026-10-31", in: "08:58", out: "—", lastDate: "31 Okt 2026", lastTime: "08:58" },
  { name: "Elisa Putri", nip: "SNX-2023-018", role: "Marketing Specialist", status: "Sakit", date: "2026-10-31", in: "—", out: "—", lastDate: "29 Okt 2026", lastTime: "09:04" },
  { name: "Farhan Akbar", nip: "SNX-2022-011", role: "Finance Analyst", status: "Hadir", date: "2026-10-31", in: "08:46", out: "—", lastDate: "31 Okt 2026", lastTime: "08:46" },
  { name: "Gita Anindya", nip: "SNX-2024-033", role: "UX Researcher", status: "Hadir", date: "2026-09-30", in: "08:50", out: "17:04", lastDate: "30 Sep 2026", lastTime: "08:50" },
  { name: "Hafiz Maulana", nip: "SNX-2021-009", role: "Operations Lead", status: "Izin", date: "2025-11-18", in: "—", out: "—", lastDate: "17 Nov 2025", lastTime: "16:55" },
  { name: "Naya Putri", nip: "SNX-2024-040", role: "People Operations", status: "Sakit", date: "2024-03-12", in: "—", out: "—", lastDate: "11 Mar 2024", lastTime: "17:02" },
];

const requests = [
  { id: 1, name: "Elisa Putri", nip: "SNX-2023-018", type: "Sakit", date: "31 Okt 2026", range: "31 Okt 2026", reason: "Demam dan perlu istirahat", file: "surat-dokter-elisa.pdf", status: "Menunggu" },
  { id: 2, name: "Citra Maharani", nip: "SNX-2024-021", type: "Izin", date: "31 Okt 2026", range: "02 Nov — 03 Nov 2026", reason: "Keperluan keluarga", file: "surat-izin-citra.pdf", status: "Menunggu" },
  { id: 3, name: "Rizky Hidayat", nip: "SNX-2022-025", type: "Sakit", date: "30 Okt 2026", range: "30 Okt 2026", reason: "Kontrol kesehatan", file: "surat-klinik-rizky.pdf", status: "Menunggu" },
];

const personalHistory = [
  { date: "Jumat, 30 Okt 2026", in: "08:48", out: "17:12", status: "Hadir" },
  { date: "Kamis, 29 Okt 2026", in: "08:55", out: "17:06", status: "Hadir" },
  { date: "Rabu, 28 Okt 2026", in: "08:51", out: "17:18", status: "Hadir" },
  { date: "Selasa, 27 Okt 2026", in: "—", out: "—", status: "Izin" },
  { date: "Senin, 26 Okt 2026", in: "08:47", out: "17:01", status: "Hadir" },
];
const workActivities = personalHistory.map((entry) => ({
  title: entry.status === "Hadir" ? "Presensi hadir tercatat" : `Status presensi: ${entry.status.toLowerCase()}`,
  detail: entry.in !== "—" ? `Masuk ${entry.in}${entry.out !== "—" ? ` · Pulang ${entry.out}` : ""}` : "Tidak ada jam masuk pada catatan ini.",
  date: entry.date,
  icon: entry.status === "Hadir" ? "fa-check" : "fa-calendar-minus",
  type: entry.status === "Hadir" ? "is-success" : "is-warning",
}));
const workTasksStorageKey = "sitenexsWorkTasks";
const defaultEmployeeNip = "SNX-2023-014";
let sharedWorkTasks = [];

const attendanceRows = document.getElementById("attendanceRows");
const requestList = document.getElementById("requestList");
const employeeModal = document.getElementById("employeeModal");
const attachmentModal = document.getElementById("attachmentModal");
const toastRegion = document.getElementById("toastRegion");
const employeeVideo = document.getElementById("employeeVideo");
const adminVideo = document.getElementById("adminVideo");

let selectedScanType = "in";
let selectedLeaveType = "Izin";
let selectedAttachment = null;
let adminStream = null;
let employeeStream = null;
let capturedFace = false;
let faceSample = null;
let currentFile = null;
let scanTimeout = null;

const initials = (name) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : type === "warning" ? " is-warning" : ""}`;
  const icon = type === "error" ? "fa-circle-exclamation" : type === "warning" ? "fa-triangle-exclamation" : "fa-circle-check";
  toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${escapeHTML(message)}</span>`;
  toastRegion.append(toast);
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(5px)";
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function syncDirectoryEmployees() {
  const addedEmployees = window.SiteNexsDirectory.getAddedEmployees();
  let hasNewEmployees = false;
  addedEmployees.forEach((employee) => {
    if (!attendanceRecords.some((record) => record.nip.toLowerCase() === employee.nip.toLowerCase())) {
      attendanceRecords.push({
        ...employee,
        status: employee.status || "Hadir",
        date: "2026-10-31",
        in: "—",
        out: "—",
        lastDate: "Belum ada",
        lastTime: "—",
        isNew: true,
      });
      hasNewEmployees = true;
    }
  });
  if (hasNewEmployees) {
    renderAttendance();
    updateEmployeeTotal();
  }
}

try {
  syncDirectoryEmployees();
} catch (error) {
  showToast(`Data karyawan lokal tidak dapat dimuat: ${error.message}`, "error");
}

window.addEventListener("storage", (event) => {
  if (event.key !== "sitenexsWorkspaceEmployees") return;
  try {
    syncDirectoryEmployees();
  } catch (error) {
    showToast(`Data karyawan lokal tidak dapat diperbarui: ${error.message}`, "error");
  }
});

function statusClass(status) {
  if (status === "Hadir") return "status-hadir";
  if (status === "Izin") return "status-izin";
  if (status === "Sakit") return "status-sakit";
  return "status-pending";
}

function renderAttendance() {
  const year = document.getElementById("yearFilter").value;
  const month = document.getElementById("monthFilter").value;
  const query = document.getElementById("employeeSearch").value.trim().toLowerCase();
  const results = attendanceRecords.filter((record) => {
    const date = new Date(`${record.date}T00:00:00`);
    const yearMatches = String(date.getFullYear()) === year;
    const monthMatches = month === "all" || String(date.getMonth()) === month;
    const searchMatches = `${record.name} ${record.nip}`.toLowerCase().includes(query);
    return yearMatches && monthMatches && searchMatches;
  });

  attendanceRows.innerHTML = results.map((record, index) => `
    <tr>
      <td><div class="employee-cell"><span class="employee-avatar avatar-${(index % 6) + 1}">${escapeHTML(initials(record.name))}</span><span class="employee-name"><strong>${escapeHTML(record.name)}</strong><small>${escapeHTML(record.nip)}</small></span></div></td>
      <td><span class="job-title">${escapeHTML(record.role)}</span></td>
      <td><span class="status-badge ${statusClass(record.status)}">${escapeHTML(record.status)}</span></td>
      <td>${new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${record.date}T00:00:00`))}</td>
      <td><span class="table-time">${escapeHTML(record.in)}</span></td>
      <td><span class="table-time">${escapeHTML(record.out)}</span></td>
      <td><span class="last-seen"><strong>${escapeHTML(record.lastDate)}</strong><small>${escapeHTML(record.lastTime)} WIB</small></span></td>
    </tr>`).join("");

  document.getElementById("emptyAttendance").classList.toggle("is-hidden", results.length > 0);
  document.getElementById("resultCount").textContent = `Menampilkan ${results.length} dari ${attendanceRecords.length} data`;
}

function renderRequests() {
  requestList.innerHTML = requests.map((request) => {
    const pending = request.status === "Menunggu";
    const typeClass = request.type === "Izin" ? " type-izin" : "";
    return `<article class="request-item">
      <div class="request-top"><span class="request-avatar">${escapeHTML(initials(request.name))}</span><span class="request-person"><strong>${escapeHTML(request.name)}</strong><small>${escapeHTML(request.nip)} · ${escapeHTML(request.date)}</small></span><span class="request-type${typeClass}"><i class="fa-solid ${request.type === "Sakit" ? "fa-kit-medical" : "fa-calendar-minus"}"></i>${escapeHTML(request.type)}</span></div>
      <div class="request-meta"><span><i class="fa-regular fa-calendar"></i>${escapeHTML(request.range)}</span><button class="text-link preview-request" type="button" data-request-action="preview" data-request-id="${request.id}"><i class="fa-regular fa-file-lines"></i> Lampiran</button></div>
      ${pending ? `<div class="request-actions"><button class="approve-request" type="button" data-request-action="approve" data-request-id="${request.id}"><i class="fa-solid fa-check"></i> Approve</button><button class="reject-request" type="button" data-request-action="reject" data-request-id="${request.id}"><i class="fa-solid fa-xmark"></i> Reject</button></div>` : `<div class="request-result"><span>${escapeHTML(request.reason)}</span><span class="status-badge ${request.status === "Disetujui" ? "status-approved" : "status-rejected"}">${escapeHTML(request.status)}</span></div>`}
    </article>`;
  }).join("");
  const pendingCount = requests.filter((request) => request.status === "Menunggu").length;
  document.getElementById("pendingCount").textContent = String(pendingCount).padStart(2, "0");
}

function renderPersonalHistory() {
  document.getElementById("personalHistoryRows").innerHTML = personalHistory.slice(0, 5).map((entry) => `
    <tr><td>${escapeHTML(entry.date)}</td><td><span class="history-time">${escapeHTML(entry.in)}</span></td><td><span class="history-time">${escapeHTML(entry.out)}</span></td><td><span class="status-badge ${statusClass(entry.status)}">${escapeHTML(entry.status)}</span></td></tr>`).join("");
  renderWorkActivities();
  renderAttendanceInsight();
}

function addWorkActivity(title, detail, icon, type) {
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  workActivities.unshift({ title, detail, date: `${date} · ${time}`, icon, type });
  renderWorkActivities();
}

function renderWorkActivities() {
  const list = document.getElementById("workActivityList");
  if (!list) return;
  list.innerHTML = workActivities.slice(0, 8).map((activity) => `
    <li class="work-activity-item">
      <span class="work-activity-icon ${activity.type}"><i class="fa-solid ${activity.icon}" aria-hidden="true"></i></span>
      <span class="work-activity-copy"><strong>${escapeHTML(activity.title)}</strong><small>${escapeHTML(activity.detail)}</small></span>
      <time>${escapeHTML(activity.date)}</time>
    </li>`).join("");
}

function getWorkEmployees() {
    return window.SiteNexsDirectory?.getEmployees() || [];
}

function getCurrentWorkEmployee() {
    const employees = getWorkEmployees();
    const selectedNip = sessionStorage.getItem("sitenexsDemoEmployeeNip") || defaultEmployeeNip;
    return employees.find((employee) => employee.nip === selectedNip) || employees[0] || {
      name: window.SiteNexsDemoAccount?.getAccountName("employee") || "Karyawan",
      nip: selectedNip,
      role: "",
    };
}

function readWorkCollection(key) {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const entries = JSON.parse(saved);
    if (!Array.isArray(entries)) throw new Error(`Data ${key} di browser tidak valid.`);
    return entries;
}

function persistWorkCollection(key, entries) {
    try {
      localStorage.setItem(key, JSON.stringify(entries));
      return true;
    } catch (error) {
      showToast(`Data tidak dapat disimpan di browser: ${error.message}`, "error");
      return false;
    }
}

function populateTaskAssignees() {
    const employees = getWorkEmployees().filter((employee) => employee.name && employee.nip);
    const currentEmployee = getCurrentWorkEmployee();
    const assigneeSelect = document.getElementById("taskAssignee");
    const previousAssignee = assigneeSelect.value;

    assigneeSelect.replaceChildren(new Option("Pilih karyawan", ""));
    employees.forEach((employee) => assigneeSelect.add(new Option(`${employee.name} · ${employee.nip}`, employee.nip)));
    assigneeSelect.value = employees.some((employee) => employee.nip === previousAssignee)
      ? previousAssignee
      : currentEmployee.nip;
}

function createTaskNode(task) {
    const assignee = getWorkEmployees().find((employee) => employee.nip === task.assigneeNip);
    const item = document.createElement("li");
    item.className = "task-item";
    const copy = document.createElement("div");
    copy.className = "task-item-copy";
    const title = document.createElement("strong");
    title.textContent = task.title;
    const description = document.createElement("p");
    description.textContent = task.description;
    const meta = document.createElement("small");
    const dueText = task.dueDate
      ? ` · Batas ${new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${task.dueDate}T00:00:00`))}`
      : "";
    meta.textContent = `Dibagikan oleh ${task.author} · Untuk ${assignee?.name || "karyawan tidak ditemukan"}${dueText}`;
    copy.append(title, description, meta);

    const statusWrap = document.createElement("label");
    statusWrap.className = "task-status-control";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = "Status";
    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", `Status tugas ${task.title}`);
    statusSelect.dataset.taskStatus = task.id;
    ["Belum dikerjakan", "Sedang dikerjakan", "Selesai"].forEach((status) => {
      statusSelect.add(new Option(status, status));
    });
    statusSelect.value = task.status;
    statusWrap.append(statusLabel, statusSelect);
    item.append(copy, statusWrap);
    return item;
}

function renderSharedTasks() {
    const list = document.getElementById("taskList");
    if (!list) return;
    list.replaceChildren();
    sharedWorkTasks
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .forEach((task) => list.append(createTaskNode(task)));
    if (sharedWorkTasks.length === 0) {
      const empty = document.createElement("li");
      empty.className = "task-empty-state";
      empty.textContent = "Belum ada tugas. Buat tugas harian pertama lalu bagikan kepada rekan.";
      list.append(empty);
    }
    const count = document.querySelector("[data-task-count]");
    count.textContent = `${sharedWorkTasks.length} ${sharedWorkTasks.length === 1 ? "tugas" : "tugas"}`;
}

function initializeWorkCollaboration() {
    try {
      sharedWorkTasks = readWorkCollection(workTasksStorageKey);
      populateTaskAssignees();
      renderSharedTasks();
    } catch (error) {
      showToast(`Aktivitas kerja tidak dapat dimuat: ${error.message}`, "error");
      document.getElementById("taskForm").querySelector("button").disabled = true;
    }
}

function createSharedTask(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const currentEmployee = getCurrentWorkEmployee();
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      assigneeNip: form.elements.assignee.value,
      dueDate: form.elements.dueDate.value,
      author: window.SiteNexsDemoAccount?.getAccountName("employee") || currentEmployee.name,
      status: "Belum dikerjakan",
      createdAt: Date.now(),
    };
    if (!task.title || !task.description || !getWorkEmployees().some((employee) => employee.nip === task.assigneeNip)) {
      showToast("Lengkapi nama tugas, catatan, dan pilih karyawan dari daftar.", "error");
      return;
    }
    const updatedTasks = [...sharedWorkTasks, task];
    if (!persistWorkCollection(workTasksStorageKey, updatedTasks)) return;
    sharedWorkTasks = updatedTasks;
    form.reset();
    populateTaskAssignees();
    renderSharedTasks();
    addWorkActivity("Tugas dibagikan", `${task.title} · kepada ${getWorkEmployees().find((employee) => employee.nip === task.assigneeNip)?.name || "rekan"}.`, "fa-share-nodes", "is-success");
    const status = document.getElementById("taskFormStatus");
    status.textContent = "Tugas berhasil dibagikan ke daftar kerja tim pada browser ini.";
    status.classList.remove("is-error");
    status.classList.add("is-success");
}

function updateSharedTaskStatus(select) {
    const task = sharedWorkTasks.find((entry) => entry.id === select.dataset.taskStatus);
    if (!task || task.status === select.value) return;
    const previousStatus = task.status;
    const updatedTasks = sharedWorkTasks.map((entry) => entry.id === task.id ? { ...entry, status: select.value } : entry);
    if (!persistWorkCollection(workTasksStorageKey, updatedTasks)) {
      select.value = previousStatus;
      return;
    }
    sharedWorkTasks = updatedTasks;
    addWorkActivity("Progres tugas diperbarui", `${task.title} · ${select.value}.`, select.value === "Selesai" ? "fa-check" : "fa-list-check", select.value === "Selesai" ? "is-success" : "is-warning");
    renderSharedTasks();
}

function renderAttendanceInsight() {
  const insight = document.getElementById("attendanceInsightText");
  if (!insight) return;
  const total = personalHistory.length;
  const present = personalHistory.filter((entry) => entry.status === "Hadir").length;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const tip = rate >= 90
    ? "Pertahankan ritme presensi yang konsisten."
    : rate >= 70
      ? "Coba siapkan pengingat sebelum jadwal masuk agar kehadiran makin konsisten."
      : "Periksa kembali jadwal dan riwayat presensi Anda bersama admin.";
  insight.textContent = total
    ? `Dalam ${total} catatan terbaru, ${present} hari berstatus hadir (${rate}%). ${tip}`
    : "Belum ada riwayat untuk dianalisis. Catat presensi pertama Anda untuk mendapatkan ringkasan.";
}

function renderChart() {
  const values = [92, 100, 95, 100, 0, 100, 94, 100, 100, 0, 100, 97, 100, 96, 100, 100, 91, 100, 0, 100, 100, 95, 100, 100];
  const bars = document.getElementById("attendanceChart");
  bars.innerHTML = values.map((value, index) => {
    const type = value === 0 ? (index === 9 ? "sick" : "permission") : "";
    const height = value === 0 ? 20 : Math.round(30 + value * 0.46);
    return `<span class="chart-bar-group"><i class="chart-bar ${type}" style="height:${height}%;animation-delay:${index * 14}ms"></i></span>`;
  }).join("");
}

function updateEmployeeTotal() {
  const total = 128 + Math.max(0, attendanceRecords.filter((record) => record.isNew).length);
  document.getElementById("statTotal").textContent = total;
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("sidebarScrim").classList.remove("is-open");
}

function stopStream(stream, video, stage) {
  if (stream) stream.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
  if (stage) stage.classList.remove("video-active");
}

function stopAdminCamera() {
  stopStream(adminStream, adminVideo, document.getElementById("adminCameraStage"));
  adminStream = null;
  document.getElementById("captureFaceButton").disabled = true;
  document.getElementById("adminCameraButton").innerHTML = '<i class="fa-solid fa-video"></i> Aktifkan kamera';
}

function stopEmployeeCamera() {
  stopStream(employeeStream, employeeVideo, document.getElementById("employeeCameraStage"));
  closeExpandedCamera();
  employeeStream = null;
  document.getElementById("employeeCameraButton").innerHTML = '<i class="fa-solid fa-video"></i> Aktifkan kamera';
  document.getElementById("cameraStatusText").innerHTML = '<i class="fa-solid fa-circle-info"></i> Menunggu kamera';
}

function closeExpandedCamera() {
  const stage = document.getElementById("employeeCameraStage");
  stage.classList.remove("is-expanded");
  document.body.classList.remove("camera-expanded");
  stage.setAttribute("aria-modal", "false");
  document.getElementById("employeeCameraButton").focus();
}

async function startCamera(kind) {
  const isAdmin = kind === "admin";
  const video = isAdmin ? adminVideo : employeeVideo;
  const stage = document.getElementById(isAdmin ? "adminCameraStage" : "employeeCameraStage");
  const button = document.getElementById(isAdmin ? "adminCameraButton" : "employeeCameraButton");
  const setStatus = (message) => {
    if (!isAdmin) document.getElementById("cameraStatusText").innerHTML = `<i class="fa-solid fa-circle-info"></i> ${escapeHTML(message)}`;
  };

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("Kamera tidak tersedia di konteks ini");
    showToast("Kamera tidak tersedia. Gunakan mode simulasi scan.", "warning");
    return false;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    if (isAdmin) {
      stopStream(adminStream, adminVideo, stage);
      adminStream = stream;
    } else {
      stopStream(employeeStream, employeeVideo, stage);
      employeeStream = stream;
    }
    video.srcObject = stream;
    await video.play();
    stage.classList.add("video-active");
    button.innerHTML = '<i class="fa-solid fa-video-slash"></i> Matikan kamera';
    if (!isAdmin) setStatus("Kamera siap, posisikan wajah");
    if (isAdmin) document.getElementById("captureFaceButton").disabled = false;
    return true;
  } catch (error) {
    const message = error.name === "NotAllowedError" ? "Izin kamera belum diberikan" : error.name === "NotFoundError" ? "Perangkat kamera tidak ditemukan" : "Kamera gagal diakses";
    setStatus(message);
    button.innerHTML = '<i class="fa-solid fa-video"></i> Coba kamera lagi';
    showToast(`${message}. Anda tetap bisa menggunakan simulasi.`, "warning");
    return false;
  } finally {
    button.disabled = false;
  }
}

function captureFaceSample() {
  if (!adminStream || !adminVideo.videoWidth) {
    showToast("Aktifkan kamera sebelum mengambil sampel.", "warning");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = adminVideo.videoWidth;
  canvas.height = adminVideo.videoHeight;
  canvas.getContext("2d").drawImage(adminVideo, 0, 0, canvas.width, canvas.height);
  faceSample = canvas.toDataURL("image/jpeg", .78);
  capturedFace = Boolean(faceSample);
  document.getElementById("enrollmentStatus").textContent = "Sampel wajah berhasil direkam";
  document.getElementById("enrollmentStatus").style.color = "#259b7e";
  document.getElementById("captureFaceButton").innerHTML = '<i class="fa-solid fa-check"></i> Sampel tersimpan';
  showToast("Sampel wajah direkam secara lokal.");
}

function openEmployeeModal() {
  capturedFace = false;
  faceSample = null;
  document.getElementById("employeeForm").reset();
  updateCustomDivisionField();
  document.getElementById("enrollmentStatus").textContent = "Belum ada sampel";
  document.getElementById("enrollmentStatus").style.color = "";
  document.getElementById("captureFaceButton").innerHTML = '<i class="fa-solid fa-camera-retro"></i> Ambil sampel';
  stopAdminCamera();
  employeeModal.showModal();
}

function closeDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (dialog.open) dialog.close();
}

function addEmployee(event) {
  event.preventDefault();
  const name = document.getElementById("newEmployeeName").value.trim();
  const nip = document.getElementById("newEmployeeNip").value.trim();
  const ownerAdminId = document.getElementById("newEmployeeOwner").value;
  const selectedDivision = document.getElementById("newEmployeeDivision").value;
  const role = selectedDivision === "custom" ? document.getElementById("customDivisionName").value.trim() : selectedDivision;
  if (!name || !nip || !role || !ownerAdminId) {
    showToast("Lengkapi nama, ID, jabatan, dan admin pemilik karyawan.", "error");
    return;
  }
  if (!window.SiteNexsDirectory) {
    showToast("Penyimpanan daftar karyawan demo tidak tersedia.", "error");
    return;
  }
  let newEmployee;
  try {
    newEmployee = window.SiteNexsDirectory.addEmployee({ name, nip, role, ownerAdminId, status: "Hadir" });
  } catch (error) {
    showToast(error.message, "error");
    return;
  }
  attendanceRecords.unshift({ ...newEmployee, status: "Hadir", date: "2026-10-31", in: "—", out: "—", lastDate: "Belum ada", lastTime: "—", isNew: true, faceSample: capturedFace ? faceSample : null });
  updateEmployeeTotal();
  renderAttendance();
  closeDialog("employeeModal");
  stopAdminCamera();
  showToast(capturedFace ? `${name} ditambahkan dengan sampel wajah.` : `${name} ditambahkan. Sampel wajah dapat direkam nanti.`);
  capturedFace = false;
}

function updateCustomDivisionField() {
  const isCustom = document.getElementById("newEmployeeDivision").value === "custom";
  const field = document.getElementById("customDivisionField");
  const input = document.getElementById("customDivisionName");
  field.classList.toggle("is-hidden", !isCustom);
  input.required = isCustom;
  if (!isCustom) input.value = "";
}

function showAttachment(request) {
  selectedAttachment = request;
  document.getElementById("attachmentTitle").textContent = request.file;
  document.getElementById("attachmentSubtitle").textContent = `${request.name} · ${request.type} · ${request.range}`;
  document.getElementById("documentName").textContent = request.name;
  document.getElementById("documentReason").textContent = request.reason;
  document.getElementById("documentDate").textContent = request.range;
  attachmentModal.showModal();
}

function handleRequestAction(event) {
  const button = event.target.closest("[data-request-action]");
  if (!button) return;
  const request = requests.find((entry) => entry.id === Number(button.dataset.requestId));
  if (!request) return;
  const action = button.dataset.requestAction;
  if (action === "preview") {
    showAttachment(request);
    return;
  }
  if (request.status !== "Menunggu") return;
  request.status = action === "approve" ? "Disetujui" : "Ditolak";
  renderRequests();
  showToast(`${request.name}: pengajuan ${request.status.toLowerCase()}.`);
}

function updateScanFeedback(state, title, message, time = "--:--") {
  const feedback = document.getElementById("scanFeedback");
  feedback.classList.remove("success", "error", "is-busy");
  if (state) feedback.classList.add(state);
  document.getElementById("scanFeedbackTitle").textContent = title;
  document.getElementById("scanFeedbackMessage").textContent = message;
  document.getElementById("scanFeedbackTime").textContent = time;
}

function addPersonalAttendance(type, locationAssessment) {
  const now = new Date();
  const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const date = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(now);
  const existing = personalHistory.find((entry) => entry.date === date);
  if (type === "in" && existing) {
    existing.in = time;
  } else if (type === "out" && existing) {
    existing.out = time;
  } else {
    personalHistory.unshift({ date, in: type === "in" ? time : "—", out: type === "out" ? time : "—", status: "Hadir" });
  }
  renderPersonalHistory();
  addWorkActivity(
    type === "in" ? "Presensi masuk berhasil" : "Presensi pulang berhasil",
    `${locationAssessment.status === "tepat" ? "Lokasi tepat" : locationAssessment.status === "tidak-tepat" ? "Lokasi tidak tepat" : "Lokasi tidak terverifikasi"} · ${locationAssessment.message}`,
    type === "in" ? "fa-arrow-right-to-bracket" : "fa-arrow-right-from-bracket",
    locationAssessment.status === "tidak-tepat" ? "is-warning" : "is-success",
  );
  const today = now.toISOString().slice(0, 10);
  let record = attendanceRecords.find((entry) => entry.nip === "SNX-2023-014" && entry.date === today);
  if (!record) {
    record = { name: "Ayu Ramadhani", nip: "SNX-2023-014", role: "Product Designer", status: "Hadir", date: today, in: "—", out: "—", lastDate: "Hari ini", lastTime: time };
    attendanceRecords.unshift(record);
  }
  if (type === "in") record.in = time;
  else record.out = time;
  record.lastDate = "Hari ini";
  record.lastTime = time;
  renderAttendance();
}

async function performScan(useDemo = false) {
  const stage = document.getElementById("employeeCameraStage");
  const button = document.getElementById("scanButton");
  const gps = window.SiteNexsGpsAttendance;
  const employee = gps?.getCurrentEmployee();
  let locationAssessment = { status: "gps-tidak-tersedia", distanceMeters: null, allowed: true, message: "GPS tidak tersedia pada halaman ini." };

  if (gps && employee) {
    try {
      const location = await gps.getCurrentLocation();
      locationAssessment = gps.assessAttendance(employee.nip, location);
    } catch (error) {
      try {
        locationAssessment = gps.assessAttendance(employee.nip, null);
      } catch (settingsError) {
        updateScanFeedback("error", "Pengaturan GPS tidak valid", settingsError.message);
        showToast(`Presensi tidak dapat diperiksa: ${settingsError.message}`, "error");
        return;
      }
      if (locationAssessment.allowed) {
        showToast(`${error.message} Presensi akan ditandai tidak terverifikasi.`, "warning");
      }
    }
    const employeeGpsStatus = document.querySelector("[data-gps-employee-status]");
    if (employeeGpsStatus) {
      employeeGpsStatus.textContent = locationAssessment.message;
      employeeGpsStatus.classList.toggle("is-success", locationAssessment.status === "tepat");
      employeeGpsStatus.classList.toggle("is-error", locationAssessment.status !== "tepat");
    }
    if (!locationAssessment.allowed) {
      updateScanFeedback("error", "Lokasi belum sesuai", locationAssessment.message);
      showToast(`Presensi diblokir: ${locationAssessment.message}`, "error");
      return;
    }
    if (locationAssessment.status !== "tepat" && locationAssessment.message) {
      showToast(`Presensi akan dicatat sebagai ${locationAssessment.status === "tidak-tepat" ? "tidak tepat" : "tidak terverifikasi"}. ${locationAssessment.message}`, "warning");
    }
  }

  if (!useDemo && !employeeStream) {
    const connected = await startCamera("employee");
    if (!connected) {
      updateScanFeedback("error", "Kamera belum tersedia", "Aktifkan izin kamera atau pilih simulasi scan.");
      return;
    }
  }
  if (button.disabled) return;
  if (!useDemo) {
    stage.classList.add("is-expanded");
    document.body.classList.add("camera-expanded");
    stage.setAttribute("aria-modal", "true");
    document.getElementById("cameraExpandClose").focus();
  }
  button.disabled = true;
  stage.classList.add("is-scanning");
  document.getElementById("scanButton").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memindai wajah';
  updateScanFeedback("is-busy", "Memverifikasi wajah...", useDemo ? "Simulasi berjalan di perangkat ini." : "Pastikan wajah tetap berada di dalam bingkai.");
  document.getElementById("scanFeedback").classList.add("is-busy");
  window.clearTimeout(scanTimeout);
  scanTimeout = window.setTimeout(() => {
    stage.classList.remove("is-scanning");
    stage.classList.add("is-success");
    const now = new Date();
    const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    const actionName = selectedScanType === "in" ? "Absen masuk" : "Absen keluar";
    const attendanceMessage = `${useDemo ? "Presensi simulasi tersimpan di sesi ini." : "Wajah cocok · verifikasi simulasi lokal."} ${locationAssessment.message}`;
    updateScanFeedback("success", `${actionName} berhasil`, attendanceMessage, `${time} WIB`);
    document.getElementById("scanButton").innerHTML = '<i class="fa-solid fa-check"></i> Berhasil';
    if (gps && employee) {
      try {
        gps.recordAttendance(employee, selectedScanType, locationAssessment);
      } catch (error) {
        showToast(`Presensi tersimpan, tetapi catatan GPS gagal disimpan: ${error.message}`, "error");
      }
    }
    addPersonalAttendance(selectedScanType, locationAssessment);
    showToast(`${actionName} berhasil pada ${time} WIB.`);
    window.setTimeout(() => {
      stage.classList.remove("is-success");
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-expand"></i> Scan lagi';
    }, 1400);
  }, 1700);
}

function setScanType(type) {
  selectedScanType = type;
  document.querySelectorAll(".scan-mode").forEach((button) => button.classList.toggle("is-active", button.dataset.scanType === type));
  const action = type === "in" ? "Absen masuk" : "Absen keluar";
  document.getElementById("scanFeedbackTitle").textContent = `Siap ${action.toLowerCase()}`;
  document.getElementById("scanFeedbackMessage").textContent = "Aktifkan kamera atau gunakan mode simulasi.";
  document.getElementById("scanFeedback").classList.remove("success", "error");
}

function setLeaveType(type) {
  selectedLeaveType = type;
  document.querySelectorAll(".leave-tab").forEach((button) => {
    const selected = button.dataset.leaveType === type;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  const uploadTitle = document.getElementById("uploadTitle");
  uploadTitle.innerHTML = type === "Sakit" ? 'Surat keterangan dokter <small>(opsional)</small>' : 'Lampirkan dokumen <small>(opsional)</small>';
}

function setSelectedFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast("Ukuran file maksimal 5 MB.", "error");
    return;
  }
  currentFile = file;
  document.getElementById("uploadTitle").textContent = file.name;
  document.getElementById("uploadHelp").textContent = `${(file.size / 1024).toFixed(0)} KB · siap dilampirkan`;
  document.getElementById("uploadZone").classList.add("has-file");
}

function submitLeaveRequest(event) {
  event.preventDefault();
  const start = document.getElementById("leaveStart").value;
  const end = document.getElementById("leaveEnd").value;
  const reason = document.getElementById("leaveReason").value.trim();
  if (!start || !end || !reason) {
    showToast("Lengkapi tanggal dan alasan pengajuan.", "warning");
    return;
  }
  if (end < start) {
    showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", "error");
    return;
  }
  const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const range = start === end ? dateFormatter.format(new Date(`${start}T00:00:00`)) : `${dateFormatter.format(new Date(`${start}T00:00:00`))} — ${dateFormatter.format(new Date(`${end}T00:00:00`))}`;
  const type = selectedLeaveType;
  const file = currentFile?.name || (type === "Sakit" ? "surat-keterangan-sakit.pdf" : "dokumen-pendukung.pdf");
  requests.unshift({ id: Date.now(), name: "Ayu Ramadhani", nip: "SNX-2023-014", type, date: dateFormatter.format(new Date()), range, reason, file, status: "Menunggu" });
  renderRequests();
  addWorkActivity(`Pengajuan ${type.toLowerCase()} dikirim`, `${range} · Menunggu peninjauan admin.`, type === "Sakit" ? "fa-kit-medical" : "fa-calendar-minus", "is-warning");
  document.getElementById("leaveForm").reset();
  currentFile = null;
  document.getElementById("uploadTitle").innerHTML = 'Lampirkan dokumen <small>(opsional)</small>';
  document.getElementById("uploadHelp").textContent = "Klik atau tarik file ke sini · PDF, JPG maks. 5 MB";
  document.getElementById("uploadZone").classList.remove("has-file");
  setLeaveType("Izin");
  showToast(`Pengajuan ${type.toLowerCase()} berhasil dikirim ke admin.`);
}

document.getElementById("yearFilter").addEventListener("change", renderAttendance);
document.getElementById("monthFilter").addEventListener("change", renderAttendance);
document.getElementById("employeeSearch").addEventListener("input", renderAttendance);
document.getElementById("filterButton").addEventListener("click", () => {
  document.getElementById("employeeSearch").focus();
  showToast("Filter tahun, bulan, dan pencarian siap digunakan.", "warning");
});
document.getElementById("exportButton").addEventListener("click", () => showToast("Rekap siap diekspor pada versi simulasi.", "warning"));
document.getElementById("viewAllRequests").addEventListener("click", () => {
  showToast(`${requests.length} pengajuan ada di daftar review.`);
  document.getElementById("requestsSection").scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("addEmployeeButton").addEventListener("click", openEmployeeModal);
document.getElementById("navAddEmployee").addEventListener("click", openEmployeeModal);
document.getElementById("employeeAddEmployeeButton").addEventListener("click", openEmployeeModal);
document.getElementById("employeeNavAddEmployee").addEventListener("click", openEmployeeModal);
document.getElementById("employeeForm").addEventListener("submit", addEmployee);
document.getElementById("taskForm").addEventListener("submit", createSharedTask);
document.getElementById("taskList").addEventListener("change", (event) => {
  if (event.target.matches("[data-task-status]")) updateSharedTaskStatus(event.target);
});
document.getElementById("newEmployeeDivision").addEventListener("change", updateCustomDivisionField);
document.getElementById("captureFaceButton").addEventListener("click", captureFaceSample);
document.getElementById("adminCameraButton").addEventListener("click", () => adminStream ? stopAdminCamera() : startCamera("admin"));
document.getElementById("employeeCameraButton").addEventListener("click", () => employeeStream ? stopEmployeeCamera() : startCamera("employee"));
document.getElementById("cameraExpandClose").addEventListener("click", closeExpandedCamera);
document.getElementById("scanButton").addEventListener("click", () => performScan(false));
document.getElementById("demoScanButton").addEventListener("click", () => performScan(true));
document.getElementById("requestList").addEventListener("click", handleRequestAction);
document.getElementById("leaveForm").addEventListener("submit", submitLeaveRequest);
document.getElementById("leaveFile").addEventListener("change", (event) => setSelectedFile(event.target.files[0]));

document.querySelectorAll(".scan-mode").forEach((button) => button.addEventListener("click", () => setScanType(button.dataset.scanType)));
document.querySelectorAll(".leave-tab").forEach((button) => button.addEventListener("click", () => setLeaveType(button.dataset.leaveType)));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.closeDialog)));

employeeModal.addEventListener("close", stopAdminCamera);
attachmentModal.addEventListener("click", (event) => {
  if (event.target === attachmentModal) attachmentModal.close();
});
employeeModal.addEventListener("click", (event) => {
  if (event.target === employeeModal) employeeModal.close();
});

document.querySelectorAll("[data-nav]").forEach((link) => link.addEventListener("click", () => {
  const siblings = link.closest(".nav-group").querySelectorAll(".nav-link");
  siblings.forEach((sibling) => sibling.classList.remove("is-current"));
  link.classList.add("is-current");
  closeSidebar();
}));

document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("is-open");
  document.getElementById("sidebarScrim").classList.toggle("is-open");
});
document.getElementById("sidebarScrim").addEventListener("click", closeSidebar);
document.querySelector("[data-demo-logout]").addEventListener("click", () => {
  sessionStorage.removeItem("sitenexsDemoRole");
});
document.getElementById("notificationButton").addEventListener("click", () => showToast("Ada 3 pengajuan yang menunggu review.", "warning"));
document.getElementById("helpButton").addEventListener("click", () => showToast("Hubungi support melalui support@sitenexs.com."));
document.getElementById("personalPeriod").addEventListener("click", () => showToast("Ringkasan menampilkan Oktober 2026.", "warning"));
document.getElementById("historyMonthButton").addEventListener("click", () => showToast("Riwayat menampilkan bulan Oktober 2026.", "warning"));
document.getElementById("refreshAttendanceInsight").addEventListener("click", renderAttendanceInsight);
document.addEventListener("keydown", (event) => {
  if (!document.body.classList.contains("camera-expanded")) return;
  if (event.key === "Escape") {
    closeExpandedCamera();
  } else if (event.key === "Tab") {
    event.preventDefault();
    document.getElementById("cameraExpandClose").focus();
  }
});

const uploadZone = document.getElementById("uploadZone");
["dragenter", "dragover"].forEach((type) => uploadZone.addEventListener(type, (event) => {
  event.preventDefault();
  uploadZone.classList.add("is-dragging");
}));
["dragleave", "drop"].forEach((type) => uploadZone.addEventListener(type, (event) => {
  event.preventDefault();
  uploadZone.classList.remove("is-dragging");
}));
uploadZone.addEventListener("drop", (event) => setSelectedFile(event.dataTransfer.files[0]));

window.addEventListener("beforeunload", () => {
  stopStream(adminStream, adminVideo, document.getElementById("adminCameraStage"));
  stopStream(employeeStream, employeeVideo, document.getElementById("employeeCameraStage"));
});

window.addEventListener("storage", (event) => {
  if (event.key !== workTasksStorageKey) return;
  try {
    sharedWorkTasks = readWorkCollection(workTasksStorageKey);
    renderSharedTasks();
  } catch (error) {
    showToast(`Aktivitas kerja tidak dapat diperbarui: ${error.message}`, "error");
  }
});

renderAttendance();
renderRequests();
renderPersonalHistory();
initializeWorkCollaboration();
renderChart();
updateEmployeeTotal();
setLeaveType("Izin");