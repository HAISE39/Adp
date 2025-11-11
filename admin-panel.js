// GitHub Admin Panel - Public Data + Backend Solution
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.backendURL = 'https://your-vercel-app.vercel.app/api'; // Ganti dengan URL backend Anda
        this.init();
    }

    async init() {
        console.log('🚀 Starting GitHub Admin Panel...');
        
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.hideLoading();
        this.setupEventListeners();
        this.showSection('dashboard');
        
        // Load data dengan multiple approaches
        await this.loadDataWithFallback();
    }

    async loadDataWithFallback() {
        console.log('🔄 Loading data with fallback strategies...');
        
        const strategies = [
            this.loadWithBackend.bind(this),
            this.loadWithPublicAPI.bind(this),
            this.loadWithJSONP.bind(this)
        ];

        for (let strategy of strategies) {
            try {
                const success = await strategy();
                if (success) {
                    console.log('✅ Data loaded successfully with:', strategy.name);
                    return;
                }
            } catch (error) {
                console.log(`❌ ${strategy.name} failed:`, error.message);
            }
        }
        
        // Final fallback - demo data
        this.loadDemoData();
        this.showAlert('⚠️ Using demo data. Real GitHub features disabled.', 'warning');
    }

    async loadWithBackend() {
        try {
            console.log('Trying backend approach...');
            
            // Backend akan handle GitHub API calls
            const response = await fetch(`${this.backendURL}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    username: this.username
                })
            });

            if (!response.ok) throw new Error('Backend request failed');

            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            // Update UI dengan data real
            this.updateElementText('repo-count', data.public_repos || '0');
            this.updateElementText('followers-count', data.followers || '0');
            this.updateElementText('following-count', data.following || '0');
            
            if (data.avatar_url) {
                document.getElementById('user-avatar').src = data.avatar_url;
            }

            await this.loadRepositoriesWithBackend();
            return true;

        } catch (error) {
            console.error('Backend approach failed:', error);
            return false;
        }
    }

    async loadWithPublicAPI() {
        try {
            console.log('Trying public API approach...');
            
            // Hanya bisa baca data public
            const response = await fetch(`https://api.github.com/users/${this.username}`);
            
            if (!response.ok) throw new Error('Public API failed');

            const userData = await response.json();
            
            this.updateElementText('repo-count', userData.public_repos || '0');
            this.updateElementText('followers-count', userData.followers || '0');
            this.updateElementText('following-count', userData.following || '0');
            
            if (userData.avatar_url) {
                document.getElementById('user-avatar').src = userData.avatar_url;
            }

            await this.loadPublicRepositories();
            this.showAlert('✅ Loaded public data (read-only mode)', 'info');
            return true;

        } catch (error) {
            console.error('Public API failed:', error);
            return false;
        }
    }

    async loadWithJSONP() {
        // JSONP approach untuk bypass CORS (hanya untuk public data)
        return new Promise((resolve) => {
            console.log('Trying JSONP approach...');
            
            const callbackName = 'githubCallback_' + Date.now();
            window[callbackName] = (data) => {
                if (data && data.public_repos) {
                    this.updateElementText('repo-count', data.public_repos);
                    this.updateElementText('followers-count', data.followers);
                    this.updateElementText('following-count', data.following);
                    resolve(true);
                } else {
                    resolve(false);
                }
                delete window[callbackName];
            };

            const script = document.createElement('script');
            script.src = `https://api.github.com/users/${this.username}?callback=${callbackName}`;
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
            
            setTimeout(() => resolve(false), 5000);
        });
    }

    async loadRepositoriesWithBackend() {
        try {
            this.showLoading('repo-list', 'Loading repositories...');

            const response = await fetch(`${this.backendURL}/repos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    username: this.username
                })
            });

            if (!response.ok) throw new Error('Failed to load repos');

            const repos = await response.json();
            this.displayRepositories(repos);
            this.populateRepositoryDropdowns(repos);

        } catch (error) {
            console.error('Error loading repos via backend:', error);
            this.loadPublicRepositories();
        }
    }

    async loadPublicRepositories() {
        try {
            this.showLoading('repo-list', 'Loading public repositories...');

            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=50`);
            
            if (!response.ok) throw new Error('Failed to load public repos');

            const repos = await response.json();
            this.displayRepositories(repos);
            this.showAlert('📖 Public repositories loaded (read-only)', 'info');

        } catch (error) {
            console.error('Error loading public repos:', error);
            this.showDemoRepositories();
        }
    }

    async createRepository() {
        try {
            const name = document.getElementById('repo-name')?.value;
            const description = document.getElementById('repo-desc')?.value;
            const isPrivate = document.getElementById('repo-visibility')?.value === 'private';

            if (!name) {
                this.showAlert('Please enter repository name', 'warning');
                return;
            }

            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, true);

            // Gunakan backend untuk create repo
            const response = await fetch(`${this.backendURL}/create-repo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    name: name,
                    description: description,
                    private: isPrivate
                })
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to create repository');
            }

            this.showAlert(`✅ Repository "${name}" created successfully!`, 'success');
            document.getElementById('create-repo-form').reset();
            
            // Refresh data
            await this.loadRepositoriesWithBackend();

        } catch (error) {
            console.error('Error creating repository:', error);
            this.showAlert(`❌ ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#create-repo-form button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    async uploadFiles() {
        const repo = document.getElementById('repo-select')?.value;
        const files = document.getElementById('file-upload')?.files;
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
            this.showAlert('🔄 Uploading files via backend...', 'info');

            for (let file of files) {
                const content = await this.readFileAsBase64(file);
                
                const uploadResponse = await fetch(`${this.backendURL}/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: this.token,
                        username: this.username,
                        repo: repo,
                        file: file.name,
                        content: content.split(',')[1],
                        message: message
                    })
                });

                const result = await uploadResponse.json();
                
                if (!uploadResponse.ok || result.error) {
                    throw new Error(result.error || `Failed to upload ${file.name}`);
                }
            }

            this.showAlert(`✅ ${files.length} file(s) uploaded to ${repo}`, 'success');
            document.getElementById('file-upload').value = '';

        } catch (error) {
            console.error('Upload failed:', error);
            this.showAlert(`❌ Upload failed: ${error.message}`, 'danger');
        }
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
                        <a href="${repo.html_url}" target="_blank" class="btn btn-outline-success">
                            <i class="bi bi-github"></i>
                        </a>
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
            this.loadPublicRepositories();
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

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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
        console.log('Loading demo data...');
        this.updateElementText('repo-count', '12');
        this.updateElementText('followers-count', '24');
        this.updateElementText('following-count', '36');
        this.loadDemoRepositories();
    }

    loadDemoRepositories() {
        const demoRepos = [
            { name: 'my-project', description: 'Main project', private: false, updated_at: new Date(), size: 15480, html_url: 'https://github.com' },
            { name: 'docs', description: 'Documentation', private: false, updated_at: new Date(), size: 8120, html_url: 'https://github.com' }
        ];
        this.displayRepositories(demoRepos);
    }

    saveSettings() {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput?.value) {
            this.token = tokenInput.value;
            localStorage.setItem('github_token', this.token);
            this.showAlert('Settings saved!', 'success');
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
    alert('ZIP extract feature - Select a ZIP file to upload');
}

function saveSettings() {
    window.admin?.saveSettings();
}

function testConnection() {
    window.admin?.loadDataWithFallback();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function loadRepoFiles(repoName) {
    const explorer = document.getElementById('file-explorer');
    if (!repoName) {
        explorer.innerHTML = '<div class="text-center text-muted py-4"><p>Select a repository</p></div>';
        return;
    }
    
    explorer.innerHTML = `
        <div class="alert alert-info">
            File browser for <strong>${repoName}</strong> - Basic view
        </div>
        <div class="file-item">
            <i class="bi bi-file-earmark"></i> README.md
        </div>
        <div class="file-item">
            <i class="bi bi-folder"></i> src/
        </div>
        <div class="file-item">
            <i class="bi bi-file-earmark"></i> package.json
        </div>
    `;
}

// Initialize
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new GitHubAdminPanel();
    window.admin = admin;
});
