"use strict";

const demoRoles = ["operator", "admin", "employee"];
const demoRoleLabels = {
  operator: "Operator",
  admin: "Admin",
  employee: "Karyawan",
};
const defaultAccountNames = {
  operator: "Pemilik SiteNexs",
  admin: "Ayu Ramadhani",
  employee: "Ayu Ramadhani",
};
const passwordStorageKey = "sitenexsDemoPassword";
const adminPasswordStoragePrefix = "sitenexsDemoPassword:admin:";
const passwordIterations = 120000;

function getDemoRole() {
  const sessionRole = sessionStorage.getItem("sitenexsDemoRole");
  if (demoRoles.includes(sessionRole)) return sessionRole;
  return "admin";
}

function getSettingsContext() {
  const role = getDemoRole();
  const adminId = sessionStorage.getItem("sitenexsDemoAdminId") || "raka-aditya";
  return { role, adminId };
}

function getAccountKey(role, adminId = sessionStorage.getItem("sitenexsDemoAdminId")) {
  const employeeEmail = sessionStorage.getItem("sitenexsDemoEmployeeEmail");
  if (employeeEmail && role === "employee") return `employee:${employeeEmail}`;
  if (employeeEmail && role === "admin") {
    const employee = window.SiteNexsDirectory?.getEmployees().find((entry) => entry.email === employeeEmail);
    if (employee?.accountRole === "admin") return `admin-employee:${employeeEmail}`;
  }
  if (role === "admin") {
    return `admin:${adminId || "raka-aditya"}`;
  }
  return role;
}

function getAccountName(role, adminId) {
  const accountKey = getAccountKey(role, adminId);
  const nameKey = `sitenexsDemoName:${accountKey}`;
  const savedName = localStorage.getItem(nameKey);
  const loggedInEmployeeEmail = sessionStorage.getItem("sitenexsDemoEmployeeEmail");
  if (loggedInEmployeeEmail && window.SiteNexsDirectory) {
    const employee = window.SiteNexsDirectory.getEmployees().find((entry) => entry.email === loggedInEmployeeEmail);
    if (employee && (role === "employee" || employee.accountRole === "admin")) return savedName || employee.name;
  }
  if (role === "admin" && (adminId || sessionStorage.getItem("sitenexsDemoAdminId") || "raka-aditya") === "raka-aditya" && savedName === "Raka Aditya") {
    localStorage.setItem(nameKey, "Ayu Ramadhani");
    return "Ayu Ramadhani";
  }
  if (savedName) return savedName;
  if (role === "admin" && window.SiteNexsDirectory) {
    return window.SiteNexsDirectory.getAdmins().find((admin) => admin.id === (adminId || sessionStorage.getItem("sitenexsDemoAdminId")))?.name
      || defaultAccountNames.admin;
  }
  return defaultAccountNames[role];
}

function getAccountPhoto(role, adminId) {
  return localStorage.getItem(`sitenexsDemoPhoto:${getAccountKey(role, adminId)}`) || "";
}

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function updateProfileDisplays(role, adminId) {
  const name = getAccountName(role, adminId);
  const photo = getAccountPhoto(role, adminId);
  document.querySelectorAll("[data-account-name]").forEach((element) => {
    element.textContent = name;
  });
  document.querySelectorAll("[data-account-avatar]").forEach((avatar) => {
    const image = avatar.querySelector("img");
    const initials = avatar.querySelector("[data-avatar-initials]");
    if (image && initials) {
      image.hidden = !photo;
      image.src = photo;
      initials.hidden = Boolean(photo);
      initials.textContent = initialsFor(name);
    } else {
      avatar.textContent = initialsFor(name);
    }
  });
  document.querySelectorAll("[data-account-role]").forEach((element) => {
    element.textContent = demoRoleLabels[role];
  });
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt,
    iterations: passwordIterations,
  }, key, 256);
  return bytesToHex(bits);
}

function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error("Data password demo di browser rusak.");
  return new Uint8Array(hex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
}

async function verifyDemoPassword(password, adminId = getSettingsContext().adminId) {
  const scopedPasswordKey = `${adminPasswordStoragePrefix}${adminId || "raka-aditya"}`;
  const storedPassword = localStorage.getItem(scopedPasswordKey)
    || ((adminId || "raka-aditya") === "raka-aditya" ? localStorage.getItem(passwordStorageKey) : null);
  if (!storedPassword) return password === "admin123";

  const stored = JSON.parse(storedPassword);
  const actualHash = await hashPassword(password, hexToBytes(stored.salt));
  return actualHash === stored.hash;
}

async function saveDemoPassword(password, adminId = getSettingsContext().adminId) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  localStorage.setItem(`${adminPasswordStoragePrefix}${adminId || "raka-aditya"}`, JSON.stringify({
    salt: bytesToHex(salt),
    hash,
  }));
}

window.SiteNexsDemoAccount = {
  getAccountName,
  getAccountPhoto,
  getDemoRole,
  saveDemoPassword,
  updateProfileDisplays,
  verifyDemoPassword,
};

updateProfileDisplays(getDemoRole(), getSettingsContext().adminId);
const passwordHint = document.querySelector("[data-demo-password-hint]");
if (passwordHint && localStorage.getItem(passwordStorageKey)) {
  passwordHint.textContent = "Sudah diubah melalui Pengaturan akun";
}

const dialog = document.getElementById("accountSettingsDialog");
if (dialog) {
  const form = dialog.querySelector("[data-account-settings-form]");
  const status = form.querySelector("[data-settings-status]");
  const photoInput = form.elements.profilePhoto;
  const preview = dialog.querySelector("[data-profile-preview]");
  const initials = dialog.querySelector("[data-profile-initials]");
  let pendingPhoto = "";

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
    status.classList.toggle("is-success", !isError && Boolean(message));
  }

  function renderPhoto(photo, name) {
    preview.hidden = !photo;
    preview.src = photo;
    initials.hidden = Boolean(photo);
    initials.textContent = initialsFor(name);
  }

  function openSettings() {
    const context = getSettingsContext();
    const name = getAccountName(context.role, context.adminId);
    form.elements.accountName.value = name;
    form.elements.currentPassword.value = "";
    form.elements.newPassword.value = "";
    form.elements.confirmPassword.value = "";
    photoInput.value = "";
    pendingPhoto = "";
    renderPhoto(getAccountPhoto(context.role, context.adminId), name);
    dialog.querySelector("[data-settings-account-label]").textContent = name;
    setStatus("");
    dialog.showModal();
  }

  document.querySelectorAll("[data-open-account-settings]").forEach((button) => {
    button.addEventListener("click", openSettings);
  });

  dialog.querySelectorAll("[data-close-settings]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.elements.accountName.addEventListener("input", () => {
    const context = getSettingsContext();
    const fallbackName = getAccountName(context.role, context.adminId);
    dialog.querySelector("[data-settings-account-label]").textContent = form.elements.accountName.value.trim() || fallbackName;
    renderPhoto(pendingPhoto || getAccountPhoto(context.role, context.adminId), form.elements.accountName.value.trim() || fallbackName);
  });

  photoInput.addEventListener("change", () => {
    const [file] = photoInput.files;
    if (!file) {
      pendingPhoto = "";
      const context = getSettingsContext();
      renderPhoto(getAccountPhoto(context.role, context.adminId), form.elements.accountName.value.trim() || getAccountName(context.role, context.adminId));
      return;
    }
    if (!file.type.startsWith("image/")) {
      photoInput.value = "";
      setStatus("Pilih file gambar untuk foto profil.", true);
      return;
    }
    if (file.size > 1024 * 1024) {
      photoInput.value = "";
      setStatus("Ukuran foto maksimal 1 MB.", true);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        setStatus("Foto tidak dapat dibaca. Coba pilih file lain.", true);
        return;
      }
      pendingPhoto = reader.result;
      renderPhoto(pendingPhoto, form.elements.accountName.value.trim() || getAccountName(getSettingsContext().role, getSettingsContext().adminId));
      setStatus("");
    });
    reader.addEventListener("error", () => setStatus("Foto tidak dapat dibaca. Coba pilih file lain.", true));
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");
    const name = form.elements.accountName.value.trim();
    const currentPassword = form.elements.currentPassword.value;
    const newPassword = form.elements.newPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;

    if (!name) {
      setStatus("Nama akun wajib diisi.", true);
      return;
    }
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setStatus("Isi password saat ini, password baru, dan konfirmasi password.", true);
        return;
      }
      if (newPassword.length < 8) {
        setStatus("Password baru minimal 8 karakter.", true);
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatus("Konfirmasi password baru tidak cocok.", true);
        return;
      }
      try {
        const context = getSettingsContext();
        if (!(await verifyDemoPassword(currentPassword, context.adminId))) {
          setStatus("Password saat ini tidak sesuai.", true);
          return;
        }
        await saveDemoPassword(newPassword, context.adminId);
      } catch (error) {
        setStatus(`Password tidak dapat disimpan: ${error.message}`, true);
        return;
      }
    }

    try {
      const context = getSettingsContext();
      const accountKey = getAccountKey(context.role, context.adminId);
      localStorage.setItem(`sitenexsDemoName:${accountKey}`, name);
      if (pendingPhoto) localStorage.setItem(`sitenexsDemoPhoto:${accountKey}`, pendingPhoto);
    } catch (error) {
      setStatus(`Pengaturan tidak dapat disimpan di browser: ${error.message}`, true);
      return;
    }

    const context = getSettingsContext();
    updateProfileDisplays(context.role, context.adminId);
    setStatus("Pengaturan akun berhasil disimpan di perangkat ini.");
    form.elements.currentPassword.value = "";
    form.elements.newPassword.value = "";
    form.elements.confirmPassword.value = "";
    pendingPhoto = "";
  });

}
