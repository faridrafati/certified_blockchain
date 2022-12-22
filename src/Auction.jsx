import React, { Component } from 'react';
import car from './components/images/car.png';
import sold from './components/images/sold.png';
import Web3 from 'web3/dist/web3.min';
import {TextField,Button} from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import {AUCTION_TOKEN_ABI,AUCTION_TOKEN_ADDRESS} from './components/AuctionConfig';
class Auction extends Component {
    state = {
        Highest:{
            bid:'',
            bidder:''
        },
        accountBid:'',
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        auctionContract:'',
        isMetaMask:'', 
        tasks:[],
        input:"",
        account:"",
        status:'',
        endTime:'',
        auctionEnded:false,
        withdraw:''
    }


    

    componentDidMount() {
        this.tokenContractHandler();
    }
    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract();
    }
    
    initWeb = async () => {
        let {web3} = this.state;
        const network = await web3.eth.net.getNetworkType();
        const accounts = await web3.eth.getAccounts();
        let account = accounts[0];
        this.setState({web3,network,account});

    }

    initContract = async () => {
        let {web3,Highest,accountBid,account,owner,endTime,auctionEnded} = this.state;
        let auctionContract = new web3.eth.Contract(AUCTION_TOKEN_ABI,AUCTION_TOKEN_ADDRESS);
        let isMetaMask = await web3.currentProvider.isMetaMask;
        Highest.bid= await auctionContract.methods.HighestBid().call();
        Highest.bidder= await auctionContract.methods.HighestBidder().call();
        accountBid= await auctionContract.methods.getBidderBid(account).call();
        owner= await auctionContract.methods.getOwnerAddress().call();
        endTime= await auctionContract.methods.getEndTime().call();
        auctionEnded= await auctionContract.methods.getAuctionEnded().call();
        this.setState({auctionContract,isMetaMask,Highest,accountBid,owner,endTime,auctionEnded});
    }

    DateTime = (timeStamp) => {
        let out = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(timeStamp*1000);
        return out;
    }

    inputHandler = (e) => {
        let input = this.state.input;
        input = e.currentTarget.value;
        this.setState({input});
    }

    withdrawHandler = (e) => {
        let withdraw = this.state.withdraw;
        withdraw = e.currentTarget.value;
        this.setState({withdraw});
    }

    putBid = async () => {
        let {account,input,auctionContract,web3,Highest,accountBid} = this.state;
        await auctionContract.methods.putBid().send({from: (account), gas: '1000000', value: web3.utils.toWei(input, "finney")},(error) => {
            if(error){
              console.log("err-->"+error);
            } 
        });
        Highest.bid= await auctionContract.methods.HighestBid().call();
        Highest.bidder= await auctionContract.methods.HighestBidder().call();
        accountBid.bid= await auctionContract.methods.getBidderBid(account).call();
        this.setState(Highest,accountBid);
    }

    putEndTime = async () => {
        let {account,input,auctionContract,Highest,endTime} = this.state;
        await auctionContract.methods.putEndTime(parseInt(input)).send({from: (account), gas: '1000000'},(error) => {
            if(error){
              console.log("err-->"+error);
            }else{
                endTime = input;
            } 
        });
        Highest.bid= await auctionContract.methods.HighestBid().call();
        Highest.bidder= await auctionContract.methods.HighestBidder().call();
        this.setState({endTime,Highest});
    }

    endAuction = async (e) => {
        e.preventDefault();
        let {account,auctionContract,Highest,auctionEnded} = this.state;
        await auctionContract.methods.endAuction(true).send({from: (account), gas: '1000000'},(error) => {
            if(error){
              console.log("err-->"+error);
            }else{
                auctionEnded = true;
            }
        });
        Highest.bid= await auctionContract.methods.HighestBid().call();
        Highest.bidder= await auctionContract.methods.HighestBidder().call();
        this.setState({Highest,auctionEnded});
    }

    startAuction = async (e) => {
        e.preventDefault();
        let {account,auctionContract,Highest,auctionEnded} = this.state;
        await auctionContract.methods.endAuction(false).send({from: (account), gas: '1000000'},(error) => {
            if(error){
              console.log("err-->"+error);
            }else{
                auctionEnded = false;
            }
        });
        Highest.bid= await auctionContract.methods.HighestBid().call();
        Highest.bidder= await auctionContract.methods.HighestBidder().call();
        this.setState({Highest,auctionEnded});
    }

    withdrawBid = async() => {
        let {account,withdraw,auctionContract} = this.state;

        await auctionContract.methods.withdrawBid(withdraw).send({from: (account), gas: '1000000'},(error) => {
            if(error){
                console.log("err-->"+error);
            } 
        });
    }   


    render() {
        let {input,web3,Highest,account,accountBid,owner,network,endTime,auctionEnded,withdraw} = this.state;
        let now = parseInt(Date.now()/1000);
        let isBidder = Highest.bidder === account ? true : false;
        let isOwner = owner === account ? true : false;
        let messages = []; 
        messages[0] = AUCTION_TOKEN_ADDRESS;
        messages[1] = account;
        messages[2] = owner;
        if(!isOwner){
            return (
                <div style={{
                    margin: '0px auto',"display":"flex",
                    "justifyContent":"center",
                    "flexFlow":"column",
                    "alignItems":"center"
                }}>
                    <h1>Auction App</h1>
                    {(auctionEnded || (parseInt(now) > parseInt(endTime)))? <img src={sold} alt=""/> : <img src={car} alt=""/>  }
                    <form>
                        <p className={(parseInt(now) > parseInt(endTime)) ? 'badge bg-danger' : 'badge bg-primary'}>Auction {(parseInt(now) > parseInt(endTime))?  'is Ended at ( ' +endTime+' timeStamp) '+ this.DateTime(endTime) : 'is in Process till ( ' +endTime+' timeStamp) '+ this.DateTime(endTime) }</p>
                        <br /><br />
                        {(auctionEnded || (parseInt(now) > parseInt(endTime)))? '': <TextField id='outlined-basic' label='Bid in finney (1 ether = 1000 finney)' variant='outlined' style={{margin:'0px 5px'}} size='small' value={input} onChange = {this.inputHandler} />}
                        {(auctionEnded || (parseInt(now) > parseInt(endTime)))? '':<Button variant='contained' color='primary' onClick={() => this.putBid()}>Put Bid</Button>}
                        <br /><br />
                        {isBidder ? <br /> : <p>Your Bid is {web3.utils.fromWei(accountBid,'ether')} Ether </p>}
                        {isBidder ? <p>You Are Highest Bidder till Refresh Page</p> : <p>Highest Bidder is {Highest.bidder}</p>}
                        {isBidder ? <p>Your Bid is {web3.utils.fromWei(Highest.bid,'ether')} Ether </p> : <p>Highest Bid is {web3.utils.fromWei(Highest.bid,'ether')} Ether</p>}
                        <p className='badge bg-primary'>Network is on {this.state.network}</p>
                        <br />
                        <label className="form-label" >Contract Address:</label>
                        <br />
                        {<a id="contractAddress" href={'https://'+network+'.etherscan.io/address/'+messages[0]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[0]}</a>}
                        <br /><br />
                        <label className="form-label" >Your Ethereum Address:</label>
                        <br />
                        <a id="contractOwner"  href={'https://'+network+'.etherscan.io/address/'+messages[1]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[1]}</a>
                        <br /><br />
                        <label className="form-label" >ContractOwner:</label>
                        <br />
                        {isOwner ? <p>You Are Contract Owner</p>:<a id="myAddress"  href={'https://'+network+'.etherscan.io/address/'+messages[2]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[2]}</a>}
                    </form>

                </div>
            );
        }else{
            return(
                <div style={{
                    margin: '0px auto',"display":"flex",
                    "justifyContent":"center",
                    "flexFlow":"column",
                    "alignItems":"center"
                }}>
                    <h1>Auction App: ADMIN</h1>
                    {(auctionEnded || (parseInt(now) > parseInt(endTime)))? <img src={sold} alt=""/> : <img src={car} alt=""/>  }
                    <form>
                        <p className={(parseInt(now) > parseInt(endTime)) ? 'badge bg-danger' : 'badge bg-primary'}>Auction {(parseInt(now) > parseInt(endTime))?  'is Ended at ( ' +endTime+' timeStamp) '+ this.DateTime(endTime) : 'is in Process till ( ' +endTime+' timeStamp) '+ this.DateTime(endTime) }</p>
                        <br /><br />
                        <TextField id='outlined-basic1' label='Put End Time to Auction in timeStamp' variant='outlined' style={{margin:'0px 5px'}} size='small' value={input} onChange = {this.inputHandler} />
                        <Button variant='contained' color='primary' onClick={() => this.putEndTime()}>Submit End Time to Auction</Button>
                        <br /><br />
                        <TextField id='outlined-basic2' label='Put withdraw Address' variant='outlined' style={{margin:'0px 5px'}} size='small' value={withdraw} onChange = {this.withdrawHandler} />
                        <Button variant='contained' color='warning' onClick={() => this.withdrawBid()}>Submit Withdraw Address</Button>
                        <br /><br />
                        <p className={auctionEnded ? 'badge bg-danger' : 'badge bg-primary'}>Auction is {auctionEnded?  'Ended' : 'in Process' }</p>
                        <br />
                        {auctionEnded? <button className = 'btn btn-primary' onClick={this.startAuction} style={{align: 'center'}}>Start Auction</button>: <button className = 'btn btn-danger' onClick={this.endAuction}>End Auction</button>}
                        
                        <br /><br />
                        <p className='badge bg-primary'>Network is on {this.state.network}</p>
                        <br />
                        <label className="form-label" >Contract Address:</label>
                        <br />
                        {<a id="contractAddress" href={'https://'+network+'.etherscan.io/address/'+messages[0]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[0]}</a>}
                        <br /><br />
                        <label className="form-label" >Your Ethereum Address:</label>
                        <br />
                        <a id="contractOwner"  href={'https://'+network+'.etherscan.io/address/'+messages[1]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[1]}</a>
                        <br /><br />
                        <label className="form-label" >ContractOwner:</label>
                        <br />
                        {isOwner ? <p>You Are Contract Owner</p>:<a id="myAddress"  href={'https://'+network+'.etherscan.io/address/'+messages[2]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[2]}</a>}
                    </form>
                </div>
            );
        }
    }
}
 
export default Auction;