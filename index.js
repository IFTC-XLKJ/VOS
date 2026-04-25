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
    // 简化脚本，确保兼容性
    const script = `
$ErrorActionPreference = 'SilentlyContinue'
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
        // 启动 PowerShell
        const proc = tjs.spawn(['powershell', '-NoProfile', '-Command', script], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // 检查 stdout 是否可用
        if (!proc.stdout) {
            console.error("PowerShell stdout is null. Process may have failed to start.");
            // 尝试读取 stderr 以获取错误信息
            if (proc.stderr) {
                proc.stderr.on('data', (chunk) => {
                    console.error("PowerShell stderr:", new TextDecoder().decode(chunk));
                });
            }
            return;
        }

        console.log("PowerShell process started. Focus the terminal window to capture keys.");

        // 监听标准输出
        // TxikiJS 通常支持 Node.js 风格的事件监听
        proc.stdout.on('data', (chunk) => {
            try {
                const text = new TextDecoder().decode(chunk).trim();
                if (text) {
                    // 可能有多行数据
                    const lines = text.split('\n');
                    lines.forEach(line => {
                        if (line) {
                            const parts = line.split(':');
                            if (parts.length >= 1) {
                                callback({ key: parts[0], modifiers: parts[1] || '', os: 'win32' });
                            }
                        }
                    });
                }
            } catch (e) {
                console.error("Error processing key data:", e);
            }
        });

        // 监听进程退出
        proc.on('exit', (code) => {
            console.log(`PowerShell process exited with code ${code}`);
        });

        // 监听错误
        proc.on('error', (err) => {
            console.error("PowerShell process error:", err);
        });

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