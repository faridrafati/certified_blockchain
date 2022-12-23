import React, { Component } from 'react';
import Web3 from 'web3/dist/web3.min';
import 'bootstrap/dist/css/bootstrap.min.css';
import {WEIGHTED_VOTING_TOKEN_ABI,WEIGHTED_VOTING_TOKEN_ADDRESS} from './components/WeightedVotingConfig';

class WeightedVoting extends Component {  
    state = {
        candidatesList:[
            {name:'',voteCount:''},
            {name:'',voteCount:''},
            {name:'',voteCount:''},
        ],
        accountBid:'',
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        WeightedVotingContract:[],
        isMetaMask:'', 
        input:"",
        account:"",
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

    getCandidatesList = async () => {
        let {candidatesList,WeightedVotingContract} = this.state;
        let list= await WeightedVotingContract.methods.getAllCandidatesWithVotes().call();
        for (let i=0 ; i<3 ; i++){
            candidatesList[i].name=list[2*i];
            candidatesList[i].voteCount=list[2*i+1];
        }
       return candidatesList;
    }

    initContract = async () => {
        let {web3,owner,candidatesList} = this.state;
        let WeightedVotingContract = new web3.eth.Contract(WEIGHTED_VOTING_TOKEN_ABI,WEIGHTED_VOTING_TOKEN_ADDRESS);
        let isMetaMask = await web3.currentProvider.isMetaMask;
        let list= await WeightedVotingContract.methods.getAllCandidatesWithVotes().call();
        for (let i=0 ; i<3 ; i++){
            candidatesList[i].name=list[2*i];
            candidatesList[i].voteCount=list[2*i+1];
        }
        owner= await WeightedVotingContract.methods.owner().call();
        this.setState({owner,isMetaMask, candidatesList,WeightedVotingContract});
    }


    authorizeVoter = async (e) => {
        e.preventDefault();
        let {account,input,WeightedVotingContract} = this.state;
        await WeightedVotingContract.methods.authorizeVoter(input).send({from: (account), gas: '1000000'},(error) => {
            if(error){
                console.log("err-->"+error);
            }
        });
    }

    voteForCandidate = async(index) => {
        let {account,WeightedVotingContract} = this.state;
        await WeightedVotingContract.methods.voteForCandidate(index).send({from: (account), gas: '1000000'},(error) => {
            if(error){
                console.log("err-->"+error);
            }
        });
    }

    inputHandler = (e) => {
        let input = this.state.input;
        input = e.currentTarget.value;
        this.setState({input});
    }


    render() { 
        let {candidatesList,owner,network,account,input} = this.state;
        return (
            <div className='container'>
                <div className="row">
                    <div className="col-xs-12 col-sm-12">
                        <h1 className="textCenter">Voting contract</h1>
                        <h6 className="badge bg-primary">Your Network is {network}</h6>
                        <hr />
                        <br />
                    </div>
                </div>
                <div id="accountId">Your Address is {account} {(owner === account)? 'and You are contract Owner':''} </div>
                <hr />
                {(owner === account)?<div className="container">

                    <div id="votersRow" className="row">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Candidate Names</th>
                                    <th scope="col">Votes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                candidatesList.map((candidate,index)=>(
                                    <tr key={index}>
                                        <th scope="row">{index}</th>
                                        <td>{candidate['name']}</td>
                                        <td>{candidate['voteCount']}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="form-authorize">
                        <label htmlFor="usr">Authorized Voter Address:</label>
                        <input type="text" className="form-control" id="address" value={input} onChange = {this.inputHandler} style={{marginBottom:'10px'}}/>
                        <button type="button" className="btn btn-primary" onClick={this.authorizeVoter} >Authorize</button>
                    </div>
                </div>:


                <div id="votingTemplate">
                    <table className="table">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Candidate Names</th>
                                <th scope="col">Votes</th>
                                <th scope="col">Vote</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            candidatesList.map((candidate,index)=>(
                                <tr key={index}>
                                    <th scope="row">{index}</th>
                                    <td>{candidate['name']}</td>
                                    <td>{candidate['voteCount']}</td>
                                    <td><button className='btn btn-primary' onClick={()=>this.voteForCandidate(index)}>VOTE</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>
            
        );
    }
}
 
export default WeightedVoting;