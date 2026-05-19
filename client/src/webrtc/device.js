import * as mediasoupClient from "mediasoup-client"; 

let device;

export const createDevice =  async (routerRtpCapabilities) => {
    try {
        device = new mediasoupClient.Device(); // Create a new mediasoup client device instance

        await device.load({
            routerRtpCapabilities, //codecs and other media capabilities like codecs (VP8, VP9, H264) and audio codecs (Opus, G722) supported by the server
        });
        console.log("Device loaded");
        
    } catch (error) {
        console.error(error);
        
    }
};

export const getDevice = () => device;