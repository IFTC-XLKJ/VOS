console.log("Starting VOS...");var f=5432,n="unknown";try{if(typeof tjs.uname=="function"){let e=tjs.uname();n=e.sysname?e.sysname.toLowerCase():"unknown"}else typeof tjs.platform=="string"?n=tjs.platform.toLowerCase():typeof navigator<"u"&&navigator.platform&&(n=navigator.platform.toLowerCase())}catch(e){console.warn("Could not detect platform using standard methods:",e.message)}console.log(`Detected Platform: ${n}`);function a(e){console.log(`[Key Event] OS: ${e.os}, Data:`,e)}async function p(){n.includes("linux")?(console.log("Starting Linux direct input listener..."),await w(a)):n.includes("win")?(console.log("Starting Windows PowerShell listener (Foreground only)..."),await y(a)):n.includes("darwin")||n.includes("mac")?console.log("macOS detected. Global key listening not supported in pure TxikiJS without external tools."):console.warn(`Unsupported platform: ${n}. Keyboard listener disabled.`)}async function w(e){let l=tjs.fs,t="/dev/input/event0";try{let o=await l.open(t,"r"),s=new Uint8Array(24);for(console.log(`Listening on ${t}... Press keys to test.`);;){let c=await o.read(s);if(c===0)break;if(c!==24)continue;let r=new DataView(s.buffer),i=r.getInt16(16,!0),d=r.getInt16(18,!0),u=r.getInt32(20,!0);i===1&&e({code:d,value:u,os:"linux"})}o.close()}catch(o){console.error("Linux listener error:",o.message)}}async function y(e){let l=`
$ErrorActionPreference = 'SilentlyContinue'
while ($true) {
    try {
        $key = [System.Console]::ReadKey($true)
        Write-Output "$($key.Key):$($key.Modifiers)"
    } catch {
        break
    }
}
`;try{let t=tjs.spawn(["powershell","-NoProfile","-Command",l],{stdio:["pipe","pipe","pipe"]});if(!t.stdout){console.error("PowerShell stdout is null. Process may have failed to start."),t.stderr&&t.stderr.on("data",o=>{console.error("PowerShell stderr:",new TextDecoder().decode(o))});return}console.log("PowerShell process started. Focus the terminal window to capture keys."),t.stdout.on("data",o=>{try{let s=new TextDecoder().decode(o).trim();s&&s.split(`
`).forEach(r=>{if(r){let i=r.split(":");i.length>=1&&e({key:i[0],modifiers:i[1]||"",os:"win32"})}})}catch(s){console.error("Error processing key data:",s)}}),t.on("exit",o=>{console.log(`PowerShell process exited with code ${o}`)}),t.on("error",o=>{console.error("PowerShell process error:",o)})}catch(t){console.error("Windows listener error:",t)}}var m=tjs.serve({fetch:g,port:f});p().catch(console.error);await new Promise(()=>{});async function g(e){return new Response("VOS Running. Check console for key events.")}
//# sourceMappingURL=index.js.map
