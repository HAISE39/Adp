// Simple GitHub Admin Panel - Fixed
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.init();
    }

    async init() {
        console.log('Starting GitHub Admin...');
        
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.hideLoading();
        this.setupEventListeners();
        this.showSection('dashboard');
        
        // Test connection
        await this.testConnection();
    }

    async testConnection() {
        try {
            console.log('Testing token...');
            
            // Simple fetch dengan error handling
            const response = await fetch('https://api.github.com/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            if (response.status === 401) {
                throw new Error('TOKEN INVALID - Buat token baru di GitHub Settings > Developer settings > Personal access tokens');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('Success! User:', userData.login);
            
            this.showAlert(`✅ Connected as ${userData.login}`, 'success');
            await this.loadUserData();

        } catch (error) {
            console.error('Connection failed:', error);
            this.showAlert(`❌ ${error.message}`, 'danger');
        }
    }

    async loadUserData() {
        try {
            // Load user info
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!userResponse.ok) throw new Error('Failed to load user data');
            const userData = await userResponse.json();

            // Update user info
            document.getElementById('repo-count').textContent = userData.public_repos || '0';
            document.getElementById('followers-count').textContent = userData.followers || '0';
            document.getElementById('following-count').textContent = userData.following || '0';
            
            // Load avatar
            const avatar = document.getElementById('user-avatar');
            if (avatar && userData.avatar_url) {
                avatar.src = userData.avatar_url;
            }

            // Load repositories
            await this.loadRepositories();

        } catch (error) {
            console.error('Load data error:', error);
            this.showAlert('Failed to load data', 'warning');
        }
    }

    async loadRepositories() {
        try {
            this.showLoading('repo-list', 'Loading repositories...');

            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=100`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Failed to load repositories');

            const repos = await response.json();
            this.displayRepositories(repos);

        } catch (error) {
            console.error('Load repos error:', error);
            this.showError('repo-list', 'Failed to load repositories');
        }
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
                    <a href="${repo.html_url}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i> View
                    </a>
                </td>
            </tr>
        `).join('');

        container.innerHTML = reposHtml;
    }

    async createRepository() {
        const name = document.getElementById('repo-name').value;
        const description = document.getElementById('repo-desc').value;
        const isPrivate = document.getElementById('repo-visibility').value === 'private';

        if (!name) {
            this.showAlert('Please enter repository name', 'warning');
            return;
        }

        try {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

            const repoData = {
                name: name,
                description: description,
                private: isPrivate,
                auto_init: true
            };

            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
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
            this.showAlert(`✅ Repository "${name}" created!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh data
            await this.loadRepositories();

        } catch (error) {
            console.error('Create repo error:', error);
            this.showAlert(`❌ ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Create Repository';
        }
    }

    // Helper methods
    checkAuth() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    hideLoading() {
        document.getElementById('loading-screen').style.display = 'none';
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
        document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`).classList.add('active');

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
        if (sectionName === 'repositories') {
            this.loadRepositories();
        }

        this.closeMobileSidebar();
    }

    showLoading(elementId, message) {
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
                    <i class="bi bi-exclamation-triangle"></i>
                    <p class="mt-2">${message}</p>
                </div>
            `;
        }
    }

    showAlert(message, type) {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.main-content').insertBefore(alert, document.querySelector('.main-content').firstChild);
    }

    formatBytes(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }

    saveSettings() {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput.value) {
            this.token = tokenInput.value;
            localStorage.setItem('github_token', this.token);
            this.showAlert('Settings saved! Testing connection...', 'success');
            this.testConnection();
        }
    }
}

// Global functions
function showSection(sectionName) {
    window.admin.showSection(sectionName);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

function uploadFiles() {
    alert('Upload feature - Select files and repository first');
}

function uploadAndExtractZip() {
    alert('ZIP extract feature coming soon');
}

function saveSettings() {
    window.admin.saveSettings();
}

function testConnection() {
    window.admin.testConnection();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Initialize
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new GitHubAdminPanel();
    window.admin = admin;
});
