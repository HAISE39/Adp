// GitHub Admin Panel - Simple Working Version
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.baseURL = 'https://api.github.com';
        this.init();
    }

    async init() {
        console.log('🚀 Initializing GitHub Admin Panel...');
        
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.hideLoading();
        this.setupEventListeners();
        this.updateUsernameDisplay();
        this.showSection('dashboard');
        
        // Load data
        await this.loadAllData();
    }

    checkAuth() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    setupEventListeners() {
        const createRepoForm = document.getElementById('create-repo-form');
        if (createRepoForm) {
            createRepoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createRepository();
            });
        }
    }

    async loadAllData() {
        try {
            // Test connection dulu
            const userData = await this.githubAPI('/user');
            if (userData) {
                console.log('✅ Connected as:', userData.login);
                this.showAlert(`✅ Connected to GitHub as ${userData.login}`, 'success');
                
                // Load user profile
                await this.loadUserProfile();
                
                // Load repositories
                await this.loadRepositories();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showAlert('⚠️ Using demo data. Check token in Settings if needed.', 'warning');
            this.loadDemoData();
        }
    }

    async githubAPI(endpoint) {
        try {
            console.log(`🔍 Calling GitHub API: ${endpoint}`);
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Response status: ${response.status}`);

            if (response.status === 401) {
                throw new Error('Token invalid or expired');
            }
            
            if (response.status === 403) {
                throw new Error('API rate limit exceeded or token permissions insufficient');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error(`GitHub API error for ${endpoint}:`, error);
            throw error;
        }
    }

    async loadUserProfile() {
        try {
            const userData = await this.githubAPI('/user');
            const userRepos = await this.githubAPI('/user/repos?per_page=100');
            
            // Update stats
            this.updateElementText('repo-count', userData.public_repos || '0');
            this.updateElementText('followers-count', userData.followers || '0');
            this.updateElementText('following-count', userData.following || '0');
            this.updateElementText('gists-count', userData.public_gists || '0');

            // Update avatar
            const avatar = document.getElementById('user-avatar');
            if (avatar && userData.avatar_url) {
                avatar.src = userData.avatar_url;
            }

            // Update bio
            const bio = document.getElementById('user-bio');
            if (bio) {
                bio.textContent = userData.bio || 'GitHub User';
            }

            // Display recent repos
            this.displayRecentRepositories(userRepos.slice(0, 5));

        } catch (error) {
            console.error('Error loading user profile:', error);
            throw error;
        }
    }

    async loadRepositories() {
        try {
            this.showLoading('repo-list', 'Loading repositories...');
            
            const repos = await this.githubAPI('/user/repos?sort=updated&per_page=100');
            this.displayRepositories(repos);
            
            // Populate dropdowns
            this.populateRepositoryDropdowns(repos);

        } catch (error) {
            console.error('Error loading repositories:', error);
            this.showError('repo-list', 'Failed to load repositories');
            this.loadDemoRepositories();
        }
    }

    displayRecentRepositories(repos) {
        const container = document.getElementById('recent-repos');
        if (!container) return;

        if (!repos || repos.length === 0) {
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

    displayRepositories(repos) {
        const container = document.getElementById('repo-list');
        if (!container) return;

        if (!repos || repos.length === 0) {
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
                        <button class="btn btn-outline-primary" onclick="admin.viewRepo('${repo.name}')">
                            <i class="bi bi-eye"></i>
                        </button>
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
                auto_init: autoInit
            };

            const response = await fetch(`${this.baseURL}/user/repos`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(repoData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create repository');
            }

            const newRepo = await response.json();
            this.showAlert(`✅ Repository "${name}" created successfully!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh data
            await this.loadAllData();

        } catch (error) {
            console.error('Error creating repository:', error);
            this.showAlert(`❌ Error: ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Demo data fallback
    loadDemoData() {
        console.log('📝 Loading demo data...');
        this.updateElementText('repo-count', '8');
        this.updateElementText('followers-count', '15');
        this.updateElementText('following-count', '22');
        this.updateElementText('gists-count', '3');
        this.loadDemoRepositories();
    }

    loadDemoRepositories() {
        const demoRepos = [
            { 
                name: 'my-project', 
                description: 'Main project repository', 
                private: false, 
                updated_at: new Date().toISOString(), 
                size: 15480, 
                language: 'JavaScript' 
            },
            { 
                name: 'docs', 
                description: 'Project documentation', 
                private: false, 
                updated_at: new Date().toISOString(), 
                size: 8120, 
                language: 'Markdown' 
            },
            { 
                name: 'api-server', 
                description: 'Backend API server', 
                private: true, 
                updated_at: new Date().toISOString(), 
                size: 22500, 
                language: 'Python' 
            }
        ];

        this.displayRepositories(demoRepos);
        this.displayRecentRepositories(demoRepos);
        this.populateRepositoryDropdowns(demoRepos);
    }

    // Helper methods
    showSection(sectionName) {
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`)?.classList.add('active');

        const titles = {
            'dashboard': 'Dashboard',
            'repositories': 'Repositories',
            'create-repo': 'Create Repository',
            'upload': 'Upload Files',
            'manage': 'File Manager',
            'settings': 'Settings'
        };
        document.getElementById('page-title').textContent = titles[sectionName] || 'Admin Panel';

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
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
        }
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-plus-circle"></i> Create Repository';
        }
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }

    viewRepo(repoName) {
        window.open(`https://github.com/${this.username}/${repoName}`, '_blank');
    }

    editRepo(repoName) {
        this.showAlert(`Edit: ${repoName} - Open in GitHub to edit details`, 'info');
    }

    deleteRepo(repoName) {
        this.showAlert(`Delete: ${repoName} - Feature coming soon`, 'warning');
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    saveSettings() {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput && tokenInput.value) {
            this.token = tokenInput.value;
            localStorage.setItem('github_token', this.token);
            this.showAlert('✅ Settings saved! Testing connection...', 'success');
            
            // Test new token
            setTimeout(() => {
                this.loadAllData();
            }, 1000);
        }
    }

    async testConnection() {
        try {
            const userData = await this.githubAPI('/user');
            this.showAlert(`✅ Connection successful! Logged in as ${userData.login}`, 'success');
        } catch (error) {
            this.showAlert(`❌ Connection failed: ${error.message}`, 'danger');
        }
    }
}

// Global functions
function showSection(sectionName) {
    window.admin?.showSection(sectionName);
}

function logout() {
    if (confirm('Logout?')) {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

function uploadFiles() {
    alert('Upload feature coming soon!');
}

function uploadAndExtractZip() {
    alert('ZIP extract feature coming soon!');
}

function saveSettings() {
    window.admin?.saveSettings();
}

function testConnection() {
    window.admin?.testConnection();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function loadRepoFiles(repoName) {
    // Simple file browser
    const explorer = document.getElementById('file-explorer');
    if (!repoName) {
        explorer.innerHTML = '<div class="text-center text-muted py-4"><p>Select a repository</p></div>';
        return;
    }
    
    explorer.innerHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i>
            File browser for <strong>${repoName}</strong> - Basic version
        </div>
        <div class="file-item">
            <i class="bi bi-file-earmark"></i> README.md
        </div>
        <div class="file-item">
            <i class="bi bi-folder"></i> src/
        </div>
    `;
}

// Initialize
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new GitHubAdminPanel();
    window.admin = admin;
});
