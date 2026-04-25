console.log("Starting VOS...");var y=5432,a=tjs.uname(),c=a.sysname.toLowerCase();function l(e){console.log(`[Key Event] OS: ${e.os}, Code: ${e.code}, Value: ${e.value}`)}async function w(){console.log(`Detected System: ${a.sysname}`),c.includes("linux")?(console.log("Starting Linux direct input listener..."),await f(l)):c.includes("windows")?(console.log("Starting Windows PowerShell listener (Foreground only)..."),await g(l)):c.includes("darwin")?(console.log("macOS detected. Without Python/Swift tools, global key listening is not supported in pure TxikiJS."),console.log("Recommendation: Use a web browser frontend to capture keys and send to this server.")):console.warn(`Unsupported platform: ${a.sysname}`)}async function f(e){let r=tjs.fs,o="/dev/input/event0";try{let t=await r.open(o,"r"),n=new Uint8Array(24);for(console.log(`Listening on ${o}... Press keys to test.`);;){if(await t.read(n)!==24)continue;let i=new DataView(n.buffer),u=i.getInt16(16,!0),d=i.getInt16(18,!0),p=i.getInt32(20,!0);u===1&&e({code:d,value:p,os:"linux"})}}catch(t){console.error("Linux listener error:",t.message),console.error("Hint: You may need root privileges or 'input' group membership to read /dev/input/event*")}}async function g(e){let r=`
while ($true) {
    try {
        $key = [System.Console]::ReadKey($true)
        Write-Output "$($key.Key):$($key.Modifiers)"
    } catch {
        break
    }
}
`;try{let o=tjs.spawn(["powershell","-Command",r],{stdio:["pipe","pipe","pipe"]});(async()=>{for(;;){let t=await o.stdout.read();if(!t||t.length===0)break;let n=new TextDecoder().decode(t).trim();if(n){let s=n.split(":");s.length>=1&&e({key:s[0],modifiers:s[1]||"",os:"win32"})}}})()}catch(o){console.error("Windows listener error:",o)}}var S=tjs.serve({fetch:h,port:y});w().catch(console.error);await new Promise(()=>{});async function h(e){return new Response("VOS Running. Check console for key events (if supported by OS).")}
//# sourceMappingURL=index.js.map
