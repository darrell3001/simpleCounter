// Initialize the linkage to the smart contract
// We will need the ABI and address, which are copy/paste from remix IDE
// Setup a Event subscription for the counterUpdated Event
// Note that Web3 API does not support subscriptions on mobile devices
// thus we have to use another method. Trap the error message and setup
// an async timer pop for every 5 seconds
function initContract() {
  contract = new web3.eth.Contract(abi, address);

  $("#errormsg").html("subscription");
  contract.events.counterUpdated((error, event) => {
    if (!error) {
      var curr = parseInt($("#asyncpop").html());
      $("#asyncpop").html(curr + 1);
      $("#counter-value").html(event.returnValues.newCounterValue);
    } else {
      if (
        error.message.includes(
          "The current provider doesn't support subscriptions"
        )
      ) {
        $("#errormsg").html("timer pop");
        setInterval(() => {
          timerPop();
        }, 5000);
      } else {
        $("#errormsg").html(error.message);
      }
    }
  });
}

// This is the simple call to the getCounter() function in the smart contract
// Note this is done with an async callback thus the routine finishes immediatly
// and the value is updated via jQuery via promise
function getValue() {
  contract.methods
    .getCounter()
    .call()
    .then(result => {
      $("#counter-value").html(result);
    });
}

// This is the aforementioned timepop that is called as a promise for the async
// timer pop.
// Note: this mechanism is ONLY used when subscriptions are found to not be supported
function timerPop() {
  var curr = parseInt($("#timerpop").html());
  $("#timerpop").html(curr + 1);

  if ($("#status").html() !== "waiting for confirmation") {
    getValue();
  }
}

// main()
var contract;
var events;
var fromAddress;

// This is the ABI and address from the smart contract
// This is just simple copy/paste from the remix IDE
var address = "0xf945a15637f6008ecd7b63a5443379e65cb113a9";
var abi = [
  {
    constant: false,
    inputs: [],
    name: "decrement",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "increment",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "reset",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        name: "_lockDurationMinutes",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "newCounterValue",
        type: "int256"
      }
    ],
    name: "counterUpdated",
    type: "event"
  },
  {
    constant: true,
    inputs: [],
    name: "getCounter",
    outputs: [
      {
        name: "",
        type: "int256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "getTimeNow",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "lockDurationMinutes",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "lockedUntilTime",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
];

// This is a simple async promise
// that get executed when DOM loads the page
// Note: starting in Nov 2018, MetaMask enabled
// privacy mode by default. Prior to this, it had been
// disabled. This meant that, now the browser script MUST
// explictily ask if the account (from the digital wallet)
// can be used. ethereum.enable() must now be called. This is
// a one time operation. Metamask remembers on subequent calls.
// Currently, there is no ethereum.disable() function, so the only
// way to disable is to remove MetaMask. I suspect this will be fixed
// in a later release of the code
window.addEventListener("load", async () => {
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.enable().then(account => {
        // stash the fromAddress away for subquent transactions
        fromAddress = account[0];
        console.log("Approval granted");
        // Acccounts now exposed
        initContract();
        getValue();
      });
    } catch (error) {
      // User denied account access...
      console.log("User did not give permission to use wallet");
      $("#errormsg").html("User did not give permission to use wallet");
    }
  }
  // Legacy dapp browsers...
  // Maybe older version of Metamask
  else {
    if (window.web3) {
      // Acccounts always exposed
      window.web3 = new Web3(web3.currentProvider);
      console.log("Using legacy access to wallet");
      $("#errormsg").html(
        "Legacy version of digital wallet detected. Please consider upgradging to a more recent version of Metamask"
      );
      initContract();
      getValue();
    }
    // Non-dapp browsers...
    else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
      $("#errormsg").html(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }
});

// Basically all three buttons follow the same logic
// they simply call the corresponding function in the smart
// contract while setting up a promise to handle the result
// First, set the status message to "waiting for confirmation"
// and transaction status to "transaction is pending"
// then setup promise for OnConfirmation and OnError
// OnConfirmation - set status to idle and last transaction to successful
// Note: we technically dont need to make the call to "getValue()". The event
// subscription will catch the update in the smart contract and file. However,
// in the case of the wallet on the mobile browser that does not support subscriptions
// this is required to update the value. It really does not hurt anything to have
// this code here.

// Click of Increment button
$("#increment").click(() => {
  contract.methods
    .increment()
    .send({ from: fromAddress }, (err, tx) => {
      $("#status").html("waiting for confirmation");
      $("#last-transaction-status").html("transaction is pending");
    })
    .on("confirmation", () => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction was successful");
      getValue();
    }) // end of on confirmation
    .on("error", err => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction failed");
      console.log(err.message);
    }); // end of on error
});

// Click of Decrement button
$("#decrement").click(() => {
  contract.methods
    .decrement()
    .send({ from: fromAddress }, (err, tx) => {
      $("#status").html("waiting for confirmation");
      $("#last-transaction-status").html("transaction is pending");
    })
    .on("confirmation", () => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction was successful");
      getValue();
    }) // end of on confirmation
    .on("error", err => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction failed");
      console.log(err.message);
    }); // end of on error
});

// Click of Reset button
$("#reset").click(() => {
  contract.methods
    .reset()
    .send({ from: fromAddress }, (err, tx) => {
      $("#status").html("waiting for confirmation");
      $("#last-transaction-status").html("transaction is pending");
    })
    .on("confirmation", () => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction was successful");
      getValue();
    }) // end of on confirmation
    .on("error", err => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction failed");
      console.log(err.message);
    }); // end of on error
});
