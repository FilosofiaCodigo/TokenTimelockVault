// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenTimelock is Ownable {
  ERC20 public token;

  mapping(uint8 => uint256) public unlock_time;
  mapping(address => uint) public beneficiary_release_amount;
  mapping(address => mapping(uint => bool)) public beneficiary_has_claimed;

  constructor()
  {
    token = ERC20(0x0000000000000000000000000000000000000000);
  }
  
  // Public Functions
  
  function claim(uint8 unlock_number) public {
    require(block.timestamp >= unlock_time[unlock_number]);
    require(beneficiary_has_claimed[msg.sender][unlock_number] == false);

    beneficiary_has_claimed[msg.sender][unlock_number] = true;

    uint256 amount = beneficiary_release_amount[msg.sender];
    require(amount > 0);

    token.transfer(msg.sender, amount);
  }

  // Admin Functions

  function addBeneficiary(address beneficiary, uint release_amount) public onlyOwner {
    beneficiary_release_amount[beneficiary] = release_amount;
  }

  function addBenefiaryBatch(address[] memory beneficiaries, uint[] memory release_amounts) public onlyOwner {
    for(uint i; i < beneficiaries.length; i++)
    {
      addBeneficiary(beneficiaries[i], release_amounts[i]);
    }
  }

  function addUnlockTime(uint8 unlock_number, uint256 timestamp) public onlyOwner {
    unlock_time[unlock_number] = timestamp;
  }

  function addUnlockTimeBatch(uint256[] memory timestamps) public onlyOwner {
    for(uint8 i; i < timestamps.length; i++)
    {
      addUnlockTime(i, timestamps[i]);
    }
  }

  function withdrawAllTokens() public onlyOwner {
    token.transfer(owner(), token.balanceOf(owner()));
  }
}