const { DataTypes } = require('sequelize'); // Importing DataTypes from sequelize
const sequelize = require('../config/db'); // Importing sequelize instance

const Post = sequelize.define('Post', { // Defining the Post model
    // Model attributes are defined here
    title: { // Title attribute definition
        type: DataTypes.STRING, // Data type is string
        allowNull: false // Title cannot be null
    },
    content: { // Content attribute definition
        type: DataTypes.TEXT, // Data type is text
        allowNull: false // Content cannot be null
    }
}, {
    // Other model options go here
    tableName: 'posts' // Setting the table name to 'posts'
});

module.exports = Post; // Exporting the Post model
