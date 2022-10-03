import { EventEmitter } from 'events'
import * as _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { config } from '@/config'
import { logger } from '@/utils'

interface Ping {
  next_ping_deadline_ms: number
}

interface Init extends Ping {}

export type TopicData = Record<string, any>

interface TopicSubscribe {
  id: string
}

interface TopicUnsubscribe {
  id: string
}

interface TopicSnapshot {
  id: string
  snapshot: TopicData
  epoch: string
}

interface TopicVerifyRequest {
  id: string
  ref: string
}

interface TopicVerifyReply {
  id: string
  ref: string
  snapshot: TopicData
}

interface TopicDiff {
  id: string
  diff: TopicData
}

interface TopicSetKey {
  id: string
  key: string
  value: any
  ttl: number | null
  ts: number
}

interface TopicClearPrefix {
  id: string
  prefix: string
  ts: number
}

interface TopicAtomicAdd {
  id: string
  key: string
  value: any
  at: any
  ttl: number | null
  ts: number
}

type TopicAtomicSubtract = TopicAtomicAdd

interface SyncInfo {
  user_id: string
}

// Map of message method names to array of request and reply types

type Protocol = {
  init: [Init, never]
  ping: [Ping, never]
  cold_sync: [SyncInfo, never]
  warm_sync: [never, never]
  topic_subscribe: [TopicSubscribe, never]
  topic_unsubscribe: [TopicUnsubscribe, never]
  topic_snapshot: [TopicSnapshot, never]
  topic_verify_request: [TopicVerifyRequest, never]
  topic_verify_reply: [TopicVerifyReply, never]
  topic_diff: [TopicDiff, never]
  topic_set_key: [TopicSetKey, never]
  topic_set_presence_key: [TopicSetKey, never]
  topic_clear_prefix: [TopicClearPrefix, never]
  topic_clear_presence_prefix: [TopicClearPrefix, never]
  topic_atomic_add: [TopicAtomicAdd, never]
  topic_atomic_subtract: [TopicAtomicSubtract, never]
}

const RpcVersion = '2.0'

interface RpcMessage {
  jsonrpc: string
  id: string
}

interface RpcRequest<K extends keyof Protocol> extends RpcMessage {
  method: K
  params: Protocol[K][0]
}

interface RpcMeta {
  us: number
}

interface RpcReply extends RpcMessage {
  meta: RpcMeta
}

interface RpcSuccess<K extends keyof Protocol> extends RpcReply {
  result?: Protocol[K][1]
}

interface RpcErrorInfo {
  code: number
  message: string
  data?: any
}

interface RpcError extends RpcReply {
  error: RpcErrorInfo
}

function rpcMessageNotFoundError<K extends keyof Protocol>(
  request: RpcRequest<K>
): Partial<RpcError> {
  return rpcError(request, -32601, 'Method not found')
}

function rpcError<K extends keyof Protocol>(
  request: RpcRequest<K>,
  code: number,
  message: string,
  data: any = undefined
): Partial<RpcError> {
  return { id: request.id, error: { code, message, data } }
}

function rpcSuccess<K extends keyof Protocol>(
  request: RpcRequest<K>,
  result?: Protocol[K][1]
): Partial<RpcSuccess<K>> {
  return { id: request.id, result }
}

function rpcRequest<K extends keyof Protocol>(
  method: K,
  params?: Protocol[K][0]
): Partial<RpcRequest<K>> {
  return { id: uuidv4(), method, params }
}

export type TopicEvents = {
  /** fired when any key changes, returns entire topic */
  change: (data: TopicData) => void
  /** fired when a shared key changes */
  change_key: (key: string, value: any) => void
  /** fired when a presence key changes */
  change_presence_key: (userId: string, clientId: string, key: string, value: any) => void
  /** fired when we join or reconnect a topic without data */
  gone: () => void
  /** fired when we join or reconnect a topic with data */
  snapshot: (data: TopicData) => void
  /** fired only when we first join a topic (with or without data) */
  join: (data: TopicData) => void
}

const PresenceRegex = /@p:([^:]*):([^:]*):([^:]*)/

export interface PresenceUserInfo {
  name: string
  nickname: string
  email: string
}

export type PresenceStatus = 'disconnected' | 'connected'

export interface UserInfo {
  name: string
  nickname: string
  email: string
}

export class Topic {
  constructor(public readonly id: string, public readonly session: Session) {}

  _data: TopicData = {}
  _epoch: string | null = null
  _emitter = new EventEmitter()

  get data(): TopicData {
    return _.cloneDeep(this._data)
  }

  get joined(): boolean {
    return !!this._epoch
  }

  getPresenceUserInfo(userId: string, clientId?: string): PresenceUserInfo {
    return this.getPresenceKey(userId, clientId, 'user_info') as PresenceUserInfo
  }

  /** client ID is required, otherwise it's unclear whose connection status you're requesting */
  getPresenceStatus(userId: string, clientId: string): PresenceStatus {
    return this.getPresenceKey(userId, clientId, 'status') as PresenceStatus
  }

  isAnyClientOnline(userId: string): boolean {
    const keyToFind = 'status'
    const found = _.find(_.toPairs(this._data), ([key, value]) => {
      if (PresenceRegex.test(key)) {
        const parsedPresence = PresenceRegex.exec(key)
        if (!parsedPresence) return false

        return (
          parsedPresence[3] === keyToFind && parsedPresence[1] === userId && value === 'connected'
        )
      }

      return false
    })
    return Boolean(found)
  }

  getPresenceKey(userId: string, clientId: string | undefined, keyToFind: string): any {
    const pair = _.find(_.toPairs(this._data), ([key]) => {
      if (PresenceRegex.test(key)) {
        const parsedPresence = PresenceRegex.exec(key)!

        return (
          parsedPresence[3] === keyToFind &&
          (!clientId || parsedPresence[2] === clientId) &&
          parsedPresence[1] === userId &&
          this._data[key.replace(keyToFind, 'status')] === 'connected'
        )
      }

      return false
    })
    if (pair) {
      const [_key, value] = pair
      return _.cloneDeep(value)
    }
    return null
  }

  mapPresenceKeyValues<T>(
    fn: (userId: string, clientId: string, key: keyof T, value: any) => T
  ): Array<T> {
    const r: Array<T> = []
    _.each(_.toPairs(this._data), ([key, value]) => {
      if (PresenceRegex.test(key)) {
        const parsedPresence = PresenceRegex.exec(key)!

        r.push(
          fn(parsedPresence[1], parsedPresence[2], parsedPresence[3] as keyof T, _.cloneDeep(value))
        )
      }
    })
    return r
  }

  mapPresenceData<T>(fn: (userId: string, clientId: string, data: TopicData) => T): Array<T> {
    return _.map(
      _.groupBy(
        this.mapPresenceKeyValues((userId: string, clientId: string, key: string, value: any) => {
          return { userId, clientId, key, value }
        }),
        ({ userId, clientId }) => userId + clientId
      ),
      (rows) => {
        const { userId, clientId } = _.first(rows)!
        const data = _.fromPairs(_.map(rows, ({ key, value }) => [key, value]))
        return fn(userId, clientId, data)
      }
    )
  }

  mapSharedKeyValues<T>(fn: (key: string, value: any) => T, data?: TopicData): Array<T> {
    const r: Array<T> = []
    const dataToUse = data || this._data
    _.each(_.toPairs(dataToUse), ([key, value]) => {
      if (!PresenceRegex.test(key)) {
        r.push(fn(key, _.cloneDeep(value)))
      }
    })
    return r
  }

  on<K extends keyof TopicEvents>(eventName: K, fn: TopicEvents[K]): void {
    this._emitter.addListener(eventName, fn)
  }

  once<K extends keyof TopicEvents>(eventName: K, fn: TopicEvents[K]): void {
    this._emitter.once(eventName, fn)
  }

  off<K extends keyof TopicEvents>(eventName: K, fn: TopicEvents[K]): void {
    this._emitter.removeListener(eventName, fn)
  }

  async setKey(key: string, value: any, ttl: number | null = null): Promise<void> {
    if (key.indexOf(':') > -1) throw 'Invalid separator character - :'
    return await this.session.setTopicKey(this.id, key, value, ttl)
  }

  async atomicAdd(
    key: string,
    value: any,
    at: string | number | null,
    ttl: number | null = null
  ): Promise<void> {
    if (key.indexOf(':') > -1) throw 'Invalid separator character - :'
    return await this.session.topicAtomicAdd(this.id, key, value, at, ttl)
  }

  async atomicSubtract(
    key: string,
    value: any,
    at: string | number | null,
    ttl: number | null = null
  ): Promise<void> {
    if (key.indexOf(':') > -1) throw 'Invalid separator character - :'
    return await this.session.topicAtomicSubtract(this.id, key, value, at, ttl)
  }

  async setPresenceKey(key: string, value: any, ttl: number | null = null): Promise<void> {
    if (key.indexOf(':') > -1) throw 'Invalid separator character - :'
    return await this.session.setTopicPresenceKey(this.id, key, value, ttl)
  }

  async deleteKey(key: string): Promise<void> {
    return await this.session.deleteTopicKey(this.id, key)
  }

  async deletePresenceKey(key: string): Promise<void> {
    return await this.session.deleteTopicPresenceKey(this.id, key)
  }

  async clearPrefix(prefix: string): Promise<void> {
    return await this.session.clearTopicPrefix(this.id, prefix)
  }

  async clearPresencePrefix(prefix: string): Promise<void> {
    return await this.session.clearTopicPresencePrefix(this.id, prefix)
  }

  unsubscribe(): void {
    delete this.session._topics[this.id]
    this.session._sendRequest('topic_unsubscribe', { id: this.id }).catch(() => {})
  }

  private emit<K extends keyof TopicEvents>(
    eventName: K,
    ...params: Parameters<TopicEvents[K]>
  ): void {
    try {
      this._emitter.emit(eventName, ...params)
    } catch (e) {
      logger.warn(`Error when emitting Topicflow ${eventName} event on ${this.id} topic`, e)
    }
  }

  _handleSnapshot(snapshot: TopicData, epoch: string): void {
    const initialJoin = _.isNull(this._epoch)

    if ((this._epoch === epoch || _.isNull(this._epoch)) && !_.isUndefined(epoch)) {
      if (initialJoin) {
        this._epoch = epoch
      }
      this.emit('snapshot', snapshot)
    } else {
      this.emit('gone')

      if (!_.isUndefined(epoch)) {
        this._epoch = epoch
      }
    }

    if (!_.isEqual(snapshot, this._data)) {
      const diff: TopicData = {}
      _.each(this._data, (_value, key) => {
        if (_.isUndefined(snapshot[key])) diff[key] = null
      })
      _.each(snapshot, (newValue, key) => {
        const curValue = this._data[key]
        if (!_.isEqual(newValue, curValue)) diff[key] = newValue
      })
      this._handleDiff(diff)
    }

    if (initialJoin) this.emit('join', this._data)
  }

  _handleDiff(diff: TopicData): void {
    const emitters = _.reduce(
      diff,
      (emitters, newValue, key) => {
        const curValue = this._data[key]
        let changed = false

        if (_.isNull(newValue)) {
          if (!_.isUndefined(curValue)) {
            delete this._data[key]
            changed = true
          }
        } else if (!_.isEqual(newValue, curValue)) {
          this._data[key] = newValue
          changed = true
        }

        if (changed) {
          const parsedPresence = PresenceRegex.exec(key)

          if (parsedPresence)
            emitters.push(() =>
              this.emit(
                'change_presence_key',
                parsedPresence[1],
                parsedPresence[2],
                parsedPresence[3],
                _.cloneDeep(newValue)
              )
            )
          else emitters.push(() => this.emit('change_key', key, _.cloneDeep(newValue)))
        }

        return emitters
      },
      [] as Array<() => void>
    )

    if (!_.isEmpty(emitters)) this.emit('change', _.cloneDeep(this._data))

    _.each(emitters, (e) => e())
  }

  _handleVerifyRequest(ref: string): void {
    this.session
      ._sendRequest('topic_verify_reply', { id: this.id, ref, snapshot: _.cloneDeep(this.data) })
      .catch(() => {})
  }
}

export type Status = 'logged_out' | 'disconnected' | 'connected' | 'trying'

export enum ClosedCode {
  ClientInitiated = -1,
  BadParams = 4000,
  BadJSON = 4001,
  Unauthorized = 4002,
  SocketSwitchedOut = 4003,
}

export type SessionEvents = {
  statusChange: (status: Status) => void
  bufferChange: (length: number) => void
  bufferLatency: (milliseconds: number) => void
  serverLatency: (microseconds: number) => void
  loggedOut: (reason: LogoutReason) => void
}

export interface LoginResult {}
export class LoginError extends Error {
  constructor(public code: ClosedCode) {
    super('LoginError: ' + code)
    Object.setPrototypeOf(this, LoginError.prototype)
  }
}
export interface LogoutReason {
  code: ClosedCode
}

interface LoginContext {
  resolve: (r: LoginResult) => void
  reject: (e: LoginError) => void
}

interface PendingPromise {
  resolve: (value: any) => void
  reject: (error: RpcErrorInfo) => void
}

interface PendingRequest {
  at: number
  promises: Array<PendingPromise>
  request: Partial<RpcRequest<any>>
}

const StatisticHistoryWindow = 100
const StatisticHistoryPercentile = 0.9

class Statistic {
  private _history: Array<number> = []

  emitAndGet(v: number): number {
    this._history.push(v)
    if (this._history.length > StatisticHistoryWindow)
      this._history.splice(0, this._history.length - StatisticHistoryWindow)

    const i = Math.floor(StatisticHistoryPercentile * (this._history.length - 1))

    return _.sortBy(this._history, (v) => v)[i]
  }

  average(samples: number): number {
    const historySlice = this._history.slice(-samples)
    return historySlice.reduce((a, b) => a + b, 0) / historySlice.length
  }
}

const VerifyRefsWindow = 10

const PING_DEBUG = false

export class Session {
  constructor(
    public readonly url: string,
    public clientId: string,
    public readonly minBackoffMs = 500,
    public readonly disconnectedBackoffMs = 2_000,
    public readonly maxBackoffMs = 32_000,
    public readonly initDeadline = 5_000,
    public readonly log: RpcMessage[] = []
  ) {}

  _stateId = uuidv4()
  _token: string | null = null
  _userId: string | null = null
  _teamId: string | null = null
  _socket: WebSocket | null = null
  _pingDeadline: NodeJS.Timeout | null = null
  _lastBackoffMs: number | null = null
  _status: Status = 'logged_out'
  _emitter = new EventEmitter()
  _pendingRequests: Array<PendingRequest> = []
  _topics: Record<string, Topic> = {}
  _loginContext: LoginContext | null = null
  _bufferLatency: Statistic = new Statistic()
  _serverLatency: Statistic = new Statistic()
  _lastVerifyRef: string | undefined

  on<K extends keyof SessionEvents>(eventName: K, fn: SessionEvents[K]): void {
    this._emitter.addListener(eventName, fn)
  }

  off<K extends keyof SessionEvents>(eventName: K, fn: SessionEvents[K]): void {
    this._emitter.removeListener(eventName, fn)
  }

  get status(): Status {
    return this._status
  }
  get userId(): string | null {
    return this._userId
  }

  async login(token: string, teamId: string | null = null): Promise<LoginResult> {
    this.logout()
    this.changeStatus('trying')
    this._token = token
    this._teamId = teamId
    return new Promise((resolve, reject) => {
      this._loginContext = { resolve, reject }
      this._connect()
    })
  }

  logout(code: ClosedCode = ClosedCode.ClientInitiated): void {
    if (this._token) {
      this._disconnect()
      this._token = null
      this._teamId = null
      this._userId = null
      if (code !== ClosedCode.ClientInitiated) this.emit('loggedOut', { code })
      this.changeStatus('logged_out')
    }
  }

  subscribe(id: string): Topic {
    let topic = this._topics[id]

    if (!topic) {
      // TODO: This can fail if ID is invalid!

      this._sendRequest('topic_subscribe', { id }).catch(() => {})
      topic = this._topics[id] = new Topic(id, this)
    }

    return topic
  }

  // These functions let you change topic without subscribing to it

  async setTopicKey(id: string, key: string, value: any, ttl: number | null = null): Promise<void> {
    return await this._sendRequest('topic_set_key', {
      id,
      key,
      value,
      ttl,
      ts: this.clientTs(),
    })
  }

  async topicAtomicAdd(
    id: string,
    key: string,
    value: any,
    at: number | string | null,
    ttl: number | null = null
  ): Promise<void> {
    return await this._sendRequest('topic_atomic_add', {
      id,
      key,
      value,
      at,
      ttl,
      ts: this.clientTs(),
    })
  }

  async topicAtomicSubtract(
    id: string,
    key: string,
    value: any,
    at: number | string | null,
    ttl: number | null = null
  ): Promise<void> {
    return await this._sendRequest('topic_atomic_subtract', {
      id,
      key,
      value,
      at,
      ttl,
      ts: this.clientTs(),
    })
  }

  async setTopicPresenceKey(
    id: string,
    key: string,
    value: any,
    ttl: number | null = null
  ): Promise<void> {
    return await this._sendRequest('topic_set_presence_key', {
      id,
      key,
      value,
      ttl,
      ts: this.clientTs(),
    })
  }

  async deleteTopicKey(id: string, key: string): Promise<void> {
    return await this._sendRequest('topic_set_key', {
      id,
      key,
      value: null,
      ttl: null,
      ts: this.clientTs(),
    })
  }

  async deleteTopicPresenceKey(id: string, key: string): Promise<void> {
    return await this._sendRequest('topic_set_presence_key', {
      id,
      key,
      value: null,
      ttl: null,
      ts: this.clientTs(),
    })
  }

  async clearTopicPrefix(id: string, prefix: string): Promise<void> {
    return await this._sendRequest('topic_clear_prefix', {
      id,
      prefix,
      ts: this.clientTs(),
    })
  }

  async clearTopicPresencePrefix(id: string, prefix: string): Promise<void> {
    return await this._sendRequest('topic_clear_presence_prefix', {
      id,
      prefix,
      ts: this.clientTs(),
    })
  }

  // Internal: don't call!

  _disconnect(): void {
    if (this._token) {
      this.close()
      this.resetBackoff()
      this.clearPingDeadline()
      this.changeStatus('disconnected')
    }
  }

  _connect(): void {
    if (this._token) {
      const endpoint =
        this.url +
        '/topicflow/socket?state_id=' +
        this._stateId +
        '&token=' +
        this._token +
        '&client_id=' +
        this.clientId +
        (this._teamId ? '&team_id=' + this._teamId : '')
      this._socket = new WebSocket(encodeURI(endpoint))
      this._socket.onclose = (e) => {
        if (PING_DEBUG) logger.info('TF - close received', e)
        // Reconnect unless explicitly closed by the server-side, also
        // if in the login flow, do not reconnect beyond "disconnected backoff"
        if (
          this.shouldReconnect(e) &&
          (this._loginContext === null || this._lastBackoffMs! <= this.disconnectedBackoffMs)
        )
          this.reconnect()
        else {
          if (this._loginContext) {
            // If in the login flow, reject login promise with the "closed code"...
            this._loginContext.reject(new LoginError(e.code))
            this._loginContext = null
            // ... and do client-initiated logout
            this.logout()
          }
          // Do server-initiated logout if in the non-login flow
          else this.logout(e.code)
        }
      }
      if (PING_DEBUG) logger.info('TF - CONNECT')
      const now = Date.now()
      this._socket.onopen = () => {
        if (PING_DEBUG) logger.info('TF - socket open', Date.now() - now)
        this.setPingDeadline(this.initDeadline)
        this.changeStatus('trying')
      }
      this._socket.onmessage = (e) => {
        _.each(JSON.parse(e.data), (m) => this.handleMessage(m))
      }
    }
  }

  _disrupt(): void {
    setTimeout(() => {
      this._socket?.close()
      this._disrupt()
    }, Math.random() * 1000 + 10000)
  }

  _disruptCold(): void {
    setTimeout(() => {
      this._stateId = uuidv4()
      this._socket?.close()
      this._disruptCold()
    }, Math.random() * 1000 + 10000)
  }

  _disruptManual(): void {
    this._disconnect()
    setTimeout(() => {
      this._connect()
      setTimeout(() => {
        this._disruptManual()
      }, Math.random() * 1000 + 10000)
    }, Math.random() * 1000 + 10000)
  }

  private clientTs(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000)
  }

  private shouldReconnect(e: CloseEvent): boolean {
    return e.code < ClosedCode.BadParams
  }

  private reconnect(): void {
    if (PING_DEBUG) logger.info('TF - RECONNECT')
    if (this._token) {
      let ms = this._lastBackoffMs !== null ? this._lastBackoffMs * 2 : this.minBackoffMs
      ms = Math.min(ms, this.maxBackoffMs)
      ms += ms * 0.2 * Math.random()

      if (this._lastBackoffMs! > this.disconnectedBackoffMs) this.changeStatus('disconnected')
      else this.changeStatus('trying')

      this._lastBackoffMs = ms
      this.close()
      setTimeout(() => this._connect(), ms)
    }
  }

  private emit<K extends keyof SessionEvents>(
    eventName: K,
    ...params: Parameters<SessionEvents[K]>
  ): void {
    try {
      this._emitter.emit(eventName, ...params)
    } catch (e) {
      logger.warn(`Error when emitting Topicflow ${eventName} event`, e)
    }
  }

  private changeStatus(status: Status): void {
    if (this._status !== status) {
      this._status = status
      this.emit('statusChange', status)
    }
  }

  private resetBackoff(): void {
    this._lastBackoffMs = null
  }

  private close(): void {
    if (this._socket) {
      this._socket.onclose = null
      this._socket.onopen = null
      this._socket.onmessage = null
      this._socket.close()
      this._socket = null
    }
  }

  private setPingDeadline(ms: number): void {
    this.clearPingDeadline()
    this._pingDeadline = setTimeout(() => {
      this._socket?.close()
    }, ms)
  }

  private clearPingDeadline(): void {
    if (this._pingDeadline) {
      clearTimeout(this._pingDeadline as any)
      this._pingDeadline = null
    }
  }

  private sendMessages(
    messages: Array<Partial<RpcRequest<never> | RpcSuccess<never> | RpcError>>
  ): void {
    if (messages.length !== 0 && this._socket && this._socket.readyState === WebSocket.OPEN) {
      messages.forEach((m) => (m.jsonrpc = RpcVersion))
      const data = JSON.stringify(messages)
      this._socket.send(data)
    }
  }

  private sendReply(reply: Partial<RpcSuccess<never> | RpcError>): void {
    this.sendMessages([reply])
  }

  private nowMilliseconds(): number {
    return Date.now()
  }

  async _sendRequest<K extends keyof Protocol>(method: K, params?: Protocol[K][0]): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = params ? rpcRequest(method, params) : rpcRequest(method)
      this._pendingRequests.push({
        at: this.nowMilliseconds(),
        promises: [{ resolve, reject }],
        request,
      })
      this.emit('bufferChange', this._pendingRequests.length)
      this.sendMessages([request])
    })
  }

  private handleInit(init: RpcRequest<'init'>): void {
    if (PING_DEBUG) logger.info('TF - init received', init.params?.next_ping_deadline_ms)
    this.sendReply(rpcSuccess(init))
    this.setPingDeadline(init.params.next_ping_deadline_ms)
    this.changeStatus('connected')
    this.resetBackoff()

    if (this._loginContext) {
      this._loginContext.resolve({})
      this._loginContext = null
    }
  }

  private handlePing(ping: RpcRequest<'ping'>): void {
    this.sendReply(rpcSuccess(ping))
    this.setPingDeadline(ping.params.next_ping_deadline_ms)
  }

  private handleColdSync(coldSync: RpcRequest<'cold_sync'>): void {
    this.sendReply(rpcSuccess(coldSync))

    this._userId = coldSync.params.user_id

    this.compressPendingRequests()
    const requests = _.map(this._pendingRequests, (pr) => pr.request)

    _.each(_.mapValues(this._topics), (topic) =>
      this._sendRequest('topic_subscribe', { id: topic.id }).catch(() => {})
    )

    this.sendMessages(requests)
  }

  private handleWarmSync(warmSync: RpcRequest<'warm_sync'>): void {
    this.sendReply(rpcSuccess(warmSync))
    this.compressPendingRequests()
    this.sendMessages(_.map(this._pendingRequests, (pr) => pr.request))
  }

  private compressPendingRequests(): void {
    const [setKeys, other0] = _.partition(
      this._pendingRequests,
      (pr) => pr.request.method === 'topic_set_key'
    )
    const [setPresenceKeys, other1] = _.partition(
      other0,
      (pr) => pr.request.method === 'topic_set_presence_key'
    )

    const compressedSetKeys = _.flatten(
      _.map(
        _.groupBy(setKeys, (pr) => (pr.request.params as TopicSetKey).id),
        (setKeys, id) => {
          return _.map(
            _.groupBy(setKeys, (pr) => (pr.request.params as TopicSetKey).key),
            (setKeys, key) => {
              const last: TopicSetKey = _.last(
                _.sortBy(setKeys, (pr) => (pr.request.params as TopicSetKey).ts)
              )!.request.params
              const promises = _.flatten(_.map(setKeys, (pr) => pr.promises))
              const at = _.min(_.map(setKeys, (pr) => pr.at))

              // TODO: check last.ttl against last.ts to determine if
              // the key might be stale and should be ignored, otherwise
              // adjust the ttl for the pending time.

              return {
                at,
                promises,
                request: rpcRequest('topic_set_key', {
                  id,
                  key,
                  value: last.value,
                  ttl: last.ttl,
                  ts: last.ts,
                }),
              } as PendingRequest
            }
          )
        }
      )
    )

    const compressedSetPresenceKeys = _.flatten(
      _.map(
        _.groupBy(setPresenceKeys, (pr) => (pr.request.params as TopicSetKey).id),
        (setKeys, id) => {
          return _.map(
            _.groupBy(setKeys, (pr) => (pr.request.params as TopicSetKey).key),
            (setKeys, key) => {
              const last: TopicSetKey = _.last(
                _.sortBy(setKeys, (pr) => (pr.request.params as TopicSetKey).ts)
              )!.request.params
              const promises = _.flatten(_.map(setKeys, (pr) => pr.promises))
              const at = _.min(_.map(setKeys, (pr) => pr.at))

              // TODO: check last.ttl against last.ts to determine if
              // the key might be stale and should be ignored, otherwise
              // adjust the ttl for the pending time.

              return {
                at,
                promises,
                request: rpcRequest('topic_set_presence_key', {
                  id,
                  key,
                  value: last.value,
                  ttl: last.ttl,
                  ts: last.ts,
                }),
              } as PendingRequest
            }
          )
        }
      )
    )

    this._pendingRequests = _.flatten([other1, compressedSetKeys, compressedSetPresenceKeys])
    this.emit('bufferChange', this._pendingRequests.length)
  }

  private handleTopicSnapshot(topicSnapshot: RpcRequest<'topic_snapshot'>): void {
    this.sendReply(rpcSuccess(topicSnapshot))

    const id = topicSnapshot.params.id
    const snapshot = topicSnapshot.params.snapshot
    const epoch = topicSnapshot.params.epoch
    const topic = this._topics[id]

    topic?._handleSnapshot(snapshot, epoch)
  }

  private handleTopicVerifyRequest(topicVerifyRequest: RpcRequest<'topic_verify_request'>): void {
    this.sendReply(rpcSuccess(topicVerifyRequest))

    const id = topicVerifyRequest.params.id
    const ref = topicVerifyRequest.params.ref

    if (this._lastVerifyRef != ref) {
      this._lastVerifyRef = ref
      const topic = this._topics[id]

      topic?._handleVerifyRequest(ref)
    }
  }

  private handleTopicDiff(topicDiff: RpcRequest<'topic_diff'>): void {
    this.sendReply(rpcSuccess(topicDiff))

    const id = topicDiff.params.id
    const diff = topicDiff.params.diff
    const topic = this._topics[id]

    topic?._handleDiff(diff)
  }

  private handleMessage(message: RpcRequest<never> | RpcSuccess<never> | RpcError): void {
    this.logMessage(message)
    if (message.jsonrpc === RpcVersion) {
      if ('method' in message) {
        if (message.method === 'init') this.handleInit(message as RpcRequest<'init'>)
        else if (message.method === 'ping') this.handlePing(message as RpcRequest<'ping'>)
        else if (message.method === 'cold_sync')
          this.handleColdSync(message as RpcRequest<'cold_sync'>)
        else if (message.method === 'warm_sync')
          this.handleWarmSync(message as RpcRequest<'warm_sync'>)
        else if (message.method === 'topic_diff')
          this.handleTopicDiff(message as RpcRequest<'topic_diff'>)
        else if (message.method === 'topic_snapshot')
          this.handleTopicSnapshot(message as RpcRequest<'topic_snapshot'>)
        else if (message.method === 'topic_verify_request')
          this.handleTopicVerifyRequest(message as RpcRequest<'topic_verify_request'>)
        else this.sendReply(rpcMessageNotFoundError(message))
      } else {
        if ('meta' in message)
          this.emit('serverLatency', this._serverLatency.emitAndGet(message.meta.us))

        const pr = this.ack(message)
        if (pr) {
          if ('error' in message) _.each(pr.promises, (p) => p.reject(message.error))
          else _.each(pr.promises, (p) => p.resolve(null))
        }
      }
    }
  }

  private logMessage(message: RpcRequest<never> | RpcSuccess<never> | RpcError): void {
    if (config.env != 'prod') {
      this.log.push(message)
      if (this.log.length > 5000) {
        this.log.shift()
      }
    }
  }

  private ack(reply: RpcSuccess<never> | RpcError): PendingRequest {
    const now = this.nowMilliseconds()
    const [acked, nonAcked] = _.partition(this._pendingRequests, (pr) => pr.request.id == reply.id)
    this._pendingRequests = nonAcked
    _.each(acked, (pr) => this.emit('bufferLatency', this._bufferLatency.emitAndGet(now - pr.at)))
    this.emit('bufferChange', this._pendingRequests.length)
    return _.head(acked)!
  }
}
