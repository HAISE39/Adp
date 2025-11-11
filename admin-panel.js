// Real GitHub API Integration
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        this.init();
    }

    async init() {
        console.log('🚀 Initializing GitHub Admin Panel...');
        
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Hide loading screen
        this.hideLoading();

        // Setup and load data
        this.setupEventListeners();
        await this.loadUserProfile();
        this.updateUsernameDisplay();
        this.showSection('dashboard');
        
        console.log('✅ Admin Panel initialized successfully');
    }

    checkAuth() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            console.log('❌ User not authenticated');
            return false;
        }
        return true;
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Create repo form
        const createRepoForm = document.getElementById('create-repo-form');
        if (createRepoForm) {
            createRepoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createRepository();
            });
        }

        // Load repositories for dropdowns
        this.loadRepositoriesForDropdowns();
    }

    async loadUserProfile() {
        try {
            console.log('📊 Loading user profile...');
            const response = await fetch(`${this.baseURL}/users/${this.username}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const userData = await response.json();
            
            // Update stats
            this.updateElementText('repo-count', userData.public_repos);
            this.updateElementText('followers-count', userData.followers);
            this.updateElementText('following-count', userData.following);
            this.updateElementText('gists-count', userData.public_gists);

            // Update user info
            const avatar = document.getElementById('user-avatar');
            if (avatar && userData.avatar_url) {
                avatar.src = userData.avatar_url;
            }

            const bio = document.getElementById('user-bio');
            if (bio && userData.bio) {
                bio.textContent = userData.bio;
            }

            // Load recent repos
            await this.loadRecentRepositories();

        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            this.showError('Failed to load user profile');
        }
    }

    async loadRecentRepositories() {
        try {
            const response = await fetch(`${this.baseURL}/users/${this.username}/repos?sort=updated&per_page=5`, {
                headers: this.headers
            });

            if (!response.ok) throw new Error('Failed to fetch repositories');

            const repos = await response.json();
            this.displayRecentRepositories(repos);

        } catch (error) {
            console.error('Error loading recent repos:', error);
        }
    }

    displayRecentRepositories(repos) {
        const container = document.getElementById('recent-repos');
        if (!container) return;

        if (repos.length === 0) {
            container.innerHTML = '<p class="text-muted">No repositories found</p>';
            return;
        }

        const reposHtml = repos.map(repo => `
            <div class="file-item">
                <div class="file-icon">
                    <i class="bi bi-folder${repo.private ? '-fill text-warning' : ''}"></i>
                </div>
                <div class="file-name">
                    <strong>${repo.name}</strong>
                    <div class="text-muted small">${repo.description || 'No description'}</div>
                </div>
                <div class="file-size">
                    ${this.formatBytes(repo.size * 1024)}
                </div>
                <div>
                    <span class="badge">${repo.language || 'Code'}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = reposHtml;
    }

    async loadRepositories() {
        try {
            this.showLoading('repo-list', 'Loading repositories...');
            
            const response = await fetch(`${this.baseURL}/users/${this.username}/repos?sort=updated&per_page=100`, {
                headers: this.headers
            });

            if (!response.ok) throw new Error('Failed to fetch repositories');

            const repos = await response.json();
            this.displayRepositories(repos);

        } catch (error) {
            console.error('Error loading repositories:', error);
            this.showError('repo-list', 'Failed to load repositories');
        }
    }

    displayRepositories(repos) {
        const container = document.getElementById('repo-list');
        if (!container) return;

        if (repos.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No repositories found</td></tr>';
            return;
        }

        const reposHtml = repos.map(repo => `
            <tr>
                <td>
                    <i class="bi bi-folder${repo.private ? '-fill text-warning' : ''} me-2"></i>
                    <strong>${repo.name}</strong>
                    ${repo.private ? '<span class="badge bg-warning ms-2">Private</span>' : ''}
                </td>
                <td>${repo.description || '<span class="text-muted">No description</span>'}</td>
                <td>${new Date(repo.updated_at).toLocaleDateString()}</td>
                <td>${this.formatBytes(repo.size * 1024)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <a href="${repo.html_url}" target="_blank" class="btn btn-outline-primary">
                            <i class="bi bi-eye"></i>
                        </a>
                        <button class="btn btn-outline-success" onclick="admin.editRepo('${repo.name}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="admin.deleteRepo('${repo.name}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = reposHtml;
    }

    async loadRepositoriesForDropdowns() {
        try {
            const response = await fetch(`${this.baseURL}/users/${this.username}/repos`, {
                headers: this.headers
            });

            if (!response.ok) throw new Error('Failed to fetch repositories');

            const repos = await response.json();
            this.populateRepositoryDropdowns(repos);

        } catch (error) {
            console.error('Error loading repositories for dropdowns:', error);
        }
    }

    populateRepositoryDropdowns(repos) {
        const dropdowns = ['repo-select', 'file-repo-select'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select a repository</option>' +
                    repos.map(repo => `<option value="${repo.name}">${repo.name}</option>`).join('');
            }
        });
    }

    async createRepository() {
        const name = document.getElementById('repo-name')?.value;
        const description = document.getElementById('repo-desc')?.value;
        const isPrivate = document.getElementById('repo-visibility')?.value === 'private';
        const autoInit = document.getElementById('repo-readme')?.checked;

        if (!name) {
            this.showAlert('Please enter a repository name', 'warning');
            return;
        }

        try {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, true);

            const repoData = {
                name: name,
                description: description,
                private: isPrivate,
                auto_init: autoInit,
                gitignore_template: document.getElementById('repo-gitignore')?.checked ? 'Node' : null,
                license_template: document.getElementById('repo-license')?.checked ? 'mit' : null
            };

            const response = await fetch(`${this.baseURL}/user/repos`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(repoData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create repository');
            }

            const newRepo = await response.json();
            this.showAlert(`Repository "${name}" created successfully!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh repositories
            await this.loadRepositories();
            await this.loadRepositoriesForDropdowns();

        } catch (error) {
            console.error('Error creating repository:', error);
            this.showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    async uploadFiles() {
        const repo = document.getElementById('repo-select')?.value;
        const files = document.getElementById('file-upload')?.files;
        const path = document.getElementById('upload-path')?.value;
        const message = document.getElementById('commit-message')?.value;

        if (!repo) {
            this.showAlert('Please select a repository', 'warning');
            return;
        }

        if (!files || files.length === 0) {
            this.showAlert('Please select files to upload', 'warning');
            return;
        }

        if (!message) {
            this.showAlert('Please enter a commit message', 'warning');
            return;
        }

        try {
            this.showAlert('Starting upload process...', 'info');

            for (let file of files) {
                await this.uploadFileToRepo(repo, file, path, message);
            }

            this.showAlert(`Successfully uploaded ${files.length} file(s) to ${repo}`, 'success');
            document.getElementById('file-upload').value = '';

        } catch (error) {
            console.error('Error uploading files:', error);
            this.showAlert(`Upload failed: ${error.message}`, 'danger');
        }
    }

    async uploadFileToRepo(repo, file, path = '', message) {
        const filePath = path ? `${path}/${file.name}` : file.name;
        
        // Read file as base64
        const content = await this.readFileAsBase64(file);
        
        const fileData = {
            message: message,
            content: content.split(',')[1] // Remove data URL prefix
        };

        const response = await fetch(`${this.baseURL}/repos/${this.username}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(fileData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload file');
        }

        return await response.json();
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async uploadAndExtractZip() {
        this.showAlert('ZIP extraction feature coming soon!', 'info');
    }

    async loadRepoFiles(repoName) {
        if (!repoName) {
            document.getElementById('file-explorer').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-folder-x display-4"></i>
                    <p class="mt-2">Select a repository to browse files</p>
                </div>
            `;
            return;
        }

        try {
            this.showLoading('file-explorer', 'Loading files...');

            const response = await fetch(`${this.baseURL}/repos/${this.username}/${repoName}/contents`, {
                headers: this.headers
            });

            if (!response.ok) throw new Error('Failed to fetch repository contents');

            const contents = await response.json();
            this.displayRepoFiles(contents, repoName);

        } catch (error) {
            console.error('Error loading repo files:', error);
            this.showError('file-explorer', 'Failed to load files');
        }
    }

    displayRepoFiles(contents, repoName) {
        const container = document.getElementById('file-explorer');
        if (!container) return;

        if (!contents || contents.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-folder-x display-4"></i>
                    <p class="mt-2">This repository is empty</p>
                </div>
            `;
            return;
        }

        const filesHtml = contents.map(item => `
            <div class="file-item">
                <div class="file-icon">
                    <i class="bi bi-${item.type === 'dir' ? 'folder' : 'file-earmark'}"></i>
                </div>
                <div class="file-name">
                    ${item.name}
                    ${item.type === 'dir' ? '/' : ''}
                </div>
                <div class="file-size">
                    ${item.type === 'file' ? this.formatBytes(item.size) : ''}
                </div>
                <div>
                    <a href="${item.html_url}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                    </a>
                </div>
            </div>
        `).join('');

        container.innerHTML = filesHtml;
    }

    async testConnection() {
        try {
            this.showAlert('Testing connection to GitHub...', 'info');
            
            const response = await fetch(`${this.baseURL}/user`, {
                headers: this.headers
            });

            if (!response.ok) throw new Error('Connection failed');

            const userData = await response.json();
            this.showAlert(`✅ Connected successfully as ${userData.login}`, 'success');

        } catch (error) {
            console.error('Connection test failed:', error);
            this.showAlert('❌ Connection failed: ' + error.message, 'danger');
        }
    }

    saveSettings() {
        const token = document.getElementById('github-token')?.value;
        
        if (token) {
            this.token = token;
            this.headers.Authorization = `token ${token}`;
            this.showAlert('Settings saved successfully!', 'success');
        }
    }

    // Helper Methods
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active menu
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`)?.classList.add('active');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'repositories': 'Repositories',
            'create-repo': 'Create Repository',
            'upload': 'Upload Files',
            'manage': 'File Manager',
            'settings': 'Settings'
        };
        document.getElementById('page-title').textContent = titles[sectionName] || 'Admin Panel';

        // Load section data
        switch(sectionName) {
            case 'repositories':
                this.loadRepositories();
                break;
            case 'manage':
                this.loadRepositoriesForDropdowns();
                break;
        }

        // Close mobile sidebar
        this.closeMobileSidebar();
    }

    updateUsernameDisplay() {
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = `Welcome, ${this.username}!`;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-2">${message}</p>
                </div>
            `;
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle display-4"></i>
                    <p class="mt-2">${message}</p>
                </div>
            `;
        }
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to top of main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(alert, mainContent.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-plus-circle"></i> Create Repository';
        }
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }

    // Repository actions
    async editRepo(repoName) {
        this.showAlert(`Edit functionality for ${repoName} coming soon!`, 'info');
    }

    async deleteRepo(repoName) {
        if (!confirm(`Are you sure you want to delete repository "${repoName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/repos/${this.username}/${repoName}`, {
                method: 'DELETE',
                headers: this.headers
            });

            if (!response.ok) throw new Error('Failed to delete repository');

            this.showAlert(`Repository "${repoName}" deleted successfully`, 'success');
            await this.loadRepositories();
            await this.loadRepositoriesForDropdowns();

        } catch (error) {
            console.error('Error deleting repository:', error);
            this.showAlert(`Failed to delete repository: ${error.message}`, 'danger');
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
        localStorage.removeItem('isLoggedIn');
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

function testConnection() {
    if (window.admin) {
        window.admin.testConnection();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function loadRepoFiles(repoName) {
    if (window.admin) {
        window.admin.loadRepoFiles(repoName);
    }
}

// Initialize admin panel
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new GitHubAdminPanel();
    window.admin = admin;
});

// Close sidebar when clicking on overlay
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
        toggleSidebar();
    }
});