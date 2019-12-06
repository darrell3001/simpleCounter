// Initialize the linkage to the smart contract
// We will need the ABI and address, which are copy/paste from remix IDE
// Setup a Event subscription for the counterUpdated Event
// Note that Web3 API does not support subscriptions on mobile devices
// thus we have to use another method. Trap the error message and setup
// an async timer pop for every 5 seconds
function initContract() {
  contract = new web3.eth.Contract(abi, address);

  $("#popCount").html("0");
  $("#notificationMechanism").html("async");

  contract.events.counterUpdated((error, event) => {
    if (!error) {
      var curr = parseInt($("#popCount").html());
      $("#popCount").html(curr + 1);
      $("#counter-value").html(event.returnValues.newCounterValue);
    } else {
      if (
        error.message.includes(
          "The current provider doesn't support subscriptions"
        )
      ) {
        $("#notificationMechanism").html("timer");
        setInterval(() => {
          timerPop();
        }, 5000);
      } else {
        $("#notificationMechanism").html("unsupported");
        $("#errormsg").html(error.message);
      }
    }
  });
}

// This is the simple call to the getCounter() function in the smart contract
// Note this is done with an async callback thus the routine finishes immediatly
// and the value is updated via jQuery via promise
function getValue() {
  try {
    contract.methods
      .getCounter()
      .call()
      .then(result => {
        $("#counter-value").html(result);
      });
  } catch (error) {
    $("#errormsg").html(error.message);
  }
}

// This is the aforementioned timepop that is called as a promise for the async
// timer pop.
// Note: this mechanism is ONLY used when subscriptions are found to not be supported
function timerPop() {
  try {
    var curr = parseInt($("#popCount").html());
    $("#popCount").html(curr + 1);

    if ($("#status").html() !== "waiting for confirmation") {
      getValue();
    }
  } catch (error) {
    $("#errormsg").html(error.message);
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
    inputs: [],
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
    }) // end of on confirmation
    .on("error", err => {
      $("#status").html("idle");
      $("#last-transaction-status").html("last transaction failed");
      console.log(err.message);
    }); // end of on error
});
