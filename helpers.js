const generateRandomString = () => {
  // Produces a random alphanumeric (base 36) string of length 6
  return Math.random().toString(36).slice(2, 8);
};

const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user]['email'] === email) {
      return user;
    }
  }
  return false;
};

const urlsForUser = (id, database) => {
  const userURLs = {};
  for (const url in database) {
    if (database[url]['userID'] === id) {
      userURLs[url] = database[url]['longURL'];
    }
  }
  return userURLs;
};

const timeStamp = () => {
  const milliseconds = Date.now(); // 1575909015000
  const dateObject = new Date(milliseconds);
  const formattedDate = dateObject.toLocaleString({month: 'long'});
  return formattedDate;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser, timeStamp };