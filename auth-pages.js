"use strict";

document.querySelectorAll("[data-auth-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-auth-status]");
    const submitButton = form.querySelector("[type='submit']");
    const identifier = form.elements.identifier.value.trim();
    const password = form.elements.password.value;
    status.textContent = "";
    status.classList.remove("is-error", "is-success");
    submitButton.disabled = true;

    try {
      let role;
      let employee = null;
      const normalizedIdentifier = identifier.toLowerCase();
      const admin = window.SiteNexsDirectory.getAdmins().find((entry) => entry.email.trim().toLowerCase() === normalizedIdentifier);
      if (admin && await window.SiteNexsDemoAccount.verifyDemoPassword(password, admin.id)) {
        role = "admin";
      } else {
        employee = await window.SiteNexsDirectory.authenticateEmployee(identifier, password);
        if (!employee) {
          status.textContent = "Email atau password tidak sesuai.";
          status.classList.add("is-error");
          return;
        }
        role = employee.accountRole === "admin" ? "admin" : "employee";
      }

      sessionStorage.setItem("sitenexsDemoRole", role);
      if (employee) {
        sessionStorage.setItem("sitenexsDemoEmployeeEmail", employee.email);
        if (employee.ownerAdminId) {
          sessionStorage.setItem("sitenexsDemoAdminId", employee.ownerAdminId);
        }
      } else {
        sessionStorage.removeItem("sitenexsDemoEmployeeEmail");
        sessionStorage.setItem("sitenexsDemoAdminId", admin.id);
      }
      const destination = role === "employee" && window.matchMedia("(max-width: 720px)").matches
        ? "mobile.html"
        : "index.html";
      window.location.assign(destination);
    } catch (error) {
      status.textContent = `Login tidak dapat diproses: ${error.message}`;
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
    }
  });
});

document.querySelectorAll("[data-demo-logout]").forEach((link) => {
  link.addEventListener("click", () => {
    sessionStorage.removeItem("sitenexsDemoRole");
    sessionStorage.removeItem("sitenexsDemoAdminId");
    sessionStorage.removeItem("sitenexsDemoEmployeeEmail");
  });
});

const passwordResetDialog = document.getElementById("passwordResetDialog");
if (passwordResetDialog) {
  const resetForm = document.getElementById("passwordResetForm");
  const resetEmail = document.getElementById("resetEmail");
  const resetStatus = document.getElementById("passwordResetStatus");
  const verificationStep = document.getElementById("resetVerificationStep");
  const passwordStep = document.getElementById("resetPasswordStep");
  const verificationCodeInput = document.getElementById("resetVerificationCode");
  const newPasswordInput = document.getElementById("resetNewPassword");
  const confirmPasswordInput = document.getElementById("resetConfirmPassword");
  const resetCodeNotice = document.getElementById("resetDemoCodeNotice");
  const requestCodeButton = document.getElementById("requestResetCodeButton");
  let resetChallenge = null;

  function setResetStatus(message, type = "") {
    resetStatus.textContent = message;
    resetStatus.classList.toggle("is-error", type === "error");
    resetStatus.classList.toggle("is-success", type === "success");
  }

  function clearResetFlow() {
    resetChallenge = null;
    resetForm.reset();
    verificationStep.classList.add("is-hidden");
    passwordStep.classList.add("is-hidden");
    resetCodeNotice.classList.add("is-hidden");
    resetEmail.disabled = false;
    requestCodeButton.disabled = false;
    verificationCodeInput.required = false;
    newPasswordInput.required = false;
    confirmPasswordInput.required = false;
    setResetStatus("");
  }

  document.getElementById("forgotPasswordButton").addEventListener("click", () => {
    clearResetFlow();
    const loginIdentifier = document.querySelector("[data-auth-form]").elements.identifier.value.trim();
    if (loginIdentifier.includes("@")) resetEmail.value = loginIdentifier;
    passwordResetDialog.showModal();
    resetEmail.focus();
  });

  document.querySelectorAll("[data-open-password-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("accountSettingsDialog")?.close();
      clearResetFlow();
      const loginIdentifier = document.querySelector("[data-auth-form]").elements.identifier.value.trim();
      if (loginIdentifier.includes("@")) resetEmail.value = loginIdentifier;
      passwordResetDialog.showModal();
      resetEmail.focus();
    });
  });

  document.querySelectorAll("[data-close-password-reset]").forEach((button) => {
    button.addEventListener("click", () => passwordResetDialog.close());
  });

  passwordResetDialog.addEventListener("click", (event) => {
    if (event.target === passwordResetDialog) passwordResetDialog.close();
  });
  passwordResetDialog.addEventListener("close", clearResetFlow);

  resetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = resetEmail.value.trim().toLowerCase();
    if (!resetEmail.validity.valid) {
      setResetStatus("Masukkan alamat email yang valid.", "error");
      resetEmail.focus();
      return;
    }

    const admin = window.SiteNexsDirectory.getAdmins().find((entry) => entry.email.trim().toLowerCase() === email);
    const employee = window.SiteNexsDirectory.findEmployeeByEmail(email);
    const canReset = Boolean(admin) || Boolean(employee?.credentials);
    resetChallenge = canReset
      ? {
          email,
          code: String(window.crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0"),
          expiresAt: Date.now() + 5 * 60 * 1000,
          accountType: admin ? "admin" : "employee",
          adminId: admin?.id,
          attempts: 0,
          verified: false,
        }
      : null;

    if (resetChallenge) {
      document.getElementById("resetDemoCode").textContent = resetChallenge.code;
      resetCodeNotice.classList.remove("is-hidden");
      verificationStep.classList.remove("is-hidden");
      verificationCodeInput.required = true;
      resetEmail.disabled = true;
      requestCodeButton.disabled = true;
      setResetStatus("Kode verifikasi demo dibuat. Kode ini belum dikirim melalui email.", "success");
      verificationCodeInput.focus();
      return;
    }

    resetCodeNotice.classList.add("is-hidden");
    verificationStep.classList.add("is-hidden");
    setResetStatus("Jika email terdaftar dan memiliki akun yang dapat dipulihkan, instruksi verifikasi akan tersedia. Pastikan email sesuai dengan akun.", "success");
  });

  document.getElementById("verifyResetCodeButton").addEventListener("click", () => {
    if (!resetChallenge) {
      setResetStatus("Buat kode verifikasi terlebih dahulu.", "error");
      return;
    }
    if (Date.now() > resetChallenge.expiresAt) {
      clearResetFlow();
      setResetStatus("Kode kedaluwarsa. Mulai kembali untuk membuat kode baru.", "error");
      return;
    }
    resetChallenge.attempts += 1;
    if (resetChallenge.attempts > 5) {
      clearResetFlow();
      setResetStatus("Batas percobaan terlampaui. Mulai kembali untuk membuat kode baru.", "error");
      return;
    }
    if (verificationCodeInput.value.trim() !== resetChallenge.code) {
      setResetStatus("Kode verifikasi tidak sesuai.", "error");
      verificationCodeInput.focus();
      return;
    }
    resetChallenge.verified = true;
    verificationStep.classList.add("is-hidden");
    passwordStep.classList.remove("is-hidden");
    newPasswordInput.required = true;
    confirmPasswordInput.required = true;
    setResetStatus("Email berhasil diverifikasi. Silakan buat password baru.", "success");
    newPasswordInput.focus();
  });

  document.getElementById("saveResetPasswordButton").addEventListener("click", async () => {
    if (!resetChallenge?.verified || Date.now() > resetChallenge.expiresAt) {
      clearResetFlow();
      setResetStatus("Verifikasi email sudah tidak berlaku. Mulai kembali.", "error");
      return;
    }
    const password = newPasswordInput.value;
    if (password.length < 8) {
      setResetStatus("Password baru harus minimal 8 karakter.", "error");
      newPasswordInput.focus();
      return;
    }
    if (password !== confirmPasswordInput.value) {
      setResetStatus("Konfirmasi password tidak sama.", "error");
      confirmPasswordInput.focus();
      return;
    }

    const button = document.getElementById("saveResetPasswordButton");
    button.disabled = true;
    try {
      if (resetChallenge.accountType === "admin") {
        await window.SiteNexsDemoAccount.saveDemoPassword(password, resetChallenge.adminId);
      } else {
        await window.SiteNexsDirectory.updateEmployeePassword(resetChallenge.email, password);
      }
      const email = resetChallenge.email;
      resetChallenge = null;
      setResetStatus("Password berhasil diperbarui di browser ini. Silakan masuk dengan password baru.", "success");
      document.querySelector("[data-auth-form]").elements.identifier.value = email;
      window.setTimeout(() => passwordResetDialog.close(), 1100);
    } catch (error) {
      setResetStatus(`Password tidak dapat diperbarui: ${error.message}`, "error");
    } finally {
      button.disabled = false;
    }
  });

  if (window.location.hash === "#forgot-password") {
    passwordResetDialog.showModal();
    resetEmail.focus();
  }
}
