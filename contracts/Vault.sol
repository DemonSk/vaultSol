// SPDX-License-Identifier: MIT
pragma solidity 0.5.10;

import "./openzeppelin/Ownable.sol";
import "./openzeppelin/SafeERC20.sol";

contract Vault is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Fee variables
    uint256 public constant FEE_1 = 1;
    uint256 public constant FEE_2 = 2;
    uint256 public constant FEE_3 = 3;
    uint256 public constant FEE_DENOMINATOR = 100;

    address public feeReceiver;

    // user's balance of tokens (token address => user address => returns balance)
    mapping(address => mapping(address => uint256)) public balanceOf;

    event ChangeFeeReceiver(address newFeeReceiver);
    event Deposit(
        address token,
        uint256 amount,
        address depositer,
        uint256 fee
    );
    event Withdraw(address token, uint256 amount, address withdrawer);

    /// @param _feeReceiver     Address of fee receiver
    constructor(address _feeReceiver) public {
        feeReceiver = _feeReceiver;
    }

    /// @notice                 Function for change fee receiver address
    /// @param _newFeeReceiver  Address of new fee receiver
    function changeFeeReceiver(address _newFeeReceiver) external onlyOwner {
        feeReceiver = _newFeeReceiver;

        emit ChangeFeeReceiver(_newFeeReceiver);
    }

    /// @notice                 Deposit function for deposit tokens to contract
    /// @param token            Address of token, that will be deposited
    /// @param amount           Number of tokens to transfer to contract
    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Deposit should be more, than 0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 fee;
        if (amount > 1000 ether) {
            // would work correctly only with tokens that have 18 decimals
            fee = (amount * FEE_3) / FEE_DENOMINATOR;
        } else if (amount > 100 ether) {
            fee = (amount * FEE_2) / FEE_DENOMINATOR;
        } else {
            fee = (amount * FEE_1) / FEE_DENOMINATOR;
        }
        IERC20(token).safeTransfer(feeReceiver, fee);
        balanceOf[token][msg.sender] += amount - fee;

        emit Deposit(token, amount, msg.sender, fee);
    }

    /// @notice                 Withdraw function to extract tokens from contract
    /// @param token            Address of token, that will be withdrawn
    /// @param amount           Number of tokens to transfer to user
    function withdraw(address token, uint256 amount) external {
        require(balanceOf[token][msg.sender] >= amount, "Low balance");
        balanceOf[token][msg.sender] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdraw(token, amount, msg.sender);
    }

    /// @notice                 Retrieve information about user's token balance on contract
    /// @param user             Address of account
    /// @param tokens           Array of token addresses to get balance from
    /// @return                 List of user token balance on contract
    function getBalance(address user, address[] calldata tokens)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory result = new uint256[](tokens.length);
        for (uint256 i; i < tokens.length; ++i) {
            result[i] = (balanceOf[tokens[i]][user]);
        }
        return result;
    }
}
