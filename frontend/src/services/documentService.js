import api from './api.js'

export const documentService = {
  list: (workspaceId) => api.get(`/api/workspaces/${workspaceId}/documents`),
  upload: (workspaceId, file, onProgress) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/workspaces/${workspaceId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  get: (id) => api.get(`/api/documents/${id}`),
  delete: (id) => api.delete(`/api/documents/${id}`),
  getViewUrl: (id, pageNumber) => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
    const token = sessionStorage.getItem('dm_token') || ''
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ''
    const hash = pageNumber ? `#page=${pageNumber}` : ''
    return `${baseUrl}/api/documents/${id}/view${tokenParam}${hash}`
  },
}
