/**
 * API Service for interacting with the server
 */
const API = {
  /**
   * Base API request with error handling
   * @param {string} url - The API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} - The fetch promise
   */
  async request(url, options = {}) {
    try {
      // Set default headers if not provided
      if (!options.headers) {
        options.headers = {
          'Content-Type': 'application/json'
        };
      }
      
      // Always include credentials for session cookies
      options.credentials = 'include';
      
      const response = await fetch(url, options);
      
      // Handle common HTTP errors
      if (response.status === 401) {
        // Unauthorized - redirect to auth page
        showToast('Session expired', 'Please log in again', 'error');
        
        // Only redirect if we're not already on the auth page
        if (!window.location.href.includes('auth')) {
          auth.logout();
          showAuthPage();
        }
        
        throw new Error('Unauthorized');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Check if response is empty
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  /**
   * GET request
   * @param {string} url - The API endpoint
   * @returns {Promise} - The fetch promise
   */
  async get(url) {
    return this.request(url);
  },
  
  /**
   * POST request
   * @param {string} url - The API endpoint
   * @param {Object} data - The data to send
   * @returns {Promise} - The fetch promise
   */
  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * PUT request
   * @param {string} url - The API endpoint
   * @param {Object} data - The data to send
   * @returns {Promise} - The fetch promise
   */
  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * DELETE request
   * @param {string} url - The API endpoint
   * @returns {Promise} - The fetch promise
   */
  async delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  },
  
  // API endpoints grouped by resource
  auth: {
    /**
     * Get current user
     * @returns {Promise<Object>} - User object
     */
    getCurrentUser: async () => {
      try {
        return await API.get('/api/user');
      } catch (error) {
        // Clear any stored user data if authentication fails
        localStorage.removeItem('user');
        throw error;
      }
    },
    
    /**
     * Login user
     * @param {Object} credentials - Login credentials
     * @returns {Promise<Object>} - User object
     */
    login: async (credentials) => {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Login failed (${response.status})`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    
    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - User object
     */
    register: async (userData) => {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Registration failed (${response.status})`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    
    /**
     * Logout user
     * @returns {Promise} - Success response
     */
    logout: async () => {
      try {
        await API.post('/api/logout');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Logout error:', error);
        // Even if server logout fails, clear local storage
        localStorage.removeItem('user');
        throw error;
      }
    }
  },
  
  tasks: {
    /**
     * Get all tasks
     * @returns {Promise<Array>} - Array of tasks
     */
    getAll: async () => {
      return API.get('/api/tasks');
    },
    
    /**
     * Get upcoming tasks
     * @param {number} limit - Number of tasks to return
     * @returns {Promise<Array>} - Array of tasks
     */
    getUpcoming: async (limit = 5) => {
      return API.get(`/api/tasks/upcoming?limit=${limit}`);
    },
    
    /**
     * Get task stats
     * @returns {Promise<Object>} - Task statistics
     */
    getStats: async () => {
      return API.get('/api/tasks/stats');
    },
    
    /**
     * Create new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} - Created task
     */
    create: async (taskData) => {
      return API.post('/api/tasks', taskData);
    },
    
    /**
     * Update task
     * @param {number} id - Task ID
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} - Updated task
     */
    update: async (id, taskData) => {
      return API.put(`/api/tasks/${id}`, taskData);
    },
    
    /**
     * Delete task
     * @param {number} id - Task ID
     * @returns {Promise} - Success response
     */
    delete: async (id) => {
      return API.delete(`/api/tasks/${id}`);
    }
  },
  
  subjects: {
    /**
     * Get all subjects
     * @returns {Promise<Array>} - Array of subjects
     */
    getAll: async () => {
      return API.get('/api/subjects');
    },
    
    /**
     * Create new subject
     * @param {Object} subjectData - Subject data
     * @returns {Promise<Object>} - Created subject
     */
    create: async (subjectData) => {
      return API.post('/api/subjects', subjectData);
    },
    
    /**
     * Update subject
     * @param {number} id - Subject ID
     * @param {Object} subjectData - Subject data
     * @returns {Promise<Object>} - Updated subject
     */
    update: async (id, subjectData) => {
      return API.put(`/api/subjects/${id}`, subjectData);
    },
    
    /**
     * Delete subject
     * @param {number} id - Subject ID
     * @returns {Promise} - Success response
     */
    delete: async (id) => {
      return API.delete(`/api/subjects/${id}`);
    }
  },
  
  events: {
    /**
     * Get all events
     * @returns {Promise<Array>} - Array of events
     */
    getAll: async () => {
      return API.get('/api/events');
    },
    
    /**
     * Get events by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} - Array of events
     */
    getByDateRange: async (startDate, endDate) => {
      return API.get(`/api/events?startDate=${startDate}&endDate=${endDate}`);
    },
    
    /**
     * Create new event
     * @param {Object} eventData - Event data
     * @returns {Promise<Object>} - Created event
     */
    create: async (eventData) => {
      return API.post('/api/events', eventData);
    },
    
    /**
     * Update event
     * @param {number} id - Event ID
     * @param {Object} eventData - Event data
     * @returns {Promise<Object>} - Updated event
     */
    update: async (id, eventData) => {
      return API.put(`/api/events/${id}`, eventData);
    },
    
    /**
     * Delete event
     * @param {number} id - Event ID
     * @returns {Promise} - Success response
     */
    delete: async (id) => {
      return API.delete(`/api/events/${id}`);
    }
  },
  
  resources: {
    /**
     * Get all resources
     * @returns {Promise<Array>} - Array of resources
     */
    getAll: async () => {
      return API.get('/api/resources');
    },
    
    /**
     * Get recent resources
     * @param {number} limit - Number of resources to return
     * @returns {Promise<Array>} - Array of resources
     */
    getRecent: async (limit = 3) => {
      return API.get(`/api/resources/recent?limit=${limit}`);
    },
    
    /**
     * Create new resource
     * @param {Object} resourceData - Resource data
     * @returns {Promise<Object>} - Created resource
     */
    create: async (resourceData) => {
      return API.post('/api/resources', resourceData);
    },
    
    /**
     * Update resource
     * @param {number} id - Resource ID
     * @param {Object} resourceData - Resource data
     * @returns {Promise<Object>} - Updated resource
     */
    update: async (id, resourceData) => {
      return API.put(`/api/resources/${id}`, resourceData);
    },
    
    /**
     * Delete resource
     * @param {number} id - Resource ID
     * @returns {Promise} - Success response
     */
    delete: async (id) => {
      return API.delete(`/api/resources/${id}`);
    }
  },
  
  analytics: {
    /**
     * Get tasks by subject
     * @returns {Promise<Array>} - Array of task counts by subject
     */
    getTasksBySubject: async () => {
      return API.get('/api/analytics/tasks-by-subject');
    }
  }
};

/**
 * Show toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, info, warning)
 */
function showToast(title, message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass;
  switch (type) {
    case 'success':
      iconClass = 'fas fa-check-circle';
      break;
    case 'error':
      iconClass = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      iconClass = 'fas fa-exclamation-triangle';
      break;
    default:
      iconClass = 'fas fa-info-circle';
  }
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${iconClass}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Add event listener to close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  });
  
  // Auto remove toast after 5 seconds
  setTimeout(() => {
    if (toastContainer.contains(toast)) {
      toast.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }
  }, 5000);
}

/**
 * Show loading spinner
 */
function showLoading() {
  document.getElementById('loading-spinner').classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  document.getElementById('loading-spinner').classList.add('hidden');
}