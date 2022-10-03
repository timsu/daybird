import { isEqual } from 'lodash'

import { debounce, DebounceStyle } from '@/utils'

import { Topic, TopicData } from './topicflow'

type KeyChangeCallback = (key: string, value: any) => void

// helper class that encapsulates best practices for using Topicflow as a data source
class TopicflowTopic {
  constructor(public topic: Topic) {}

  onJoin(cb: (initialData: TopicData) => void) {
    if (this.topic.joined) cb(this.topic._data)
    else this.topic.on('join', cb)
  }

  onChange(cb: (data: TopicData) => void) {
    this.topic.on('change', cb)
    return () => this.topic.off('change', cb)
  }

  onKeyChange(key: string, cb: KeyChangeCallback) {
    const filtered: KeyChangeCallback = (incoming, value) => {
      if (incoming == key) cb(incoming, value)
    }
    this.topic.on('change_key', filtered)
    return () => this.topic.off('change_key', filtered)
  }

  onAllKeyChange(cb: KeyChangeCallback) {
    this.topic.on('change_key', cb)
    return () => this.topic.off('change_key', cb)
  }

  onPresenceKeyChange(
    key: string | RegExp,
    cb: (userId: string, clientId: string, key: string, value: any) => void
  ) {
    const test = key instanceof RegExp ? (k: string) => key.test(k) : (k: string) => k == key

    const filtered = (userId: string, clientId: string, incoming: string, value: any) => {
      if (!incoming.startsWith('%') && test(incoming)) cb(userId, clientId, incoming, value)
    }
    this.topic.on('change_presence_key', filtered)

    return () => this.topic.off('change_presence_key', cb)
  }

  onPresenceClientChange(
    selectClientId: string,
    cb: (userId: string, clientId: string, key: string, value: any) => void
  ) {
    this.topic.on('change_presence_key', (userId, clientId, incoming, value) => {
      if (!incoming.startsWith('%') && selectClientId == clientId)
        cb(userId, clientId, incoming, value)
    })
  }

  status() {
    return this.topic.session.status
  }

  unsubscribe() {
    this.topic.unsubscribe()
  }

  getData() {
    return this.topic.data
  }
}

/**
 * Ephemeral topics are not backed by a topicflow data source
 *
 * There are two primary workflows that are assisted by this class:
 *
 * 1) storing presence keys as a map
 *    - this is handled by syncUserPresenceKey, which abstracts users going offline, etc
 *
 * 2) sending messages to other users
 *    - this is handled by sendMessage and subscribeMessage
 *
 * Important note: if you want automatic presence, add your topic to topicflow's system.ex
 */
export class EphemeralTopic extends TopicflowTopic {
  constructor(public topic: Topic) {
    super(topic)
  }

  public getPresenceKey(userId: string, clientId: string, key: string) {
    return this.topic.getPresenceKey(userId, clientId, key)
  }

  public setPresenceKey(key: string, value: any, ttl?: number) {
    this.topic.setPresenceKey(key, value, ttl)
  }

  public setSharedKey(key: string, value: any, ttl?: number) {
    this.topic.setKey(key, value, ttl)
  }

  /**
   * Atomically add to a numeric value or add an item to a list or map key.  If
   * the key does not exist, it will be created. String values are not supported.
   *
   * @param key - the key to add to
   * @param value - the value to add
   * @param at - The index to add the value at.  For lists, this must be a number.  For maps,
   *   this must be a string.  Negative numbers are counted from the end of the list.  Ignored
   *   for numbers.
   * @param ttl - The time to live for the key.  If not specified, the key will not expire.
   */
  public addToSharedKey(key: string, value: any, at: number | string | null = null, ttl?: number) {
    this.topic.atomicAdd(key, value, at, ttl)
  }

  /**
   * Atomically add an item to a the end of a list or map key.  If the key does not exist, it will
   * be created.
   *
   * @param key - the key to add to
   * @param value - the value to add
   * @param ttl - The time to live for the key.  If not specified, the key will not expire.
   */
  public appendToSharedKey(key: string, value: any, ttl?: number) {
    this.topic.atomicAdd(key, value, -1, ttl)
  }

  /**
   * Atomically subtract from a key's numeric value or remove an item from a shared key containing a list or map.  If the item is not found,
   * it will be ignored.
   *
   * For lists, either value or index, or both, must be specified.  If both are specified,
   * The item will only be removed if the current value at index matches the value.  If only value
   * specified then the first item equal to the value will be removed.
   *
   * @param key - the key to remove from
   * @param value - the value to remove (optional; ignored for maps)
   * @param index - The index to remove the value at.  For lists, this must be a number.  For maps,
   *  this must be a string.  Negative numbers are counted from the end of the list. (optional;
   *  ignored for numbers)
   * @param ttl - The time to live for the key.  If not specified, the key will not expire.
   */
  public subtractFromSharedKey(
    key: string,
    value: any,
    index: number | string | null,
    ttl?: number
  ) {
    this.topic.atomicSubtract(key, value, index, ttl)
  }

  public sendEvent(key: string, value: any) {
    this.setSharedKey(key, value, 0)
  }

  public getSharedKey(key: string) {
    return this.topic.data[key]
  }

  public deletePresenceKey(key: string) {
    this.topic.deletePresenceKey(key)
  }

  public deleteSharedKey(key: string) {
    this.topic.deleteKey(key)
  }

  /**
   * Generate a map of user <userId> -> <value> for any presence key
   *
   * Will call the callback function whenever things change with new map + new updates.
   */
  syncUserPresenceKey<T>(
    key: string,
    cb: (map: { [userId: string]: T }, changes: { [userId: string]: T | null }) => void
  ) {
    let prevMap: { [userId: string]: any } | null = null

    const keyChangeHelper = (userId: string, clientId: string, changedKey: string, value: any) => {
      if (changedKey != key && changedKey != 'status') return

      // Ignore internal/special keys
      if (changedKey.startsWith('%')) return

      debounce(
        'sync-' + key,
        () => {
          if (!this.topic.joined) return

          const map: { [userId: string]: T } = {}
          const updates: { [userId: string]: T | null } = {}

          const usersWithPresence = new Set<string>()
          this.topic.mapPresenceData((userId, clientId, data: TopicData) => {
            usersWithPresence.add(userId)
            if (data.status == 'connected') {
              updates[userId] = map[userId] = data[key]
            }
          })

          if (prevMap) {
            Object.keys(prevMap).forEach((userId) => {
              if (!usersWithPresence.has(userId)) updates[userId] = null
            })
          }

          if (!isEqual(map, prevMap)) {
            prevMap = map
            cb(map, updates)
          }
        },
        50,
        DebounceStyle.RESET_ON_NEW
      )
    }

    this.topic.mapPresenceKeyValues(keyChangeHelper)
    this.topic.on('change_presence_key', keyChangeHelper)
  }

  /**
   * Map over presence data yielding clientId, userId, and <T>
   */
  mapPresenceData<T>(cb: (userId: string, clientId: string, data: T) => void) {
    this.topic.mapPresenceData((userId, clientId, data: TopicData) => {
      cb(userId, clientId, data as T)
    })
  }

  /**
   * Map over presence data for given client, yielding <T>
   */
  getClientPresenceData<T>(clientId: string): T {
    const data: Partial<T> = {}
    this.topic.mapPresenceKeyValues<T>((_userId, rClientId, key, value) => {
      if (clientId == rClientId) data[key] = value
      return data as T
    })
    return data as T
  }

  /** check if given user (with optional clientId) is online */
  userIsOnline(userId: string, clientId?: string) {
    if (!this.topic) return false

    if (!clientId) {
      return this.topic.isAnyClientOnline(userId)
    } else {
      return this.topic.getPresenceStatus(userId, clientId) == 'connected'
    }
  }

  /** send a message to a specific user. ttl - how long to keep the message alive (if you or they are offline) */
  sendMessageToUser(
    message: string,
    userId: string,
    data: any,
    ttl: number,
    onAck: (data: any, clientId: string) => void
  ) {
    this.checkValidMessageKey(message)

    const myUserId = this.topic.session.userId
    const myClientId = this.topic.session.clientId

    const msgKey = `%u|${userId}|${message}`

    const listener = (fromUserId: string, fromClientId: string, key: string, value: any) => {
      if (
        (fromUserId == userId && key.startsWith(`%a|${myUserId}|${message}`)) ||
        key.startsWith(`%a|${myClientId}|${message}`)
      ) {
        this.topic.off('change_presence_key', listener)
        this.topic.clearPresencePrefix(msgKey)
        onAck?.(value, fromClientId)
      }
    }
    this.topic.on('change_presence_key', listener)

    this.setPresenceKey(msgKey, data, ttl)
  }

  /** send a message to a specific client. ttl - how long to keep the message alive (if you or they are offline) */
  sendMessageToClient(
    message: string,
    clientId: string,
    data: any,
    ttl: number,
    onAck: (data: any) => void
  ) {
    this.checkValidMessageKey(message)

    const myUserId = this.topic.session.userId
    const myClientId = this.topic.session.clientId

    const msgKey = `%c|${clientId}|${message}`

    const listener = (_fromUserId: string, fromClientId: string, key: string, value: any) => {
      if (
        (fromClientId == clientId && key.startsWith(`%a|${myUserId}|${message}`)) ||
        key.startsWith(`%a|${myClientId}|${message}`)
      ) {
        this.topic.off('change_presence_key', listener)
        this.topic.clearPresencePrefix(msgKey)
        onAck?.(value)
      }
    }
    this.topic.on('change_presence_key', listener)
    this.setPresenceKey(msgKey, data, ttl)
  }

  /** acknowledge a message with optional value . ttl - how long to keep the message alive (if you or they are offline) */
  ackMessage(message: string, userIdOrClientId: string, response: any, ttl = 0) {
    if (message.includes('|') || message.includes(':') || message.includes('%'))
      throw 'Invalid message character (:, %, or |)'
    this.setPresenceKey(`%a|${userIdOrClientId}|${message}`, response, ttl)
  }

  /** receive a message sent to me. myUserId = the logged in user's id */
  onMessage(
    message: string,
    cb: (userId: string, clientId: string, message: string, data: any) => void
  ) {
    this.checkValidMessageKey(message)

    const myUserId = this.topic.session.userId
    const myClientId = this.topic.session.clientId

    this.topic.on('change_presence_key', (userId, clientId, key, value) => {
      if (
        (value && key.startsWith(`%u|${myUserId}|${message}`)) ||
        key.startsWith(`%c|${myClientId}|${message}`)
      ) {
        cb(userId, clientId, message, value)
      }
    })
  }

  private checkValidMessageKey(message: string) {
    if (message.includes('|') || message.includes(':') || message.includes('%'))
      throw 'Invalid message character (:, %, or |)'
  }
}

// data-backed topics are backed by a topicflow data source
// keys may be cleared whenever the data updates
export class DataBackedTopic extends TopicflowTopic {
  constructor(public topic: Topic) {
    super(topic)
  }

  public setKey(key: string, value: any, ttl?: number) {
    this.topic.setKey(key, value, ttl)
  }

  public getKey(key: string) {
    return this.topic.data[key]
  }

  public deleteKey(key: string) {
    return this.topic.deleteKey(key)
  }
}
