import React, { Component } from 'react';
import Web3 from 'web3/dist/web3.min';
import PollForm from './pollForm';
import CardList from './list';
import Details from './details';
import Chart from 'react-apexcharts';
import {POLL_CONTRACT_ABI,POLL_CONTRACT_ADDRESS} from './components/pollConfig';
  
class BlockchainPoll extends Component {
  
    state = {
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        account:'',
        pollContract:[],
        isMetaMask:'',

        Voter: {
            id:'',
            voted:[]
        },

        Polls: [
            {
              id:'',
              question: "",
              image: "",
              votes: [],
              items: [],
            }
        ],

        selectedPoll:  {
            question: "",
            image: "",
            votes: [0,0,0],
            items: ["","",""],
        },

        pollOrNot : false,
            
        options: {
            chart: {
                id: 'apexchart-example'
            },
            xaxis: 
            {
                categories: ['Option #1','Option #2','Option #3']
            },
            plotOptions : {
                bar: {
                    distributed: true
                }
            },
        },

        series: [{
            name: 'series-1',
            type: 'column',
            data: [0,0,0]
        }],
    }

    componentDidMount() {
        this.tokenContractHandler();
    }
    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract();
        await this.getAllPolls();
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
        let pollContract = new web3.eth.Contract(POLL_CONTRACT_ABI,POLL_CONTRACT_ADDRESS);
        let isMetaMask = await web3.currentProvider.isMetaMask;
        this.setState({isMetaMask,pollContract});
    }

    getAllPolls = async () => {
        let {pollContract,account} = this.state;
        let Polls = this.state.Polls;
        let numberOfPolls = await pollContract.methods.getTotalPolls().call();
        for(let i=0; i< numberOfPolls; i++){
            let _poll = await pollContract.methods.getPoll(i).call();
            Polls[i] =   {            
                id:_poll[0],
                question: _poll[1],
                image: _poll[2],
                votes: _poll[3],
                items: _poll[4],
                voted: false
            }
        }
        let votedList = await pollContract.methods.getVoter(account).call();
        let result = votedList[1].map(i=>Number(i));
        let length = result.length;
        for (let i=0; i< length; i++) {
            Polls[result[i]].voted = true;
        }
        this.setState(Polls);
    }


    submitCreatePollHandler = async (createdPoll) => {
        let {pollContract,account} = this.state;
        await pollContract.methods.createPoll(createdPoll.question,createdPoll.image,[createdPoll.option1,createdPoll.option2,createdPoll.option3]).send({from: (account), gas: '1000000'},(error) => {
            if(!error){
                console.log('poll has been added');
            }else{
              console.log("err-->"+error);
            }
            this.setState({pollOrNot:false});
        });
        await this.getAllPolls();
    }

    onClickCard = (selectedPoll) => {
        this.setState({selectedPoll});
        this.refreshChart(selectedPoll);
    }
    
    refreshChart = (selectedPoll) => {
        const newSeries = [];
        var i=0;
        this.state.series.forEach((s) => {
            const data = s.data.map(() => {
                i++;
                return selectedPoll.votes[i-1];
            })
            newSeries.push({ data: data })
        })        
        this.setState({
            series: newSeries,
        }) 

        
        this.setState({
            options : {
                ...this.state.options,
                chart: {
                    ...this.state.chart,
                    id: selectedPoll.items
                },
                ...this.state.options,
                xaxis: {
                    ...this.state.xaxis,
                    categories: selectedPoll.items
                }
            }
        });
    }

    submitVote =  async (e,selectedItem) => {
        e.preventDefault();
        let selectedPoll = this.state.selectedPoll;
        let selectedIndex = selectedPoll.items.indexOf(selectedItem);
        await this.state.pollContract.methods.vote(selectedPoll.id,selectedIndex).send({from: (this.state.account), gas: '1000000'},(error) => {
            if(!error){
                console.log('vote is done');
                selectedPoll.voted = true;
            }else{
              console.log("err-->"+error);
            }  
        });
        selectedPoll.votes = selectedPoll.votes.map(i=>Number(i));
        selectedPoll.votes[selectedIndex] ++;

        let Polls = this.state.Polls;
        let index = Polls.indexOf(selectedPoll);
        Polls[index] = selectedPoll;
        this.setState({Polls});
        this.setState({selectedPoll});
        this.refreshChart(selectedPoll);
    }
    
    render() { 
        let {Polls,options,series} = this.state;
        return (
            <div>
                <nav className="navbar navbar-light bg-light">
                    <a className='navbar-brand mr-auto' href='https://www.certifiedBlockchain.ir'>Blockchain Polls</a>
                    <button className='btn btn-secondary' onClick={() => this.setState({pollOrNot: !(this.state.pollOrNot)})}>Create Poll</button>
                </nav>
                
                <section className="bg-light text-center">
                    <h1>Polls Rethink</h1>
                    <p className='lead text-muted'>Your Address is {this.state.account}</p>
                </section>
                {this.state.pollOrNot &&                 
                    <div className='col-sm-4 container'>
                        <PollForm submitCreatePollHandler = {this.submitCreatePollHandler}/>
                    </div>
                }

                {!this.state.pollOrNot &&    
                    <div className='d-flex'>
                        <div className='container pollList' style={{maxWidth:'400px',textAlign:'left'}}>
                            {Polls.map((Poll,index)=>(<CardList key={index} poll={Poll} onClick={() => this.onClickCard(Poll)}/>))}
                        </div>

                        <div className='container pollDetail' style={{textAlign:'left'}}>
                            <Details 
                                selectedPoll={this.state.selectedPoll} 
                                submitVote={this.submitVote} 
                                selectedRadio={this.state.selectedRadio}
                            />
                            {options.xaxis.categories[0] !== 'Option #1' ? <Chart 
                                options={options} 
                                series={series} 
                                type="bar" 
                                width={500} 
                                height={320} 
                            />:""}
                        </div>
                    </div>
                }
            </div>
        );
    }
}
 
export default BlockchainPoll;