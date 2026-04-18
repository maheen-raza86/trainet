import apiClient from './client';

export const guidanceApi = {
  // Guidance Requests
  createRequest: (body: { alumni_id: string; topic: string; description: string; preferred_duration?: string; preferred_schedule?: string; attachment_url?: string }) =>
    apiClient.post('/guidance/request', body),

  getStudentRequests: () =>
    apiClient.get('/guidance/student'),

  getAlumniRequests: () =>
    apiClient.get('/guidance/alumni'),

  respondToRequest: (id: string, status: 'accepted' | 'rejected') =>
    apiClient.put(`/guidance/${id}/respond`, { status }),

  // Sessions
  createSession: (body: { guidance_request_id: string; title: string; topic: string; description?: string; start_date: string; end_date: string; duration_text?: string; meeting_link: string; schedule_text?: string; session_notes?: string; allow_group_session?: boolean; max_students?: number }) =>
    apiClient.post('/guidance/sessions', body),

  getStudentSessions: () =>
    apiClient.get('/guidance/sessions/student'),

  getAlumniSessions: () =>
    apiClient.get('/guidance/sessions/alumni'),

  getSessionById: (id: string) =>
    apiClient.get(`/guidance/sessions/${id}`),

  updateSession: (id: string, body: { title?: string; description?: string; meeting_link?: string; schedule_text?: string; session_notes?: string; duration_text?: string; status?: string }) =>
    apiClient.put(`/guidance/sessions/${id}`, body),

  // Materials
  uploadMaterial: (sessionId: string, body: { title: string; file_url: string; type: 'pdf' | 'slides' | 'image' | 'document' | 'link' }) =>
    apiClient.post(`/guidance/sessions/${sessionId}/materials`, body),

  getMaterials: (sessionId: string) =>
    apiClient.get(`/guidance/sessions/${sessionId}/materials`),

  // Feedback
  submitFeedback: (sessionId: string, body: { rating: number; comment?: string }) =>
    apiClient.post(`/guidance/sessions/${sessionId}/feedback`, body),

  getFeedback: (sessionId: string) =>
    apiClient.get(`/guidance/sessions/${sessionId}/feedback`),
};

export default guidanceApi;
