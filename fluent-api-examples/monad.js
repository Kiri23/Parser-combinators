// Monad es la contestacion para hacer fluent API
// Monad map aplana el resultaod
// monad aplica una funcion pero devuelve la misma estrutcutra (mismo objeto)
// https://dev.to/rgeraldporter/building-expressive-monads-in-javascript-introduction-23b
// Mónada genérica
class Monad {
  constructor(value) {
    this.value = value;
  }

  static of(value) {
    return new Monad(value);
  }

  map(fn) {
    return Monad.of(fn(this.value));
  }

  chain(fn) {
    return fn(this.value);
  }
}

// Uso
const result = Monad.of(5)
  .map((x) => x * 2)
  .chain((x) => Monad.of(x + 1))
  .map((x) => x * 3);

console.log(result.value); // 33

const net = require("net");

// Mónada ServerSocket
const ServerSocket = {
  of: (socket) => ({
    socket,
    map: (f) => ServerSocket.of(f(socket)),
    chain: (f) => f(socket),
    onData: (f) => ServerSocket.of(socket.on("data", f)),
    write: (data) => ServerSocket.of(socket.write(data)),
    end: () => ServerSocket.of(socket.end()),
  }),
};

// Mónada Server
const Server = {
  create: () => {
    const server = net.createServer();
    return {
      server,
      map: (f) => Server.create(f(server)),
      chain: (f) => f(server),
      listen: (port, host) =>
        new Promise((resolve) => {
          server.listen(port, host, () => resolve(Server.create(server)));
        }),
      onConnection: (f) => {
        server.on("connection", (socket) => f(ServerSocket.of(socket)));
        return Server.create(server);
      },
    };
  },
};

// Uso
Server.create()
  .chain((server) => server.listen(10337, "192.168.100.1"))
  .chain((server) =>
    server.onConnection((socket) =>
      socket
        .map(() => console.log(new Date() + "A client connected to server..."))
        .onData((data) => {
          const json = JSON.parse(data.toString());
          console.log(json);
        })
        .write("Echo from server: NODE.JS Server \r\n")
        .map((socket) => socket.pipe(socket))
        .end()
        .map(() => console.log("The client has disconnected...\n"))
    )
  );
