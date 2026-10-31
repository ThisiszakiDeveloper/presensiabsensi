"use strict";

const employeeStorageKey = "sitenexsWorkspaceEmployees";
const adminStorageKey = "sitenexsWorkspaceAdmins";
const defaultAdmins = [
  { id: "raka-aditya", name: "Raka Aditya", email: "admin@gmail.com" },
  { id: "rusdi", name: "Rusdi", email: "rusdi@gmail.com" },
];
const defaultEmployees = [
  { name: "Ayu Ramadhani", nip: "SNX-2023-014", role: "Product Designer", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Bima Pratama", nip: "SNX-2022-006", role: "Frontend Engineer", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Citra Maharani", nip: "SNX-2024-021", role: "People Operations", status: "Izin", ownerAdminId: "raka-aditya" },
  { name: "Dimas Saputra", nip: "SNX-2021-002", role: "Backend Engineer", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Elisa Putri", nip: "SNX-2023-018", role: "Marketing Specialist", status: "Sakit", ownerAdminId: "raka-aditya" },
  { name: "Farhan Akbar", nip: "SNX-2022-011", role: "Finance Analyst", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Gita Anindya", nip: "SNX-2024-033", role: "UX Researcher", status: "Hadir", ownerAdminId: "raka-aditya" },
  { name: "Hafiz Maulana", nip: "SNX-2021-009", role: "Operations Lead", status: "Izin", ownerAdminId: "raka-aditya" },
  { name: "Naya Putri", nip: "SNX-2024-040", role: "People Operations", status: "Sakit", ownerAdminId: "raka-aditya" },
];

function readStoredArray(key, fallback) {
  const serialized = localStorage.getItem(key);
  if (!serialized) return fallback.map((entry) => ({ ...entry }));
  const value = JSON.parse(serialized);
  if (!Array.isArray(value)) throw new Error("Data workspace lokal tidak valid.");
  return value;
}

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
  return admins.map((admin) => ({
    ...admin,
    name: localStorage.getItem(`sitenexsDemoName:admin:${admin.id}`) || admin.name,
  }));
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
  return readStoredArray(employeeStorageKey, []).map((employee) => ({
    ...employee,
    ownerAdminId: ownerAliases.get(employee.ownerAdminId) || employee.ownerAdminId || defaultOwnerId,
  }));
}

function getEmployees() {
  return [...defaultEmployees, ...getAddedEmployees()];
}

function getEmployeesForAdmin(adminId) {
  return getEmployees().filter((employee) => employee.ownerAdminId === adminId);
}

function addEmployee(employee) {
  const admins = getAdmins();
  if (!admins.some((admin) => admin.id === employee.ownerAdminId)) {
    throw new Error("Pilih admin pemilik karyawan dari daftar.");
  }
  const employees = getEmployees();
  if (employees.some((entry) => entry.nip.trim().toLowerCase() === employee.nip.trim().toLowerCase())) {
    throw new Error("ID karyawan tersebut sudah terdaftar.");
  }
  const addedEmployees = [...getAddedEmployees(), employee];
  localStorage.setItem(employeeStorageKey, JSON.stringify(addedEmployees));
  window.dispatchEvent(new CustomEvent("sitenexs:directory-updated"));
  return employee;
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

function appendDirectoryAccount(list, name, description, badge) {
  const item = document.createElement("li");
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-user";
  icon.setAttribute("aria-hidden", "true");
  const details = document.createElement("span");
  const accountName = document.createElement("strong");
  accountName.textContent = name;
  const accountDescription = document.createElement("small");
  accountDescription.textContent = description;
  details.append(accountName, accountDescription);
  const roleBadge = document.createElement("b");
  roleBadge.textContent = badge;
  item.append(icon, details, roleBadge);
  list.append(item);
}

function appendEmployeeForm(form, admins) {
  const ownerSelect = form.elements.employeeOwner;
  if (!ownerSelect) return;
  const currentAdminId = sessionStorage.getItem("sitenexsDemoAdminId");
  const pageAdmin = window.location.pathname.endsWith("/admin.html");
  const availableAdmins = pageAdmin && admins.some((admin) => admin.id === currentAdminId)
    ? admins.filter((admin) => admin.id === currentAdminId)
    : admins;
  const previousValue = ownerSelect.value;
  ownerSelect.replaceChildren(new Option("Pilih admin pemilik", ""));
  availableAdmins.forEach((admin) => ownerSelect.add(new Option(admin.name, admin.id)));
  if (availableAdmins.some((admin) => admin.id === previousValue)) {
    ownerSelect.value = previousValue;
  } else if (availableAdmins.length === 1 || pageAdmin) {
    ownerSelect.value = availableAdmins[0]?.id || "";
  }
  ownerSelect.disabled = pageAdmin && availableAdmins.length === 1;
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
          appendDirectoryAccount(employeeList, employee.name, `${employee.nip} · ${employee.role}`, "Aktif");
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
        appendDirectoryAccount(list, employee.name, `${employee.nip} · ${employee.role}`, "Aktif");
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
    if (window.location.pathname.endsWith("/admin.html")) {
      window.SiteNexsDemoAccount?.updateProfileDisplays("admin");
    }
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
      nip: form.elements.employeeId.value.trim(),
      role: form.elements.employeePosition.value.trim(),
      ownerAdminId: form.elements.employeeOwner.value,
      status: "Hadir",
    };
    if (!employee.name || !employee.nip || !employee.role || !employee.ownerAdminId) {
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
  getAddedEmployees,
  getAdmins,
  getEmployees,
  getEmployeesForAdmin,
  renderDirectory,
};
renderDirectory();
