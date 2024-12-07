# Documents
### Table of Contents
**[Folder Structure](#folder-structure)**<br>
**[Middlewares](#middlewares)**<br>

## Folder Structure

- `📁 ./addons`: Configuration files which used during deployment.
- `📁 ./docs`: Documents
- `📁 ./keys`: Keys for signing/encrypting data.
- `📁 ./src`: Project source
  - `📁 ./src/common`: Enums, classes for general purposes
  - `📁 ./src/core`: All core files of mechanisms such as Auth, Boost
  - `📁 ./src/database`: Database connection, models, schemas, repositories (which we use as pattern)
  - `📁 ./src/helpers`: Utilities
  - `📁 ./src/router`: All api routes
  - `📁 ./src/types`: All types/interfaces

## Middlewares

- `🔗 authentication`: Checks if the user is logged in
- `🔗 validator`: Validates the request [body, params, headers, query]
- `🔗 permissions`: Checks if the user has the selected permissions
- `🔗 authorization`: Checks if the user is authorized (by permissions)
- `🔗 fileUpload`: For upload purposes (only used at /upload)