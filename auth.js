/**
 * Authentication module
 */
const auth = {
  // Current user information
  currentUser: null,
  
  /**
   * Initialize authentication
   */
  init: async function() {
    // Set up event listeners for auth forms
    this.setupEventListeners();
    
    // Check if we have a user in localStorage (from previous session)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.setCurrentUser(JSON.parse(storedUser));
        
        // Verify with the server that the session is still valid
        const user = await API.auth.getCurrentUser();
        this.setCurrentUser(user); // Update with fresh data
        
        showAppPage();
        this.updateUserInfo();
        
        // Load initial data
        if (typeof loadDashboardData === 'function') {
          loadDashboardData();
        }
        
        return; // Exit early if authenticated
      } catch (error) {
        // Session expired or invalid, clear stored user
        this.setCurrentUser(null);
        console.log('Session expired, user needs to login again');
      }
    }
    
    // Default to showing login page
    console.log('User not authenticated, showing login page');
    showAuthPage();
  },
  
  /**
   * Set up event listeners for auth forms
   */
  setupEventListeners: function() {
    // Tab switchers
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all tabs and forms
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.form').forEach(el => el.classList.remove('active'));
        
        // Add active class to clicked tab and its form
        btn.classList.add('active');
        const formId = btn.getAttribute('data-target');
        document.getElementById(formId).classList.add('active');
      });
    });
    
    // Login form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      
      try {
        showLoading();
        // Clear previous error messages
        document.getElementById('login-error').textContent = '';
        
        const user = await API.auth.login({ username, password });
        this.setCurrentUser(user);
        
        showToast('Welcome back!', `Logged in as ${user.displayName || user.username}`, 'success');
        showAppPage();
        this.updateUserInfo();
        
        // Reset form
        loginForm.reset();
        
        // Load initial data
        loadDashboardData();
      } catch (error) {
        document.getElementById('login-error').textContent = error.message || 'Invalid username or password';
      } finally {
        hideLoading();
      }
    });
    
    // Register form submission
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const displayName = document.getElementById('register-display-name').value;
      const password = document.getElementById('register-password').value;
      
      try {
        showLoading();
        // Clear previous error messages
        document.getElementById('register-error').textContent = '';
        
        const user = await API.auth.register({ username, email, displayName, password });
        this.setCurrentUser(user);
        
        showToast('Registration successful!', `Welcome, ${user.displayName || user.username}!`, 'success');
        showAppPage();
        this.updateUserInfo();
        
        // Reset form
        registerForm.reset();
        
        // Load initial data
        loadDashboardData();
      } catch (error) {
        document.getElementById('register-error').textContent = error.message || 'Registration failed. Please try again.';
      } finally {
        hideLoading();
      }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
      await this.logout();
    });
  },
  
  /**
   * Set current user and update UI
   * @param {Object} user - User object
   */
  setCurrentUser: function(user) {
    this.currentUser = user;
    
    // Store user in localStorage for session persistence
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },
  
  /**
   * Update user info in the UI
   */
  updateUserInfo: function() {
    if (!this.currentUser) return;
    
    const userInitial = document.getElementById('user-initial');
    const userName = document.getElementById('user-name');
    
    // Set user initial
    const displayName = this.currentUser.displayName || this.currentUser.username;
    userInitial.textContent = displayName.charAt(0).toUpperCase();
    
    // Set user name
    userName.textContent = displayName;
  },
  
  /**
   * Logout the current user
   */
  logout: async function() {
    try {
      showLoading();
      await API.auth.logout();
      
      // Clear user data
      this.setCurrentUser(null);
      
      showToast('Logged out', 'You have been logged out successfully', 'info');
      showAuthPage();
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('Logout failed', error.message, 'error');
    } finally {
      hideLoading();
    }
  }
};

/**
 * Show the authentication page
 */
function showAuthPage() {
  document.getElementById('auth-container').classList.remove('hidden');
  document.getElementById('app-container').classList.add('hidden');
}

/**
 * Show the main application page
 */
function showAppPage() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
}