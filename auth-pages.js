"use strict";

document.querySelectorAll("[data-auth-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-auth-status]");
    const { email, password, role } = form.elements;

    window.SiteNexsDemoAccount.verifyDemoPassword(password.value).then((passwordMatches) => {
      if (email.value.trim().toLowerCase() !== "admin@gmail.com" || !passwordMatches) {
        status.textContent = "Email atau password akun testing tidak sesuai.";
        status.classList.add("is-error");
        return;
      }

      sessionStorage.setItem("sitenexsDemoRole", role.value);
      if (role.value === "admin") {
        sessionStorage.setItem("sitenexsDemoAdminId", form.elements.adminId.value);
      } else {
        sessionStorage.removeItem("sitenexsDemoAdminId");
      }
      const destinations = {
        operator: "operator.html",
        admin: "admin.html",
        employee: window.matchMedia("(max-width: 720px)").matches ? "mobile.html" : "index.html",
      };
      window.location.assign(destinations[role.value]);
    }).catch((error) => {
      status.textContent = `Login demo gagal: ${error.message}`;
      status.classList.add("is-error");
    });
  });
});

document.querySelectorAll("[data-demo-logout]").forEach((link) => {
  link.addEventListener("click", () => {
    sessionStorage.removeItem("sitenexsDemoRole");
    sessionStorage.removeItem("sitenexsDemoAdminId");
  });
});

document.querySelectorAll(".auth-input-wrap select").forEach((select) => {
  select.addEventListener("change", () => {
    const status = select.form.querySelector("[data-auth-status]");
    status.textContent = "";
    status.classList.remove("is-error");
    if (select.name === "role") {
      const adminField = select.form.querySelector("[data-admin-select-field]");
      adminField.classList.toggle("is-hidden", select.value !== "admin");
      select.form.elements.adminId.required = select.value === "admin";
      if (select.value === "admin") {
        window.SiteNexsDemoAccount.updateProfileDisplays("admin", select.form.elements.adminId.value);
      }
    }
  });
});

document.querySelectorAll("[data-admin-selector]").forEach((select) => {
  select.addEventListener("change", () => {
    if (select.form?.elements.role?.value === "admin") {
      sessionStorage.setItem("sitenexsDemoAdminId", select.value);
      window.SiteNexsDemoAccount.updateProfileDisplays("admin", select.value);
    }
  });
});
