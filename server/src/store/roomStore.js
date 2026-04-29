function createRoomStore() {
  const rooms = new Map();

  function get(roomCode) {
    return rooms.get(roomCode) || null;
  }

  function set(roomCode, room) {
    rooms.set(roomCode, room);
  }

  function remove(roomCode) {
    rooms.delete(roomCode);
  }

  function has(roomCode) {
    return rooms.has(roomCode);
  }

  return {
    get,
    set,
    remove,
    has,
  };
}

module.exports = {
  createRoomStore,
};
