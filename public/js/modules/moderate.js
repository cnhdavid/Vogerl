const axios = require('axios');
const xml2js = require('xml2js');

async function filterProfanity(text) {
    try {
        const response = await axios.get('https://www.purgomalum.com/service/xml', {
            params: {
                text: text
            }
        });

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        return result.PurgoMalum.result[0]; // Extract filtered text from XML response
    } catch (error) {
        console.error('Error calling Purgomalum API:', error);
        throw new Error('Error filtering text');
    }
}
async function containsProfanity(text) {
    try {
        // Send a request to the Purgomalum API's containsprofanity endpoint
        const response = await axios.get('https://www.purgomalum.com/service/containsprofanity', {
            params: {
                text: text
            }
        });

        // The API returns a boolean value as a string ("true" or "false")
        return response.data;
    } catch (error) {
        console.error('Error calling Purgomalum API:', error);
        throw new Error('Error checking text for profanity');
    }
}

module.exports = { filterProfanity, containsProfanity };
