// Configuration for the P2P Chat application
const config = {
    // Mandatory peers that all nodes will send messages to
    mandatoryPeers: [
        { ip: "10.206.4.122", port: 1255 },
        { ip: "10.206.5.228", port: 6555 }
    ],
    isRequired: false,  // false -> No automatic forwading of messages to mandatory peers
};

export default config;