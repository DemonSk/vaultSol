// SPDX-License-Identifier: MIT
pragma solidity 0.5.10;

import "../openzeppelin/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() public ERC20() {
        _mint(msg.sender, 1000000e18);
    }
}
