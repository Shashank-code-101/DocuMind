import api from './api.js'

export const chatService = {
  createConversation: (workspaceId, title) =>
    api.post(`/api/workspaces/${workspaceId}/conversations`, { title }),
  listConversations: (workspaceId) =>
    api.get(`/api/workspaces/${workspaceId}/conversations`),
  getMessages: (conversationId) =>
    api.get(`/api/conversations/${conversationId}`),
  deleteConversation: (conversationId) =>
    api.delete(`/api/conversations/${conversationId}`),
  ask: (conversationId, question) =>
    api.post(`/api/conversations/${conversationId}/messages`, { question }),
}
