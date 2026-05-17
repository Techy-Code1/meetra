import * as mediasoupClient from "mediasoup-client";

let device;

export const createDevice =  async (routerRtpCapabilities) => {
    try {
        device = new mediasoupClient.Device();

        await device.load({
            routerRtpCapabilities,
        });
        console.log("Device loaded");
        
    } catch (error) {
        console.error(error);
        
    }
};

export const getDevice = () => device;