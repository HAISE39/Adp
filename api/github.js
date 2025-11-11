// api/github.js - COMPLETE VERSION
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, username, action, ...data } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'GitHub token required' });
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Admin-Panel'
    };

    let githubUrl, options = { headers };

    switch (action) {
      case 'get-user':
        githubUrl = 'https://api.github.com/user';
        break;
      
      case 'get-repos':
        githubUrl = `https://api.github.com/users/${username || 'HAISE39'}/repos?sort=updated&per_page=100`;
        break;
      
      case 'create-repo':
        githubUrl = 'https://api.github.com/user/repos';
        options.method = 'POST';
        options.headers = { ...headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          name: data.name,
          description: data.description,
          private: data.private || false,
          auto_init: true
        });
        break;

      case 'get-content':
        githubUrl = `https://api.github.com/repos/${username}/${data.repo}/contents/${data.path || ''}`;
        break;

      case 'create-file':
        githubUrl = `https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}`;
        options.method = 'PUT';
        options.headers = { ...headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          message: data.message || 'Create file via Admin Panel',
          content: Buffer.from(data.content).toString('base64')
        });
        break;

      case 'update-file':
        // Get file SHA first
        const shaResponse = await fetch(`https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}`, {
          headers: headers
        });
        
        if (!shaResponse.ok) {
          return res.status(shaResponse.status).json({ error: 'File not found' });
        }
        
        const fileInfo = await shaResponse.json();
        githubUrl = `https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}`;
        options.method = 'PUT';
        options.headers = { ...headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          message: data.message || 'Update file via Admin Panel',
          content: Buffer.from(data.content).toString('base64'),
          sha: fileInfo.sha
        });
        break;

      case 'delete-file':
        // Get file SHA first
        const deleteShaResponse = await fetch(`https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}`, {
          headers: headers
        });
        
        if (!deleteShaResponse.ok) {
          return res.status(deleteShaResponse.status).json({ error: 'File not found' });
        }
        
        const deleteFileInfo = await deleteShaResponse.json();
        githubUrl = `https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}`;
        options.method = 'DELETE';
        options.headers = { ...headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          message: data.message || 'Delete file via Admin Panel',
          sha: deleteFileInfo.sha
        });
        break;

      case 'upload-file':
        githubUrl = `https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}`;
        options.method = 'PUT';
        options.headers = { ...headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          message: data.message || 'Upload file via Admin Panel',
          content: data.content
        });
        break;

      case 'create-folder':
        // Create folder by creating a placeholder file
        githubUrl = `https://api.github.com/repos/${username}/${data.repo}/contents/${data.path}/.gitkeep`;
        options.method = 'PUT';
        options.headers = { ...headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          message: data.message || 'Create folder via Admin Panel',
          content: Buffer.from('# Folder placeholder').toString('base64')
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    console.log('GitHub API Call:', action, githubUrl);
    
    const response = await fetch(githubUrl, options);
    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: result.message || `GitHub API error: ${response.status}`,
        details: result
      });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}