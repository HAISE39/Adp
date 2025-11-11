// GitHub Admin Panel - 100% REAL API
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.baseURL = 'https://api.github.com';
        this.init();
    }

    async init() {
        console.log('🚀 Initializing REAL GitHub Admin Panel...');
        
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.hideLoading();
        this.setupEventListeners();
        this.updateUsernameDisplay();
        
        // Test connection first - REAL API call
        const connected = await this.testRealConnection();
        if (connected) {
            this.showSection('dashboard');
            this.showAlert('✅ Connected to REAL GitHub API', 'success');
        } else {
            this.showSection('settings');
            this.showAlert('❌ Cannot connect to GitHub. Check token.', 'danger');
        }
    }

    async testRealConnection() {
        try {
            console.log('🔐 Testing REAL GitHub connection...');
            
            const response = await fetch(`${this.baseURL}/user`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('REAL API Response Status:', response.status);
            
            if (response.status === 401) {
                throw new Error('Token INVALID - Buat token baru di GitHub Settings');
            }
            
            if (response.status === 403) {
                throw new Error('Rate limit exceeded - Tunggu 1 jam atau pakai token berbeda');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const userData = await response.json();
            console.log('REAL User Data:', userData);
            
            // Update UI dengan data REAL
            this.updateElementText('repo-count', userData.public_repos);
            this.updateElementText('followers-count', userData.followers);
            this.updateElementText('following-count', userData.following);
            this.updateElementText('gists-count', userData.public_gists);

            // Load repositories REAL
            await this.loadRealRepositories();
            
            return true;

        } catch (error) {
            console.error('REAL Connection FAILED:', error);
            this.showAlert(`❌ REAL API Error: ${error.message}`, 'danger');
            return false;
        }
    }

    async loadRealRepositories() {
        try {
            console.log('📂 Loading REAL repositories...');
            this.showLoading('repo-list', 'Loading REAL repositories from GitHub...');
            this.showLoading('recent-repos', 'Loading recent repos...');

            const response = await fetch(`${this.baseURL}/users/${this.username}/repos?sort=updated&per_page=100`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('REAL Repos Response:', response.status);

            if (!response.ok) {
                throw new Error(`Failed to load repos: ${response.status}`);
            }

            const repos = await response.json();
            console.log('REAL Repositories:', repos);

            // Tampilkan data REAL
            this.displayRealRepositories(repos);
            this.displayRecentRealRepositories(repos.slice(0, 5));
            this.populateRealDropdowns(repos);

        } catch (error) {
            console.error('Error loading REAL repos:', error);
            this.showError('repo-list', `Gagal load repository: ${error.message}`);
            this.showError('recent-repos', `Gagal load repository: ${error.message}`);
        }
    }

    displayRealRepositories(repos) {
        const container = document.getElementById('repo-list');
        if (!container) return;

        if (!repos || repos.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No repositories found on GitHub</td></tr>';
            return;
        }

        const reposHtml = repos.map(repo => `
            <tr>
                <td>
                    <i class="bi bi-folder${repo.private ? '-fill text-warning' : ''} me-2"></i>
                    <strong>${repo.name}</strong>
                    ${repo.private ? '<span class="badge bg-warning ms-2">Private</span>' : ''}
                    ${repo.fork ? '<span class="badge bg-info ms-1">Fork</span>' : ''}
                </td>
                <td>${repo.description || '<span class="text-muted">No description</span>'}</td>
                <td>${new Date(repo.updated_at).toLocaleDateString()}</td>
                <td>${this.formatBytes(repo.size * 1024)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <a href="${repo.html_url}" target="_blank" class="btn btn-outline-primary">
                            <i class="bi bi-github"></i>
                        </a>
                        <button class="btn btn-outline-success" onclick="admin.viewRealRepo('${repo.name}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="admin.deleteRealRepo('${repo.name}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = reposHtml;
    }

    displayRecentRealRepositories(repos) {
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
                    <strong><a href="${repo.html_url}" target="_blank">${repo.name}</a></strong>
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

    populateRealDropdowns(repos) {
        const dropdowns = ['repo-select', 'file-repo-select'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select repository</option>' +
                    repos.map(repo => `<option value="${repo.name}">${repo.name}</option>`).join('');
            }
        });
    }

    async createRealRepository() {
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

            console.log('Creating REAL repository:', repoData);

            const response = await fetch(`${this.baseURL}/user/repos`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(repoData)
            });

            console.log('Create repo REAL response:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create repository');
            }

            const newRepo = await response.json();
            console.log('REAL Repository created:', newRepo);
            
            this.showAlert(`✅ REAL Repository "${name}" created on GitHub!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh REAL data
            await this.loadRealRepositories();

        } catch (error) {
            console.error('Error creating REAL repository:', error);
            this.showAlert(`❌ REAL Error: ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    async uploadRealFiles() {
        const repo = document.getElementById('repo-select')?.value;
        const files = document.getElementById('file-upload')?.files;
        const message = document.getElementById('commit-message')?.value;

        if (!repo) {
            this.showAlert('Pilih repository dulu', 'warning');
            return;
        }

        if (!files || files.length === 0) {
            this.showAlert('Pilih file yang mau diupload', 'warning');
            return;
        }

        try {
            this.showAlert('🔄 Uploading files to REAL GitHub...', 'info');

            for (let file of files) {
                await this.uploadFileToRealRepo(repo, file, message);
            }

            this.showAlert(`✅ ${files.length} file(s) uploaded to ${repo}`, 'success');
            document.getElementById('file-upload').value = '';

        } catch (error) {
            console.error('Upload REAL failed:', error);
            this.showAlert(`❌ Upload failed: ${error.message}`, 'danger');
        }
    }

    async uploadFileToRealRepo(repo, file, message) {
        const content = await this.readFileAsBase64(file);
        
        const fileData = {
            message: message,
            content: content.split(',')[1]
        };

        const response = await fetch(`${this.baseURL}/repos/${this.username}/${repo}/contents/${file.name}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fileData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }

        return await response.json();
    }

    async loadRealRepoFiles(repoName) {
        if (!repoName) return;

        try {
            this.showLoading('file-explorer', 'Loading REAL files from GitHub...');

            const response = await fetch(`${this.baseURL}/repos/${this.username}/${repoName}/contents`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Failed to load files');

            const contents = await response.json();
            this.displayRealRepoFiles(contents, repoName);

        } catch (error) {
            console.error('Error loading REAL files:', error);
            this.showError('file-explorer', `Gagal load files: ${error.message}`);
        }
    }

    displayRealRepoFiles(contents, repoName) {
        const container = document.getElementById('file-explorer');
        if (!container) return;

        if (!contents || contents.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-folder-x display-4"></i>
                    <p class="mt-2">Repository ${repoName} is empty</p>
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
                    <a href="${item.html_url}" target="_blank">${item.name}</a>
                    ${item.type === 'dir' ? '/' : ''}
                </div>
                <div class="file-size">
                    ${item.size ? this.formatBytes(item.size) : ''}
                </div>
                <div>
                    <a href="${item.html_url}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-github"></i>
                    </a>
                </div>
            </div>
        `).join('');

        container.innerHTML = filesHtml;
    }

    async deleteRealRepo(repoName) {
        if (!confirm(`Yakin hapus repository "${repoName}"? Ini akan dihapus PERMANEN dari GitHub!`)) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/repos/${this.username}/${repoName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Failed to delete repository');

            this.showAlert(`✅ Repository "${repoName}" deleted from GitHub`, 'success');
            await this.loadRealRepositories();

        } catch (error) {
            console.error('Error deleting REAL repo:', error);
            this.showAlert(`❌ Delete failed: ${error.message}`, 'danger');
        }
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
                this.createRealRepository();
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
        document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`)?.classList.add('active');

        const titles = {
            'dashboard': 'Dashboard - REAL GitHub Data',
            'repositories': 'Repositories - REAL GitHub',
            'create-repo': 'Create Repository - REAL',
            'upload': 'Upload Files - REAL GitHub',
            'manage': 'File Manager - REAL',
            'settings': 'Settings'
        };
        document.getElementById('page-title').textContent = titles[sectionName] || 'Admin Panel';

        if (sectionName === 'repositories') {
            this.loadRealRepositories();
        }
        
        this.closeMobileSidebar();
    }

    updateUsernameDisplay() {
        document.getElementById('username-display').textContent = `Welcome, ${this.username}!`;
    }

    formatBytes(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                    <i class="bi bi-exclamation-triangle display-4"></i>
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
        
        document.querySelector('.main-content')?.insertBefore(alert, document.querySelector('.main-content').firstChild);
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        button.disabled = isLoading;
        button.innerHTML = isLoading ? 
            '<span class="spinner-border spinner-border-sm"></span> Creating...' : 
            '<i class="bi bi-plus-circle"></i> Create Repository';
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }

    viewRealRepo(repoName) {
        window.open(`https://github.com/${this.username}/${repoName}`, '_blank');
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = text;
    }

    saveSettings() {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput?.value) {
            this.token = tokenInput.value;
            localStorage.setItem('github_token', this.token);
            this.showAlert('✅ Settings saved! Reconnecting...', 'success');
            setTimeout(() => this.testRealConnection(), 1000);
        }
    }

    async testConnection() {
        await this.testRealConnection();
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
    window.admin?.uploadRealFiles();
}

function uploadAndExtractZip() {
    alert('ZIP extract coming soon - Upload individual files for now');
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
    window.admin?.loadRealRepoFiles(repoName);
}

// Initialize REAL admin panel
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new GitHubAdminPanel();
    window.admin = admin;
});
