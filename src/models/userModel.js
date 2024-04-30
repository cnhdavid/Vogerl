const { Sequelize, DataTypes } = require('sequelize'); // Importing Sequelize and DataTypes from sequelize
const sequelize = require('../config/db'); // Importing sequelize instance

const User = sequelize.define('User', { // Defining the User model
    username: { // Username attribute definition
        type: DataTypes.STRING, // Data type is string
        allowNull: false, // Username cannot be null
        unique: true // Username must be unique
    },
    email: { // Email attribute definition
        type: DataTypes.STRING, // Data type is string
        allowNull: false, // Email cannot be null
        unique: true // Email must be unique
    },
    password: { // Password attribute definition
        type: DataTypes.STRING, // Data type is string
        allowNull: false // Password cannot be null
    }
}, {
    tableName: 'users' // Setting the table name to 'users'
});

module.exports = User; // Exporting the User model
