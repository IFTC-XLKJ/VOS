// TxikiJS
console.log("Starting VOS...");

const PORT = 5432;

// 获取系统信息
const sysInfo = tjs.uname();
const platform = sysInfo.sysname.toLowerCase(); // 'linux', 'windows nt', 'darwin' 等

function onKeyPress(event) {
    console.log(`[Key Event] OS: ${event.os}, Code: ${event.code}, Value: ${event.value}`);
}

async function startKeyboardListener() {
    console.log(`Detected System: ${sysInfo.sysname}`);

    if (platform.includes('linux')) {
        console.log("Starting Linux direct input listener...");
        await listenLinuxDirect(onKeyPress);
    } else if (platform.includes('windows')) {
        console.log("Starting Windows PowerShell listener (Foreground only)...");
        await listenWindowsPowerShell(onKeyPress);
    } else if (platform.includes('darwin')) {
        console.log("macOS detected. Without Python/Swift tools, global key listening is not supported in pure TxikiJS.");
        console.log("Recommendation: Use a web browser frontend to capture keys and send to this server.");
    } else {
        console.warn(`Unsupported platform: ${sysInfo.sysname}`);
    }
}

// Linux: 直接读取二进制事件
async function listenLinuxDirect(callback) {
    const fs = tjs.fs;
    // 注意：实际项目中可能需要遍历 /dev/input/event* 来找到键盘设备
    // 这里简化为假设 event0 是键盘。如果失败，请检查权限或设备号。
    const devicePath = '/dev/input/event0';

    try {
        const fd = await fs.open(devicePath, 'r');
        const buffer = new Uint8Array(24);

        console.log(`Listening on ${devicePath}... Press keys to test.`);

        while (true) {
            const bytesRead = await fd.read(buffer);
            if (bytesRead !== 24) continue;

            const view = new DataView(buffer.buffer);
            // struct input_event {
            //     struct timeval time; // 16 bytes (tv_sec + tv_usec)
            //     __u16 type;          // 2 bytes
            //     __u16 code;          // 2 bytes
            //     __s32 value;         // 4 bytes
            // };
            const type = view.getInt16(16, true);
            const code = view.getInt16(18, true);
            const value = view.getInt32(20, true);

            const EV_KEY = 1;
            if (type === EV_KEY) {
                callback({ code, value, os: 'linux' });
            }
        }
    } catch (e) {
        console.error("Linux listener error:", e.message);
        console.error("Hint: You may need root privileges or 'input' group membership to read /dev/input/event*");
    }
}

// Windows: PowerShell 读取控制台输入 (仅当窗口激活时)
async function listenWindowsPowerShell(callback) {
    const script = `
while ($true) {
    try {
        $key = [System.Console]::ReadKey($true)
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

        (async () => {
            while (true) {
                const chunk = await proc.stdout.read();
                if (!chunk || chunk.length === 0) break;
                const text = new TextDecoder().decode(chunk).trim();
                if (text) {
                    const parts = text.split(':');
                    if (parts.length >= 1) {
                        callback({ key: parts[0], modifiers: parts[1] || '', os: 'win32' });
                    }
                }
            }
        })();
    } catch (e) {
        console.error("Windows listener error:", e);
    }
}

const server = tjs.serve({
    fetch: handle,
    port: PORT
});

// 启动监听
startKeyboardListener().catch(console.error);

await new Promise(() => { });

async function handle(req) {
    return new Response("VOS Running. Check console for key events (if supported by OS).");
}

async function stop() {
    await server.close();
    console.log("Stopped VOS.");
}