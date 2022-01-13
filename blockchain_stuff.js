const NETWORK_ID = 4
const CONTRACT_ADDRESS = "0x03E59E35BC96060D0a4565Ebd307a3102d5627e1"
const JSON_CONTRACT_ABI_PATH = "./ContractABI.json"
var contract
var accounts
var web3
var ENTRY_PRICE

function metamaskReloadCallback() {
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se cambió el account, refrescando...";
    window.location.reload()
  })
  window.ethereum.on('networkChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se el network, refrescando...";
    window.location.reload()
  })
}

const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)
        window.location.reload()
        resolve(web3)
      } else {
        reject("must install MetaMask")
        document.getElementById("web3_message").textContent="Error: Porfavor conéctate a Metamask";
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
        }
      });
    }
  });
};

const getContract = async (web3) => {
  const response = await fetch(JSON_CONTRACT_ABI_PATH);
  const data = await response.json();
  
  const netId = await web3.eth.net.getId();
  contract = new web3.eth.Contract(
    data,
    CONTRACT_ADDRESS
    );
  return contract
}

async function loadDapp() {
  metamaskReloadCallback()
  document.getElementById("web3_message").textContent="Please connect to Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          contract = await getContract(web3);
          await window.ethereum.request({ method: "eth_requestAccounts" })
          accounts = await web3.eth.getAccounts()
          document.getElementById("web3_message").textContent="You are connected to Metamask"
          onContractInitCallback()
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Please connect to Rinkeby";
      }
    });
  };
  awaitWeb3();
}

const onContractInitCallback = async () => {
  AMOUNT_PER_UNLOCK = await contract.methods.AMOUNT_PER_UNLOCK().call()
  UNLOCK_COUNT = await contract.methods.UNLOCK_COUNT().call()
  ENTRY_PRICE = await contract.methods.ENTRY_PRICE().call()
  user_is_beneficiary = await contract.methods.is_beneficiary(accounts[0]).call()

  var parent = document.getElementById("claim_buttons")
  if(user_is_beneficiary)
  {
    for(i=0; i<UNLOCK_COUNT; i++)
    {
      var unlock_h = document.createElement("h3")
      unlock_h.innerHTML = "Unlock #" + (i+1)
      parent.appendChild(unlock_h)

      user_has_claimed = await contract.methods.beneficiary_has_claimed(accounts[0],i).call()
      if(!user_has_claimed)
      {
        timestamp = await contract.methods.unlock_time(i).call()
        current_time = Math.round(Date.now() / 1000)
        if(parseInt(timestamp) < current_time)
        {
          if(parseInt(timestamp) != 0)
          {
            var btn = document.createElement("button")
            btn.innerHTML = "Claim!"
            btn.unlock_number = i
            btn.onclick = function (e, e, x) {
              claim(this.unlock_number)
            }
            parent.appendChild(btn)
            parent.appendChild(document.createElement("br"))
          }else
          {
            claimed_p = document.createElement("p")
            claimed_p.innerHTML = "This timelock is still not set"
            parent.appendChild(claimed_p)
          }
        }else
        {
          claimed_p = document.createElement("p")
          claimed_p.innerHTML = "Please claim " + web3.utils.fromWei(user_release_amount) + " tokens on " + new Date(timestamp * 1000)
          parent.appendChild(claimed_p)
        }
      }else
      {
        claimed_p = document.createElement("p")
        claimed_p.innerHTML = "Claimed"
        parent.appendChild(claimed_p)
      }
    }
  }else
  {
    claimed_p = document.createElement("p")
    claimed_p.innerHTML = "No timelocks found for this account"
    parent.appendChild(claimed_p)
  }
}


//// PUBLIC FUNCTIONS ////

/*
await claim(3)
*/
const claim = async (unlock_number) => {
  const result = await contract.methods.claim(unlock_number)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Claiming...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

/*
await buy()
*/
const buy = async (unlock_number) => {
  const result = await contract.methods.buy()
  .send({ from: accounts[0], gas: 0, value: ENTRY_PRICE })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Buying...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

/*
await withdraw()
*/
const withdraw = async (unlock_number) => {
  const result = await contract.methods.withdraw()
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Withdrawing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

loadDapp()