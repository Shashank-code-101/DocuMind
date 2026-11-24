import api from './api.js'

export const workspaceService = {
  list: () => api.get('/api/workspaces'),
  create: (data) => api.post('/api/workspaces', data),
  get: (id) => api.get(`/api/workspaces/${id}`),
  update: (id, data) => api.patch(`/api/workspaces/${id}`, data),
  delete: (id) => api.delete(`/api/workspaces/${id}`),
}
