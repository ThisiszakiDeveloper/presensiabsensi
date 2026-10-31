"use strict";

(() => {
  const storageKey = "sitenexsGpsAttendance";
  const defaultRadius = 7;
  const employeePolicyLabels = {
    flag: "Izinkan, tetapi tandai tidak tepat di luar radius",
    strict: "Wajib dalam radius; blokir di luar radius",
  };
  let settings;

  function companyStorageKey(adminId) {
    return `${storageKey}:${adminId}`;
  }

  function readSettings(adminId) {
    const stored = localStorage.getItem(companyStorageKey(adminId));
    if (!stored) return { officeLocation: null, radius: defaultRadius, employeePolicies: {}, logs: [] };
    const value = JSON.parse(stored);
    if (
      !value
      || typeof value !== "object"
      || !Number.isFinite(value.radius)
      || value.radius < 1
      || value.radius > 5000
      || (value.officeLocation && (!Number.isFinite(value.officeLocation.latitude) || !Number.isFinite(value.officeLocation.longitude)))
      || !value.employeePolicies
      || typeof value.employeePolicies !== "object"
      || !Array.isArray(value.logs)
    ) {
      throw new Error("Pengaturan GPS lokal tidak valid. Periksa data GPS di penyimpanan browser.");
    }
    return value;
  }

  function saveSettings(adminId, nextSettings) {
    localStorage.setItem(companyStorageKey(adminId), JSON.stringify(nextSettings));
    settings = nextSettings;
  }

  function getEmployees() {
    return window.SiteNexsDirectory?.getEmployees() || [];
  }

  function getSelectedAdminId() {
    const admins = window.SiteNexsDirectory?.getAdmins() || [];
    return sessionStorage.getItem("sitenexsDemoAdminId") || admins[0]?.id;
  }

  function getAdminEmployees(adminId) {
    return getEmployees().filter((employee) => employee.ownerAdminId === (adminId || getSelectedAdminId()));
  }

  function currentEmployee() {
    const employees = getEmployees();
    const nip = sessionStorage.getItem("sitenexsDemoEmployeeNip") || "SNX-2023-014";
    return employees.find((employee) => employee.nip === nip) || employees[0] || { name: "Karyawan", nip };
  }

  function policyFor(employeeNip, companySettings = settings) {
    return companySettings?.employeePolicies[employeeNip] === "strict" ? "strict" : "flag";
  }

  function calculateDistanceMeters(first, second) {
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(second.latitude - first.latitude);
    const longitudeDelta = toRadians(second.longitude - first.longitude);
    const latitude1 = toRadians(first.latitude);
    const latitude2 = toRadians(second.latitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      return Promise.reject(new Error("GPS tidak tersedia pada browser ini."));
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
        (error) => {
          const reason = error.code === 1
            ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk presensi GPS."
            : error.code === 2
              ? "Posisi GPS tidak dapat ditemukan. Coba di area terbuka."
              : "Waktu mendapatkan posisi GPS habis. Silakan coba lagi.";
          reject(new Error(reason));
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      );
    });
  }

  function assessAttendance(employeeNip, location) {
    const employee = getEmployees().find((entry) => entry.nip === employeeNip);
    const adminId = employee?.ownerAdminId || getSelectedAdminId();
    const companySettings = readSettings(adminId);
    const policy = policyFor(employeeNip, companySettings);
    if (!companySettings.officeLocation) {
      return {
        status: "belum-diatur",
        distanceMeters: null,
        allowed: policy !== "strict",
        adminId,
        message: "Lokasi kantor belum ditetapkan admin.",
      };
    }
    if (!location) {
      return {
        status: "gps-tidak-tersedia",
        distanceMeters: null,
        allowed: policy !== "strict",
        adminId,
        message: "Lokasi tidak dapat diverifikasi.",
      };
    }
    const distanceMeters = calculateDistanceMeters(companySettings.officeLocation, location);
    const accuracyMeters = Number.isFinite(location.accuracy) ? location.accuracy : 0;
    const isInRange = distanceMeters + accuracyMeters <= companySettings.radius;
    const isOutsideRange = distanceMeters - accuracyMeters > companySettings.radius;
    return {
      status: isInRange ? "tepat" : isOutsideRange ? "tidak-tepat" : "gps-tidak-akurat",
      distanceMeters,
      accuracyMeters,
      adminId,
      allowed: isInRange || policy !== "strict",
      message: isInRange
        ? `Tepat di area kantor (estimasi ${Math.round(distanceMeters)} m, akurasi GPS ±${Math.round(accuracyMeters)} m).`
        : isOutsideRange
          ? `${Math.round(distanceMeters)} m dari kantor; di luar batas ${companySettings.radius} m.`
          : `Jarak sekitar ${Math.round(distanceMeters)} m, tetapi akurasi GPS ±${Math.round(accuracyMeters)} m belum memastikan batas ${companySettings.radius} m.`,
    };
  }

  function formatOfficeLocation(companySettings) {
    if (!companySettings.officeLocation) return "Lokasi kantor belum ditetapkan.";
    const accuracy = Number.isFinite(companySettings.officeLocation.accuracy)
      ? ` · akurasi titik ±${Math.round(companySettings.officeLocation.accuracy)} m`
      : "";
    return `Lat ${companySettings.officeLocation.latitude.toFixed(6)}, Long ${companySettings.officeLocation.longitude.toFixed(6)} · radius ${companySettings.radius} m${accuracy}`;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderAdmin(host) {
    const adminId = getSelectedAdminId();
    const employees = getAdminEmployees(adminId);
    settings = readSettings(adminId);
    const sectionHeading = element("div", "gps-dashboard-heading");
    sectionHeading.append(
      Object.assign(element("span", "gps-dashboard-icon"), {
        innerHTML: '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>',
      }),
      Object.assign(element("div"), {
        innerHTML: '<span class="panel-kicker">GPS PRESENSI · ADMIN</span><h2>Lokasi kantor & aturan karyawan</h2><p>Atur titik kantor, radius presensi, dan cara sistem menandai lokasi tiap karyawan.</p>',
      }),
    );

    const office = element("div", "gps-office-summary");
    office.dataset.gpsOfficeSummary = "";
    office.textContent = formatOfficeLocation(settings);
    const form = element("form", "gps-office-form");
    const radiusLabel = element("label", "gps-radius-field");
    radiusLabel.append(element("span", "", "Radius kantor (meter)"));
    const radiusInput = element("input");
    radiusInput.type = "number";
    radiusInput.name = "radius";
    radiusInput.min = "1";
    radiusInput.max = "5000";
    radiusInput.step = "1";
    radiusInput.value = String(settings.radius);
    radiusInput.required = true;
    radiusLabel.append(radiusInput);
    const saveRadius = element("button", "button button-outline", "Simpan radius");
    saveRadius.type = "submit";
    saveRadius.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-floppy-disk"></i> ');
    const setOfficeButton = element("button", "button button-primary", "Tetapkan lokasi kantor dari GPS");
    setOfficeButton.type = "button";
    setOfficeButton.dataset.setOfficeGps = "";
    setOfficeButton.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-location-crosshairs"></i> ');
    form.append(radiusLabel, saveRadius, setOfficeButton);
    const status = element("p", "gps-inline-status");
    status.dataset.gpsAdminStatus = "";

    const policyHeading = element("div", "gps-policy-heading");
    policyHeading.append(element("h3", "", "Aturan lokasi per karyawan"), element("p", "", "Pilihan berlaku untuk karyawan milik admin ini."));
    const list = element("div", "gps-employee-policies");
    employees.forEach((employee) => {
      const row = element("label", "gps-policy-row");
      row.append(element("span", "gps-policy-employee", employee.name));
      row.append(element("small", "", `${employee.nip} · ${employee.role}`));
      const select = element("select");
      select.dataset.gpsPolicyEmployee = employee.nip;
      select.setAttribute("aria-label", `Aturan GPS untuk ${employee.name}`);
      select.add(new Option(employeePolicyLabels.flag, "flag"));
      select.add(new Option(employeePolicyLabels.strict, "strict"));
      select.value = policyFor(employee.nip);
      row.append(select);
      list.append(row);
    });
    if (!employees.length) list.append(element("p", "gps-empty-state", "Belum ada karyawan pada admin ini."));

    const logsHeading = element("div", "gps-policy-heading");
    logsHeading.append(element("h3", "", "Riwayat presensi GPS"), element("p", "", "Presensi karyawan pada perusahaan ini."));
    const logs = element("div", "gps-operator-log");
    settings.logs.slice(-8).reverse().forEach((log) => {
      const row = element("div", "gps-log-row");
      row.append(
        element("strong", "", log.employeeName),
        element("span", "", `${log.type === "in" ? "Masuk" : "Keluar"} · ${log.statusLabel}`),
        element("small", "", log.distanceMeters === null ? log.timeLabel : `${log.distanceMeters} m dari kantor · ${log.timeLabel}`),
      );
      logs.append(row);
    });
    if (!logs.children.length) logs.append(element("p", "gps-empty-state", "Belum ada presensi GPS yang tercatat."));

    const note = element("p", "gps-demo-note", "GPS memerlukan izin lokasi dan koneksi aman (HTTPS atau localhost). Data demo disimpan di browser ini; nilai GPS browser tidak dapat dijadikan bukti lokasi yang anti-pemalsuan.");
    host.replaceChildren(sectionHeading, office, form, status, policyHeading, list, logsHeading, logs, note);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const radius = Number(radiusInput.value);
      if (!Number.isFinite(radius) || radius < 1 || radius > 5000) {
        status.textContent = "Radius harus antara 1 dan 5.000 meter.";
        status.classList.add("is-error");
        return;
      }
      try {
        saveSettings(adminId, { ...settings, radius });
        status.textContent = `Radius kantor disimpan: ${radius} meter.`;
        status.classList.remove("is-error");
        office.textContent = formatOfficeLocation(settings);
      } catch (error) {
        status.textContent = `Pengaturan GPS gagal disimpan: ${error.message}`;
        status.classList.add("is-error");
      }
    });

    setOfficeButton.addEventListener("click", async () => {
      setOfficeButton.disabled = true;
      status.textContent = "Mengambil posisi GPS kantor...";
      status.classList.remove("is-error");
      try {
        const officeLocation = await getCurrentLocation();
        const radius = Number(radiusInput.value);
        if (!Number.isFinite(radius) || radius < 1 || radius > 5000) {
          throw new Error("Isi radius antara 1 dan 5.000 meter sebelum menetapkan lokasi.");
        }
        saveSettings(adminId, { ...settings, officeLocation, radius });
        office.textContent = formatOfficeLocation(settings);
        status.textContent = "Titik kantor dan radius GPS berhasil disimpan.";
      } catch (error) {
        status.textContent = `Lokasi kantor belum berubah: ${error.message}`;
        status.classList.add("is-error");
      } finally {
        setOfficeButton.disabled = false;
      }
    });

    list.addEventListener("change", (event) => {
      const select = event.target.closest("[data-gps-policy-employee]");
      if (!select) return;
      try {
        const employeePolicies = { ...settings.employeePolicies, [select.dataset.gpsPolicyEmployee]: select.value };
        saveSettings(adminId, { ...settings, employeePolicies });
        status.textContent = "Aturan GPS karyawan berhasil diperbarui.";
        status.classList.remove("is-error");
      } catch (error) {
        status.textContent = `Aturan GPS gagal disimpan: ${error.message}`;
        status.classList.add("is-error");
      }
    });
  }

  function renderOperator(host) {
    const admins = window.SiteNexsDirectory?.getAdmins() || [];
    const companies = admins.map((admin) => ({
      admin,
      employees: getAdminEmployees(admin.id),
      settings: readSettings(admin.id),
    }));
    const logs = companies.flatMap(({ admin, settings: companySettings }) =>
      companySettings.logs.map((log) => ({ ...log, adminName: admin.name })),
    ).sort((left, right) => right.createdAt - left.createdAt);
    const latestLogs = logs.slice(0, 8);
    const heading = element("div", "gps-dashboard-heading");
    heading.append(
      Object.assign(element("span", "gps-dashboard-icon"), {
        innerHTML: '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>',
      }),
      Object.assign(element("div"), {
        innerHTML: '<span class="panel-kicker">PENGAWASAN GPS · OPERATOR</span><h2>Ringkasan lokasi presensi</h2><p>Operator dapat memantau titik kantor, aturan karyawan, dan aktivitas GPS terbaru.</p>',
      }),
    );
    const officeList = element("div", "gps-company-list");
    companies.forEach(({ admin, employees, settings: companySettings }) => {
      const companyCard = element("section", "gps-company-card");
      companyCard.append(
        element("h3", "", admin.name),
        element("p", "gps-office-summary", formatOfficeLocation(companySettings)),
        element("small", "", `${employees.length} karyawan · ${companySettings.logs.length} riwayat GPS`),
      );
      officeList.append(companyCard);
    });
    const stats = element("div", "gps-operator-stats");
    const accurateCount = logs.filter((log) => log.status === "tepat").length;
    const inaccurateCount = logs.filter((log) => log.status === "tidak-tepat" || log.status === "gps-tidak-akurat").length;
    const employeeCount = companies.reduce((count, company) => count + company.employees.length, 0);
    stats.append(
      element("strong", "", String(employeeCount)),
      element("span", "", "karyawan terdaftar"),
      element("strong", "", String(accurateCount)),
      element("span", "", "presensi tepat tercatat"),
      element("strong", "", String(inaccurateCount)),
      element("span", "", "presensi tidak tepat tercatat"),
    );
    const policyList = element("div", "gps-operator-log");
    companies.forEach(({ admin, employees, settings: companySettings }) => {
      employees.forEach((employee) => {
        const row = element("div", "gps-log-row");
        row.append(
          element("strong", "", employee.name),
          element("span", "", `${admin.name} · ${employeePolicyLabels[policyFor(employee.nip, companySettings)]}`),
          element("small", "", `${employee.nip} · ${employee.role}`),
        );
        policyList.append(row);
      });
    });
    if (!policyList.children.length) policyList.append(element("p", "gps-empty-state", "Belum ada karyawan terdaftar."));
    const logsHeading = element("h3", "gps-policy-heading", "Aktivitas GPS terbaru");
    const logList = element("div", "gps-operator-log");
    latestLogs.forEach((log) => {
      const row = element("div", "gps-log-row");
      row.append(
        element("strong", "", log.employeeName),
        element("span", "", `${log.adminName} · ${log.type === "in" ? "Masuk" : "Keluar"} · ${log.statusLabel}`),
        element("small", "", log.distanceMeters === null ? log.timeLabel : `${log.distanceMeters} m dari kantor · ${log.timeLabel}`),
      );
      logList.append(row);
    });
    if (!latestLogs.length) logList.append(element("p", "gps-empty-state", "Belum ada aktivitas GPS yang tercatat."));
    host.replaceChildren(heading, officeList, stats, element("h3", "gps-policy-heading", "Aturan lokasi karyawan"), policyList, logsHeading, logList,
      element("p", "gps-demo-note", "Titik kantor dan kebijakan diatur oleh admin. Data pengawasan GPS ini hanya tersimpan lokal di browser."));
  }

  function renderEmployee(host) {
    const employee = currentEmployee();
    settings = readSettings(employee.ownerAdminId || getSelectedAdminId());
    const heading = element("div", "gps-employee-copy");
    heading.append(
      element("span", "panel-kicker", "GPS PRESENSI"),
      element("h2", "", "Lokasi absensi"),
      element("p", "", "Periksa jarak Anda dari titik kantor sebelum melakukan scan."),
    );
    const status = element("p", "gps-employee-status", formatOfficeLocation(settings));
    status.dataset.gpsEmployeeStatus = "";
    const button = element("button", "button button-outline", "Periksa lokasi saya");
    button.type = "button";
    button.dataset.checkEmployeeGps = "";
    button.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-location-crosshairs"></i> ');
    const note = element("small", "gps-demo-note", "Jika lokasi di luar radius, kebijakan admin menentukan apakah scan ditolak atau dicatat tidak tepat.");
    host.replaceChildren(heading, status, button, note);
    button.addEventListener("click", async () => {
      button.disabled = true;
      status.textContent = "Mendapatkan lokasi GPS...";
      status.classList.remove("is-error", "is-success");
      try {
        const location = await getCurrentLocation();
        const assessment = assessAttendance(employee.nip, location);
        status.textContent = assessment.message;
        status.classList.add(assessment.status === "tepat" ? "is-success" : "is-error");
      } catch (error) {
        status.textContent = error.message;
        status.classList.add("is-error");
      } finally {
        button.disabled = false;
      }
    });
  }

  function renderAll() {
    try {
      document.querySelectorAll("[data-gps-dashboard]").forEach((host) => {
        if (host.dataset.gpsDashboard === "admin") renderAdmin(host);
        else if (host.dataset.gpsDashboard === "operator") renderOperator(host);
        else if (host.dataset.gpsDashboard === "employee") renderEmployee(host);
      });
    } catch (error) {
      document.querySelectorAll("[data-gps-dashboard]").forEach((host) => {
        host.replaceChildren(element("p", "gps-inline-status is-error", `Pengaturan GPS gagal dimuat: ${error.message}`));
      });
    }
  }

  window.SiteNexsGpsAttendance = {
    assessAttendance,
    calculateDistanceMeters,
    getCurrentLocation,
    getCurrentEmployee: currentEmployee,
    recordAttendance(employee, type, assessment) {
      const adminId = assessment.adminId || employee.ownerAdminId || getSelectedAdminId();
      const companySettings = readSettings(adminId);
      const date = new Date();
      const log = {
        id: `${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: date.getTime(),
        employeeNip: employee.nip,
        employeeName: employee.name,
        type,
        status: assessment.status,
        statusLabel: assessment.status === "tepat"
          ? "Tepat"
          : assessment.status === "tidak-tepat"
            ? "Tidak tepat"
            : assessment.status === "gps-tidak-akurat"
              ? "GPS tidak akurat"
              : "Tidak terverifikasi",
        distanceMeters: assessment.distanceMeters === null ? null : Math.round(assessment.distanceMeters),
        timeLabel: new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(date),
      };
      saveSettings(adminId, { ...companySettings, logs: [...companySettings.logs, log].slice(-500) });
      return log;
    },
    refresh: renderAll,
  };

  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith(`${storageKey}:`)) renderAll();
  });
  window.addEventListener("sitenexs:gps-updated", renderAll);
  window.addEventListener("sitenexs:directory-updated", renderAll);
  window.addEventListener("storage", (event) => {
    if (event.key === "sitenexsWorkspaceEmployees" || event.key === "sitenexsWorkspaceAdmins") renderAll();
  });
  renderAll();
})();
