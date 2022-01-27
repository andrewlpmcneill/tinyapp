

const generateRandomString = () => {
  let output = '';
  while (output.length < 6) {
    const gate = Math.ceil(Math.random() * 2);
    let number = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let letter = '';
    let upperOrLower = Math.ceil(Math.random() * 2);
    
    switch (gate) {
    case 1:
      number = Math.floor(Math.random() * 10);
      output += String(number);
      break;
    case 2:
      letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (upperOrLower === 1) {
        output += letter;
        break;
      }
      output += letter.toUpperCase();
      break;
    }
  }
  return output;
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

module.exports = { generateRandomString, getUserByEmail, urlsForUser };