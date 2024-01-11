"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//protocolの実装
const net = __importStar(require("net"));
const buffer_1 = require("buffer");
//名前って思いつかないよね。
const PROTOCOL_NAME = 'aida_proto';
//マイクラサーバが懐かしい。
const PROTOCOL_PORT = 19132;
const PROTOCOL_HEADER_LENGTH = 12;
/**
 * 独自の通信プロトコルのサーバーを作成
 * @param callback
 * @returns {net.Server}
 */
function createServer(callback) {
    const server = net.createServer((socket) => {
        console.log('A client connected');
        socket.on('data', (data) => {
            const buffer = buffer_1.Buffer.from(data);
            const header = buffer.subarray(0, PROTOCOL_HEADER_LENGTH);
            const nameLength = header.readUInt8(0);
            const name = header.toString('ascii', 1, nameLength + 1);
            const payloadLength = header.readUIntBE(nameLength + 1, PROTOCOL_HEADER_LENGTH - nameLength - 1);
            const payload = buffer.subarray(PROTOCOL_HEADER_LENGTH, PROTOCOL_HEADER_LENGTH + payloadLength);
            if (name === PROTOCOL_NAME) {
                callback(payload);
            }
            else {
                socket.write('プロトコル名が違います。 -> ' + name);
            }
        });
        socket.on('end', () => {
            console.log('通信が終了しました。');
        });
    });
    server.listen(PROTOCOL_PORT, () => {
        console.log('Server is listening on port ' + PROTOCOL_PORT);
    });
    return server;
}
// 独自通信プロトコルのクライアント側を作成
function createClient(host, port, callback) {
    const client = net.createConnection(port, host);
    client.send = function (data) {
        const buffer = buffer_1.Buffer.from(data);
        const bufferLength = buffer.length;
        const header = buffer_1.Buffer.alloc(PROTOCOL_HEADER_LENGTH);
        header.writeUInt8(PROTOCOL_NAME.length, 0);
        header.write(PROTOCOL_NAME, 1, 'ascii');
        header.writeUIntBE(bufferLength, PROTOCOL_NAME.length + 1, PROTOCOL_HEADER_LENGTH - PROTOCOL_NAME.length - 1);
        const message = buffer_1.Buffer.concat([header, buffer]);
        client.write(message);
    };
    client.on('data', (data) => {
        callback(data);
    });
    client.on('end', () => {
        console.log('サーバとの接続を終了しました。');
    });
    return client;
}
createServer((payload) => {
    console.log('Server received: ' + payload.toString());
});
const client = createClient('localhost', PROTOCOL_PORT, (data) => {
    console.log('Client received: ' + data.toString());
});
// クライアントからサーバーにデータを送信
client.on('connect', () => {
    client.send(buffer_1.Buffer.from('Hello, world!'));
});
