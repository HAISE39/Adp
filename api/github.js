// api/github.js - Backend untuk handle GitHub API
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { token, username, action, ...data } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    let githubResponse;
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Admin-Panel'
    };

    switch (action) {
      case 'get-user':
        githubResponse = await fetch('https://api.github.com/user', { headers });
        break;
      
      case 'get-repos':
        githubResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, { headers });
        break;
      
      case 'create-repo':
        githubResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            private: data.private,
            auto_init: true
          })
        });
        break;
      
      case 'upload-file':
        githubResponse = await fetch(`https://api.github.com/repos/${username}/${data.repo}/contents/${data.file}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: data.message,
            content: data.content
          })
        });
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await githubResponse.json();
    
    if (!githubResponse.ok) {
      return res.status(githubResponse.status).json({ error: result.message || 'GitHub API error' });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}