# Dataverse BasicAPI Akash
Source code of the BasicAPI feed from [Dataverse](https://github.com/Fluffy9/Dataverse). For maximum transparency this is deployed to a decentralized compute network. For someone who is running a feed for their own use only you might prefer to deploy on your own server.

## Deployment Instructions

1. Put your private key into the env variable in the deploy.yaml file. This is the key that will be used to sign data request responses.

2. If you want to deploy your own docker image, run `docker build . -t username/dv-server-akash` and then [push it to dockerhub](https://docs.docker.com/docker-hub/repos/). Replace the `pupcakes/dv-server-akash:latest` in the `deploy.yaml` file with `username/dv-server-akash:latest` Otherwise, skip to step 3

3. Follow [this tutorial](https://medium.com/@figuregang/developing-deploying-on-akash-7aecd5d9d467) to deploy your `deploy.yaml` to Akash network. You will need a few dollars worth of Akash tokens for this.  

## Register your Provider

```
    function setOracle(bool _isOracle) external {
        oracles[msg.sender] = _isOracle;
        emit ModifiedOracles(msg.sender, _isOracle);
    }
```

The registry contract needs to be informed of your provider before it can be used. Using the private key from your deploy.yaml file, call `setOracle(true)` function on the [registry contract](https://github.com/Fluffy9/Dataverse/wiki/Contract-Addresses). 

# Near Instructions

Put your private key in the basicAPINear.js file. DO NOT push to dockerhub and DO NOT deploy to Akash network. 

Run locally or on a secure server with command `docker build -f Dockerfile.near . -t basic-near-api` to build and `docker run -d --name basic-api-near --restart always basic-api-near`

It's important to include the --restart flag because this will ensure the whole thing is restarted in the case of the websocket connection closing or any errors
