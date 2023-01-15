import React from 'react';
import Web3 from 'web3/dist/web3.min';
import HideShow from './HideShow';
import resetProvider from './resetProvider';
import { GUESS_CONTRACT_ABI,GUESS_CONTRACT_ADDRESS } from './components/guessing_Config';
import "font-awesome/css/font-awesome.css";

class GuessingGame extends resetProvider {
    state = {
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        account:'',
        Contract:[],
        isMetaMask:'',
        owner:'',
        player:{
            wins:0,
            losses:0
        },
        zeroAddress:'0x0000000000000000000000000000000000000000',
        buttonEnabled: {checking: false, inputting: false},
        guess: false,
        amount: 0,
        winOrLose:[]
    }

    componentDidMount() {
        this.checkMetamask();
        this.tokenContractHandler();
    }

    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract(GUESS_CONTRACT_ABI, GUESS_CONTRACT_ADDRESS);
        this.getPlayersData();
    }

    getPlayersData = async () => {
        let {Contract,account} = this.state;
        let buttonEnabled = this.state.buttonEnabled;
        let player = await Contract.methods.players(account).call();
        this.setState({player});
        buttonEnabled.checking=false;
        buttonEnabled.inputting=false;
        this.setState({amount : 0,buttonEnabled});
        await this.getEvents('PlayerWon');
        await this.getEvents('PlayerLost');
    }

    getEvents = async (eventName) => {
        let {web3,Contract} = this.state;
        let latest_block = await web3.eth.getBlockNumber();
        let historical_block = latest_block - 10000; // you can also change the value to 'latest' if you have a upgraded rpc
        console.log("latest: ", latest_block, "historical block: ", historical_block);
        const events = await Contract.getPastEvents(
            eventName, // change if your looking for a different event
            { fromBlock: historical_block, toBlock: 'latest' }
        );
        await this.getTransferDetails(events);
        let winOrLose = this.state.winOrLose;
        console.log(winOrLose);
    };

    getTransferDetails = async (data_events) => {
        let {web3,account} = this.state;
        let winOrLose='';
        for (let i = 0; i < data_events.length; i++) {
            let mysteryNumber = data_events[i]['returnValues']['mysteryNumber'];
            let player = data_events[i]['returnValues']['player'];
            let amount = data_events[i]['returnValues']['amount'];
            let converted_amount = web3.utils.fromWei(amount);
            if (player === account) { 
                winOrLose= `mysteryNumber: ${mysteryNumber} - player: ${player} - Value (eth): ${converted_amount}`;
            }
            this.setState({ winOrLose: [...this.state.winOrLose, winOrLose] });
        };
    };


    onSubmitGuess = async () => {
        let {Contract,web3,account,amount} = this.state;
        let TxId = '';
        await Contract.methods.winOrLose(5,this.state.guess).send({from: (account), gas: '1000000', value: web3.utils.toWei(amount, "ether")},(error,result) => {
            if(!error){
              TxId = result;
              this.notify('info','Pending Transactions on Ethereum');
            }else{
              this.notify('error',error.message);
            }
        
        });
        this.notify('success','TX is Done: '+TxId);        
    }

    onButtonClick = async (e) => {
        let buttonEnabled = this.state.buttonEnabled;
        buttonEnabled.checking = true;
        this.setState({buttonEnabled});
        if (e.currentTarget['id'] === 'success-outlined') {
            this.setState({guess: true});
        } else if (e.currentTarget['id'] === 'danger-outlined') {
            this.setState({guess: false});
        }
    }

    changeHandler = (e) => {
        let {value} = e.currentTarget;
        let buttonEnabled = this.state.buttonEnabled;
        if ((value ==='')||(value==='.')||(value==='0')){
            buttonEnabled.inputting=false;
        } else {
            buttonEnabled.inputting=true;
        }
        this.setState({amount:value, buttonEnabled});
    } 
    
    render() {
        let {owner,amount,buttonEnabled} = this.state; 
        return (
            <div className="row">
                <section className="bg-light text-center">
                <h1>Guessing Game</h1>
                    <HideShow 
                        currentAccount = {this.state.currentAccount}
                        contractAddress = {GUESS_CONTRACT_ADDRESS}
                        chainId = {this.state.chainId}
                        owner = {owner}
                    />
                </section>
                <div className="row">
                    <div className="col-6 col-md-8 offset-md-2">
                        <div className="card text-center">
                            <div className="card-header">
                                Betting Window
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">Higher or Lower</h5>
                                <p className="card-text">Will the mystery number be higher or lower than 5?</p>
                                
                                <input 
                                    type="radio" 
                                    className="btn-check m-2" 
                                    name="options-outlined" 
                                    id="success-outlined" 
                                    autoComplete="off" 
                                    onClick={this.onButtonClick}
                                />
                                <label 
                                    className="btn btn-outline-success m-2" 
                                    htmlFor="success-outlined">
                                        Higher
                                </label>

                                <input 
                                    type="radio" 
                                    className="btn-check m-2" 
                                    name="options-outlined" 
                                    id="danger-outlined" 
                                    autoComplete="off" 
                                    onClick={this.onButtonClick}
                                />
                                <label 
                                    className="btn btn-outline-danger m-2"
                                    htmlFor="danger-outlined">
                                        Lower
                                </label>
 
 
                                <div className="input-group mb-3">
                                   <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Ether</span>
                                    </div>
                                    <input type="number" value={amount} className="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" onChange={this.changeHandler}/> 
                                </div>
                                <button className="btn btn-primary" disabled = {!((buttonEnabled.checking)&&(buttonEnabled.inputting))} onClick={this.onSubmitGuess}>Check Your Chance</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
 
export default GuessingGame;