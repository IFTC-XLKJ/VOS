console.log("Starting VOS...");var f=5432,o="unknown";try{if(typeof tjs.uname=="function"){let e=tjs.uname();o=e.sysname?e.sysname.toLowerCase():"unknown"}else typeof tjs.platform=="string"?o=tjs.platform.toLowerCase():typeof navigator<"u"&&navigator.platform&&(o=navigator.platform.toLowerCase())}catch(e){console.warn("Could not detect platform using standard methods:",e.message)}console.log(`Detected Platform: ${o}`);function d(e){console.log(`[Key Event] OS: ${e.os}, Data:`,e)}async function w(){o.includes("linux")?(console.log("Starting Linux direct input listener..."),await p(d)):o.includes("win")?(console.log("Starting Windows PowerShell listener (Foreground only)..."),await y(d)):o.includes("darwin")||o.includes("mac")?console.log("macOS detected. Global key listening not supported in pure TxikiJS without external tools."):console.warn(`Unsupported platform: ${o}. Keyboard listener disabled.`)}async function p(e){let l=tjs.fs,t="/dev/input/event0";try{let s=await l.open(t,"r"),n=new Uint8Array(24);for(console.log(`Listening on ${t}... Press keys to test.`);;){let i=await s.read(n);if(i===0)break;if(i!==24)continue;let r=new DataView(n.buffer),c=r.getInt16(16,!0),a=r.getInt16(18,!0),u=r.getInt32(20,!0);c===1&&e({code:a,value:u,os:"linux"})}s.close()}catch(s){console.error("Linux listener error:",s.message)}}async function y(e){let l=`
$ErrorActionPreference = 'SilentlyContinue'
while ($true) {
    try {
        $key = [System.Console]::ReadKey($true)
        Write-Output "$($key.Key):$($key.Modifiers)"
    } catch {
        break
    }
}
`;try{let t=tjs.spawn(["powershell","-NoProfile","-Command",l],{stdout:"pipe"});if(!t.stdout){console.error("PowerShell stdout is null. Process may have failed to start."),t.stderr&&t.stderr.on("data",n=>{console.error("PowerShell stderr:",new TextDecoder().decode(n))});return}console.log("PowerShell process started. Focus the terminal window to capture keys.");let s=t.stdout.getReader();for(;;){let{value:n,done:i}=await s.read();if(i)break;if(n){let r=new TextDecoder().decode(n).trim();r&&r.split(`
`).forEach(a=>{e({key:a.split(":")[0],modifiers:a.split(":")[1]||"",os:"win32"})})}}}catch(t){console.error("Windows listener error:",t)}}var h=tjs.serve({fetch:g,port:f});w().catch(console.error);await new Promise(()=>{});async function g(e){return new Response("VOS Running. Check console for key events.")}
//# sourceMappingURL=index.js.map
