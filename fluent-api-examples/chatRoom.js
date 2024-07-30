import EventEmitter from "events";
import readline from "readline";

function createChatSystem() {
  const users = new Map();
  const chatRooms = new Map();

  // Closure principal
  return {
    createUser(userId) {
      if (users.has(userId)) {
        throw new Error("User already exists");
      }

      const userEmitter = new EventEmitter();
      const userRooms = new Set();

      // Closure para cada usuario
      const user = {
        joinRoom(roomId) {
          if (!chatRooms.has(roomId)) {
            chatRooms.set(roomId, new Set());
          }
          chatRooms.get(roomId).add(userId);
          userRooms.add(roomId);

          // Closure para cada sala que el usuario se une
          return {
            sendMessage(message) {
              chatRooms.get(roomId).forEach((memberId) => {
                if (memberId !== userId) {
                  users.get(memberId).receiveMessage(roomId, userId, message);
                }
              });
            },
            leaveRoom() {
              chatRooms.get(roomId).delete(userId);
              userRooms.delete(roomId);
            },
          };
        },
        receiveMessage(roomId, senderId, message) {
          userEmitter.emit("message", { roomId, senderId, message });
        },
        onMessage(callback) {
          userEmitter.on("message", callback);
        },
        getRooms() {
          return [...userRooms];
        },
        sendDirectMessage(receiverId, message) {
          const receiver = users.get(receiverId);
          if (receiver) {
            receiver.receiveMessage("DM", userId, message);
          } else {
            throw new Error("Receiver not found, got", receiverId);
          }
        },
      };

      users.set(userId, user);
      return user;
    },
    removeUser(userId) {
      const user = users.get(userId);
      if (user) {
        user.getRooms().forEach((roomId) => {
          chatRooms.get(roomId).delete(userId);
        });
        users.delete(userId);
      }
    },
  };
}

// Uso del sistema de chat
const chatSystem = createChatSystem();

const alice = chatSystem.createUser("Alice");
const bob = chatSystem.createUser("Bob");

const room1 = alice.joinRoom("room1");
const room2 = bob.joinRoom("room1");

alice.onMessage(({ roomId, senderId, message }) => {
  console.log(`Alice received in ${roomId} from ${senderId}: ${message}`);
});

// Configuración de la interfaz de línea de comandos
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Chat iniciado. Escribe tus mensajes (Alice a Bob):");

// Manejador de mensajes para Bob
bob.onMessage(({ roomId, senderId, message }) => {
  console.log(`\nBob received in ${roomId} from ${senderId}: ${message}`);
  rl.prompt(); // Vuelve a mostrar el prompt después de recibir un mensaje
});

room1.sendMessage("Hello, Bob!");
alice.sendDirectMessage("Bob", "Hola Bob, este es un mensaje directo");

// Función para procesar la entrada del usuario
function processInput(input) {
  if (input.toLowerCase() === "salir") {
    console.log("Cerrando el chat...");
    rl.close();
    process.exit(0);
  } else if (input.startsWith("/dm ")) {
    const [, receiverId, ...messageParts] = input.split(" ");
    const message = messageParts.join(" ");
    alice.sendDirectMessage(receiverId, message);
  } else {
    room1.sendMessage(input);
  }
  rl.prompt();
}

// Configurar el prompt y manejar la entrada
rl.setPrompt("> ");
rl.prompt();
rl.on("line", processInput);

// Manejar el cierre de la interfaz
rl.on("close", () => {
  console.log("Chat finalizado.");
  process.exit(0);
});
