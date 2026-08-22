// Authentication Handler & Demo Account Switcher
document.addEventListener('DOMContentLoaded', () => {
  // Check if session expired
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired')) {
    Toast.warning('Your session has expired. Please log in again.');
  }

  // Handle Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!identifier || !password) {
        Toast.error('Please enter both Email/Employee ID and password.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Signing in...';
        const res = await api.login({ identifier, password });

        TokenService.setToken(res.token);
        TokenService.setUser(res.user);
        Toast.success(`Welcome back, ${res.user.fullName}!`);

        setTimeout(() => {
          window.location.href = '/app.html';
        }, 600);
      } catch (err) {
        Toast.error(err.message || 'Login failed. Please check credentials.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In to Workspace';
      }
    });
  }

  // Handle Signup Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.getElementById('strengthMeter');
    const strengthText = document.getElementById('strengthText');

    if (passwordInput && strengthMeter) {
      passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        let strength = 0;
        if (val.length >= 6) strength += 25;
        if (/[A-Z]/.test(val)) strength += 25;
        if (/[0-9]/.test(val)) strength += 25;
        if (/[^A-Za-z0-9]/.test(val)) strength += 25;

        strengthMeter.style.width = `${strength}%`;
        if (strength <= 25) {
          strengthMeter.style.backgroundColor = '#EF4444';
          strengthText.innerText = 'Weak';
          strengthText.style.color = '#EF4444';
        } else if (strength <= 50) {
          strengthMeter.style.backgroundColor = '#F59E0B';
          strengthText.innerText = 'Fair';
          strengthText.style.color = '#F59E0B';
        } else if (strength <= 75) {
          strengthMeter.style.backgroundColor = '#3B82F6';
          strengthText.innerText = 'Good';
          strengthText.style.color = '#3B82F6';
        } else {
          strengthMeter.style.backgroundColor = '#10B981';
          strengthText.innerText = 'Strong & Secure';
          strengthText.style.color = '#10B981';
        }
      });
    }

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const employeeId = document.getElementById('employeeId').value.trim();
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const role = document.getElementById('role').value;
      const department = document.getElementById('department').value;
      const designation = document.getElementById('designation').value.trim();
      const submitBtn = signupForm.querySelector('button[type="submit"]');

      if (password !== confirmPassword) {
        Toast.error('Passwords do not match.');
        return;
      }

      if (password.length < 6) {
        Toast.error('Password must be at least 6 characters long.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Creating account...';
        const res = await api.register({
          employeeId,
          fullName,
          email,
          password,
          role,
          department,
          designation: designation || 'Staff Member',
        });

        TokenService.setToken(res.token);
        TokenService.setUser(res.user);
        Toast.success('Account created successfully! Redirecting...');

        setTimeout(() => {
          window.location.href = '/app.html';
        }, 600);
      } catch (err) {
        Toast.error(err.message || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Dayflow Account';
      }
    });
  }
});

// Quick 1-Click Demo Account Autofill & Submit
window.quickLogin = async function(email, password) {
  const idInput = document.getElementById('identifier');
  const passInput = document.getElementById('password');
  const loginForm = document.getElementById('loginForm');

  if (idInput && passInput) {
    idInput.value = email;
    passInput.value = password;
    Toast.info(`Autofilled demo credentials for ${email}. Signing in...`);
    
    try {
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Signing in demo account...';
      }
      const res = await api.login({ identifier: email, password });
      TokenService.setToken(res.token);
      TokenService.setUser(res.user);
      Toast.success(`Welcome, ${res.user.fullName}!`);
      setTimeout(() => {
        window.location.href = '/app.html';
      }, 500);
    } catch (err) {
      Toast.error(err.message || 'Demo login failed.');
    }
  }
};
