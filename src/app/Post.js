const post = async (path, data) => fetch('http://localhost:2007' + path, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
});

module.exports = post;