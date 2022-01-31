// Produces a random alphanumeric (base 36) string of length 6
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
};

// Returns user object by email in a given database object
// Returns false if no user is found
const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user]['email'] === email) {
      return user;
    }
  }
  return false;
};

// Returns a list of URLs created by a specified user
const urlsForUser = (id, database) => {
  const userURLs = {};
  for (const url in database) {
    if (database[url]['userID'] === id) {
      userURLs[url] = database[url]['longURL'];
    }
  }
  return userURLs;
};

// Creates a timestamp, formatted to month/day/year, time
const timeStamp = () => {
  const milliseconds = Date.now(); // 1575909015000
  const dateObject = new Date(milliseconds);
  const formattedDate = dateObject.toLocaleString({month: 'long'});
  return formattedDate;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser, timeStamp };