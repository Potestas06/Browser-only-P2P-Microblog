# Browser-only P2P Microblog
<img width="512" height="512" alt="ChatGPT Image Jan 5, 2026, 10_27_58 AM" src="https://github.com/user-attachments/assets/1e55c5e8-15cc-4a4b-b17e-8b2297d1948e" />


## Overview
An invite-only, browser-based peer-to-peer microblogging network. Every client is a peer. There is no central backend, no API server, and no shared database. Content is signed, immutable, and distributed via WebRTC DataChannels using gossip and peer introductions.

The system behaves like a social torrent: once you are connected to a single peer, the network expands automatically.

## Goals
1. No central infrastructure, no backend services
2. Invite-only onboarding to solve bootstrap and spam
3. Cryptographic identity per user
4. Content-addressed storage with deterministic IDs
5. Browser-only peers, offline-first
6. Transparent and explainable data flow

## Non-Goals
1. Guaranteed global availability when peers are offline
2. Central moderation or ranking algorithms
3. Editing posts in place
4. Strong anonymity against state-level adversaries

## Tech Stack
- React + TypeScript
- Vite
- WebRTC DataChannels
- IndexedDB via Dexie
- Ed25519 signatures via noble-ed25519 or tweetnacl
- SHA-256 via Web Crypto API
- Canonical JSON serialization
- Tailwind CSS + shadcn/ui

## Core Concepts

### Identity
- On first launch, the client generates an Ed25519 key pair
- The public key is the stable identity
- Usernames and profiles are purely local aliases

### Data Objects
All objects are immutable and signed.

Object types
- Post
- Reply
- Repost
- PeerRecord
- FollowList (local)
- BlockList (local or subscribed)

### Addressing
- objectId = SHA-256(canonicalJson(payload))
- Signatures are created over the canonical payload or its hash

### Transport
- All communication uses WebRTC DataChannels
- First connection is established via invite code (QR or copy/paste)
- Further peers are discovered automatically via introductions

### Discovery and Replication
- Gossip protocol exchanges peer lists and object summaries
- Missing objects are fetched on demand
- Objects are deduplicated via objectId

## Repository Structure
```
p2p-microblog/
  apps/
    web/
      src/
        components/
        pages/
        state/
        webrtc/
        storage/
        protocol/
  packages/
    core/
      src/
        crypto/
        canonical/
        types/
        protocol/
        storage/
        utils/
  docs/
    protocol-v0.1.md
    threat-model.md
    roadmap.md
  .github/
    workflows/
  README.md
```

## Protocol v0.1 Scope
All messages are JSON encoded for the MVP.

### Message Envelope
- type
- id
- from (public key)
- timestamp
- payload
- signature (over canonical envelope without signature field)

### Message Types
1. hello
   - Exchange protocol version and capabilities
2. peer_list
   - List of known peers (public keys only)
3. introduce_request
   - Request introduction to a third peer
4. introduce_offer
   - Forwarded SDP offer
5. introduce_answer
   - Forwarded SDP answer
6. objects_have
   - Summary of available objectIds
7. object_get
   - Request object by objectId
8. object_put
   - Transfer of signed object

## Milestones

### Milestone 0 Project Setup
Goal
- Monorepo and build pipeline

Done when
- Web app builds and runs
- Core package is imported successfully

### Milestone 1 Identity and Storage
Goal
- Persistent cryptographic identity and object storage

Done when
- Identity survives reload
- Stored posts can be retrieved deterministically

### Milestone 2 Invite-based 1:1 Connection
Goal
- Manual pairing between two browsers

Done when
- Two devices exchange messages via WebRTC

### Milestone 3 Post Creation and Sync
Goal
- Create, sign, transfer, store, and display posts

Done when
- Posts propagate between connected peers

### Milestone 4 Gossip Discovery
Goal
- Automatic peer discovery

Done when
- Peer-of-peer discovery works without manual steps

### Milestone 5 Peer Introductions
Goal
- Automatic direct connections to new peers

Done when
- New peers connect via existing peers without user input

### Milestone 6 Social Graph and Moderation
Goal
- Local control over content visibility

Done when
- Follow, mute, and block work locally

### Milestone 7 Stability and UX
Goal
- Usable for small real-world groups

Done when
- Stable with 5–20 peers
- Diagnostics page available

## Quality Criteria
- Deterministic hashing and signatures
- No silent failures
- Fully local persistence
- Debuggable network state

## Security and Threat Model (Summary)
- Signatures prevent content tampering
- Invite-only reduces spam and Sybil attacks
- Blocklists are local or optionally subscribed
- Rate limits and message size limits protect peers

## Local Development
- dev: start web client
- build: production build
- test: core unit tests
- lint: linting

## Future Ideas
- Topic-based feeds
- Magnet-style reposts
- Partial replication and pinning
- MessagePack encoding
- End-to-end encrypted private messages

