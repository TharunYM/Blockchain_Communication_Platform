const API_URL = 'http://localhost:5000';

export const loginUser = async (username) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        return await response.json();
    } catch (error) {
        console.error("Login error:", error);
        return null;
    }
};

export const sendMessageToApi = async (sender, receiver, content) => {
    try {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, receiver, content })
        });
        return await response.json();
    } catch (error) {
        console.error("Send message error:", error);
        return null;
    }
};

export const fetchMessages = async (username) => {
    try {
        const response = await fetch(`${API_URL}/messages?user=${username}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Fetch messages error:", error);
        return [];
    }
};

export const fetchUsers = async () => {
    try {
        const response = await fetch(`${API_URL}/users`);
        return await response.json();
    } catch (error) {
        console.error("Fetch users error:", error);
        return [];
    }
};