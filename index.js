// TxikiJS
console.log("Starting VOS...");

const PORT = 5432;

const server = tjs.serve({
    fetch: handle,
    port: PORT
});

await new Promise(() => { });

async function handle(req) {
    return new Response("Hello World!");
}

async function stop() {
    await server.close();
    console.log("Stopped VOS.");
}