/**
 * Dashboard-specific functionality
 */
document.addEventListener('DOMContentLoaded', () => {
  // Dashboard initialization will be handled by the main app.js
  // This file is for dashboard-specific functions only
});

/**
 * Load and display task statistics
 */
async function loadTaskStats() {
  try {
    const stats = await API.tasks.getStats();
    updateTaskStats(stats);
  } catch (error) {
    console.error('Error loading task stats:', error);
    showToast('Error', 'Failed to load task statistics', 'error');
  }
}

/**
 * Load and display upcoming tasks
 */
async function loadUpcomingTasks() {
  try {
    const tasks = await API.tasks.getUpcoming(5);
    updateUpcomingTasksList(tasks);
  } catch (error) {
    console.error('Error loading upcoming tasks:', error);
    showToast('Error', 'Failed to load upcoming tasks', 'error');
  }
}

/**
 * Load and display recent resources
 */
async function loadRecentResources() {
  try {
    const resources = await API.resources.getRecent(3);
    updateRecentResourcesList(resources);
  } catch (error) {
    console.error('Error loading recent resources:', error);
    showToast('Error', 'Failed to load recent resources', 'error');
  }
}

/**
 * Load and display tasks by subject chart
 */
async function loadTasksBySubjectChart() {
  try {
    const data = await API.analytics.getTasksBySubject();
    updateTasksBySubjectChart(data);
  } catch (error) {
    console.error('Error loading tasks by subject chart:', error);
    showToast('Error', 'Failed to load chart data', 'error');
  }
}

/**
 * Refresh all dashboard data
 */
function refreshDashboard() {
  loadTaskStats();
  loadUpcomingTasks();
  loadRecentResources();
  loadTasksBySubjectChart();
}