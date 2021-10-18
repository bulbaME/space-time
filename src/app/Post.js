const post = async (path, data) => fetch(path, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
});

module.exports = post;