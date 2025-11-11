// GitHub Admin Panel - Debug Version
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
        console.log('Token:', this.token);
        
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.hideLoading();
        this.setupEventListeners();
        
        // Test connection dengan debug detail
        await this.testConnectionDetailed();
        this.updateUsernameDisplay();
        this.showSection('dashboard');
    }

    async testConnectionDetailed() {
        try {
            console.log('🔍 Testing GitHub connection...');
            console.log('API URL:', `${this.baseURL}/user`);
            console.log('Headers:', this.headers);

            const response = await fetch(`${this.baseURL}/user`, {
                headers: this.headers
            });

            console.log('Response Status:', response.status);
            console.log('Response OK:', response.ok);

            if (response.status === 401) {
                const errorText = await response.text();
                console.log('Error Response:', errorText);
                throw new Error('Token invalid or expired - Status 401');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('✅ Connected to GitHub as:', userData.login);
            console.log('User Data:', userData);
            
            this.showAlert(`✅ Connected as ${userData.login}`, 'success');
            return true;

        } catch (error) {
            console.error('❌ Connection failed:', error);
            console.error('Error details:', error.message);
            
            // Show detailed error
            let errorMsg = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMsg = 'Network error - Check internet connection';
            } else if (error.message.includes('401')) {
                errorMsg = 'Token invalid/expired. Generate new token at: GitHub Settings → Developer settings → Personal access tokens';
            }
            
            this.showAlert(`❌ Connection failed: ${errorMsg}`, 'danger');
            return false;
        }
    }

    async loadUserProfile() {
        try {
            console.log('📊 Loading user profile...');
            const response = await fetch(`${this.baseURL}/users/${this.username}`, {
                headers: this.headers
            });

            console.log('Profile Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const userData = await response.json();
            console.log('User Profile:', userData);
            
            // Update stats
            this.updateElementText('repo-count', userData.public_repos || '0');
            this.updateElementText('followers-count', userData.followers || '0');
            this.updateElementText('following-count', userData.following || '0');
            this.updateElementText('gists-count', userData.public_gists || '0');

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
            this.showError('Failed to load user profile: ' + error.message);
            
            // Load demo data as fallback
            this.loadDemoData();
        }
    }

    async loadRecentRepositories() {
        try {
            console.log('📁 Loading recent repositories...');
            const response = await fetch(`${this.baseURL}/users/${this.username}/repos?sort=updated&per_page=5`, {
                headers: this.headers
            });

            console.log('Repos Response Status:', response.status);

            if (!response.ok) throw new Error('Failed to fetch repositories');

            const repos = await response.json();
            console.log('Recent Repos:', repos);
            this.displayRecentRepositories(repos);

        } catch (error) {
            console.error('Error loading recent repos:', error);
            this.showDemoRepositories();
        }
    }

    async loadRepositories() {
        try {
            this.showLoading('repo-list', 'Loading repositories...');
            
            console.log('📂 Loading all repositories...');
            const response = await fetch(`${this.baseURL}/users/${this.username}/repos?sort=updated&per_page=100`, {
                headers: this.headers
            });

            console.log('All Repos Response Status:', response.status);

            if (!response.ok) throw new Error('Failed to fetch repositories');

            const repos = await response.json();
            console.log('All Repositories:', repos);
            this.displayRepositories(repos);

        } catch (error) {
            console.error('Error loading repositories:', error);
            this.showError('repo-list', 'Failed to load repositories: ' + error.message);
            this.showDemoRepositories();
        }
    }

    // Demo data untuk testing
    loadDemoData() {
        console.log('📝 Loading demo data...');
        this.updateElementText('repo-count', '8');
        this.updateElementText('followers-count', '12');
        this.updateElementText('following-count', '24');
        this.updateElementText('gists-count', '5');
    }

    showDemoRepositories() {
        console.log('📝 Showing demo repositories...');
        
        const demoRepos = [
            { name: 'my-project', description: 'Main project repository', private: false, updated_at: new Date().toISOString(), size: 15480, language: 'JavaScript' },
            { name: 'docs', description: 'Project documentation', private: false, updated_at: new Date().toISOString(), size: 8120, language: 'Markdown' },
            { name: 'api-server', description: 'Backend API server', private: true, updated_at: new Date().toISOString(), size: 22500, language: 'Python' },
            { name: 'mobile-app', description: 'React Native application', private: false, updated_at: new Date().toISOString(), size: 35120, language: 'TypeScript' }
        ];

        this.displayRepositories(demoRepos);
        
        const recentContainer = document.getElementById('recent-repos');
        if (recentContainer) {
            this.displayRecentRepositories(demoRepos.slice(0, 3));
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
        const createRepoForm = document.getElementById('create-repo-form');
        if (createRepoForm) {
            createRepoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createRepository();
            });
        }

        // Load repositories for dropdown
        this.loadRepositoriesForDropdowns();
    }

    async loadRepositoriesForDropdowns() {
        try {
            const response = await fetch(`${this.baseURL}/users/${this.username}/repos`, {
                headers: this.headers
            });

            if (response.ok) {
                const repos = await response.json();
                this.populateRepositoryDropdowns(repos);
            } else {
                // Use demo data if API fails
                this.populateRepositoryDropdowns([
                    { name: 'my-project' },
                    { name: 'docs' },
                    { name: 'api-server' },
                    { name: 'mobile-app' }
                ]);
            }

        } catch (error) {
            console.error('Error loading repositories for dropdowns:', error);
            // Use demo data
            this.populateRepositoryDropdowns([
                { name: 'my-project' },
                { name: 'docs' },
                { name: 'api-server' },
                { name: 'mobile-app' }
            ]);
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
        document.getElementById('page-title').textContent = titles[ectionName] || 'Admin Panel';

        // Load section data
        switch(sectionName) {
            case 'dashboard':
                this.loadUserProfile();
                break;
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
                    <button class="btn btn-primary btn-sm" onclick="admin.showSection('settings')">
                        Check Settings
                    </button>
                </div>
            `;
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
        }
        
        // Auto remove after 8 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 8000);
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }

    // Repository actions
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

            console.log('Creating repository:', repoData);

            const response = await fetch(`${this.baseURL}/user/repos`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(repoData)
            });

            console.log('Create repo response:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create repository');
            }

            const newRepo = await response.json();
            this.showAlert(`✅ Repository "${name}" created successfully!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh repositories
            await this.loadRepositories();
            await this.loadRepositoriesForDropdowns();

        } catch (error) {
            console.error('Error creating repository:', error);
            this.showAlert(`❌ Error: ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
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

    viewRepo(repoName) {
        window.open(`https://github.com/${this.username}/${repoName}`, '_blank');
    }

    editRepo(repoName) {
        this.showAlert(`Edit repository: ${repoName} - Open in GitHub to edit`, 'info');
    }

    deleteRepo(repoName) {
        this.showAlert(`Delete repository: ${repoName} - Feature coming soon`, 'warning');
    }

    async testConnection() {
        await this.testConnectionDetailed();
    }

    saveSettings() {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput && tokenInput.value) {
            this.token = tokenInput.value;
            this.headers.Authorization = `token ${this.token}`;
            localStorage.setItem('github_token', this.token);
            this.showAlert('✅ Settings saved successfully!', 'success');
            this.testConnection();
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
