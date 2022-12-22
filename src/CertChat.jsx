import React, { Component} from 'react';
import Web3 from 'web3/dist/web3.min';
import {CHAT_TOKEN_ABI,CHAT_TOKEN_ADDRESS} from './components/ChatConfig';
import './CertApp.css'
class CertChat extends Component {
    state = {
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        account:'',
        chatContract:'',
        isMetaMask:'',
        owner:'',
        registeredUsersAddress:[],
        balance: 0,
        status:'',
        myInboxSize : 0,
        selectedAddress:'',
        display: 'none',
    }


    initWeb = async () => {
        let {web3} = this.state;
        const network = await web3.eth.net.getNetworkType();
        const accounts = await web3.eth.getAccounts();
        let account = accounts[0];
        this.setState({web3,network,account});
    }

    initContract = async () => {
        let {web3} = this.state;
        let chatContract = new web3.eth.Contract(CHAT_TOKEN_ABI,CHAT_TOKEN_ADDRESS);
        let isMetaMask = await web3.currentProvider.isMetaMask;
        this.setState({chatContract,isMetaMask});
    }

    getContractProperties = async () => {
        let {chatContract} = this.state;
        let contractProperties = await chatContract.methods.getContractProperties().call();
        let owner = contractProperties[0];
        let registeredUsersAddress = contractProperties[1];      
        this.setState({owner, registeredUsersAddress});
    }

    displayMyAccountInfo = async () => {
        let {web3,account} = this.state;
        let balance = await web3.eth.getBalance(account);
        balance =  web3.utils.fromWei(balance, 'ether');
        this.setState({balance});
    }

    checkUserRegistration = async() => {
        let {account, chatContract,status} = this.state;
        if(await chatContract.methods.checkUserRegistration().call({from:account})) {
            status = 'User has been registered';
        }else{
            status = 'You are new User you need to be registered now';
            this.setState({status});
            if (window.confirm("New user: we need to setup an inbox for you on the Ethereum blockchain. For this you will need to submit a transaction in MetaMask. You will only need to do this once.")) {
                this.registerUser();
              } else {
                return null;
           }
        } 
        this.setState({status});  
    }


    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract();
        await this.getContractProperties();
        await this.displayMyAccountInfo();
        await this.checkUserRegistration();
        await this.registerUser();
        await this.getMyInboxSize();
    }
    componentDidMount = () => {
        this.tokenContractHandler();
    }


    registerUser = async () => {
        let {account, chatContract,status} = this.state;
        if(status !=='User has been registered'){
            status = "User registration:(open MetaMask->submit->wait)";
            await chatContract.methods.registerUser().send({from: (account), gas: '1000000'},(error) => {
                if(!error){
                    status = 'User has been registered';
                }else{
                  console.log("err-->"+error);
                }  
            });
            var gasUsedWei = chatContract.receipt.gasUsed;
            status = ("User is registered...gas spent: " + gasUsedWei + "(Wei)");
            alert("A personal inbox has been established for you on the Ethereum blockchain. You're all set!");
            this.setState({status});
        }
    }

    getMyInboxSize = async () => {
        let {account, chatContract, myInboxSize,display} = this.state;
        let value = await chatContract.methods.getMyInboxSize().call({from: account});
        myInboxSize = value[1];
        this.setState({myInboxSize});
        if (myInboxSize > 0) {
            display = "inline";
            this.setState({display});

            return this.receiveMessages();
        } else {
            display = "none";
            this.setState({display});
            return null;
        }
    }

    sendMessage = async () => {
        let {web3,chatContract} = this.state;
        var receiver = document.getElementById("receiver").value;
        if (receiver === "") {
          this.setState({status: "Send address cannot be empty"});
          return null;
        }
        if (!web3.utils.isAddress(receiver)) {
            this.setState({status: "You did not enter a valid Ethereum address"});
          return null;
        }
        var newMessage = document.getElementById("message").value;
        if (newMessage === "") {
            newMessage = 'hello'
            this.setState({status: "Oops! Message is empty"});
          //return null;
        }
        newMessage = web3.utils.fromAscii(newMessage);
        document.getElementById("message").value = "";
        document.getElementById("sendMessageButton").disabled = true;
        this.setState({status: "Sending message:(open MetaMask->submit->wait)"});


        await chatContract.methods.sendMessage(receiver, newMessage).send({from: (this.state.account), gas: '1000000'},(error,result) => {
            if(!error){
                var gasUsedWei = result.receipt.gasUsed;
                this.setState({status: "Message successfully sent...gas spent: " + gasUsedWei + " Wei"});
                document.getElementById("message").value = "";
            }else{
              console.log("err-->"+error);
            }
        });
      }
      clearInbox = async () => {
        let {chatContract,account} = this.state;
        this.setState({status:"Clearing inbox:(open MetaMask->submit->wait)"});
        await chatContract.methods.clearInbox().send({from: (account), gas: '1000000'});
        var clearInboxButton = document.getElementById("clearInboxButton");
        clearInboxButton.parentNode.removeChild(clearInboxButton);
      //  $("#mytable tr").remove();
        document.getElementById("receivedTable").style.display = "none";
        alert("Your inbox was cleared");
        this.setState({status: "Inbox cleared"});
    }

      receiveMessages = async () => {
        let {web3,chatContract,account,myInboxSize} = this.state;
        let value = await chatContract.methods.receiveMessages().call({}, {from: account});
          var content = (value[0]);
          var timestamp = value[1];
          var sender = value[2];

          for (var m = 0; m < myInboxSize; m++) {
            var tbody = document.getElementById("mytable-tbody");
            var row = tbody.insertRow();
            var cell1 = row.insertCell();
            let date = new Date(parseInt(timestamp[m])).toLocaleDateString("en-US");
            let time = new Date(parseInt(timestamp[m])).toLocaleTimeString("en-US");
            cell1.innerHTML = date+"<br />" +time; 
            var cell2 = row.insertCell();
            cell2.innerHTML = sender[m];
            var cell3 = row.insertCell();
    
            var thisRowReceivedText = content[m].toString();
            var receivedAscii = web3.utils.toAscii(thisRowReceivedText);
            cell3.innerHTML = receivedAscii;
            cell3.hidden = false;
          }
          var table = document.getElementById("mytable");
          var rows = table.rows;
          for (var i = 1; i < rows.length; i++) {
            rows[i].onclick = (function(e) {
              var thisRowContent = (this.cells[2].innerHTML);
              document.getElementById("reply").innerHTML = thisRowContent;
              document.getElementById("receiver").value = this.cells[1].innerHTML;
            });
        }
    }

    
    copyAddressToSend = () => {
        var sel = document.getElementById("registeredUsersAddressMenu");
        var copyText = sel.options[sel.selectedIndex];
        document.getElementById("receiver").value = copyText.innerHTML;
        this.setState({selectedAddress:copyText.innerHTML});
    }

    replyToMessage = () => {
        console.log( this.state.replyToAddress);
    }

    render() {
        let {account, chatContract,registeredUsersAddress, balance,status, network, display,owner} = this.state;
        let messages = []; 
        messages[0] = chatContract === '' ? 'Could Not Load' : chatContract._address;
        messages[1] = chatContract === '' ? 'Could Not Load' : account;
        messages[2] = chatContract === '' ? 'Could Not Load' : owner;
        messages[3] = chatContract === '' ? '0' : balance;
        messages[3] +=' Ether';
        messages[4] = chatContract === '' ? ['Could Not Load','Could Not Load'] : registeredUsersAddress;
        return (
            <div>
                <h1 >Certified Chat</h1>
                <br />
                <h2 >The Ethereum Messenger</h2>
                <hr style={{borderWidth: "1px",marginTop: "-5px"}} />
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
                <a id="myAddress"  href={'https://'+network+'.etherscan.io/address/'+messages[2]}  target='_blank' rel="noreferrer" type="addressLinks">{messages[2]}</a>
                <br /><br />
                <label className="form-label" >Your Balance: </label>
                <p>{messages[3]}</p>
                <br />





                <label>User directory:</label> <br />
                <button 
                    className="btn btn-secondary btn-sm" 
                    type="myDefaultButton" 
                    label="Copy" 
                    onClick={this.copyAddressToSend} 
                    style={{float:"right", marginTop: "18px"}}
                >
                    Select
                </button>
                <div 
                    style={{overflow: "hidden", paddingRight: "10px"}}>
​                    <select
                        type="registeredUsersAddressMenu" 
                        id='registeredUsersAddressMenu'>
                            {
                                messages[4].map((registeredUsersAddress,index)=>(
                                    <option key={index}>{registeredUsersAddress}</option>
                                ))
                            }
                    </select>
                </div>
                <br />
                
                <label>Send to:</label> <br />
                <textarea 
                    type="myInputTextArea" 
                    id="receiver" 
                    spellCheck="false"
                    readOnly={true} 
                    style={{width: "95%", maxLength: "42", rows: "1"}}>
                    </textarea>
                <br /><br />

                <br /><label>Message:</label> <br />
                <button 
                    className="btn btn-primary btn-sm" 
                    id='sendMessageButton'
                    type="myDefaultButton" 
                    label="Copy" 
                    onClick={this.sendMessage} 
                    style={{float:"right", marginTop: "-5px"}}
                >
                    Send
                </button>
                <div style={{overflow: "hidden", paddingRight: "10px"}}>
                    <textarea type="messageTextArea" id="message" maxLength="30" rows="1"></textarea>​
                </div>



                <div id="receivedTable" style={{display:display}}>
                    <br /><label>Received:</label> <br />
                    <div style={{overflow: "hidden", paddingRight: "10px"}}>
                    <textarea type="messageTextArea" id='reply'></textarea>​
                    </div>
                    <br />
                    <table id='mytable' style={{marginTop: "-5px"}}>
                    <thead>
                        <tr>
                        <th>Date</th>
                        <th>From</th>
                        <th style={{show: false}}>Content</th>
                        </tr>
                    </thead>
                    <tbody id="mytable-tbody">
                    </tbody>
                    </table>
                    <button
                        id = "clearInboxButton"  
                        type = "clearInboxButton"         
                        style = {{width : "100%", height : "30px", marginTop : "15px"}}         
                        onClick = {this.clearInbox}>
                        Clear inbox
                    </button>


                    
                </div>
                
                
                <label className="form-label" >Status: </label>
                <br />
                    <span className="badge bg-secondary">{status}</span>
                <br />
                {this.state.isMetaMask ? <span className='badge bg-primary'>MetaMask is Found</span>:<span className='badge bg-danger'>MetaMask Did not found</span>}
                <p>{this.state.network === 'main' ? <span className='badge bg-primary'>Working on Main Ethereum Network</span>:<span className='badge bg-danger'>Working on Test {network} Network</span>}</p>
            </div>
        );
    }
}
 
export default CertChat;