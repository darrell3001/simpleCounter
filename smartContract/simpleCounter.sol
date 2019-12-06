pragma solidity 0.4.24;

contract SimpleCounter {
    int counter; // state variable

    event counterUpdated(int newCounterValue);

    constructor() public {
        counter = 0;
    }

    function getCounter() public view returns(int) {
        return counter;
    }

    function increment() public {
        counter += 1;
        emit counterUpdated(counter);
    }

    function decrement() public {
        counter -= 1;
        emit counterUpdated(counter);
    }

    function reset() public {
        counter = 0;
        emit counterUpdated(counter);
    }
}

