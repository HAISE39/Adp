// admin-panel.js - COMPLETE FILE MANAGER
class GitHubAdminPanel {
    constructor() {
        this.token = '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';
        this.username = 'HAISE39';
        this.backendURL = '';
        this.currentRepo = null;
        this.currentPath = '';
        this.init();
    }

    // ... (previous methods tetap sama)

    async loadRepoFiles(repoName, path = '') {
        if (!repoName) {
            this.showFileExplorerPlaceholder();
            return;
        }

        this.currentRepo = repoName;
        this.currentPath = path;

        try {
            this.showLoading('file-explorer', 'Loading files...');

            let files = [];
            
            if (this.backendURL) {
                // Use backend
                const response = await fetch(this.backendURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: this.token,
                        username: this.username,
                        action: 'get-content',
                        repo: repoName,
                        path: path
                    })
                });

                if (response.ok) {
                    files = await response.json();
                } else {
                    throw new Error('Backend failed');
                }
            } else {
                // Use public API (read-only)
                const apiUrl = `https://api.github.com/repos/${this.username}/${repoName}/contents/${path}`;
                const response = await fetch(apiUrl);
                
                if (response.ok) {
                    files = await response.json();
                } else {
                    throw new Error('Failed to load files');
                }
            }

            this.displayRepoFiles(files, repoName, path);

        } catch (error) {
            console.error('Error loading files:', error);
            this.showError('file-explorer', 'Failed to load files');
        }
    }

    displayRepoFiles(files, repoName, path) {
        const container = document.getElementById('file-explorer');
        if (!container) return;

        // Breadcrumb navigation
        const breadcrumbs = this.createBreadcrumb(repoName, path);
        
        // File list
        let filesHtml = '';
        
        if (!files || files.length === 0) {
            filesHtml = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-folder-x display-4"></i>
                    <p class="mt-2">This folder is empty</p>
                    ${this.backendURL ? `
                        <button class="btn btn-primary btn-sm mt-2" onclick="admin.showCreateFileModal('${repoName}', '${path}')">
                            <i class="bi bi-plus"></i> Add File
                        </button>
                    ` : ''}
                </div>
            `;
        } else {
            filesHtml = files.map(item => `
                <div class="file-item d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-${item.type === 'dir' ? 'folder' : 'file-earmark'} me-3 fs-5"></i>
                        <div>
                            <div class="file-name fw-bold">
                                ${item.type === 'dir' ? 
                                    `<a href="javascript:void(0)" onclick="admin.loadRepoFiles('${repoName}', '${item.path}')">${item.name}/</a>` : 
                                    item.name
                                }
                            </div>
                            <small class="text-muted">
                                ${item.type === 'file' ? this.formatBytes(item.size) : ''}
                                ${item.type === 'file' && item.download_url ? 
                                    `<a href="${item.download_url}" target="_blank" class="ms-2">View Raw</a>` : ''
                                }
                            </small>
                        </div>
                    </div>
                    <div class="btn-group">
                        ${this.backendURL ? `
                            ${item.type === 'file' ? `
                                <button class="btn btn-outline-primary btn-sm" onclick="admin.editFile('${repoName}', '${item.path}', '${item.sha}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="admin.deleteFile('${repoName}', '${item.path}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : `
                                <button class="btn btn-outline-danger btn-sm" onclick="admin.deleteFolder('${repoName}', '${item.path}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            `}
                        ` : `
                            <a href="${item.html_url}" target="_blank" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-github"></i>
                            </a>
                        `}
                    </div>
                </div>
            `).join('');
        }

        // Action buttons (only if backend available)
        const actionButtons = this.backendURL ? `
            <div class="d-flex gap-2 mb-3">
                <button class="btn btn-primary btn-sm" onclick="admin.showCreateFileModal('${repoName}', '${path}')">
                    <i class="bi bi-file-earmark-plus"></i> New File
                </button>
                <button class="btn btn-success btn-sm" onclick="admin.showCreateFolderModal('${repoName}', '${path}')">
                    <i class="bi bi-folder-plus"></i> New Folder
                </button>
                <button class="btn btn-info btn-sm" onclick="admin.showUploadModal('${repoName}', '${path}')">
                    <i class="bi bi-upload"></i> Upload Files
                </button>
            </div>
        ` : '';

        container.innerHTML = `
            ${breadcrumbs}
            ${actionButtons}
            <div class="file-list">
                ${filesHtml}
            </div>
        `;
    }

    createBreadcrumb(repoName, path) {
        const parts = path.split('/').filter(p => p);
        let breadcrumbHtml = `<nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <a href="javascript:void(0)" onclick="admin.loadRepoFiles('${repoName}', '')">
                        <i class="bi bi-house"></i> ${repoName}
                    </a>
                </li>`;
        
        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += (currentPath ? '/' : '') + part;
            const isLast = index === parts.length - 1;
            
            breadcrumbHtml += `
                <li class="breadcrumb-item ${isLast ? 'active' : ''}">
                    ${isLast ? part : `
                        <a href="javascript:void(0)" onclick="admin.loadRepoFiles('${repoName}', '${currentPath}')">
                            ${part}
                        </a>
                    `}
                </li>
            `;
        });
        
        breadcrumbHtml += `</ol></nav>`;
        return breadcrumbHtml;
    }

    showFileExplorerPlaceholder() {
        const container = document.getElementById('file-explorer');
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-folder display-1"></i>
                <h4 class="mt-3">Select a Repository</h4>
                <p>Choose a repository from the dropdown to browse files</p>
            </div>
        `;
    }

    // File Operations Modal
    showCreateFileModal(repoName, path) {
        const modalHtml = `
            <div class="modal fade" id="createFileModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create New File</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">File Path</label>
                                <input type="text" class="form-control" id="newFilePath" 
                                       value="${path ? path + '/' : ''}" placeholder="folder/filename.txt">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Content</label>
                                <textarea class="form-control" id="newFileContent" rows="10" 
                                          placeholder="Enter file content here..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Commit Message</label>
                                <input type="text" class="form-control" id="createFileMessage" 
                                       value="Add new file via Admin Panel">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="admin.createNewFile('${repoName}')">
                                Create File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHtml, 'createFileModal');
    }

    async createNewFile(repoName) {
        const filePath = document.getElementById('newFilePath').value;
        const content = document.getElementById('newFileContent').value;
        const message = document.getElementById('createFileMessage').value;

        if (!filePath || !content) {
            this.showAlert('Please fill in file path and content', 'warning');
            return;
        }

        try {
            const response = await fetch(this.backendURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    username: this.username,
                    action: 'create-file',
                    repo: repoName,
                    path: filePath,
                    content: content,
                    message: message
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create file');
            }

            this.hideModal('createFileModal');
            this.showAlert('✅ File created successfully!', 'success');
            await this.loadRepoFiles(repoName, this.currentPath);

        } catch (error) {
            console.error('Error creating file:', error);
            this.showAlert(`❌ Failed to create file: ${error.message}`, 'danger');
        }
    }

    async editFile(repoName, filePath, fileSha) {
        try {
            // Get current file content
            const response = await fetch(this.backendURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    username: this.username,
                    action: 'get-content',
                    repo: repoName,
                    path: filePath
                })
            });

            if (!response.ok) throw new Error('Failed to load file');

            const fileData = await response.json();
            const content = Buffer.from(fileData.content, 'base64').toString();

            const modalHtml = `
                <div class="modal fade" id="editFileModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit File: ${filePath}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Content</label>
                                    <textarea class="form-control" id="editFileContent" rows="15" 
                                              style="font-family: 'Courier New', monospace;">${content}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Commit Message</label>
                                    <input type="text" class="form-control" id="editFileMessage" 
                                           value="Update file via Admin Panel">
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" 
                                        onclick="admin.updateFile('${repoName}', '${filePath}')">
                                    Update File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.showModal(modalHtml, 'editFileModal');

        } catch (error) {
            console.error('Error loading file for edit:', error);
            this.showAlert('Failed to load file for editing', 'danger');
        }
    }

    async updateFile(repoName, filePath) {
        const content = document.getElementById('editFileContent').value;
        const message = document.getElementById('editFileMessage').value;

        try {
            const response = await fetch(this.backendURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    username: this.username,
                    action: 'update-file',
                    repo: repoName,
                    path: filePath,
                    content: content,
                    message: message
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update file');
            }

            this.hideModal('editFileModal');
            this.showAlert('✅ File updated successfully!', 'success');
            await this.loadRepoFiles(repoName, this.currentPath);

        } catch (error) {
            console.error('Error updating file:', error);
            this.showAlert(`❌ Failed to update file: ${error.message}`, 'danger');
        }
    }

    async deleteFile(repoName, filePath) {
        if (!confirm(`Are you sure you want to delete "${filePath}"?`)) return;

        try {
            const response = await fetch(this.backendURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    username: this.username,
                    action: 'delete-file',
                    repo: repoName,
                    path: filePath,
                    message: 'Delete file via Admin Panel'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete file');
            }

            this.showAlert('✅ File deleted successfully!', 'success');
            await this.loadRepoFiles(repoName, this.currentPath);

        } catch (error) {
            console.error('Error deleting file:', error);
            this.showAlert(`❌ Failed to delete file: ${error.message}`, 'danger');
        }
    }

    // Modal helper methods
    showModal(html, modalId) {
        // Remove existing modal
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) modal.hide();
    }

    // ... (sisanya methods tetap)
}

// Update global function
function loadRepoFiles(repoName) {
    window.admin?.loadRepoFiles(repoName);
}