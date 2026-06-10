const getLocalStream = async (constraints = { video: true, audio: true }) => {
    try{
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
    }catch(error){
        console.error("Error accessing media devices.", error);
        throw error;
    }
};

export default getLocalStream;
