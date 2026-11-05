"use strict";

const employeeStorageKey = "sitenexsWorkspaceEmployees";
const employeeOverridesStorageKey = "sitenexsWorkspaceEmployeeOverridesByEmail";
const deletedEmployeesStorageKey = "sitenexsWorkspaceDeletedEmployeeEmails";
const adminStorageKey = "sitenexsWorkspaceAdmins";
const legacyEmployeeEmailById = new Map();
const employeePasswordIterations = 120000;
const defaultAdmins = [
  { id: "raka-aditya", name: "Ayu Ramadhani", email: "admin@gmail.com" },
  { id: "rusdi", name: "Rusdi", email: "rusdi@gmail.com" },
];
const defaultEmployees = [
  { name: "Ayu Ramadhani", email: "ayu.ramadhani@example.com", role: "Product Designer", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Bima Pratama", email: "bima.pratama@example.com", role: "Frontend Engineer", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Citra Maharani", email: "citra.maharani@example.com", role: "People Operations", status: "Izin", ownerAdminId: "raka-aditya" },
  { name: "Dimas Saputra", email: "dimas.saputra@example.com", role: "Backend Engineer", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Elisa Putri", email: "elisa.putri@example.com", role: "Marketing Specialist", status: "Sakit", ownerAdminId: "raka-aditya" },
  { name: "Farhan Akbar", email: "farhan.akbar@example.com", role: "Finance Analyst", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Gita Anindya", email: "gita.anindya@example.com", role: "UX Researcher", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Hafiz Maulana", email: "hafiz.maulana@example.com", role: "Operations Lead", status: "Izin", ownerAdminId: "raka-aditya" },
  { name: "Naya Putri", email: "naya.putri@example.com", role: "People Operations", status: "Sakit", ownerAdminId: "raka-aditya" },
];

function readStoredArray(key, fallback) {
  const serialized = localStorage.getItem(key);
  if (!serialized) return fallback.map((entry) => ({ ...entry }));
  const value = JSON.parse(serialized);
  if (!Array.isArray(value)) throw new Error("Data workspace lokal tidak valid.");
  return value;
}

const legacyIdentityField = ["ni", "p"].join("");
const legacySessionKey = "sitenexsDemoEmployee" + "Nip";
const normalizedSessionKey = "sitenexsDemoEmployeeEmail";

function getAdmins() {
  const admins = defaultAdmins.map((admin) => ({ ...admin }));
  const storedAdmins = readStoredArray(adminStorageKey, []);
  storedAdmins.forEach((storedAdmin) => {
    const admin = {
      ...storedAdmin,
      id: storedAdmin.id || storedAdmin.email.trim().toLowerCase(),
    };
    const existing = admins.find((entry) =>
      entry.id === admin.id
      || entry.email.trim().toLowerCase() === admin.email.trim().toLowerCase()
      || entry.name.trim().toLowerCase() === admin.name.trim().toLowerCase(),
    );
    if (!existing) admins.push(admin);
  });
  return admins.map((admin) => {
    const nameKey = `sitenexsDemoName:admin:${admin.id}`;
    const savedName = localStorage.getItem(nameKey);
    if (admin.id === "raka-aditya" && savedName === "Raka Aditya") {
      localStorage.setItem(nameKey, "Ayu Ramadhani");
    }
    return {
      ...admin,
      name: admin.id === "raka-aditya" && savedName === "Raka Aditya"
        ? "Ayu Ramadhani"
        : savedName || admin.name,
    };
  });
}

function getAddedEmployees() {
  const admins = getAdmins();
  const defaultOwnerId = admins[0]?.id;
  const ownerAliases = new Map();
  readStoredArray(adminStorageKey, []).forEach((storedAdmin) => {
    const storedId = storedAdmin.id || storedAdmin.email.trim().toLowerCase();
    const seededMatch = defaultAdmins.find((admin) => admin.name.trim().toLowerCase() === storedAdmin.name.trim().toLowerCase());
    const matchingAdmin = admins.find((admin) =>
      admin.id === storedId || admin.id === seededMatch?.id || admin.name.trim().toLowerCase() === storedAdmin.name.trim().toLowerCase(),
    );
    if (matchingAdmin) ownerAliases.set(storedId, matchingAdmin.id);
  });
  const savedEmployees = readStoredArray(employeeStorageKey, []);
  const employees = savedEmployees.map((employee) => {
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email || "");
    const email = hasValidEmail
      ? employee.email.trim().toLowerCase()
      : `${employee.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")}@example.com`;
    if (employee[legacyIdentityField]) legacyEmployeeEmailById.set(employee[legacyIdentityField], email);
    const employeeWithoutLegacyId = { ...employee };
    Object.keys(employeeWithoutLegacyId).forEach((key) => {
      if (key.toLowerCase() === legacyIdentityField || /nik/i.test(key)) delete employeeWithoutLegacyId[key];
    });
    return {
      ...employeeWithoutLegacyId,
      email,
      ...(!hasValidEmail ? { credentials: undefined } : {}),
      ownerAdminId: ownerAliases.get(employee.ownerAdminId) || employee.ownerAdminId || defaultOwnerId,
      accountRole: employee.accountRole === "admin" ? "admin" : "employee",
      employmentStatus: employee.employmentStatus === "inactive" ? "inactive" : "active",
    };
  });
  if (JSON.stringify(savedEmployees) !== JSON.stringify(employees)) {
    localStorage.setItem(employeeStorageKey, JSON.stringify(employees));
  }
  return employees;
}

function getEmployees() {
  getAddedEmployees();
  localStorage.removeItem("sitenexsWorkspaceEmployeeOverrides");
  localStorage.removeItem("sitenexsWorkspaceDeletedEmployees");
  const overrides = JSON.parse(localStorage.getItem(employeeOverridesStorageKey) || "{}");
  const deletedEmails = new Set(JSON.parse(localStorage.getItem(deletedEmployeesStorageKey) || "[]"));
  const seededEmployees = defaultEmployees
    .filter((employee) => !deletedEmails.has(employee.email))
    .map((employee) => ({ ...employee, employmentStatus: "active", ...(overrides[employee.email] || {}) }));
  return [...seededEmployees, ...getAddedEmployees().filter((employee) => !deletedEmails.has(employee.email))];
}

function getEmployeeEmailByLegacyId(id) {
  if (!id) return "";
  const storedEmployee = readStoredArray(employeeStorageKey, []).find((employee) => employee[legacyIdentityField] === id);
  if (storedEmployee?.email?.includes("@")) return storedEmployee.email.trim().toLowerCase();
  const displayName = localStorage.getItem(`sitenexsDemoName:employee:${id}`);
  const employee = getEmployees().find((entry) => entry.name === displayName);
  return employee?.email || legacyEmployeeEmailById.get(id) || "";
}

function migrateLegacyEmployeeIdentifiers() {
  const employees = getEmployees();
  const emailByName = new Map(employees.map((employee) => [employee.name, employee.email]));
  const idByEmail = new Map(legacyEmployeeEmailById);
  const keys = Object.keys(localStorage);
  const parsed = new Map();
  keys.forEach((key) => {
    try {
      parsed.set(key, JSON.parse(localStorage.getItem(key)));
    } catch {
      return;
    }
  });

  const findEmail = (id, name) => emailByName.get(name) || idByEmail.get(id) || getEmployeeEmailByLegacyId(id);
  const collect = (value) => {
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (!value || typeof value !== "object") return;
    const id = value[legacyIdentityField]
      || value[["employee", "Nip"].join("")]
      || value[["assignee", "Nip"].join("")]
      || value[["actor", "Nip"].join("")];
    const email = findEmail(id, value.name || value.employeeName || value.assigneeName);
    if (id && email && !idByEmail.has(id)) idByEmail.set(id, email);
    Object.values(value).forEach(collect);
  };
  parsed.forEach(collect);
  parsed.forEach(collect);

  const sanitize = (value, name = "") => {
    if (Array.isArray(value)) return value.map((entry) => sanitize(entry, name));
    if (!value || typeof value !== "object") return value;
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      const email = findEmail(entry, value.name || value.employeeName || value.assigneeName);
      if (/nik/i.test(key)) continue;
      if (key.toLowerCase() === legacyIdentityField) {
        if (email) output.email = email;
        continue;
      }
      if (["employee", "assignee", "actor"].some((prefix) => key.toLowerCase() === `${prefix}nip`)) {
        const normalizedKey = `${key.slice(0, -3)}Email`;
        if (email) output[normalizedKey] = email;
        continue;
      }
      const sanitizedEntry = sanitize(entry, value.name || name);
      if (key === "employeePolicies" && sanitizedEntry && typeof sanitizedEntry === "object") {
        output[key] = Object.fromEntries(Object.entries(sanitizedEntry).map(([policyKey, policyValue]) => [
          idByEmail.get(policyKey) || policyKey,
          policyValue,
        ]));
      } else {
        output[key] = sanitizedEntry;
      }
    }
    return output;
  };

  localStorage.removeItem("sitenexsWorkspaceEmployeeOverrides");
  localStorage.removeItem("sitenexsWorkspaceDeletedEmployees");
  keys.forEach((key) => {
    if (!localStorage.getItem(key)) return;
    const personalHistoryPrefix = "sitenexsPersonalAttendance:";
    const profileKeyPrefixes = ["sitenexsDemoName:employee:", "sitenexsDemoPhoto:employee:"];
    let targetKey = key;
    if (key.startsWith(personalHistoryPrefix) && !key.slice(personalHistoryPrefix.length).includes("@")) {
      const email = findEmail(key.slice(personalHistoryPrefix.length), "");
      targetKey = email ? `${personalHistoryPrefix}${email}` : "";
    }
    const profilePrefix = profileKeyPrefixes.find((prefix) => key.startsWith(prefix));
    if (profilePrefix && !key.slice(profilePrefix.length).includes("@")) {
      const email = findEmail(key.slice(profilePrefix.length), "");
      targetKey = email ? `${profilePrefix}${email}` : "";
    }
    const value = parsed.get(key);
    if (targetKey && value !== undefined) {
      const sanitized = sanitize(value);
      try {
        localStorage.setItem(targetKey, JSON.stringify(sanitized));
      } catch (error) {
        throw new Error(`Data akun lama tidak dapat diperbarui: ${error.message}`);
      }
    }
    if (!targetKey || targetKey !== key) localStorage.removeItem(key);
  });

  const sessionId = sessionStorage.getItem(legacySessionKey);
  if (sessionId) {
    const email = findEmail(sessionId, "");
    if (email) sessionStorage.setItem(normalizedSessionKey, email);
    sessionStorage.removeItem(legacySessionKey);
  }
}

function getEmployeesForAdmin(adminId) {
  return getEmployees().filter((employee) => employee.ownerAdminId === adminId);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error("Data password akun tidak valid.");
  return new Uint8Array(hex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
}

async function hashEmployeePassword(password, salt, iterations = employeePasswordIterations) {
  if (!window.crypto?.subtle) throw new Error("Browser tidak mendukung penyimpanan password aman. Buka situs melalui HTTPS atau localhost.");
  const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt,
    iterations,
  }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

async function createEmployeeCredential(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password akun harus berisi minimal 8 karakter.");
  }
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return {
    salt: bytesToHex(salt),
    hash: await hashEmployeePassword(password, salt),
    iterations: employeePasswordIterations,
  };
}

async function authenticateEmployee(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const employee = getAddedEmployees().find((entry) =>
    entry.email?.trim().toLowerCase() === normalizedIdentifier,
  );
  if (!employee?.credentials || employee.employmentStatus === "inactive" || typeof password !== "string") return null;
  const iterations = employee.credentials.iterations;
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 1000000) {
    throw new Error("Data password akun tidak valid. Hubungi admin workspace.");
  }
  const actualHash = await hashEmployeePassword(password, hexToBytes(employee.credentials.salt), iterations);
  if (actualHash !== employee.credentials.hash) return null;
  return {
    name: employee.name,
    email: employee.email,
    role: employee.role,
    ownerAdminId: employee.ownerAdminId,
    accountRole: employee.accountRole,
  };
}

function findEmployeeByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return getAddedEmployees().find((employee) => employee.email?.trim().toLowerCase() === normalizedEmail) || null;
}

async function updateEmployeePassword(email, password) {
  const employee = findEmployeeByEmail(email);
  if (!employee) throw new Error("Akun dengan email tersebut tidak ditemukan.");
  const credentials = await createEmployeeCredential(password);
  const updatedEmployees = getAddedEmployees().map((entry) => (
    entry.email === employee.email ? { ...entry, credentials } : entry
  ));
  localStorage.setItem(employeeStorageKey, JSON.stringify(updatedEmployees));
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
}

function addEmployee(employee) {
  const normalizedEmail = employee.email?.trim().toLowerCase() || "";
  if (!normalizedEmail) throw new Error("Email login wajib diisi.");
  const admins = getAdmins();
  if (!admins.some((admin) => admin.id === employee.ownerAdminId)) {
    throw new Error("Pilih admin pemilik karyawan dari daftar.");
  }
  const employees = getEmployees();
  if (employees.some((entry) => entry.email?.trim().toLowerCase() === normalizedEmail)
    || admins.some((admin) => admin.email.trim().toLowerCase() === normalizedEmail)) {
    throw new Error("Email tersebut sudah digunakan akun lain.");
  }
  if (!employee.credentials?.salt || !employee.credentials?.hash) {
    throw new Error("Password akun belum dibuat dengan aman.");
  }
  if (typeof employee.faceSample !== "string" || !employee.faceSample.startsWith("data:image/jpeg;base64,")) {
    throw new Error("Foto sampel wajah wajib direkam sebelum akun karyawan dibuat.");
  }
  const employeeWithoutLegacyId = { ...employee };
  delete employeeWithoutLegacyId[legacyIdentityField];
  const addedEmployees = [...getAddedEmployees(), {
    ...employeeWithoutLegacyId,
    email: normalizedEmail,
    accountRole: employee.accountRole === "admin" ? "admin" : "employee",
  }];
  localStorage.setItem(employeeStorageKey, JSON.stringify(addedEmployees));
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
  return employee;
}

function updateEmployee(email, updates) {
  const employee = getEmployees().find((entry) => entry.email === email);
  if (!employee) throw new Error("Karyawan tidak ditemukan.");
  const admins = getAdmins();
  if (!admins.some((admin) => admin.id === updates.ownerAdminId)) {
    throw new Error("Pilih admin pemilik karyawan dari daftar.");
  }
  const normalizedEmail = updates.email?.trim().toLowerCase() || "";
  if (!normalizedEmail) throw new Error("Email login wajib diisi.");
  const duplicateEmail = getEmployees().some((entry) =>
    entry.email !== email && entry.email?.trim().toLowerCase() === normalizedEmail,
  ) || admins.some((admin) => admin.email.trim().toLowerCase() === normalizedEmail);
  if (normalizedEmail && duplicateEmail) throw new Error("Email tersebut sudah digunakan akun lain.");

  const updatedFields = {
    name: updates.name.trim(),
    email: normalizedEmail,
    role: updates.role.trim(),
    ownerAdminId: updates.ownerAdminId,
    accountRole: updates.accountRole === "admin" ? "admin" : "employee",
  };
  const addedEmployees = getAddedEmployees();
  if (addedEmployees.some((entry) => entry.email === email)) {
    localStorage.setItem(employeeStorageKey, JSON.stringify(addedEmployees.map((entry) => (
      entry.email === email ? { ...entry, ...updatedFields } : entry
    ))));
  } else {
    const overrides = JSON.parse(localStorage.getItem(employeeOverridesStorageKey) || "{}");
    overrides[email] = { ...(overrides[email] || {}), ...updatedFields };
    localStorage.setItem(employeeOverridesStorageKey, JSON.stringify(overrides));
  }
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
  return { ...employee, ...updatedFields };
}

function setEmployeeActive(email, active) {
  const employee = getEmployees().find((entry) => entry.email === email);
  if (!employee) throw new Error("Karyawan tidak ditemukan.");
  const employmentStatus = active ? "active" : "inactive";
  const addedEmployees = getAddedEmployees();
  if (addedEmployees.some((entry) => entry.email === email)) {
    localStorage.setItem(employeeStorageKey, JSON.stringify(addedEmployees.map((entry) => (
      entry.email === email ? { ...entry, employmentStatus } : entry
    ))));
  } else if (defaultEmployees.some((entry) => entry.email === email)) {
    const overrides = JSON.parse(localStorage.getItem(employeeOverridesStorageKey) || "{}");
    overrides[email] = { ...(overrides[email] || {}), employmentStatus };
    localStorage.setItem(employeeOverridesStorageKey, JSON.stringify(overrides));
  } else {
    throw new Error("Karyawan tidak ditemukan.");
  }
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
  return { ...employee, employmentStatus };
}

function deleteEmployee(email) {
  const addedEmployees = getAddedEmployees();
  if (addedEmployees.some((employee) => employee.email === email)) {
    localStorage.setItem(employeeStorageKey, JSON.stringify(addedEmployees.filter((employee) => employee.email !== email)));
  } else if (defaultEmployees.some((employee) => employee.email === email)) {
    const deletedEmails = new Set(JSON.parse(localStorage.getItem(deletedEmployeesStorageKey) || "[]"));
    deletedEmails.add(email);
    localStorage.setItem(deletedEmployeesStorageKey, JSON.stringify([...deletedEmails]));
    const overrides = JSON.parse(localStorage.getItem(employeeOverridesStorageKey) || "{}");
    delete overrides[email];
    localStorage.setItem(employeeOverridesStorageKey, JSON.stringify(overrides));
  } else {
    throw new Error("Karyawan tidak ditemukan.");
  }
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
}

function addAdmin(admin) {
  const admins = getAdmins();
  if (admins.some((entry) => entry.email.trim().toLowerCase() === admin.email.trim().toLowerCase())) {
    throw new Error("Email admin tersebut sudah terdaftar.");
  }
  const storedAdmins = readStoredArray(adminStorageKey, []);
  storedAdmins.push({ ...admin, id: admin.email.trim().toLowerCase() });
  localStorage.setItem(adminStorageKey, JSON.stringify(storedAdmins));
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
  return admin;
}

function appendEmployeeForm(form, admins) {
  const ownerSelect = form.elements.employeeOwner;
  if (!ownerSelect) return;
  const previousValue = ownerSelect.value;
  ownerSelect.replaceChildren(new Option("Pilih admin pemilik", ""));
  admins.forEach((admin) => ownerSelect.add(new Option(admin.name, admin.id)));
  if (admins.some((admin) => admin.id === previousValue)) {
    ownerSelect.value = previousValue;
  } else if (admins.length === 1) {
    ownerSelect.value = admins[0]?.id || "";
  }
  ownerSelect.disabled = false;
}

function renderDirectory() {
  try {
    const employees = getEmployees();
    const admins = getAdmins();
    const currentAdminId = sessionStorage.getItem("sitenexsDemoAdminId") || admins[0]?.id;

    document.querySelectorAll("[data-employee-count]").forEach((count) => {
      count.textContent = String(
        count.dataset.employeeCount === "admin"
          ? getEmployeesForAdmin(currentAdminId).length
          : employees.length,
      );
    });
    document.querySelectorAll("[data-attendance-count]").forEach((count) => {
      count.textContent = String(getEmployeesForAdmin(currentAdminId).filter((employee) => employee.status === "Hadir").length);
    });
    document.querySelectorAll("[data-leave-count]").forEach((count) => {
      count.textContent = String(getEmployeesForAdmin(currentAdminId).filter((employee) => employee.status === "Izin" || employee.status === "Sakit").length);
    });
    document.querySelectorAll("[data-admin-count]").forEach((count) => {
      count.textContent = String(admins.length);
    });
    document.querySelectorAll("[data-admin-workspaces]").forEach((container) => {
      container.replaceChildren();
      admins.forEach((admin, index) => {
        const card = document.createElement("article");
        card.className = `workspace-admin-card${index === 0 ? " is-primary" : ""}`;
        card.dataset.adminCard = admin.id;
        const heading = document.createElement("div");
        heading.className = "workspace-admin-heading";
        const headingText = document.createElement("div");
        const name = document.createElement("h3");
        name.textContent = admin.name;
        const meta = document.createElement("p");
        meta.textContent = `Pemilik perusahaan · ${getEmployeesForAdmin(admin.id).length} karyawan`;
        headingText.append(name, meta);
        const count = document.createElement("strong");
        count.className = "workspace-admin-count";
        count.textContent = String(getEmployeesForAdmin(admin.id).length);
        heading.append(headingText, count);
        const employeeList = document.createElement("ul");
        employeeList.className = "auth-account-list";
        getEmployeesForAdmin(admin.id).forEach((employee) => {
          appendDirectoryAccount(employeeList, employee.name, `${employee.email} · ${employee.role}`, "Aktif");
        });
        if (!employeeList.children.length) {
          const empty = document.createElement("li");
          empty.className = "workspace-empty-state";
          empty.textContent = "Belum ada karyawan untuk admin ini.";
          employeeList.append(empty);
        }
        card.append(heading, employeeList);
        container.append(card);
      });
    });

    document.querySelectorAll("[data-admin-directory]").forEach((list) => {
      list.replaceChildren();
      const visibleAdmins = list.dataset.adminDirectory === "current"
        ? admins.filter((admin) => admin.id === currentAdminId)
        : admins;
      visibleAdmins.forEach((admin) => {
        appendDirectoryAccount(list, admin.name, `Pemilik perusahaan · ${admin.email}`, "Admin");
      });
    });

    document.querySelectorAll("[data-employee-directory]").forEach((list) => {
      list.replaceChildren();
      const scopedAdminId = list.dataset.employeeDirectory === "current" ? currentAdminId : null;
      const visibleEmployees = scopedAdminId ? getEmployeesForAdmin(scopedAdminId) : employees;
      visibleEmployees.forEach((employee) => {
        appendDirectoryAccount(
          list,
          employee.name,
          `${employee.email} · ${employee.role}`,
          employee.employmentStatus === "inactive"
            ? "Nonaktif"
            : employee.accountRole === "admin" ? "Admin" : "Karyawan",
        );
      });
      if (!visibleEmployees.length) {
        const empty = document.createElement("li");
        empty.className = "workspace-empty-state";
        empty.textContent = "Belum ada karyawan yang terdaftar untuk admin ini.";
        list.append(empty);
      }
    });

    document.querySelectorAll("[data-admin-selector]").forEach((select) => {
      const selectedAdminId = select.value || currentAdminId;
      select.replaceChildren(new Option("Pilih admin", ""));
      admins.forEach((admin) => select.add(new Option(admin.name, admin.id)));
      select.value = admins.some((admin) => admin.id === selectedAdminId) ? selectedAdminId : "";
    });
    document.querySelectorAll("[data-add-employee-form]").forEach((form) => appendEmployeeForm(form, admins));
  } catch (error) {
    document.querySelectorAll("[data-directory-status]").forEach((status) => {
      status.textContent = `Data workspace tidak dapat ditampilkan: ${error.message}`;
      status.classList.add("is-error");
    });
  }
}

function bindEmployeeForm(form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-directory-status]");
    const employee = {
      name: form.elements.employeeName.value.trim(),
      email: form.elements.employeeId.value.trim(),
      role: form.elements.employeePosition.value.trim(),
      ownerAdminId: form.elements.employeeOwner.value,
      status: "Hadir",
    };
    if (!employee.name || !employee.email || !employee.role || !employee.ownerAdminId) {
      status.textContent = "Lengkapi nama, ID, jabatan, dan admin pemilik karyawan.";
      status.classList.add("is-error");
      return;
    }
    try {
      addEmployee(employee);
      form.reset();
      status.textContent = `${employee.name} berhasil ditambahkan ke daftar ${getAdmins().find((admin) => admin.id === employee.ownerAdminId).name}.`;
      status.classList.remove("is-error");
      status.classList.add("is-success");
      renderDirectory();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-error");
    }
  });
}

document.querySelectorAll("[data-add-employee-form]").forEach(bindEmployeeForm);

document.querySelectorAll("[data-add-admin-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-directory-status]");
    const admin = {
      name: form.elements.adminName.value.trim(),
      email: form.elements.adminEmail.value.trim().toLowerCase(),
    };
    if (!admin.name || !admin.email) {
      status.textContent = "Lengkapi nama dan email admin.";
      status.classList.add("is-error");
      return;
    }
    try {
      addAdmin(admin);
      form.reset();
      status.textContent = `${admin.name} berhasil ditambahkan ke daftar admin demo.`;
      status.classList.remove("is-error");
      status.classList.add("is-success");
      renderDirectory();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-error");
    }
  });
});

document.querySelectorAll("[data-admin-selector]").forEach((select) => {
  select.addEventListener("change", () => {
    const container = select.closest("[data-admin-workspace-panel]");
    if (!container) return;
    container.querySelectorAll("[data-admin-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.adminCard === select.value);
    });
  });
});

window.addEventListener("storage", (event) => {
  if ([employeeStorageKey, adminStorageKey].includes(event.key)) renderDirectory();
});
window.addEventListener("sitenexs:directory-updated", renderDirectory);
document.querySelectorAll("[data-scroll-admins]").forEach((button) => {
  button.addEventListener("click", () => {
    const slider = document.querySelector("[data-admin-workspaces]");
    slider?.scrollBy({
      left: Number(button.dataset.scrollAdmins) * (slider.clientWidth * 0.8),
      behavior: "smooth",
    });
  });
});
window.SiteNexsDirectory = {
  addEmployee,
  addAdmin,
  authenticateEmployee,
  createEmployeeCredential,
  deleteEmployee,
  findEmployeeByEmail,
  getAddedEmployees,
  getAdmins,
  getEmployees,
  getEmployeesForAdmin,
  getEmployeeEmailByLegacyId,
  updateEmployee,
  setEmployeeActive,
  updateEmployeePassword,
  renderDirectory,
};
try {
  migrateLegacyEmployeeIdentifiers();
} catch (error) {
  document.querySelectorAll("[data-directory-status]").forEach((status) => {
    status.textContent = `Data akun lama belum dapat dibersihkan: ${error.message}`;
    status.classList.add("is-error");
  });
}
renderDirectory();
