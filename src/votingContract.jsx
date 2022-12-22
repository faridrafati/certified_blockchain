import React, { Component } from 'react';
import Web3 from 'web3/dist/web3.min';
import {VOTING_CONTRACT_ABI,VOTING_CONTRACT_ADDRESS} from './components/Voting_Config';

class VotingContract extends Component {
    state = {
        account:'',
        network:'',
        button: 1,
        numberC: 0,
        candidates:[{
            address:'',
            votes:''
        }],
        votingContract:'',
        data:''
      };
    
    onSubmit = e => {
        e.preventDefault();
        if (this.state.button === 'Vote') {
            this.voteForCandidate(this.state.candidates[0].address);
        }
        if (this.state.button === 'AddCandidate') {
          this.addCandidate('0x7b46fb5fd9D759AD5e2Cb59f4956Bb99c6D225Dd');
        }
    };


    voteForCandidate = async() => {
        let address = this.state.data['voteFor'];
        let votingContract = this.state.votingContract;
        await votingContract.methods.voteForCandidate(address).send({from: (this.state.account), gas: '1000000'},(error,result) => {
          if(!error){
            console.log("it worked voteForCandidate: " +result);
          }else{
            console.log("err-->"+error);
          }
      
        });
        console.log('voteForCandidate');
        this.refreshPage();
    }
      

    addCandidate = async() => {
        let address = this.state.data['addCandidate'];
        let votingContract = this.state.votingContract;
        await votingContract.methods.addCandidate(address).send({from: (this.state.account), gas: '1000000'},(error,result) => {
          if(!error){
            console.log("it worked voteForCandidate: " +result);
          }else{
            console.log("err-->"+error);
          }
      
        });
        console.log('voteForCandidate');
        this.refreshPage();
      }



    votingContractHandler = async () => {

        const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
        const network = await web3.eth.net.getNetworkType();
        const accounts = await web3.eth.getAccounts();
        this.setState({account: accounts[0],network});
        const votingContract = new web3.eth.Contract(VOTING_CONTRACT_ABI,VOTING_CONTRACT_ADDRESS);
        this.setState({votingContract});
        const numberC = parseInt(await votingContract.methods.numberOfCandidates().call());



        let candidates = this.state.candidates;
        let candidateList = [];
        for (var i=0; i<numberC; i++) {

            let address = await votingContract.methods.Candidates(i).call();  // Retrieve address of each candidate
            let votes = await votingContract.methods.VotesForCandidate(address).call(); // Retrieve votes of candidate
            candidates[i]={address : address.toString() , votes : votes.toString()};
        }
        this.setState({candidateList,candidates,numberC});
    }


    componentDidMount = () => {
        this.votingContractHandler();
    }

    handleChange = ({ currentTarget: input }) => {
        const data = { ...this.state.data };
        data[input.name] = input.value;
        this.setState({ data });
    };
    refreshPage = () => { 
        window.location.reload(); 
    }

    render() {
        return (
            <div className="container">
                <h1>Voting Contract</h1>
                <p>Your Address is {this.state.account} on {this.state.network} Chain</p>
                <div >
                    <h2>Candidates</h2>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th scope="col">Address</th>
                                <th scope="col">Votes</th>
                            </tr>
                        </thead>

                        <tbody id="tableBody_Candidates">


                        {
                            this.state.candidates.map((cd,index)=>(
                                <tr key={index}>
                                    <td>{cd['address']}</td>
                                    <td>{cd['votes']}</td>
                                </tr>
                            ))}
                        </tbody>

                        <tbody id="votersList">

                        </tbody>
                    </table>
                </div>
                <form onSubmit={this.onSubmit}>
                    <div className="row g-3 align-items-center mb-3">
                        <div className="col-auto">
                            <label 
                                htmlFor="voteFor" 
                                className="col-form-label">
                                    Vote For
                            </label>
                        </div>
                        <div className="col-auto">
                            <input 
                                type="text" 
                                id="voteFor"
                                name="voteFor"
                                className="form-control"
                                value={this.state.data['voteFor']}
                                onChange={this.handleChange} 
                            />
                        </div>
                        <div className="col-auto">
                            <button 
                                id="voteFor" 
                                className="btn btn-primary"
                                onClick={() => (this.setState({button : 'Vote'}))}
                                type="submit"
                                name="voteFor"
                            >
                                Vote
                            </button>
                        </div>
                    </div>
                    
                    <div className="row g-3 align-items-center mb-3">
                        <div className="col-auto">
                            <label 
                                htmlFor="addCandidate" 
                                className="col-form-label">
                                    Add Candidate
                            </label>
                        </div>
                        <div className="col-auto">
                            <input 
                                type="text" 
                                id="addCandidate"
                                name="addCandidate"
                                className="form-control"
                                value={this.state.data['addCandidate']}
                                onChange={this.handleChange} 
                            />
                        </div>
                        <div className="col-auto">
                            <button 
                                id="addCandidate" 
                                className="btn btn-primary"
                                onClick={() => (this.setState({button : 'AddCandidate'}))}
                                type="submit"
                                name="addCandidate"
                            >
                                Add Candidate
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        );
    }
}
 
export default VotingContract;