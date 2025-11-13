/**
 * Sends a message to the LLM API with retry logic and error handling
 * @param {Object} message - The message to send
 * @param {number} [retryCount=0] - Current retry attempt
 * @param {number} [maxRetries=2] - Maximum number of retry attempts
 * @returns {Promise<Object>} - The AI response or error message
 */
export const sendMessage = async (message, retryCount = 0, maxRetries = 2) => {
  // Validate API configuration
  if (!import.meta.env.VITE_LLM_API_URL || !import.meta.env.VITE_LLM_API_KEY) {
    console.error('API configuration error: Missing required environment variables');
    return createErrorResponse('Configuration error: API is not properly configured');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(import.meta.env.VITE_LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': import.meta.env.VITE_LLM_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: message.text }]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      
      // Handle rate limiting (429) or server errors (5xx) with retry
      if ((response.status === 429 || response.status >= 500) && retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendMessage(message, retryCount + 1, maxRetries);
      }
      
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from API');
    }

    return {
      id: Date.now(),
      text: data.candidates[0].content.parts[0].text,
      sender: 'ai',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return createErrorResponse('Request timed out. Please try again.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      return createErrorResponse('Network error. Please check your connection.');
    }
    
    return createErrorResponse(error.message || 'An unexpected error occurred. Please try again.');
  }
};

/**
 * Creates a standardized error response object
 * @param {string} message - Error message
 * @returns {Object} - Error response object
 */
const createErrorResponse = (message) => ({
  id: Date.now(),
  text: message,
  sender: 'ai',
  timestamp: new Date().toISOString(),
  error: true,
  isFinal: true // Indicates this is a final error message (not retryable)
});

/**
 * Parses error responses from the API
 * @param {Response} response - The fetch response object
 * @returns {Promise<Object>} - Parsed error data
 */
async function parseErrorResponse(response) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        message: data.error?.message || `API error (${response.status})`,
        code: data.error?.code,
        status: response.status
      };
    }
    return { message: await response.text() || `HTTP error ${response.status}` };
  } catch (e) {
    return { message: `Failed to parse error response: ${e.message}` };
  }
}
