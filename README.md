# P2P Chat Application

A TCP-based peer-to-peer chat system built with Node.js, featuring real-time messaging and automatic peer management. Each node functions as both client and server, enabling direct communication between peers while maintaining network consistency.

## Features
- Real-time message transmission with standardized format
- Comprehensive peer connection management
- Interactive menu system for network operations
- Direct peer connections **(bonus functionality)**
- Graceful connection handling and error management

## Running the Application

Prerequisites:
- Node.js installed
- npm (Node Package Manager)

Clone the repository:
```bash
git clone https://github.com/jadu-hkhk/chainPain-p2p-chat-app
cd chainPain-p2p-chat-app
```

Before running the application, you can configure mandatory peer settings in config.js. Setting `isRequired: true` will enable automatic message forwarding to mandatory peers. You can also customize the mandatory peer addresses in this file.

Start the application by running the command:
```bash
npm run start
```

## Team Information
Team Name: chainPain
Members:
- Himanshu (230002029)
- Ashish Donth (230008011)
- Aditya Kumar Prasad (230005003)