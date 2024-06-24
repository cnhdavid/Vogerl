const axios = require('axios'); // Import axios for making HTTP requests
const xml2js = require('xml2js'); // Import xml2js for parsing XML responses

/**
 * Filters profanity from the provided text using the Purgomalum API.
 * @param {string} text - The text to be filtered.
 * @returns {Promise<string>} - The filtered text.
 * @throws {Error} - Throws an error if the API call fails.
 */
async function filterProfanity(text) {
    try {
        // Send a request to the Purgomalum API to filter profanity from the text
        const response = await axios.get('https://www.purgomalum.com/service/xml', {
            params: {
                text: text // The text to be filtered is passed as a query parameter
            }
        });

        // Parse the XML response from the Purgomalum API
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        // Extract and return the filtered text from the parsed XML response
        return result.PurgoMalum.result[0];
    } catch (error) {
        console.error('Error calling Purgomalum API:', error);
        throw new Error('Error filtering text'); // Throw an error if the API call fails
    }
}

/**
 * Checks if the provided text contains profanity using the Purgomalum API.
 * @param {string} text - The text to be checked for profanity.
 * @returns {Promise<boolean>} - True if the text contains profanity, otherwise false.
 * @throws {Error} - Throws an error if the API call fails.
 */
async function containsProfanity(text) {
    try {
        // Send a request to the Purgomalum API's containsprofanity endpoint
        const response = await axios.get('https://www.purgomalum.com/service/containsprofanity', {
            params: {
                text: text // The text to be checked is passed as a query parameter
            }
        });

        // The API returns a boolean value as a string ("true" or "false")
        return true;
    } catch (error) {
        console.error('Error calling Purgomalum API:', error);
        throw new Error('Error checking text for profanity'); // Throw an error if the API call fails
    }
}

module.exports = { filterProfanity, containsProfanity }; // Export the functions for use in other modules
