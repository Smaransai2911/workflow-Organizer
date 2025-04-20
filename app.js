/**
 * Main application module
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize authentication
  auth.init();
  
  // Set up navigation
  setupNavigation();
  
  // Set up add button actions
  setupAddItemButton();
});

/**
 * Set up navigation between pages
 */
function setupNavigation() {
  // Sidebar navigation
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Get the page to show
      const pageId = item.getAttribute('data-page');
      navigateToPage(pageId);
    });
  });
  
  // "View All" links
  const viewAllLinks = document.querySelectorAll('.view-all');
  viewAllLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('data-page');
      navigateToPage(pageId);
    });
  });
}

/**
 * Navigate to the specified page
 * @param {string} pageId - The ID of the page to navigate to
 */
function navigateToPage(pageId) {
  // Update navigation items
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Update page content
  document.querySelectorAll('.page-content').forEach(page => {
    if (page.id === `${pageId}-page`) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });
  
  // Update page title
  const pageTitle = document.getElementById('page-title');
  pageTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
  
  // Load page-specific data
  loadPageData(pageId);
  
  // Update add button text and visibility
  updateAddButton(pageId);
}

/**
 * Load data for the specified page
 * @param {string} pageId - The ID of the page to load data for
 */
function loadPageData(pageId) {
  switch (pageId) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'tasks':
      // Load tasks data
      // This would be implemented in tasks.js
      break;
    case 'calendar':
      // Load calendar data
      // This would be implemented in calendar.js
      break;
    case 'resources':
      // Load resources data
      // This would be implemented in resources.js
      break;
    case 'analytics':
      // Load analytics data
      // This would be implemented in analytics.js
      break;
  }
}

/**
 * Update the add button based on the current page
 * @param {string} pageId - The ID of the current page
 */
function updateAddButton(pageId) {
  const addButton = document.getElementById('add-item-btn');
  
  switch (pageId) {
    case 'tasks':
      addButton.textContent = 'Add Task';
      addButton.style.display = 'block';
      break;
    case 'calendar':
      addButton.textContent = 'Add Event';
      addButton.style.display = 'block';
      break;
    case 'resources':
      addButton.textContent = 'Add Resource';
      addButton.style.display = 'block';
      break;
    default:
      addButton.style.display = 'none';
      break;
  }
}

/**
 * Set up the add item button
 */
function setupAddItemButton() {
  const addButton = document.getElementById('add-item-btn');
  
  addButton.addEventListener('click', () => {
    const currentPage = document.querySelector('.nav-item.active').getAttribute('data-page');
    
    switch (currentPage) {
      case 'tasks':
        // Show task modal
        break;
      case 'calendar':
        // Show event modal
        break;
      case 'resources':
        // Show resource modal
        break;
    }
  });
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
  try {
    showLoading();
    
    // Run these requests in parallel for better performance
    const [taskStats, upcomingTasks, recentResources, tasksBySubject] = await Promise.allSettled([
      API.tasks.getStats(),
      API.tasks.getUpcoming(5),
      API.resources.getRecent(3),
      API.analytics.getTasksBySubject()
    ]);
    
    // Update the UI with the results that were successful
    if (taskStats.status === 'fulfilled') {
      updateTaskStats(taskStats.value);
    }
    
    if (upcomingTasks.status === 'fulfilled') {
      updateUpcomingTasksList(upcomingTasks.value);
    }
    
    if (recentResources.status === 'fulfilled') {
      updateRecentResourcesList(recentResources.value);
    }
    
    if (tasksBySubject.status === 'fulfilled') {
      updateTasksBySubjectChart(tasksBySubject.value);
    }
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Error', 'Failed to load dashboard data', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Update task statistics on the dashboard
 * @param {Object} stats - Task statistics object
 */
function updateTaskStats(stats) {
  document.getElementById('pending-tasks-count').textContent = stats.pendingTasks;
  document.getElementById('completed-tasks-count').textContent = stats.completedTasks;
  document.getElementById('due-today-count').textContent = stats.dueToday;
  document.getElementById('overdue-count').textContent = stats.overdue;
}

/**
 * Update the upcoming tasks list on the dashboard
 * @param {Array} tasks - Array of upcoming tasks
 */
function updateUpcomingTasksList(tasks) {
  const container = document.getElementById('upcoming-tasks-list');
  
  // Clear existing content
  container.innerHTML = '';
  
  if (tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="fas fa-tasks"></i>
      <p>No upcoming tasks</p>
    `;
    container.appendChild(emptyState);
    return;
  }
  
  // Add each task to the list
  tasks.forEach(task => {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    
    // Format the due date
    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Get subject color (fallback to primary if not available)
    const subjectColor = task.subject ? task.subject.color : 'primary';
    
    listItem.innerHTML = `
      <div class="task-item">
        <div class="task-info">
          <h4>${task.title}</h4>
          <div class="task-meta">
            <span class="subject-badge" style="background-color: var(--${subjectColor}-color)">
              ${task.subject ? task.subject.name : 'No Subject'}
            </span>
            <span class="due-date">
              <i class="fas fa-calendar-alt"></i> ${formattedDate}
            </span>
          </div>
        </div>
        <div class="task-priority ${task.priority}">
          ${task.priority}
        </div>
      </div>
    `;
    
    container.appendChild(listItem);
  });
}

/**
 * Update the recent resources list on the dashboard
 * @param {Array} resources - Array of recent resources
 */
function updateRecentResourcesList(resources) {
  const container = document.getElementById('recent-resources-list');
  
  // Clear existing content
  container.innerHTML = '';
  
  if (resources.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="fas fa-folder"></i>
      <p>No recent resources</p>
    `;
    container.appendChild(emptyState);
    return;
  }
  
  // Add each resource to the list
  resources.forEach(resource => {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    
    // Get subject color (fallback to primary if not available)
    const subjectColor = resource.subject ? resource.subject.color : 'primary';
    
    // Get icon based on resource type
    let typeIcon;
    switch (resource.type) {
      case 'pdf':
        typeIcon = 'fas fa-file-pdf';
        break;
      case 'document':
        typeIcon = 'fas fa-file-word';
        break;
      case 'image':
        typeIcon = 'fas fa-file-image';
        break;
      case 'video':
        typeIcon = 'fas fa-file-video';
        break;
      case 'link':
        typeIcon = 'fas fa-link';
        break;
      default:
        typeIcon = 'fas fa-file';
    }
    
    listItem.innerHTML = `
      <div class="resource-item">
        <div class="resource-icon">
          <i class="${typeIcon}"></i>
        </div>
        <div class="resource-info">
          <h4>${resource.title}</h4>
          <div class="resource-meta">
            <span class="subject-badge" style="background-color: var(--${subjectColor}-color)">
              ${resource.subject ? resource.subject.name : 'No Subject'}
            </span>
            <span class="resource-type">
              <i class="fas fa-file-alt"></i> ${resource.type}
            </span>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(listItem);
  });
}

/**
 * Update the tasks by subject chart
 * @param {Array} data - Array of task counts by subject
 */
function updateTasksBySubjectChart(data) {
  const container = document.getElementById('tasks-by-subject-chart');
  
  // Clear existing content
  container.innerHTML = '';
  
  if (!data || data.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="fas fa-chart-pie"></i>
      <p>No data to display</p>
    `;
    container.appendChild(emptyState);
    return;
  }
  
  // Create canvas for the chart
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  // Extract data for the chart
  const labels = data.map(item => item.subjectName);
  const counts = data.map(item => item.count);
  const colors = data.map(item => {
    // Map color name to hex value
    switch (item.color) {
      case 'red': return '#e74a3b';
      case 'blue': return '#4e73df';
      case 'green': return '#1cc88a';
      case 'yellow': return '#f6c23e';
      case 'purple': return '#6f42c1';
      case 'orange': return '#fd7e14';
      case 'pink': return '#e83e8c';
      case 'teal': return '#20c9a6';
      default: return '#4e73df';
    }
  });
  
  // Create the chart
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        }
      }
    }
  });
}