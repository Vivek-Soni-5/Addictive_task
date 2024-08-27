const cache = require('memory-cache');

// Set details in the cache
const setDetails = (Id, details) => {
  cache.put(Id, details, 3600000); // Cache for an hour
};


// Get details from the cache
const getDetails = (Id) => {
    const data = cache.get(Id);

    // Return as-is if not a JSON string
    return data;
};

module.exports = {
    setDetails,
    getDetails,
}