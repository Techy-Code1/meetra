import { useEffect, useRef } from "react";

const VideoPlayer = ({ stream, muted = false }) => {
  const ref = useRef();

  // When the stream changes, update the video element's srcObject.
  //srcObject is a special property that lets you directly assign that MediaStream to the video/audio element.

  useEffect(() => {
    if (stream && ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(err => console.log("Play error:", err));
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      style={{ 
        width: "300px", 
        border: "2px solid black",
        backgroundColor: "#000"
      }}
    />
  );
};

export default VideoPlayer;