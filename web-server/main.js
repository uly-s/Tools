"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var DynamicBuffer = /** @class */ (function () {
    function DynamicBuffer() {
        this.data = Buffer.alloc(0);
        this.length = 0;
    }
    DynamicBuffer.prototype.push = function (data) {
        var newLength = this.length + data.length;
        if (this.data.length < newLength) {
            // get a temporary buffer for existing data
            var temp = Buffer.alloc(this.data.length);
            this.data.copy(temp);
            // double size of data buffer
            this.data = Buffer.alloc(newLength * 2);
            // copy over old data from temp to new buffer
            temp.copy(this.data);
        }
        data.copy(this.data, this.length);
        this.length = newLength;
    };
    DynamicBuffer.prototype.cut = function () {
        var index = this.data.indexOf('\n'.charCodeAt(0));
        if (index === -1) {
            return null;
        } // no messages
        var message = Buffer.from(this.data.subarray(0, index + 1));
        this.pop(index + 1);
        console.log('data:', this.data.toString());
        console.log('cut:', message.toString());
        return message;
    };
    DynamicBuffer.prototype.pop = function (index) {
        this.data.copyWithin(0, index, this.length);
        var newLength = this.length - index;
        this.length = newLength >= 0 ? newLength : 0;
        this.data.fill(0, this.length);
    };
    return DynamicBuffer;
}());
// socket wrapper
function Init(socket) {
    var connection = {
        socket: socket, error: null, ended: false, reader: null,
    };
    socket.on('data', function (data) {
        console.assert(connection.reader);
        // pause until next read
        connection.socket.pause();
        // fulfill promise of current read
        connection.reader.resolve(data);
        connection.reader = null;
    });
    socket.on('end', function () {
        // fulfill current read
        connection.ended = true;
        // fulfill, send EOF
        if (connection.reader) {
            connection.reader.resolve(Buffer.from(''));
            connection.reader = null;
        }
    });
    socket.on('error', function (error) {
        // deliver errors to current read
        connection.error = error;
        // deliver, propagate error up
        if (connection.reader) {
            connection.reader.reject(error);
            connection.reader = null;
        }
    });
    return connection;
}
function Read(connection) {
    // no concurrent calls 
    console.assert(!connection.reader);
    // fulfill promise contract (defined in type and init above)
    return new Promise(function (resolve, reject) {
        // if there's an error
        if (connection.error) {
            reject(connection.error);
            return;
        }
        // if EOF
        if (connection.ended) {
            resolve(Buffer.from(''));
            return;
        }
        // save callbacks
        connection.reader = { resolve: resolve, reject: reject };
        // resume 'data' event to fulfill promise
        connection.socket.resume();
    });
}
function Write(connection, data) {
    // checking EOF
    console.assert(data.length > 0);
    return new Promise(function (resolve, reject) {
        // if there's an error, fail
        if (connection.error) {
            reject(connection.error);
            return;
        }
        /*

        COME BACK TO THIS LATER AND MAKE SURE YOU ACTUALLY UNDERSTAND THE CODE

        */
        connection.socket.write(data, function (error) {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
var server = net.createServer({
    pauseOnConnect: true, // required by 'Connection' type
});
function connect(socket) {
    console.log("Connected: ", socket.remoteAddress, socket.remotePort);
    socket.resume(); // required by 'Connection' type
    socket.on('end', function () {
        // FIN received. The connection will be closed automatically.
        console.log('EOF.');
    });
    socket.on('data', function (data) {
        console.log('data:', data);
        socket.write(data); // echo back the data.
        // actively closed the connection if the data contains 'q'
        if (data.includes('q')) {
            console.log('closing.');
            socket.end(); // this will send FIN and close the connection.
        }
    });
}
function newConnection(socket) {
    return __awaiter(this, void 0, void 0, function () {
        var exception_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('New Connection: ', socket.remoteAddress, socket.remotePort);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, serve(socket)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    exception_1 = _a.sent();
                    console.error('Error: ', exception_1);
                    return [3 /*break*/, 5];
                case 4:
                    socket.destroy();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function serve(socket) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, buffer, index, message, data, reply;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = Init(socket);
                    buffer = new DynamicBuffer();
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 8];
                    message = buffer.cut();
                    if (!!message) return [3 /*break*/, 3];
                    return [4 /*yield*/, Read(connection)];
                case 2:
                    data = _a.sent();
                    if (data.length === 0) {
                        return [3 /*break*/, 8];
                    }
                    buffer.push(data);
                    return [3 /*break*/, 1];
                case 3:
                    if (!message.equals(Buffer.from('quit\n'))) return [3 /*break*/, 5];
                    return [4 /*yield*/, Write(connection, Buffer.from('bye!\n'))];
                case 4:
                    _a.sent();
                    console.log('closing.');
                    return [2 /*return*/];
                case 5:
                    reply = Buffer.concat([Buffer.from('echo: '), message]);
                    return [4 /*yield*/, Write(connection, reply)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [3 /*break*/, 1];
                case 8: return [2 /*return*/];
            }
        });
    });
}
server.on('connection', newConnection);
server.on('error', function (err) { throw err; });
server.listen({ host: '127.0.0.1', port: 1234 });
