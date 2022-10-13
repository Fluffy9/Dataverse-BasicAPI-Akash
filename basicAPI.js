const fetch = require("isomorphic-fetch");
const ethers = require ("ethers");
const cors = require('cors')
const express = require('express');
const app = express();
const port = 3000;
const pk = process.env["PK"]
const wallet = new ethers.Wallet(pk)

app.use(express.json());       // to support JSON-encoded bodies
app.use(cors())


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/test', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({url: "https://httpbin.org/get", path: ["headers", "Host"]}))
})

app.get('/api', async(req,res) => {
    // takes a URL or an IPFS hash
    let configuration = null
    let message = null
    if(isURL(req.query.input)){
        configuration = await fetch(req.query.input, { method: "GET", headers: {'Accept': 'application/json'}}).then(res => res.json())
    }    
    else {
        configuration = await fetch(`https://cloudflare-ipfs.com/ipfs/${req.query.input}/`, {method: "GET", headers: {'Accept': 'application/json'}}).then(res => res.json())
    }
    // Fetch the JSON data
    message = await fetch(configuration.url, { method: "GET", headers: {'Accept': 'application/json'}}).then(res => res.json())
    // Access a specific portion of the data defined by `path`
    message = [...configuration.path].reduce(function(o, k) {
        return o && o[k];
    }, message);
    // reference https://ethereum.stackexchange.com/questions/122221/how-to-use-function-recover-from-ecdsa-library
    let encoded = ethers.utils.defaultAbiCoder.encode([ "string", "string", "uint256" ], [req.query.input, message, Math.trunc(Date.now()/1000)])
    const signature = await wallet.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(encoded)));
    message = { 
        data: encoded,
        signature: signature
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(message))        
})
  
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function isURL(s){
    let url;
    try {
      url = new URL(s);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
