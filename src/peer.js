import net from 'net';
import readline from 'readline';
import config from './config.js';

class P2PChat {
    constructor(name, port, ip) {
        this.name = name;
        this.port = port;
        this.ip = ip;
        this.peers = new Map();
        this.server = null;
        this.MandatoryPeers = config.isRequired ? config.mandatoryPeers : [];

        //for user input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    // Start the server
    async startServer() {
        return new Promise((resolve) => {
            this.server = net.createServer((socket) => {
                this.handleConnection(socket);
            });

            this.server.listen(this.port, () => {
                console.log(`Server listening on port ${this.port}`);
                resolve();
            });
        });
    }

    // Handles new incoming connections
    handleConnection(socket) {
        let peerAddress;

        socket.on('data', async (data) => {
            const message = data.toString().trim();
            peerAddress = message.split(' ')[0];
            await this.handleMessage(message, socket);

        });

        socket.on('error', (err) => {
            console.error(`Socket error for ${peerAddress}:`, err);
            this.handlePeerDisconnection(peerAddress, socket);
        });

        socket.on('close', () => {
            this.handlePeerDisconnection(peerAddress, socket);
        });
    }

    // Handle peer disconnection
    handlePeerDisconnection(address, socket) {
        const peer = this.peers.get(address);
        if (peer && peer.socket === socket) {
            peer.type = 'disconnected';
            console.log(`\n\nPeer ${peer.teamName} (${address}) has disconnected`);
            socket.destroy();
        }
    }

    // Processes incoming messages from peers
    // Handles special commands (exit, connect) and regular messages
    async handleMessage(message, socket) {
        const parts = message.split(' ');
        if (parts.length >= 3) {
            const [address, teamName, ...messageParts] = parts;
            const actualMessage = messageParts.join(' ');

            if (actualMessage.toLowerCase() === 'exit') {
                await this.handleExitMessage(address, socket);
                return;
            }

            // * Handle connection
            if (actualMessage.toLowerCase() === 'connect') {
                this.peers.set(address, {
                    teamName,
                    type: 'connected',
                    socket: socket
                });
                console.log(`\nNew connection established with ${teamName} (${address})`);

                // Send handshake feedback message back to the connecting peer
                const feedbackMessage = `${this.ip}:${this.port} ${this.name} connected`;
                socket.write(feedbackMessage);

                this.showMenu();
                return;
            }

            // Store/update peer info for regular messages
            if (!this.peers.has(address)) {
                this.peers.set(address, {
                    teamName,
                    type: 'message_received',
                    socket: null
                });
            } else {
                const peer = this.peers.get(address);
                if (peer.type === 'disconnected') {
                    peer.type = 'message_received';
                }
            }

            console.log("\n=====================");
            console.log(`Message Received`);
            console.log(`From: ${teamName} (${address})`);
            console.log(`Message: ${actualMessage}`);
            console.log("=====================");
            this.showMenu();
        }
    }

    // Handles exit messages from peers.
    //Closes the connection and removes the peer from active list.
    async handleExitMessage(address, socket) {
        const peer = this.peers.get(address);

        if (peer) {
            this.peers.delete(address);
            if (peer.socket) {
                peer.socket.end();
            }

            console.log(`\nPeer ${peer.teamName} (${address}) has disconnected`);

            this.showMenu();
        }
    }

    // Displays the main menu interface.
    // Provides options for sending messages, querying peers, and managing connections.
    showMenu() {
        console.log('\n***** Menu *****');
        console.log('1. Send message');
        console.log('2. Query active peers');
        console.log('3. Connect to a active peer');
        console.log('4. Quit');
        console.log('====================');

        this.rl.question('Enter choice: ', (choice) => {
            this.handleMenuChoice(choice);
        });
    }

    // Processes user menu selections.
    // Routes to appropriate handler functions based on user choice.
    handleMenuChoice(choice) {
        switch (choice) {
            case '1':
                this.sendMessagePrompt();
                break;
            case '2':
                this.queryPeers();
                break;
            case '3':
                this.connectToPeer();
                break;
            case '4':
                this.quit();
                break;
            default:
                console.log('❌ Invalid choice. Please try again.');
                this.showMenu();
        }
    }

    // Prompts user for input
    async question(prompt) {

        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    //send message prompt
    async sendMessagePrompt() {
        try {
            const ip = await this.question('Enter the recipient\'s IP address: ');
            const port = await this.question('Enter the recipient\'s port number: ');
            const message = await this.question('Enter your message: ');
            await this.sendMessage(ip, port, message);
        } catch (err) { }
    }

    //connect to active peer prompt
    async connectToPeer() {
        try {
            const ip = await this.question('Enter peer\'s IP address: ');
            const port = await this.question('Enter peer\'s port number: ');
            await this.sendMessage(ip, port, 'connect');
            console.log('Connection request sent!');
        } catch (err) { }
    }

    // Send message to a peer
    async sendMessage(ip, port, message) {
        return new Promise((resolve, reject) => {
            const peerAddress = `${ip}:${port}`;
            const formattedMessage = `${this.ip}:${this.port} ${this.name} ${message}`;
            const peer = this.peers.get(peerAddress);

            if (peer && peer.type === 'connected' && peer.socket && !peer.socket.destroyed) {
                try {
                    if (message.toLowerCase() === 'exit') {
                        peer.type = 'disconnected';
                    }

                    peer.socket.write(formattedMessage);
                    console.log('Message sent through existing connection!');

                    this.showMenu();
                    resolve();
                    return;
                } catch (err) {
                    console.error(`Error sending message to existing socket: ${err.message}`);
                }
            }

            const client = new net.Socket();
            client.connect(port, ip, async () => {
                try {
                    client.write(formattedMessage);
                    const myAddress = this.ip;
                    const myPort = this.port;

                    // Track sent mandatory peers to avoid infinite loop due to recursive calls
                    const sentMandatoryPeers = new Set();
                    for (const { ip, port } of this.MandatoryPeers) {
                        // Avoid sending to self
                        if (ip === myAddress && port === myPort) {
                            console.log(`Not sending message to self: ${ip}:${port}`);
                            continue;
                        }
                        const mandatoryPeerAddress = `${ip}:${port}`;
                        if (!sentMandatoryPeers.has(mandatoryPeerAddress)) {
                            await this.sendMessage(ip, port, message);
                            console.log(`Message sent to mandatory peer ${ip}:${port}!`);
                            sentMandatoryPeers.add(mandatoryPeerAddress);
                        }
                    }

                    // * Handle connection feedback message
                    if (message.toLowerCase() === 'connect') {
                        const timeout = setTimeout(() => {
                            client.destroy();
                            console.error(`Connection request to ${peerAddress} timed out`);
                            this.showMenu();
                        }, 5000);

                        client.once('data', (data) => {
                            const feedbackMessage = data.toString().split(' ');
                            if (feedbackMessage[2] === 'connected') {
                                this.peers.set(peerAddress, {
                                    teamName: feedbackMessage[1],
                                    type: 'connected',
                                    socket: client
                                });
                                console.log(`\nConnection confirmed with ${feedbackMessage[1]} (${peerAddress})`);
                                clearTimeout(timeout);
                                this.handleConnection(client);
                                this.showMenu();
                            }
                        });

                        resolve();
                        return;
                    }

                    // For regular messages, close socket after sending
                    await new Promise(resolve => client.end(resolve));
                    console.log('Message sent successfully!');
                    this.showMenu();
                    resolve();
                } catch (err) {
                    console.error(`Error while sending message: ${err.message}`);
                    client.destroy();
                    this.showMenu();
                    reject(err);
                }
            });

            client.on('error', (err) => {
                let errorMessage = 'Failed to send message: ';

                if (err.code === 'ECONNREFUSED') {
                    errorMessage += `Peer ${peerAddress} is not available or not listening`;
                } else if (err.code === 'EHOSTUNREACH') {
                    errorMessage += `Cannot reach host ${ip}`;
                } else if (err.code === 'ENETUNREACH') {
                    errorMessage += 'Network is unreachable';
                } else {
                    errorMessage += err.message;
                }

                console.error(`\n${errorMessage}`);
                client.destroy();
                this.showMenu();
                reject(err);
            });
        });
    }

    // Query active peers
    queryPeers() {
        if (this.peers.size === 0) {
            console.log('🔍 No active peers');
        } else {
            console.log('\n===== Active Peers =====');
            console.log(`Total peers: ${this.peers.size}`);
            console.log('-------------------------');
            let i = 1;

            for (const [address, peer] of this.peers.entries()) {
                console.log(`  ${i}. ${peer.teamName} (${address}) - ${peer.type}`);
                i++;
            }

            console.log('\n=========================');
        }
        this.showMenu();
    }

    // Quits application
    // Sends exit messages to all peers 
    async quit() {
        console.log('Sending exit message to peers...');

        const exitPromises = Array.from(this.peers.entries()).map(async ([address, _]) => {
            const [ip, port] = address.split(':');
            try {
                await this.sendMessage(ip, port, 'exit');
                console.log(`Exit message sent to ${address}`);
            } catch (err) {
                console.error(`Failed to send exit message to ${address}:`, err.message);
            }
        });

        await Promise.all(exitPromises);

        console.log('Exiting...');
        if (this.server) {
            this.server.close();
            console.log('Server closed!');
        }
        this.rl.close();
        process.exit(0);
    }
}

// **Main function**
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const name = await new Promise(resolve => rl.question('Enter your name: ', resolve));
        const ip = await new Promise(resolve => rl.question('Enter your IP address: ', resolve));
        const port = await new Promise(resolve => rl.question('Enter your port number: ', resolve));

        rl.close();

        const chat = new P2PChat(name, parseInt(port), ip);
        await chat.startServer();
        chat.showMenu();
    } catch (err) {
        console.error('Error starting application:', err);
        process.exit(1);
    }
}

main();