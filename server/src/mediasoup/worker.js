import mediasoup from 'mediasoup';

//Worker is a process that runs in the background and manages the media processing for WebRTC connections. 
// It is responsible for handling the media streams, encoding, decoding, and routing of media data between clients. 

let worker;

export const createWorker = async () => {
    worker = await mediasoup.createWorker({
        rtcMinPort: 2000, // Minimum port number for WebRTC connections
        rtcMaxPort: 2020, // Maximum port number for WebRTC connections
    });

    console.log("Mediasoup Worker Created");

    worker.on('died', () => {
        console.error('Mediasoup worker has died');
        setTimeout(() => process.exit(1), 2000);
    });

    return worker;
};

export const getWorker = () => worker;  
