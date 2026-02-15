export type MessageHandler = (data: unknown) => void;
export type StateChangeHandler = (state: RTCPeerConnectionState) => void;

export class PeerConnection {
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private messageHandler: MessageHandler | null = null;
  private stateHandler: StateChangeHandler | null = null;
  remotePubkey: string;

  constructor(remotePubkey: string, config?: RTCConfiguration) {
    this.remotePubkey = remotePubkey;
    this.pc = new RTCPeerConnection(
      config ?? { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
    );

    this.pc.onconnectionstatechange = () => {
      this.stateHandler?.(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      if (this.pc.iceConnectionState === "failed") {
        this.pc.restartIce();
      }
    };

    this.pc.ondatachannel = (event) => {
      this.setupChannel(event.channel);
    };
  }

  setupChannel(channel: RTCDataChannel) {
    this.channel = channel;
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.messageHandler?.(data);
      } catch {
        // ignore malformed messages
      }
    };
    channel.onerror = (event) => {
      console.warn("DataChannel error", event);
    };
  }

  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  onStateChange(handler: StateChangeHandler) {
    this.stateHandler = handler;
  }

  waitForOpen(): Promise<void> {
    if (this.channel?.readyState === "open") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Connection timed out")), 30_000);
      const check = () => {
        if (this.pc.connectionState === "connected") {
          clearTimeout(timer);
          this.pc.removeEventListener("connectionstatechange", check);
          resolve();
        } else if (
          this.pc.connectionState === "failed" ||
          this.pc.connectionState === "closed"
        ) {
          clearTimeout(timer);
          this.pc.removeEventListener("connectionstatechange", check);
          reject(new Error("Connection failed"));
        }
      };
      this.pc.addEventListener("connectionstatechange", check);
    });
  }

  send(data: unknown) {
    if (this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify(data));
    }
  }

  get connectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  getPeerConnection(): RTCPeerConnection {
    return this.pc;
  }

  close() {
    this.channel?.close();
    this.pc.close();
  }
}
