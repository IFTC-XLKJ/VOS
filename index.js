// TxikiJS
console.log("Starting VOS...");

const PORT = 5432;

// 兼容不同版本的 TxikiJS 获取平台信息
let platform = 'unknown';
try {
    if (typeof tjs.uname === 'function') {
        const sysInfo = tjs.uname();
        platform = sysInfo.sysname ? sysInfo.sysname.toLowerCase() : 'unknown';
    } else if (typeof tjs.platform === 'string') {
        platform = tjs.platform.toLowerCase();
    } else if (typeof navigator !== 'undefined' && navigator.platform) {
        platform = navigator.platform.toLowerCase();
    }
} catch (e) {
    console.warn("Could not detect platform using standard methods:", e.message);
}

console.log(`Detected Platform: ${platform}`);

function onKeyPress(event) {
    console.log(`[Key Event] OS: ${event.os}, Data:`, event);
}

async function startKeyboardListener() {
    if (platform.includes('linux')) {
        console.log("Starting Linux direct input listener...");
        await listenLinuxDirect(onKeyPress);
    } else if (platform.includes('win')) {
        console.log("Starting Windows PowerShell listener (Foreground only)...");
        await listenWindowsPowerShell(onKeyPress);
    } else if (platform.includes('darwin') || platform.includes('mac')) {
        console.log("macOS detected. Global key listening not supported in pure TxikiJS without external tools.");
    } else {
        console.warn(`Unsupported platform: ${platform}. Keyboard listener disabled.`);
    }
}

// Linux: 直接读取二进制事件
async function listenLinuxDirect(callback) {
    const fs = tjs.fs;
    const devicePath = '/dev/input/event0';

    try {
        const fd = await fs.open(devicePath, 'r');
        const buffer = new Uint8Array(24);

        console.log(`Listening on ${devicePath}... Press keys to test.`);

        while (true) {
            const bytesRead = await fd.read(buffer);
            if (bytesRead === 0) break; // EOF
            if (bytesRead !== 24) continue;

            const view = new DataView(buffer.buffer);
            const type = view.getInt16(16, true);
            const code = view.getInt16(18, true);
            const value = view.getInt32(20, true);

            const EV_KEY = 1;
            if (type === EV_KEY) {
                callback({ code, value, os: 'linux' });
            }
        }
        fd.close();
    } catch (e) {
        console.error("Linux listener error:", e.message);
    }
}

// Windows: PowerShell 读取控制台输入
async function listenWindowsPowerShell(callback) {
    const script = `
while ($true) {
    try {
        $key = [System.Console]::ReadKey($true)
        # 输出格式: Key:Modifiers
        Write-Output "$($key.Key):$($key.Modifiers)"
    } catch {
        break
    }
}
`;
    try {
        const proc = tjs.spawn(['powershell', '-Command', script], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // 使用 for await...of 遍历 stdout 流
        // 注意：TxikiJS 的 proc.stdout 可能是一个 ReadableStream
        const reader = proc.stdout.getReader ? proc.stdout.getReader() : null;

        if (reader) {
            // 如果使用 ReadableStreamDefaultReader
            (async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        if (value) {
                            const text = new TextDecoder().decode(value).trim();
                            if (text) {
                                const parts = text.split(':');
                                if (parts.length >= 1) {
                                    callback({ key: parts[0], modifiers: parts[1] || '', os: 'win32' });
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Stream read error:", e);
                } finally {
                    reader.releaseLock();
                }
            })();
        } else {
            //  fallback: 尝试直接监听数据事件 (如果 txikijs 版本较旧)
            proc.stdout.on('data', (chunk) => {
                const text = new TextDecoder().decode(chunk).trim();
                if (text) {
                    const parts = text.split(':');
                    if (parts.length >= 1) {
                        callback({ key: parts[0], modifiers: parts[1] || '', os: 'win32' });
                    }
                }
            });

            proc.stdout.on('end', () => {
                console.log("PowerShell process ended.");
            });
        }

        // 等待进程结束（可选，通常我们希望它一直运行）
        // await proc.wait(); 

    } catch (e) {
        console.error("Windows listener error:", e);
    }
}

const server = tjs.serve({
    fetch: handle,
    port: PORT
});

startKeyboardListener().catch(console.error);

await new Promise(() => { });

async function handle(req) {
    return new Response("VOS Running. Check console for key events.");
}

async function stop() {
    await server.close();
    console.log("Stopped VOS.");
}