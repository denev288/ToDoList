const API_KEY = "test_LcCtukoogBq73uaqRru4jhmU5PptBbWkjqA3aOag"
const BASE_URL = "https://api.nettoolkit.com/v1/account/test-api-keys"



export const getTheApi = async() => {
    const response = await fetch (`${BASE_URL}?api_key=${API_KEY}`);
    const data = await response.json()
    return data.results
};

