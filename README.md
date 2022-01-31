# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

This application features method overrides for PUT and DELETE requests.

For each URL created, this application also features total view count, unique view count, a creation timestamp, and a log of every viewer.

## Final Product

!["User's URLs page"](https://github.com/andrewlpmcneill/tinyapp/blob/main/docs/urls-page.png?raw=true)

!["Edit URL page"](https://github.com/andrewlpmcneill/tinyapp/blob/main/docs/edit-url.png?raw=true)

!["Create account page"](https://github.com/andrewlpmcneill/tinyapp/blob/main/docs/create-account.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override
- morgan

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server (using the `npm start` command).
- Point your browser to localhost:8080 and start creating shortURLs!