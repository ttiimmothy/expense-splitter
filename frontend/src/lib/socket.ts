import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
      })
      
      // Add connection debugging
      this.socket.on('connect', () => {
        // console.log('🔌 Socket connected:', this.socket?.id)
      })
      
      this.socket.on('disconnect', () => {
        // console.log('🔌 Socket disconnected')
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinSocketGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit('join-group', groupId)
    }
  }

  leaveSocketGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit('leave-group', groupId)
    }
  }

  onExpenseCreated(callback: (expense: any) => void) {
    if (this.socket) {
      this.socket.on('expense-created', callback)
    }
  }

  onExpenseUpdated(callback: (expense: any) => void) {
    if (this.socket) {
      this.socket.on('expense-updated', callback)
    }
  }

  onSettlementCreated(callback: (settlement: any) => void) {
    if (this.socket) {
      this.socket.on('settlement-created', callback)
    }
  }

  onGroupUpdated(callback: (group: any) => void) {
    if (this.socket) {
      this.socket.on('group-updated', callback)
    }
  }

  off(event: string, callback: any) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

export const socketService = new SocketService()
