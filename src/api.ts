export type StudentProfile = {
    _id: string;
    enrollmentId: number;
    name: string;
    email: string;
    department: string;
    section: string;
    roll: number;
    secure: boolean;
};

export type StudentProfileResponse = {
    success: true;
    data: StudentProfile;
};

const API_BASE_URL = "http://127.0.0.1:8000";

//Generic request handle

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? {
            'Authorization': `Bearer ${token}`,
            'access_token': token,
            'x-access-token': token,
            'token': token
        } : {}),
        ...options?.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // Ignored non-json responses
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Login endpoint
export async function loginUser(email: string, password: string) {
    const data = await request<any>('/student/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    // Store token if it exists in the response (checking both root and .data wrapper)
    const token = data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
    if (token) {
        localStorage.setItem('token', token);
    }

    return data;
}

export async function logoutUser() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await request('/student/logout', {
                method: 'POST',
                body: JSON.stringify({ access_token: token })
            });
        } catch (e) {
            console.error("Logout API call failed", e);
        }
    }
    localStorage.removeItem('token');
}

// Profile endpoint
export async function getProfile(): Promise<StudentProfileResponse> {
    const token = localStorage.getItem('token');
    const response = await request<StudentProfileResponse>('/student/profile', {
        method: 'POST',
        body: JSON.stringify({ token, access_token: token })
    });

    if (response?.data?.enrollmentId && typeof window !== 'undefined' && (window as any).electronAPI?.setStudentId) {
        (window as any).electronAPI.setStudentId(response.data.enrollmentId.toString());
    }

    return response;
}

export type ExamResponse = {
    success: boolean;
    data: {
        url: string;
    }
}

// Exam Details Endpoint
export async function verifyExamCode(examId: string): Promise<ExamResponse> {
    const response = await request<ExamResponse>('/exam/student/read', {
        method: 'POST',
        body: JSON.stringify({ examId })
    });

    if (typeof window !== 'undefined' && (window as any).electronAPI?.setExamId) {
        (window as any).electronAPI.setExamId(examId);
    }

    return response;
}
