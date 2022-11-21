const { keyStores, KeyPair, connect, WalletConnection, Contract } = require('near-api-js');
const WebSocket = require('ws')
const ws = new WebSocket('wss://events.near.stream/ws')
const secret = process.env["SECRET"] || "secret"

const PRIVATE_KEY = "";
const keyPair = KeyPair.fromString(PRIVATE_KEY);
const myKeyStore = new keyStores.InMemoryKeyStore();
const connectionConfig = {
    networkId: "mainnet",
    keyStore: myKeyStore, // first create a key store 
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://explorer.mainnet.near.org",
};

let wallet = ""
let nearConnection = ""
async function init() {
    await myKeyStore.setKey("mainnet", "fluffy9.near", keyPair);
    nearConnection = await connect(connectionConfig);
    wallet = await nearConnection.account("fluffy9.near");
    dvRegistry = new Contract(
        wallet, // the account object that is connecting
        "dv-registry.fluffy9.near", // name of contract you're connecting to
        {
            changeMethods: ["fillRequest"], // change methods modify state
            viewMethods: ["getRequest"],
        }
    );
}
init()
ws.on('open', function() {
    console.log("initiating connection...")
    ws.send(JSON.stringify({
        secret: secret,
        filter: [{
            "account_id": "dv-registry.fluffy9.near",
            "status": "SUCCESS",
            "event": {
                "standard": "nep171",
                "event": "new_request",
            }
        }],
        fetch_past_events: 5,
    }))
})

ws.on('message', async function(res) {
    console.log("responding to event...")
    console.log(JSON.parse(res))
    let events = JSON.parse(res).events
    try {
        let promises = []
        dvRegistry = new Contract(
            wallet, // the account object that is connecting
            "dv-registry.fluffy9.near", // name of contract you're connecting to
            {
                changeMethods: ["fillRequest"], // change methods modify state
                viewMethods: ["getRequest"],
            }
        );
        events.map((event) => {
            console.log(event.event.data)
            promises.push(dvRegistry.getRequest({_id: event.event.data}))
        })
        let requests = await Promise.allSettled(promises)
        let results = await Promise.allSettled(requests.map(request => getResult(request.value.input)))
        let transactions = await Promise.allSettled(requests.map((request, i) => { 
            if(request['value']){
                if(request['value'].active){
                    return dvRegistry.fillRequest({ _id: events[i].event.data, _result: results[i]['value'] }, "60000000000000")
                }
            }
         }))
         transactions.map(transaction => console.log(transaction))
    }
    catch (err) {
        console.log(err)
    }
})

async function getResult(input) {
    // takes a URL or an IPFS hash
    let configuration = null
    let message = null
    if (isURL(input)) {
        configuration = await fetch(input, { method: "GET", headers: { 'Accept': 'application/json' } }).then(res => res.json())
    }
    else {
        configuration = await fetch(`https://cloudflare-ipfs.com/ipfs/${input}/`, { method: "GET", headers: { 'Accept': 'application/json' } }).then(res => res.json())
    }
    // Fetch the JSON data
    message = await fetch(configuration.url, { method: "GET", headers: { 'Accept': 'application/json' } }).then(res => res.json())
    // Access a specific portion of the data defined by `path`
    message = [...configuration.path].reduce(function (o, k) {
        return o && o[k];
    }, message);
    return message
}

function isURL(s) {
    let url;
    try {
        url = new URL(s);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
