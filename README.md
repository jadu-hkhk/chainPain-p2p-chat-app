# P2P Chat Application

A TCP-based peer-to-peer chat system built with Node.js, featuring real-time messaging and automatic peer management. Each node functions as both client and server, enabling direct communication between peers while maintaining network consistency.

## Features

- Real-time message transmission with standardized format
- Comprehensive peer connection management
- Interactive menu system for network operations
- Connection Request Protocol **(Bonus implemented)**
- Graceful connection handling and error management
- Automatic message forwarding to mandatory peers (configurable)

## Technical Implementation

### Connection Request Protocol

The application implements connection request protocol:

1. User provides IP address and port number of the target peer
2. Connection request is sent in format: `<ip:port> <teamName> connect`
3. Target peer automatically sends back a `connected` confirmation
4. Connection times out if no response within 5 seconds
5. Established connections are maintained for future message exchanges

### Message Protocol

All messages follow the standardized format:

```
<ip:port> <teamName> <message>
```

### Connection States

Peers can exist in several states:

- `connected`: Direct socket connection established and maintained
- `message_received`: Message received from this peer, but no persistent connection
- `disconnected`: Previously connected peer that has disconnected

## Configuration

Before running the application, you can modify `config.js` to:

- Enable/disable automatic message forwarding to mandatory peers (`isRequired`)
- Configure mandatory peer addresses

## Running the Application

Prerequisites:

- Node.js installed
- npm (Node Package Manager)

Setup and run:

```bash
# Clone the repository
git clone https://github.com/jadu-hkhk/chainPain-p2p-chat-app
cd chainPain-p2p-chat-app

# Start the application
npm run start
```

## Team Information

Team Name: chainPain
Members:

- Himanshu (230002029)
- Ashish Donth (230008011)
- Aditya Kumar Prasad (230005003)
