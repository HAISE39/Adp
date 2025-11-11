// Admin Panel JavaScript
class GitHubAdminPanel {
    constructor() {
        this.token = localStorage.getItem('github_token');
        this.username = localStorage.getItem('github_username');
        this.currentRepo = null;
        this.init();
    }

    init() {
        console.log('Admin Panel Initializing...');
        
        // Check if user is logged in
        if (!this.checkAuth()) {
            console.log('Not authenticated, redirecting to login...');
            window.location.href = 'index.html';
            return;
        }

        console.log('User authenticated, setting up panel...');
        this.setupEventListeners();
        this.loadDashboard();
        this.updateUsernameDisplay();
        
        // Show dashboard by default
        this.showSection('dashboard');
    }

    checkAuth() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const savedUsername = localStorage.getItem('admin_username');
        
        console.log('Auth check:', { isLoggedIn, savedUsername });
        
        if (!isLoggedIn) {
            console.log('User not logged in');
            return false;
        }
        
        if (!savedUsername) {
            console.log('No username found');
            return false;
        }
        
        return true;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        try {
            // Sidebar navigation
            document.querySelectorAll('.sidebar-menu a').forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const section = href.substring(1);
                        console.log('Navigating to section:', section);
                        this.showSection(section);
                    }
                });
            });

            // Create repo form
            const createRepoForm = document.getElementById('create-repo-form');
            if (createRepoForm) {
                createRepoForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.createRepository();
                });
            }

            // Load repositories for dropdown
            this.loadRepositoriesForDropdown();
            
            console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    showSection(sectionName) {
        console.log('Showing section:', sectionName);
        
        try {
            // Hide all sections
            document.querySelectorAll('.page-section').forEach(section => {
                if (section.style) {
                    section.style.display = 'none';
                }
            });

            // Show selected section
            const targetSection = document.getElementById(sectionName);
            if (targetSection && targetSection.style) {
                targetSection.style.display = 'block';
            } else {
                console.error('Section not found:', sectionName);
                return;
            }

            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'repositories': 'Repositories',
                'create-repo': 'Create Repository',
                'upload': 'Upload Files',
                'manage': 'Manage Files',
                'settings': 'Settings'
            };
            
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = titles[sectionName] || 'Admin Panel';
            }

            // Load section-specific data
            switch(sectionName) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'repositories':
                    this.loadRepositories();
                    break;
                case 'manage':
                    this.loadFileExplorer();
                    break;
            }
        } catch (error) {
            console.error('Error showing section:', error);
        }
    }

    async loadDashboard() {
        try {
            console.log('Loading dashboard...');
            
            // Simulate loading data
            this.updateElementText('repo-count', '12');
            this.updateElementText('file-count', '156');
            this.updateElementText('commit-count', '89');
            this.updateElementText('storage-used', '45MB');

            // Load recent activities
            const activities = [
                'Created repository "my-project"',
                'Updated README.md in "docs"',
                'Pushed 3 new files to "main" branch',
                'Created new branch "feature-auth"'
            ];

            const activitiesHtml = activities.map(activity => 
                `<div class="activity-item mb-2">
                    <i class="bi bi-circle-fill text-success me-2" style="font-size: 8px;"></i>
                    ${activity}
                </div>`
            ).join('');

            this.updateElementHTML('recent-activities', activitiesHtml);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadRepositories() {
        try {
            console.log('Loading repositories...');
            
            // Show loading
            this.updateElementHTML('repo-list', `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `);

            // Simulate API call
            setTimeout(() => {
                const repos = [
                    { name: 'my-project', description: 'Main project repository', updated: '2024-01-15', size: '15MB' },
                    { name: 'docs', description: 'Documentation', updated: '2024-01-14', size: '8MB' },
                    { name: 'api-server', description: 'Backend API server', updated: '2024-01-13', size: '22MB' },
                    { name: 'mobile-app', description: 'React Native mobile application', updated: '2024-01-12', size: '35MB' }
                ];

                const reposHtml = repos.map(repo => `
                    <tr>
                        <td>
                            <i class="bi bi-folder me-2"></i>
                            <strong>${repo.name}</strong>
                        </td>
                        <td>${repo.description}</td>
                        <td>${repo.updated}</td>
                        <td>${repo.size}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary btn-action" onclick="admin.viewRepo('${repo.name}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success btn-action" onclick="admin.editRepo('${repo.name}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-action" onclick="admin.deleteRepo('${repo.name}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');

                this.updateElementHTML('repo-list', reposHtml);
            }, 1000);

        } catch (error) {
            console.error('Error loading repositories:', error);
            this.updateElementHTML('repo-list', `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        Error loading repositories
                    </td>
                </tr>
            `);
        }
    }

    async loadRepositoriesForDropdown() {
        console.log('Loading repositories for dropdown...');
        
        // Simulate loading repositories for dropdown
        setTimeout(() => {
            const repos = ['my-project', 'docs', 'api-server', 'mobile-app'];
            const dropdown = document.getElementById('repo-select');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select a repository</option>' +
                    repos.map(repo => `<option value="${repo}">${repo}</option>`).join('');
            }
        }, 500);
    }

    async createRepository() {
        const name = document.getElementById('repo-name')?.value;
        const description = document.getElementById('repo-desc')?.value;
        const isPrivate = document.getElementById('repo-private')?.checked;

        if (!name) {
            alert('Please enter a repository name');
            return;
        }

        try {
            console.log('Creating repository:', name);
            
            // Show loading
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Creating...';
                submitBtn.disabled = true;

                // Simulate API call
                setTimeout(() => {
                    alert(`Repository "${name}" created successfully!`);
                    const form = document.getElementById('create-repo-form');
                    if (form) form.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    // Refresh repositories list
                    this.loadRepositories();
                }, 1500);
            }

        } catch (error) {
            console.error('Error creating repository:', error);
            alert('Error creating repository: ' + error.message);
        }
    }

    async uploadFiles() {
        const repo = document.getElementById('repo-select')?.value;
        const files = document.getElementById('file-upload')?.files;
        const path = document.getElementById('upload-path')?.value;
        const message = document.getElementById('commit-message')?.value;

        if (!repo) {
            alert('Please select a repository');
            return;
        }

        if (!files || files.length === 0) {
            alert('Please select files to upload');
            return;
        }

        // Simulate upload process
        alert(`Uploading ${files.length} file(s) to ${repo}...`);
        console.log('Uploading files:', { repo, path, message, fileCount: files.length });
        
        // Here you would implement actual file upload logic
        // using GitHub API or your backend
    }

    async uploadAndExtractZip() {
        const repo = document.getElementById('repo-select')?.value;
        const zipFile = document.getElementById('zip-upload')?.files[0];
        const extractPath = document.getElementById('extract-path')?.value;

        if (!repo) {
            alert('Please select a repository');
            return;
        }

        if (!zipFile) {
            alert('Please select a ZIP file');
            return;
        }

        // Simulate ZIP extraction
        alert(`Extracting ${zipFile.name} to ${repo}${extractPath ? '/' + extractPath : ''}...`);
        console.log('Extracting ZIP:', { repo, extractPath, zipFile: zipFile.name });
    }

    viewRepo(repoName) {
        alert(`Viewing repository: ${repoName}`);
        console.log('View repo:', repoName);
        // Implement repository viewing logic
    }

    editRepo(repoName) {
        alert(`Editing repository: ${repoName}`);
        console.log('Edit repo:', repoName);
        // Implement repository editing logic
    }

    deleteRepo(repoName) {
        if (confirm(`Are you sure you want to delete repository "${repoName}"?`)) {
            alert(`Deleting repository: ${repoName}`);
            console.log('Delete repo:', repoName);
            // Implement repository deletion logic
        }
    }

    loadFileExplorer() {
        console.log('Loading file explorer...');
        
        // Simulate file explorer
        this.updateElementHTML('file-explorer', `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> 
                Select a repository to browse files
            </div>
            <div class="mb-3">
                <select class="form-control" onchange="admin.loadRepoFiles(this.value)">
                    <option value="">Select Repository</option>
                    <option value="my-project">my-project</option>
                    <option value="docs">docs</option>
                </select>
            </div>
        `);
    }

    loadRepoFiles(repoName) {
        if (!repoName) return;

        console.log('Loading repo files:', repoName);
        
        // Simulate file loading
        const files = [
            { name: 'README.md', type: 'file', size: '2.1KB' },
            { name: 'src/', type: 'folder', size: '-' },
            { name: 'package.json', type: 'file', size: '1.2KB' },
            { name: 'assets/', type: 'folder', size: '-' }
        ];

        const filesHtml = files.map(file => `
            <div class="file-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                    <i class="bi ${file.type === 'folder' ? 'bi-folder' : 'bi-file-earmark'} me-2"></i>
                    ${file.name}
                </div>
                <div>
                    <span class="text-muted me-3">${file.size}</span>
                    <button class="btn btn-sm btn-outline-primary me-1">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateElementHTML('file-explorer', `
            <div class="mb-3">
                <select class="form-control" onchange="admin.loadRepoFiles(this.value)">
                    <option value="">Select Repository</option>
                    <option value="my-project" ${repoName === 'my-project' ? 'selected' : ''}>my-project</option>
                    <option value="docs" ${repoName === 'docs' ? 'selected' : ''}>docs</option>
                </select>
            </div>
            <div class="file-list">
                ${filesHtml}
            </div>
        `);
    }

    saveSettings() {
        const token = document.getElementById('github-token')?.value;
        const username = document.getElementById('github-username')?.value;

        if (token) {
            localStorage.setItem('github_token', token);
        }
        if (username) {
            localStorage.setItem('github_username', username);
        }

        alert('Settings saved successfully!');
        console.log('Settings saved');
    }

    clearSettings() {
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_username');
        const tokenInput = document.getElementById('github-token');
        const usernameInput = document.getElementById('github-username');
        
        if (tokenInput) tokenInput.value = '';
        if (usernameInput) usernameInput.value = '';
        
        alert('Settings cleared!');
        console.log('Settings cleared');
    }

    updateUsernameDisplay() {
        const savedUsername = localStorage.getItem('admin_username');
        const usernameDisplay = document.getElementById('username-display');
        
        if (usernameDisplay && savedUsername) {
            usernameDisplay.textContent = `Welcome, ${savedUsername}!`;
        }
    }

    // Helper methods
    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateElementHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }
}

// Global functions
function showSection(sectionName) {
    if (window.admin) {
        window.admin.showSection(sectionName);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear login session but keep remember me data
        localStorage.removeItem('isLoggedIn');
        console.log('Logging out...');
        window.location.href = 'index.html';
    }
}

function uploadFiles() {
    if (window.admin) {
        window.admin.uploadFiles();
    }
}

function uploadAndExtractZip() {
    if (window.admin) {
        window.admin.uploadAndExtractZip();
    }
}

function saveSettings() {
    if (window.admin) {
        window.admin.saveSettings();
    }
}

function clearSettings() {
    if (window.admin) {
        window.admin.clearSettings();
    }
}

// Initialize admin panel when page loads
let admin;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Admin Panel');
    try {
        admin = new GitHubAdminPanel();
        window.admin = admin; // Make it globally available
        console.log('Admin Panel initialized successfully');
    } catch (error) {
        console.error('Error initializing Admin Panel:', error);
        // Don't redirect on error, just show error
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Error Loading Admin Panel</h4>
                    <p>There was an error loading the admin panel. Please check the console for details.</p>
                    <button onclick="window.location.href='index.html'" class="btn btn-primary">Return to Login</button>
                </div>
            </div>
        `;
    }
});

// Add error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});