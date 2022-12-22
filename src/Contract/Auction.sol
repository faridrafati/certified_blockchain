// SPDX-License-Identifier: GPL-3.0

pragma solidity >0.4.0 <0.9.0;


contract Auction{
    mapping(address => uint) biddersData;
    uint highestBidAmount;
    address highestBidder;
    uint startTime=block.timestamp;
    uint endTime;
    address owner;
    bool auctionEnded =false;
    constructor(){
        owner=msg.sender;
    }

    // put new bid
    function putBid() public payable{
        //verify value is not zero
        uint calculateAmount = biddersData[msg.sender]+msg.value;
        // check session not ended
        require(auctionEnded==false,"Aunction is Endded");
        require(block.timestamp<=endTime,"Aunction is Endded");
        require(msg.value>0,"Bid Amo unt Cannot Be Zero");

        //check Highest Bid
        require(calculateAmount>highestBidAmount,"Highest Bid Already Present");
        biddersData[msg.sender] = calculateAmount;
        highestBidAmount = calculateAmount;
        highestBidder = msg.sender;
    }

    function getOwnerAddress() public view returns(address){
        return owner;
    }
    
    function getEndTime() public view returns(uint){
        return endTime;
    }

    function getAuctionEnded() public view returns(bool){
        return auctionEnded;
    }

    // get Contract Balance (Only for testing)
    function getBidderBid(address _address) public view returns(uint){
         return biddersData[_address];
    }
    // get Highest BidAmount
    function HighestBid() public view returns(uint){
        return highestBidAmount;
    }

    // get Highest Bidder Address
    function HighestBidder() public view  returns(address){
         return highestBidder;
    }

    // put endTime
    function putEndTime(uint _endTime) public {
        if(msg.sender==owner){
            endTime=_endTime;
        }
    }

   
    // put endTime
    function endAuction(bool _trueFalse) public {
        if(msg.sender==owner){
            auctionEnded = _trueFalse;
        }
    }


    //withdraw Bid
    function withdrawBid(address payable _address) public {
        if(biddersData[_address]>0){
            _address.transfer(biddersData[_address]);
        }
    }
}


