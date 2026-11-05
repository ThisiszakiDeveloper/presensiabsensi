"use strict";

const defaultEmployeeEmail = "ayu.ramadhani@example.com";
const isEmployeeDemo = sessionStorage.getItem("sitenexsDemoRole") === "employee";
if (isEmployeeDemo) {
  document.getElementById("adminNavigation").classList.add("is-hidden");
  document.getElementById("employeeNavigation").classList.remove("is-hidden");
  document.getElementById("adminView").classList.add("is-hidden");
  document.getElementById("employeeView").classList.remove("is-hidden");
  document.getElementById("employeeAddEmployeeButton").classList.add("is-hidden");
  document.getElementById("menu-tambah-karyawan")?.classList.add("is-hidden");
  document.getElementById("taskForm").classList.add("is-hidden");
  document.querySelectorAll(".avatar-admin").forEach((avatar) => {
    avatar.classList.remove("avatar-admin");
    avatar.classList.add("avatar-1");
  });
}

const currentAdminId = sessionStorage.getItem("sitenexsDemoAdminId") || "raka-aditya";
function workspaceStorageKey(key) {
  const scopedKey = `${key}:${currentAdminId}`;
  if (localStorage.getItem(scopedKey)) return scopedKey;
  return currentAdminId === "raka-aditya" && localStorage.getItem(key) ? key : scopedKey;
}

const attendanceStorageKey = workspaceStorageKey("sitenexsAttendanceRecords");
const requestStorageKey = workspaceStorageKey("sitenexsAttendanceRequests");
const legacyPersonalHistoryStorageKey = "sitenexsPersonalAttendance";
const currentEmployeeEmail = sessionStorage.getItem("sitenexsDemoEmployeeEmail") || defaultEmployeeEmail;
const personalHistoryStorageKey = `sitenexsPersonalAttendance:${currentEmployeeEmail}`;
function loadLocalArray(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback.map((entry) => ({ ...entry }));
    const value = JSON.parse(stored);
    if (!Array.isArray(value)) throw new Error("Data tersimpan bukan daftar yang valid.");
    return value;
  } catch (error) {
    showToast(`Data ${key} gagal dimuat: ${error.message}`, "error");
    return fallback.map((entry) => ({ ...entry }));
  }
}

function saveLocalArray(key, entries) {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
    return true;
  } catch (error) {
    showToast(`Data ${key} gagal disimpan: ${error.message}`, "error");
    return false;
  }
}

function replaceLocalArray(target, next) {
  if (!Array.isArray(next)) throw new Error("Data tersimpan bukan daftar yang valid.");
  target.splice(0, target.length, ...next);
}

const demoSeedDate = localDateKey();
const attendanceRecords = loadLocalArray(attendanceStorageKey, currentAdminId === "raka-aditya" ? [
  { name: "Ayu Ramadhani", email: "ayu.ramadhani@example.com", role: "Product Designer", status: "Hadir", date: demoSeedDate, in: "08:52", out: "—", lastDate: "Hari ini", lastTime: "08:52" },
  { name: "Bima Pratama", email: "bima.pratama@example.com", role: "Frontend Engineer", status: "Hadir", date: demoSeedDate, in: "08:41", out: "—", lastDate: "Hari ini", lastTime: "08:41" },
  { name: "Citra Maharani", email: "citra.maharani@example.com", role: "People Operations", status: "Izin", date: demoSeedDate, in: "—", out: "—", lastDate: "Hari ini", lastTime: "—" },
  { name: "Dimas Saputra", email: "dimas.saputra@example.com", role: "Backend Engineer", status: "Hadir", date: demoSeedDate, in: "08:58", out: "—", lastDate: "Hari ini", lastTime: "08:58" },
  { name: "Elisa Putri", email: "elisa.putri@example.com", role: "Marketing Specialist", status: "Sakit", date: demoSeedDate, in: "—", out: "—", lastDate: "Hari ini", lastTime: "—" },
  { name: "Farhan Akbar", email: "farhan.akbar@example.com", role: "Finance Analyst", status: "Hadir", date: demoSeedDate, in: "08:46", out: "—", lastDate: "Hari ini", lastTime: "08:46" },
  { name: "Gita Anindya", email: "gita.anindya@example.com", role: "UX Researcher", status: "Hadir", date: "2026-09-30", in: "08:50", out: "17:04", lastDate: "30 Sep 2026", lastTime: "08:50" },
  { name: "Hafiz Maulana", email: "hafiz.maulana@example.com", role: "Operations Lead", status: "Izin", date: "2025-11-18", in: "—", out: "—", lastDate: "17 Nov 2025", lastTime: "16:55" },
  { name: "Naya Putri", email: "naya.putri@example.com", role: "People Operations", status: "Sakit", date: "2024-03-12", in: "—", out: "—", lastDate: "11 Mar 2024", lastTime: "17:02" },
] : []);

const requests = loadLocalArray(requestStorageKey, currentAdminId === "raka-aditya" ? [
  { id: 1, name: "Elisa Putri", email: "elisa.putri@example.com", type: "Sakit", date: "31 Okt 2026", range: "31 Okt 2026", reason: "Demam dan perlu istirahat", file: "surat-dokter-elisa.pdf", status: "Menunggu" },
  { id: 2, name: "Citra Maharani", email: "citra.maharani@example.com", type: "Izin", date: "31 Okt 2026", range: "02 Nov — 03 Nov 2026", reason: "Keperluan keluarga", file: "surat-izin-citra.pdf", status: "Menunggu" },
  { id: 3, name: "Rizky Hidayat", email: "rizky.hidayat@example.com", type: "Sakit", date: "30 Okt 2026", range: "30 Okt 2026", reason: "Kontrol kesehatan", file: "surat-klinik-rizky.pdf", status: "Menunggu" },
] : []);

const personalHistorySeed = [
  { daysAgo: 0, in: "08:48", out: "17:12", status: "Hadir" },
  { daysAgo: 1, in: "08:55", out: "17:06", status: "Hadir" },
  { daysAgo: 2, in: "08:51", out: "17:18", status: "Hadir" },
  { daysAgo: 3, in: "—", out: "—", status: "Izin" },
  { daysAgo: 4, in: "08:47", out: "17:01", status: "Hadir" },
].map((entry) => {
  const date = new Date();
  date.setDate(date.getDate() - entry.daysAgo);
  return {
    in: entry.in,
    out: entry.out,
    status: entry.status,
    date: new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(date),
    isoDate: localDateKey(date),
  };
});
const personalHistoryFallback = currentEmployeeEmail === defaultEmployeeEmail
  ? loadLocalArray(legacyPersonalHistoryStorageKey, personalHistorySeed)
  : personalHistorySeed;
const personalHistory = loadLocalArray(personalHistoryStorageKey, personalHistoryFallback);
const workActivities = personalHistory.map((entry) => ({
  title: entry.status === "Hadir" ? "Presensi hadir tercatat" : `Status presensi: ${entry.status.toLowerCase()}`,
  detail: entry.in !== "—" ? `Masuk ${entry.in}${entry.out !== "—" ? ` · Pulang ${entry.out}` : ""}` : "Tidak ada jam masuk pada catatan ini.",
  date: entry.date,
  icon: entry.status === "Hadir" ? "fa-check" : "fa-calendar-minus",
  type: entry.status === "Hadir" ? "is-success" : "is-warning",
}));
const workTasksStorageKey = workspaceStorageKey("sitenexsWorkTasks");
const taskActivityStorageKey = workspaceStorageKey("sitenexsTaskActivity");
const activityJournalStorageKey = workspaceStorageKey("sitenexsActivityJournal");
const notificationsStorageKey = workspaceStorageKey("sitenexsNotifications");
const allowedNotificationHrefs = new Set(["#workActivitySection", "#leaveSection", "#requestsSection"]);
const activityJournalEntries = loadLocalArray(activityJournalStorageKey, []);
const activityJournalPageSize = 5;
let adminJournalPage = 1;
let employeeJournalPage = 1;
let employeeHistoryPage = 1;
let activeEmployeeHistoryEmail = "";
let activeLocationPolicyEmployee = null;
let pendingApprovalRequestId = null;
let sharedWorkTasks = [];
let sharedTaskActivities = [];
let notificationItems = [];

const attendanceRows = document.getElementById("attendanceRows");
const requestList = document.getElementById("requestList");
const employeeModal = document.getElementById("employeeModal");
const adminTaskDialog = document.getElementById("adminTaskDialog");
const employeeLocationDialog = document.getElementById("employeeLocationDialog");
const approveRequestConfirmDialog = document.getElementById("approveRequestConfirmDialog");
const attachmentModal = document.getElementById("attachmentModal");
const employeeVideo = document.getElementById("employeeVideo");
const adminVideo = document.getElementById("adminVideo");

let selectedScanType = "in";
let selectedLeaveType = "Izin";
let attendancePage = 1;
const attendancePageSize = 5;
let selectedAttachment = null;
let adminStream = null;
let employeeStream = null;
let capturedFace = false;
let faceSample = null;
let currentFile = null;
let leaveSubmissionPending = false;
let scanTimeout = null;
let editingEmployeeEmail = null;
let attachmentDbPromise = null;
let attachmentObjectUrl = null;
let activityJournalDbPromise = null;
let activityMediaObjectUrl = null;
let pendingActivityDeleteId = null;
let activeJournalPreviewId = null;

const initials = (name) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : type === "warning" ? " is-warning" : ""}`;
  const icon = type === "error" ? "fa-circle-exclamation" : type === "warning" ? "fa-triangle-exclamation" : "fa-circle-check";
  const iconElement = document.createElement("i");
  iconElement.className = `fa-solid ${icon}`;
  iconElement.setAttribute("aria-hidden", "true");
  const messageElement = document.createElement("span");
  messageElement.textContent = message;
  toast.append(iconElement, messageElement);
  const region = document.getElementById("toastRegion");
  if (!region) {
    console.error("Toast region is unavailable.", message);
    return;
  }
  region.append(toast);
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(5px)";
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#0d1721" : "#f4fbfc");
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.innerHTML = `<i class="fa-solid ${isDark ? "fa-sun" : "fa-moon"}" aria-hidden="true"></i>`;
  const label = isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap";
  toggle.setAttribute("aria-label", label);
  toggle.title = label;
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("sitenexsTheme") || "light";
  applyTheme(savedTheme);
  document.getElementById("themeToggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("sitenexsTheme", nextTheme);
    } catch (error) {
      showToast(`Tema tidak dapat disimpan di browser: ${error.message}`, "error");
      return;
    }
    applyTheme(nextTheme);
  });
}

function readNotifications() {
  const saved = localStorage.getItem(notificationsStorageKey);
  if (!saved) return null;
  const entries = JSON.parse(saved);
  if (!Array.isArray(entries) || entries.some((entry) =>
    !entry || typeof entry.id !== "string" || typeof entry.title !== "string"
    || typeof entry.detail !== "string" || !allowedNotificationHrefs.has(entry.href)
    || !Number.isFinite(entry.createdAt) || typeof entry.read !== "boolean",
  )) {
    throw new Error("Data notifikasi di browser tidak valid.");
  }
  return entries;
}

function saveNotifications(entries) {
  try {
    localStorage.setItem(notificationsStorageKey, JSON.stringify(entries));
    notificationItems = entries;
    renderNotifications();
    return true;
  } catch (error) {
    showToast(`Notifikasi tidak dapat disimpan di browser: ${error.message}`, "error");
    return false;
  }
}

function formatNotificationTime(timestamp) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    .format(new Date(timestamp));
}

function renderNotifications() {
  const list = document.getElementById("notificationList");
  if (!list) return;
  list.replaceChildren();
  const unreadCount = notificationItems.filter((item) => !item.read).length;
  const badge = document.getElementById("notificationCount");
  badge.hidden = unreadCount === 0;
  badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
  document.getElementById("notificationButton").setAttribute(
    "aria-label",
    unreadCount ? `Buka notifikasi, ${unreadCount} belum dibaca` : "Buka notifikasi",
  );
  document.getElementById("notificationSummary").textContent = unreadCount
    ? `${unreadCount} notifikasi belum dibaca`
    : "Semua notifikasi sudah dibaca";
  if (notificationItems.length === 0) {
    const empty = document.createElement("li");
    empty.className = "notification-empty";
    empty.textContent = "Belum ada notifikasi baru.";
    list.append(empty);
    return;
  }
  notificationItems.slice(0, 20).forEach((item) => {
    const row = document.createElement("li");
    row.className = `notification-item${item.read ? "" : " is-unread"}`;
    const link = document.createElement("a");
    link.className = "notification-link";
    link.href = item.href;
    link.dataset.notificationId = item.id;
    const icon = document.createElement("span");
    icon.className = "notification-icon";
    icon.innerHTML = '<i class="fa-solid fa-bell" aria-hidden="true"></i>';
    const copy = document.createElement("span");
    copy.className = "notification-copy";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const detail = document.createElement("span");
    detail.textContent = item.detail;
    const time = document.createElement("time");
    time.dateTime = new Date(item.createdAt).toISOString();
    time.textContent = formatNotificationTime(item.createdAt);
    copy.append(title, detail, time);
    link.append(icon, copy);
    if (!item.read) {
      const unreadDot = document.createElement("span");
      unreadDot.className = "notification-unread-dot";
      unreadDot.setAttribute("aria-label", "Belum dibaca");
      link.append(unreadDot);
    }
    row.append(link);
    list.append(row);
  });
}

function addNotification(title, detail, href = "#workActivitySection") {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    detail,
    href,
    createdAt: Date.now(),
    read: false,
  };
  saveNotifications([entry, ...notificationItems].slice(0, 50));
}

function initializeNotifications() {
  try {
    const saved = readNotifications();
    if (saved) {
      notificationItems = saved;
    } else {
      notificationItems = [{
        id: "welcome-workspace",
        title: "Pusat notifikasi siap",
        detail: "Pembaruan tugas dan pengajuan akan muncul di sini.",
        href: "#workActivitySection",
        createdAt: Date.now(),
        read: false,
      }];
      localStorage.setItem(notificationsStorageKey, JSON.stringify(notificationItems));
    }
    renderNotifications();
  } catch (error) {
    showToast(`Notifikasi tidak dapat dimuat: ${error.message}`, "error");
  }
}

function setAllNotificationsRead() {
  if (!notificationItems.some((item) => !item.read)) return;
  saveNotifications(notificationItems.map((item) => ({ ...item, read: true })));
}

function syncDirectoryEmployees() {
  const employees = window.SiteNexsDirectory.getEmployeesForAdmin(currentAdminId);
  const activeEmails = new Set(employees.map((employee) => employee.email.toLowerCase()));
  for (let index = attendanceRecords.length - 1; index >= 0; index -= 1) {
    if (!activeEmails.has(attendanceRecords[index].email.toLowerCase())) attendanceRecords.splice(index, 1);
  }
  employees.forEach((employee) => {
    const existing = attendanceRecords.find((record) => record.email.toLowerCase() === employee.email.toLowerCase());
    if (existing) {
      existing.name = employee.name;
      existing.role = employee.role;
      existing.employmentStatus = employee.employmentStatus;
      return;
    }
    attendanceRecords.push({
      ...employee,
      status: employee.employmentStatus === "inactive" ? "Nonaktif" : employee.status || "Alpa",
      date: localDateKey(),
      in: "—",
      out: "—",
      lastDate: "Belum ada",
      lastTime: "—",
      isNew: true,
    });
  });
  if (!saveLocalArray(attendanceStorageKey, attendanceRecords)) return;
  renderAttendance();
  updateEmployeeTotal();
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

window.addEventListener("sitenexs:directory-updated", () => {
  try {
    syncDirectoryEmployees();
  } catch (error) {
    showToast(`Daftar karyawan tidak dapat diperbarui: ${error.message}`, "error");
  }
});

function statusClass(status) {
  if (status === "Hadir") return "status-hadir";
  if (status === "Izin" || status === "Cuti") return "status-izin";
  if (status === "Sakit") return "status-sakit";
  if (status === "Terlambat") return "status-late";
  if (status === "Nonaktif") return "status-inactive";
  if (status === "Alpa") return "status-absent";
  return "status-pending";
}

function renderAttendance() {
  const year = document.getElementById("yearFilter").value;
  const month = document.getElementById("monthFilter").value;
  const status = document.getElementById("attendanceStatusFilter").value;
  const query = document.getElementById("employeeSearch").value.trim().toLowerCase();
  const records = status === "Alpa" ? getAlpaAttendanceRecords() : attendanceRecords;
  const results = records.filter((record) => {
    const date = new Date(`${record.date}T00:00:00`);
    const yearMatches = String(date.getFullYear()) === year;
    const monthMatches = month === "all" || String(date.getMonth()) === month;
    const searchMatches = `${record.name} ${record.email}`.toLowerCase().includes(query);
    const displayStatus = record.employmentStatus === "inactive" ? "Nonaktif" : record.status;
    const statusMatches = status === "all" || displayStatus === status;
    return yearMatches && monthMatches && searchMatches && statusMatches;
  });

  const pageCount = Math.max(1, Math.ceil(results.length / attendancePageSize));
  attendancePage = Math.min(attendancePage, pageCount);
  const pageRecords = results.slice((attendancePage - 1) * attendancePageSize, attendancePage * attendancePageSize);
  attendanceRows.innerHTML = pageRecords.map((record, index) => {
    const displayStatus = record.employmentStatus === "inactive" ? "Nonaktif" : record.status;
    return `
    <tr>
      <td><div class="employee-cell"><span class="employee-avatar avatar-${(index % 6) + 1}">${escapeHTML(initials(record.name))}</span><span class="employee-name"><strong>${escapeHTML(record.name)}</strong><small>${escapeHTML(record.email)}</small></span></div></td>
      <td><span class="job-title">${escapeHTML(record.role)}</span></td>
      <td><span class="status-badge ${statusClass(displayStatus)}">${escapeHTML(displayStatus)}</span></td>
      <td>${new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${record.date}T00:00:00`))}</td>
      <td><span class="table-time">${escapeHTML(record.in)}</span></td>
      <td><span class="table-time">${escapeHTML(record.out)}</span></td>
      <td><span class="last-seen"><strong>${escapeHTML(record.lastDate)}</strong><small>${escapeHTML(record.lastTime)} WIB</small></span></td>
      <td class="employee-actions-cell"><div class="employee-row-actions">
        <button class="employee-row-menu-toggle" type="button" aria-label="Aksi untuk ${escapeHTML(record.name)}" aria-haspopup="menu" aria-expanded="false" data-employee-menu-toggle><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>
        <div class="employee-row-menu" role="menu" hidden>
          <button type="button" role="menuitem" data-employee-action="edit" data-employee-email="${escapeHTML(record.email)}"><i class="fa-regular fa-pen-to-square"></i> Edit karyawan</button>
          <button type="button" role="menuitem" data-employee-action="history" data-employee-email="${escapeHTML(record.email)}"><i class="fa-solid fa-clock-rotate-left"></i> Riwayat aktivitas</button>
          <button type="button" role="menuitem" data-employee-action="location" data-employee-email="${escapeHTML(record.email)}"><i class="fa-solid fa-location-dot"></i> Atur aturan lokasi</button>
          <button type="button" role="menuitem" data-employee-action="toggle-active" data-employee-active="${record.employmentStatus !== "inactive"}" data-employee-email="${escapeHTML(record.email)}"><i class="fa-solid ${record.employmentStatus === "inactive" ? "fa-user-check" : "fa-user-slash"}"></i> ${record.employmentStatus === "inactive" ? "Aktifkan akun" : "Nonaktifkan akun"}</button>
          <button type="button" role="menuitem" class="employee-delete-action" data-employee-action="delete" data-employee-email="${escapeHTML(record.email)}"><i class="fa-regular fa-trash-can"></i> Hapus karyawan</button>
        </div>
      </div></td>
    </tr>`;
  }).join("");

  document.getElementById("emptyAttendance").classList.toggle("is-hidden", results.length > 0);
  const firstRecord = results.length ? (attendancePage - 1) * attendancePageSize + 1 : 0;
  const lastRecord = Math.min(attendancePage * attendancePageSize, results.length);
  document.getElementById("resultCount").textContent = results.length
    ? `Menampilkan ${firstRecord}–${lastRecord} dari ${results.length} data`
    : "Tidak ada data yang cocok";
  renderAttendancePagination(pageCount);
  refreshAdminStats();
}

function getAlpaAttendanceRecords() {
  const today = localDateKey();
  const employees = getWorkEmployees().filter((employee) => employee.employmentStatus !== "inactive");
  const todayRecords = attendanceRecords.filter((record) => record.date === today);
  const statusByEmail = new Map(todayRecords.map((record) => [record.email, record.status]));
  return employees
    .filter((employee) => !["Hadir", "Terlambat", "Izin", "Cuti", "Sakit"].includes(statusByEmail.get(employee.email)))
    .map((employee) => todayRecords.find((record) => record.email === employee.email) || ({
      ...employee,
      status: "Alpa",
      date: today,
      in: "—",
      out: "—",
      lastDate: "Belum ada",
      lastTime: "—",
    }));
}

function renderAttendancePagination(pageCount) {
  const pagination = document.getElementById("attendancePagination");
  pagination.replaceChildren();
  const addButton = (label, page, { disabled = false, active = false, ariaLabel = label } = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `page-number${active ? " is-active" : ""}`;
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    if (active) button.setAttribute("aria-current", "page");
    button.disabled = disabled;
    button.dataset.attendancePage = String(page);
    pagination.append(button);
  };
  addButton("‹", attendancePage - 1, { disabled: attendancePage <= 1, ariaLabel: "Halaman sebelumnya" });
  const pages = new Set([1, pageCount, attendancePage - 1, attendancePage, attendancePage + 1]);
  let previousPage = 0;
  [...pages].filter((page) => page >= 1 && page <= pageCount).sort((left, right) => left - right).forEach((page) => {
    if (previousPage && page - previousPage > 1) {
      const gap = document.createElement("span");
      gap.textContent = "…";
      pagination.append(gap);
    }
    addButton(String(page), page, { active: page === attendancePage, ariaLabel: `Halaman ${page}` });
    previousPage = page;
  });
  addButton("›", attendancePage + 1, { disabled: attendancePage >= pageCount, ariaLabel: "Halaman berikutnya" });
}

function renderRequests() {
  requestList.innerHTML = requests.map((request) => {
    const pending = request.status === "Menunggu";
    const typeClass = ["Izin", "Cuti"].includes(request.type) ? " type-izin" : "";
    const typeIcon = request.type === "Sakit" ? "fa-kit-medical"
      : request.type === "Lembur" ? "fa-business-time"
        : request.type === "Cuti" ? "fa-umbrella-beach" : "fa-calendar-minus";
    const requestRange = request.overtimeHours
      ? `${request.range} · ${request.overtimeStart}–${request.overtimeEnd} (${request.overtimeHours} jam)`
      : request.range;
    return `<article class="request-item">
      <div class="request-top"><span class="request-avatar">${escapeHTML(initials(request.name))}</span><span class="request-person"><strong>${escapeHTML(request.name)}</strong><small>${escapeHTML(request.email)} · ${escapeHTML(request.date)}</small></span><span class="request-type${typeClass}"><i class="fa-solid ${typeIcon}"></i>${escapeHTML(request.type)}</span></div>
      <div class="request-meta"><span><i class="fa-regular fa-calendar"></i>${escapeHTML(requestRange)}</span><button class="text-link preview-request" type="button" data-request-action="preview" data-request-id="${request.id}"><i class="fa-regular fa-file-lines"></i> ${request.attachmentId ? "Lampiran tersedia" : request.file ? "Preview demo" : "Tanpa lampiran"}</button></div>
      ${pending ? `<div class="request-actions"><button class="approve-request" type="button" data-request-action="approve" data-request-id="${request.id}"><i class="fa-solid fa-check"></i> Approve</button><button class="reject-request" type="button" data-request-action="reject" data-request-id="${request.id}"><i class="fa-solid fa-xmark"></i> Reject</button></div>` : `<div class="request-result"><span>${escapeHTML(request.reason)}</span><span class="status-badge ${request.status === "Disetujui" ? "status-approved" : "status-rejected"}">${escapeHTML(request.status)}</span></div>`}
    </article>`;
  }).join("");
  const pendingCount = requests.filter((request) => request.status === "Menunggu").length;
  document.getElementById("pendingCount").textContent = String(pendingCount).padStart(2, "0");
  refreshAdminStats();
}

function renderPersonalHistory() {
  const rows = getFilteredPersonalHistory();
  document.getElementById("personalHistoryRows").innerHTML = rows.map((entry) => `
    <tr><td>${escapeHTML(entry.date)}</td><td><span class="history-time">${escapeHTML(entry.in)}</span></td><td><span class="history-time">${escapeHTML(entry.out)}</span></td><td><span class="status-badge ${statusClass(entry.status)}">${escapeHTML(entry.status)}</span></td></tr>`).join("")
    || '<tr><td colspan="4" class="history-empty">Tidak ada riwayat pada filter ini.</td></tr>';
  renderPersonalSummary();
  renderWorkActivities();
  renderAttendanceInsight();
}

function renderPersonalSummary() {
  const period = document.getElementById("personalSummaryPeriod").value || localDateKey().slice(0, 7);
  const [year, month] = period.split("-").map(Number);
  const monthPrefix = `${period}-`;
  const records = personalHistory.map((entry) => {
    const isoDate = entry.isoDate || parseHistoryDate(entry.date);
    return { ...entry, isoDate };
  }).filter((entry) => entry.isoDate.startsWith(monthPrefix));
  const countStatus = (statuses) => records.filter((entry) => statuses.includes(entry.status)).length;
  const presentCount = countStatus(["Hadir", "Terlambat"]);
  const leaveCount = countStatus(["Izin", "Cuti"]);
  const sickCount = countStatus(["Sakit"]);
  const attendanceRate = records.length ? Math.round((presentCount / records.length) * 100) : 0;
  const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  document.getElementById("attendanceRate").innerHTML = `${attendanceRate}<span>%</span>`;
  document.getElementById("attendanceRateCaption").textContent = `Berdasarkan catatan ${monthName}`;
  document.getElementById("attendanceRecordCount").textContent = String(records.length);
  document.getElementById("personalPresentCount").textContent = `${presentCount} hari`;
  document.getElementById("personalLeaveCount").textContent = `${leaveCount} hari`;
  document.getElementById("personalSickCount").textContent = `${sickCount} hari`;
  const absentCount = countStatus(["Alpa"]);
  const ring = document.getElementById("attendanceScoreRing");
  const presentStop = attendanceRate;
  const leaveStop = presentStop + (records.length ? Math.round((leaveCount / records.length) * 100) : 0);
  const sickStop = leaveStop + (records.length ? Math.round((sickCount / records.length) * 100) : 0);
  ring.style.background = `conic-gradient(#17b7b7 0 ${presentStop}%, #f0b65a ${presentStop}% ${leaveStop}%, #ec8876 ${leaveStop}% ${sickStop}%, #e8f1f1 ${sickStop}% 100%)`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const statusByDay = new Map(records.map((entry) => [Number(entry.isoDate.slice(-2)), entry.status]));
  const bars = document.getElementById("attendanceChart");
  bars.innerHTML = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const status = statusByDay.get(day);
    const statusClassName = status === "Sakit" ? "sick"
      : ["Izin", "Cuti"].includes(status) ? "permission"
        : status === "Alpa" ? "absent"
          : status ? "" : "no-data";
    const height = status ? (status === "Alpa" ? 14 : 94) : 6;
    const dateLabel = `${String(day).padStart(2, "0")} ${monthName}`;
    const description = status || "Belum ada catatan";
    return `<span class="chart-bar-group"><i class="chart-bar ${statusClassName}" style="height:${height}%" title="${escapeHTML(`${dateLabel}: ${description}`)}" aria-label="${escapeHTML(`${dateLabel}: ${description}`)}"></i></span>`;
  }).join("");
  const labelDays = [...new Set([1, 8, 15, 22, daysInMonth])];
  document.getElementById("attendanceChartLabels").innerHTML = labelDays.map((day) => (
    `<span>${String(day).padStart(2, "0")} ${new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(year, month - 1, 1))}</span>`
  )).join("");
  document.getElementById("attendanceChartContainer").setAttribute("aria-label", `Grafik riwayat presensi ${monthName}`);
}

function initializeDashboardDate() {
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    .format(now)
    .toLocaleUpperCase("id-ID");
  document.querySelectorAll(".page-heading .eyebrow").forEach((label) => {
    const decoration = label.querySelector(".eyebrow-line");
    label.replaceChildren(decoration, document.createTextNode(` ${dateLabel}`));
  });
  const yearFilter = document.getElementById("yearFilter");
  const currentYear = String(now.getFullYear());
  if (!Array.from(yearFilter.options).some((option) => option.value === currentYear)) {
    const option = document.createElement("option");
    option.value = currentYear;
    option.textContent = currentYear;
    yearFilter.prepend(option);
  }
  yearFilter.value = currentYear;
  document.getElementById("monthFilter").value = "all";
  document.getElementById("historyMonthFilter").value = String(now.getMonth());
  document.getElementById("personalSummaryPeriod").value = localDateKey(now).slice(0, 7);
}

function csvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getFilteredPersonalHistory() {
  const start = document.getElementById("historyStartDate").value;
  const end = document.getElementById("historyEndDate").value;
  const month = document.getElementById("historyMonthFilter").value;
  const status = document.getElementById("historyStatusFilter").value;
  return personalHistory
    .map((entry) => ({ ...entry, isoDate: entry.isoDate || parseHistoryDate(entry.date) }))
    .filter((entry) => (!start || entry.isoDate >= start)
      && (!end || entry.isoDate <= end)
      && (month === "all" || String(new Date(`${entry.isoDate}T00:00:00`).getMonth()) === month)
      && (status === "all" || entry.status === status))
    .sort((left, right) => right.isoDate.localeCompare(left.isoDate));
}

function parseHistoryDate(value) {
  const match = String(value).match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return "";
  const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06", Jul: "07", Agu: "08", Agt: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12" };
  const month = months[match[2]];
  return month ? `${match[3]}-${month}-${match[1].padStart(2, "0")}` : "";
}

function savePersonalHistory() {
  return saveLocalArray(personalHistoryStorageKey, personalHistory.map(({ selfie, ...entry }) => entry));
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
  const taskActivities = isEmployeeDemo
    ? sharedTaskActivities.filter((activity) => activity.assigneeEmail === currentEmployeeEmail)
    : sharedTaskActivities;
  const taskItems = taskActivities.slice(0, 8).map((activity) => ({
    title: activity.title,
    detail: activity.detail,
    icon: activity.status === "Selesai" ? "fa-check" : activity.title === "Tugas dibagikan" ? "fa-share-nodes" : "fa-list-check",
    type: activity.status === "Selesai" ? "is-success" : "is-warning",
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      .format(new Date(activity.createdAt)),
  }));
  list.innerHTML = [...taskItems, ...workActivities].slice(0, 8).map((activity) => `
    <li class="work-activity-item">
      <span class="work-activity-icon ${activity.type}"><i class="fa-solid ${activity.icon}" aria-hidden="true"></i></span>
      <span class="work-activity-copy"><strong>${escapeHTML(activity.title)}</strong><small>${escapeHTML(activity.detail)}</small></span>
      <time>${escapeHTML(activity.date)}</time>
    </li>`).join("");
}

function recordTaskActivity(activity) {
  const updatedActivities = [{ ...activity, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now() }, ...sharedTaskActivities].slice(0, 100);
  if (!saveLocalArray(taskActivityStorageKey, updatedActivities)) return false;
  sharedTaskActivities = updatedActivities;
  renderWorkActivities();
  renderAdminTaskMonitor();
  return true;
}

function renderAdminTaskMonitor() {
  const rows = document.getElementById("adminTaskRows");
  if (!rows) return;
  const counts = {
    total: sharedWorkTasks.length,
    todo: sharedWorkTasks.filter((task) => task.status === "Belum dikerjakan").length,
    inProgress: sharedWorkTasks.filter((task) => task.status === "Sedang dikerjakan").length,
    done: sharedWorkTasks.filter((task) => task.status === "Selesai").length,
  };
  document.getElementById("adminTaskTotal").textContent = String(counts.total);
  document.getElementById("adminTaskTodo").textContent = String(counts.todo);
  document.getElementById("adminTaskInProgress").textContent = String(counts.inProgress);
  document.getElementById("adminTaskDone").textContent = String(counts.done);
  const employees = getWorkEmployees();
  rows.innerHTML = sharedWorkTasks.slice().sort((left, right) => right.createdAt - left.createdAt).map((task) => {
    const employee = employees.find((entry) => entry.email === task.assigneeEmail);
    const activity = sharedTaskActivities.find((entry) => entry.taskId === task.id);
    const dueDate = task.dueDate
      ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${task.dueDate}T00:00:00`))
      : "—";
    const updatedAt = activity
      ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(activity.createdAt))
      : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(task.createdAt));
    const status = ["Belum dikerjakan", "Sedang dikerjakan", "Selesai"].includes(task.status) ? task.status : "Belum dikerjakan";
    const badge = status === "Selesai" ? "status-approved" : status === "Sedang dikerjakan" ? "status-late" : "status-pending";
    return `<tr><td><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.description)}</small></td><td>${escapeHTML(employee?.name || "Karyawan tidak ditemukan")}</td><td>${escapeHTML(dueDate)}</td><td><span class="status-badge ${badge}">${escapeHTML(status)}</span></td><td>${escapeHTML(updatedAt)}</td></tr>`;
  }).join("");
  document.getElementById("adminTaskEmpty").classList.toggle("is-hidden", sharedWorkTasks.length > 0);
  const activityList = document.getElementById("adminTaskActivityList");
  activityList.innerHTML = sharedTaskActivities.slice(0, 8).map((activity) => `
    <li class="work-activity-item">
      <span class="work-activity-icon ${activity.status === "Selesai" ? "is-success" : "is-warning"}"><i class="fa-solid ${activity.status === "Selesai" ? "fa-check" : activity.title === "Tugas dibagikan" ? "fa-share-nodes" : "fa-list-check"}" aria-hidden="true"></i></span>
      <span class="work-activity-copy"><strong>${escapeHTML(activity.title)}</strong><small>${escapeHTML(activity.detail)}</small></span>
      <time>${escapeHTML(new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(activity.createdAt)))}</time>
    </li>`).join("") || '<li class="task-monitor-empty">Belum ada aktivitas tugas.</li>';
  renderAdminStatistics();
}

function renderAdminStatistics() {
  if (isEmployeeDemo) return;
  const activeEmployees = getWorkEmployees().filter((employee) => employee.employmentStatus !== "inactive");
  const activeEmails = new Set(activeEmployees.map((employee) => employee.email));
  const today = localDateKey();
  const todayAttendance = new Map(
    attendanceRecords
      .filter((record) => record.date === today && activeEmails.has(record.email))
      .map((record) => [record.email, record.status]),
  );
  const presentEmails = new Set([...todayAttendance].filter(([, status]) => ["Hadir", "Terlambat"].includes(status)).map(([email]) => email));
  const leaveEmails = new Set([...todayAttendance].filter(([, status]) => ["Izin", "Cuti"].includes(status)).map(([email]) => email));
  const sickEmails = new Set([...todayAttendance].filter(([, status]) => status === "Sakit").map(([email]) => email));
  const absentCount = Math.max(0, activeEmployees.length - presentEmails.size - leaveEmails.size - sickEmails.size);
  const attendanceRate = activeEmployees.length ? Math.round((presentEmails.size / activeEmployees.length) * 100) : 0;
  document.getElementById("attendanceStatisticsDate").textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${today}T00:00:00`));
  document.getElementById("statisticsEmployeeTotal").textContent = String(activeEmployees.length);
  document.getElementById("statisticsAttendanceRate").textContent = `${attendanceRate}%`;
  document.getElementById("statisticsAttendanceProgress").style.width = `${attendanceRate}%`;
  document.getElementById("statisticsAttendanceCount").textContent = `${presentEmails.size}/${activeEmployees.length}`;
  document.getElementById("statisticsPresentCount").textContent = String(presentEmails.size);
  document.getElementById("statisticsLeaveCount").textContent = String(leaveEmails.size);
  document.getElementById("statisticsSickCount").textContent = String(sickEmails.size);
  document.getElementById("statisticsAbsentCount").textContent = String(absentCount);

  const trendChart = document.getElementById("attendanceTrendChart");
  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const present = new Set(attendanceRecords
      .filter((record) => record.date === key && activeEmails.has(record.email) && ["Hadir", "Terlambat"].includes(record.status))
      .map((record) => record.email)).size;
    const rate = activeEmployees.length ? Math.round((present / activeEmployees.length) * 100) : 0;
    const day = document.createElement("div");
    day.className = "attendance-trend-day";
    const percent = document.createElement("strong");
    percent.textContent = `${rate}%`;
    const track = document.createElement("span");
    track.className = "attendance-trend-track";
    const bar = document.createElement("i");
    bar.style.height = `${rate}%`;
    bar.setAttribute("aria-hidden", "true");
    track.append(bar);
    const label = document.createElement("small");
    label.textContent = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric" }).format(date);
    day.append(percent, track, label);
    return day;
  });
  trendChart.replaceChildren(...trendDays);

  const assignedTasks = sharedWorkTasks.filter((task) => activeEmails.has(task.assigneeEmail));
  const completedTasks = assignedTasks.filter((task) => task.status === "Selesai").length;
  const inProgressTasks = assignedTasks.filter((task) => task.status === "Sedang dikerjakan").length;
  const completionRate = assignedTasks.length ? Math.round((completedTasks / assignedTasks.length) * 100) : 0;
  document.getElementById("workCompletionRate").textContent = `${completionRate}%`;
  document.getElementById("workCompletionCaption").textContent = `${completedTasks} dari ${assignedTasks.length} tugas selesai`;
  document.getElementById("workCompletionRing").style.setProperty("--completion-rate", `${completionRate}%`);
  document.getElementById("statisticsTaskTotal").textContent = String(assignedTasks.length);
  document.getElementById("statisticsTaskDone").textContent = String(completedTasks);
  document.getElementById("statisticsTaskProgress").textContent = String(inProgressTasks);

  const todayJournalEntries = activityJournalEntries.filter((entry) => (
    activeEmails.has(entry.email)
    && Number.isFinite(entry.createdAt)
    && localDateKey(new Date(entry.createdAt)) === today
  ));
  const todayTaskActivities = sharedTaskActivities.filter((activity) => (
    activeEmails.has(activity.assigneeEmail)
    && Number.isFinite(activity.createdAt)
    && localDateKey(new Date(activity.createdAt)) === today
  ));
  document.getElementById("statisticsDailyActivityCount").textContent = String(todayJournalEntries.length + todayTaskActivities.length);

  const rows = document.getElementById("employeeStatisticsRows");
  rows.replaceChildren();
  activeEmployees.forEach((employee) => {
    const employeeTasks = assignedTasks.filter((task) => task.assigneeEmail === employee.email);
    const done = employeeTasks.filter((task) => task.status === "Selesai").length;
    const employeeUpdates = todayJournalEntries.filter((entry) => entry.email === employee.email).length
      + todayTaskActivities.filter((activity) => activity.assigneeEmail === employee.email).length;
    const progress = employeeTasks.length ? Math.round((done / employeeTasks.length) * 100) : 0;
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const name = document.createElement("strong");
    name.textContent = employee.name;
    const email = document.createElement("small");
    email.textContent = employee.email;
    nameCell.append(name, email);
    const doneCell = document.createElement("td");
    doneCell.textContent = String(done);
    const totalCell = document.createElement("td");
    totalCell.textContent = String(employeeTasks.length);
    const activityCell = document.createElement("td");
    activityCell.textContent = `${employeeUpdates} pembaruan`;
    const progressCell = document.createElement("td");
    const progressWrap = document.createElement("span");
    progressWrap.className = "employee-progress";
    const progressTrack = document.createElement("i");
    const progressBar = document.createElement("b");
    progressBar.style.width = `${progress}%`;
    progressTrack.append(progressBar);
    const progressLabel = document.createElement("strong");
    progressLabel.textContent = `${progress}%`;
    progressWrap.append(progressTrack, progressLabel);
    progressCell.append(progressWrap);
    row.append(nameCell, doneCell, totalCell, activityCell, progressCell);
    rows.append(row);
  });
  document.getElementById("employeeStatisticsEmpty").classList.toggle("is-hidden", activeEmployees.length > 0);
}

function openActivityJournalDatabase() {
  if (activityJournalDbPromise) return activityJournalDbPromise;
  if (!window.indexedDB) return Promise.reject(new Error("Browser ini tidak mendukung penyimpanan media lokal."));
  activityJournalDbPromise = new Promise((resolve, reject) => {
    const opening = window.indexedDB.open("sitenexs-activity-journal", 1);
    opening.onupgradeneeded = () => {
      if (!opening.result.objectStoreNames.contains("media")) {
        opening.result.createObjectStore("media", { keyPath: "id" });
      }
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => {
      activityJournalDbPromise = null;
      reject(opening.error || new Error("Penyimpanan media tidak dapat dibuka."));
    };
    opening.onblocked = () => {
      activityJournalDbPromise = null;
      reject(new Error("Penyimpanan media sedang diblokir tab lain. Tutup tab SiteNexs yang lama lalu coba kembali."));
    };
  });
  return activityJournalDbPromise;
}

async function storeActivityJournalMedia(id, file) {
  const database = await openActivityJournalDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("media", "readwrite");
    transaction.objectStore("media").put({ id, name: file.name, type: file.type, size: file.size, blob: file });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Media tidak dapat disimpan di browser."));
    transaction.onabort = () => reject(transaction.error || new Error("Penyimpanan media dibatalkan browser."));
  });
}

async function getActivityJournalMedia(id) {
  const database = await openActivityJournalDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("media", "readonly");
    const request = transaction.objectStore("media").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Media tidak dapat dibaca dari browser."));
  });
}

async function deleteActivityJournalMedia(id) {
  const database = await openActivityJournalDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("media", "readwrite");
    transaction.objectStore("media").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Media tidak dapat dihapus dari browser."));
    transaction.onabort = () => reject(transaction.error || new Error("Penghapusan media dibatalkan browser."));
  });
}

function getFilteredActivityJournal(admin) {
  return activityJournalEntries
    .filter((entry) => admin || entry.email === currentEmployeeEmail)
    .slice()
    .sort((left, right) => right.createdAt - left.createdAt);
}

function renderActivityJournalList(listId, entries, canDelete, page = 1) {
  const list = document.getElementById(listId);
  const pageEntries = entries.slice((page - 1) * activityJournalPageSize, page * activityJournalPageSize);
  list.innerHTML = pageEntries.map((entry) => {
    const mediaLabel = entry.mediaName
      ? `${entry.mediaType?.startsWith("video/") ? "Video" : "Foto"} · ${escapeHTML(entry.mediaName)}`
      : "Tanpa media";
    const mediaIcon = entry.mediaType?.startsWith("video/") ? "fa-video" : entry.mediaName ? "fa-image" : "fa-file-lines";
    const size = entry.mediaSize ? ` · ${(entry.mediaSize / (1024 * 1024)).toFixed(1)} MB` : "";
    return `<article class="journal-entry">
      <div class="journal-entry-main">
        <div class="journal-entry-icon"><i class="fa-solid ${mediaIcon}" aria-hidden="true"></i></div>
        <div class="journal-entry-copy">
          <div class="journal-entry-topline"><strong>${escapeHTML(entry.title)}</strong><time datetime="${escapeHTML(entry.dateKey)}">${escapeHTML(new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${entry.dateKey}T00:00:00`)))}</time></div>
          <span class="journal-entry-employee">${escapeHTML(entry.name)}</span>
          <p>${escapeHTML(entry.description)}</p>
          <small class="journal-entry-media"><i class="fa-solid ${mediaIcon}" aria-hidden="true"></i> ${mediaLabel}${size}</small>
        </div>
      </div>
      <div class="journal-entry-actions"><button class="button button-outline" type="button" data-journal-view="${escapeHTML(entry.id)}"><i class="fa-regular fa-eye"></i> Lihat detail</button>${canDelete ? `<button class="button journal-delete-button" type="button" data-journal-delete="${escapeHTML(entry.id)}" aria-label="Hapus dokumentasi ${escapeHTML(entry.title)}"><i class="fa-regular fa-trash-can"></i> Hapus</button>` : ""}</div>
    </article>`;
  }).join("");
}

function renderJournalPagination(containerId, page, totalEntries, scope) {
  const container = document.getElementById(containerId);
  const pageCount = Math.max(1, Math.ceil(totalEntries / activityJournalPageSize));
  container.replaceChildren();
  container.classList.toggle("is-hidden", pageCount < 2);
  const addButton = (label, targetPage, { active = false, disabled = false, ariaLabel = label } = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.journalPage = String(targetPage);
    button.dataset.journalPageScope = scope;
    button.setAttribute("aria-label", ariaLabel);
    if (active) button.classList.add("is-active");
    if (active) button.setAttribute("aria-current", "page");
    button.disabled = disabled;
    container.append(button);
  };
  addButton("‹", page - 1, { disabled: page <= 1, ariaLabel: "Halaman sebelumnya" });
  const visiblePages = new Set([1, pageCount, page - 1, page, page + 1]);
  let previousPage = 0;
  [...visiblePages].filter((value) => value >= 1 && value <= pageCount).sort((left, right) => left - right).forEach((value) => {
    if (previousPage && value - previousPage > 1) {
      const gap = document.createElement("span");
      gap.textContent = "…";
      container.append(gap);
    }
    addButton(String(value), value, { active: value === page, ariaLabel: `Halaman ${value}` });
    previousPage = value;
  });
  addButton("›", page + 1, { disabled: page >= pageCount, ariaLabel: "Halaman berikutnya" });
}

function renderActivityJournal() {
  const adminEntries = getFilteredActivityJournal(true);
  const employeeEntries = getFilteredActivityJournal(false);
  const adminPageCount = Math.max(1, Math.ceil(adminEntries.length / activityJournalPageSize));
  const employeePageCount = Math.max(1, Math.ceil(employeeEntries.length / activityJournalPageSize));
  adminJournalPage = Math.min(adminJournalPage, adminPageCount);
  employeeJournalPage = Math.min(employeeJournalPage, employeePageCount);
  document.getElementById("adminActivityJournalCount").textContent = `${adminEntries.length} entri`;
  document.getElementById("employeeJournalCount").textContent = `${employeeEntries.length} entri`;
  renderActivityJournalList("adminJournalEntries", adminEntries, true, adminJournalPage);
  renderActivityJournalList("employeeJournalEntries", employeeEntries, false, employeeJournalPage);
  renderJournalPagination("adminJournalPagination", adminJournalPage, adminEntries.length, "admin");
  renderJournalPagination("employeeJournalPagination", employeeJournalPage, employeeEntries.length, "employee");
  document.getElementById("adminJournalEmpty").classList.toggle("is-hidden", adminEntries.length > 0);
  document.getElementById("employeeJournalEmpty").classList.toggle("is-hidden", employeeEntries.length > 0);
  renderAdminStatistics();
}

function initializeActivityJournal() {
  renderActivityJournal();
}

function renderEmployeeActivityHistory() {
  const entries = activityJournalEntries
    .filter((entry) => entry.email === activeEmployeeHistoryEmail)
    .slice()
    .sort((left, right) => right.createdAt - left.createdAt);
  const pageCount = Math.max(1, Math.ceil(entries.length / activityJournalPageSize));
  employeeHistoryPage = Math.min(employeeHistoryPage, pageCount);
  renderActivityJournalList("employeeActivityHistoryEntries", entries, false, employeeHistoryPage);
  renderJournalPagination("employeeActivityHistoryPagination", employeeHistoryPage, entries.length, "employee-history");
  document.getElementById("employeeActivityHistoryEmpty").classList.toggle("is-hidden", entries.length > 0);
}

function openEmployeeActivityHistory(employeeEmail) {
  const employee = window.SiteNexsDirectory.getEmployees().find((entry) => entry.email === employeeEmail);
  if (!employee) {
    showToast("Data karyawan tidak ditemukan.", "error");
    return;
  }
  activeEmployeeHistoryEmail = employeeEmail;
  employeeHistoryPage = 1;
  document.getElementById("employeeActivityHistoryTitle").textContent = `Aktivitas ${employee.name}`;
  document.getElementById("employeeActivityHistoryDescription").textContent = `Semua dokumentasi aktivitas yang dibagikan oleh ${employee.name}.`;
  renderEmployeeActivityHistory();
  document.getElementById("employeeActivityHistoryDialog").showModal();
}

function submitEmployeeActivityJournal(event) {
  event.preventDefault();
  if (!isEmployeeDemo) {
    showToast("Dokumentasi harian hanya dapat dikirim melalui akun karyawan.", "error");
    return;
  }
  const form = event.currentTarget;
  const file = form.elements.media.files[0] || null;
  const title = form.elements.title.value.trim();
  const description = form.elements.description.value.trim();
  if (!form.elements.consent.checked) {
    showToast("Setujui pembagian dokumentasi kepada admin sebelum menyimpan.", "warning");
    return;
  }
  if (!title || !description) {
    showToast("Isi kegiatan dan catatan pekerjaan terlebih dahulu.", "warning");
    return;
  }
  if (file && (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
    showToast("File dokumentasi harus berupa foto atau video.", "error");
    return;
  }
  if (file && file.size > 50 * 1024 * 1024) {
    showToast("Ukuran file maksimal 50 MB.", "error");
    return;
  }

  document.getElementById("activityReviewActivity").textContent = title;
  document.getElementById("activityReviewNotes").textContent = description;
  document.getElementById("activityReviewMedia").textContent = file
    ? `Lampiran: ${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : "Tanpa lampiran foto/video.";
  document.getElementById("activityReviewDialog").showModal();
}

async function saveEmployeeActivityJournal() {
  const form = document.getElementById("employeeJournalForm");
  const submitButton = document.getElementById("confirmSaveActivity");
  const status = document.getElementById("employeeJournalStatus");
  const file = form.elements.media.files[0] || null;
  const title = form.elements.title.value.trim();
  const description = form.elements.description.value.trim();
  if (!isEmployeeDemo || !form.elements.consent.checked || !title || !description) {
    showToast("Isian kegiatan atau persetujuan berubah. Periksa kembali sebelum menyimpan.", "warning");
    closeDialog("activityReviewDialog");
    return;
  }
  if (file && (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
    showToast("File dokumentasi harus berupa foto atau video.", "error");
    closeDialog("activityReviewDialog");
    return;
  }
  if (file && file.size > 50 * 1024 * 1024) {
    showToast("Ukuran file maksimal 50 MB.", "error");
    closeDialog("activityReviewDialog");
    return;
  }

  submitButton.disabled = true;
  status.textContent = "Menyimpan dokumentasi di browser...";
  status.classList.remove("is-error", "is-success");
  let mediaId = "";
  let mediaSaved = false;
  let persistenceNotice = "";
  try {
    if (file) {
      mediaId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await storeActivityJournalMedia(mediaId, file);
      mediaSaved = true;
      if (navigator.storage?.persist) {
        try {
          const persistenceGranted = await navigator.storage.persist();
          if (!persistenceGranted) persistenceNotice = " Browser belum menjamin data lokal tetap tersimpan; jangan hapus data situs.";
        } catch (error) {
          persistenceNotice = ` Izin penyimpanan persisten tidak tersedia (${error.message}); data tetap lokal dan dapat terhapus.`;
        }
      } else {
        persistenceNotice = " Browser tidak mendukung izin penyimpanan persisten; data lokal dapat terhapus.";
      }
    }

    const employee = getCurrentWorkEmployee();
    const createdAt = Date.now();
    const entry = {
      id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      email: employee.email,
      name: employee.name,
      title,
      description,
      dateKey: localDateKey(new Date(createdAt)),
      createdAt,
      ...(file ? { mediaId, mediaName: file.name, mediaType: file.type, mediaSize: file.size } : {}),
    };
    const updatedEntries = [entry, ...activityJournalEntries];
    if (!saveLocalArray(activityJournalStorageKey, updatedEntries)) {
      if (mediaSaved) await deleteActivityJournalMedia(mediaId);
      throw new Error("Catatan tidak tersimpan. Periksa ruang penyimpanan browser lalu coba lagi.");
    }
    activityJournalEntries.unshift(entry);
    form.reset();
    document.getElementById("employeeJournalSelectedFile").classList.add("is-hidden");
    status.textContent = `Dokumentasi tersimpan di browser ini dan dapat dilihat admin workspace.${persistenceNotice}`;
    status.classList.add("is-success");
    renderActivityJournal();
    renderWorkActivities();
    closeDialog("activityReviewDialog");
    showToast("Dokumentasi aktivitas tersimpan di browser ini.");
  } catch (error) {
    status.textContent = `Dokumentasi gagal disimpan: ${error.message}`;
    status.classList.add("is-error");
    closeDialog("activityReviewDialog");
    showToast(`Dokumentasi gagal disimpan: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function openActivityJournalEntry(entryId) {
  const entry = activityJournalEntries.find((item) => item.id === entryId);
  if (!entry || (isEmployeeDemo && entry.email !== currentEmployeeEmail)) {
    showToast("Dokumentasi tidak ditemukan atau tidak dapat diakses akun ini.", "error");
    return;
  }
  activeJournalPreviewId = entry.id;
  const dialog = document.getElementById("activityMediaDialog");
  const image = document.getElementById("activityMediaImage");
  const video = document.getElementById("activityMediaVideo");
  const noFile = document.getElementById("activityMediaNoFile");
  document.getElementById("activityMediaTitle").textContent = entry.title;
  document.getElementById("activityMediaSubtitle").textContent = `${entry.name} · ${entry.email} · ${entry.dateKey}`;
  document.getElementById("activityMediaDescription").textContent = entry.description;
  document.getElementById("activityMediaMeta").textContent = entry.mediaName || "Catatan tanpa lampiran media.";
  image.classList.add("is-hidden");
  video.classList.add("is-hidden");
  noFile.classList.toggle("is-hidden", Boolean(entry.mediaId));
  image.removeAttribute("src");
  video.pause();
  video.removeAttribute("src");
  if (activityMediaObjectUrl) URL.revokeObjectURL(activityMediaObjectUrl);
  activityMediaObjectUrl = null;
  dialog.showModal();
  if (!entry.mediaId) return;
  try {
    const media = await getActivityJournalMedia(entry.mediaId);
    if (!media || !dialog.open || activeJournalPreviewId !== entry.id) {
      if (!media) throw new Error("File media tidak ditemukan di penyimpanan browser.");
      return;
    }
    activityMediaObjectUrl = URL.createObjectURL(media.blob);
    if (media.type.startsWith("video/")) {
      video.src = activityMediaObjectUrl;
      video.classList.remove("is-hidden");
    } else {
      image.src = activityMediaObjectUrl;
      image.classList.remove("is-hidden");
    }
  } catch (error) {
    noFile.textContent = error.message;
    noFile.classList.remove("is-hidden");
    showToast(`Media tidak dapat dibuka: ${error.message}`, "error");
  }
}

function requestDeleteActivity(entryId) {
  if (isEmployeeDemo) {
    showToast("Hanya admin workspace yang dapat menghapus dokumentasi.", "error");
    return;
  }
  const entry = activityJournalEntries.find((item) => item.id === entryId);
  if (!entry) {
    showToast("Dokumentasi tidak ditemukan.", "error");
    return;
  }
  pendingActivityDeleteId = entryId;
  document.getElementById("activityDeleteDescription").textContent = `Dokumentasi “${entry.title}” milik ${entry.name} beserta file medianya akan dihapus dari browser ini.`;
  document.getElementById("activityDeleteDialog").showModal();
}

async function confirmDeleteActivity() {
  const button = document.getElementById("confirmDeleteActivity");
  const entry = activityJournalEntries.find((item) => item.id === pendingActivityDeleteId);
  if (!entry) {
    closeDialog("activityDeleteDialog");
    showToast("Dokumentasi sudah tidak ditemukan.", "error");
    return;
  }
  button.disabled = true;
  let media = null;
  try {
    if (entry.mediaId) {
      media = await getActivityJournalMedia(entry.mediaId);
      await deleteActivityJournalMedia(entry.mediaId);
    }
    const updatedEntries = activityJournalEntries.filter((item) => item.id !== entry.id);
    if (!saveLocalArray(activityJournalStorageKey, updatedEntries)) {
      if (media) await storeActivityJournalMedia(entry.mediaId, media.blob);
      throw new Error("Catatan tidak dapat dihapus dari daftar browser.");
    }
    activityJournalEntries.splice(0, activityJournalEntries.length, ...updatedEntries);
    pendingActivityDeleteId = null;
    closeDialog("activityDeleteDialog");
    renderActivityJournal();
    renderWorkActivities();
    showToast("Dokumentasi dan media terkait berhasil dihapus dari browser.");
  } catch (error) {
    showToast(`Dokumentasi tidak dapat dihapus: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

function getWorkEmployees() {
    return window.SiteNexsDirectory?.getEmployeesForAdmin(currentAdminId) || [];
}

function getCurrentWorkEmployee() {
    const employees = getWorkEmployees();
    const selectedEmail = sessionStorage.getItem("sitenexsDemoEmployeeEmail") || defaultEmployeeEmail;
    return employees.find((employee) => employee.email === selectedEmail) || employees[0] || {
      name: window.SiteNexsDemoAccount?.getAccountName("employee") || "Karyawan",
      email: selectedEmail,
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
    const employees = getWorkEmployees().filter((employee) => employee.name && employee.email && employee.employmentStatus !== "inactive");
    const currentEmployee = getCurrentWorkEmployee();
    document.querySelectorAll("[data-task-assignee]").forEach((assigneeSelect) => {
      const previousAssignee = assigneeSelect.value;
      assigneeSelect.replaceChildren(new Option("Pilih karyawan", ""));
      employees.forEach((employee) => assigneeSelect.add(new Option(`${employee.name} · ${employee.email}`, employee.email)));
      assigneeSelect.value = employees.some((employee) => employee.email === previousAssignee)
        ? previousAssignee
        : employees.some((employee) => employee.email === currentEmployee.email) ? currentEmployee.email : "";
    });
}

function createTaskNode(task) {
    const assignee = getWorkEmployees().find((employee) => employee.email === task.assigneeEmail);
    const item = document.createElement("li");
    item.className = "task-item";
    item.draggable = true;
    item.dataset.taskCard = task.id;
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
    statusSelect.value = ["Belum dikerjakan", "Sedang dikerjakan", "Selesai"].includes(task.status)
      ? task.status
      : "Belum dikerjakan";
    statusWrap.append(statusLabel, statusSelect);
    item.append(copy, statusWrap);
    return item;
}

function renderSharedTasks() {
    const board = document.getElementById("taskBoard");
    if (!board) {
      renderAdminTaskMonitor();
      return;
    }
    const columns = [...board.querySelectorAll("[data-task-column]")];
    columns.forEach((column) => column.querySelector(".kanban-list").replaceChildren());
    const visibleTasks = isEmployeeDemo
      ? sharedWorkTasks.filter((task) => task.assigneeEmail === currentEmployeeEmail)
      : sharedWorkTasks;
    const tasks = visibleTasks.slice().sort((left, right) => right.createdAt - left.createdAt);
    tasks.forEach((task) => {
      const status = ["Belum dikerjakan", "Sedang dikerjakan", "Selesai"].includes(task.status)
        ? task.status
        : "Belum dikerjakan";
      const column = columns.find((entry) => entry.dataset.taskColumn === status);
      column.querySelector(".kanban-list").append(createTaskNode(task));
    });
    columns.forEach((column) => {
      const list = column.querySelector(".kanban-list");
      column.querySelector("[data-column-count]").textContent = String(list.children.length);
      if (list.children.length === 0) {
        const empty = document.createElement("li");
        empty.className = "task-empty-state";
        empty.textContent = sharedWorkTasks.length && !visibleTasks.length
          ? "Belum ada tugas yang ditugaskan kepada Anda."
          : sharedWorkTasks.length
          ? "Lepaskan tugas di sini."
          : "Belum ada tugas.";
        list.append(empty);
      }
    });
    const count = document.querySelector("[data-task-count]");
    count.textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? "tugas" : "tugas"}`;
    renderAdminTaskMonitor();
}

function initializeWorkCollaboration() {
    try {
      sharedWorkTasks = readWorkCollection(workTasksStorageKey);
      sharedTaskActivities = readWorkCollection(taskActivityStorageKey);
      populateTaskAssignees();
      renderSharedTasks();
      renderWorkActivities();
    } catch (error) {
      showToast(`Aktivitas kerja tidak dapat dimuat: ${error.message}`, "error");
      document.getElementById("taskForm").querySelector("button").disabled = true;
    }
}

function createSharedTask(event) {
    event.preventDefault();
    if (sessionStorage.getItem("sitenexsDemoRole") === "employee") {
      showToast("Hanya admin demo yang dapat membagikan tugas.", "error");
      return;
    }
    const form = event.currentTarget;
    if (form.id === "adminTaskForm") {
      const title = form.elements.title.value.trim();
      const description = form.elements.description.value.trim();
      const assigneeEmail = form.elements.assignee.value;
      const assignee = getWorkEmployees().find((employee) => employee.email === assigneeEmail);
      if (!title || !description || !assignee) {
        const status = form.querySelector("[data-task-form-status]");
        status.textContent = "Lengkapi nama tugas, catatan, dan pilih karyawan dari daftar.";
        status.classList.add("is-error");
        return;
      }
      document.getElementById("adminTaskReviewTitle").textContent = title;
      document.getElementById("adminTaskReviewDescription").textContent = description;
      document.getElementById("adminTaskReviewAssignee").textContent = `Diberikan kepada: ${assignee.name} · ${assignee.email}`;
      const dueDate = form.elements.dueDate.value;
      document.getElementById("adminTaskReviewDueDate").textContent = dueDate
        ? `Batas waktu: ${new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${dueDate}T00:00:00`))}`
        : "Batas waktu: tidak ditentukan";
      document.getElementById("adminTaskEntryStep").hidden = true;
      document.getElementById("adminTaskReviewStep").hidden = false;
      return;
    }
    saveSharedTask(form);
}

function saveSharedTask(form) {
    const currentEmployee = getCurrentWorkEmployee();
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      assigneeEmail: form.elements.assignee.value,
      dueDate: form.elements.dueDate.value,
      author: window.SiteNexsDemoAccount?.getAccountName("admin", currentAdminId) || currentEmployee.name,
      status: "Belum dikerjakan",
      createdAt: Date.now(),
    };
    if (!task.title || !task.description || !getWorkEmployees().some((employee) => employee.email === task.assigneeEmail)) {
      showToast("Lengkapi nama tugas, catatan, dan pilih karyawan dari daftar.", "error");
      return;
    }
    const updatedTasks = [...sharedWorkTasks, task];
    if (!persistWorkCollection(workTasksStorageKey, updatedTasks)) return;
    sharedWorkTasks = updatedTasks;
    form.reset();
    populateTaskAssignees();
    renderSharedTasks();
    const assigneeName = getWorkEmployees().find((employee) => employee.email === task.assigneeEmail)?.name || "rekan";
    recordTaskActivity({
      taskId: task.id,
      title: "Tugas dibagikan",
      detail: `${task.title} · kepada ${assigneeName}.`,
      assigneeEmail: task.assigneeEmail,
      actorEmail: "",
      status: task.status,
    });
    addNotification("Tugas baru dibagikan", `${task.title} ditugaskan kepada ${assigneeName}.`, "#workActivitySection");
    const status = form.querySelector("[data-task-form-status]") || document.getElementById("taskFormStatus");
    if (status) {
      status.textContent = "Tugas berhasil dibagikan ke daftar kerja tim pada browser ini.";
      status.classList.remove("is-error");
      status.classList.add("is-success");
    }
    if (form.id === "adminTaskForm") {
      adminTaskDialog.close();
      document.getElementById("adminTaskEntryStep").hidden = false;
      document.getElementById("adminTaskReviewStep").hidden = true;
      populateTaskAssignees();
      showToast(`Tugas "${task.title}" berhasil dibagikan kepada ${assigneeName}.`);
    }
}

function updateSharedTaskStatus(taskId, nextStatus) {
    const task = sharedWorkTasks.find((entry) => entry.id === taskId);
    if (!task || task.status === nextStatus) return false;
    if (isEmployeeDemo && task.assigneeEmail !== currentEmployeeEmail) {
      showToast("Anda hanya dapat memperbarui tugas yang ditugaskan kepada akun Anda.", "error");
      return false;
    }
    const previousStatus = task.status;
    const updatedTasks = sharedWorkTasks.map((entry) => entry.id === task.id ? { ...entry, status: nextStatus } : entry);
    if (!persistWorkCollection(workTasksStorageKey, updatedTasks)) {
      return false;
    }
    sharedWorkTasks = updatedTasks;
    const actor = isEmployeeDemo
      ? getCurrentWorkEmployee().name
      : window.SiteNexsDemoAccount?.getAccountName("admin", currentAdminId) || "Admin";
    recordTaskActivity({
      taskId: task.id,
      title: "Progres tugas diperbarui",
      detail: `${task.title} · ${actor}: ${previousStatus} → ${nextStatus}.`,
      assigneeEmail: task.assigneeEmail,
      actorEmail: isEmployeeDemo ? currentEmployeeEmail : "",
      status: nextStatus,
    });
    addNotification("Progres tugas diperbarui", `${task.title} dipindahkan ke ${nextStatus}.`, "#workActivitySection");
    renderSharedTasks();
    return true;
}

function renderAttendanceInsight() {
  const insight = document.getElementById("attendanceInsightText");
  if (!insight) return;
  const total = personalHistory.length;
  const present = personalHistory.filter((entry) => ["Hadir", "Terlambat"].includes(entry.status)).length;
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

function updateEmployeeTotal() {
  const total = window.SiteNexsDirectory?.getEmployees().filter((employee) => employee.employmentStatus !== "inactive").length ?? 0;
  document.getElementById("statTotal").textContent = total;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function refreshAdminStats() {
  const today = localDateKey();
  const activeEmployees = window.SiteNexsDirectory?.getEmployees().filter((employee) => employee.employmentStatus !== "inactive") || [];
  const todayRecords = attendanceRecords.filter((record) => record.date === today);
  const countStatus = (status) => new Set(todayRecords.filter((record) => record.status === status).map((record) => record.email)).size;
  const present = countStatus("Hadir") + countStatus("Terlambat");
  const leaveEmails = new Set(requests
    .filter((request) => request.status === "Disetujui" && ["Izin", "Cuti"].includes(request.type))
    .filter((request) => !request.startDate || (request.startDate <= today && request.endDate >= today))
    .map((request) => request.email));
  const sickEmails = new Set(requests
    .filter((request) => request.status === "Disetujui" && request.type === "Sakit")
    .filter((request) => !request.startDate || (request.startDate <= today && request.endDate >= today))
    .map((request) => request.email));
  todayRecords.filter((record) => record.status === "Izin").forEach((record) => leaveEmails.add(record.email));
  todayRecords.filter((record) => record.status === "Sakit").forEach((record) => sickEmails.add(record.email));
  const leave = [...leaveEmails].filter((email) => !sickEmails.has(email)).length;
  const sick = sickEmails.size;
  document.getElementById("statPresent").textContent = String(present);
  document.getElementById("statLeave").textContent = String(leave);
  document.getElementById("statSick").textContent = String(sick);
  document.getElementById("statAbsent").textContent = String(Math.max(0, activeEmployees.length - present - leave - sick));
  renderAdminStatistics();
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

function waitForVideoFrame(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      video.removeEventListener("loadeddata", handleLoadedData);
      reject(new Error("Kamera belum mengirimkan gambar."));
    }, 5000);
    function handleLoadedData() {
      window.clearTimeout(timeout);
      resolve();
    }
    video.addEventListener("loadeddata", handleLoadedData, { once: true });
  });
}

function employeeCameraHasFrame() {
  return Boolean(
    employeeStream
    && employeeVideo.videoWidth
    && employeeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    && employeeStream.getVideoTracks().some((track) => track.readyState === "live"),
  );
}

function captureAttendanceSelfie() {
  if (!employeeCameraHasFrame()) throw new Error("Kamera belum menampilkan frame yang dapat diambil.");
  const width = 480;
  const height = 360;
  const videoRatio = employeeVideo.videoWidth / employeeVideo.videoHeight;
  const targetRatio = width / height;
  const sourceWidth = videoRatio > targetRatio ? employeeVideo.videoHeight * targetRatio : employeeVideo.videoWidth;
  const sourceHeight = videoRatio > targetRatio ? employeeVideo.videoHeight : employeeVideo.videoWidth / targetRatio;
  const sourceX = (employeeVideo.videoWidth - sourceWidth) / 2;
  const sourceY = (employeeVideo.videoHeight - sourceHeight) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak dapat memproses foto kamera.");
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(employeeVideo, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

async function startCamera(kind) {
  const isAdmin = kind === "admin";
  const video = isAdmin ? adminVideo : employeeVideo;
  const stage = document.getElementById(isAdmin ? "adminCameraStage" : "employeeCameraStage");
  const button = document.getElementById(isAdmin ? "adminCameraButton" : "employeeCameraButton");
  const setStatus = (message) => {
    if (!isAdmin) document.getElementById("cameraStatusText").innerHTML = `<i class="fa-solid fa-circle-info"></i> ${escapeHTML(message)}`;
  };

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    const message = "Kamera perlu halaman HTTPS atau localhost. Jalankan melalui http://localhost/PresensiSitenexs/";
    setStatus(message);
    showToast(message, "warning");
    return false;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan';
  let stream = null;
  try {
    const constraints = { video: { facingMode: { ideal: "user" }, aspectRatio: { ideal: 4 / 3 }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      if (error.name !== "OverconstrainedError" && error.name !== "ConstraintNotSatisfiedError") throw error;
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    video.srcObject = stream;
    await video.play();
    await waitForVideoFrame(video);
    if (isAdmin) {
      stopStream(adminStream, adminVideo, stage);
      adminStream = stream;
    } else {
      stopStream(employeeStream, employeeVideo, stage);
      employeeStream = stream;
    }
    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      if (isAdmin && adminStream === stream) stopAdminCamera();
      if (!isAdmin && employeeStream === stream) stopEmployeeCamera();
    }, { once: true });
    stage.classList.add("video-active");
    button.innerHTML = '<i class="fa-solid fa-video-slash"></i> Matikan kamera';
    if (!isAdmin) setStatus("Kamera aktif, gambar diterima");
    if (isAdmin) document.getElementById("captureFaceButton").disabled = false;
    return true;
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    if (video.srcObject === stream) video.srcObject = null;
    const messages = {
      NotAllowedError: "Izin kamera ditolak. Izinkan kamera di pengaturan situs browser.",
      NotFoundError: "Perangkat kamera tidak ditemukan.",
      NotReadableError: "Kamera sedang digunakan aplikasi lain.",
      AbortError: "Akses kamera terhenti. Coba aktifkan kembali.",
      SecurityError: "Browser memblokir kamera. Gunakan HTTPS atau localhost.",
      OverconstrainedError: "Kamera tidak mendukung pengaturan yang diminta.",
    };
    const message = messages[error.name] || error.message || "Kamera gagal diakses.";
    setStatus(message);
    button.innerHTML = '<i class="fa-solid fa-video"></i> Coba kamera lagi';
    showToast(message, "warning");
    return false;
  } finally {
    button.disabled = false;
  }
}

function captureFaceSample() {
  if (!adminStream || !adminVideo.videoWidth || adminVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    showToast("Aktifkan kamera dan tunggu pratinjau wajah sebelum mengambil foto.", "warning");
    return;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = adminVideo.videoWidth;
    canvas.height = adminVideo.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Foto kamera tidak dapat diproses oleh browser.");
    context.drawImage(adminVideo, 0, 0, canvas.width, canvas.height);
    const sample = canvas.toDataURL("image/jpeg", .78);
    if (!sample.startsWith("data:image/")) throw new Error("Foto sampel wajah tidak berhasil dibuat.");
    faceSample = sample;
    capturedFace = true;
    const preview = document.getElementById("enrollmentFacePreview");
    preview.src = sample;
    preview.classList.remove("is-hidden");
    const status = document.getElementById("enrollmentStatus");
    status.textContent = "Foto sampel wajah berhasil diambil";
    status.style.color = "#259b7e";
    document.getElementById("captureFaceButton").innerHTML = '<i class="fa-solid fa-check"></i> Ambil ulang foto';
    showToast("Foto sampel wajah siap untuk registrasi.");
  } catch (error) {
    capturedFace = false;
    faceSample = null;
    const preview = document.getElementById("enrollmentFacePreview");
    preview.removeAttribute("src");
    preview.classList.add("is-hidden");
    const status = document.getElementById("enrollmentStatus");
    status.textContent = "Foto sampel gagal diambil";
    status.style.color = "#c45e4e";
    showToast(`Foto sampel wajah gagal diambil: ${error.message}`, "error");
  }
}

function openEmployeeModal() {
  editingEmployeeEmail = null;
  capturedFace = false;
  faceSample = null;
  document.getElementById("employeeForm").reset();
  document.getElementById("newEmployeeOwner").value = currentAdminId;
  document.getElementById("newEmployeeOwnerDisplay").value = window.SiteNexsDirectory.getAdmins()
    .find((admin) => admin.id === currentAdminId)?.name || "Workspace demo";
  document.getElementById("employeeModalTitle").textContent = "Tambah karyawan";
  document.getElementById("employeeModalDescription").textContent = "Lengkapi profil dan daftarkan sampel wajah.";
  document.getElementById("employeeSubmitLabel").textContent = "Simpan karyawan";
  document.getElementById("newEmployeeEmail").readOnly = false;
  document.getElementById("newEmployeePassword").required = true;
  document.getElementById("employeePasswordField").classList.remove("is-hidden");
  document.getElementById("employeeEnrollmentBlock").classList.remove("is-hidden");
  generateEmployeePassword();
  updateCustomDivisionField();
  document.getElementById("enrollmentStatus").textContent = "Wajib ambil foto sebelum membuat akun";
  document.getElementById("enrollmentStatus").style.color = "";
  document.getElementById("enrollmentFacePreview").removeAttribute("src");
  document.getElementById("enrollmentFacePreview").classList.add("is-hidden");
  document.getElementById("captureFaceButton").innerHTML = '<i class="fa-solid fa-camera-retro"></i> Ambil foto sampel';
  stopAdminCamera();
  employeeModal.showModal();
}

function openEmployeeEditModal(email) {
  const employee = window.SiteNexsDirectory.getEmployeesForAdmin(currentAdminId).find((entry) => entry.email === email);
  if (!employee) {
    showToast("Data karyawan tidak ditemukan.", "error");
    return;
  }
  editingEmployeeEmail = email;
  capturedFace = false;
  faceSample = null;
  const form = document.getElementById("employeeForm");
  form.reset();
  document.getElementById("employeeModalTitle").textContent = "Edit karyawan";
  document.getElementById("employeeModalDescription").textContent = "Perbarui profil karyawan.";
  document.getElementById("employeeSubmitLabel").textContent = "Simpan perubahan";
  document.getElementById("newEmployeeName").value = employee.name;
  document.getElementById("newEmployeeEmail").value = employee.email || "";
  document.getElementById("newEmployeeEmail").readOnly = true;
  document.getElementById("newEmployeePassword").value = "";
  document.getElementById("newEmployeePassword").required = false;
  document.getElementById("employeePasswordField").classList.add("is-hidden");
  document.getElementById("employeeEnrollmentBlock").classList.add("is-hidden");
  document.getElementById("newEmployeeOwner").value = currentAdminId;
  document.getElementById("newEmployeeOwnerDisplay").value = window.SiteNexsDirectory.getAdmins()
    .find((admin) => admin.id === currentAdminId)?.name || "Workspace demo";
  const divisionSelect = document.getElementById("newEmployeeDivision");
  const availableDivision = [...divisionSelect.options].some((option) => option.value === employee.role);
  divisionSelect.value = availableDivision ? employee.role : "custom";
  document.getElementById("customDivisionName").value = availableDivision ? "" : employee.role;
  document.getElementById("newEmployeeAccountRole").value = employee.accountRole === "admin" ? "admin" : "employee";
  updateCustomDivisionField();
  stopAdminCamera();
  employeeModal.showModal();
}

function openEmployeeLocationDialog(email) {
  const employee = window.SiteNexsDirectory.getEmployees().find((entry) => entry.email === email);
  if (!employee) {
    showToast("Data karyawan tidak ditemukan.", "error");
    return;
  }
  try {
    activeLocationPolicyEmployee = employee;
    document.getElementById("employeeLocationDescription").textContent = `${employee.name} · ${employee.email}`;
    document.getElementById("employeeLocationPolicy").value = window.SiteNexsGpsAttendance.getEmployeePolicy(email);
    document.getElementById("employeeLocationStatus").textContent = "";
    document.getElementById("employeeLocationStatus").classList.remove("is-error");
    document.getElementById("employeeLocationSettingsStep").hidden = false;
    document.getElementById("employeeLocationConfirmationStep").hidden = true;
    employeeLocationDialog.showModal();
  } catch (error) {
    showToast(`Aturan lokasi tidak dapat dimuat: ${error.message}`, "error");
  }
}

document.getElementById("reviewEmployeeLocationPolicy").addEventListener("click", () => {
  if (!activeLocationPolicyEmployee) return;
  const policy = document.getElementById("employeeLocationPolicy").value;
  const policyDescription = policy === "strict"
    ? "presensi akan diblokir ketika lokasi berada di luar radius kantor."
    : "presensi tetap diizinkan, tetapi akan ditandai tidak tepat ketika lokasi berada di luar radius kantor.";
  document.getElementById("employeeLocationConfirmationText").textContent =
    `Aturan untuk ${activeLocationPolicyEmployee.name}: ${policyDescription}`;
  document.getElementById("employeeLocationSettingsStep").hidden = true;
  document.getElementById("employeeLocationConfirmationStep").hidden = false;
});

document.getElementById("backEmployeeLocationPolicy").addEventListener("click", () => {
  document.getElementById("employeeLocationConfirmationStep").hidden = true;
  document.getElementById("employeeLocationSettingsStep").hidden = false;
});

document.getElementById("confirmEmployeeLocationPolicy").addEventListener("click", () => {
  if (!activeLocationPolicyEmployee) return;
  const confirmButton = document.getElementById("confirmEmployeeLocationPolicy");
  confirmButton.disabled = true;
  try {
    const policy = document.getElementById("employeeLocationPolicy").value;
    window.SiteNexsGpsAttendance.setEmployeePolicy(activeLocationPolicyEmployee.email, policy);
    employeeLocationDialog.close();
    showToast(`Aturan lokasi ${activeLocationPolicyEmployee.name} berhasil diperbarui.`);
    activeLocationPolicyEmployee = null;
  } catch (error) {
    const status = document.getElementById("employeeLocationStatus");
    status.textContent = `Aturan lokasi gagal disimpan: ${error.message}`;
    status.classList.add("is-error");
    document.getElementById("employeeLocationConfirmationStep").hidden = true;
    document.getElementById("employeeLocationSettingsStep").hidden = false;
  } finally {
    confirmButton.disabled = false;
  }
});

function generateEmployeePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const randomBytes = new Uint8Array(16);
  if (!window.crypto?.getRandomValues) {
    showToast("Browser tidak mendukung pembuatan password aman.", "error");
    return;
  }
  window.crypto.getRandomValues(randomBytes);
  document.getElementById("newEmployeePassword").value = Array.from(
    randomBytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
}

function closeDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (dialog.open) dialog.close();
}

async function addEmployee(event) {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector("[type='submit']");
  submitButton.disabled = true;
  try {
    const name = document.getElementById("newEmployeeName").value.trim();
    const email = document.getElementById("newEmployeeEmail").value.trim();
    const password = document.getElementById("newEmployeePassword").value;
    const ownerAdminId = document.getElementById("newEmployeeOwner").value;
    const selectedDivision = document.getElementById("newEmployeeDivision").value;
    const role = selectedDivision === "custom" ? document.getElementById("customDivisionName").value.trim() : selectedDivision;
    const accountRole = document.getElementById("newEmployeeAccountRole").value;
    if (!editingEmployeeEmail && (!capturedFace || !faceSample)) {
      document.getElementById("enrollmentStatus").textContent = "Foto wajah wajib diambil sebelum akun dibuat";
      document.getElementById("enrollmentStatus").style.color = "#c45e4e";
      showToast("Aktifkan kamera dan ambil foto sampel wajah sebelum membuat akun.", "error");
      document.getElementById("adminCameraButton").focus();
      return;
    }
    if (!name || !email || !role || !ownerAdminId || (!editingEmployeeEmail && password.length < 8)) {
      showToast("Lengkapi nama, email, jabatan, dan admin pemilik. Password minimal 8 karakter untuk akun baru.", "error");
      return;
    }
    if (!window.SiteNexsDirectory) {
      showToast("Penyimpanan daftar karyawan demo tidak tersedia.", "error");
      return;
    }
    if (editingEmployeeEmail) {
      window.SiteNexsDirectory.updateEmployee(editingEmployeeEmail, { name, email, role, ownerAdminId, accountRole });
      editingEmployeeEmail = null;
      closeDialog("employeeModal");
      showToast(`${name} berhasil diperbarui.`);
      return;
    }
    const credentials = await window.SiteNexsDirectory.createEmployeeCredential(password);
    window.SiteNexsDirectory.addEmployee({ name, email, role, ownerAdminId, accountRole, credentials, faceSample, status: "Hadir" });
    updateEmployeeTotal();
    renderAttendance();
    closeDialog("employeeModal");
    stopAdminCamera();
    document.getElementById("createdAccountIdentifier").textContent = email;
    document.getElementById("createdAccountPassword").textContent = password;
    document.getElementById("credentialDialog").showModal();
    const roleLabel = accountRole === "admin" ? "sebagai Admin" : "sebagai Karyawan";
    showToast(`${name} ditambahkan ${roleLabel}. Simpan kredensial login yang ditampilkan.`);
    capturedFace = false;
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

function updateCustomDivisionField() {
  const isCustom = document.getElementById("newEmployeeDivision").value === "custom";
  const field = document.getElementById("customDivisionField");
  const input = document.getElementById("customDivisionName");
  field.classList.toggle("is-hidden", !isCustom);
  input.required = isCustom;
  if (!isCustom) input.value = "";
}

function openAttachmentDatabase() {
  if (!window.indexedDB) return Promise.reject(new Error("Penyimpanan lampiran tidak didukung browser ini."));
  if (attachmentDbPromise) return attachmentDbPromise;
  attachmentDbPromise = new Promise((resolve, reject) => {
    const opening = window.indexedDB.open("sitenexs-local-requests", 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore("attachments", { keyPath: "id" });
    opening.onerror = () => {
      attachmentDbPromise = null;
      reject(new Error(`Database lampiran gagal dibuka: ${opening.error?.message || "kesalahan tidak diketahui"}`));
    };
    opening.onsuccess = () => resolve(opening.result);
  });
  return attachmentDbPromise;
}

async function storeRequestAttachment(id, file) {
  const database = await openAttachmentDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("attachments", "readwrite");
    transaction.objectStore("attachments").put({ id, name: file.name, type: file.type, blob: file });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Lampiran gagal disimpan: ${transaction.error?.message || "ruang browser mungkin tidak cukup"}`));
    transaction.onabort = () => reject(new Error("Penyimpanan lampiran dibatalkan browser."));
  });
}

async function getRequestAttachment(id) {
  const database = await openAttachmentDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction("attachments", "readonly").objectStore("attachments").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Lampiran gagal dibaca: ${request.error?.message || "kesalahan tidak diketahui"}`));
  });
}

async function deleteRequestAttachment(id) {
  const database = await openAttachmentDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("attachments", "readwrite");
    transaction.objectStore("attachments").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Lampiran sementara gagal dibersihkan: ${transaction.error?.message || "kesalahan tidak diketahui"}`));
  });
}

function showAttachment(request) {
  selectedAttachment = request;
  document.getElementById("attachmentTitle").textContent = request.file || "Tidak ada lampiran";
  document.getElementById("attachmentSubtitle").textContent = `${request.name} · ${request.type} · ${request.range}`;
  document.getElementById("documentName").textContent = request.name;
  document.getElementById("documentReason").textContent = request.reason;
  document.getElementById("documentDate").textContent = request.range;
  attachmentModal.showModal();
  const fileCard = document.getElementById("attachmentFileCard");
  const mockPreview = document.getElementById("attachmentMockPreview");
  fileCard.classList.add("is-hidden");
  mockPreview.classList.remove("is-hidden");
  if (attachmentObjectUrl) URL.revokeObjectURL(attachmentObjectUrl);
  attachmentObjectUrl = null;
  if (!request.attachmentId) return;
  getRequestAttachment(request.attachmentId).then((attachment) => {
    if (!attachmentModal.open || selectedAttachment !== request) return;
    if (!attachment) {
      showToast("File lampiran tidak ditemukan di penyimpanan lokal browser ini.", "error");
      return;
    }
    attachmentObjectUrl = URL.createObjectURL(attachment.blob);
    document.getElementById("attachmentFileName").textContent = attachment.name;
    document.getElementById("attachmentFileStatus").textContent = `${(attachment.blob.size / 1024).toFixed(0)} KB · disimpan lokal`;
    const downloadLink = document.getElementById("downloadRequestFile");
    downloadLink.href = attachmentObjectUrl;
    downloadLink.download = attachment.name;
    fileCard.classList.remove("is-hidden");
    mockPreview.classList.add("is-hidden");
  }).catch((error) => {
    if (attachmentModal.open && selectedAttachment === request) showToast(error.message, "error");
  });
}

function handleRequestAction(event) {
  if (isEmployeeDemo) return;
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
  if (action === "approve") {
    pendingApprovalRequestId = request.id;
    document.getElementById("approveRequestConfirmDescription").textContent =
      `Anda akan menyetujui pengajuan ${request.type.toLowerCase()} dari ${request.name} untuk ${request.range}.`;
    approveRequestConfirmDialog.showModal();
    return;
  }
  if (action !== "reject") return;
  completeRequestDecision(request, "reject");
}

function completeRequestDecision(request, action) {
  if (request.status !== "Menunggu") return;
  const nextStatus = action === "approve" ? "Disetujui" : "Ditolak";
  const reviewedAt = new Date().toISOString();
  const updatedRequests = requests.map((entry) => entry.id === request.id ? { ...entry, status: nextStatus, reviewedAt } : entry);
  if (!saveLocalArray(requestStorageKey, updatedRequests)) return;
  request.status = nextStatus;
  request.reviewedAt = reviewedAt;
  let attendanceUpdated = true;
  if (nextStatus === "Disetujui" && ["Izin", "Sakit", "Cuti"].includes(request.type)) {
    attendanceUpdated = applyApprovedLeave(request);
  }
  renderRequests();
  const decision = request.status === "Disetujui" ? "disetujui" : "ditolak";
  addNotification(`Pengajuan ${request.type.toLowerCase()} ${decision}`, `${request.name} · ${request.range}.`, "#leaveSection");
  showToast(attendanceUpdated
    ? `${request.name}: pengajuan ${request.type.toLowerCase()} ${decision}.`
    : "Pengajuan disetujui, tetapi rekap kehadiran belum berhasil diperbarui.", attendanceUpdated ? "success" : "error");
}

function applyApprovedLeave(request) {
  const start = request.startDate || "";
  const end = request.endDate || start;
  if (!start || !end) return;
  let date = new Date(`${start}T00:00:00`);
  const lastDate = new Date(`${end}T00:00:00`);
  let days = 0;
  const approvedDates = [];
  while (date <= lastDate && days < 366) {
    const isoDate = localDateKey(date);
    approvedDates.push({ isoDate, date: new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(date) });
    let record = attendanceRecords.find((entry) => entry.email === request.email && entry.date === isoDate);
    if (!record) {
      record = { name: request.name, email: request.email, role: getWorkEmployees().find((employee) => employee.email === request.email)?.role || "", date: isoDate, in: "—", out: "—", lastDate: "—", lastTime: "—" };
      attendanceRecords.unshift(record);
    }
    record.status = request.type;
    date.setDate(date.getDate() + 1);
    days += 1;
  }
  if (!saveLocalArray(attendanceStorageKey, attendanceRecords)) return false;
  const employeeHistoryKey = `sitenexsPersonalAttendance:${request.email}`;
  const employeeHistory = request.email === currentEmployeeEmail ? personalHistory : loadLocalArray(employeeHistoryKey, []);
  approvedDates.forEach(({ isoDate, date: formattedDate }) => {
    const existing = employeeHistory.find((entry) => entry.isoDate === isoDate);
    if (existing) {
      existing.date = formattedDate;
      existing.in = "—";
      existing.out = "—";
      existing.status = request.type;
    } else {
      employeeHistory.unshift({ date: formattedDate, isoDate, in: "—", out: "—", status: request.type });
    }
  });
  const historySaved = request.email === currentEmployeeEmail
    ? savePersonalHistory()
    : saveLocalArray(employeeHistoryKey, employeeHistory);
  if (!historySaved) return false;
  if (request.email === currentEmployeeEmail) {
    renderPersonalHistory();
  }
  renderAttendance();
  return true;
}

function updateScanFeedback(state, title, message, time = "--:--") {
  const feedback = document.getElementById("scanFeedback");
  feedback.classList.remove("success", "error", "is-busy");
  if (state) feedback.classList.add(state);
  document.getElementById("scanFeedbackTitle").textContent = title;
  document.getElementById("scanFeedbackMessage").textContent = message;
  document.getElementById("scanFeedbackTime").textContent = time;
}

function addPersonalAttendance(type, locationAssessment, selfie) {
  const now = new Date();
  const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const date = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(now);
  const today = localDateKey(now);
  const existing = personalHistory.find((entry) => entry.isoDate === today || entry.date === date);
  const status = type === "in" && time > "09:00" ? "Terlambat" : "Hadir";
  if (type === "in" && existing) {
    existing.in = time;
    existing.status = status;
    existing.isoDate = today;
    if (selfie) existing.selfie = selfie;
  } else if (type === "out" && existing) {
    existing.out = time;
    existing.isoDate = today;
    if (selfie) existing.selfie = selfie;
  } else {
    personalHistory.unshift({ date, isoDate: today, in: type === "in" ? time : "—", out: type === "out" ? time : "—", status, ...(selfie ? { selfie } : {}) });
  }
  if (!savePersonalHistory()) return;
  renderPersonalHistory();
  addWorkActivity(
    type === "in" ? "Presensi masuk berhasil" : "Presensi pulang berhasil",
    `${locationAssessment.status === "tepat" ? "Lokasi tepat" : locationAssessment.status === "tidak-tepat" ? "Lokasi tidak tepat" : "Lokasi tidak terverifikasi"} · ${locationAssessment.message}`,
    type === "in" ? "fa-arrow-right-to-bracket" : "fa-arrow-right-from-bracket",
    locationAssessment.status === "tidak-tepat" ? "is-warning" : "is-success",
  );
  const employee = getCurrentWorkEmployee();
  let record = attendanceRecords.find((entry) => entry.email === employee.email && entry.date === today);
  if (!record) {
    record = { name: employee.name, email: employee.email, role: employee.role, status, date: today, in: "—", out: "—", lastDate: "Hari ini", lastTime: time };
    attendanceRecords.unshift(record);
  }
  if (type === "in") {
    record.in = time;
    record.status = status;
  }
  else record.out = time;
  record.selfie = selfie || record.selfie;
  record.employmentStatus = "active";
  record.lastDate = "Hari ini";
  record.lastTime = time;
  saveLocalArray(attendanceStorageKey, attendanceRecords.map(({ selfie: storedSelfie, ...entry }) => entry));
  renderAttendance();
}

async function performScan(useDemo = false) {
  const stage = document.getElementById("employeeCameraStage");
  const button = document.getElementById("scanButton");
  const gps = window.SiteNexsGpsAttendance;
  const employee = gps?.getCurrentEmployee();
  const scanType = selectedScanType;
  let locationAssessment = { status: "gps-tidak-tersedia", distanceMeters: null, allowed: true, message: "GPS tidak tersedia pada halaman ini." };

  if (button.disabled) return;
  if (!useDemo && !employeeStream) {
    const connected = await startCamera("employee");
    if (!connected) {
      updateScanFeedback("error", "Kamera belum tersedia", "Aktifkan izin kamera melalui localhost/HTTPS, lalu coba lagi.");
      return;
    }
  }
  if (!useDemo && !employeeCameraHasFrame()) {
    stopEmployeeCamera();
    updateScanFeedback("error", "Kamera tidak mengirim gambar", "Aktifkan kamera kembali dan pastikan pratinjau video terlihat.");
    showToast("Presensi belum dicatat karena gambar kamera tidak tersedia.", "warning");
    return;
  }
  let selfie = null;
  if (!useDemo) {
    try {
      selfie = captureAttendanceSelfie();
    } catch (error) {
      updateScanFeedback("error", "Swafoto gagal diambil", error.message);
      showToast(`Presensi belum dicatat: ${error.message}`, "error");
      return;
    }
  }

  if (gps && employee) {
    try {
      const location = await gps.getCurrentLocation();
      locationAssessment = gps.assessAttendance(employee.email, location);
    } catch (error) {
      try {
        locationAssessment = gps.assessAttendance(employee.email, null);
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

  if (!useDemo) {
    stage.classList.add("is-expanded");
    document.body.classList.add("camera-expanded");
    stage.setAttribute("aria-modal", "true");
    document.getElementById("cameraExpandClose").focus();
  }
  button.disabled = true;
  stage.classList.add("is-scanning");
  document.getElementById("scanButton").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memindai wajah';
  updateScanFeedback("is-busy", "Memeriksa kamera...", useDemo ? "Simulasi berjalan di perangkat ini." : "Pastikan wajah tetap berada di dalam bingkai.");
  document.getElementById("scanFeedback").classList.add("is-busy");
  window.clearTimeout(scanTimeout);
  scanTimeout = window.setTimeout(() => {
    if (!useDemo && !employeeCameraHasFrame()) {
      stage.classList.remove("is-scanning");
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-expand"></i> Mulai scan';
      stopEmployeeCamera();
      updateScanFeedback("error", "Kamera terputus", "Presensi tidak dicatat. Aktifkan kamera dan coba lagi.");
      showToast("Kamera terputus sebelum presensi selesai.", "warning");
      return;
    }
    stage.classList.remove("is-scanning");
    stage.classList.add("is-success");
    const now = new Date();
    const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    const actionName = scanType === "in" ? "Absen masuk" : "Absen keluar";
    const attendanceMessage = `${useDemo ? "Presensi simulasi tersimpan di sesi ini." : "Kamera aktif; pencocokan wajah belum terhubung ke layanan verifikasi."} ${locationAssessment.message}`;
    updateScanFeedback("success", `${actionName} berhasil`, attendanceMessage, `${time} WIB`);
    document.getElementById("scanButton").innerHTML = '<i class="fa-solid fa-check"></i> Berhasil';
    if (gps && employee) {
      try {
        gps.recordAttendance(employee, scanType, locationAssessment);
      } catch (error) {
        showToast(`Presensi tersimpan, tetapi catatan GPS gagal disimpan: ${error.message}`, "error");
      }
    }
    addPersonalAttendance(scanType, locationAssessment, selfie);
    if (selfie) {
      document.getElementById("selfiePreview").src = selfie;
      document.getElementById("selfieCapture").classList.remove("is-hidden");
    }
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
  document.querySelectorAll(".scan-mode").forEach((button) => {
    const isActive = button.dataset.scanType === type;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
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
  const isOvertime = type === "Lembur";
  const endDate = document.getElementById("leaveEnd");
  endDate.required = !isOvertime;
  document.getElementById("leaveEndField").classList.toggle("is-hidden", isOvertime);
  document.getElementById("overtimeFields").classList.toggle("is-hidden", !isOvertime);
  document.getElementById("overtimeStart").required = isOvertime;
  document.getElementById("overtimeEnd").required = isOvertime;
  document.querySelector(".leave-panel .panel-kicker").textContent = isOvertime ? "PENGAJUAN LEMBUR" : "BUTUH IZIN?";
  document.querySelector(".leave-panel .panel-heading h2").textContent = isOvertime ? "Ajukan lembur" : "Ajukan ketidakhadiran";
  const uploadTitle = document.getElementById("uploadTitle");
  uploadTitle.innerHTML = type === "Sakit" ? 'Surat keterangan dokter <small>(opsional)</small>' : type === "Lembur" ? 'Lampirkan bukti lembur <small>(opsional)</small>' : 'Lampirkan dokumen <small>(opsional)</small>';
  const submitButton = document.querySelector(".submit-leave");
  submitButton.innerHTML = `<i class="fa-regular fa-paper-plane"></i> Kirim pengajuan ${type.toLowerCase()}`;
  updateOvertimeEstimate();
}

function updateOvertimeEstimate() {
  const start = document.getElementById("overtimeStart").value;
  const end = document.getElementById("overtimeEnd").value;
  const output = document.getElementById("overtimeHours");
  if (!start || !end) {
    output.value = "";
    return;
  }
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (minutes === 0) {
    output.value = "";
    return;
  }
  if (minutes < 0) minutes += 24 * 60;
  output.value = (minutes / 60).toFixed(2);
}

function setSelectedFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    currentFile = null;
    document.getElementById("leaveFile").value = "";
    document.getElementById("uploadTitle").innerHTML = 'Lampirkan dokumen <small>(opsional)</small>';
    document.getElementById("uploadHelp").textContent = "Klik atau tarik file ke sini · PDF, JPG maks. 5 MB";
    document.getElementById("uploadZone").classList.remove("has-file");
    showToast("Ukuran file maksimal 5 MB.", "error");
    return;
  }
  currentFile = file;
  document.getElementById("uploadTitle").textContent = file.name;
  document.getElementById("uploadHelp").textContent = `${(file.size / 1024).toFixed(0)} KB · siap dilampirkan`;
  document.getElementById("uploadZone").classList.add("has-file");
}

async function submitLeaveRequest(event) {
  event.preventDefault();
  if (leaveSubmissionPending) return;
  const start = document.getElementById("leaveStart").value;
  const end = selectedLeaveType === "Lembur" ? start : document.getElementById("leaveEnd").value;
  const reason = document.getElementById("leaveReason").value.trim();
  const overtimeStart = document.getElementById("overtimeStart").value;
  const overtimeEnd = document.getElementById("overtimeEnd").value;
  if (!start || !end || !reason || (selectedLeaveType === "Lembur" && (!overtimeStart || !overtimeEnd))) {
    showToast("Lengkapi tanggal dan alasan pengajuan.", "warning");
    return;
  }
  if (end < start) {
    showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", "error");
    return;
  }
  const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const dateRange = start === end ? dateFormatter.format(new Date(`${start}T00:00:00`)) : `${dateFormatter.format(new Date(`${start}T00:00:00`))} — ${dateFormatter.format(new Date(`${end}T00:00:00`))}`;
  const type = selectedLeaveType;
  updateOvertimeEstimate();
  const overtimeHours = document.getElementById("overtimeHours").value;
  if (type === "Lembur" && (!overtimeHours || Number(overtimeHours) <= 0)) {
    showToast("Jam lembur tidak dapat dihitung. Periksa waktu mulai dan selesai.", "error");
    return;
  }
  const range = type === "Lembur" ? `${dateRange} · ${overtimeStart}–${overtimeEnd}` : dateRange;
  const file = currentFile?.name || "";
  const employee = getCurrentWorkEmployee();
  const request = {
    id: Date.now(),
    name: employee.name,
    email: employee.email,
    type,
    date: dateFormatter.format(new Date()),
    startDate: start,
    endDate: end,
    range,
    reason,
    file,
    ...(type === "Lembur" ? { overtimeStart, overtimeEnd, overtimeHours } : {}),
    status: "Menunggu",
    createdAt: new Date().toISOString(),
  };
  if (currentFile) {
    leaveSubmissionPending = true;
    try {
      request.attachmentId = String(request.id);
      await storeRequestAttachment(request.attachmentId, currentFile);
    } catch (error) {
      leaveSubmissionPending = false;
      showToast(`Pengajuan tidak dikirim: ${error.message}`, "error");
      return;
    }
  }
  const updatedRequests = [request, ...requests];
  if (!saveLocalArray(requestStorageKey, updatedRequests)) {
    leaveSubmissionPending = false;
    if (request.attachmentId) {
      try {
        await deleteRequestAttachment(request.attachmentId);
      } catch (error) {
        showToast(error.message, "error");
      }
    }
    return;
  }
  leaveSubmissionPending = false;
  requests.unshift(request);
  renderRequests();
  const icons = { Sakit: "fa-kit-medical", Cuti: "fa-umbrella-beach", Lembur: "fa-business-time", Izin: "fa-calendar-minus" };
  addWorkActivity(`Pengajuan ${type.toLowerCase()} dikirim`, `${range} · Menunggu peninjauan admin.`, icons[type], "is-warning");
  addNotification(`Pengajuan ${type.toLowerCase()} menunggu peninjauan`, `${range} · Status pengajuan: Menunggu.`, "#leaveSection");
  document.getElementById("leaveForm").reset();
  currentFile = null;
  document.getElementById("leaveFile").value = "";
  document.getElementById("uploadTitle").innerHTML = 'Lampirkan dokumen <small>(opsional)</small>';
  document.getElementById("uploadHelp").textContent = "Klik atau tarik file ke sini · PDF, JPG maks. 5 MB";
  document.getElementById("uploadZone").classList.remove("has-file");
  setLeaveType("Izin");
  showToast(`Pengajuan ${type.toLowerCase()} berhasil dikirim ke admin.`);
}

function getFilteredAttendanceRecords() {
  const year = document.getElementById("yearFilter").value;
  const month = document.getElementById("monthFilter").value;
  const status = document.getElementById("attendanceStatusFilter").value;
  const query = document.getElementById("employeeSearch").value.trim().toLowerCase();
  return attendanceRecords.filter((record) => {
    const date = new Date(`${record.date}T00:00:00`);
    const displayStatus = record.employmentStatus === "inactive" ? "Nonaktif" : record.status;
    return String(date.getFullYear()) === year
      && (month === "all" || String(date.getMonth()) === month)
      && (status === "all" || displayStatus === status)
      && `${record.name} ${record.email}`.toLowerCase().includes(query);
  });
}

function calculateWorkedHours(record) {
  if (!/^\d{2}:\d{2}$/.test(record.in) || !/^\d{2}:\d{2}$/.test(record.out)) return "";
  const [inHour, inMinute] = record.in.split(":").map(Number);
  const [outHour, outMinute] = record.out.split(":").map(Number);
  let minutes = outHour * 60 + outMinute - (inHour * 60 + inMinute);
  if (minutes < 0) minutes += 24 * 60;
  return (minutes / 60).toFixed(2);
}

function exportAdminReport() {
  const rows = [["Nama karyawan", "Email", "Divisi/Jabatan", "Tanggal", "Status", "Jam masuk", "Jam keluar", "Total jam"]];
  getFilteredAttendanceRecords().forEach((record) => rows.push([
    record.name,
    record.email,
    record.role,
    record.date,
    record.employmentStatus === "inactive" ? "Nonaktif" : record.status,
    record.in,
    record.out,
    calculateWorkedHours(record),
  ]));
  downloadCsv(`rekap-presensi-${localDateKey()}.csv`, rows);
  showToast(`${rows.length - 1} baris rekap diekspor sebagai CSV yang dapat dibuka di Excel.`);
}

function exportPersonalReport() {
  const rows = [["Tanggal", "Tanggal ISO", "Jam masuk", "Jam keluar", "Status"]];
  getFilteredPersonalHistory().forEach((entry) => rows.push([entry.date, entry.isoDate, entry.in, entry.out, entry.status]));
  downloadCsv(`riwayat-presensi-pribadi-${localDateKey()}.csv`, rows);
  showToast(`${rows.length - 1} baris riwayat diekspor sebagai CSV yang dapat dibuka di Excel.`);
}

function printPersonalReport() {
  document.body.classList.add("print-personal-report");
  const cleanup = () => document.body.classList.remove("print-personal-report");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  window.setTimeout(cleanup, 30000);
}

document.getElementById("yearFilter").addEventListener("change", renderAttendance);
document.getElementById("monthFilter").addEventListener("change", () => { attendancePage = 1; renderAttendance(); });
document.getElementById("attendanceStatusFilter").addEventListener("change", () => { attendancePage = 1; renderAttendance(); });
document.getElementById("employeeSearch").addEventListener("input", () => { attendancePage = 1; renderAttendance(); });
const resetConfirmDialog = document.getElementById("resetConfirmDialog");
document.getElementById("filterButton").addEventListener("click", () => resetConfirmDialog.showModal());
resetConfirmDialog.addEventListener("click", (event) => {
  if (event.target === resetConfirmDialog) resetConfirmDialog.close();
});
document.getElementById("confirmResetFilters").addEventListener("click", () => {
  document.getElementById("yearFilter").value = String(new Date().getFullYear());
  document.getElementById("monthFilter").value = "all";
  document.getElementById("attendanceStatusFilter").value = "all";
  document.getElementById("employeeSearch").value = "";
  attendancePage = 1;
  resetConfirmDialog.close();
  renderAttendance();
  showToast("Filter rekap telah direset.");
});
document.getElementById("attendancePagination").addEventListener("click", (event) => {
  const button = event.target.closest("[data-attendance-page]");
  if (!button || button.disabled) return;
  attendancePage = Number(button.dataset.attendancePage);
  renderAttendance();
  document.getElementById("attendanceSection").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.getElementById("exportButton").addEventListener("click", exportAdminReport);
document.getElementById("viewAllRequests").addEventListener("click", () => {
  showToast(`${requests.length} pengajuan ada di daftar review.`);
  document.getElementById("requestsSection").scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("addEmployeeButton").addEventListener("click", openEmployeeModal);
document.getElementById("navAddEmployee").addEventListener("click", openEmployeeModal);
document.getElementById("employeeAddEmployeeButton").addEventListener("click", openEmployeeModal);
document.getElementById("menu-tambah-karyawan").addEventListener("click", openEmployeeModal);
document.getElementById("employeeForm").addEventListener("submit", addEmployee);
attendanceRows.addEventListener("click", async (event) => {
  const menuToggle = event.target.closest("[data-employee-menu-toggle]");
  if (menuToggle) {
    const currentMenu = menuToggle.parentElement.querySelector(".employee-row-menu");
    const willOpen = currentMenu.hidden;
    attendanceRows.querySelectorAll(".employee-row-menu").forEach((menu) => {
      menu.hidden = true;
      menu.parentElement.querySelector("[data-employee-menu-toggle]")?.setAttribute("aria-expanded", "false");
    });
    currentMenu.hidden = !willOpen;
    menuToggle.setAttribute("aria-expanded", String(willOpen));
    return;
  }

  const actionButton = event.target.closest("[data-employee-action]");
  if (!actionButton) return;
  const { employeeAction, employeeEmail } = actionButton.dataset;
  attendanceRows.querySelectorAll(".employee-row-menu").forEach((menu) => {
    menu.hidden = true;
    menu.parentElement.querySelector("[data-employee-menu-toggle]")?.setAttribute("aria-expanded", "false");
  });
  if (employeeAction === "edit") {
    openEmployeeEditModal(employeeEmail);
    return;
  }
  if (employeeAction === "history") {
    openEmployeeActivityHistory(employeeEmail);
    return;
  }
  if (employeeAction === "location") {
    openEmployeeLocationDialog(employeeEmail);
    return;
  }

  const employee = window.SiteNexsDirectory.getEmployees().find((entry) => entry.email === employeeEmail);
  if (!employee) return;
  if (employeeAction === "toggle-active") {
    const active = employee.employmentStatus === "inactive";
    if (!active && !window.confirm(`Nonaktifkan akun "${employee.name}"? Akun ini tidak dapat login sampai diaktifkan kembali.`)) return;
    try {
      window.SiteNexsDirectory.setEmployeeActive(employeeEmail, active);
      showToast(`${employee.name} ${active ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch (error) {
      showToast(`Status akun tidak dapat diperbarui: ${error.message}`, "error");
    }
    return;
  }
  if (!window.confirm(`Hapus karyawan "${employee.name}"?`)) return;
  const deleteDialog = document.getElementById("employeeDeleteConfirmDialog");
  deleteDialog.querySelector("[data-delete-confirm-name]").textContent = employee.name;
  deleteDialog.showModal();
  await new Promise((resolve) => {
    deleteDialog.addEventListener("close", resolve, { once: true });
  });
  if (deleteDialog.returnValue !== "delete") return;
  try {
    window.SiteNexsDirectory.deleteEmployee(employeeEmail);
    showToast(`${employee.name} berhasil dihapus.`);
  } catch (error) {
    showToast(`Karyawan tidak dapat dihapus: ${error.message}`, "error");
  }
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".employee-row-actions")) return;
  attendanceRows.querySelectorAll(".employee-row-menu").forEach((menu) => {
    menu.hidden = true;
    menu.parentElement.querySelector("[data-employee-menu-toggle]")?.setAttribute("aria-expanded", "false");
  });
});
document.querySelectorAll("[data-open-password-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("accountSettingsDialog").close();
    window.location.assign("login.html#forgot-password");
  });
});
document.getElementById("generateEmployeePassword").addEventListener("click", generateEmployeePassword);
document.getElementById("credentialDialog").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-credential]");
  if (!button) return;
  const elementId = button.dataset.copyCredential === "identifier" ? "createdAccountIdentifier" : "createdAccountPassword";
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Fitur salin otomatis tidak tersedia; salin teks secara manual.");
    await navigator.clipboard.writeText(document.getElementById(elementId).textContent);
    showToast("Kredensial disalin.");
  } catch (error) {
    showToast(error.message, "warning");
  }
});
document.getElementById("taskForm").addEventListener("submit", createSharedTask);
document.getElementById("adminTaskForm").addEventListener("submit", createSharedTask);
document.getElementById("openAdminTaskForm").addEventListener("click", () => {
  const form = document.getElementById("adminTaskForm");
  form.reset();
  const status = form.querySelector("[data-task-form-status]");
  status.textContent = "";
  status.classList.remove("is-error", "is-success");
  populateTaskAssignees();
  document.getElementById("adminTaskEntryStep").hidden = false;
  document.getElementById("adminTaskReviewStep").hidden = true;
  adminTaskDialog.showModal();
});
document.getElementById("backToAdminTaskEntry").addEventListener("click", () => {
  document.getElementById("adminTaskReviewStep").hidden = true;
  document.getElementById("adminTaskEntryStep").hidden = false;
});
document.getElementById("confirmCreateAdminTask").addEventListener("click", () => {
  const button = document.getElementById("confirmCreateAdminTask");
  button.disabled = true;
  try {
    saveSharedTask(document.getElementById("adminTaskForm"));
  } finally {
    button.disabled = false;
  }
});
adminTaskDialog.addEventListener("close", () => {
  document.getElementById("adminTaskForm").reset();
  document.getElementById("adminTaskEntryStep").hidden = false;
  document.getElementById("adminTaskReviewStep").hidden = true;
  populateTaskAssignees();
});
document.getElementById("employeeJournalForm").addEventListener("submit", submitEmployeeActivityJournal);
document.getElementById("confirmSaveActivity").addEventListener("click", saveEmployeeActivityJournal);
document.querySelectorAll(".journal-pagination").forEach((pagination) => pagination.addEventListener("click", (event) => {
  const button = event.target.closest("[data-journal-page]");
  if (!button || button.disabled) return;
  const page = Number(button.dataset.journalPage);
  if (!Number.isInteger(page) || page < 1) return;
  if (button.dataset.journalPageScope === "admin") {
    adminJournalPage = page;
    renderActivityJournal();
  } else if (button.dataset.journalPageScope === "employee") {
    employeeJournalPage = page;
    renderActivityJournal();
  } else {
    employeeHistoryPage = page;
    renderEmployeeActivityHistory();
  }
}));
document.getElementById("employeeJournalMedia").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const label = document.getElementById("employeeJournalSelectedFile");
  if (!file) {
    label.classList.add("is-hidden");
    label.textContent = "";
    return;
  }
  label.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  label.classList.toggle("is-error", file.size > 50 * 1024 * 1024);
  label.classList.remove("is-hidden");
});
["adminJournalEntries", "employeeJournalEntries"].forEach((id) => {
  document.getElementById(id).addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-journal-view]");
    if (viewButton) {
      openActivityJournalEntry(viewButton.dataset.journalView);
      return;
    }
    const deleteButton = event.target.closest("[data-journal-delete]");
    if (deleteButton) requestDeleteActivity(deleteButton.dataset.journalDelete);
  });
});
document.getElementById("confirmDeleteActivity").addEventListener("click", confirmDeleteActivity);
document.getElementById("activityMediaDialog").addEventListener("close", () => {
  activeJournalPreviewId = null;
  document.getElementById("activityMediaVideo").pause();
  if (activityMediaObjectUrl) URL.revokeObjectURL(activityMediaObjectUrl);
  activityMediaObjectUrl = null;
});
document.getElementById("activityDeleteDialog").addEventListener("close", () => {
  pendingActivityDeleteId = null;
});
document.getElementById("employeeActivityHistoryDialog").addEventListener("close", () => {
  activeEmployeeHistoryEmail = "";
});
const taskBoard = document.getElementById("taskBoard");
taskBoard.addEventListener("change", (event) => {
  if (event.target.matches("[data-task-status]")) {
    updateSharedTaskStatus(event.target.dataset.taskStatus, event.target.value);
  }
});
taskBoard.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-task-card]");
  if (!card || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.taskCard);
  card.classList.add("is-dragging");
});
taskBoard.addEventListener("dragend", (event) => {
  event.target.closest("[data-task-card]")?.classList.remove("is-dragging");
  taskBoard.querySelectorAll(".is-drop-target").forEach((column) => column.classList.remove("is-drop-target"));
});
taskBoard.addEventListener("dragover", (event) => {
  const column = event.target.closest("[data-task-column]");
  if (!column) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  column.classList.add("is-drop-target");
});
taskBoard.addEventListener("dragleave", (event) => {
  const column = event.target.closest("[data-task-column]");
  if (column && !column.contains(event.relatedTarget)) column.classList.remove("is-drop-target");
});
taskBoard.addEventListener("drop", (event) => {
  const column = event.target.closest("[data-task-column]");
  if (!column) return;
  event.preventDefault();
  column.classList.remove("is-drop-target");
  const taskId = event.dataTransfer.getData("text/plain");
  updateSharedTaskStatus(taskId, column.dataset.taskColumn);
});
document.getElementById("newEmployeeDivision").addEventListener("change", updateCustomDivisionField);
document.getElementById("captureFaceButton").addEventListener("click", captureFaceSample);
document.getElementById("adminCameraButton").addEventListener("click", () => adminStream ? stopAdminCamera() : startCamera("admin"));
document.getElementById("employeeCameraButton").addEventListener("click", () => employeeStream ? stopEmployeeCamera() : startCamera("employee"));
document.getElementById("cameraExpandClose").addEventListener("click", closeExpandedCamera);
document.getElementById("scanButton").addEventListener("click", () => performScan(false));
document.getElementById("demoScanButton").addEventListener("click", () => performScan(true));
document.getElementById("requestList").addEventListener("click", handleRequestAction);
document.getElementById("confirmApproveRequest").addEventListener("click", () => {
  const request = requests.find((entry) => entry.id === pendingApprovalRequestId);
  if (!request || request.status !== "Menunggu") {
    approveRequestConfirmDialog.close();
    pendingApprovalRequestId = null;
    return;
  }
  completeRequestDecision(request, "approve");
  approveRequestConfirmDialog.close();
  pendingApprovalRequestId = null;
});
approveRequestConfirmDialog.addEventListener("close", () => {
  pendingApprovalRequestId = null;
});
document.getElementById("leaveForm").addEventListener("submit", submitLeaveRequest);
document.getElementById("leaveFile").addEventListener("change", (event) => setSelectedFile(event.target.files[0]));

document.querySelectorAll(".scan-mode").forEach((button) => button.addEventListener("click", () => setScanType(button.dataset.scanType)));
document.querySelectorAll(".leave-tab").forEach((button) => button.addEventListener("click", () => setLeaveType(button.dataset.leaveType)));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.closeDialog)));

employeeModal.addEventListener("close", stopAdminCamera);
employeeLocationDialog.addEventListener("close", () => {
  activeLocationPolicyEmployee = null;
});
attachmentModal.addEventListener("click", (event) => {
  if (event.target === attachmentModal) attachmentModal.close();
});
attachmentModal.addEventListener("close", () => {
  selectedAttachment = null;
  if (attachmentObjectUrl) URL.revokeObjectURL(attachmentObjectUrl);
  attachmentObjectUrl = null;
  document.getElementById("downloadRequestFile").removeAttribute("href");
});
employeeModal.addEventListener("click", (event) => {
  if (event.target === employeeModal) employeeModal.close();
});

document.querySelectorAll("[data-nav]").forEach((link) => link.addEventListener("click", () => {
  const siblings = link.closest(".nav-group").querySelectorAll(".nav-link");
  siblings.forEach((sibling) => sibling.classList.remove("is-current"));
  link.classList.add("is-current");
  if (link.closest("#adminNavigation")) {
    const showStatistics = link.dataset.nav === "adminStatisticsPage";
    const statisticsPage = document.getElementById("adminStatisticsPage");
    document.getElementById("adminView").classList.toggle("statistics-page-open", showStatistics);
    statisticsPage.classList.toggle("is-hidden", !showStatistics);
    if (showStatistics) renderAdminStatistics();
  }
  closeSidebar();
}));
document.getElementById("statisticsAlpaButton").addEventListener("click", () => {
  document.querySelector('[data-nav="attendance"]').click();
  const today = new Date();
  document.getElementById("yearFilter").value = String(today.getFullYear());
  document.getElementById("monthFilter").value = String(today.getMonth());
  document.getElementById("attendanceStatusFilter").value = "Alpa";
  document.getElementById("employeeSearch").value = "";
  attendancePage = 1;
  renderAttendance();
  document.getElementById("attendanceSection").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("is-open");
  document.getElementById("sidebarScrim").classList.toggle("is-open");
});
document.getElementById("sidebarScrim").addEventListener("click", closeSidebar);
document.querySelector("[data-demo-logout]").addEventListener("click", () => {
  sessionStorage.removeItem("sitenexsDemoRole");
  sessionStorage.removeItem("sitenexsDemoAdminId");
  sessionStorage.removeItem("sitenexsDemoEmployeeEmail");
});
const notificationButton = document.getElementById("notificationButton");
const notificationPopover = document.getElementById("notificationPopover");
notificationButton.addEventListener("click", () => {
  const willOpen = notificationPopover.hidden;
  notificationPopover.hidden = !willOpen;
  notificationButton.setAttribute("aria-expanded", String(willOpen));
});
document.getElementById("notificationList").addEventListener("click", (event) => {
  const link = event.target.closest("[data-notification-id]");
  if (!link) return;
  const selected = notificationItems.find((item) => item.id === link.dataset.notificationId);
  if (selected && !selected.read) {
    saveNotifications(notificationItems.map((item) => item.id === selected.id ? { ...item, read: true } : item));
  }
  notificationPopover.hidden = true;
  notificationButton.setAttribute("aria-expanded", "false");
});
document.getElementById("markNotificationsRead").addEventListener("click", setAllNotificationsRead);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".notification-center") && !notificationPopover.hidden) {
    notificationPopover.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !notificationPopover.hidden) {
    notificationPopover.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
    notificationButton.focus();
  }
});
document.getElementById("helpButton").addEventListener("click", () => showToast("Hubungi support melalui support@sitenexs.com."));
document.getElementById("exportPersonalCsv").addEventListener("click", exportPersonalReport);
document.getElementById("printPersonalReport").addEventListener("click", printPersonalReport);
document.getElementById("personalSummaryPeriod").addEventListener("change", renderPersonalSummary);
["historyStartDate", "historyEndDate", "historyMonthFilter", "historyStatusFilter"].forEach((id) => {
  document.getElementById(id).addEventListener("change", renderPersonalHistory);
});
document.getElementById("overtimeStart").addEventListener("input", updateOvertimeEstimate);
document.getElementById("overtimeEnd").addEventListener("input", updateOvertimeEstimate);
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
  if ([attendanceStorageKey, requestStorageKey, personalHistoryStorageKey].includes(event.key)) {
    try {
      const updatedEntries = event.newValue === null ? [] : JSON.parse(event.newValue);
      if (event.key === attendanceStorageKey) {
        replaceLocalArray(attendanceRecords, updatedEntries);
        renderAttendance();
      } else if (event.key === requestStorageKey) {
        replaceLocalArray(requests, updatedEntries);
        renderRequests();
      } else {
        replaceLocalArray(personalHistory, updatedEntries);
        renderPersonalHistory();
      }
    } catch (error) {
      showToast(`Data ${event.key} tidak dapat diperbarui: ${error.message}`, "error");
    }
  } else if (event.key === workTasksStorageKey) {
    try {
      const previousTasks = new Map(sharedWorkTasks.map((task) => [task.id, task]));
      const updatedTasks = readWorkCollection(workTasksStorageKey);
      const changedTask = updatedTasks.find((task) => {
        const previous = previousTasks.get(task.id);
        return !previous || previous.status !== task.status;
      });
      sharedWorkTasks = updatedTasks;
      renderSharedTasks();
      renderAdminTaskMonitor();
      if (changedTask) {
        addNotification(
          previousTasks.has(changedTask.id) ? "Progres tugas diperbarui" : "Tugas baru dibagikan",
          `${changedTask.title}${changedTask.status ? ` · ${changedTask.status}` : ""}.`,
          "#workActivitySection",
        );
      }
    } catch (error) {
      showToast(`Aktivitas kerja tidak dapat diperbarui: ${error.message}`, "error");
    }
  } else if (event.key === taskActivityStorageKey) {
    try {
      sharedTaskActivities = event.newValue === null ? [] : JSON.parse(event.newValue);
      if (!Array.isArray(sharedTaskActivities)) throw new Error("Riwayat aktivitas bukan daftar yang valid.");
      renderAdminTaskMonitor();
      renderWorkActivities();
    } catch (error) {
      showToast(`Riwayat aktivitas tugas tidak dapat diperbarui: ${error.message}`, "error");
    }
  } else if (event.key === activityJournalStorageKey) {
    try {
      const updatedEntries = event.newValue === null ? [] : JSON.parse(event.newValue);
      replaceLocalArray(activityJournalEntries, updatedEntries);
      renderActivityJournal();
      renderWorkActivities();
    } catch (error) {
      showToast(`Arsip dokumentasi tidak dapat diperbarui: ${error.message}`, "error");
    }
  } else if (event.key === notificationsStorageKey) {
    try {
      notificationItems = readNotifications() || [];
      renderNotifications();
    } catch (error) {
      showToast(`Notifikasi tidak dapat diperbarui: ${error.message}`, "error");
    }
  } else if (event.key === "sitenexsTheme") {
    applyTheme(event.newValue === "dark" ? "dark" : "light");
  }
});

initializeTheme();
initializeNotifications();
window.SiteNexsDemoAccount?.updateProfileDisplays(
  sessionStorage.getItem("sitenexsDemoRole") || "admin",
  sessionStorage.getItem("sitenexsDemoAdminId"),
);
initializeDashboardDate();
renderAttendance();
renderRequests();
renderPersonalHistory();
initializeWorkCollaboration();
initializeActivityJournal();
updateEmployeeTotal();
setLeaveType("Izin");