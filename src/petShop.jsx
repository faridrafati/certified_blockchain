import React, { Component } from 'react';
import pets from './components/pets.json';
import Web3 from 'web3/dist/web3.min';
import {PET_CONTRACT_ABI,PET_CONTRACT_ADDRESS} from './components/petConfig';

class PetShop extends Component {
    state = {
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        account:'',
        petContract:[],
        isMetaMask:'',
        adopters:[],
        zeroAddress:'0x0000000000000000000000000000000000000000'
    }

    componentDidMount() {
        this.tokenContractHandler();
        console.log('hello');
    }
    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract();
        this.getAllAdopters();
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
        let petContract = new web3.eth.Contract(PET_CONTRACT_ABI,PET_CONTRACT_ADDRESS);
        let isMetaMask = await web3.currentProvider.isMetaMask;
        this.setState({isMetaMask,petContract});
    }

    getAllAdopters =async() => {
        let {petContract,account} = this.state;
        let adopters = await petContract.methods.getAdoptors().call({from: account});
        this.setState({adopters});
    }

    Adopt = async (index) => {
        let {petContract,account} = this.state;

        
        await petContract.methods.adopt(index).send({from: (account), gas: '1000000'},(error) => {
            if(!error){
                console.log('pet has been adopted');
            }else{
              console.log("err-->"+error);
            }  
        });
        await this.getAllAdopters();
    }


    render() {
        let {zeroAddress, adopters,account} = this.state;
        const loadedData = JSON.stringify(pets);
        const data = JSON.parse(loadedData);


        return (
            <div className="container">
                <section className="bg-light text-center">
                    <h1>Pet Adoption</h1>
                    <p className='lead text-muted'>Your Address is: {this.state.account}</p>
                </section>
                <div className="row">
                    {data.map((d,index)=>(
                        <div key={index} className="card"  style={{"width": "19rem","margin": "8px", 'border' : 'secondary', 'textAlign':'left'}}>
                            <div className="card-header" style={{'textAlign':'center'}}>
                                <h5><b>{d.name}</b></h5>
                            </div>
                            <img src={require('./components/'+d.picture)} className="card-img-top" alt={"./"+d.picture} />
                            <div className="card-body">
                                <p className="card-text"><b>Breed: </b>{d.breed}</p>
                                <p className="card-text"><b>Age: </b>Age: {d.age} Yrs</p>
                                <p className="card-text"><b>Location: </b>{d.location} Yrs</p>
                                <button 
                                    className={"btn btn-"+(adopters[index] ===  zeroAddress? 'primary' : (account === adopters[index] ? 'success' : 'secondary') )} 
                                    onClick={()=>this.Adopt(index)}
                                    disabled = {adopters[index] !==  zeroAddress}>
                                        {adopters[index] ===  zeroAddress ? 'Adopt' : (account === adopters[index] ? 'Owned' : 'Adopted')}
                                    </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        );
    }
}
 
export default PetShop;