const producers = new Map();

// Tracks producer ids per socket so all camera/mic tracks close on disconnect.
const socketProducers = new Map();

export const addProducer = (socketId, roomId, producer) => {
    // Attach the socket ID and room ID to the producer's appData for tracking
    producer.appData = {
        ...producer.appData,
        socketId,
        roomId,
    };

    producers.set(producer.id, producer);

    const producerIds = socketProducers.get(socketId) || new Set();
    producerIds.add(producer.id);
    socketProducers.set(socketId, producerIds);
};

export const getProducer = (producerId) => {
    return producers.get(producerId);
};

export const getAllProducers = () => {
    return producers;
};

export const getProducersForRoom = (roomId, excludeSocketId) => {
    // Send existing room producers to the newly joined socket only.
    return [...producers.values()]
        .filter((producer) => (
            producer.appData?.roomId === roomId &&
            producer.appData?.socketId !== excludeSocketId &&
            !producer.closed
        ))
        .map((producer) => ({
            producerId: producer.id,
            socketId: producer.appData.socketId,
            kind: producer.kind,
        }));
};
 
// Closes all producers associated with the given socket ID and removes them from the producers map.
export const removeProducersForSocket = (socketId) => {
    const producerIds = socketProducers.get(socketId);

    if (!producerIds) return;

    for (const producerId of producerIds) {
        const producer = producers.get(producerId);

        if (producer && !producer.closed) {
            producer.close();
        }

        producers.delete(producerId);
    }

    socketProducers.delete(socketId);
};
