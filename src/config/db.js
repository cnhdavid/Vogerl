// Import the Sequelize constructor from the sequelize package
const { Sequelize } = require('sequelize');

// Create a new instance of Sequelize for the connection
const sequelize = new Sequelize('database_name', 'username', 'password', {
    host: 'localhost', // Specifies the server hosting the MySQL database
    dialect: 'mysql'  // Defines the type of database, in this case, MySQL
});

// Attempt to authenticate (connect) to the database
sequelize.authenticate()
  .then(() => console.log('Connection has been established successfully.')) // If successful, log success message
  .catch(err => console.error('Unable to connect to the database:', err)); // If there is an error, log the error message

// Export the sequelize instance to use it in other parts of the application
module.exports = sequelize;
