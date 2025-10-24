
const { Server } = require("socket.io");

module.exports = async (server) => {
	const { channelName, verifyToken } = global.config.serverUptime.socket;
	let io;

	try {
		if (!channelName) {
			throw new Error('"channelName" is not defined in config');
		}
		if (!verifyToken) {
			throw new Error('"verifyToken" is not defined in config');
		}

		io = new Server(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"]
			}
		});

		global.log.info('Socket.IO server initialized');
	} catch (err) {
		global.log.error('Socket.IO error:', err.message);
		throw err;
	}

	io.on("connection", (socket) => {
		if (socket.handshake.query.verifyToken != verifyToken) {
			io.to(socket.id).emit(channelName, {
				status: "error",
				message: "Token is invalid"
			});
			socket.disconnect();
			return;
		}

		global.log.success(`Client connected: ${socket.id}`);

		io.to(socket.id).emit(channelName, {
			status: "success",
			message: "Connected to server successfully",
			botName: global.config.botName,
			platform: global.deploymentPlatform
		});

		socket.on("disconnect", () => {
			global.log.info(`Client disconnected: ${socket.id}`);
		});
	});

	// Send periodic uptime updates
	setInterval(() => {
		io.emit(channelName, {
			status: "uptime",
			data: {
				uptime: process.uptime(),
				commands: global.ST.commands.size,
				events: global.ST.events.size,
				timestamp: Date.now()
			}
		});
	}, 30000); // Every 30 seconds

	return io;
};
