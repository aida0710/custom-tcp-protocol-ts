//protocolの実装
import * as net from 'net';
import {Buffer} from 'buffer';

//名前って思いつかないよね。
const PROTOCOL_NAME: string = 'aida_proto';
//マイクラサーバが懐かしい。
const PROTOCOL_PORT: number = 19132;
const PROTOCOL_HEADER_LENGTH: number = 12;

/**
 * 独自の通信プロトコルのサーバーとクライアントを作る
 * @param callback
 * @returns {net.Server}
 */
interface MySocket extends net.Socket {
    send: (data: Buffer) => void;
}

/**
 * 独自の通信プロトコルのサーバーを作成
 * @param callback
 * @returns {net.Server}
 */
function createServer(callback: (payload: Buffer) => void): net.Server {
    const server: net.Server = net.createServer((socket: net.Socket): void => {
        console.log('A client connected');
        socket.on('data', (data: Buffer): void => {
            const buffer: Buffer = Buffer.from(data);
            const header: Buffer = buffer.subarray(0, PROTOCOL_HEADER_LENGTH);
            const nameLength: number = header.readUInt8(0);
            const name: string = header.toString('ascii', 1, nameLength + 1);
            const payloadLength: number = header.readUIntBE(
                nameLength + 1,
                PROTOCOL_HEADER_LENGTH - nameLength - 1
            );
            const payload: Buffer = buffer.subarray(
                PROTOCOL_HEADER_LENGTH,
                PROTOCOL_HEADER_LENGTH + payloadLength
            );
            if (name === PROTOCOL_NAME) {
                callback(payload);
            } else {
                socket.write('プロトコル名が違います。 -> ' + name);
            }
        });
        socket.on('end', (): void => {
            console.log('通信が終了しました。');
        });
    });
    server.listen(PROTOCOL_PORT, (): void => {
        console.log('Server is listening on port ' + PROTOCOL_PORT);
    });
    return server;
}

/**
 * 独自の通信プロトコルのクライアントを作成
 * @param host
 * @param port
 * @param callback
 * @returns {net.Socket}
 */
function createClient(host: string, port: number, callback: (data: Buffer) => void): MySocket {
    const client: net.Socket & MySocket = net.createConnection(port, host) as net.Socket & MySocket;

    client.send = function (data: Buffer): void {
        const buffer: Buffer = Buffer.from(data);
        const bufferLength: number = buffer.length;
        const header: Buffer = Buffer.alloc(PROTOCOL_HEADER_LENGTH);

        header.writeUInt8(PROTOCOL_NAME.length, 0);
        header.write(PROTOCOL_NAME, 1, 'ascii');
        header.writeUIntBE(
            bufferLength,
            PROTOCOL_NAME.length + 1,
            PROTOCOL_HEADER_LENGTH - PROTOCOL_NAME.length - 1
        );
        const message: Buffer = Buffer.concat([header, buffer]);
        client.write(message);
    };

    client.on('data', (data: Buffer): void => {
        callback(data);
    });
    client.on('end', (): void => {
        console.log('サーバとの接続を終了しました。');
    });
    return client;
}

createServer((payload: Buffer): void => {
    console.log('Server received: ' + payload.toString());
});

const client: MySocket = createClient('localhost', PROTOCOL_PORT, (data: Buffer): void => {
    console.log('Client received: ' + data.toString());
});

// クライアントからサーバーにデータを送信
client.on('connect', (): void => {
    client.send(Buffer.from('Hello, world!'));
});
