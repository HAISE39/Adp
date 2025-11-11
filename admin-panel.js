// GitHub Admin Panel - Fixed based on your working bot code
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.init();
    }

    async init() {
        console.log('🚀 Starting Admin Panel...');
        
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.hideLoading();
        this.setupEventListeners();
        this.showSection('dashboard');
        
        // Test connection dengan approach sama seperti bot
        await this.testConnection();
    }

    async testConnection() {
        try {
            console.log('🔐 Testing GitHub connection...');
            
            // Gunakan approach persis seperti di bot
            const response = await fetch('https://api.github.com/user', {
                method: 'GET',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHub-Admin-Panel' // Wajib untuk browser
                }
            });

            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            if (response.status === 401) {
                throw new Error('Token invalid - Status 401 Unauthorized');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('✅ Success! User:', userData);
            
            this.showAlert(`✅ Connected as ${userData.login}`, 'success');
            await this.loadUserData(userData);

        } catch (error) {
            console.error('❌ Connection failed:', error);
            
            // Coba approach alternatif untuk bypass CORS
            await this.tryAlternativeApproach(error);
        }
    }

    async tryAlternativeApproach(originalError) {
        console.log('🔄 Trying alternative approach...');
        
        try {
            // Approach 1: Gunakan proxy CORS
            const proxyResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.github.com/user`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHub-Admin-Panel',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (proxyResponse.ok) {
                const userData = await proxyResponse.json();
                this.showAlert(`✅ Connected via proxy as ${userData.login}`, 'success');
                await this.loadUserData(userData);
                return;
            }

            // Approach 2: Gunakan GitHub tanpa auth untuk public data
            const publicResponse = await fetch(`https://api.github.com/users/${this.username}`);
            if (publicResponse.ok) {
                const userData = await publicResponse.json();
                this.showAlert('⚠️ Using public data only (read-only)', 'warning');
                this.loadPublicData(userData);
                return;
            }

            // Jika semua gagal
            throw originalError;

        } catch (proxyError) {
            console.error('Alternative approach failed:', proxyError);
            this.showAlert(`❌ All methods failed: ${originalError.message}`, 'danger');
            this.loadDemoData(); // Fallback ke demo
        }
    }

    async loadUserData(userData) {
        try {
            // Update user info
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
            if (bio && userData.bio) {
                bio.textContent = userData.bio;
            }

            // Load repositories
            await this.loadRepositories();

        } catch (error) {
            console.error('Error loading user data:', error);
            this.showAlert('Error loading additional data', 'warning');
        }
    }

    async loadRepositories() {
        try {
            this.showLoading('repo-list', 'Loading repositories from GitHub...');

            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=100`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHub-Admin-Panel'
                }
            });

            console.log('Repos response status:', response.status);

            if (!response.ok) {
                throw new Error(`Failed to load repos: ${response.status}`);
            }

            const repos = await response.json();
            console.log('Loaded repositories:', repos.length);
            
            this.displayRepositories(repos);
            this.populateRepositoryDropdowns(repos);

        } catch (error) {
            console.error('Error loading repositories:', error);
            this.showError('repo-list', 'Failed to load repositories');
            this.loadDemoRepositories();
        }
    }

    async createRepository() {
        const name = document.getElementById('repo-name')?.value;
        const description = document.getElementById('repo-desc')?.value;
        const isPrivate = document.getElementById('repo-visibility')?.value === 'private';
        const autoInit = document.getElementById('repo-readme')?.checked;

        if (!name) {
            this.showAlert('Please enter repository name', 'warning');
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

            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'GitHub-Admin-Panel'
                },
                body: JSON.stringify(repoData)
            });

            console.log('Create repo response:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create repository');
            }

            const newRepo = await response.json();
            console.log('Repository created:', newRepo);
            
            this.showAlert(`✅ Repository "${name}" created successfully!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh data
            await this.loadRepositories();

        } catch (error) {
            console.error('Error creating repository:', error);
            this.showAlert(`❌ Error: ${error.message}`, 'danger');
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

        try {
            this.showAlert('🔄 Uploading files to GitHub...', 'info');

            for (let file of files) {
                await this.uploadFileToRepo(repo, file, path, message);
            }

            this.showAlert(`✅ ${files.length} file(s) uploaded to ${repo}`, 'success');
            document.getElementById('file-upload').value = '';

        } catch (error) {
            console.error('Upload failed:', error);
            this.showAlert(`❌ Upload failed: ${error.message}`, 'danger');
        }
    }

    async uploadFileToRepo(repo, file, path = '', message) {
        const filePath = path ? `${path}/${file.name}` : file.name;
        
        // Read file as base64
        const content = await this.readFileAsBase64(file);
        
        const fileData = {
            message: message,
            content: content.split(',')[1]
        };

        const response = await fetch(`https://api.github.com/repos/${this.username}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'GitHub-Admin-Panel'
            },
            body: JSON.stringify(fileData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload file');
        }

        return await response.json();
    }

    // Helper methods
    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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

    // Basic methods
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
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionName);
        if (targetSection) targetSection.style.display = 'block';

        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`);
        if (activeLink) activeLink.classList.add('active');

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

    formatBytes(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        button.disabled = isLoading;
        button.innerHTML = isLoading ? 
            '<span class="spinner-border spinner-border-sm"></span> Creating...' : 
            '<i class="bi bi-plus-circle"></i> Create Repository';
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = text;
    }

    // Demo data fallback
    loadDemoData() {
        console.log('Loading demo data as fallback...');
        this.updateElementText('repo-count', '8');
        this.updateElementText('followers-count', '15');
        this.updateElementText('following-count', '22');
        this.loadDemoRepositories();
    }

    loadDemoRepositories() {
        const demoRepos = [
            { name: 'my-project', description: 'Main project', private: false, updated_at: new Date(), size: 15480, html_url: '#' },
            { name: 'docs', description: 'Documentation', private: false, updated_at: new Date(), size: 8120, html_url: '#' }
        ];
        this.displayRepositories(demoRepos);
    }

    loadPublicData(userData) {
        this.updateElementText('repo-count', userData.public_repos || '0');
        this.updateElementText('followers-count', userData.followers || '0');
        this.updateElementText('following-count', userData.following || '0');
        // Untuk public data, kita hanya bisa baca repository public
        this.loadPublicRepositories();
    }

    async loadPublicRepositories() {
        try {
            const response = await fetch(`https://api.github.com/users/${this.username}/repos`);
            if (response.ok) {
                const repos = await response.json();
                this.displayRepositories(repos);
            }
        } catch (error) {
            this.loadDemoRepositories();
        }
    }

    editRepo(repoName) {
        this.showAlert(`Edit ${repoName} - Feature coming soon`, 'info');
    }

    async deleteRepo(repoName) {
        if (!confirm(`Delete repository "${repoName}"?`)) return;
        this.showAlert(`Delete ${repoName} - Feature coming soon`, 'warning');
    }

    saveSettings() {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput?.value) {
            this.token = tokenInput.value;
            localStorage.setItem('github_token', this.token);
            this.showAlert('Settings saved! Reconnecting...', 'success');
            this.testConnection();
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
    window.admin?.uploadFiles();
}

function uploadAndExtractZip() {
    alert('ZIP extract coming soon');
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
    // Basic file browser
    const explorer = document.getElementById('file-explorer');
    if (!repoName) {
        explorer.innerHTML = '<div class="text-center text-muted py-4"><p>Select a repository</p></div>';
        return;
    }
    
    explorer.innerHTML = `
        <div class="alert alert-info">
            File browser for <strong>${repoName}</strong>
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
