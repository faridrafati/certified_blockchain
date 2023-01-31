import React from 'react';
import './components/css/chatBox.css';
import userProfilePic from './components/images/user-profile.png';
import Web3 from 'web3/dist/web3.min';
import {CHAT_BOX_ABI,CHAT_BOX_ADDRESS} from './components/chatBoxConfig';
import resetProvider from './resetProvider';
import HideShow from './HideShow';
import LoginForm from './loginForm';
import _ from 'lodash';
import Like  from './like';
class ChatBox extends resetProvider {
    state = {
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        account:'',
        Contract:'',
        isMetaMask:'',
        owner:'',
        balance: 0,
        myInboxSize : 0,
        myOutboxSize: 0,
        selectedAddress:'',
        display: 'none',
        checkRegister: false,
        contacts: [],
        messages: [],
        inputValue:'',
        searchValue:'',
        selectedContactIndex:0,
    }

    getContractProperties = async () => {
        let {Contract,web3} = this.state;
        let contractProperties = await Contract.methods.getContractProperties().call();
        let owner = contractProperties[0];
        let registeredUsersAddress = contractProperties[1];
        let registeredUsersName = contractProperties[2];
        let contacts = [];
        for(let i = 0; i<registeredUsersAddress.length; i++) {
            let registeredUsersAddress = contractProperties[1][i];
            let registeredUsersName = contractProperties[2][i];
            contacts.push({address: registeredUsersAddress, name: web3.utils.toAscii(registeredUsersName)});
        }
        this.setState({contacts});     
        this.setState({owner, registeredUsersAddress, registeredUsersName});
    }

    checkUserRegistration = async() => {
        let {account, Contract} = this.state;
        if(await Contract.methods.checkUserRegistration().call({from:account})) {
            this.setState({checkRegister:true});  
            return true;
        }else{
            this.setState({checkRegister:false});  
            return false;
        } 
    }

    extraInitContract = async () => {
        await this.getContractProperties();
        await this.checkUserRegistration();
        await this.getUpdateMessages();

    }

    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract(CHAT_BOX_ABI,CHAT_BOX_ADDRESS);
        await this.extraInitContract();

    }
    componentDidMount = () => {
        this.checkMetamask();
        this.tokenContractHandler();
        this.interval = setInterval(()=>this.getUpdateMessages(), 1000*60);
    }


    getUpdateMessages = async () =>{
        let {account, Contract, myInboxSize,myOutboxSize,display} = this.state;
        let value = await Contract.methods.getMyInboxSize().call({from: account});
        myOutboxSize = value[0];
        myInboxSize = value[1];
        this.setState({myOutboxSize,myInboxSize});
        display = "inline";
        this.setState({display});
        await this.retrieveMessages();
        this.sortMessages();



    }

    retrieveMessages = async () => {
        let {web3,Contract,account,myInboxSize,myOutboxSize} = this.state;
        let value = await Contract.methods.receiveMessages().call({}, {from: account});
        let messages = [];
        for(let i = 0; i<myInboxSize; i++) {
            if(value[1][i] !== 0){
            let content = (value[0][i]);
            let timestamp = value[1][i];
            let sender = value[2][i];
            messages.push({from: sender,to: account ,message: web3.utils.toAscii(content),time: timestamp});}
        }
        value = await Contract.methods.sentMessages().call({}, {from: account});
        for(let i = 0; i<myOutboxSize; i++) {
            if(value[1][i] !== 0){
            let content = (value[0][i]);
            let timestamp = value[1][i];
            let receiver = value[2][i];
            messages.push({from: account,to: receiver,message: web3.utils.toAscii(content),time: timestamp});}
        }
        this.setState({messages});
    }

    sortMessages = () => {
        let {messages} = this.state;
        messages = _.orderBy(messages, ['time'], ['asc']);
        for (let i = 0; i < messages.length; i++) {
            let date = new Date(parseInt(messages[i]['time'])*1000).toLocaleDateString("en-US");
            let time = new Date(parseInt(messages[i]['time'])*1000).toLocaleTimeString("en-US");
            messages[i]['beautyTime'] = date + ' | ' + time;
        }
        this.setState({messages});
        let contacts = this.state.contacts;
        for(let i=0; i<contacts.length; i++) {
            let lastActivity=0;
            for (let j=0; j<messages.length; j++){
                if(messages[j].to === contacts[i].address){
                    if(lastActivity < messages[j].time){
                        lastActivity = messages[j].time;    
                    };
                }

            }
            if(lastActivity !== 0){
                let date = new Date(parseInt(lastActivity)*1000).toLocaleDateString("en-US");
                let time = new Date(parseInt(lastActivity)*1000).toLocaleTimeString("en-US");
                contacts[i].lastActivity = date + ' | ' + time;
            }else{
                contacts[i].lastActivity = "";
            }


        }
        this.setState({contacts});
    }

    registerUser = async (username) => {
        let TxId='';
        let {web3,account, Contract} = this.state;

        await Contract.methods.registerUser(web3.utils.fromAscii(username)).send({from: (account), gas: '1000000'},(error,result) => {
            if(!error){
                TxId=result;
                this.notify('info','Registration is in Progress');
                }else{
                console.log(error);
                this.notify('error','Registration is Failed: '+error.message);
                }
            
            });
        this.notify('success','Registration is Done: '+TxId);
        await this.extraInitContract();


    }

    sendMessage = async () => {
        let {inputValue,selectedContactIndex,contacts} = this.state;
        if(inputValue !=="") {
            let TxId='';
            let {web3,Contract} = this.state;
            var receiver = contacts[selectedContactIndex].address;
            var newMessage = inputValue;

            newMessage = web3.utils.fromAscii(newMessage);
    
            await Contract.methods.sendMessage(receiver, newMessage).send({from: (this.state.account), gas: '1000000'},(error,result) => {
                if(!error){
                    TxId=result;
                    this.notify('info','Sending Message is in Progress');
                }else{
                    console.log(error);
                    this.notify('error','Sending Message is Failed: '+error.message);
                }
            });
            this.notify('success','Sending Message is Done: '+TxId);
            await this.extraInitContract();
            this.setState({inputValue:""});
        }
        }
    clearInbox = async () => {
        let TxId='';
        let {Contract,account} = this.state;
        await Contract.methods.clearInbox().send({from: (account), gas: '1000000'},(error,result) => {
            if(!error){
                TxId=result;
                this.notify('info','Clearing Inbox is in Progress');
              }else{
                console.log(error);
                this.notify('error','Clearing Inbox is Failed: '+error.message);
              }
            });
        this.notify('success','Clearing Inbox is Done: '+TxId);
        await this.extraInitContract();
    }

    onClickHandler = async (index) => {
        let {selectedContactIndex} = this.state;
        selectedContactIndex = index;
        this.setState({selectedContactIndex});
        await this.getUpdateMessages();
    }

    onChangeHandler = (e) => {
        let {inputValue} = this.state.inputValue;
        inputValue = e.currentTarget.value;
        this.setState({inputValue});
    }
    onSearchHandler = (e) => {
        let {searchValue} = this.state.searchValue;
        searchValue = e.currentTarget.value;
        this.setState({searchValue});
    }

   render() {
        let {contacts,messages,account, checkRegister,owner,selectedContactIndex,searchValue} = this.state;
            contacts = _.filter(contacts,function(contact) {
                return (contact.name.toLowerCase().includes(searchValue.toLowerCase())||contact.address.toLowerCase().includes(searchValue.toLowerCase()));
            });
            if(contacts.length === 0) {
                contacts.push({address:'0x0',name:'Not Found'})
            }
  
        return (
            <div>
                <section className="bg-light text-center">
                    <h1>Chat Box App</h1>
                    <HideShow 
                        currentAccount = {this.state.currentAccount}
                        contractAddress = {CHAT_BOX_ADDRESS}
                        chainId = {this.state.chainId}
                        owner = {owner}
                    />
                </section>
            {
                (checkRegister === false) ? <LoginForm register = {this.registerUser}/> : 
                <div className="container">

            <div className="messaging">
                <div className="inbox_msg">
                    <div className="inbox_people">
                        <div className="headind_srch">
                            <div className="recent_heading">
                                <button className="refresh_btn" type="button" id = 'refresh' onClick={()=>this.getUpdateMessages()}><i className="fa fa-refresh" aria-hidden="true"></i></button>
                                <button className="trash_btn ms-2" type="button" id = 'trash' onClick={()=>this.clearInbox()}><i className="fa fa-trash" aria-hidden="true"></i></button>
                                <button className="fav_btn ms-2" type="button" id = 'favorite' onClick={()=>this.clearInbox()}><i className="fa fa-star" aria-hidden="true"></i></button>
                                {/*<button className="fav_btn_o ms-2" type="button" id = 'favorite' onClick={()=>this.clearInbox()}><i className="fa fa-star" aria-hidden="true"></i></button>*/}

                            </div>
                            <div className="srch_bar">
                                <div className="stylish-input-group">
                                    <input type="text" className="search-bar"  value={searchValue} placeholder="Search" onChange={this.onSearchHandler}/>
                                    <span className="input-group-addon">
                                        <button type="button"> 
                                            <i className="fa fa-search" aria-hidden="true"></i> 
                                        </button>
                                    </span> 
                                </div>
                            </div>
                        </div>
                        <div className="inbox_chat">
                            {contacts.map((contact,index)=>(
                                <div className={selectedContactIndex !== index ? "chat_list" : "chat_list active_chat"} key={index} onClick={()=>this.onClickHandler(index)}>
                                    
                                    <div className="chat_people " style={{ cursor: "pointer" }}>
                                        <div className="chat_img"> <img src={userProfilePic} alt={contact.name} /> </div>
                                        <div className="chat_ib">
                                            <h5>{contact.address !== account ? contact.name : contact.name + ' (Saved Messages)'} <span className="chat_date"><Like /></span></h5>
                                            <p>{contact.address}</p>
                                            <h5><span className="chat_date">{contact.lastActivity}</span></h5>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mesgs">
                    <div className="msg_history">
                        { messages.map((message,index) =>(
                            ((message.from === account)&&(message.to === contacts[selectedContactIndex].address)) ?
                                <div className="outgoing_msg" key={index}>
                                    <div className="sent_msg">
                                        <p>{message.message}</p>
                                        <span className="time_date">{message.beautyTime}</span> 
                                    </div>
                                </div>
                            : ((message.to === account)&&(message.from === contacts[selectedContactIndex].address))?
                                <div className="incoming_msg" key={index}>
                                    <div className="incoming_msg_img"> <img src={userProfilePic} alt={contacts.name} /> </div>
                                    <div className="received_msg">
                                        <div className="received_withd_msg">
                                            <p>{message.message}</p>
                                            <span className="time_date">{message.beautyTime}</span>
                                        </div>
                                    </div>
                                </div>
                            :<div key={index}></div>
                        ))}

                    </div>
                    <div className="type_msg">
                        <div className="input_msg_write">
                            <input type="text" value = {this.state.inputValue} className="write_msg" placeholder="Type a message" onChange={this.onChangeHandler} maxLength="32"/>
                            <button className="msg_send_btn" type="button" onClick={()=>this.sendMessage()}><i className="fa fa-paper-plane-o" aria-hidden="true"></i></button>
                        </div>
                    </div>
                    </div>
                </div>
                               
                </div></div>
            }
            </div>

        );
    }
}
 
export default ChatBox;