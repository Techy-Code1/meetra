const consumers = new Map();

const socketConsumers = new Map();

export const addConsumer = (socketId, consumer) => {
    // Attach the socket ID to the consumer's appData for tracking
    consumer.appData = {
        ...consumer.appData,
        socketId,
    };
    consumers.set(consumer.id, consumer);

    // Retrieve or initialize the set of consumer IDs for the given socket ID
    const consumerIds = socketConsumers.get(socketId) || new Set();
    consumerIds.add(consumer.id);

    // Update the socketConsumers map with the new set of consumer IDs
    socketConsumers.set(socketId, consumerIds);
};

export const getConsumer = (consumerId) => {
    return consumers.get(consumerId);
};

export const removeConsumersForSocket = (socketId) => {
    const consumerIds = socketConsumers.get(socketId); // Get the set of consumer IDs associated with the given socket ID

    if (!consumerIds) return;

    for (const consumerId of consumerIds) {
        const consumer = consumers.get(consumerId);

        // Close the consumer if it exists and is not already closed
        if (consumer && !consumer.closed) {
            consumer.close();
        }

        consumers.delete(consumerId);
    }

    socketConsumers.delete(socketId);
};
