const UNLOCKS = 4
const NETWORK_ID = 4
const CONTRACT_ADDRESS = "0xD9BcFd43E6BA76b1468D0a66325C0c06D6DACf33"
const JSON_CONTRACT_ABI_PATH = "./ContractABI.json"
var contract
var accounts
var web3

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
  document.getElementById("web3_message").textContent="Por favor conéctate a Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          contract = await getContract(web3);
          await window.ethereum.request({ method: "eth_requestAccounts" })
          accounts = await web3.eth.getAccounts()
          onContractInitCallback()
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Por favor conectate a Polygon";
      }
    });
  };
  awaitWeb3();
}

const contractInitCallback = async () => {
  user_release_amount = await contract.methods.beneficiary_release_amount().call()

  var parent = document.getElementById("claim_buttons")
  if(user_release_amount > 0)
  {
    for(i=0; i<UNLOCKS; i++)
    {
      user_has_claimed = await contract.methods.beneficiary_has_claimed(accounts[0],i).call()
      console.log(i + user_has_claimed)
      if(!user_has_claimed)
      {
        timestamp = await contract.methods.unlock_time(i).call()
        if(timestamp > current_time)
        {
          var btn = document.createElement("button")
          btn.innerHTML = "Claim!"
          btn.onclick = function () {
            claim(i)
          }
          parernt.appendChild(btn);
        }else
        {
          claimed_p = document.createElement("p")
          claimed_p.innerHTML = "Please claim on " + timestamp
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

//// ADMIN FUNCTIONS ////

/*
await addBeneficiary("0x869c669F683a11DAB09d376eb981B9Bb4bcbA286", "15")
*/
const addBeneficiary = async (beneficiary, release_amount) => {
  const result = await contract.methods.addBeneficiary(beneficiary, release_amount)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Adding beneficiary...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

/*
await addBenefiaryBatch(
  ["0x869c669F683a11DAB09d376eb981B9Bb4bcbA286",
    "0x869c669F683a11DAB09d376eb981B9Bb4bcbA286",
    "0x869c669F683a11DAB09d376eb981B9Bb4bcbA286",
    "0x869c669F683a11DAB09d376eb981B9Bb4bcbA286",
    "0x869c669F683a11DAB09d376eb981B9Bb4bcbA286"],
  ["15",
    "15",
    "50",
    "12",
    "150"]
  )
*/
const addBenefiaryBatch = async (beneficiaries, release_amounts) => {
  const result = await contract.methods.addBenefiaryBatch(beneficiaries, release_amounts)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Adding beneficiary...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

/*
await addUnlockTime(2, "1641508298")
*/
const addUnlockTime = async (unlock_number, timestamp) => {
  const result = await contract.methods.addUnlockTime(unlock_number, timestamp)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Adding beneficiary...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}


/*
await addUnlockTimeBatch(
  ["1641508298", "1641508298", "1641508298", "1641508298"])
*/
const addUnlockTimeBatch = async (unlock_times, timestamps) => {
  const result = await contract.methods.addUnlockTimeBatch(unlock_times, timestamps)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Adding beneficiary...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

/*
await withdrawAllTokens()
*/
const withdrawAllTokens = async (unlock_times, timestamps) => {
  const result = await contract.methods.withdrawAllTokens()
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