import { Socket } from 'phoenix'

import { config } from '@/config'
import { User } from '@/models'
import { assertIsDefined, logger } from '@/utils'

const SOCKET_HEARTBEAT_MS = 2_000 // socket's internal polling => updates socket.isConnected()
const SOCKET_CONNECTED_POLL_MS = 3_000 // our polling of socket.isConnected()
const SOCKET_RECONNECT_MS = 10_000 // how often we try disconnect => reconnect

const DEBUG = false

export class SocketService {
  userId?: string

  teamId?: string

  // manage state changes ourselves, e.g. since onOpen/onClose can be called multiple times
  connected: boolean = false

  hasConnected: boolean = false

  pollTimer: number = 0

  reconnectAttemptTime: number = 0

  socket?: Socket

  // time since user went offline (or 0)
  offlineSince: number = 0

  init(clientId: string, token: string, user: User) {
    if (this.socket) {
      if (this.userId == user.id) {
        return
      }
      this.socket.disconnect()
    }

    this.connected = false
    this.hasConnected = false
    this.reconnectAttemptTime = 0
    this.offlineSince = 0

    this.userId = user.id
    logger.info(`SOCKETS —— initSocket`)

    const socket = (this.socket = new Socket(config.wsUrl, {
      params: {
        token,
        client_id: clientId,
        user_id: user.id,
        hash: config.hash,
      },
      heartbeatIntervalMs: SOCKET_HEARTBEAT_MS,
    }))

    if (config.dev) (window as any)['socket'] = this

    window.onfocus = () => {
      if (!socket.isConnected()) socket.connect()
    }

    socket.onClose(() => {
      logger.debug('SOCKETS —— socket.onClose')
      this.updateStatus(false)
    })

    this.pollSocketConnected()

    return new Promise<void>((res, rej) => {
      socket.onOpen(() => {
        logger.debug('SOCKETS —— socket.onOpen')
        const firstConnect = !this.hasConnected
        this.updateStatus(true)
        if (firstConnect) res()
      })

      socket.connect()
    })
  }

  initChannel(channelName: string) {
    assertIsDefined(this.socket, 'socket must be initialized')
    const userChannel = this.socket.channel(channelName)
    return userChannel
  }

  updateStatus(connected: boolean) {
    if (!this.connected && connected) {
      this.hasConnected = true
    }
    this.connected = connected
  }

  reconnect(force?: boolean) {
    assertIsDefined(this.socket, 'socket must be initialized')
    if (force || this.reconnectAttemptTime < Date.now() - SOCKET_RECONNECT_MS) {
      this.reconnectAttemptTime = Date.now()
      logger.debug('SOCKETS —— disconnect => reconnect')
      this.socket.disconnect(() => this.socket!.connect())
    }
  }

  disconnect() {
    this.socket?.disconnect()
    window.clearInterval(this.pollTimer)
    this.socket = undefined
  }

  // milliseconds offline
  offlineTime() {
    if (this.offlineSince == 0) return 0
    return Date.now() - this.offlineSince
  }

  pollSocketConnected() {
    if (this.pollTimer) window.clearInterval(this.pollTimer)
    this.pollTimer = window.setInterval(() => {
      const connected = Boolean(this.socket?.isConnected())
      if (!connected) {
        // disconnect => reconnect. do it immediately if we just realized socket became disconnected.
        this.reconnect(this.connected)
        if (this.offlineSince == 0) this.offlineSince = Date.now()
      } else {
        // set offlineSince to zero. we delay this so that any code that's executing as we come line
        // has a chance to access the offlineSince variable
        setTimeout(() => (this.offlineSince = 0), 500)
      }
      this.updateStatus(connected)
    }, SOCKET_CONNECTED_POLL_MS)
  }
}

export const socketService = new SocketService()
