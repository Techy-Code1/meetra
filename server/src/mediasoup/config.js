//Codecs: Codecs are software (sometimes with hardware support) that 
//        compress audio/video before sending it over the network and decompress it at the receiving end.

export const mediaCodecs = [
    {
        kind: 'audio',                // Type of media (audio)
        mimeType: "audio/opus",       //Opus: packs/unpacks your voice
        clockRate: 48000,             // (audio and video packets synchronized ) 48kHz sample rate
        channels: 2                   // Stereo(left and right audio channels)
    },
    {
        kind: 'video',
        mimeType: "video/VP8",        // VP8: compresses video frames
        clockRate: 90000,               
        parameters: {
            'x-google-start-bitrate': 1000, // Initial bitrate for video streaming (in kbps)
            
        },
    },
]